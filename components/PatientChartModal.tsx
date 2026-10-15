import React, { useMemo } from 'react';
import type { AssignedPatient, PatientChart } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatientChartModalProps {
  patient: AssignedPatient;
  chartData: PatientChart | undefined;
  onClose: () => void;
}

const PatientChartModal: React.FC<PatientChartModalProps> = ({ patient, chartData, onClose }) => {
  if (!patient) return null;

  const formattedVitals = useMemo(() => {
    return chartData?.vitalsHistory?.map(vital => ({
      ...vital,
      date: new Date(vital.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
      'Systolic BP': vital.bp.systolic,
      'Diastolic BP': vital.bp.diastolic,
      'Heart Rate': vital.hr,
      'Temperature': vital.temp,
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  }, [chartData]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b dark:border-dark-border">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Patient Chart: {patient.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">Room {patient.room} | Status: {patient.status}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          {chartData ? (
            <>
              {chartData.vitalsHistory && chartData.vitalsHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-2">Vitals History</h3>
                  <div className="h-80 w-full bg-light dark:bg-dark-bg p-4 rounded-lg border dark:border-dark-border">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formattedVitals}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="date" tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', color: '#E2E8F0' }} />
                        <Legend wrapperStyle={{ color: '#E2E8F0', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="Temperature" stroke="#f0b429" strokeWidth={2} name="Temp (°F)" />
                        <Line type="monotone" dataKey="Systolic BP" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="Diastolic BP" stroke="#82ca9d" strokeWidth={2} />
                        <Line type="monotone" dataKey="Heart Rate" stroke="#ff7300" strokeWidth={2} name="HR (bpm)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-2">Nurse's Notes</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {chartData.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-light dark:bg-dark-bg rounded-md border dark:border-dark-border">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{new Date(note.date).toLocaleString()} - {note.author}</p>
                      <p className="text-gray-700 dark:text-gray-300">{note.note}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-2">Medication Schedule</h3>
                <ul className="divide-y dark:divide-gray-700 bg-light dark:bg-dark-bg p-3 rounded-md border dark:border-dark-border max-h-48 overflow-y-auto pr-2">
                  {chartData.medicationSchedule.map((med, index) => (
                    <li key={index} className="py-3 flex justify-between items-center">
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-bold">{med.time}</span>: {med.medication}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{med.dosage}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No chart data available for this patient.</p>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-dark-bg/50 border-t dark:border-dark-border flex justify-end mt-auto">
          <button onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientChartModal;