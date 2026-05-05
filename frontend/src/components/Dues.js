import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { duesAPI } from '../api';
import './Dues.css';

function Dues() {
  const [userDues, setUserDues] = useState(null);
  const [chapterDues, setChapterDues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (amount > userDues.remaining_amount) {
      setError(`Payment amount cannot exceed remaining balance of $${userDues.remaining_amount}`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await duesAPI.submitPayment(amount);
      setSuccessMessage(`Payment of $${amount.toFixed(2)} submitted successfully!`);
      setPaymentAmount('');
      await fetchDues();
    } catch (err) {
      setError('Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPieChartData = () => {
    if (!userDues || !userDues.total_amount) return [];
    
    const paid = parseFloat(userDues.paid_amount) || 0;
    const remaining = parseFloat(userDues.remaining_amount) || 0;

    return [
      { name: 'Paid', value: paid, color: '#27ae60' },
      { name: 'Remaining', value: remaining, color: '#e74c3c' }
    ];
  };

  const COLORS = ['#27ae60', '#e74c3c'];

  if (loading) return <div className="container loading">Loading...</div>;

  const chartData = getPieChartData();
  const hasData = chartData.length > 0 && chartData.some(d => d.value > 0);

  return (
    <div className="container dues-container">
      <h1>Dues Information</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="dues-grid">
        <div className="card dues-card">
          <h2>Your Dues</h2>
          {userDues && userDues.total_amount ? (
            <>
              <div className="dues-info">
                <p><strong>Fraternity:</strong> {userDues.fraternity_name || 'Not assigned'}</p>
                <p><strong>Total Amount:</strong> ${parseFloat(userDues.total_amount).toFixed(2)}</p>
                <p><strong>Paid Amount:</strong> ${parseFloat(userDues.paid_amount).toFixed(2)}</p>
                <p><strong>Remaining:</strong> ${parseFloat(userDues.remaining_amount).toFixed(2)}</p>
                <p><strong>Status:</strong> <span className={`status-badge status-${userDues.status}`}>
                  {userDues.status || 'pending'}
                </span></p>
                {userDues.dues_period && (
                  <p><strong>Period:</strong> {userDues.dues_period}</p>
                )}
              </div>

              {hasData && (
                <div className="pie-chart-container">
                  <h3>Payment Progress</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {parseFloat(userDues.remaining_amount) > 0 && (
                <div className="payment-form">
                  <h3>Make a Payment</h3>
                  <form onSubmit={handlePaymentSubmit}>
                    <div className="form-group">
                      <label htmlFor="paymentAmount">Payment Amount ($)</label>
                      <input
                        type="number"
                        id="paymentAmount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        max={userDues.remaining_amount}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Processing...' : 'Submit Payment'}
                    </button>
                  </form>
                </div>
              )}

              {parseFloat(userDues.remaining_amount) === 0 && (
                <div className="paid-in-full">
                  <p>Congratulations! Your dues are paid in full.</p>
                </div>
              )}
            </>
          ) : (
            <p>No dues information available. Please contact your fraternity treasurer.</p>
          )}
        </div>

        <div className="card chapter-card">
          <h2>Chapter Dues Summary</h2>
          {chapterDues ? (
            <>
              <p><strong>Total Due:</strong> ${parseFloat(chapterDues.total_due || 0).toFixed(2)}</p>
              <p><strong>Total Paid:</strong> ${parseFloat(chapterDues.total_paid || 0).toFixed(2)}</p>
              <p><strong>Total Remaining:</strong> ${parseFloat(chapterDues.total_remaining || 0).toFixed(2)}</p>
              <p><strong>Total Members:</strong> {chapterDues.total_members || 0}</p>
            </>
          ) : (
            <p>No chapter dues information available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dues;
