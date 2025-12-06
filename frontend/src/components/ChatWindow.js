import React from 'react';

const ChatWindow = ({ messages, isLoading, loanStatus }) => {
  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role}`}
          >
            <div className="message-content">
              {message.content}
              {message.stage && (
                <div className="message-stage">
                  Stage: {message.stage}
                </div>
              )}
            </div>
            <div className="message-timestamp">
              {message.timestamp ? message.timestamp.toLocaleTimeString() : ''}
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
      </div>
    </div>
  );
};

export default ChatWindow;