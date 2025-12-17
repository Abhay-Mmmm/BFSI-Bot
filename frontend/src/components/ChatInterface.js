import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import '../App.css';
import './DarkTheme.css';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import LoanStatus from './LoanStatus';
import DocumentUpload from './DocumentUpload';
import eventBus, { EVENT_TYPES } from '../services/eventBus';

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const ChatInterface = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loanStatus, setLoanStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [emiData, setEmiData] = useState(null);
  const [sanctionLetter, setSanctionLetter] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [clientName, setClientName] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isInitialMount = useRef(true);
  const clientNameRef = useRef(clientName);

  // Keep clientNameRef updated
  useEffect(() => {
    clientNameRef.current = clientName;
  }, [clientName]);

  const startNewConversation = useCallback(async () => {
    console.log('New Chat button clicked!');
    try {
      console.log('Starting new conversation...');

      // Clear everything first
      setMessages([]);
      setDocuments([]);
      setLoanStatus(null);
      setEmiData(null);
      setSanctionLetter(null);
      setSuggestions([]);
      setClientName(null); // Reset client name
      localStorage.removeItem('currentConversation');

      // Then start new conversation with increased timeout
      console.log('Calling /conversation/start...');
      const response = await axios.post('http://localhost:8000/conversation/start', {}, {
        timeout: 60000 // 60 second timeout
      });
      console.log('Got response from /conversation/start:', response.data);
      console.log('Got conversation ID:', response.data.conversation_id);
      setConversationId(response.data.conversation_id);
      
      // Emit conversation started event for real-time sync
      eventBus.emit(EVENT_TYPES.CHAT_CONVERSATION_STARTED, {
        conversationId: response.data.conversation_id,
        timestamp: new Date().toISOString()
      });

      // If we have a name, emit it too
      if (clientNameRef.current) {
        eventBus.emit(EVENT_TYPES.CLIENT_NAME_UPDATED, {
          name: clientNameRef.current,
          conversationId: response.data.conversation_id,
          timestamp: new Date().toISOString()
        });
      }
      
      // Get initial greeting from backend
      console.log('Calling /conversation/query with hello...');
      const greetingResponse = await axios.post('http://localhost:8000/conversation/query', {
        query: 'hello',
        conversation_id: response.data.conversation_id
      }, {
        timeout: 60000 // 60 second timeout
      });
      console.log('Got greeting response:', greetingResponse.data);
      
      const greetingMessage = {
        id: 1,
        role: 'assistant',
        content: greetingResponse.data.response,
        timestamp: new Date()
      };
      console.log('Setting greeting message:', greetingMessage);
      setMessages([greetingMessage]);
      
      // Emit greeting received event for real-time sync
      eventBus.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, {
        text: greetingResponse.data.response,
        conversationId: response.data.conversation_id,
        timestamp: new Date().toISOString()
      });
      
      console.log('New conversation started successfully!');
    } catch (error) {
      console.error('Error starting conversation:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
    }
  }, []);

  // Start fresh conversation on every page load
  useEffect(() => {
    // Clear any saved conversation
    localStorage.removeItem('currentConversation');
    
    // Start new conversation on mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      startNewConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const conversation = {
        conversationId,
        messages,
        documents,
        loanStatus,
        emiData,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('currentConversation', JSON.stringify(conversation));
      // Auto-scroll to bottom after a short delay to ensure DOM update
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [conversationId, messages, documents, loanStatus, emiData]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    
    // Add a message indicating the response was stopped
    const stoppedMessage = {
      id: Date.now(),
      role: 'assistant',
      content: '⚠️ Response stopped. Feel free to ask your question again or rephrase it.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, stoppedMessage]);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setSuggestions([]); // Clear any suggestions
    setIsLoading(true);

    // Try to detect name from message (simple heuristic)
    if (!clientName) {
      const nameRegex = /(?:my name is|i am|i'm|this is) ([a-zA-Z ]{2,30})/i;
      const match = currentInput.match(nameRegex);
      if (match && match[1]) {
        const detectedName = match[1].trim();
        // Avoid capturing common words if the regex is too loose, but for "my name is X" it's usually safe
        if (detectedName.split(' ').length <= 3) {
          setClientName(detectedName);
          eventBus.emit(EVENT_TYPES.CLIENT_NAME_UPDATED, {
            name: detectedName,
            conversationId: conversationId,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Emit user message sent event for real-time sync
    eventBus.emit(EVENT_TYPES.CHAT_MESSAGE_SENT, {
      text: currentInput,
      conversationId: conversationId,
      clientName: clientName,
      timestamp: new Date().toISOString()
    });
    
    // Refocus input field after a brief delay
    setTimeout(() => inputRef.current?.focus(), 100);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Include uploaded documents in the request
      const requestData = {
        query: currentInput,
        conversation_id: conversationId,
      };
      
      // Add document information if available
      if (documents.length > 0) {
        requestData.uploaded_documents = documents.map(doc => ({
          id: doc.id,
          filename: doc.name,
          type: doc.type,
          url: doc.downloadUrl
        }));
      }
      
      const response = await axios.post('http://localhost:8000/conversation/query', requestData, {
        signal: abortControllerRef.current.signal,
        timeout: 120000 // 2 minute timeout
      });
      
      console.log('Response from backend:', response.data);

      // Create assistant message
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      // Check for loan status in response (can come as loan_status or loan_application)
      if (response.data.loan_status) {
        console.log('Setting loan status from loan_status:', response.data.loan_status);
        setLoanStatus(response.data.loan_status);
      } else if (response.data.loan_application && Object.keys(response.data.loan_application).length > 0) {
        // Map loan_application to loan_status format
        const loanApp = response.data.loan_application;
        console.log('Loan application data received:', loanApp);
        if (loanApp.loan_amount || loanApp.salary) {
          const mappedStatus = {
            loan_amount: loanApp.loan_amount,
            salary: loanApp.salary,
            interest_rate: loanApp.interest_rate || 10.5,
            tenure_months: loanApp.tenure_months || 60,
            emi_amount: loanApp.emi_amount,
            decision: loanApp.decision || response.data.stage,
            risk_category: loanApp.risk_category,
            employment_status: loanApp.employment_status,
            city: loanApp.city,
            sanction_complete: loanApp.sanction_complete,
            sanction_letter_generated: loanApp.sanction_letter_generated
          };
          console.log('Setting loan status from loan_application:', mappedStatus);
          setLoanStatus(mappedStatus);
        }
      } else {
        console.log('No loan data in response. Full response:', response.data);
      }

      // Check for EMI data in response
      if (response.data.emi_data) {
        setEmiData(response.data.emi_data);
      }

      // Check for sanction letter in response
      if (response.data.sanction_letter) {
        setSanctionLetter(response.data.sanction_letter);
      }

      // Check for suggestions in response
      if (response.data.suggestions && Array.isArray(response.data.suggestions)) {
        setSuggestions(response.data.suggestions);
      }

      // Check for client name in response (from loan_application or applicant_name)
      if (response.data.loan_application?.applicant_name && !clientName) {
        const name = response.data.loan_application.applicant_name;
        setClientName(name);
        // Emit client name update for real-time sync
        eventBus.emit(EVENT_TYPES.CLIENT_NAME_UPDATED, {
          name: name,
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        });
      }

      console.log('Adding assistant message to chat:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
      
      // Emit assistant message received event for real-time sync
      eventBus.emit(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, {
        text: response.data.response,
        conversationId: conversationId,
        clientName: clientName || response.data.loan_application?.applicant_name,
        timestamp: new Date().toISOString()
      });
      
      // Emit loan status update if available
      if (response.data.loan_status || response.data.loan_application) {
        eventBus.emit(EVENT_TYPES.LOAN_STATUS_UPDATED, {
          status: response.data.loan_status?.decision || response.data.stage,
          conversationId: conversationId,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.name !== 'AbortError') {
        // Add error message to chat
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '❌ Sorry, I encountered an issue processing your request. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Simple inline keypress handler - no useCallback needed since we call handleSendMessage directly
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputValue.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleDocumentUpload = useCallback((document) => {
    setDocuments(prev => [...prev, document]);
    
    // Emit document uploaded event for real-time sync
    eventBus.emit(EVENT_TYPES.CHAT_DOCUMENT_UPLOADED, {
      filename: document.name,
      type: document.type,
      conversationId: conversationId,
      timestamp: new Date().toISOString()
    });
  }, [conversationId]);

  // Memoized textarea height adjustment
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, []);

  // Debounce the textarea height adjustment
  const debouncedInputValue = useDebounce(inputValue, 50);
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [debouncedInputValue, adjustTextareaHeight]);

  // Memoized input change handler
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // Memoized toggle upload handler
  const handleToggleUpload = useCallback(() => {
    setShowUpload(prev => !prev);
  }, []);

  // Focus input on mount and after messages
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [messages, isLoading]);

  // Focus input on conversation start
  useEffect(() => {
    if (conversationId && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [conversationId]);

  return (
    <div className="app-container dark-theme">
      <Sidebar onNewChat={startNewConversation} />
      <div className="main-content-dashboard">
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header d-flex justify-between align-center p-md">
            <div>
              <h3 className="header-3 m-0">Loan Application Chat</h3>
              <p className="caption text-tertiary">AI-powered loan processing assistant</p>
            </div>

            <div className="d-flex gap-md">
              <button
                className={`button ${showUpload ? 'button-primary' : 'button-secondary'}`}
                onClick={handleToggleUpload}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {showUpload ? 'Hide Uploads' : 'Upload Documents'}
              </button>
              <button
                className="button button-secondary d-flex align-center gap-sm"
                onClick={startNewConversation}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                New Chat
              </button>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="chat-main-area d-flex" style={{ height: 'calc(100vh - 180px)' }}>
            {/* Left Chat Panel */}
            <div className="chat-panel flex-1 d-flex flex-column">
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                loanStatus={loanStatus}
                messagesEndRef={messagesEndRef}
              />
              <div className="input-area">
                {suggestions.length > 0 && (
                  <div className="suggestions-container">
                    <div className="suggestions-label">💡 Suggestions:</div>
                    <div className="suggestions-list d-flex flex-wrap gap-sm">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="suggestion-chip"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  rows="1"
                  disabled={isLoading}
                  className="input-field"
                />
                <div className="d-flex">
                  {isLoading ? (
                    <button
                      onClick={stopGeneration}
                      className="button button-danger d-flex align-center gap-sm"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="button button-primary d-flex align-center gap-sm"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Send
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Only visible when there's data */}
            {(showUpload || loanStatus || documents.length > 0) && (
              <div className="info-panel">
                {/* Show Document Upload when toggled */}
                {showUpload && (
                  <div className="mb-lg">
                    <DocumentUpload 
                      documents={documents} 
                      onUpload={handleDocumentUpload} 
                      conversationId={conversationId} 
                    />
                  </div>
                )}
                
                {/* Show Loan Status when available */}
                {loanStatus && (
                  <LoanStatus status={loanStatus} emiData={emiData} />
                )}
                
                {/* Show uploaded documents list */}
                {documents.length > 0 && !showUpload && (
                  <div className="documents-summary">
                    <h4>Uploaded Documents ({documents.length})</h4>
                    <ul>
                      {documents.map((doc, idx) => (
                        <li key={idx}>{doc.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;