import React, { useState } from 'react';
import type { Appointment } from '../../types';

interface RescheduleModalProps {
    appointment: Appointment;
    onSave: (appointmentId: string, newDate: string, newTime: string) => void;
    onClose: () => void;
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const RescheduleModal: React.FC<RescheduleModalProps> = ({ appointment, onSave, onClose }) => {
    const [date, setDate] = useState(appointment.date);
    const [time, setTime] = useState(appointment.time);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !time) {
            setError('Please select a new date and time.');
            return;
        }
        setError('');
        onSave(appointment.id, date, time);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">Reschedule Appointment</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">Patient: <span className="font-semibold">{appointment.patientName}</span></p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Doctor: <span className="font-semibold">{appointment.doctorName}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Date</label>
                        <input
                            type="date"
                            id="reschedule-date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Time</label>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                             {timeSlots.map(slot => (
                                <button
                                    type="button"
                                    key={slot}
                                    onClick={() => setTime(slot)}
                                    className={`py-2 px-1 rounded-md text-xs font-semibold transition-colors ${
                                        time === slot
                                        ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary ring-offset-white dark:ring-offset-dark-card'
                                        : 'bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RescheduleModal;