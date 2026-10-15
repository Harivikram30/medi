import React, { useState, useMemo } from 'react';
import type { Appointment } from '../../types';
import RescheduleModal from './RescheduleModal';
import ConfirmationModal from '../ConfirmationModal';

interface AppointmentManagementProps {
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AppointmentManagement: React.FC<AppointmentManagementProps> = ({ appointments, setAppointments }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Completed' | 'Cancelled'>('All');
    const [notification, setNotification] = useState<string | null>(null);
    const [isRescheduleModalOpen, setRescheduleModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 4000);
    };

    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(app => {
                if (statusFilter === 'All') return true;
                return app.status === statusFilter;
            })
            .filter(app => 
                app.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                app.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [appointments, searchTerm, statusFilter]);

    const handleCancelAppointment = (appointmentId: string) => {
        setAppointmentToCancelId(appointmentId);
        setConfirmModalOpen(true);
    };

    const confirmCancelAppointment = () => {
        if (!appointmentToCancelId) return;
        const appointmentToCancel = appointments.find(app => app.id === appointmentToCancelId);
        setAppointments(prevAppointments =>
            prevAppointments.map(app =>
                app.id === appointmentToCancelId
                    ? { ...app, status: 'Cancelled' }
                    : app
            )
        );
        if (appointmentToCancel) {
            showNotification(`Appointment for ${appointmentToCancel.patientName} has been cancelled.`);
        }
        setConfirmModalOpen(false);
        setAppointmentToCancelId(null);
    };
    
    const handleOpenRescheduleModal = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setRescheduleModalOpen(true);
    };

    const handleSaveReschedule = (appointmentId: string, newDate: string, newTime: string) => {
        setAppointments(prevAppointments =>
            prevAppointments.map(app =>
                app.id === appointmentId
                    ? { ...app, date: newDate, time: newTime }
                    : app
            )
        );
        setRescheduleModalOpen(false);
        showNotification(`Appointment for ${editingAppointment?.patientName} has been rescheduled.`);
        setEditingAppointment(null);
    };

    const getStatusClass = (status: Appointment['status']) => {
        switch (status) {
            case 'Upcoming': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    };
    
    const NotificationBanner = () => (
        notification && (
            <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-[60]">
                {notification}
            </div>
        )
    );

    return (
        <>
            <NotificationBanner />
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Appointment Management</h2>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-light dark:bg-dark-bg rounded-md">
                    <input
                        type="text"
                        placeholder="Search by patient or doctor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="w-full sm:w-1/4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-light dark:bg-dark-bg">
                            <tr>
                                {['Date & Time', 'Patient', 'Accessibility Requests', 'Doctor', 'Type', 'Status', 'Actions'].map(h =>
                                    <th key={h} className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-dark-text">
                            {filteredAppointments.map(app => (
                                <tr key={app.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                                    <td className="py-2 px-3">{app.date} @ {app.time}</td>
                                    <td className="py-2 px-3 font-medium">{app.patientName}</td>
                                    <td className="py-2 px-3">
                                        {app.accessibilityRequest ? (
                                            <div className="flex flex-col gap-1 text-xs">
                                                {app.accessibilityRequest.wheelchairNeeded && (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                                        <span>♿</span> Wheelchair: {app.accessibilityRequest.wheelchairLocation || 'Assistance'}
                                                    </span>
                                                )}
                                                {app.accessibilityRequest.writtenInstructions && (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                                        <span>📄</span> Written Summary
                                                    </span>
                                                )}
                                                {app.accessibilityRequest.communicationSupport && app.accessibilityRequest.communicationSupport !== 'None' && (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                        <span>🗣️</span> {app.accessibilityRequest.communicationSupport}
                                                    </span>
                                                )}
                                                {app.accessibilityRequest.assistanceNotes && (
                                                    <span className="text-[11px] text-gray-500 italic">
                                                        "{app.accessibilityRequest.assistanceNotes}"
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">None</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-3">{app.doctorName}</td>
                                    <td className="py-2 px-3">{app.type}</td>
                                    <td className="py-2 px-3">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-3">
                                        {app.status === 'Upcoming' && (
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => handleOpenRescheduleModal(app)}
                                                    className="text-primary hover:underline text-sm font-semibold"
                                                >
                                                    Reschedule
                                                </button>
                                                <button 
                                                    onClick={() => handleCancelAppointment(app.id)}
                                                    className="text-red-500 hover:underline text-sm font-semibold"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredAppointments.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">No appointments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isRescheduleModalOpen && editingAppointment && (
                <RescheduleModal
                    appointment={editingAppointment}
                    onSave={handleSaveReschedule}
                    onClose={() => {
                        setRescheduleModalOpen(false);
                        setEditingAppointment(null);
                    }}
                />
            )}
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setConfirmModalOpen(false)}
                    onConfirm={confirmCancelAppointment}
                    title="Cancel Appointment"
                    message="Are you sure you want to cancel this appointment? This action cannot be undone."
                    confirmText="Yes, Cancel"
                    cancelText="No, Keep It"
                />
            )}
        </>
    );
};

export default AppointmentManagement;
