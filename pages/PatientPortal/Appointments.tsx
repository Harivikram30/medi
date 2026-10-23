import React, { useState, useMemo } from 'react';
import type { Appointment, User } from '../../types';
import TelemedicineModal from './TelemedicineModal';
import BookingModal from './BookingModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import EmptyState from '../../components/Common/EmptyState';
import { formatDisplayDate } from '../../services/dataSanitizer';

interface AppointmentsProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  onNavigateQueue?: () => void;
}

const Appointments: React.FC<AppointmentsProps> = ({ user, appointments, setAppointments, onNavigateQueue }) => {
  const patientAppointments = useMemo(() => {
    return (appointments || [])
      .filter(app => app && app.patientId === user?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, user?.id]);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [appointmentToCancelId, setAppointmentToCancelId] = useState<string | null>(null);

  const handleStartCall = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setTimeout(() => setNotificationMessage(''), 4000);
  };
  
  const handleAppointmentBooked = (details: {
    doctorId: string;
    doctorName: string;
    doctorSpecialization: string;
    date: string;
    time: string;
    accessibilityRequest?: any;
  }) => {
    const newAppointment: Appointment = {
      id: `app_${new Date().getTime()}`,
      patientId: user.id,
      patientName: user.name,
      ...details,
      status: 'Upcoming',
      type: 'New Consultation',
    };

    setAppointments(prevAppointments => {
        let updatedAppointments = prevAppointments;
        if (reschedulingAppointmentId) {
            updatedAppointments = updatedAppointments.map(app => 
                app.id === reschedulingAppointmentId 
                    ? { ...app, status: 'Cancelled' }
                    : app
            );
        }
        return [...updatedAppointments, newAppointment];
    });
    
    setBookingModalOpen(false);
    showNotification(reschedulingAppointmentId ? 'Your appointment has been successfully rescheduled.' : 'Your appointment has been booked successfully.');
    setReschedulingAppointmentId(null);
  };

  const handleReschedule = (appointmentId: string) => {
    setReschedulingAppointmentId(appointmentId);
    setBookingModalOpen(true);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToCancelId(appointmentId);
    setConfirmModalOpen(true);
  };

  const confirmCancelAppointment = () => {
    if (!appointmentToCancelId) return;

    setAppointments(prevAppointments => 
        prevAppointments.map(app => 
            app.id === appointmentToCancelId 
                ? { ...app, status: 'Cancelled' } 
                : app
        )
    );
    showNotification('Your appointment has been cancelled.');
    setConfirmModalOpen(false);
    setAppointmentToCancelId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text">Your Appointments</h2>
        <button 
          onClick={() => {
            setReschedulingAppointmentId(null);
            setBookingModalOpen(true);
          }}
          className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition"
        >
          Book New Appointment
        </button>
      </div>

      {notificationMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md animate-fadeIn dark:bg-green-900/50 dark:text-green-300" role="alert">
          <p className="font-bold">Success</p>
          <p>{notificationMessage}</p>
        </div>
      )}

      {onNavigateQueue && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 mb-6 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                At the hospital clinic today?
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Monitor your OPD token live with silent visual cues & vibration alerts via MediSilentAlert™.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateQueue}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3.5 rounded-lg shadow-sm transition whitespace-nowrap"
          >
            Open Live Queue & Alerts →
          </button>
        </div>
      )}

      <div className="space-y-6">
        {patientAppointments.length > 0 ? (
          patientAppointments.map(app => (
            <div key={app.id} className="bg-light dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className={`text-sm font-semibold ${
                    app.status === 'Upcoming' ? 'text-green-600 dark:text-green-400' : 
                    app.status === 'Cancelled' ? 'text-red-500 dark:text-red-400' : 
                    'text-gray-500 dark:text-gray-400'
                }`}>{app.status}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-dark-text">{app.doctorSpecialization} with {app.doctorName}</p>
                <p className="text-gray-600 dark:text-gray-300">{formatDisplayDate(app.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {app.time}</p>
                
                {app.accessibilityRequest && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                    {app.accessibilityRequest.wheelchairNeeded && (
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                        <span>♿</span> Wheelchair: {app.accessibilityRequest.wheelchairLocation || 'Requested'}
                      </span>
                    )}
                    {app.accessibilityRequest.writtenInstructions && (
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                        <span>📄</span> Written Instructions
                      </span>
                    )}
                    {app.accessibilityRequest.communicationSupport && app.accessibilityRequest.communicationSupport !== 'None' && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                        <span>🗣️</span> {app.accessibilityRequest.communicationSupport}
                      </span>
                    )}
                    {app.accessibilityRequest.assistanceNotes && (
                      <span className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded text-[11px] italic">
                        Note: "{app.accessibilityRequest.assistanceNotes}"
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 flex gap-2 flex-wrap justify-end">
                {app.status === 'Upcoming' && (
                  <>
                    <button onClick={() => handleStartCall(app)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-md text-sm hover:bg-green-600 transition-colors">Start Video Call</button>
                    <button onClick={() => handleReschedule(app.id)} className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-md text-sm hover:bg-primary/20 dark:hover:bg-primary/30">Reschedule</button>
                    <button onClick={() => handleCancelAppointment(app.id)} className="bg-red-100 text-red-700 font-semibold py-2 px-4 rounded-md text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">Cancel</button>
                  </>
                )}
                {app.status === 'Completed' && (
                  <button className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md text-sm cursor-not-allowed dark:bg-gray-600 dark:text-gray-300">View Summary</button>
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon="📅"
            title="No appointments scheduled"
            description="You do not have any upcoming consultations. You can book an appointment with our hospital specialists anytime."
            actionText="Book New Appointment"
            onAction={() => {
              setReschedulingAppointmentId(null);
              setBookingModalOpen(true);
            }}
          />
        )}
      </div>
      
      {selectedAppointment && (
        <TelemedicineModal
          appointment={selectedAppointment}
          onClose={handleCloseModal}
        />
      )}
      
      {isBookingModalOpen && (
        <BookingModal
          onClose={() => {
            setBookingModalOpen(false);
            setReschedulingAppointmentId(null);
          }}
          onAppointmentBooked={handleAppointmentBooked}
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
    </div>
  );
};

export default Appointments;
