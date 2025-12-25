const CALENDAR_URL = 'http://localhost:8004/api/google-cloud/calendar';

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  html_link: string;
}

export interface CreateEventRequest {
  user_id: number;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
}

export const calendarService = {
  // Get today's events
  getTodayEvents: async (userId: number): Promise<CalendarEvent[]> => {
    const response = await fetch(`${CALENDAR_URL}/today-events/${userId}`);
    const data = await response.json();
    return data.success ? data.events : [];
  },

  // Get events in date range
  getEvents: async (
    userId: number,
    timeMin: string,
    timeMax: string,
    maxResults: number = 20
  ): Promise<CalendarEvent[]> => {
    const response = await fetch(`${CALENDAR_URL}/list-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        time_min: timeMin,
        time_max: timeMax,
        max_results: maxResults,
      }),
    });
    const data = await response.json();
    return data.success ? data.events : [];
  },

  // Alias for getEvents
  listEvents: async (
    userId: number,
    timeMin: string,
    timeMax: string,
    maxResults: number = 100
  ): Promise<CalendarEvent[]> => {
    return calendarService.getEvents(userId, timeMin, timeMax, maxResults);
  },

  // Create new event
  createEvent: async (request: CreateEventRequest): Promise<CalendarEvent | null> => {
    const response = await fetch(`${CALENDAR_URL}/create-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    return data.success ? data.event : null;
  },

  // Delete event
  deleteEvent: async (eventId: string, userId: number): Promise<boolean> => {
    const response = await fetch(`${CALENDAR_URL}/delete-event/${eventId}?user_id=${userId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data.success;
  },

  // Sync schedule to Google Calendar
  syncScheduleToCalendar: async (userId: number, schedules: any[]): Promise<void> => {
    for (const schedule of schedules) {
      await calendarService.createEvent({
        user_id: userId,
        summary: schedule.subject || schedule.courseName,
        description: `Giảng viên: ${schedule.teacher || 'N/A'}`,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        location: schedule.room || schedule.location,
      });
    }
  },
};
