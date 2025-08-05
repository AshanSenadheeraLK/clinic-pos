const { ipcRenderer } = require('electron');

class MedicalClinicPOS {
    constructor() {
        this.currentAppointment = null;
        this.appointments = [];
        this.bills = [];
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.displayCurrentDate();
        await this.loadData();
        await this.checkTodayAppointments();
        this.showSection('appointments');
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('appointmentsTab').addEventListener('click', () => this.showSection('appointments'));
        document.getElementById('billingTab').addEventListener('click', () => this.showSection('billing'));
        document.getElementById('reportsTab').addEventListener('click', () => this.showSection('reports'));

        // Appointment management
        document.getElementById('addAppointmentBtn').addEventListener('click', () => this.showAppointmentModal());
        document.getElementById('saveAppointmentBtn').addEventListener('click', () => this.saveAppointment());

        // Billing
        document.getElementById('billingForm').addEventListener('submit', (e) => this.handleBillingSubmit(e));
        document.getElementById('addItemBtn').addEventListener('click', () => this.addBillingItem());
        
        // Calculate total when items change
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-amount')) {
                this.calculateTotal();
            }
        });

        // Remove billing items
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-item') || e.target.parentElement.classList.contains('remove-item')) {
                this.removeBillingItem(e.target.closest('.billing-item'));
            }
        });
    }

    displayCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    async loadData() {
        try {
            this.appointments = await ipcRenderer.invoke('get-appointments');
            this.bills = await ipcRenderer.invoke('get-bills');
            this.renderAppointments();
            this.populateAppointmentSelect();
            this.updateReports();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async checkTodayAppointments() {
        try {
            const todayAppointments = await ipcRenderer.invoke('get-today-appointments');
            if (todayAppointments.length > 0) {
                this.showReminderModal(todayAppointments);
            }
        } catch (error) {
            console.error('Error checking today appointments:', error);
        }
    }

    showReminderModal(appointments) {
        const reminderContent = document.getElementById('reminderContent');
        
        if (appointments.length === 0) {
            reminderContent.innerHTML = '<p class="text-success"><i class="fas fa-check-circle me-2"></i>No appointments scheduled for today!</p>';
        } else {
            let content = `<div class="reminder-content">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>You have ${appointments.length} appointment${appointments.length > 1 ? 's' : ''} today:</h6>
            </div>`;
            
            appointments.forEach(appointment => {
                content += `
                    <div class="appointment-item">
                        <div class="appointment-time">${this.formatTime(appointment.time)}</div>
                        <div class="patient-name">${appointment.patientName}</div>
                        <div class="doctor-name">Dr. ${appointment.doctorName}</div>
                        <div class="text-muted">${appointment.reasonForVisit}</div>
                    </div>
                `;
            });
            
            reminderContent.innerHTML = content;
        }
        
        const reminderModal = new bootstrap.Modal(document.getElementById('reminderModal'));
        reminderModal.show();
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Remove active class from all tabs
        document.querySelectorAll('.list-group-item').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName + 'Section').style.display = 'block';
        document.getElementById(sectionName + 'Tab').classList.add('active');

        // Update data for specific sections
        if (sectionName === 'reports') {
            this.updateReports();
        } else if (sectionName === 'billing') {
            this.populateAppointmentSelect();
        }
    }

    showAppointmentModal(appointment = null) {
        const modal = new bootstrap.Modal(document.getElementById('appointmentModal'));
        const title = document.getElementById('appointmentModalTitle');
        
        if (appointment) {
            title.textContent = 'Edit Appointment';
            this.currentAppointment = appointment;
            this.populateAppointmentForm(appointment);
        } else {
            title.textContent = 'Add New Appointment';
            this.currentAppointment = null;
            this.clearAppointmentForm();
        }
        
        modal.show();
    }

    populateAppointmentForm(appointment) {
        document.getElementById('appointmentId').value = appointment.id || '';
        document.getElementById('patientName').value = appointment.patientName || '';
        document.getElementById('doctorName').value = appointment.doctorName || '';
        document.getElementById('reasonForVisit').value = appointment.reasonForVisit || '';
        document.getElementById('appointmentDate').value = appointment.date || '';
        document.getElementById('appointmentTime').value = appointment.time || '';
    }

    clearAppointmentForm() {
        document.getElementById('appointmentForm').reset();
        document.getElementById('appointmentId').value = '';
    }

    async saveAppointment() {
        const form = document.getElementById('appointmentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const appointmentData = {
            patientName: document.getElementById('patientName').value,
            doctorName: document.getElementById('doctorName').value,
            reasonForVisit: document.getElementById('reasonForVisit').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value
        };

        try {
            const appointmentId = document.getElementById('appointmentId').value;
            
            if (appointmentId) {
                await ipcRenderer.invoke('update-appointment', parseInt(appointmentId), appointmentData);
            } else {
                await ipcRenderer.invoke('add-appointment', appointmentData);
            }

            await this.loadData();
            const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
            modal.hide();
            this.showAlert('Appointment saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving appointment:', error);
            this.showAlert('Error saving appointment. Please try again.', 'danger');
        }
    }

    async deleteAppointment(id) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            try {
                await ipcRenderer.invoke('delete-appointment', id);
                await this.loadData();
                this.showAlert('Appointment deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting appointment:', error);
                this.showAlert('Error deleting appointment. Please try again.', 'danger');
            }
        }
    }

    renderAppointments() {
        const tbody = document.getElementById('appointmentsList');
        tbody.innerHTML = '';

        if (this.appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No appointments found</td></tr>';
            return;
        }

        this.appointments.forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${appointment.patientName}</td>
                <td>Dr. ${appointment.doctorName}</td>
                <td>${appointment.reasonForVisit}</td>
                <td>${this.formatDate(appointment.date)}</td>
                <td>${appointment.time}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="app.showAppointmentModal(${JSON.stringify(appointment).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteAppointment(${appointment.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    populateAppointmentSelect() {
        const select = document.getElementById('appointmentSelect');
        select.innerHTML = '<option value="">Select appointment...</option>';

        this.appointments.forEach(appointment => {
            const option = document.createElement('option');
            option.value = appointment.id;
            option.textContent = `${appointment.patientName} - ${this.formatDate(appointment.date)} ${appointment.time}`;
            select.appendChild(option);
        });
    }

    addBillingItem() {
        const container = document.getElementById('billingItems');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'billing-item mb-2';
        itemDiv.innerHTML = `
            <div class="row">
                <div class="col-7">
                    <input type="text" class="form-control item-name" placeholder="Item/Service name" required>
                </div>
                <div class="col-4">
                    <input type="number" class="form-control item-amount" placeholder="Amount" step="0.01" required>
                </div>
                <div class="col-1">
                    <button type="button" class="btn btn-sm btn-danger remove-item">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(itemDiv);
        this.calculateTotal();
    }

    removeBillingItem(itemElement) {
        itemElement.remove();
        this.calculateTotal();
    }

    calculateTotal() {
        const amounts = document.querySelectorAll('.item-amount');
        let total = 0;
        
        amounts.forEach(input => {
            const value = parseFloat(input.value) || 0;
            total += value;
        });
        
        document.getElementById('totalAmount').value = `₹${total.toFixed(2)}`;
        this.updateBillPreview();
    }

    updateBillPreview() {
        const appointmentSelect = document.getElementById('appointmentSelect');
        const selectedAppointment = this.appointments.find(apt => apt.id == appointmentSelect.value);
        
        if (!selectedAppointment) {
            document.getElementById('billContent').innerHTML = '<p class="text-muted">Select an appointment to preview bill...</p>';
            return;
        }

        const items = [];
        const itemNames = document.querySelectorAll('.item-name');
        const itemAmounts = document.querySelectorAll('.item-amount');
        
        let total = 0;
        for (let i = 0; i < itemNames.length; i++) {
            const name = itemNames[i].value;
            const amount = parseFloat(itemAmounts[i].value) || 0;
            if (name && amount > 0) {
                items.push({ name, amount });
                total += amount;
            }
        }

        let billContent = `
            <div class="mb-3">
                <strong>Patient:</strong> ${selectedAppointment.patientName}<br>
                <strong>Doctor:</strong> Dr. ${selectedAppointment.doctorName}<br>
                <strong>Date:</strong> ${this.formatDate(selectedAppointment.date)}<br>
                <strong>Time:</strong> ${selectedAppointment.time}
            </div>
            <hr>
            <div class="mb-3">
                <h6>Services & Items:</h6>
        `;

        if (items.length === 0) {
            billContent += '<p class="text-muted">No items added yet...</p>';
        } else {
            items.forEach(item => {
                billContent += `
                    <div class="d-flex justify-content-between">
                        <span>${item.name}</span>
                        <span>₹${item.amount.toFixed(2)}</span>
                    </div>
                `;
            });
        }

        billContent += `
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <strong>Total Amount:</strong>
                <strong>₹${total.toFixed(2)}</strong>
            </div>
        `;

        document.getElementById('billContent').innerHTML = billContent;
    }

    async handleBillingSubmit(e) {
        e.preventDefault();
        
        const appointmentId = document.getElementById('appointmentSelect').value;
        if (!appointmentId) {
            this.showAlert('Please select an appointment', 'danger');
            return;
        }

        const items = [];
        const itemNames = document.querySelectorAll('.item-name');
        const itemAmounts = document.querySelectorAll('.item-amount');
        
        for (let i = 0; i < itemNames.length; i++) {
            const name = itemNames[i].value;
            const amount = parseFloat(itemAmounts[i].value) || 0;
            if (name && amount > 0) {
                items.push({ name, amount });
            }
        }

        if (items.length === 0) {
            this.showAlert('Please add at least one item', 'danger');
            return;
        }

        try {
            const bill = {
                appointmentId: parseInt(appointmentId),
                items: items
            };

            await ipcRenderer.invoke('create-bill', bill);
            await this.loadData();
            
            document.getElementById('billingForm').reset();
            document.getElementById('billingItems').innerHTML = `
                <div class="billing-item mb-2">
                    <div class="row">
                        <div class="col-7">
                            <input type="text" class="form-control item-name" placeholder="Item/Service name" required>
                        </div>
                        <div class="col-4">
                            <input type="number" class="form-control item-amount" placeholder="Amount" step="0.01" required>
                        </div>
                        <div class="col-1">
                            <button type="button" class="btn btn-sm btn-danger remove-item">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            this.calculateTotal();
            this.showAlert('Bill generated successfully!', 'success');
        } catch (error) {
            console.error('Error creating bill:', error);
            this.showAlert('Error generating bill. Please try again.', 'danger');
        }
    }

    updateReports() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(apt => apt.date === today);
        
        document.getElementById('totalAppointments').textContent = this.appointments.length;
        document.getElementById('todayAppointments').textContent = todayAppointments.length;
        document.getElementById('totalBills').textContent = this.bills.length;
    }

    formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timeString) {
        const date = new Date(`1970-01-01T${timeString}`);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize the application
const app = new MedicalClinicPOS();
