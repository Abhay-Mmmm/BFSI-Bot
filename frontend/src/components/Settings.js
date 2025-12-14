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
          <div>
            <h2>System Settings</h2>
            <p className="caption">Configure your AI banking assistant parameters</p>
          </div>
        </div>

        <div className="settings-container">
          <div className="settings-card card">
            <h3 className="header-3">AI Model Configuration</h3>
            <div className="settings-section">
              <label className="body-small" htmlFor="model-select">Select AI Model</label>
              <select
                id="model-select"
                className="input-field"
                value={currentModel}
                onChange={(e) => setCurrentModel(e.target.value)}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <p className="caption">Choose the AI model that best suits your banking operations needs.</p>
            </div>

            <div className="settings-section">
              <label className="body-small" htmlFor="api-key">API Key (Optional)</label>
              <input
                type="password"
                id="api-key"
                className="input-field"
                placeholder="Enter your custom API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="caption">Provide a custom API key to override the default configuration.</p>
            </div>

            <div className="settings-actions">
              <button
                className="button button-primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          <div className="settings-card card">
            <h3 className="header-3">Security Settings</h3>
            <div className="settings-section">
              <div className="toggle-field">
                <label className="body-small">Enable Data Encryption</label>
                <div className="toggle-switch">
                  <input type="checkbox" id="encryption-toggle" defaultChecked />
                  <label htmlFor="encryption-toggle">Toggle</label>
                </div>
              </div>
              <p className="caption">Encrypt all customer data and communications automatically.</p>
            </div>

            <div className="settings-section">
              <div className="toggle-field">
                <label className="body-small">Enable Audit Logging</label>
                <div className="toggle-switch">
                  <input type="checkbox" id="audit-toggle" defaultChecked />
                  <label htmlFor="audit-toggle">Toggle</label>
                </div>
              </div>
              <p className="caption">Maintain detailed logs of all customer interactions for compliance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
