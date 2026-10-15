
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Patient, Appointment, Prescription, LabTest } from '../../types';
import { MOCK_PATIENTS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { callPatientFromDoctor } from '../../services/queueService';

// Helper to format date as YYYY-MM-DD
const formatDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- MODAL COMPONENTS ---

interface PatientDetailModalProps {
    doctor: User;
    patient: Patient;
    appointments: Appointment[];
    prescriptions: Prescription[];
    labTests: LabTest[];
    onClose: () => void;
    onSavePrescription: (prescription: Prescription) => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ doctor, patient, appointments, prescriptions, labTests, onClose, onSavePrescription }) => {
    const [activeTab, setActiveTab] = useState<'Appointments' | 'Prescriptions' | 'Lab Results'>('Appointments');
    const [isCreatePrescriptionModalOpen, setCreatePrescriptionModalOpen] = useState(false);
    
    const getStatusClass = (status: LabTest['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
                <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b dark:border-dark-border">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">Patient Chart: {patient.name}</h2>
                                <p className="text-gray-600 dark:text-gray-400">Age: {patient.age} | Condition: {patient.currentCondition}</p>
                             </div>
                             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <nav className="mt-4 -mb-px flex space-x-6 border-b dark:border-dark-border">
                            <button onClick={() => setActiveTab('Appointments')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Appointments</button>
                            <button onClick={() => setActiveTab('Prescriptions')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Prescriptions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Prescriptions ({prescriptions.length})</button>
                             <button onClick={() => setActiveTab('Lab Results')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'Lab Results' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Lab Results ({labTests.length})</button>
                        </nav>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        {activeTab === 'Appointments' && (
                            <div className="space-y-4">
                                {appointments.map(app => (
                                     <div key={app.id} className="p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 border-gray-400">
                                        <p className="font-semibold dark:text-dark-text">{app.type} ({app.status})</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(app.date).toLocaleDateString()} at {app.time}</p>
                                        {app.accessibilityRequest && (
                                            <div className="mt-1 flex flex-wrap gap-1 text-xs">
                                                {app.accessibilityRequest.wheelchairNeeded && <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full font-semibold">♿ Wheelchair</span>}
                                                {app.accessibilityRequest.writtenInstructions && <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 px-2 py-0.5 rounded-full font-semibold">📄 Written Instructions</span>}
                                                {app.accessibilityRequest.communicationSupport && app.accessibilityRequest.communicationSupport !== 'None' && <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-2 py-0.5 rounded-full font-semibold">🗣️ {app.accessibilityRequest.communicationSupport}</span>}
                                            </div>
                                        )}
                                     </div>
                                ))}
                                {appointments.length === 0 && <p className="text-gray-500 dark:text-gray-400">No appointments found for this patient.</p>}
                            </div>
                        )}
                        {activeTab === 'Prescriptions' && (
                            <div>
                                <button onClick={() => setCreatePrescriptionModalOpen(true)} className="mb-4 bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Write New Prescription</button>
                                <div className="space-y-4">
                                    {prescriptions.map(p => (
                                        <div key={p.id} className={`p-3 bg-light dark:bg-dark-bg rounded-md border-l-4 ${p.status === 'Active' ? 'border-blue-500' : 'border-gray-400'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-lg dark:text-dark-text">{p.medication} {p.dosage}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{p.frequency} for {p.duration}</p>
                                                    {p.notes && <p className="text-xs italic text-gray-500 dark:text-gray-300 mt-1">Notes: {p.notes}</p>}
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {prescriptions.length === 0 && <p className="text-gray-500 dark:text-gray-400">No prescriptions found for this patient.</p>}
                                </div>
                            </div>
                        )}
                        {activeTab === 'Lab Results' && (
                            <div className="space-y-4">
                                {labTests.map(test => (
                                    <div key={test.id} className="p-3 bg-light dark:bg-dark-bg rounded-md border dark:border-dark-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold dark:text-dark-text">{test.testType}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Requested on {test.date} by {test.requestedBy}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(test.status)}`}>{test.status}</span>
                                        </div>
                                        {test.status === 'Completed' && test.results && (
                                            <div className="mt-2 pt-2 border-t dark:border-gray-600">
                                                <p className="text-sm font-semibold dark:text-white">Results:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{test.results}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {labTests.length === 0 && <p className="text-gray-500 dark:text-gray-400">No lab tests found for this patient.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isCreatePrescriptionModalOpen && <CreatePrescriptionModal doctor={doctor} patient={patient} onSave={(p) => { onSavePrescription(p); setCreatePrescriptionModalOpen(false); }} onClose={() => setCreatePrescriptionModalOpen(false)} />}
        </>
    );
};

interface CreatePrescriptionModalProps {
    doctor: User;
    patient: Patient;
    onSave: (prescription: Prescription) => void;
    onClose: () => void;
}

const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({ doctor, patient, onSave, onClose }) => {
    const [medication, setMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!medication || !dosage || !frequency || !duration) {
            setError('Please fill out all required fields.');
            return;
        }
        setError('');
        onSave({
            id: `presc_${Date.now()}`,
            patientId: patient.id,
            patientName: patient.name,
            doctorId: doctor.id,
            doctorName: doctor.name,
            date: formatDate(new Date()),
            status: 'Active',
            medication, dosage, frequency, duration, notes,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">New Prescription for {patient.name}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={medication} onChange={e => setMedication(e.target.value)} placeholder="Medication (e.g., Amoxicillin)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Dosage (e.g., 500mg)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        <input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Frequency (e.g., Twice a day)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration (e.g., 10 days)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional Notes (optional)" rows={3} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Save Prescription</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md flex items-center gap-4">
        <div className="bg-primary/10 dark:bg-primary/20 text-primary p-3 rounded-full">{icon}</div>
        <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

// --- TAB COMPONENTS ---

const DashboardView: React.FC<{
    todaysAppointments: Appointment[];
    doctorPatients: Patient[];
    onViewChart: (patient: Patient) => void;
}> = ({ todaysAppointments, doctorPatients, onViewChart }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard 
                    title="Appointments Today" 
                    value={todaysAppointments.length}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatCard 
                    title="Total Assigned Patients" 
                    value={doctorPatients.length} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.958" /></svg>}
                />
            </div>
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Today's Schedule</h2>
                 <div className="space-y-4 max-h-96 overflow-y-auto">
                     {todaysAppointments.length > 0 ? todaysAppointments.map(app => {
                         const patient = doctorPatients.find(p => p.id === app.patientId);
                         return (
                            <div key={app.id} className="p-4 bg-light dark:bg-dark-bg rounded-lg border-l-4 border-primary">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div>
                                        <p className="font-bold text-lg dark:text-dark-text">{app.time} - {app.patientName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Reason: {patient?.currentCondition || app.type}</p>
                                    </div>
                                    <button onClick={() => patient && onViewChart(patient)} className="text-sm bg-primary/10 text-primary dark:bg-primary/30 dark:text-white font-semibold py-1 px-3 rounded-full hover:bg-primary/20 transition">
                                        View Chart
                                    </button>
                                </div>
                            </div>
                         );
                     }) : <p className="text-gray-500 dark:text-gray-400">No appointments scheduled for today.</p>}
                 </div>
            </div>
        </div>
    );
};

const AppointmentsView: React.FC<{ 
    appointments: Appointment[];
    onUpdateStatus: (id: string, status: 'Completed' | 'Cancelled') => void;
    onCallPatient: (app: Appointment) => void;
}> = ({ appointments, onUpdateStatus, onCallPatient }) => {
    const [filter, setFilter] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');

    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => a.status === filter).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [appointments, filter]);
    
    const getStatusClass = (status: Appointment['status']) => {
        switch (status) {
            case 'Upcoming': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Manage Appointments</h2>
            <div className="flex space-x-2 border-b dark:border-dark-border mb-4">
                <button onClick={() => setFilter('Upcoming')} className={`py-2 px-4 text-sm font-medium ${filter === 'Upcoming' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Upcoming</button>
                <button onClick={() => setFilter('Completed')} className={`py-2 px-4 text-sm font-medium ${filter === 'Completed' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Completed</button>
                <button onClick={() => setFilter('Cancelled')} className={`py-2 px-4 text-sm font-medium ${filter === 'Cancelled' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>Cancelled</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                 {filteredAppointments.map(app => (
                    <div key={app.id} className="p-4 bg-light dark:bg-dark-bg rounded-lg">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                             <div>
                                <p className="font-bold dark:text-dark-text">{app.patientName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(app.date).toLocaleDateString()} at {app.time} - {app.type}</p>
                                {app.accessibilityRequest && (
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                        {app.accessibilityRequest.wheelchairNeeded && (
                                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-blue-300 dark:border-blue-700">
                                                <span>♿</span> Wheelchair Assistance: {app.accessibilityRequest.wheelchairLocation || 'Requested'}
                                            </span>
                                        )}
                                        {app.accessibilityRequest.writtenInstructions && (
                                            <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-purple-300 dark:border-purple-700">
                                                <span>📄</span> Written Instructions Required
                                            </span>
                                        )}
                                        {app.accessibilityRequest.communicationSupport && app.accessibilityRequest.communicationSupport !== 'None' && (
                                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                                                <span>🗣️</span> Support: {app.accessibilityRequest.communicationSupport}
                                            </span>
                                        )}
                                        {app.accessibilityRequest.assistanceNotes && (
                                            <span className="bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded text-[11px] border border-amber-200 dark:border-amber-800 italic">
                                                Note: "{app.accessibilityRequest.assistanceNotes}"
                                            </span>
                                        )}
                                    </div>
                                )}
                             </div>
                             <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(app.status)}`}>{app.status}</span>
                                {app.status === 'Upcoming' && (
                                    <>
                                        <button 
                                            onClick={() => onCallPatient(app)} 
                                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-2.5 rounded shadow-sm flex items-center gap-1 transition"
                                            title="Trigger MediSilentAlert with verified room and token"
                                        >
                                            <span>📢</span> Call (MediSilentAlert)
                                        </button>
                                        <button onClick={() => onUpdateStatus(app.id, 'Completed')} className="text-xs bg-secondary text-white font-semibold py-1 px-2 rounded hover:bg-green-600">Complete</button>
                                        <button onClick={() => onUpdateStatus(app.id, 'Cancelled')} className="text-xs bg-red-100 text-red-700 font-semibold py-1 px-2 rounded hover:bg-red-200">Cancel</button>
                                    </>
                                )}
                             </div>
                        </div>
                    </div>
                 ))}
                 {filteredAppointments.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 py-8">No {filter.toLowerCase()} appointments.</p>}
            </div>
        </div>
    );
};

const PatientsView: React.FC<{
    patients: Patient[];
    onViewChart: (patient: Patient) => void;
    onDownload: () => void;
}> = ({ patients, onViewChart, onDownload }) => {
    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">My Patients</h2>
                <button onClick={onDownload} className="bg-secondary/10 text-secondary dark:hover:bg-secondary/30 text-xs font-bold py-1 px-2 rounded hover:bg-secondary/20 transition-colors">
                Download List
                </button>
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="min-w-full">
                <thead className="bg-light dark:bg-dark-bg sticky top-0">
                    <tr>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Age</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Condition</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-dark-text">
                    {patients.map(patient => (
                    <tr key={patient.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                        <td className="py-2 px-3">{patient.name}</td>
                        <td className="py-2 px-3">{patient.age}</td>
                        <td className="py-2 px-3">{patient.currentCondition}</td>
                        <td className="py-2 px-3">
                            <button onClick={() => onViewChart(patient)} className="text-sm bg-primary/10 text-primary dark:bg-primary/30 dark:text-white font-semibold py-1 px-3 rounded-full hover:bg-primary/20 transition">
                                View Chart
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    );
};

const AnalyticsView: React.FC<{ appointments: Appointment[], patients: Patient[] }> = ({ appointments, patients }) => {
    const appointmentChartData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            counts[formatDate(d)] = 0;
        }
        appointments.forEach(app => {
            if (counts[app.date] !== undefined) {
                counts[app.date]++;
            }
        });
        return Object.entries(counts).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('en-us', { month: 'short', day: 'numeric' }),
            count
        }));
    }, [appointments]);

    const conditionsChartData = useMemo(() => {
        const counts = patients.reduce((acc, p) => {
            acc[p.currentCondition] = (acc[p.currentCondition] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [patients]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Appointments This Week</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={appointmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 85, 104, 0.4)" />
                        <XAxis dataKey="date" tick={{ fill: '#A0AEC0' }} />
                        <YAxis allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
                        <Tooltip cursor={{ fill: 'rgba(125, 125, 125, 0.1)' }} contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                        <Bar dataKey="count" fill="#00A859" name="Appointments" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Common Patient Conditions</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={conditionsChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                             {conditionsChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


interface DoctorPortalProps {
  user: User;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  prescriptions: Prescription[];
  setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
  labTests: LabTest[];
}

type DoctorTab = 'Dashboard' | 'Appointments' | 'Patients' | 'Analytics';

const DoctorPortal: React.FC<DoctorPortalProps> = ({ user, appointments, setAppointments, prescriptions, setPrescriptions, labTests }) => {
    const [activeTab, setActiveTab] = useState<DoctorTab>('Dashboard');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    const doctorsAppointments = useMemo(() => appointments.filter(app => app.doctorId === user.id), [user.id, appointments]);
    const patientIds = useMemo(() => [...new Set(doctorsAppointments.map(app => app.patientId))], [doctorsAppointments]);
    const doctorPatients = useMemo(() => MOCK_PATIENTS.filter(p => patientIds.includes(p.id)), [patientIds]);

    const todaysAppointments = useMemo(() => doctorsAppointments.filter(
        app => app.date === formatDate(new Date()) && app.status === 'Upcoming'
    ).sort((a, b) => a.time.localeCompare(b.time)), [doctorsAppointments]);
  
    const handleSavePrescription = (prescription: Prescription) => {
        setPrescriptions(prev => {
            const existingIndex = prev.findIndex(p => p.id === prescription.id);
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = prescription;
                return updated;
            }
            return [...prev, prescription];
        });
    };
    
    const handleUpdateAppointmentStatus = (id: string, status: 'Completed' | 'Cancelled') => {
        const message = `Are you sure you want to mark this appointment as ${status.toLowerCase()}?`;
        if (window.confirm(message)) {
            setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
        }
    };

    const handleDownloadPatientList = () => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`Patient List - ${user.name}`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`${user.department || 'All Departments'}`, 14, 28);
            const head = [['Name', 'Age', 'Current Condition']];
            const body = doctorPatients.map(p => [String(p.name || ''), String(p.age || ''), String(p.currentCondition || '')]);
            autoTable(doc, { head, body, startY: 35 });
            doc.save(`PatientList_${user.name.replace(/\s/g, '_')}.pdf`);
        } catch (err) {
            console.error("Patient list PDF generation error:", err);
            alert("Failed to download patient list PDF. Please try again.");
        }
    };

    const [callNotification, setCallNotification] = useState<string | null>(null);

    const handleCallPatient = (app: Appointment) => {
        const q = callPatientFromDoctor(app, user);
        setCallNotification(`📢 MediSilentAlert dispatched to ${app.patientName}! Assigned: Token ${q.tokenNumber} • ${q.roomNumber}`);
        setTimeout(() => setCallNotification(null), 5000);
    };

    const renderTabContent = () => {
        switch(activeTab) {
            case 'Dashboard': return <DashboardView todaysAppointments={todaysAppointments} doctorPatients={doctorPatients} onViewChart={setSelectedPatient} />;
            case 'Appointments': return <AppointmentsView appointments={doctorsAppointments} onUpdateStatus={handleUpdateAppointmentStatus} onCallPatient={handleCallPatient} />;
            case 'Patients': return <PatientsView patients={doctorPatients} onViewChart={setSelectedPatient} onDownload={handleDownloadPatientList} />;
            case 'Analytics': return <AnalyticsView appointments={doctorsAppointments} patients={doctorPatients} />;
        }
    }

    return (
    <>
        {callNotification && (
            <div className="fixed top-20 right-5 z-50 bg-emerald-600 text-white font-bold py-3 px-5 rounded-xl shadow-2xl animate-fadeIn flex items-center gap-2 border-2 border-emerald-300">
                <span>🔔</span> {callNotification}
            </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Doctor's Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome back, {user.name} ({user.department}).</p>

            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {(['Dashboard', 'Appointments', 'Patients', 'Analytics'] as DoctorTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-8">{renderTabContent()}</div>
        </div>

        {selectedPatient && (
            <PatientDetailModal 
                doctor={user}
                patient={selectedPatient}
                appointments={appointments.filter(a => a.patientId === selectedPatient.id)}
                prescriptions={prescriptions.filter(p => p.patientId === selectedPatient.id)}
                labTests={labTests.filter(t => t.patientName === selectedPatient.name)}
                onClose={() => setSelectedPatient(null)}
                onSavePrescription={handleSavePrescription}
            />
        )}
    </>
    );
};

export default DoctorPortal;
