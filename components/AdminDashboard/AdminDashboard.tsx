import React, { useState, useMemo } from 'react';
import type { User, Role, Medicine, Invoice, InvoiceStatus, BillingRecord, Appointment } from '../../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppointmentManagement from './AppointmentManagement';
import { getAdminInsights } from '../../services/geminiService';
import { Remarkable } from 'remarkable';
import ConfirmationModal from '../ConfirmationModal';
import WayFinderManagement from './WayFinderManagement';

const md = new Remarkable();

// --- Reusable Modals ---

const AddMedicineModal: React.FC<{ onSave: (medicine: Omit<Medicine, 'id'>) => void; onClose: () => void; }> = ({ onSave, onClose }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiry, setExpiry] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !quantity || !expiry) {
            setError('Please fill out all fields.');
            return;
        }
        if (isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
            setError('Please enter a valid quantity.');
            return;
        }
        setError('');
        onSave({
            name,
            category,
            quantity: parseInt(quantity),
            expiry,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">Add New Medicine</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Medicine Name" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Add Medicine</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type EditableUser = Partial<User> & { id?: string };
interface UserEditModalProps {
    user: EditableUser | null;
    allUsers: User[];
    onSave: (user: EditableUser) => void;
    onClose: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, allUsers, onSave, onClose }) => {
    const [formData, setFormData] = useState<EditableUser>(user || {});
    const [error, setError] = useState('');
    const isPatient = formData.role === 'PATIENT';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            setError('Name, Email, Password and Role are required.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }

        const emailExists = allUsers.some(
            u => u.email.toLowerCase() === formData.email?.toLowerCase() && u.id !== formData.id
        );

        if (emailExists) {
            setError('This email address is already in use.');
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl p-8 max-w-lg w-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text mb-4">
                    {formData.id ? 'Edit User' : 'Add New User'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <input name="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    <input name="password" value={formData.password || ''} onChange={handleChange} placeholder="Password" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    {!isPatient && (
                        <>
                         <select name="role" value={formData.role || ''} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                            <option value="" disabled>Select a staff role</option>
                            <option value="DOCTOR">Doctor</option>
                            <option value="NURSE">Nurse</option>
                            <option value="LAB_TECHNICIAN">Lab Technician</option>
                            <option value="PHARMACY">Pharmacy</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <input name="department" value={formData.department || ''} onChange={handleChange} placeholder="Department (e.g., Cardiology)" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main Dashboard & Props ---

interface AdminDashboardProps {
  user: User;
  allUsers: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  medicines: Medicine[];
  setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

type AdminTab = 'Analytics' | 'Staff' | 'Patients' | 'Pharmacy' | 'Billing' | 'Appointments' | 'Reports' | 'WayFinder Locations';
const TABS: AdminTab[] = ['Analytics', 'Staff', 'Patients', 'Pharmacy', 'Billing', 'Appointments', 'Reports', 'WayFinder Locations'];

// --- Tab Components ---

const AnalyticsDashboard: React.FC<AdminDashboardProps> = (props) => {
    const { allUsers, medicines, appointments } = props;
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateInsights = async () => {
        setIsLoading(true);
        setError('');
        setInsights('');
        try {
            const result = await getAdminInsights({
                appointments: appointments,
                medicines: medicines,
                users: allUsers,
            });
            setInsights(result);
        } catch (e) {
            setError('Failed to generate insights. Please try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const roleCounts = useMemo(() => allUsers.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [allUsers]);

    const departmentCounts = useMemo(() => allUsers.reduce((acc, u) => {
        if (u.department) {
             acc[u.department] = (acc[u.department] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>), [allUsers]);

    const roleChartData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
    const departmentChartData = Object.entries(departmentCounts).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Patients</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{roleCounts['PATIENT'] || 0}</p>
                </div>
                 <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Doctors</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{roleCounts['DOCTOR'] || 0}</p>
                </div>
                 <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Appointments</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{appointments.length}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Medicines</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{medicines.length}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">User Roles Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={roleChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {roleChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Staff by Department</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={departmentChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 85, 104, 0.4)" />
                          <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                          <YAxis allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
                          <Tooltip cursor={{ fill: 'rgba(125, 125, 125, 0.1)' }} contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                          <Bar dataKey="value" fill="#00A859" name="Staff Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             {/* New AI Insights Section */}
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">AI-Powered Insights</h2>
                    <button
                        onClick={handleGenerateInsights}
                        disabled={isLoading}
                        className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-gray-400"
                    >
                        {isLoading ? 'Generating...' : '✨ Generate Report'}
                    </button>
                </div>
                {isLoading && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Analyzing hospital data...</p>
                    </div>
                )}
                {error && <p className="text-red-500">{error}</p>}
                {insights && (
                    <div
                        className="prose prose-blue dark:prose-invert max-w-none p-4 border border-gray-200 dark:border-dark-border rounded-lg bg-light dark:bg-dark-bg"
                        dangerouslySetInnerHTML={{ __html: md.render(insights) }}
                    />
                )}
            </div>
        </div>
    );
};

const UserManagementTable: React.FC<{ users: User[], onEdit?: (user: User) => void, onDelete: (id: string) => void, showEditButton?: boolean }> = ({ users, onEdit, onDelete, showEditButton = true }) => (
    <div className="mt-4 overflow-x-auto">
        <table className="min-w-full">
            <thead className="bg-light dark:bg-dark-bg">
                <tr>
                    {['Name', 'Role', 'Email', 'Department', 'Actions'].map(h => 
                        <th key={h} className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                    )}
                </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-dark-text">
                {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                        <td className="py-2 px-3">{u.name}</td>
                        <td className="py-2 px-3">{u.role.replace('_', ' ')}</td>
                        <td className="py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3">{u.department || 'N/A'}</td>
                        <td className="py-2 px-3 flex gap-2">
                            {showEditButton && onEdit && <button onClick={() => onEdit(u)} className="text-primary hover:underline text-sm font-semibold">Edit</button>}
                            <button onClick={() => onDelete(u.id)} className="text-red-500 hover:underline text-sm font-semibold">Delete</button>
                        </td>
                    </tr>
                ))}
                {users.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">No users found.</td></tr>
                )}
            </tbody>
        </table>
    </div>
);

const StaffManagement: React.FC<AdminDashboardProps> = ({ allUsers, setUsers }) => {
  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'NURSE' | 'STAFF'>('DOCTOR');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleAddNewUser = () => {
    let defaultRole: Role = 'DOCTOR';
    if(activeTab === 'NURSE') defaultRole = 'NURSE';
    if(activeTab === 'STAFF') defaultRole = 'LAB_TECHNICIAN';
    setEditingUser({ role: defaultRole });
    setModalOpen(true);
  };
  const handleEditUser = (userToEdit: User) => { setEditingUser(userToEdit); setModalOpen(true); };
  
  const handleDeleteUser = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        setUserToDelete(user);
        setConfirmDeleteOpen(true);
    }
  };
  
  const confirmDeleteUser = () => {
    if (userToDelete) {
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
    }
    setConfirmDeleteOpen(false);
    setUserToDelete(null);
  };

  const handleSaveUser = (userToSave: EditableUser) => {
    if (userToSave.id) {
      setUsers(prevUsers => prevUsers.map(u => u.id === userToSave.id ? { ...u, ...userToSave } as User : u));
    } else {
      const newUser: User = {
        id: `user_${new Date().getTime()}`, name: userToSave.name!, email: userToSave.email!, password: userToSave.password!, role: userToSave.role!, department: userToSave.department,
        avatarUrl: `https://ui-avatars.com/api/?name=${(userToSave.name || '').replace(' ', '+')}&background=00A859&color=fff`, isVerified: true
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
    }
    setModalOpen(false); setEditingUser(null);
  };

  const filteredUsers = useMemo(() => {
    if (activeTab === 'STAFF') return allUsers.filter(u => ['LAB_TECHNICIAN', 'PHARMACY', 'ADMIN'].includes(u.role));
    return allUsers.filter(u => u.role === activeTab);
  }, [activeTab, allUsers]);

  return (
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Staff Management</h2>
            <button onClick={handleAddNewUser} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Add New Staff</button>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('DOCTOR')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'DOCTOR' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Doctors</button>
              <button onClick={() => setActiveTab('NURSE')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'NURSE' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Nurses</button>
              <button onClick={() => setActiveTab('STAFF')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'STAFF' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>Other Staff</button>
            </nav>
          </div>
          <UserManagementTable users={filteredUsers} onEdit={handleEditUser} onDelete={handleDeleteUser} />
          {isModalOpen && <UserEditModal user={editingUser} allUsers={allUsers} onSave={handleSaveUser} onClose={() => { setModalOpen(false); setEditingUser(null); }} />}
          {isConfirmDeleteOpen && userToDelete && (
            <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={confirmDeleteUser}
                title="Delete Staff Member" 
                message={`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`} 
                confirmText="Yes, Delete" 
            />
          )}
      </div>
  );
};

const PatientManagement: React.FC<AdminDashboardProps> = ({ allUsers, setUsers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 4000);
    };

    const handleDeleteUser = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            setUserToDelete(user);
            setConfirmDeleteOpen(true);
        }
    };
    
    const confirmDeleteUser = () => {
        if (userToDelete) {
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            showNotification(`Patient "${userToDelete.name}" has been deleted.`);
        }
        setConfirmDeleteOpen(false);
        setUserToDelete(null);
    };
    
    const patients = useMemo(() => allUsers.filter(u => u.role === 'PATIENT'), [allUsers]);

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

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
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Patient Management</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients: {patients.length}</p>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full sm:w-64 p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
            <UserManagementTable users={filteredPatients} onDelete={handleDeleteUser} showEditButton={false} />
        </div>
        {isConfirmDeleteOpen && userToDelete && (
            <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)} 
                onConfirm={confirmDeleteUser} 
                title="Delete Patient" 
                message={`Are you sure you want to delete patient "${userToDelete.name}"? This action cannot be undone.`} 
                confirmText="Yes, Delete" 
            />
        )}
      </>
    );
};

const PharmacyManagement: React.FC<AdminDashboardProps> = ({ medicines, setMedicines }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
    const [medicineToDelete, setMedicineToDelete] = useState<Medicine | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    
    const handleAddMedicine = (newMedicineData: Omit<Medicine, 'id'>) => {
        const newMedicine: Medicine = { id: `med_${new Date().getTime()}`, ...newMedicineData };
        setMedicines(prev => [...prev, newMedicine].sort((a, b) => a.name.localeCompare(b.name)));
        setModalOpen(false);
    };

    const handleQuantityChange = (id: string, value: string) => setQuantityInputs(prev => ({ ...prev, [id]: value }));
    const handleUpdateQuantity = (id: string) => {
        const newQuantity = parseInt(quantityInputs[id]);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            setMedicines(prev => prev.map(med => med.id === id ? { ...med, quantity: newQuantity } : med));
            setQuantityInputs(prev => { const next = {...prev}; delete next[id]; return next; });
        }
    };
    
    const handleDeleteMedicine = (id: string) => {
        const med = medicines.find(m => m.id === id);
        if (med) {
            setMedicineToDelete(med);
            setConfirmDeleteOpen(true);
        }
    };

    const confirmDeleteMedicine = () => {
        if (medicineToDelete) {
            setMedicines(prev => prev.filter(m => m.id !== medicineToDelete.id));
        }
        setConfirmDeleteOpen(false);
        setMedicineToDelete(null);
    };
    
    return (
         <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Pharmacy Inventory</h2>
                <button onClick={() => setModalOpen(true)} className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Add Medicine</button>
             </div>
             <div className="overflow-x-auto max-h-[500px]">
                 <table className="min-w-full">
                    <thead className="bg-light dark:bg-dark-bg sticky top-0">
                        <tr>
                            {['Name', 'Category', 'Quantity', 'Expiry', 'Actions'].map(h => <th key={h} className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-dark-text">
                        {medicines.map(med => (
                            <tr key={med.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                                <td className="py-2 px-3">{med.name}</td>
                                <td className="py-2 px-3">{med.category}</td>
                                <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={quantityInputs[med.id] ?? med.quantity} onChange={e => handleQuantityChange(med.id, e.target.value)} className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        <button onClick={() => handleUpdateQuantity(med.id)} className="text-xs bg-blue-100 text-blue-700 font-bold py-1 px-2 rounded hover:bg-blue-200">Update</button>
                                    </div>
                                </td>
                                <td className="py-2 px-3">{med.expiry}</td>
                                <td className="py-2 px-3">
                                    <button onClick={() => handleDeleteMedicine(med.id)} className="text-red-500 hover:underline text-sm font-semibold">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
             {isModalOpen && <AddMedicineModal onSave={handleAddMedicine} onClose={() => setModalOpen(false)} />}
             {isConfirmDeleteOpen && medicineToDelete && (
                <ConfirmationModal 
                    isOpen={isConfirmDeleteOpen}
                    onClose={() => setConfirmDeleteOpen(false)} 
                    onConfirm={confirmDeleteMedicine} 
                    title="Delete Medicine" 
                    message={`Are you sure you want to delete ${medicineToDelete.name} from inventory?`} 
                    confirmText="Yes, Delete" 
                />
            )}
         </div>
    );
};

// --- Invoice Modal Component ---
interface InvoiceModalProps {
    invoice: Invoice | null;
    patients: User[];
    onSave: (invoice: Invoice) => void;
    onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, patients, onSave, onClose }) => {
    const [patientId, setPatientId] = useState(invoice?.patientId || '');
    const [issueDate, setIssueDate] = useState(invoice?.issueDate || new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(invoice?.dueDate || '');
    const [items, setItems] = useState<Partial<BillingRecord>[]>(invoice?.items || [{ id: `item_${Date.now()}`, description: '', amount: 0 }]);
    const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'Unpaid');

    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [items]);

    const handleItemChange = (index: number, field: keyof BillingRecord, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { id: `item_${Date.now()}`, description: '', amount: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        const selectedPatient = patients.find(p => p.id === patientId);
        if (!selectedPatient || !issueDate || !dueDate || items.some(i => !i.description || !i.amount || i.amount <= 0)) {
            alert("Please fill all fields and ensure all items have a description and valid amount.");
            return;
        }

        const finalInvoice: Invoice = {
            id: invoice?.id || `inv_${Date.now()}`,
            invoiceNumber: invoice?.invoiceNumber || `HMS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
            patientId,
            patientName: selectedPatient.name,
            issueDate,
            dueDate,
            items: items as BillingRecord[],
            totalAmount,
            status,
        };
        onSave(finalInvoice);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b dark:border-dark-border">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
                        {invoice ? `Invoice ${invoice.invoiceNumber}` : 'Create New Invoice'}
                    </h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                            <option value="" disabled>Select a Patient</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                         <select value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <div>
                            <label className="text-sm text-gray-500">Issue Date</label>
                            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">Due Date</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                    </div>
                    
                    <h3 className="font-semibold dark:text-white pt-4 border-t dark:border-gray-600">Billable Items</h3>
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div key={item.id} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={e => handleItemChange(index, 'description', e.target.value)}
                                    className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={item.amount}
                                    onChange={e => handleItemChange(index, 'amount', parseFloat(e.target.value))}
                                    className="w-28 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <button onClick={() => handleRemoveItem(index)} className="text-red-500 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddItem} className="text-sm bg-blue-100 text-blue-700 font-bold py-1 px-3 rounded hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300">Add Item</button>

                    <div className="text-right font-bold text-xl dark:text-white pt-4 border-t dark:border-gray-600">
                        Total: ${totalAmount.toFixed(2)}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-dark-bg/50 border-t dark:border-dark-border flex justify-end gap-3 mt-auto">
                    <button onClick={onClose} className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSubmit} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Save Invoice</button>
                </div>
            </div>
        </div>
    );
};

const BillingManagement: React.FC<AdminDashboardProps> = ({ invoices, setInvoices, allUsers }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'All'>('All');
    const [filterPatient, setFilterPatient] = useState('');

    const patients = useMemo(() => allUsers.filter(u => u.role === 'PATIENT'), [allUsers]);

    const filteredInvoices = useMemo(() => {
        return invoices
            .filter(inv => filterStatus === 'All' || inv.status === filterStatus)
            .filter(inv => filterPatient === '' || inv.patientName.toLowerCase().includes(filterPatient.toLowerCase()));
    }, [invoices, filterStatus, filterPatient]);

    const handleCreateNew = () => {
        setSelectedInvoice(null);
        setModalOpen(true);
    };

    const handleView = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setModalOpen(true);
    };
    
    const handleSaveInvoice = (invoiceData: Invoice) => {
      setInvoices(prev => {
          const existing = prev.find(inv => inv.id === invoiceData.id);
          if (existing) {
              return prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv);
          }
          return [...prev, invoiceData];
      });
      setModalOpen(false);
    };

    const handleMarkAsPaid = (invoiceId: string) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'Paid' } : inv));
    };

    const getStatusClass = (status: InvoiceStatus) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Unpaid': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    };
    
    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Billing & Invoicing</h2>
                <button onClick={handleCreateNew} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Create New Invoice</button>
            </div>

            {/* Filter controls */}
            <div className="flex gap-4 mb-4 p-3 bg-light dark:bg-dark-bg rounded-md">
                <input
                    type="text"
                    placeholder="Filter by patient name..."
                    value={filterPatient}
                    onChange={e => setFilterPatient(e.target.value)}
                    className="w-full sm:w-1/3 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="w-full sm:w-1/4 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-light dark:bg-dark-bg">
                        <tr>
                            {['Invoice #', 'Patient', 'Due Date', 'Total', 'Status', 'Actions'].map(h =>
                                <th key={h} className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-dark-text">
                        {filteredInvoices.map(inv => (
                            <tr key={inv.id} className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg">
                                <td className="py-2 px-3 font-mono text-xs">{inv.invoiceNumber}</td>
                                <td className="py-2 px-3">{inv.patientName}</td>
                                <td className="py-2 px-3">{inv.dueDate}</td>
                                <td className="py-2 px-3">${inv.totalAmount.toFixed(2)}</td>
                                <td className="py-2 px-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="py-2 px-3 flex gap-2 items-center text-sm">
                                    <button onClick={() => handleView(inv)} className="text-primary hover:underline font-semibold">View</button>
                                    {inv.status !== 'Paid' && (
                                        <button onClick={() => handleMarkAsPaid(inv.id)} className="text-secondary hover:underline font-semibold">Mark Paid</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <InvoiceModal invoice={selectedInvoice} patients={patients} onSave={handleSaveInvoice} onClose={() => setModalOpen(false)} />}
        </div>
    );
};


const ReportsTab: React.FC<AdminDashboardProps> = ({ allUsers, medicines, invoices }) => {
    const generatePdf = (title: string, head: string[][], body: (string|number)[][], filename: string) => {
        const doc = new jsPDF();
        doc.text(title, 14, 20);
        autoTable(doc, { head, body, startY: 25 });
        doc.save(filename);
    };

    const handleDownloadStaffReport = () => {
        const staff = allUsers.filter(u => u.role !== 'PATIENT');
        generatePdf(
            "Staff Report",
            [['Name', 'Role', 'Department', 'Email']],
            staff.map(u => [u.name, u.role, u.department || 'N/A', u.email]),
            'Staff_Report.pdf'
        );
    };
     const handleDownloadPatientReport = () => {
        const patients = allUsers.filter(u => u.role === 'PATIENT');
        generatePdf(
            "Patient Report",
            [['Name', 'Email']],
            patients.map(u => [u.name, u.email]),
            'Patient_Report.pdf'
        );
    };
    const handleDownloadPharmacyReport = () => {
        generatePdf(
            "Pharmacy Stock Report",
            [['Name', 'Category', 'Quantity', 'Expiry Date']],
            medicines.map(m => [m.name, m.category, m.quantity, m.expiry]),
            'Pharmacy_Stock_Report.pdf'
        );
    };
    const handleDownloadBillingReport = () => {
        generatePdf(
            "Billing Report",
            [['Invoice #', 'Patient', 'Amount', 'Status', 'Due Date']],
            invoices.map(i => [i.invoiceNumber, i.patientName, `$${i.totalAmount.toFixed(2)}`, i.status, i.dueDate]),
            'Billing_Report.pdf'
        );
    };

    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Report Generation</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-light dark:bg-dark-bg p-4 rounded-lg">
                    <h3 className="font-bold dark:text-white">Staff Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">Download a full list of all staff members.</p>
                    <button onClick={handleDownloadStaffReport} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Download PDF</button>
                </div>
                <div className="bg-light dark:bg-dark-bg p-4 rounded-lg">
                    <h3 className="font-bold dark:text-white">Patient Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">Download a list of all registered patients.</p>
                    <button onClick={handleDownloadPatientReport} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Download PDF</button>
                </div>
                <div className="bg-light dark:bg-dark-bg p-4 rounded-lg">
                    <h3 className="font-bold dark:text-white">Pharmacy Stock Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">Download current pharmacy inventory.</p>
                    <button onClick={handleDownloadPharmacyReport} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Download PDF</button>
                </div>
                 <div className="bg-light dark:bg-dark-bg p-4 rounded-lg">
                    <h3 className="font-bold dark:text-white">Billing Report</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 my-2">Download a summary of all invoices.</p>
                    <button onClick={handleDownloadBillingReport} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">Download PDF</button>
                </div>
             </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('Analytics');
  
  const renderTabContent = () => {
    switch (adminTab) {
      case 'Analytics': return <AnalyticsDashboard {...props} />;
      case 'Staff': return <StaffManagement {...props} />;
      case 'Patients': return <PatientManagement {...props} />;
      case 'Pharmacy': return <PharmacyManagement {...props} />;
      case 'Billing': return <BillingManagement {...props} />;
      case 'Appointments': return <AppointmentManagement appointments={props.appointments} setAppointments={props.setAppointments} />;
      case 'Reports': return <ReportsTab {...props} />;
      case 'WayFinder Locations': return <WayFinderManagement />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome, {props.user.name}.</p>
      
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setAdminTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${adminTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
