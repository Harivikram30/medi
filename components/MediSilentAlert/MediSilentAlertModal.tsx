import React, { useState, useEffect } from 'react';
import type { QueueEntry } from '../../types';
import { acknowledgeAlert, triggerVibration, stopVibration, getVibrationPreference } from '../../services/queueService';

interface MediSilentAlertModalProps {
  queueEntry: QueueEntry;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledged?: () => void;
  onOpenWayFinder?: () => void;
}

export const MediSilentAlertModal: React.FC<MediSilentAlertModalProps> = ({
  queueEntry,
  isOpen,
  onClose,
  onAcknowledged,
  onOpenWayFinder,
}) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && queueEntry.status === 'Your Turn') {
      // Trigger vibration
      if (getVibrationPreference()) {
        const didVibrate = triggerVibration([400, 200, 400, 200, 600]);
        setVibrationActive(didVibrate);
      }
    } else {
      stopVibration();
      setVibrationActive(false);
    }

    return () => {
      stopVibration();
    };
  }, [isOpen, queueEntry.status]);

  if (!isOpen) return null;

  const handleAcknowledge = () => {
    stopVibration();
    setAcknowledged(true);
    acknowledgeAlert(queueEntry.id);
    if (onAcknowledged) {
      onAcknowledged();
    }
    setTimeout(() => {
      onClose();
      setAcknowledged(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      {/* High-Visibility Visual Pulsing Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border-2 border-emerald-500 dark:border-emerald-400">
        
        {/* Silent Flashing/Pulsing Glow Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 py-5 text-center overflow-hidden">
          {/* Animated visual ripple pulse (silent) */}
          <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-emerald-100">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
              MediSilentAlert
            </span>
          </div>

          <h2 className="relative z-10 text-2xl sm:text-3xl font-black mt-3 tracking-tight">
            IT'S YOUR TURN NOW
          </h2>
          <p className="relative z-10 text-xs sm:text-sm text-emerald-100 mt-1">
            Silent visual notification • Please proceed to your consultation room
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Token Number Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Your Assigned Token Number
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 tracking-wider">
              {queueEntry.tokenNumber}
            </div>
            
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Patient: <strong className="text-gray-900 dark:text-white">{queueEntry.patientName}</strong>
            </div>
          </div>

          {/* Verified Room and Department Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Verified Room Number */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">✓</span> Verified Room
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {queueEntry.roomNumber}
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                Confirmed by OPD desk
              </div>
            </div>

            {/* Doctor & Department */}
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Doctor & Department
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {queueEntry.doctorName}
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                {queueEntry.department}
              </div>
            </div>
          </div>

          {/* Vibration Indicator */}
          {vibrationActive && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-2 px-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="animate-bounce">📳</span>
              Haptic device vibration active
            </div>
          )}

          {/* Acknowledgement Status Toast */}
          {acknowledged && (
            <div className="p-3 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 text-center rounded-lg text-sm font-bold animate-fadeIn">
              ✓ Alert acknowledged! Doctor has been notified that you are on your way.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleAcknowledge}
              disabled={acknowledged}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-75"
            >
              <span>👋</span>
              {acknowledged ? 'Acknowledged' : "I'm On My Way (Acknowledge)"}
            </button>
            {onOpenWayFinder && (
              <button
                onClick={onOpenWayFinder}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-1.5 shadow-md"
                title="View interactive floor plan map to find this room"
              >
                <span>🧭</span>
                <span>WayFinder Map</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="sm:w-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-5 rounded-xl transition duration-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 dark:bg-dark-bg px-6 py-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
          MediSilentAlert respects hospital quiet hours with silent visual cues & optional vibration.
        </div>
      </div>
    </div>
  );
};

export default MediSilentAlertModal;
