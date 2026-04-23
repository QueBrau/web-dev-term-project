import React, { useState, useEffect } from 'react';
import { duesAPI } from '../api';

function Dues() {
  const [userDues, setUserDues] = useState(null);
  const [chapterDues, setChapterDues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const [userResponse, chapterResponse] = await Promise.all([
        duesAPI.getUserDues(),
        duesAPI.getChapterDues()
      ]);
      setUserDues(userResponse.data);
      setChapterDues(chapterResponse.data);
    } catch (err) {
      setError('Failed to fetch dues information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="container">
      <h1>Dues Information</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>Your Dues</h2>
        {userDues ? (
          <>
            <p><strong>Total Amount:</strong> ${userDues.total_amount || 0}</p>
            <p><strong>Paid Amount:</strong> ${userDues.paid_amount || 0}</p>
            <p><strong>Remaining:</strong> ${userDues.remaining_amount || 0}</p>
            <p><strong>Status:</strong> <span style={{ 
              color: userDues.status === 'paid' ? 'green' : 'orange',
              textTransform: 'capitalize'
            }}>{userDues.status || 'pending'}</span></p>
            {userDues.due_date && (
              <p><strong>Due Date:</strong> {new Date(userDues.due_date).toLocaleDateString()}</p>
            )}
          </>
        ) : (
          <p>No dues information available for your account.</p>
        )}
      </div>

      <div className="card">
        <h2>Chapter Dues Summary</h2>
        {chapterDues ? (
          <>
            <p><strong>Total Due:</strong> ${chapterDues.total_due || 0}</p>
            <p><strong>Total Paid:</strong> ${chapterDues.total_paid || 0}</p>
            <p><strong>Total Remaining:</strong> ${chapterDues.total_remaining || 0}</p>
            <p><strong>Total Members:</strong> {chapterDues.total_members || 0}</p>
          </>
        ) : (
          <p>No chapter dues information available.</p>
        )}
      </div>
    </div>
  );
}

export default Dues;
