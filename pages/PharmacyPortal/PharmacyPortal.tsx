import React, { useState, useMemo } from 'react';
import type { User, Medicine, Prescription } from '../../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AlternativeSuggestionsModal from './AlternativeSuggestionsModal';

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

interface PharmacyPortalProps {
    user: User;
    medicines: Medicine[];
    setMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>;
    prescriptions: Prescription[];
    setPrescriptions: React.Dispatch<React.SetStateAction<Prescription[]>>;
}

type PharmacyTab = 'Prescriptions' | 'Inventory' | 'Analytics';

const NotificationBanner: React.FC<{ message: string | null }> = ({ message }) => {
    if (!message) return null;
    return (
        <div className="fixed top-20 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fadeIn z-50">
            {message}
        </div>
    );
};

const PharmacyPortal: React.FC<PharmacyPortalProps> = ({ user, medicines, setMedicines, prescriptions, setPrescriptions }) => {
    const [activeTab, setActiveTab] = useState<PharmacyTab>('Inventory');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [isSuggestionModalOpen, setSuggestionModalOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);


    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 4000);
    };

    const handleUpdatePrescriptionStatus = (id: string, newStatus: Prescription['status']) => {
        setPrescriptions(prev => prev.map(p => (p.id === id ? { ...p, status: newStatus } : p)));
        showNotification(`Prescription #${id.slice(-4)} status updated to "${newStatus}".`);
    };
    
    const handleAddMedicine = (newMedicineData: Omit<Medicine, 'id'>) => {
        const newMedicine: Medicine = { id: `med_${new Date().getTime()}`, ...newMedicineData };
        setMedicines(prev => [...prev, newMedicine].sort((a, b) => a.name.localeCompare(b.name)));
        setAddModalOpen(false);
        showNotification(`Successfully added "${newMedicine.name}" to inventory.`);
    };

    const handleSuggestAlternatives = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setSuggestionModalOpen(true);
    };

    const getPrescriptionStatusClass = (status: Prescription['status']) => {
        switch (status) {
            case 'Active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case 'Ready for Pickup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
            case 'Dispensed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Completed':
            case 'Cancelled': return 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
        }
    };
    
    const renderContent = () => {
        switch(activeTab) {
            case 'Prescriptions':
                const activePrescriptions = prescriptions.filter(p => ['Active', 'Ready for Pickup'].includes(p.status));
                return (
                    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Prescription Fulfillment Queue</h2>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                            {activePrescriptions.length > 0 ? activePrescriptions.map(p => (
                                <div key={p.id} className="p-4 bg-light dark:bg-dark-bg rounded-lg border dark:border-dark-border">
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div>
                                            <p className="font-bold text-lg dark:text-dark-text">{p.medication} {p.dosage}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">For: {p.patientName} | From: {p.doctorName}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPrescriptionStatusClass(p.status)}`}>{p.status}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t dark:border-gray-600 flex justify-end gap-2">
                                        {p.status === 'Active' && <button onClick={() => handleUpdatePrescriptionStatus(p.id, 'Ready for Pickup')} className="text-sm bg-secondary text-white font-semibold py-1 px-3 rounded-md hover:bg-green-600">Mark as Ready</button>}
                                        {p.status === 'Ready for Pickup' && <button onClick={() => handleUpdatePrescriptionStatus(p.id, 'Dispensed')} className="text-sm bg-primary text-white font-semibold py-1 px-3 rounded-md hover:bg-primary/90">Mark as Dispensed</button>}
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No active prescriptions to fulfill.</p>}
                        </div>
                    </div>
                );

            case 'Inventory':
                 return <InventoryManagement medicines={medicines} onAddMedicine={() => setAddModalOpen(true)} onSuggestAlternatives={handleSuggestAlternatives} />;

            case 'Analytics':
                return <Analytics medicines={medicines} />;
            
            default: return null;
        }
    };

    return (
        <>
            <NotificationBanner message={notification} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💊 Pharmacy Dashboard</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Welcome, {user.name}.</p>
                
                <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(['Prescriptions', 'Inventory', 'Analytics'] as PharmacyTab[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-8">{renderContent()}</div>
            </div>
            {isAddModalOpen && <AddMedicineModal onSave={handleAddMedicine} onClose={() => setAddModalOpen(false)} />}
            {isSuggestionModalOpen && selectedMedicine && (
                <AlternativeSuggestionsModal medicine={selectedMedicine} onClose={() => setSuggestionModalOpen(false)} />
            )}
        </>
    );
};

// --- Sub-components for tabs ---

const InventoryManagement: React.FC<{ medicines: Medicine[]; onAddMedicine: () => void; onSuggestAlternatives: (medicine: Medicine) => void; }> = ({ medicines, onAddMedicine, onSuggestAlternatives }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredMedicines = useMemo(() => medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [medicines, searchTerm]);

    const getStatus = (med: Medicine): { text: string; className: string; rowClassName: string; needsSuggestion: boolean; } => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(med.expiry);
        const isExpired = expiryDate < today;
        const isLowStock = med.quantity < 20;

        if (isExpired) return { text: '❌ Expired', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', rowClassName: 'bg-red-50 dark:bg-red-900/20', needsSuggestion: true };
        if (isLowStock) return { text: '⚠️ Low Stock', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', rowClassName: 'bg-yellow-50 dark:bg-yellow-900/20', needsSuggestion: true };
        return { text: '✅ Available', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', rowClassName: 'hover:bg-gray-50 dark:hover:bg-dark-bg', needsSuggestion: false };
    };

    const handleDownloadPdf = () => {
        try {
            const doc = new jsPDF();
            doc.text("Pharmacy Stock Report", 20, 20);
            autoTable(doc, {
                head: [['#', 'Name', 'Category', 'Quantity', 'Expiry Date', 'Status']],
                body: filteredMedicines.map((m, i) => [i + 1, String(m.name || ''), String(m.category || ''), String(m.quantity ?? ''), String(m.expiry || ''), getStatus(m).text]),
                startY: 35
            });
            doc.save("Pharmacy_Stock_Report.pdf");
        } catch (err) {
            console.error("Pharmacy stock report PDF generation error:", err);
            alert("Failed to download pharmacy stock report. Please try again.");
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text">Inventory</h2>
                <div className="flex gap-2">
                    <button onClick={onAddMedicine} className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition">➕ Add Medicine</button>
                    <button onClick={handleDownloadPdf} className="bg-secondary/20 text-secondary-800 font-semibold py-2 px-4 rounded-lg hover:bg-secondary/30 transition dark:bg-secondary/30 dark:text-white">📄 Download Report</button>
                </div>
            </div>
            <input type="text" placeholder="Search by name or category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 mb-4 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full">
                    <thead className="bg-light dark:bg-dark-bg sticky top-0">
                        <tr>{['Name', 'Category', 'Quantity', 'Expiry Date', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-2 px-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{h}</th>)}</tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-dark-text">
                        {filteredMedicines.map(med => {
                            const status = getStatus(med);
                            return (
                                <tr key={med.id} className={`border-b border-gray-200 dark:border-dark-border ${status.rowClassName}`}>
                                    <td className="py-2 px-3">{med.name}</td>
                                    <td className="py-2 px-3">{med.category}</td>
                                    <td className={`py-2 px-3 ${status.text.includes('Low Stock') ? 'font-bold text-yellow-600 dark:text-yellow-400' : ''}`}>{med.quantity}</td>
                                    <td className={`py-2 px-3 ${status.text === '❌ Expired' ? 'text-red-600 dark:text-red-400' : ''}`}>{med.expiry}</td>
                                    <td className="py-2 px-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}>{status.text}</span></td>
                                    <td className="py-2 px-3">
                                        {status.needsSuggestion && (
                                            <button onClick={() => onSuggestAlternatives(med)} className="text-xs bg-purple-100 text-purple-700 font-bold py-1 px-2 rounded hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300">
                                                Suggest Alternatives
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Analytics: React.FC<{ medicines: Medicine[] }> = ({ medicines }) => {
    const chartData = useMemo(() => {
        const categoryCounts = medicines.reduce((acc, med) => {
            acc[med.category] = (acc[med.category] || 0) + med.quantity;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
    }, [medicines]);

    const lowStockCount = medicines.filter(m => m.quantity < 20).length;
    const expiredCount = medicines.filter(m => new Date(m.expiry) < new Date()).length;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943'];

    return (
        <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-text mb-4">Stock Analytics</h2>
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">Low Stock Items</h3>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-white">{lowStockCount}</p>
                </div>
                 <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-lg">
                    <h3 className="font-semibold text-red-800 dark:text-red-300">Expired Items</h3>
                    <p className="text-2xl font-bold text-red-900 dark:text-white">{expiredCount}</p>
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text mb-2">Stock by Category</h3>
            <div className="w-full h-72">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PharmacyPortal;