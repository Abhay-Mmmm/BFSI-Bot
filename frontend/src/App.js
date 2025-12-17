import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ModeSelector from './components/ModeSelector';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import TeamDashboard from './components/TeamDashboard';
import { NotificationProvider } from './components/NotificationProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Mode Selection - Landing Page */}
            <Route path="/" element={<ModeSelector />} />
            
            {/* Client Side Routes */}
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/conversations" element={<ChatInterface />} />
            
            {/* Sales Agent Side Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Dashboard />} />
            <Route path="/analytics" element={<Dashboard />} />
            <Route path="/team" element={<TeamDashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;