const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/user.model');
const asyncHandler = require('express-async-handler');

// @desc    Get all calendar events for the logged in user
// @route   GET /api/calendar/events
// @access  Private
const getCalendarEvents = asyncHandler(async (req, res) => {
  try {
    // For sales managers, get events for all their agents
    // For sales agents, get only their own events
    let filter = {};
    
    if (req.user.role === 'salesmanager') {
      // Get all agents under this sales manager
      const agents = await User.find({ role: 'sales' });
      const agentIds = agents.map(agent => agent._id.toString());
      filter.agentId = { $in: agentIds };
    } else {
      // Regular sales agent - only their own events
      filter.agentId = req.user.id;
    }
    
    const events = await CalendarEvent.find(filter).sort({ start: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching calendar events", 
      error: error.message 
    });
  }
});

// @desc    Get calendar events by date range
// @route   GET /api/calendar/events/range
// @access  Private
const getCalendarEventsByRange = asyncHandler(async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let filter = {
      start: { $gte: new Date(start), $lte: new Date(end) }
    };
    
    if (req.user.role === 'salesmanager') {
      // Get all agents under this sales manager
      const agents = await User.find({ role: 'sales' });
      const agentIds = agents.map(agent => agent._id.toString());
      filter.agentId = { $in: agentIds };
    } else {
      // Regular sales agent - only their own events
      filter.agentId = req.user.id;
    }
    
    const events = await CalendarEvent.find(filter).sort({ start: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching calendar events by range", 
      error: error.message 
    });
  }
});

// @desc    Create a new calendar event
// @route   POST /api/calendar/events
// @access  Private
const createCalendarEvent = asyncHandler(async (req, res) => {
  try {
    const { title, start, end, description, type, agentId, agentName, location } = req.body;
    
    // Validate required fields
    if (!title || !start || !end) {
      res.status(400);
      throw new Error('Title, start, and end are required');
    }
    
    // For sales managers, they can assign events to agents
    // For sales agents, they can only create events for themselves
    let eventAgentId = agentId;
    let eventAgentName = agentName;
    
    if (req.user.role === 'salesmanager') {
      // Sales manager can assign to any agent
      if (agentId) {
        // Verify agent exists
        const agent = await User.findById(agentId);
        if (!agent || agent.role !== 'sales') {
          res.status(400);
          throw new Error('Invalid agent ID');
        }
        
        eventAgentId = agentId;
        eventAgentName = agent.fullName || agent.username;
      } else {
        // If no agentId provided, assign to the sales manager themselves
        eventAgentId = req.user.id;
        eventAgentName = req.user.fullName || req.user.username;
      }
    } else {
      // Regular sales agent - assign to themselves
      eventAgentId = req.user.id;
      eventAgentName = req.user.fullName || req.user.username;
    }
    
    const calendarEvent = new CalendarEvent({
      title,
      start: new Date(start),
      end: new Date(end),
      description,
      type: type || 'meeting',
      agentId: eventAgentId,
      agentName: eventAgentName,
      location,
      createdBy: req.user.id
    });
    
    const createdEvent = await calendarEvent.save();
    res.status(201).json(createdEvent);
  } catch (error) {
    res.status(500).json({ 
      message: "Error creating calendar event", 
      error: error.message 
    });
  }
});

// @desc    Update a calendar event
// @route   PUT /api/calendar/events/:id
// @access  Private
const updateCalendarEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, description, type, agentId, agentName, location } = req.body;
    
    const event = await CalendarEvent.findById(id);
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    
    // Check if user has permission to update this event
    if (req.user.role !== 'salesmanager' && event.agentId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this event');
    }
    
    // For sales managers, they can reassign events to different agents
    if (req.user.role === 'salesmanager') {
      if (agentId) {
        // Verify agent exists
        const agent = await User.findById(agentId);
        if (!agent || agent.role !== 'sales') {
          res.status(400);
          throw new Error('Invalid agent ID');
        }
        
        event.agentId = agentId;
        event.agentName = agent.fullName || agent.username;
      } else if (agentId === null || agentId === '') {
        // If agentId is explicitly set to null or empty, assign to the sales manager themselves
        event.agentId = req.user.id;
        event.agentName = req.user.fullName || req.user.username;
      }
      // If agentId is undefined, keep the current agent
    }
    
    // Update event fields
    if (title) event.title = title;
    if (start) event.start = new Date(start);
    if (end) event.end = new Date(end);
    if (description !== undefined) event.description = description;
    if (type) event.type = type;
    if (location !== undefined) event.location = location;
    
    event.updatedAt = Date.now();
    
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating calendar event", 
      error: error.message 
    });
  }
});

// @desc    Delete a calendar event
// @route   DELETE /api/calendar/events/:id
// @access  Private
const deleteCalendarEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await CalendarEvent.findById(id);
    
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }
    
    // Check if user has permission to delete this event
    if (req.user.role !== 'salesmanager' && event.agentId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to delete this event');
    }
    
    await event.remove();
    res.json({ message: 'Event removed' });
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting calendar event", 
      error: error.message 
    });
  }
});

module.exports = {
  getCalendarEvents,
  getCalendarEventsByRange,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
};