import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import Dues from './components/Dues';
import Events from './components/Events';
import { usersAPI } from './api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUser(userId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (userId) => {
    try {
      const response = await usersAPI.getById(userId);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (userId) => {
    localStorage.setItem('userId', userId);
    await fetchUser(userId);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUser(null);
  };

  const getGreekLetters = (fraternity) => {
    const fraternityMap = {
      'Theta Delta Chi': 'ΘΔΧ',
      'Lambda Chi Alpha': 'ΛΧΑ',
      'Pi Kappa Phi': 'ΠΚΦ',
      'Pi Kappa Alpha': 'ΠΚΑ'
    };
    return fraternityMap[fraternity] || 'Frat App';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <nav className="navbar">
            <h1>{getGreekLetters(user?.fraternity)}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <Link to="/dashboard">Dashboard</Link>
              <button onClick={handleLogout} style={{ marginLeft: '1rem' }}>Logout</button>
            </div>
          </nav>
        )}

        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Register onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard user={user} /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/documents" 
            element={
              isAuthenticated ? 
              <Documents /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/dues" 
            element={
              isAuthenticated ? 
              <Dues /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/events" 
            element={
              isAuthenticated ? 
              <Events /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
