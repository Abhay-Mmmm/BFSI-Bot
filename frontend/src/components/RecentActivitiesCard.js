import React, { useState, useEffect, useCallback } from 'react';
import eventBus, { EVENT_TYPES } from '../services/eventBus';

/**
 * RecentActivitiesCard - Real-time Activity Display
 * 
 * Subscribes to EventBus for real-time updates from client chat.
 * Displays a live feed of chat activities in the Sales Agent dashboard.
 * 
 * This is a FRONTEND-ONLY component with no backend dependencies.
 */
const RecentActivitiesCard = ({ maxItems = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(true);

  /**
   * Format timestamp for display
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
   * Get activity icon based on type
   */
  const getActivityIcon = (type) => {
    switch (type) {
      case 'message_sent':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
          </svg>
        );
      case 'message_received':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'conversation_started':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        );
      case 'document_uploaded':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        );
      case 'loan_status':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  /**
   * Get activity icon style based on type
   */
  const getIconStyle = (type) => {
    switch (type) {
      case 'message_sent':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' };
      case 'message_received':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
      case 'conversation_started':
        return { background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' };
      case 'document_uploaded':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' };
      case 'loan_status':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' };
      default:
        return { background: 'rgba(107, 114, 128, 0.15)', color: '#6B7280' };
    }
  };

  /**
   * Add a new activity to the list
   */
  const addActivity = useCallback((activity) => {
    setActivities(prev => {
      const newActivities = [{
        id: activity.id || Date.now() + Math.random(),
        type: activity.type,
        text: activity.text,
        detail: activity.detail,
        timestamp: activity.timestamp || new Date().toISOString(),
        conversationId: activity.conversationId,
        isNew: true
      }, ...prev];
      
      // Limit to maxItems
      return newActivities.slice(0, maxItems);
    });

    // Remove "new" flag after animation
    setTimeout(() => {
      setActivities(prev => 
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
      addActivity({
        type: 'message_sent',
        text: `Client sent message`,
        detail: data.text?.substring(0, 50) + (data.text?.length > 50 ? '...' : ''),
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to chat message received
    const unsubReceived = eventBus.subscribe(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, (data) => {
      addActivity({
        type: 'message_received',
        text: `AI responded to client`,
        detail: data.text?.substring(0, 50) + (data.text?.length > 50 ? '...' : ''),
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to conversation started
    const unsubStarted = eventBus.subscribe(EVENT_TYPES.CHAT_CONVERSATION_STARTED, (data) => {
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
      addActivity({
        type: 'document_uploaded',
        text: `Document uploaded`,
        detail: data.filename || 'Document',
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    // Subscribe to loan status updates
    const unsubLoan = eventBus.subscribe(EVENT_TYPES.LOAN_STATUS_UPDATED, (data) => {
      addActivity({
        type: 'loan_status',
        text: `Loan status updated`,
        detail: data.status || data.decision || 'Status changed',
        timestamp: data.timestamp,
        conversationId: data.conversationId
      });
    });

    setIsConnected(true);

    // Cleanup subscriptions
    return () => {
      unsubSent();
      unsubReceived();
      unsubStarted();
      unsubDoc();
      unsubLoan();
    };
  }, [addActivity]);

  /**
   * Clear all activities
   */
  const handleClearAll = () => {
    setActivities([]);
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
          <span className="dark-activity-action">View all</span>
        </div>
      </div>
      <div className="dark-activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty-state">
            <div className="activity-empty-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="activity-empty-text">No recent activity</p>
            <p className="activity-empty-hint">Client chat activities will appear here in real-time</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className={`dark-activity-item ${activity.isNew ? 'activity-new' : ''}`}
            >
              <div 
                className="dark-activity-icon"
                style={getIconStyle(activity.type)}
              >
                {getActivityIcon(activity.type)}
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
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivitiesCard;
