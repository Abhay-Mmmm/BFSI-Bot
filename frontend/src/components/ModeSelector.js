import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ModeSelector.css';

/**
 * ModeSelector - Interface Selection Screen
 * 
 * Allows user to choose between:
 * - Client Side (Chat interface for loan applicants)
 * - Sales Agent Side (Dashboard + Team Dashboard for agents)
 * 
 * This is a FRONTEND-ONLY component with no backend dependencies.
 */
const ModeSelector = () => {
  const navigate = useNavigate();

  const handleModeSelection = (mode) => {
    // Store the selected mode in localStorage for reference
    localStorage.setItem('bfsi-user-mode', mode);
    
    if (mode === 'client') {
      navigate('/chat');
    } else if (mode === 'agent') {
      navigate('/dashboard');
    }
  };

  return (
    <div className="mode-selector-container">
      <div className="mode-selector-content">
        {/* Logo and Header */}
        <div className="mode-selector-header">
          <div className="mode-selector-logo">
            <svg width="56" height="56" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="10" fill="url(#logo-gradient-selector)"/>
              <defs>
                <linearGradient id="logo-gradient-selector" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6"/>
                  <stop offset="1" stopColor="#2563EB"/>
                </linearGradient>
              </defs>
              <path d="M10 14H26M10 18H22M10 22H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="26" cy="22" r="3" fill="#10B981"/>
              <path d="M25 22L26 23L28 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="mode-selector-title">PRIMUM</h1>
          <p className="mode-selector-subtitle">AI-Powered Loan Processing System</p>
        </div>

        {/* Interface Selection */}
        <div className="mode-selector-prompt">
          <h2>Choose Interface</h2>
          <p>Select how you'd like to access the system</p>
        </div>

        <div className="mode-selector-options">
          {/* Client Side Option */}
          <div 
            className="mode-option client-mode"
            onClick={() => handleModeSelection('client')}
          >
            <div className="mode-option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 9h8"/>
                <path d="M8 13h6"/>
              </svg>
            </div>
            <div className="mode-option-content">
              <h3>Client Side</h3>
              <p>Chat interface for loan applications</p>
              <ul className="mode-features">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Apply for loans via AI chat
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Upload documents
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Track application status
                </li>
              </ul>
            </div>
            <div className="mode-option-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          {/* Sales Agent Side Option */}
          <div 
            className="mode-option agent-mode"
            onClick={() => handleModeSelection('agent')}
          >
            <div className="mode-option-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="mode-option-content">
              <h3>Sales Agent Side</h3>
              <p>Dashboard for loan officers</p>
              <ul className="mode-features">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  View analytics & KPIs
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Real-time client activity
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Team performance tracking
                </li>
              </ul>
            </div>
            <div className="mode-option-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mode-selector-footer">
          <p>Powered by AI-driven orchestration for seamless loan processing</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
