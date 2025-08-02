# Medical Clinic POS System

A desktop application built with Electron.js for managing a private medical clinic's appointments and point-of-sale operations offline.

## Features

### 🗓️ Appointment Management
- Create, edit, and delete patient appointments
- View all upcoming appointments in a clean table format
- Search and filter appointments
- Patient and doctor information management

### 💰 Billing & POS System
- Create bills linked to appointments
- Add multiple services and items to bills
- Real-time bill preview with totals
- Professional invoice generation

### 🔔 Daily Reminder System
- **Automatic daily appointment reminders** (Key Feature)
- Shows prominent notifications when the app launches
- Displays all appointments scheduled for the current day
- Clear overview of patient names, doctors, and appointment times

### 📊 Reports & Analytics
- Overview of total appointments
- Today's appointment count
- Total bills generated
- Quick statistics dashboard

## Screenshots

### Main Dashboard
![Main Dashboard](screenshots/dashboard.png)

### Appointment Management
![Appointments](screenshots/appointments.png)

### Billing System
![Billing](screenshots/billing.png)

### Daily Reminder
![Daily Reminder](screenshots/reminder.png)

## Technical Specifications

- **Framework**: Electron.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Database**: SQLite (for offline data storage)
- **Architecture**: Main process + Renderer process with IPC communication

## Prerequisites

Before running this application, make sure you have:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## Installation & Setup

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd medical-clinic-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

   Or for development mode with DevTools:
   ```bash
   npm run dev
   ```

## Project Structure

```
medical-clinic-pos/
├── main.js                      # Main Electron process
├── package.json                 # Project configuration
├── README.md                    # This file
├── src/
│   ├── database/
│   │   └── database.js          # SQLite database operations
│   └── renderer/
│       ├── index.html           # Main UI
│       ├── css/
│       │   └── styles.css       # Custom styles
│       └── js/
│           └── app.js           # Frontend JavaScript
└── assets/
    └── (application assets)
```

## Usage Instructions

### First Launch
When you first launch the application, it will:
1. Create a local SQLite database
2. Set up the necessary tables for appointments and billing
3. Display the main dashboard

### Adding Appointments
1. Click on "Appointments" in the sidebar
2. Click the "New Appointment" button
3. Fill in the patient details:
   - Patient Name
   - Doctor's Name
   - Reason for Visit
   - Date
   - Time
4. Click "Save Appointment"

### Daily Reminders
- **Every time you launch the app**, it automatically checks for appointments scheduled for today
- If appointments are found, a prominent modal will display showing:
  - Number of appointments
  - Patient names
  - Doctor names
  - Appointment times
  - Reasons for visits

### Creating Bills
1. Go to the "Billing" section
2. Select an appointment from the dropdown
3. Add services/items with their amounts
4. The bill preview updates in real-time
5. Click "Generate Bill" to save

### Viewing Reports
- Click on "Reports" to see overview statistics
- View total appointments, today's appointments, and bills generated

## Database

The application uses SQLite for offline data storage. The database file (`database.db`) will be created automatically in the `src/database/` directory when you first run the application.

### Database Schema

**Appointments Table:**
- id (Primary Key)
- patientName
- doctorName
- reasonForVisit
- date
- time

**Billing Table:**
- id (Primary Key)
- appointmentId (Foreign Key)
- itemName
- amount

## Development

### Adding New Features
1. Database changes: Modify `src/database/database.js`
2. UI changes: Update `src/renderer/index.html` and `src/renderer/css/styles.css`
3. Functionality: Add to `src/renderer/js/app.js`
4. IPC communication: Update `main.js` for new IPC handlers

### Building for Distribution
To package the application for distribution, you can use electron-builder:

```bash
npm install electron-builder --save-dev
npm run build
```

## Troubleshooting

### Common Issues

1. **SQLite errors on startup**
   - Make sure the `src/database/` directory has write permissions
   - Delete the existing `database.db` file to reset the database

2. **Blank screen on startup**
   - Check the console for JavaScript errors
   - Ensure all dependencies are installed properly

3. **IPC communication errors**
   - Restart the application
   - Check that main.js and app.js are using consistent IPC channel names

### Support
If you encounter any issues, please check:
1. Console errors in DevTools (F12)
2. Main process logs in the terminal
3. File permissions for database operations

## License

This project is licensed under the ISC License - see the package.json file for details.

## Author

KDJ Team

---

**Note**: This is an offline application. All data is stored locally on your machine and does not require an internet connection to function.
