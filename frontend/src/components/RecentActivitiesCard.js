import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import eventBus, { EVENT_TYPES } from '../services/eventBus';

/**
 * RecentActivitiesCard - Real-time Activity Display
 * 
 * Subscribes to EventBus for real-time updates from client chat.
 * Displays a live feed of chat activities in the Sales Agent dashboard.
 * 
 * This is a FRONTEND-ONLY component with no backend dependencies.
 */

// Memoized activity icons - defined outside component to prevent re-creation
const ACTIVITY_ICONS = {
  message_sent: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
    </svg>
  ),
  message_received: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  conversation_started: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  document_uploaded: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  ),
  loan_status: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  default: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  )
};

// Memoized icon styles
const ICON_STYLES = {
  message_sent: { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  message_received: { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  conversation_started: { background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
  document_uploaded: { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  loan_status: { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  default: { background: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' }
};

// Memoized Activity Item component
const ActivityItem = memo(({ activity, formatTime }) => {
  const iconStyle = ICON_STYLES[activity.type] || ICON_STYLES.default;
  const icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
  
  return (
    <div className={`dark-activity-item ${activity.isNew ? 'activity-new' : ''}`}>
      <div className="dark-activity-icon" style={iconStyle}>
        {icon}
      </div>
      <div className="dark-activity-content">
        <p className="dark-activity-text">
          <strong>{activity.text}</strong>
          {activity.detail && (
            <span className="activity-detail"> - {activity.detail}</span>
          )}
        </p>
        <span className="dark-activity-time">{formatTime(activity.timestamp)}</span>
      </div>
    </div>
  );
});

ActivityItem.displayName = 'ActivityItem';

// Empty state component
const EmptyState = memo(() => (
  <div className="activity-empty-state">
    <div className="activity-empty-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <p className="activity-empty-text">No recent activity</p>
    <p className="activity-empty-hint">Client chat activities will appear here in real-time</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Modal empty state component
const ModalEmptyState = memo(() => (
  <div className="activity-modal-empty">
    <div className="activity-empty-icon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </div>
    <p className="activity-modal-empty-text">Nothing here.</p>
    <p className="activity-modal-empty-hint">Activities will appear when clients interact with the chat.</p>
  </div>
));

ModalEmptyState.displayName = 'ModalEmptyState';

// Activities Modal Component
const ActivitiesModal = memo(({ isOpen, onClose, activities, formatTime }) => {
  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="activity-modal-header">
          <h2 className="activity-modal-title">All Recent Activities</h2>
          <button className="activity-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="activity-modal-content">
          {activities.length === 0 ? (
            <ModalEmptyState />
          ) : (
            <div className="activity-modal-list">
              {activities.map((activity) => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity} 
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </div>
        <div className="activity-modal-footer">
          <span className="activity-modal-count">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </span>
          <button className="activity-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

ActivitiesModal.displayName = 'ActivitiesModal';

const RecentActivitiesCard = ({ maxItems = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [currentClientName, setCurrentClientName] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Format timestamp for display - memoized
   */
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }, []);

  /**
   * Add a new activity to the list
   */
  const addActivity = useCallback((activity) => {
    const newActivity = {
      id: activity.id || Date.now() + Math.random(),
      type: activity.type,
      text: activity.text,
      detail: activity.detail,
      timestamp: activity.timestamp || new Date().toISOString(),
      conversationId: activity.conversationId,
      isNew: true
    };

    // Add to all activities (unlimited)
    setAllActivities(prev => [newActivity, ...prev]);

    // Add to displayed activities (limited)
    setActivities(prev => {
      const newActivities = [newActivity, ...prev];
      return newActivities.slice(0, maxItems);
    });

    // Remove "new" flag after animation
    setTimeout(() => {
      setActivities(prev => 
        prev.map(a => ({ ...a, isNew: false }))
      );
      setAllActivities(prev => 
        prev.map(a => ({ ...a, isNew: false }))
      );
    }, 2000);
  }, [maxItems]);

  /**
   * Subscribe to EventBus events
   */
  useEffect(() => {
    // Subscribe to chat message sent
    const unsubSent = eventBus.subscribe(EVENT_TYPES.CHAT_MESSAGE_SENT, (data) => {
      const displayName = data.clientName || currentClientName || 'Client';
      addActivity({
        type: 'message_sent',
        text: `${displayName} sent message`,
        detail: data.text?.substring(0, 50) + (data.text?.length > 50 ? '...' : ''),
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to chat message received
    const unsubReceived = eventBus.subscribe(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, (data) => {
      const displayName = data.clientName || currentClientName || 'client';
      // Update current client name if received
      if (data.clientName && !currentClientName) {
        setCurrentClientName(data.clientName);
      }
      addActivity({
        type: 'message_received',
        text: `AI responded to ${displayName}`,
        detail: data.text?.substring(0, 50) + (data.text?.length > 50 ? '...' : ''),
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to conversation started
    const unsubStarted = eventBus.subscribe(EVENT_TYPES.CHAT_CONVERSATION_STARTED, (data) => {
      // Reset client name for new conversation
      setCurrentClientName(null);
      addActivity({
        type: 'conversation_started',
        text: `New conversation started`,
        detail: `Session ID: ${data.conversationId?.substring(0, 8)}...`,
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to document uploaded
    const unsubDoc = eventBus.subscribe(EVENT_TYPES.CHAT_DOCUMENT_UPLOADED, (data) => {
      const displayName = data.clientName || currentClientName || 'Client';
      addActivity({
        type: 'document_uploaded',
        text: `${displayName} uploaded document`,
        detail: data.filename || 'Document',
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to loan status updates
    const unsubLoan = eventBus.subscribe(EVENT_TYPES.LOAN_STATUS_UPDATED, (data) => {
      const displayName = data.clientName || currentClientName || 'Client';
      addActivity({
        type: 'loan_status',
        text: `${displayName}'s loan status updated`,
        detail: data.status || data.decision || 'Status changed',
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to client name updates
    const unsubName = eventBus.subscribe(EVENT_TYPES.CLIENT_NAME_UPDATED, (data) => {
      if (data.name) {
        setCurrentClientName(data.name);
        addActivity({
          type: 'conversation_started',
          text: `Client identified`,
          detail: `Name: ${data.name}`,
          timestamp: data.timestamp,
          conversationId: data.conversationId
        });
      }
    });

    setIsConnected(true);

    // Cleanup subscriptions
    return () => {
      unsubSent();
      unsubReceived();
      unsubStarted();
      unsubDoc();
      unsubLoan();
      unsubName();
    };
  }, [addActivity, currentClientName]);

  /**
   * Clear all activities
   */
  const handleClearAll = () => {
    setActivities([]);
    setAllActivities([]);
  };

  /**
   * Open/Close modal handlers
   */
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="dark-activity-card">
      <div className="dark-activity-header">
        <div className="dark-activity-title-wrapper">
          <h3 className="dark-activity-title">Recent Activity</h3>
          <span className={`activity-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="dark-activity-actions">
          {activities.length > 0 && (
            <button 
              className="activity-clear-btn"
              onClick={handleClearAll}
              title="Clear all activities"
            >
              Clear
            </button>
          )}
          <button className="dark-activity-action" onClick={handleOpenModal}>
            View all
          </button>
        </div>
      </div>
      <div className="dark-activity-list">
        {activities.length === 0 ? (
          <EmptyState />
        ) : (
          activities.map((activity) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity} 
              formatTime={formatTime}
            />
          ))
        )}
      </div>
      
      {/* Activities Modal */}
      <ActivitiesModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        activities={allActivities}
        formatTime={formatTime}
      />
    </div>
  );
};

export default memo(RecentActivitiesCard);
