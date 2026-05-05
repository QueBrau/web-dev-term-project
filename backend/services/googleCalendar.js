import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/calendar/oauth2callback'
);

export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function getTokens(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    throw new Error('Failed to get tokens');
  }
}

export function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
}

export async function createCalendarEvent(eventDetails, userTokens) {
  try {
    oauth2Client.setCredentials(userTokens);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const eventDate = new Date(eventDetails.event_date);
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(10, 0, 0);
    
    const endDateTime = new Date(eventDate);
    endDateTime.setHours(12, 0, 0);
    
    const event = {
      summary: eventDetails.title,
      location: eventDetails.location || '',
      description: eventDetails.description || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to create calendar event');
  }
}

export async function getUserCalendarEvents(userTokens, timeMin, timeMax) {
  try {
    oauth2Client.setCredentials(userTokens);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    throw new Error('Failed to fetch calendar events');
  }
}

export async function updateCalendarEvent(eventId, eventDetails, userTokens) {
  try {
    oauth2Client.setCredentials(userTokens);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const eventDate = new Date(eventDetails.event_date);
    const startDateTime = new Date(eventDate);
    startDateTime.setHours(10, 0, 0);
    
    const endDateTime = new Date(eventDate);
    endDateTime.setHours(12, 0, 0);
    
    const event = {
      summary: eventDetails.title,
      location: eventDetails.location || '',
      description: eventDetails.description || '',
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/New_York',
      },
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to update calendar event');
  }
}

export async function deleteCalendarEvent(eventId, userTokens) {
  try {
    oauth2Client.setCredentials(userTokens);
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

export default {
  getAuthUrl,
  getTokens,
  setCredentials,
  createCalendarEvent,
  getUserCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent
};
