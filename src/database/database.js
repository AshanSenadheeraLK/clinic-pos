const sqlite3 = require('sqlite3');
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, 'database.db');
        this.db = null;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(`Failed to connect to the database: ${err}`);
                } else {
                    this.setupTables()
                        .then(resolve)
                        .catch(reject);
                }
            });
        });
    }

    setupTables() {
        const appointmentsTable = `CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patientName TEXT,
            doctorName TEXT,
            reasonForVisit TEXT,
            date TEXT,
            time TEXT
        )`;

        const billingTable = `CREATE TABLE IF NOT EXISTS billing (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointmentId INTEGER,
            itemName TEXT,
            amount REAL,
            FOREIGN KEY(appointmentId) REFERENCES appointments(id)
        )`;

        return Promise.all([
            this.run(appointmentsTable),
            this.run(billingTable)
        ]);
    }

    run(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }
            });
        });
    }

    get(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Appointment operations
    async addAppointment(appointment) {
        const query = `INSERT INTO appointments (patientName, doctorName, reasonForVisit, date, time)
                      VALUES (?, ?, ?, ?, ?)`;
        const params = [appointment.patientName, appointment.doctorName, appointment.reasonForVisit, appointment.date, appointment.time];
        return await this.run(query, params);
    }

    async getAppointments() {
        const query = `SELECT * FROM appointments ORDER BY date ASC, time ASC`;
        return await this.all(query);
    }

    async updateAppointment(id, appointment) {
        const query = `UPDATE appointments 
                      SET patientName = ?, doctorName = ?, reasonForVisit = ?, date = ?, time = ?
                      WHERE id = ?`;
        const params = [appointment.patientName, appointment.doctorName, appointment.reasonForVisit, appointment.date, appointment.time, id];
        return await this.run(query, params);
    }

    async deleteAppointment(id) {
        const query = `DELETE FROM appointments WHERE id = ?`;
        return await this.run(query, [id]);
    }

    async getTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        const query = `SELECT * FROM appointments WHERE date = ? ORDER BY time ASC`;
        return await this.all(query, [today]);
    }

    // Billing operations
    async addBillingItem(item) {
        const query = `INSERT INTO billing (appointmentId, itemName, amount)
                      VALUES (?, ?, ?)`;
        const params = [item.appointmentId, item.itemName, item.amount];
        return await this.run(query, params);
    }

    async getBillingItems() {
        const query = `SELECT * FROM billing`;
        return await this.all(query);
    }

    async createBill(bill) {
        const promises = bill.items.map(item => 
            this.addBillingItem({
                appointmentId: bill.appointmentId,
                itemName: item.name,
                amount: item.amount
            })
        );
        return await Promise.all(promises);
    }

    async getBills() {
        const query = `SELECT b.*, a.patientName, a.date
                      FROM billing b
                      LEFT JOIN appointments a ON b.appointmentId = a.id
                      ORDER BY a.date DESC`;
        return await this.all(query);
    }

}

module.exports = Database;
