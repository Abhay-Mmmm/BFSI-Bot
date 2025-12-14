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
    <div className="document-upload card p-lg">
      <div className="upload-area mb-md">
        <input
          type="file"
          id="document-upload"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <label htmlFor="document-upload" className="upload-label d-flex flex-column align-center justify-center p-lg text-center cursor-pointer">
          <div className="upload-icon mb-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10V17H17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 14L12 12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 7H15C17.2091 7 19 8.79086 19 11V17C19 19.2091 17.2091 21 15 21H9C6.79086 21 5 19.2091 5 17V11C5 8.79086 6.79086 7 9 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="upload-text header-3 mb-sm">Upload Documents</div>
          <div className="upload-hint caption">Supports PDF, JPG, PNG (Max 10MB)</div>
        </label>
      </div>

      {(isUploading || uploadStatus) && (
        <div className={`upload-status mb-md p-sm ${isUploading ? 'text-tertiary' : uploadStatus.includes('failed') ? 'text-error' : 'text-success'}`}>
          {isUploading ? 'Uploading...' : uploadStatus}
        </div>
      )}

      {documents.length > 0 && (
        <div className="document-list">
          <h4 className="header-3 mb-md">Uploaded Documents ({documents.length})</h4>
          <ul className="document-list-ul">
            {documents.map(doc => (
              <li key={doc.id} className="document-item d-flex justify-between align-center p-sm mb-sm">
                <div className="d-flex align-center gap-sm">
                  <div className="document-icon">
                    {doc.type.includes('pdf') ? '📄' : doc.type.includes('image') ? '🖼️' : '📁'}
                  </div>
                  <div className="d-flex flex-column">
                    <span className="body-default font-semibold">{doc.name}</span>
                    <span className="caption text-tertiary">{Math.round(doc.size / 1024)} KB</span>
                  </div>
                </div>
                <a href={doc.downloadUrl} className="button button-secondary">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V10M8 10L11 7M8 10L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;