import React from 'react';

const ChatWindow = ({ messages, isLoading, loanStatus, messagesEndRef }) => {
  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role}`}
          >
            <div className="message-content" style={{ whiteSpace: 'pre-line' }}>
              {message.content}
              {message.verification_display && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: '#e8f5e9',
                  border: '2px solid #4caf50',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2e7d32',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    ✅ {message.verification_display.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {message.verification_display.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '500', color: '#555' }}>
                          {item.icon} {item.label}
                        </span>
                        <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
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