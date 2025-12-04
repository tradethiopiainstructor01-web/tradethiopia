import axiosInstance from './axiosInstance';
import { getAllAgents } from './salesManagerService';

// Get all calendar events
export const getCalendarEvents = async () => {
  try {
    const response = await axiosInstance.get('/calendar/events');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get calendar events by date range
export const getCalendarEventsByRange = async (start, end) => {
  try {
    const response = await axiosInstance.get(`/calendar/events/range?start=${start}&end=${end}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new calendar event
export const createCalendarEvent = async (eventData) => {
  try {
    const response = await axiosInstance.post('/calendar/events', eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a calendar event
export const updateCalendarEvent = async (id, eventData) => {
  try {
    const response = await axiosInstance.put(`/calendar/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (id) => {
  try {
    const response = await axiosInstance.delete(`/calendar/events/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all agents
export const getAgents = async () => {
  try {
    const agents = await getAllAgents();
    return agents;
  } catch (error) {
    throw error;
  }
};