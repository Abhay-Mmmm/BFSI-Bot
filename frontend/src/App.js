import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { NotificationProvider } from './components/NotificationProvider';

// Lazy load components for code splitting
const ModeSelector = lazy(() => import('./components/ModeSelector'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const Settings = lazy(() => import('./components/Settings'));
const TeamDashboard = lazy(() => import('./components/TeamDashboard'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-fallback" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0B0F19',
    color: '#F3F4F6'
  }}>
    <div className="loading-spinner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #1F2937',
        borderTop: '3px solid #3B82F6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span>Loading...</span>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Mode Selection - Landing Page */}
              <Route path="/" element={<ModeSelector />} />
              
              {/* Client Side Routes */}
              <Route path="/chat" element={<ChatInterface />} />
              
              {/* Sales Agent Side Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/leads" element={<Dashboard />} />
              <Route path="/analytics" element={<Dashboard />} />
              <Route path="/team" element={<TeamDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;