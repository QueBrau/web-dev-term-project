import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faCalendar, faCoins } from '@fortawesome/free-solid-svg-icons';

function Dashboard({ user }) {
  return (
    <div className="container">
      <h1>Hello, {user?.first_name || 'User'}</h1>
      <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>Welcome to THE Dashboard</p>

      <div className="grid">
        <div className="card">
          <h2><FontAwesomeIcon icon={faFile} /> Documents</h2>
          <p>Access chapter documents and chapter minutes</p>
          <Link to="/documents">
            <button style={{ marginTop: '1rem' }}>View Documents</button>
          </Link>
        </div>

        <div className="card">
          <h2><FontAwesomeIcon icon={faCoins} /> Dues</h2>
          <p>Check your dues</p>
          <Link to="/dues">
            <button style={{ marginTop: '1rem' }}>View Dues</button>
          </Link>
        </div>

        <div className="card">
          <h2><FontAwesomeIcon icon={faCalendar} /> Events</h2>
          <p>View upcoming events</p>
          <Link to="/events">
            <button style={{ marginTop: '1rem' }}>View Events</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
