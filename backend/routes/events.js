import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, event_date, location, event_type, created_at 
       FROM events 
       WHERE event_date >= CURRENT_DATE 
       ORDER BY event_date ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, eventDate, location, eventType } = req.body;

    const result = await pool.query(
      'INSERT INTO events (title, description, event_date, location, event_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, eventDate, location, eventType || 'general']
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;
