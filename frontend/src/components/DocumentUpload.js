import React, { useState } from 'react';

const DocumentUpload = ({ documents, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      setUploadStatus('Uploading...');

      // Simulate upload process
      setTimeout(() => {
        const document = {
          id: Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toLocaleString()
        };
        
        onUpload(document);
        setIsUploading(false);
        setUploadStatus('Upload successful!');
        
        // Clear status after 3 seconds
        setTimeout(() => setUploadStatus(''), 3000);
      }, 1500);
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