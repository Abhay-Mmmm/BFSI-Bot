import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { useNotification } from './NotificationProvider';
import './styles.css';
import axios from 'axios';

const Settings = () => {
  const [currentModel, setCurrentModel] = useState('llama3-70b-8192');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();

  const models = [
    { id: 'llama3-70b-8192', name: 'Llama 3 70B (Recommended)' },
    { id: 'llama3-8b-8192', name: 'Llama 3 8B (Faster)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma-7b-it', name: 'Gemma 7B' },
  ];

  useEffect(() => {
    // Fetch current settings if backend supports it
    // For now, we default to llama3-70b
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Call backend to update model
      await axios.post('http://localhost:8000/settings/model', {
        model: currentModel,
        api_key: apiKey // Optional, if user wants to override
      });
      addNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('Failed to save settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content-dashboard">
        <div className="dashboard-header">
          <h2>1. Settings</h2>
        </div>

        <div className="settings-container" style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px' }}>
          <h3>Model Configuration</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>Configure the AI model used for the sales orchestration agents.</p>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Groq Model</label>
            <select 
              value={currentModel} 
              onChange={(e) => setCurrentModel(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Groq API Key (Optional)</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter new API key to override..."
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#888', marginTop: '5px', display: 'block' }}>Leave blank to use the default API key from environment variables.</small>
          </div>

          <button 
            onClick={handleSave}
            disabled={isLoading}
            style={{
              backgroundColor: '#00bfa5',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
