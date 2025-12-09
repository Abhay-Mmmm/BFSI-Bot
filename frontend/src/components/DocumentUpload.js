import React, { useState } from 'react';
import axios from 'axios';

const DocumentUpload = ({ documents, onUpload, conversationId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadStatus('Error: File size exceeds 10MB limit');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('Error: Only PDF, JPG, and PNG files are allowed');
      setTimeout(() => setUploadStatus(''), 3000);
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      if (conversationId) {
        formData.append('conversation_id', conversationId);
      }
      
      // Upload to backend
      const response = await axios.post(
        'http://localhost:8000/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.status === 'success') {
        const document = {
          id: response.data.document.id,
          name: response.data.document.filename,
          type: file.type,
          size: response.data.document.file_size,
          uploadedAt: new Date().toLocaleString(),
          downloadUrl: response.data.document.download_url
        };
        
        onUpload(document);
        setUploadStatus('Upload successful!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(''), 3000);
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-area">
        <input
          type="file"
          id="document-upload"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="document-upload" className="upload-label">
          <div className="upload-icon">📁</div>
          <div className="upload-text">Click to upload documents</div>
          <div className="upload-hint">Supports PDF, JPG, PNG (Max 10MB)</div>
        </label>
      </div>
      
      {isUploading && <div className="upload-status">Uploading...</div>}
      {uploadStatus && !isUploading && <div className="upload-status success">{uploadStatus}</div>}
      
      {documents.length > 0 && (
        <div className="document-list">
          <h4>Uploaded Documents ({documents.length})</h4>
          <ul>
            {documents.map(doc => (
              <li key={doc.id} className="document-item">
                <span className="document-name">{doc.name}</span>
                <span className="document-size">
                  {Math.round(doc.size / 1024)} KB
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;