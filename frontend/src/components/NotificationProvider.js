import React, { createContext, useContext, useReducer } from 'react';
import Notification from './Notification';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            message: action.payload.message,
            type: action.payload.type,
            duration: action.payload.duration
          }
        ]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload.id)
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, { notifications: [] });

  const addNotification = (message, type = 'info', duration = 3000) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message, type, duration }
    });
  };

  const removeNotification = (id) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: { id }
    });
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {state.notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};