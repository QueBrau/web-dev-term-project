import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userId = 2;
    
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        f.name as fraternity_name,
        f.dues_amount as total_amount,
        f.dues_period,
        d.id as dues_id,
        COALESCE(d.paid_amount, 0) as paid_amount,
        (COALESCE(f.dues_amount, 0) - COALESCE(d.paid_amount, 0)) as remaining_amount,
        d.due_date,
        CASE 
          WHEN d.paid_amount IS NULL THEN 'pending'
          WHEN d.paid_amount >= f.dues_amount THEN 'paid'
          ELSE 'partial'
        END as status
      FROM users u
      LEFT JOIN fraternities f ON u.fraternity_id = f.id
      LEFT JOIN dues d ON u.id = d.user_id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = result.rows[0];

    if (!userData.fraternity_name) {
      return res.status(400).json({ 
        error: 'No fraternity assigned', 
        message: 'Please contact your administrator to assign you to a fraternity.' 
      });
    }

    if (!userData.dues_id && userData.total_amount) {
      const insertResult = await pool.query(
        `INSERT INTO dues (user_id, total_amount, paid_amount, due_date)
         VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '30 days')
         RETURNING *`,
        [userId, parseFloat(userData.total_amount), 0]
      );
      
      const newDues = insertResult.rows[0];
      userData.dues_id = newDues.id;
      userData.paid_amount = parseFloat(newDues.paid_amount);
      userData.due_date = newDues.due_date;
    }

    delete userData.dues_id;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dues information' });
  }
});

router.post('/payment', async (req, res) => {
  try {
    const userId = 2;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const userResult = await pool.query(
      `SELECT u.id, f.dues_amount, COALESCE(d.paid_amount, 0) as paid_amount, d.id as dues_id
       FROM users u
       LEFT JOIN fraternities f ON u.fraternity_id = f.id
       LEFT JOIN dues d ON u.id = d.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { dues_amount, paid_amount, dues_id } = userResult.rows[0];
    const totalAmount = parseFloat(dues_amount);
    const currentPaid = parseFloat(paid_amount);
    const paymentAmount = parseFloat(amount);
    const newPaidAmount = currentPaid + paymentAmount;

    if (newPaidAmount > totalAmount) {
      return res.status(400).json({ 
        error: 'Payment exceeds remaining balance',
        message: `Payment of $${paymentAmount.toFixed(2)} would exceed total dues of $${totalAmount.toFixed(2)}`
      });
    }

    const newStatus = newPaidAmount >= totalAmount ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'pending');

    let result;
    if (dues_id) {
      result = await pool.query(
        `UPDATE dues 
         SET paid_amount = $1::numeric, status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [newPaidAmount, newStatus, dues_id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO dues (user_id, total_amount, paid_amount, due_date, status)
         VALUES ($1, $2::numeric, $3::numeric, CURRENT_DATE + INTERVAL '30 days', $4)
         RETURNING *`,
        [userId, totalAmount, newPaidAmount, newStatus]
      );
    }

    const updatedDues = result.rows[0];
    
    res.json({ 
      success: true, 
      paid_amount: parseFloat(updatedDues.paid_amount),
      total_amount: parseFloat(updatedDues.total_amount || totalAmount),
      remaining: totalAmount - parseFloat(updatedDues.paid_amount)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

router.get('/chapter', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        SUM(f.dues_amount) as total_due,
        SUM(COALESCE(d.paid_amount, 0)) as total_paid,
        SUM(f.dues_amount - COALESCE(d.paid_amount, 0)) as total_remaining,
        COUNT(u.id) as total_members
      FROM users u
      LEFT JOIN fraternities f ON u.fraternity_id = f.id
      LEFT JOIN dues d ON u.id = d.user_id
      WHERE f.id IS NOT NULL`
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chapter dues' });
  }
});

export default router;
