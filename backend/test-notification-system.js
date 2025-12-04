const mongoose = require('mongoose');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
const User = require('./models/user.model');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tradethiopia', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Test function to create a task and check if notification is created
async function testNotificationCreation() {
  try {
    // Find a sales user and a sales manager user for testing
    const salesUser = await User.findOne({ role: 'sales' });
    const salesManagerUser = await User.findOne({ role: 'salesmanager' });
    
    if (!salesUser || !salesManagerUser) {
      console.log('Could not find sales user or sales manager user for testing');
      return;
    }
    
    console.log('Sales User:', salesUser.username);
    console.log('Sales Manager User:', salesManagerUser.username);
    
    // Create a test task
    const task = new Task({
      title: 'Test Task',
      description: 'This is a test task for notification verification',
      assignedTo: salesUser._id,
      assignedBy: salesManagerUser._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'Medium'
    });
    
    const createdTask = await task.save();
    console.log('Created task:', createdTask.title);
    
    // Check if notification was created
    const notification = await Notification.findOne({ taskId: createdTask._id });
    if (notification) {
      console.log('Notification created successfully:');
      console.log('  Text:', notification.text);
      console.log('  User:', notification.user);
      console.log('  Read:', notification.read);
    } else {
      console.log('No notification found for the created task');
    }
    
    // Check all notifications for the sales user
    const userNotifications = await Notification.find({ user: salesUser._id });
    console.log(`Found ${userNotifications.length} notifications for the sales user:`);
    userNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.text} - Read: ${notif.read}`);
    });
    
    // Clean up - delete the test task and notification
    await Task.findByIdAndDelete(createdTask._id);
    if (notification) {
      await Notification.findByIdAndDelete(notification._id);
    }
    
    console.log('Test completed and cleaned up');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

testNotificationCreation();