import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './styles.css';

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
              to="/settings"
              className={isActive('/settings') ? 'active' : ''}
            >
              <span className="nav-number">1.</span> Settings
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
            >
              <span className="nav-number">2.</span> Chat / Enter Data
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className={isActive('/dashboard') ? 'active' : ''}
            >
              <span className="nav-number">3.</span> Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/team"
              className={isActive('/team') ? 'active' : ''}
            >
              <span className="nav-number">4.</span> Team Dashboard
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;