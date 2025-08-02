const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('./src/database/database');

let mainWindow;
let database;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Medical Clinic POS System'
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Initialize database
  database = new Database();
  await database.initialize();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('get-appointments', async () => {
  return await database.getAppointments();
});

ipcMain.handle('add-appointment', async (event, appointment) => {
  return await database.addAppointment(appointment);
});

ipcMain.handle('update-appointment', async (event, id, appointment) => {
  return await database.updateAppointment(id, appointment);
});

ipcMain.handle('delete-appointment', async (event, id) => {
  return await database.deleteAppointment(id);
});

ipcMain.handle('get-today-appointments', async () => {
  return await database.getTodayAppointments();
});

ipcMain.handle('add-billing-item', async (event, item) => {
  return await database.addBillingItem(item);
});

ipcMain.handle('get-billing-items', async () => {
  return await database.getBillingItems();
});

ipcMain.handle('create-bill', async (event, bill) => {
  return await database.createBill(bill);
});

ipcMain.handle('get-bills', async () => {
  return await database.getBills();
});
