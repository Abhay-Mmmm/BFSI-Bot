import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import '../App.css';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import LoanStatus from './LoanStatus';
import DocumentUpload from './DocumentUpload';
import EMIChart from './EMIChart';
import SanctionLetter from './SanctionLetter';

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
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isInitialMount = useRef(true);

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
      localStorage.removeItem('currentConversation');
      
      // Then start new conversation with increased timeout
      console.log('Calling /conversation/start...');
      const response = await axios.post('http://localhost:8000/conversation/start', {}, {
        timeout: 60000 // 60 second timeout
      });
      console.log('Got response from /conversation/start:', response.data);
      console.log('Got conversation ID:', response.data.conversation_id);
      setConversationId(response.data.conversation_id);
      
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
      console.log('New conversation started successfully!');
    } catch (error) {
      console.error('Error starting conversation:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
    }
  }, []);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedConversation = localStorage.getItem('currentConversation');
    if (savedConversation) {
      const conversation = JSON.parse(savedConversation);
      setConversationId(conversation.conversationId);
      // Convert timestamp strings back to Date objects
      const messagesWithDates = (conversation.messages || []).map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      setMessages(messagesWithDates);
      setDocuments(conversation.documents || []);
      setLoanStatus(conversation.loanStatus || null);
      setEmiData(conversation.emiData || null);
    } else if (isInitialMount.current) {
      // Start new conversation with greeting only on initial mount
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
        signal: abortControllerRef.current.signal
      });

      console.log('📦 Full response from backend:', response.data);
      console.log('🔍 auto_progress:', response.data.auto_progress);
      console.log('⏰ auto_progress_delay:', response.data.auto_progress_delay);
      console.log('📄 Current sanctionLetter state:', sanctionLetter);

      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        stage: response.data.stage,
        actions: response.data.actions,
        verification_display: response.data.verification_display
      };

      setMessages(prev => [...prev, botMessage]);

      // Show suggestions if provided by backend
      if (response.data.suggestions && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }

      // Update loan status if available
      if (response.data.loan_application) {
        setLoanStatus(response.data.loan_application);
      }

      // Don't disable input - let user ask questions after closure

      // Update EMI data if available
      if (response.data.loan_application?.emi_amount && response.data.loan_application?.loan_amount) {
        const emi = response.data.loan_application.emi_amount;
        const loanAmount = response.data.loan_application.loan_amount;
        const tenure = response.data.loan_application.tenure_months || 60;

        // Generate EMI data for chart
        const emiChartData = Array.from({ length: Math.min(tenure, 12) }, (_, i) => ({
          month: i + 1,
          emi: emi,
          principal: loanAmount / tenure,
          interest: emi - (loanAmount / tenure)
        }));

        setEmiData(emiChartData);
      }

      // Handle auto-progression with delay
      if (response.data.auto_progress && response.data.auto_progress_delay) {
        const delay = response.data.auto_progress_delay * 1000; // Convert to ms
        console.log(`🔄 AUTO-PROGRESS DETECTED`);
        console.log(`⏳ Will auto-progress in ${response.data.auto_progress_delay} seconds...`);
        
        setTimeout(async () => {
          console.log(`📤 Sending [AUTO_CONTINUE] to backend...`);
          // Send a continuation signal to backend
          try {
            const progressResponse = await axios.post('http://localhost:8000/conversation/query', {
              query: '[AUTO_CONTINUE]',
              conversation_id: conversationId,
            });

            console.log(`✅ Auto-progress response received:`, progressResponse.data);

            const autoMessage = {
              id: Date.now() + 2,
              role: 'assistant',
              content: progressResponse.data.response,
              timestamp: new Date(),
              stage: progressResponse.data.stage,
              actions: progressResponse.data.actions,
              verification_display: progressResponse.data.verification_display
            };

            setMessages(prev => [...prev, autoMessage]);

            // Update loan status from auto-progression
            if (progressResponse.data.loan_application) {
              setLoanStatus(progressResponse.data.loan_application);
            }
          } catch (error) {
            console.error('❌ Error in auto-progression:', error);
          }
        }, delay);
      }

      // Handle sanction letter generation
      console.log('🔍 Checking sanction letter flags:', {
        show_button: response.data.show_sanction_letter_button,
        ready: response.data.sanction_letter_ready,
        loan_app: response.data.loan_application,
        stage: response.data.stage
      });
      
      // Check if sanction letter should be shown (at sanction stage or if flags are set)
      const shouldShowSanction = response.data.show_sanction_letter_button || 
                                 response.data.sanction_letter_ready ||
                                 (response.data.stage === 'verification' && response.data.loan_application?.sanction_complete);
      
      if (shouldShowSanction && response.data.loan_application) {
        console.log('✅ Setting sanction letter state');
        // Generate sanction letter with actual loan data
        const loanData = response.data.loan_application;
        const newSanctionLetter = {
          customerName: 'Applicant',
          loanAmount: `₹${(loanData.loan_amount || 0).toLocaleString('en-IN')}`,
          interestRate: `${loanData.interest_rate || 10.5}%`,
          emi: `₹${(loanData.emi_amount || 0).toLocaleString('en-IN')}`,
          tenure: `${loanData.tenure_months || 60} months`,
          downloadUrl: '#'
        };
        console.log('📄 New sanction letter:', newSanctionLetter);
        setSanctionLetter(newSanctionLetter);
      }

    } catch (error) {
      // Don't show error if request was aborted intentionally
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        console.log('Request aborted by user');
        return;
      }
      
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDocumentUpload = (document) => {
    setDocuments(prev => [...prev, document]);
    // Notify user that document was uploaded
    const docMessage = {
      id: Date.now(),
      role: 'assistant',
      content: `✅ Document "${document.name}" uploaded successfully! I can now review this document for your loan application.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, docMessage]);
  };

  return (
    <div className="app-container">
      <Sidebar onNewChat={startNewConversation} />
      <div className="main-content">
        <div className="chat-container">
          <div className="chat-header" style={{ padding: '10px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Loan Application Chat</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowUpload(!showUpload)}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#00bfa5', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📎 Upload Documents
              </button>
              <button 
                onClick={startNewConversation}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: '#546e7a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ➕ New Chat
              </button>
              {sanctionLetter && (
                <button 
                  onClick={() => setShowSanctionModal(true)}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#4caf50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📄 View Sanction Letter
                </button>
              )}
            </div>
          </div>
          
          {/* Sanction Letter Modal */}
          {showSanctionModal && sanctionLetter && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2 style={{ color: '#00bfa5', marginBottom: '10px' }}>PRIMUM LOAN SERVICES</h2>
                  <h3 style={{ color: '#333', marginBottom: '5px' }}>LOAN SANCTION LETTER</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
                
                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px' }}>
                  <p style={{ marginBottom: '10px' }}><strong>Customer Name:</strong> {sanctionLetter.customerName}</p>
                  <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                  <p style={{ marginBottom: '10px' }}><strong>Sanctioned Loan Amount:</strong> {sanctionLetter.loanAmount}</p>
                  <p style={{ marginBottom: '10px' }}><strong>Interest Rate:</strong> {sanctionLetter.interestRate} per annum</p>
                  <p style={{ marginBottom: '10px' }}><strong>Monthly EMI:</strong> {sanctionLetter.emi}</p>
                  <p style={{ marginBottom: '10px' }}><strong>Loan Tenure:</strong> {sanctionLetter.tenure}</p>
                </div>
                
                <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '4px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    <strong>Terms & Conditions:</strong><br/>
                    • This sanction is valid for 30 days from the date of issue<br/>
                    • Please submit required documents within 7 working days<br/>
                    • Processing fee: 2% of loan amount<br/>
                    • Interest rate is subject to change as per RBI guidelines<br/>
                    • Foreclosure allowed after 6 months with 2% penalty
                  </p>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                  <button
                    onClick={() => {
                      // Generate PDF download
                      const content = `
PRIMUM LOAN SERVICES
LOAN SANCTION LETTER

Date: ${new Date().toLocaleDateString('en-IN')}

Customer: ${sanctionLetter.customerName}
Loan Amount: ${sanctionLetter.loanAmount}
Interest Rate: ${sanctionLetter.interestRate}
Monthly EMI: ${sanctionLetter.emi}
Tenure: ${sanctionLetter.tenure}

Your loan has been sanctioned!
                      `.trim();
                      
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'Sanction_Letter.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{
                      padding: '10px 30px',
                      backgroundColor: '#00bfa5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px',
                      fontSize: '16px'
                    }}
                  >
                    📥 Download Letter
                  </button>
                  <button
                    onClick={() => setShowSanctionModal(false)}
                    style={{
                      padding: '10px 30px',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            loanStatus={loanStatus}
            messagesEndRef={messagesEndRef}
          />
          <div className="input-area">
            {suggestions.length > 0 && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px', 
                marginBottom: '10px',
                border: '1px solid #ddd'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>💡 Did you mean:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fff',
                        border: '1px solid #00bfa5',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#00bfa5',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#00bfa5';
                        e.target.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff';
                        e.target.style.color = '#00bfa5';
                      }}
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
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows="3"
              disabled={isLoading}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              {isLoading ? (
                <button
                  onClick={stopGeneration}
                  className="send-button"
                  style={{ backgroundColor: '#ff5252', flex: 1 }}
                >
                  ⏹ Stop
                </button>
              ) : (
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="send-button"
                  style={{ flex: 1 }}
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel for Dynamic Content */}
        {(showUpload || loanStatus || documents.length > 0 || emiData || sanctionLetter) && (
          <div className="info-panel">
            {showUpload && (
              <div style={{ marginBottom: '20px' }}>
                <h4>Upload Documents</h4>
                <DocumentUpload documents={documents} onUpload={handleDocumentUpload} conversationId={conversationId} />
              </div>
            )}
            {loanStatus && loanStatus.loan_amount && loanStatus.salary && loanStatus.employment_status && loanStatus.city && (
              <LoanStatus status={loanStatus} />
            )}
            {emiData && <EMIChart data={emiData} />}
            {sanctionLetter && <SanctionLetter data={sanctionLetter} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;