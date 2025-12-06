import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import { NotificationProvider } from './components/NotificationProvider';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/conversations" element={<ChatInterface />} />
            <Route path="/leads" element={<Dashboard />} />
            <Route path="/analytics" element={<Dashboard />} />
            <Route path="/settings" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;