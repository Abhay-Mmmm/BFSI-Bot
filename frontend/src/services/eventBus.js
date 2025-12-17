/**
 * EventBus Service - Frontend-Only Real-Time Sync
 * 
 * Uses BroadcastChannel API for cross-tab communication
 * Falls back to localStorage events for older browsers
 * 
 * This enables real-time sync between Client Chat and Sales Dashboard
 * WITHOUT any backend modifications.
 */

class EventBusService {
  constructor() {
    this.listeners = new Map();
    this.channel = null;
    this.channelName = 'bfsi-bot-events';
    
    // Initialize BroadcastChannel for cross-tab communication
    this.initBroadcastChannel();
    
    // Fallback: localStorage event listener for older browsers
    this.initLocalStorageFallback();
  }

  /**
   * Initialize BroadcastChannel for modern browsers
   */
  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          this.handleIncomingEvent(event.data);
        };
        console.log('[EventBus] BroadcastChannel initialized');
      } catch (error) {
        console.warn('[EventBus] BroadcastChannel not available:', error);
      }
    }
  }

  /**
   * Fallback for browsers without BroadcastChannel support
   */
  initLocalStorageFallback() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.channelName && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          this.handleIncomingEvent(data);
        } catch (error) {
          console.error('[EventBus] Failed to parse storage event:', error);
        }
      }
    });
  }

  /**
   * Handle incoming events from other tabs
   */
  handleIncomingEvent(data) {
    if (data && data.eventType) {
      const listeners = this.listeners.get(data.eventType) || [];
      listeners.forEach(callback => {
        try {
          callback(data.payload);
        } catch (error) {
          console.error('[EventBus] Listener error:', error);
        }
      });
    }
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event to all tabs
   * @param {string} eventType - Event type
   * @param {Object} payload - Event data
   */
  emit(eventType, payload) {
    const eventData = {
      eventType,
      payload,
      timestamp: new Date().toISOString(),
      tabId: this.getTabId()
    };

    // Broadcast to other tabs
    if (this.channel) {
      this.channel.postMessage(eventData);
    }

    // Fallback: Use localStorage for cross-tab communication
    try {
      localStorage.setItem(this.channelName, JSON.stringify(eventData));
      // Clear immediately to allow same event to fire again
      setTimeout(() => {
        localStorage.removeItem(this.channelName);
      }, 100);
    } catch (error) {
      console.warn('[EventBus] localStorage fallback failed:', error);
    }

    // Also notify local listeners in the same tab
    this.handleIncomingEvent(eventData);
  }

  /**
   * Get or create a unique tab ID
   */
  getTabId() {
    if (!this._tabId) {
      this._tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this._tabId;
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

// Singleton instance
const eventBus = new EventBusService();

// Event types for chat activities
export const EVENT_TYPES = {
  CHAT_MESSAGE_SENT: 'chat:message:sent',
  CHAT_MESSAGE_RECEIVED: 'chat:message:received',
  CHAT_CONVERSATION_STARTED: 'chat:conversation:started',
  CHAT_DOCUMENT_UPLOADED: 'chat:document:uploaded',
  LOAN_STATUS_UPDATED: 'loan:status:updated'
};

export default eventBus;
