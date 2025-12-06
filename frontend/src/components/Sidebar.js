import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>PRIMUM</h2>
        <p>AI Sales Orchestration</p>
      </div>
      <nav className="nav-menu">
        <ul>
          <li>
            <Link
              to="/dashboard"
              className={isActive('/dashboard') ? 'active' : ''}
            >
              <i className="fas fa-tachometer-alt"></i> Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
            >
              <i className="fas fa-comments"></i> Conversations
            </Link>
          </li>
          <li>
            <Link
              to="/leads"
              className={isActive('/leads') ? 'active' : ''}
            >
              <i className="fas fa-users"></i> Leads
            </Link>
          </li>
          <li>
            <Link
              to="/analytics"
              className={isActive('/analytics') ? 'active' : ''}
            >
              <i className="fas fa-chart-bar"></i> Analytics
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={isActive('/settings') ? 'active' : ''}
            >
              <i className="fas fa-cog"></i> Settings
            </Link>
          </li>
        </ul>
      </nav>
      <div className="user-info">
        <div className="user-avatar">AI</div>
        <div className="user-details">
          <div className="user-name">Sales Assistant</div>
          <div className="user-status">Online</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;