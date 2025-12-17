import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Memoized remark plugins array to prevent re-creation
const remarkPlugins = [remarkGfm];

// Memoized individual message component to prevent re-renders
const MessageItem = memo(({ message }) => {
  // Memoize timestamp formatting
  const formattedTimestamp = useMemo(() => {
    if (!message.timestamp) return '';
    return typeof message.timestamp === 'string' 
      ? new Date(message.timestamp).toLocaleTimeString()
      : message.timestamp.toLocaleTimeString();
  }, [message.timestamp]);

  return (
    <div className={`message ${message.role}`}>
      <div className="message-content markdown-content">
        <ReactMarkdown remarkPlugins={remarkPlugins}>{message.content}</ReactMarkdown>
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
        {formattedTimestamp}
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Memoized loading indicator
const LoadingIndicator = memo(() => (
  <div className="message assistant">
    <div className="message-content">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

const ChatWindow = memo(({ messages, isLoading, loanStatus, messagesEndRef }) => {
  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';

export default ChatWindow;