import express from 'express';
import pool from '../db.js';
import {
  getAuthUrl,
  getTokens,
  createCalendarEvent,
  getUserCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent
} from '../services/googleCalendar.js';

const router = express.Router();

router.get('/auth', (req, res) => {
  try {
    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

router.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    const tokens = await getTokens(code);
    
    const tokensEncoded = encodeURIComponent(JSON.stringify(tokens));
    res.redirect(`http://localhost:3000/events?calendar_auth=success&tokens=${tokensEncoded}`);
  } catch (error) {
    res.redirect('http://localhost:3000/events?calendar_auth=error');
  }
});

router.post('/sync-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userTokens } = req.body;

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authorized with Google Calendar' });
    }

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    const calendarEvent = await createCalendarEvent(event, userTokens);

    await pool.query(
      'UPDATE events SET google_calendar_id = $1 WHERE id = $2',
      [calendarEvent.id, eventId]
    );

    res.json({
      message: 'Event synced to Google Calendar successfully',
      calendarEvent: calendarEvent
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync event to Google Calendar' });
  }
});

router.post('/sync-all', async (req, res) => {
  try {
    const { userTokens } = req.body;

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authorized with Google Calendar' });
    }

    const eventsResult = await pool.query(
      `SELECT * FROM events 
       WHERE event_date >= CURRENT_DATE 
       ORDER BY event_date ASC`
    );

    const syncResults = [];

    for (const event of eventsResult.rows) {
      try {
        const calendarEvent = await createCalendarEvent(event, userTokens);
        
        await pool.query(
          'UPDATE events SET google_calendar_id = $1 WHERE id = $2',
          [calendarEvent.id, event.id]
        );

        syncResults.push({
          eventId: event.id,
          title: event.title,
          status: 'synced',
          calendarEventId: calendarEvent.id
        });
      } catch (error) {
        syncResults.push({
          eventId: event.id,
          title: event.title,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Sync completed',
      results: syncResults,
      total: eventsResult.rows.length,
      synced: syncResults.filter(r => r.status === 'synced').length,
      failed: syncResults.filter(r => r.status === 'failed').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const { userTokens, timeMin, timeMax } = req.body;

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authorized with Google Calendar' });
    }

    const events = await getUserCalendarEvents(userTokens, timeMin, timeMax);

    res.json({
      events: events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

router.put('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userTokens, calendarEventId } = req.body;

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authorized with Google Calendar' });
    }

    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    const googleEventId = calendarEventId || event.google_calendar_id;

    if (!googleEventId) {
      return res.status(400).json({ error: 'Event not synced to Google Calendar' });
    }

    const updatedEvent = await updateCalendarEvent(googleEventId, event, userTokens);

    res.json({
      message: 'Event updated in Google Calendar successfully',
      calendarEvent: updatedEvent
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
});


router.delete('/event/:calendarEventId', async (req, res) => {
  try {
    const { calendarEventId } = req.params;
    const { userTokens } = req.body;

    if (!userTokens) {
      return res.status(401).json({ error: 'User not authorized with Google Calendar' });
    }

    await deleteCalendarEvent(calendarEventId, userTokens);

    res.json({
      message: 'Event deleted from Google Calendar successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

export default router;
