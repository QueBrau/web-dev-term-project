import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../api';

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

  useEffect(() => {
    fetchEvents();
  }, []);

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
      await eventsAPI.create(formData);
      setFormData({
        title: '',
        description: '',
        eventDate: '',
        location: '',
        eventType: 'general'
      });
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError('Failed to create event');
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Events;
