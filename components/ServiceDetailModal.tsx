
import React from 'react';
import type { Service } from '../types';
import { MOCK_DOCTORS } from '../constants';

interface ServiceDetailModalProps {
  service: Service;
  onClose: () => void;
  onBookAppointment: () => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose, onBookAppointment }) => {
  const specialists = MOCK_DOCTORS.filter(doctor => doctor.specialization === service.name);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white/95 dark:bg-dark-card/95 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-dark-border flex justify-between items-start">
          <div>
            <span className="text-4xl">{service.icon}</span>
            <h2 className="text-3xl font-bold text-primary mt-2">{service.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2">About the Service</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{service.detailedDescription}</p>
            </div>
            
            {specialists.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Our Specialists</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specialists.map(doctor => (
                    <li key={doctor.id} className="bg-light dark:bg-dark-bg p-4 rounded-lg flex items-center gap-4">
                      <img src={doctor.imageUrl} alt={doctor.name} className="w-16 h-16 rounded-full object-cover"/>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-dark-text">{doctor.name}</p>
                        <p className="text-sm text-primary">{doctor.specialization}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="ml-1">{doctor.availability}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {specialists.length === 0 && (
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-2">Our Team</h3>
                    <p className="text-gray-600 dark:text-gray-300">Please contact us to get connected with our expert team for this service.</p>
                </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-border mt-auto bg-gray-50/50 dark:bg-black/20 rounded-b-2xl">
          <button 
            onClick={onBookAppointment}
            className="w-full bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Book an Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;