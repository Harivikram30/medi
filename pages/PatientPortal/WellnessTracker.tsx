
import React, { useState, useMemo } from 'react';
import { MOCK_WELLNESS_DATA } from '../../constants';
import type { WellnessEntry } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WellnessTrackerProps {
  patientId: string;
}

type MetricType = 'bloodPressure' | 'bloodSugar' | 'weight';

const WellnessTracker: React.FC<WellnessTrackerProps> = ({ patientId }) => {
  const [entries, setEntries] = useState<WellnessEntry[]>(
    MOCK_WELLNESS_DATA.filter(e => e.patientId === patientId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('bloodPressure');

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [weight, setWeight] = useState('');
  
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WellnessEntry = {
      id: `w_${new Date().getTime()}`,
      patientId,
      date,
    };
    if (systolic && diastolic) {
      newEntry.bloodPressure = { systolic: parseInt(systolic), diastolic: parseInt(diastolic) };
    }
    if (bloodSugar) {
      newEntry.bloodSugar = parseInt(bloodSugar);
    }
    if (weight) {
      newEntry.weight = parseFloat(weight);
    }

    if (Object.keys(newEntry).length > 3) { // id, patientId, date + at least one metric
        setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        // Reset form
        setSystolic('');
        setDiastolic('');
        setBloodSugar('');
        setWeight('');
    } else {
        alert("Please enter at least one health metric.");
    }
  };

  const chartData = useMemo(() => {
    return entries
      .map(entry => {
        const dataPoint: any = { date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
        if (selectedMetric === 'bloodPressure' && entry.bloodPressure) {
          dataPoint.Systolic = entry.bloodPressure.systolic;
          dataPoint.Diastolic = entry.bloodPressure.diastolic;
        } else if (selectedMetric === 'bloodSugar' && entry.bloodSugar) {
          dataPoint['Blood Sugar'] = entry.bloodSugar;
        } else if (selectedMetric === 'weight' && entry.weight) {
          dataPoint.Weight = entry.weight;
        }
        return dataPoint;
      })
      .filter(dp => Object.keys(dp).length > 1) // Ensure it has metric data
      .reverse(); // For chronological order in chart
  }, [entries, selectedMetric]);

  const renderMetric = (entry: WellnessEntry) => {
    const parts = [];
    if (entry.bloodPressure) parts.push(`BP: ${entry.bloodPressure.systolic}/${entry.bloodPressure.diastolic}`);
    if (entry.bloodSugar) parts.push(`Sugar: ${entry.bloodSugar} mg/dL`);
    if (entry.weight) parts.push(`Weight: ${entry.weight} kg`);
    return parts.join(' | ');
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-text mb-6">Wellness Tracker</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1 bg-light dark:bg-dark-bg p-6 rounded-lg border dark:border-dark-border">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Log New Entry</h3>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Pressure (mmHg)</legend>
                <div className="flex gap-2 mt-1">
                    <input type="number" placeholder="Systolic" value={systolic} onChange={e => setSystolic(e.target.value)} className="block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input type="number" placeholder="Diastolic" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
            </fieldset>
            <div>
              <label htmlFor="bloodSugar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Sugar (mg/dL)</label>
              <input type="number" id="bloodSugar" value={bloodSugar} onChange={e => setBloodSugar(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
              <input type="number" step="0.1" id="weight" value={weight} onChange={e => setWeight(e.target.value)} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button type="submit" className="w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition">Add Entry</button>
          </form>
        </div>

        {/* Data & Chart */}
        <div className="lg:col-span-2">
            <div className="mb-4">
              <label htmlFor="metric-select" className="sr-only">Select Metric</label>
              <select id="metric-select" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value as MetricType)} className="p-2 border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="bloodPressure">Blood Pressure</option>
                <option value="bloodSugar">Blood Sugar</option>
                <option value="weight">Weight</option>
              </select>
            </div>
          
            <div className="h-80 bg-light dark:bg-dark-bg p-4 rounded-lg border dark:border-dark-border">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                  <XAxis dataKey="date" tick={{ fill: '#A0AEC0' }} />
                  <YAxis tick={{ fill: '#A0AEC0' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} />
                  <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                  {selectedMetric === 'bloodPressure' && <Line type="monotone" dataKey="Systolic" stroke="#8884d8" />}
                  {selectedMetric === 'bloodPressure' && <Line type="monotone" dataKey="Diastolic" stroke="#82ca9d" />}
                  {selectedMetric === 'bloodSugar' && <Line type="monotone" dataKey="Blood Sugar" stroke="#ffc658" />}
                  {selectedMetric === 'weight' && <Line type="monotone" dataKey="Weight" stroke="#ff7300" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Log History</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {entries.map(entry => (
                        <div key={entry.id} className="bg-light dark:bg-dark-bg p-3 rounded-md border dark:border-dark-border">
                            <p className="font-semibold text-gray-800 dark:text-dark-text">{new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{renderMetric(entry)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WellnessTracker;
