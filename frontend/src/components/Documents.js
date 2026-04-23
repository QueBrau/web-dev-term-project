import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../api';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await documentsAPI.create(formData);
      setFormData({
        title: '',
        description: '',
        fileUrl: '',
        documentType: 'meeting-minutes'
      });
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      setError('Failed to upload document');
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
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
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
