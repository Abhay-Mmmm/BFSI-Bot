import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatWindow = ({ messages, isLoading, loanStatus, messagesEndRef }) => {
  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role}`}
          >
            <div className="message-content markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              {message.verification_display && (
                <div className="verification-card">
                  <div className="verification-header">
                    <span>✅</span> {message.verification_display.title}
                  </div>
                  <div className="verification-body">
                    {message.verification_display.items.map((item, idx) => (
                      <div key={idx} className="verification-item">
                        <span className="verification-label">
                          {item.icon} {item.label}
                        </span>
                        <span className="verification-value">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {message.stage && (
                <div className="message-stage">
                  Stage: {message.stage}
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {message.timestamp ? (
                typeof message.timestamp === 'string' 
                  ? new Date(message.timestamp).toLocaleTimeString()
                  : message.timestamp.toLocaleTimeString()
              ) : ''}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;