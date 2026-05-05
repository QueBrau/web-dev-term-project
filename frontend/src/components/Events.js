import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../api';
import './Calendar.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    eventType: 'general'
  });
  
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleTokens, setGoogleTokens] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchEvents();
    checkCalendarConnection();
    handleOAuthCallback();
  }, []);

  const checkCalendarConnection = () => {
    const tokens = localStorage.getItem('googleTokens');
    if (tokens) {
      setGoogleTokens(JSON.parse(tokens));
      setCalendarConnected(true);
    }
  };

  const handleOAuthCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('calendar_auth');
    const tokensParam = urlParams.get('tokens');
    
    if (authStatus === 'success' && tokensParam) {
      try {
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        localStorage.setItem('googleTokens', JSON.stringify(tokens));
        setGoogleTokens(tokens);
        setCalendarConnected(true);
        setError('Google Calendar connected successfully!');
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        setError('Failed to process authorization tokens');
      }
    } else if (authStatus === 'error') {
      setError('Failed to authorize Google Calendar');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll();
      setEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events');
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
      const response = await eventsAPI.create(formData);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        eventType: 'general'
      });
      setShowForm(false);
      fetchEvents();
      
      if (calendarConnected && googleTokens && response.data.event) {
        await syncEventToCalendar(response.data.event.id);
      }
    } catch (err) {
      setError('Failed to create event');
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/calendar/auth');
      const data = await response.json();
      
      window.location.href = data.authUrl;
    } catch (err) {
      setError('Failed to connect Google Calendar');
    }
  };

  const disconnectGoogleCalendar = () => {
    localStorage.removeItem('googleTokens');
    setGoogleTokens(null);
    setCalendarConnected(false);
    setError('');
  };

  const syncEventToCalendar = async (eventId) => {
    if (!calendarConnected || !googleTokens) {
      setError('Please connect Google Calendar first');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/calendar/sync-event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userTokens: googleTokens })
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const data = await response.json();
        setError('Failed to sync event: ' + data.error);
      }
    } catch (err) {
      setError('Failed to sync event to Google Calendar');
    }
  };

  const syncAllEvents = async () => {
    if (!calendarConnected || !googleTokens) {
      setError('Please connect Google Calendar first');
      return;
    }

    setSyncing(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/calendar/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userTokens: googleTokens })
      });

      const data = await response.json();

      if (response.ok) {
        setError(`Synced ${data.synced} events successfully!`);
        fetchEvents();
      } else {
        setError('Failed to sync events: ' + data.error);
      }
    } catch (err) {
      setError('Failed to sync events');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Upcoming Events</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="calendar-integration">
        <h3>Google Calendar Integration</h3>
        {calendarConnected ? (
          <div>
            <p className="calendar-connected">✓ Connected to Google Calendar</p>
            <div className="calendar-buttons">
              <button onClick={disconnectGoogleCalendar} className="btn-secondary">
                Disconnect
              </button>
              <button onClick={syncAllEvents} disabled={syncing} className="btn-primary">
                {syncing ? 'Syncing...' : 'Sync All Events'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Connect your Google Calendar to automatically sync events</p>
            <button onClick={connectGoogleCalendar} className="btn-primary">
              Connect Google Calendar
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>Create New Event</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Event Title</label>
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
              <label htmlFor="eventDate">Date & Time</label>
              <input
                type="datetime-local"
                id="eventDate"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventType">Event Type</label>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
              >
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="social">Social</option>
                <option value="fundraiser">Fundraiser</option>
                <option value="community-service">Community Service</option>
              </select>
            </div>

            <button type="submit">Create Event</button>
          </form>
        </div>
      )}

      <div className="grid">
        {events.length === 0 ? (
          <p>No upcoming events</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="card">
              <h3>{event.title}</h3>
              <p><strong>Type:</strong> {event.event_type}</p>
              <p>{event.description}</p>
              <p><strong>Date:</strong> {new Date(event.event_date).toLocaleString()}</p>
              {event.location && <p><strong>Location:</strong> {event.location}</p>}
              
              {calendarConnected && (
                <div className="calendar-sync-status">
                  {event.google_calendar_id ? (
                    <span className="synced-badge">✓ Synced to Google Calendar</span>
                  ) : (
                    <button 
                      onClick={() => syncEventToCalendar(event.id)}
                      className="btn-small"
                    >
                      Sync to Calendar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Events;
