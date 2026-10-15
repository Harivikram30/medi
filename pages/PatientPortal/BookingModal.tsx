import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_DOCTORS, VERIFIED_ACCESSIBILITY_FACILITIES } from '../../constants';
import type { AccessibilityRequest, WheelchairLocation, CommunicationSupportType } from '../../types';

interface BookingModalProps {
  onClose: () => void;
  onAppointmentBooked: (details: {
    doctorId: string;
    doctorName: string;
    doctorSpecialization: string;
    date: string;
    time: string;
    accessibilityRequest?: AccessibilityRequest;
  }) => void;
}

// Generate some sample time slots
const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
];

// Helper function to parse time string like "02:00 PM" into 24-hour format hours and minutes
const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) { // Handle midnight case
      hours = 0;
    }
    return { hours, minutes };
};


const BookingModal: React.FC<BookingModalProps> = ({ onClose, onAppointmentBooked }) => {
  const specializations = useMemo(() => [...new Set(MOCK_DOCTORS.map(d => d.specialization))], []);

  const [selectedSpecialization, setSelectedSpecialization] = useState<string>(specializations[0] || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Accessibility and Assistance Request state
  const [wheelchairNeeded, setWheelchairNeeded] = useState<boolean>(false);
  const [wheelchairLocation, setWheelchairLocation] = useState<WheelchairLocation>('Main Entrance Ramps');
  const [writtenInstructions, setWrittenInstructions] = useState<boolean>(false);
  const [communicationSupport, setCommunicationSupport] = useState<CommunicationSupportType>('None');
  const [assistanceNotes, setAssistanceNotes] = useState<string>('');
  const [showVerifiedFacilities, setShowVerifiedFacilities] = useState<boolean>(false);

  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter(d => d.specialization === selectedSpecialization);
  }, [selectedSpecialization]);

  // Reset selected doctor when specialization changes
  useEffect(() => {
    setSelectedDoctorId('');
  }, [selectedSpecialization]);
  
  // Reset time when date changes to ensure a valid slot is re-selected
  useEffect(() => {
    setTime('');
  }, [date]);

  const availableTimeSlots = useMemo(() => {
    if (!date) return [];

    const now = new Date();
    // Use T00:00:00 to compare dates without being affected by timezones
    const selectedDate = new Date(date + 'T00:00:00'); 
    
    // Check if the selected date is today
    if (selectedDate.toDateString() === now.toDateString()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Filter out past time slots for today
      return timeSlots.filter(slot => {
        const { hours: slotHour, minutes: slotMinute } = parseTime(slot);
        if (slotHour > currentHour) {
          return true;
        }
        if (slotHour === currentHour && slotMinute > currentMinute) {
          return true;
        }
        return false;
      });
    }

    // If selected date is in the future, all slots are available
    return timeSlots;
  }, [date]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !date || !time) {
      setError('Please select a doctor, date, and a time slot.');
      return;
    }

    // Secondary check to prevent booking past appointments, e.g., if the modal was left open
    const now = new Date();
    const { hours, minutes } = parseTime(time);
    const finalSelectedDateTime = new Date(date);
    finalSelectedDateTime.setHours(hours, minutes, 0, 0);

    if (finalSelectedDateTime <= now) {
        setError("You cannot book an appointment for a past time. Please choose a future time.");
        // Also clear the invalid time to force re-selection
        setTime('');
        return;
    }
    
    setError('');
    
    const selectedDoctor = MOCK_DOCTORS.find(d => d.id === selectedDoctorId);
    if (!selectedDoctor) {
        setError('Selected doctor not found.');
        return;
    }

    const accessibilityRequest: AccessibilityRequest | undefined = (wheelchairNeeded || writtenInstructions || communicationSupport !== 'None' || assistanceNotes.trim()) ? {
      wheelchairNeeded,
      wheelchairLocation: wheelchairNeeded ? wheelchairLocation : undefined,
      writtenInstructions,
      communicationSupport,
      assistanceNotes: assistanceNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    } : undefined;

    onAppointmentBooked({
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialization: selectedDoctor.specialization,
      date,
      time,
      accessibilityRequest,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Book a New Appointment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
          {/* Step 1: Specialization */}
          <div>
            <label htmlFor="specialization" className="block text-lg font-medium text-gray-700 dark:text-gray-300">1. Select Specialization</label>
            <select
              id="specialization"
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Doctor Selection */}
          <div>
            <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">2. Select a Doctor</label>
            <div className="mt-2 space-y-4 max-h-64 overflow-y-auto p-2 border rounded-md dark:border-gray-600 bg-light/50 dark:bg-dark-bg/50">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`p-4 rounded-lg flex items-start gap-4 cursor-pointer transition-all duration-200 ${
                      selectedDoctorId === doctor.id
                        ? 'bg-primary/10 border-2 border-primary shadow-md'
                        : 'bg-white dark:bg-dark-card border border-transparent dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    <img src={doctor.imageUrl} alt={doctor.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900 dark:text-dark-text">{doctor.name}</h4>
                      <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{doctor.bio}</p>
                      <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 inline-block px-2 py-1 rounded">
                        Availability: {doctor.availability}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 p-4">No doctors available for this specialization.</p>
              )}
            </div>
          </div>

          {/* Step 3: Date & Time */}
          {selectedDoctorId && (
             <div className="animate-fadeIn">
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300">3. Select Date & Time</label>
              <div className="mt-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} // Today's date
                  className="block w-full sm:w-1/2 shadow-sm sm:text-sm border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
              {date && (
                <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Available Slots</h4>
                    {availableTimeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableTimeSlots.map(slot => (
                                <button
                                    type="button"
                                    key={slot}
                                    onClick={() => setTime(slot)}
                                    className={`py-2 px-3 rounded-md text-sm font-semibold transition-colors ${
                                        time === slot
                                        ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary ring-offset-white dark:ring-offset-dark-card'
                                        : 'bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30'
                                    }`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                            No available slots for today. Please select a future date.
                        </p>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Accessibility & Assistance Requests (Optional) */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>♿</span> 4. Accessibility & Assistance Requests (Optional)
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Notify authorized clinical and orderly staff of mobility, communication, or printed instruction requirements prior to your visit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVerifiedFacilities(!showVerifiedFacilities)}
                className="text-xs font-semibold text-primary dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>🏛️</span> {showVerifiedFacilities ? 'Hide Facilities' : 'View Verified Accessibility Facilities'}
              </button>
            </div>

            {/* Verified Facilities Display */}
            {showVerifiedFacilities && (
              <div className="p-3 bg-white dark:bg-dark-card rounded-lg border border-blue-200 dark:border-blue-800 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                    Verified Hospital Accessibility Facilities
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    ADA Compliant
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {VERIFIED_ACCESSIBILITY_FACILITIES.map(fac => (
                    <div key={fac.id} className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs">
                      <p className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                        <span>{fac.name}</span>
                        <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200 px-1.5 py-0.2 rounded">Floor {fac.floor}</span>
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">📍 {fac.location}</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">{fac.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wheelchair Request */}
            <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelchairNeeded}
                  onChange={(e) => setWheelchairNeeded(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-sm text-gray-800 dark:text-dark-text">Request Wheelchair & Porter Assistance</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A hospital orderly will meet you at the requested pickup point with an ADA transport chair.
                  </p>
                </div>
              </label>

              {wheelchairNeeded && (
                <div className="ml-7 pt-1 animate-fadeIn">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Select Arrival Pickup Location:
                  </label>
                  <select
                    value={wheelchairLocation}
                    onChange={(e) => setWheelchairLocation(e.target.value as WheelchairLocation)}
                    className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary"
                  >
                    <option value="Main Entrance Ramps">Main Entrance Ramps (Ground Level)</option>
                    <option value="Emergency Bay">Emergency Bay & Curbside Drop-off</option>
                    <option value="Accessible Car Parking">Accessible Car Parking (Zone P1)</option>
                    <option value="OPD Reception Atrium">OPD Central Reception Atrium</option>
                    <option value="Elevator Lobby">Elevator Lobby Ground Level</option>
                  </select>
                </div>
              )}
            </div>

            {/* Written Instructions Request */}
            <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={writtenInstructions}
                  onChange={(e) => setWrittenInstructions(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-sm text-gray-800 dark:text-dark-text">Request Written Clinical Instructions</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Request that the consulting physician and nurse provide printed takeaway clinical notes, follow-up instructions, and simplified medication schedules.
                  </p>
                </div>
              </label>
            </div>

            {/* Communication Support Selector */}
            <div className="bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
              <label className="block font-semibold text-sm text-gray-800 dark:text-dark-text">
                Communication Support
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select translation, visual guidance, or hearing assistance required during your clinical session:
              </p>
              <select
                value={communicationSupport}
                onChange={(e) => setCommunicationSupport(e.target.value as CommunicationSupportType)}
                className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary"
              >
                <option value="None">None (Standard Communication)</option>
                <option value="Sign Language Interpreter">Sign Language Interpreter (ASL / ISL certified)</option>
                <option value="Visual Guidance Assistance">Visual Guidance Assistance (Low vision & navigation escort)</option>
                <option value="Hearing Loop Amplification">Hearing Loop Amplification (Telecoil induction waiting room & suite)</option>
                <option value="Large Print & High Contrast Forms">Large Print & High Contrast Forms (24pt print documents)</option>
              </select>
            </div>

            {/* Assistance Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Additional Accessibility or Caregiver Notes (Optional)
              </label>
              <input
                type="text"
                value={assistanceNotes}
                onChange={(e) => setAssistanceNotes(e.target.value)}
                placeholder="e.g. Accompanied by service guide dog, requires quiet waiting area..."
                className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="pt-4 flex justify-end gap-3 flex-shrink-0 border-t dark:border-dark-border">
             <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDoctorId || !date || !time}
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
