# Sales Manager Data Seeding Script

This script generates comprehensive test data for the Sales Manager dashboard and all related pages.

## 📋 What Data is Generated

### 1. **Users**
- **1 Sales Manager** (role: `salesmanager`)
  - Email: `salesmanager@tradethiopia.com`
  - Password: `password123` (you should hash this properly)
  
- **12 Sales Agents** (role: `sales`)
  - Realistic Ethiopian names
  - Complete profile information
  - Active status

### 2. **Sales Customers** (150 records)
- Realistic Ethiopian customer names and company names
- Multiple courses assigned
- Various follow-up statuses: Prospect, Pending, Completed, Scheduled, Cancelled
- Call statuses: Called, Not Called, Busy, No Answer, Callback
- Schedule preferences: Regular, Weekend, Night, Online
- Phone numbers, emails, and notes
- Some with supervisor comments
- Dates spread over the last 90 days

### 3. **Tasks** (50 records)
- Assigned to various agents
- Different priorities: Low, Medium, High, Urgent
- Multiple statuses: Pending, In Progress, Completed, Cancelled
- Realistic task titles and descriptions
- Due dates ranging from past to future
- Completion dates for completed tasks

### 4. **Calendar Events** (40 records)
- Different event types: meeting, call, training, deadline, other
- Assigned to agents
- Start and end times
- Locations (office, virtual, client location)
- Events spread across past and future dates

### 5. **Sales Targets** (24 records)
- Weekly targets for each agent (current week)
- Monthly targets for each agent (current month)
- Target amounts: 50k-100k (weekly), 200k-400k (monthly)

### 6. **Notifications** (36-60 records)
- 3-5 notifications per agent
- Mix of read and unread notifications
- Different types: general, task, target
- Notifications from the last 7 days

## 🚀 How to Run

### Prerequisites
1. MongoDB running and accessible
2. `.env` file configured with `MONGODB_URI`
3. All dependencies installed (`npm install`)

### Run the Seed Script

```bash
cd backend
npm run seed:salesmanager
```

Or directly:

```bash
cd backend
node seedSalesManagerData.js
```

## ⚠️ Important Notes

1. **Data Clearing**: The script will **DELETE ALL EXISTING** sales manager data before seeding:
   - All SalesCustomer records
   - All Task records
   - All CalendarEvent records
   - All SalesTarget records
   - All Notification records for sales agents

2. **Password Hashing**: The script uses a placeholder password hash. Before production use, update line 267-268 with properly hashed passwords using bcrypt.

3. **Existing Users**: If sales agents or the sales manager already exist in your database, the script will use them instead of creating new ones.

## 📊 Expected Output

After successful execution, you should see:

```
🌱 Starting data seeding...

1️⃣ Creating Sales Manager...
✅ Created Sales Manager: salesmanager@tradethiopia.com

2️⃣ Creating Sales Agents...
✅ Total 12 agents ready

3️⃣ Clearing existing Sales Manager data...
✅ Existing data cleared

4️⃣ Generating Sales Customers...
✅ Created 150 sales customers

5️⃣ Generating Tasks...
✅ Created 50 tasks

6️⃣ Generating Calendar Events...
✅ Created 40 calendar events

7️⃣ Generating Sales Targets...
✅ Created 24 sales targets

8️⃣ Generating Notifications...
✅ Created 45 notifications

🎉 Data seeding completed successfully!

📊 Summary:
   • Sales Manager: 1
   • Sales Agents: 12
   • Customers: 150
   • Tasks: 50
   • Calendar Events: 40
   • Sales Targets: 24
   • Notifications: 45

✅ All done! You can now test the Sales Manager dashboard.

🔌 Database connection closed
```

## 🎯 Testing the Dashboard

After seeding the data:

1. **Login** as Sales Manager:
   - Email: `salesmanager@tradethiopia.com`
   - Password: `password123`

2. **Navigate** to: `http://localhost:3001/salesmanager`

3. **Test all pages**:
   - ✅ Dashboard - View stats and charts
   - ✅ All Sales - See 150 customer records with filters
   - ✅ Performance - Team performance metrics
   - ✅ Team Management - 12 agents with targets
   - ✅ Task Management - 50 tasks assigned to agents
   - ✅ Reports - Comprehensive reports
   - ✅ Calendar - 40 events scheduled
   - ✅ Settings - Profile settings
   - ✅ Notifications - Real notifications in navbar

## 🔧 Customization

You can modify the script to:

- Change the number of records (lines 267-273)
- Add more courses (lines 13-24)
- Modify Ethiopian names (lines 27-32)
- Adjust company names (lines 35-41)
- Change date ranges
- Add custom data fields

## 🐛 Troubleshooting

**MongoDB Connection Error:**
```bash
# Check if MongoDB is running
# Verify MONGODB_URI in .env file
```

**Duplicate Key Errors:**
```bash
# The script clears existing data, but if you commented out that section,
# you may get duplicate key errors. Run the script again or manually clear the collections.
```

**Permission Issues:**
```bash
# Ensure your MongoDB user has write permissions
```

## 📝 Data Statistics

- **Total Records**: ~310 records
- **Time Period**: Data spans 90 days (past) to 45 days (future)
- **Realistic Names**: Ethiopian names and companies
- **Course Variety**: 10 different training courses
- **Comprehensive Coverage**: All Sales Manager features populated

---

**Created by**: AI Assistant  
**Version**: 1.0.0  
**Last Updated**: December 8, 2024
