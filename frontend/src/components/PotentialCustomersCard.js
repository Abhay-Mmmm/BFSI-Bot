import React, { useState, useEffect, useCallback, memo } from 'react';
import eventBus, { EVENT_TYPES } from '../services/eventBus';

/**
 * PotentialCustomersCard - Real-time Potential Customers Display
 * 
 * Subscribes to EventBus for real-time updates from client chat.
 * Displays a live feed of potential customers who are chatting.
 * Includes a call button for each customer (UI only, VAPI integration pending).
 */

// Phone icon component
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

// User icon component
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Memoized Customer Item component
const CustomerItem = memo(({ customer, onCall, formatTime }) => {
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = () => {
    setIsCalling(true);
    onCall(customer);
    // Simulate call initiation
    setTimeout(() => setIsCalling(false), 2000);
  };

  return (
    <div className={`potential-customer-item ${customer.isNew ? 'customer-new' : ''}`}>
      <div className="customer-avatar">
        <UserIcon />
      </div>
      <div className="customer-info">
        <div className="customer-name">{customer.name || 'Anonymous User'}</div>
        <div className="customer-details">
          {customer.loanInterest && (
            <span className="customer-interest">💰 {customer.loanInterest}</span>
          )}
          <span className="customer-time">{formatTime(customer.timestamp)}</span>
        </div>
      </div>
      <button 
        className={`customer-call-btn ${isCalling ? 'calling' : ''}`}
        onClick={handleCall}
        disabled={isCalling}
        title={isCalling ? 'Calling...' : 'Call customer'}
      >
        {isCalling ? (
          <span className="call-spinner"></span>
        ) : (
          <PhoneIcon />
        )}
      </button>
    </div>
  );
});

CustomerItem.displayName = 'CustomerItem';

// Empty state component
const EmptyState = memo(() => (
  <div className="customers-empty-state">
    <div className="customers-empty-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    </div>
    <p className="customers-empty-text">No potential customers yet</p>
    <p className="customers-empty-hint">Customers will appear here when they start chatting</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

const PotentialCustomersCard = ({ maxItems = 5 }) => {
  const [customers, setCustomers] = useState([]);
  const [callingCustomer, setCallingCustomer] = useState(null);

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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  }, []);

  /**
   * Add or update a customer
   */
  const addOrUpdateCustomer = useCallback((customerData) => {
    setCustomers(prev => {
      // Check if customer already exists
      const existingIndex = prev.findIndex(c => c.conversationId === customerData.conversationId);
      
      if (existingIndex >= 0) {
        // Update existing customer
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...customerData,
          timestamp: customerData.timestamp || updated[existingIndex].timestamp,
          isNew: false
        };
        return updated;
      }
      
      // Add new customer
      const newCustomer = {
        id: Date.now() + Math.random(),
        name: customerData.name || 'Anonymous User',
        conversationId: customerData.conversationId,
        loanInterest: customerData.loanInterest,
        timestamp: customerData.timestamp || new Date().toISOString(),
        isNew: true
      };
      
      const newList = [newCustomer, ...prev].slice(0, maxItems);
      
      // Remove "new" flag after animation
      setTimeout(() => {
        setCustomers(current => 
          current.map(c => ({ ...c, isNew: false }))
        );
      }, 2000);
      
      return newList;
    });
  }, [maxItems]);

  /**
   * Handle call button click
   */
  const handleCall = useCallback((customer) => {
    setCallingCustomer(customer);
    
    // Emit event that call was initiated (for the client to receive)
    eventBus.emit(EVENT_TYPES.CALL_INITIATED, {
      customerId: customer.id,
      customerName: customer.name,
      conversationId: customer.conversationId,
      timestamp: new Date().toISOString()
    });
    
    // Clear calling state after a delay
    setTimeout(() => {
      setCallingCustomer(null);
    }, 3000);
  }, []);

  /**
   * Subscribe to EventBus events
   */
  useEffect(() => {
    // Subscribe to conversation started
    const unsubStarted = eventBus.subscribe(EVENT_TYPES.CHAT_CONVERSATION_STARTED, (data) => {
      addOrUpdateCustomer({
        conversationId: data.conversationId,
        timestamp: data.timestamp
      });
    });

    // Subscribe to client name updates
    const unsubName = eventBus.subscribe(EVENT_TYPES.CLIENT_NAME_UPDATED, (data) => {
      if (data.name) {
        addOrUpdateCustomer({
          conversationId: data.conversationId,
          name: data.name,
          timestamp: data.timestamp
        });
      }
    });

    // Subscribe to chat message received (AI response) - often contains client name
    const unsubReceived = eventBus.subscribe(EVENT_TYPES.CHAT_MESSAGE_RECEIVED, (data) => {
      const updateData = {
        conversationId: data.conversationId,
        timestamp: data.timestamp
      };
      
      if (data.clientName) {
        updateData.name = data.clientName;
      }
      
      addOrUpdateCustomer(updateData);
    });

    // Subscribe to chat messages to detect loan interest
    const unsubMessage = eventBus.subscribe(EVENT_TYPES.CHAT_MESSAGE_SENT, (data) => {
      // Try to detect loan interest from message
      const text = (data.text || '').toLowerCase();
      let loanInterest = null;
      
      if (text.includes('home loan') || text.includes('house')) {
        loanInterest = 'Home Loan';
      } else if (text.includes('personal loan') || text.includes('personal')) {
        loanInterest = 'Personal Loan';
      } else if (text.includes('business loan') || text.includes('business')) {
        loanInterest = 'Business Loan';
      } else if (text.includes('car loan') || text.includes('vehicle')) {
        loanInterest = 'Vehicle Loan';
      } else if (text.includes('loan') || text.includes('lakh') || text.includes('rupees')) {
        loanInterest = 'Loan Inquiry';
      }
      
      // Prepare update data
      const updateData = {
        conversationId: data.conversationId,
        timestamp: data.timestamp
      };

      // Only include name if it's present and not null
      if (data.clientName) {
        updateData.name = data.clientName;
      }

      // Only include loan interest if detected
      if (loanInterest) {
        updateData.loanInterest = loanInterest;
      }
      
      // Update if we have something interesting or just to update timestamp
      addOrUpdateCustomer(updateData);
    });

    // Cleanup subscriptions
    return () => {
      unsubStarted();
      unsubName();
      unsubReceived();
      unsubMessage();
    };
  }, [addOrUpdateCustomer]);

  return (
    <div className="potential-customers-card">
      <div className="potential-customers-header">
        <div className="potential-customers-title-wrapper">
          <h3 className="potential-customers-title">Potential Customers</h3>
          <span className="customers-status">
            <span className="status-dot"></span>
            Live
          </span>
        </div>
        <div className="potential-customers-count">
          {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
        </div>
      </div>
      <div className="potential-customers-list">
        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          customers.map((customer) => (
            <CustomerItem 
              key={customer.id} 
              customer={customer} 
              onCall={handleCall}
              formatTime={formatTime}
            />
          ))
        )}
      </div>
      {callingCustomer && (
        <div className="call-notification">
          <PhoneIcon />
          <span>Calling {callingCustomer.name}...</span>
        </div>
      )}
    </div>
  );
};

export default memo(PotentialCustomersCard);
