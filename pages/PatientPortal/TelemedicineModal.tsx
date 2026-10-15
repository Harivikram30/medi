import React, { useMemo, useState } from 'react';
import type { Appointment } from '../../types';

interface TelemedicineModalProps {
  appointment: Appointment;
  onClose: () => void;
}

const TelemedicineModal: React.FC<TelemedicineModalProps> = ({ appointment, onClose }) => {
  const [isRoomCopied, setRoomCopied] = useState(false);
  const roomUrl = useMemo(
    () => `https://meet.jit.si/MedConnect-${encodeURIComponent(appointment.id)}`,
    [appointment.id]
  );

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setRoomCopied(true);
      window.setTimeout(() => setRoomCopied(false), 2500);
    } catch (error) {
      console.error('Could not copy the video room link', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-5xl mx-4 text-white">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Video Consultation</h2>
            <p className="text-gray-400">
              with {appointment.doctorName} ({appointment.doctorSpecialization})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl leading-none"
            aria-label="Close video consultation"
          >
            &times;
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            title={`Video consultation with ${appointment.doctorName}`}
            src={roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Your doctor must open this same appointment room to join the call.
          </p>
          <div className="flex gap-3">
            <button
              onClick={copyRoomLink}
              className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition"
            >
              {isRoomCopied ? 'Room Link Copied' : 'Copy Room Link'}
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemedicineModal;
