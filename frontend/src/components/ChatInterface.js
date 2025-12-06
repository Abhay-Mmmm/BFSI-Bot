import React, { useState, useEffect, useRef } from 'react';
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

  const messagesEndRef = useRef(null);

  // Start new conversation
  useEffect(() => {
    startNewConversation();
  }, []);

  const startNewConversation = async () => {
    try {
      const response = await axios.post('http://localhost:8000/conversation/start');
      setConversationId(response.data.conversation_id);
      setMessages([{
        id: 1,
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant for personal loan applications. How can I help you today?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/conversation/query', {
        query: inputValue,
        conversation_id: conversationId
      });

      const botMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        stage: response.data.stage,
        actions: response.data.actions
      };

      setMessages(prev => [...prev, botMessage]);

      // Update loan status if available
      if (response.data.loan_application) {
        setLoanStatus(response.data.loan_application);
      }

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

      // Handle sanction letter generation
      if (response.data.next_action === 'generate_sanction_letter') {
        // Simulate sanction letter generation
        setTimeout(() => {
          setSanctionLetter({
            customerName: 'John Doe',
            loanAmount: '₹20,00,000',
            interestRate: '10.5%',
            emi: '₹44,320',
            tenure: '60 months',
            downloadUrl: '#'
          });
        }, 1000);
      }

    } catch (error) {
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <div className="chat-container">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            loanStatus={loanStatus}
          />
          <div className="input-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows="3"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="send-button"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        <div className="dashboard">
          <div className="dashboard-section">
            <h3>Loan Status</h3>
            <LoanStatus status={loanStatus} />
          </div>

          <div className="dashboard-section">
            <h3>EMI Calculator</h3>
            {emiData && <EMIChart data={emiData} />}
          </div>

          <div className="dashboard-section">
            <h3>Document Upload</h3>
            <DocumentUpload
              documents={documents}
              onUpload={(doc) => setDocuments([...documents, doc])}
            />
          </div>

          {sanctionLetter && (
            <div className="dashboard-section">
              <h3>Sanction Letter</h3>
              <SanctionLetter letter={sanctionLetter} />
            </div>
          )}
        </div>
      </main>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatInterface;