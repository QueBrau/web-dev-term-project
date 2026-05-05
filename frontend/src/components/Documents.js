import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../api';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [uploadMode, setUploadMode] = useState('file');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileUrl: '',
    documentType: 'meeting-minutes'
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to get documents');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (uploadMode === 'file') {
        if (!selectedFile) {
          setError('Please select a file to upload');
          return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('documentType', formData.documentType);

        await documentsAPI.uploadFile(uploadFormData);
      } else {
        await documentsAPI.create(formData);
      }

      setFormData({
        title: '',
        description: '',
        fileUrl: '',
        documentType: 'meeting-minutes'
      });
      setSelectedFile(null);
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document');
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Chapter Documents</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <div className="card">
          <h2>Upload New Document</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '1rem' }}>
              <input
                type="radio"
                name="uploadMode"
                value="file"
                checked={uploadMode === 'file'}
                onChange={(e) => setUploadMode(e.target.value)}
              />
              {' '}Upload File
            </label>
            <label>
              <input
                type="radio"
                name="uploadMode"
                value="url"
                checked={uploadMode === 'url'}
                onChange={(e) => setUploadMode(e.target.value)}
              />
              {' '}Provide URL
            </label>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {uploadMode === 'file' ? (
              <div className="form-group">
                <label htmlFor="file">Choose File</label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx"
                  required
                />
                {selectedFile && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#888' }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="fileUrl">File URL</label>
                <input
                  type="url"
                  id="fileUrl"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/document.pdf"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="documentType">Document Type</label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
              >
                <option value="meeting-minutes">Meeting Minutes</option>
                <option value="bylaws">Bylaws</option>
                <option value="financial">Financial</option>
                <option value="general">General</option>
              </select>
            </div>

            <button type="submit">Upload</button>
          </form>
        </div>
      )}

      <div className="grid">
        {documents.length === 0 ? (
          <p>No documents available</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="card">
              <h3>{doc.title}</h3>
              <p><strong>Type:</strong> {doc.document_type}</p>
              <p>{doc.description}</p>
              <p><small>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</small></p>
              <a 
                href={doc.file_url.startsWith('/') 
                  ? `http://localhost:5001${doc.file_url}` 
                  : doc.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <button style={{ marginTop: '1rem' }}>View Document</button>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Documents;
