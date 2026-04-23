import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = 1;
    
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        d.total_amount,
        d.paid_amount,
        d.remaining_amount,
        d.due_date,
        d.status
      FROM users u
      LEFT JOIN dues d ON u.id = d.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dues information not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching dues:', error);
    res.status(500).json({ error: 'Failed to fetch dues information' });
  }
});

router.get('/chapter', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        SUM(total_amount) as total_due,
        SUM(paid_amount) as total_paid,
        SUM(remaining_amount) as total_remaining,
        COUNT(*) as total_members
      FROM dues`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching chapter dues:', error);
    res.status(500).json({ error: 'Failed to fetch chapter dues' });
  }
});

export default router;
