import React, { useState, useEffect, useMemo } from 'react';
import type { HospitalLocation, LocationCategory } from '../../types';
import { 
  getHospitalLocations, 
  addHospitalLocation, 
  updateHospitalLocation, 
  deleteHospitalLocation, 
  resetDefaultLocations 
} from '../../services/wayFinderService';

type WingType = 'East Wing' | 'West Wing' | 'Central Atrium';

const CATEGORIES: LocationCategory[] = [
  'Clinical',
  'Emergency',
  'Diagnostics',
  'Pharmacy & Admin',
  'Amenities'
];

const WINGS: WingType[] = ['West Wing', 'Central Atrium', 'East Wing'];

const FLOOR_NAMES: Record<number, string> = {
  0: 'Ground Floor (L0)',
  1: '1st Floor (L1)',
  2: '2nd Floor (L2)',
  3: '3rd Floor (L3)'
};

interface LocationFormData {
  id?: string;
  name: string;
  roomNumber: string;
  floor: number;
  wing: WingType;
  category: LocationCategory;
  description: string;
  isWheelchairAccessible: boolean;
  coordinates: { x: number; y: number };
  department?: string;
  doctorName?: string;
  openHours?: string;
  contactExt?: string;
}

const LocationModal: React.FC<{
  initialData: HospitalLocation | null;
  onSave: (data: LocationFormData) => void;
  onClose: () => void;
}> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<LocationFormData>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        name: initialData.name,
        roomNumber: initialData.roomNumber,
        floor: initialData.floor,
        wing: initialData.wing,
        category: initialData.category,
        description: initialData.description,
        isWheelchairAccessible: initialData.isWheelchairAccessible,
        coordinates: { ...initialData.coordinates },
        department: initialData.department || '',
        doctorName: initialData.doctorName || '',
        openHours: initialData.openHours || '8:00 AM - 6:00 PM',
        contactExt: initialData.contactExt || ''
      };
    }
    return {
      name: '',
      roomNumber: '',
      floor: 0,
      wing: 'Central Atrium',
      category: 'Clinical',
      description: '',
      isWheelchairAccessible: true,
      coordinates: { x: 50, y: 50 },
      department: '',
      doctorName: '',
      openHours: '8:00 AM - 6:00 PM',
      contactExt: ''
    };
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.roomNumber.trim()) {
      setError('Please provide a Location Name and Room Number.');
      return;
    }
    setError('');
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-dark-border">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100 dark:border-dark-border">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧭</span>
            <span>{initialData ? 'Edit Hospital Location' : 'Add New Hospital Location'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Location / Facility Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cardiology OPD Suite"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Room / Bay Identifier *
              </label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. Room 204 or ER-101"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Floor
              </label>
              <select
                value={formData.floor}
                onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                <option value={0}>Ground Floor (L0)</option>
                <option value={1}>1st Floor (L1)</option>
                <option value={2}>2nd Floor (L2)</option>
                <option value={3}>3rd Floor (L3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Wing / Zone
              </label>
              <select
                value={formData.wing}
                onChange={e => setFormData({ ...formData, wing: e.target.value as WingType })}
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                {WINGS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as LocationCategory })}
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Assigned Doctor / Specialist
              </label>
              <input
                type="text"
                value={formData.doctorName || ''}
                onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="e.g. Dr. Jane Smith"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Cardiology"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
              Description & Directions Guidance
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Near West Wing elevators, equipped with echocardiography station."
              className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={formData.openHours || ''}
                onChange={e => setFormData({ ...formData, openHours: e.target.value })}
                placeholder="e.g. 8:30 AM - 5:00 PM"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Contact Extension
              </label>
              <input
                type="text"
                value={formData.contactExt || ''}
                onChange={e => setFormData({ ...formData, contactExt: e.target.value })}
                placeholder="e.g. x2040"
                className="w-full p-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Coordinate settings */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Map Pin Coordinates (% across SVG floor plan 0–100)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300">X Position (0 = Left, 100 = Right): {formData.coordinates.x}%</label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={formData.coordinates.x}
                  onChange={e => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, x: Number(e.target.value) }
                  })}
                  className="w-full accent-primary mt-1"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-300">Y Position (0 = Top, 100 = Bottom): {formData.coordinates.y}%</label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={formData.coordinates.y}
                  onChange={e => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, y: Number(e.target.value) }
                  })}
                  className="w-full accent-primary mt-1"
                />
              </div>
            </div>
          </div>

          {/* Wheelchair Accessible Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="wheelchairCheck"
              checked={formData.isWheelchairAccessible}
              onChange={e => setFormData({ ...formData, isWheelchairAccessible: e.target.checked })}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label htmlFor="wheelchairCheck" className="text-sm font-medium text-gray-800 dark:text-white cursor-pointer select-none flex items-center gap-1.5">
              <span>♿</span>
              <span>Verified Wheelchair Accessible Route (ADA Compliant, step-free corridor)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition"
            >
              {initialData ? 'Update Location' : 'Save Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const WayFinderManagement: React.FC = () => {
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingLocation, setEditingLocation] = useState<HospitalLocation | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Load locations
  useEffect(() => {
    setLocations(getHospitalLocations());
    const handleUpdate = () => setLocations(getHospitalLocations());
    window.addEventListener('mediconnect_wayfinder_updated', handleUpdate);
    return () => window.removeEventListener('mediconnect_wayfinder_updated', handleUpdate);
  }, []);

  const showStatus = (text: string, type: 'success' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSaveLocation = (data: LocationFormData) => {
    const floorName = FLOOR_NAMES[data.floor] || `Floor ${data.floor}`;
    if (data.id) {
      // Update
      const updatedLoc: HospitalLocation = {
        id: data.id,
        name: data.name,
        roomNumber: data.roomNumber,
        floor: data.floor,
        floorName,
        wing: data.wing,
        category: data.category,
        description: data.description,
        isWheelchairAccessible: data.isWheelchairAccessible,
        coordinates: data.coordinates,
        department: data.department || undefined,
        doctorName: data.doctorName || undefined,
        openHours: data.openHours || undefined,
        contactExt: data.contactExt || undefined
      };
      updateHospitalLocation(updatedLoc);
      setLocations(getHospitalLocations());
      setEditingLocation(null);
      showStatus(`Successfully updated "${updatedLoc.name}".`);
    } else {
      // Add new
      const newLoc = addHospitalLocation({
        name: data.name,
        roomNumber: data.roomNumber,
        floor: data.floor,
        floorName,
        wing: data.wing,
        category: data.category,
        description: data.description,
        isWheelchairAccessible: data.isWheelchairAccessible,
        coordinates: data.coordinates,
        department: data.department || undefined,
        doctorName: data.doctorName || undefined,
        openHours: data.openHours || undefined,
        contactExt: data.contactExt || undefined
      });
      setLocations(getHospitalLocations());
      setIsAddingNew(false);
      showStatus(`Successfully added new location "${newLoc.name}".`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from hospital navigation maps?`)) {
      deleteHospitalLocation(id);
      setLocations(getHospitalLocations());
      showStatus(`Removed "${name}" from hospital maps.`, 'info');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all hospital locations and route coordinates to verified defaults? Custom added rooms will be reset.')) {
      const reset = resetDefaultLocations();
      setLocations(reset);
      showStatus('All hospital map points have been reset to verified default directory.');
    }
  };

  // Filtered list
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesFloor = selectedFloor === 'all' || loc.floor === selectedFloor;
      const matchesCategory = categoryFilter === 'all' || loc.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        loc.name.toLowerCase().includes(q) ||
        loc.roomNumber.toLowerCase().includes(q) ||
        (loc.department && loc.department.toLowerCase().includes(q)) ||
        (loc.doctorName && loc.doctorName.toLowerCase().includes(q)) ||
        loc.wing.toLowerCase().includes(q)
      );
      return matchesFloor && matchesCategory && matchesSearch;
    });
  }, [locations, selectedFloor, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧭</span>
            <span className="text-xs uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              WayFinder Admin Engine
            </span>
          </div>
          <h2 className="text-2xl font-bold">Hospital Maps, Routes & Location Directory</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl">
            Manage interactive floor plan points, doctor consultation rooms, diagnostic centers, and verified ADA wheelchair accessible navigation paths.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-white text-primary hover:bg-blue-50 font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md transition flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add New Location</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="bg-white/10 hover:bg-white/20 text-white font-medium px-3.5 py-2.5 rounded-xl text-xs backdrop-blur-sm transition border border-white/20"
            title="Reset to default verified hospital directory"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
        }`}>
          <span>ℹ️</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Locations</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{locations.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Floors Covered</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">4 Floors (L0–L3)</p>
        </div>
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">♿ ADA Wheelchair Routes</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {locations.filter(l => l.isWheelchairAccessible).length} Verified
          </p>
        </div>
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Doctor Rooms</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {locations.filter(l => l.doctorName).length} Mapped
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by location name, room #, doctor, or department..."
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Floor selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-3 py-1.5 rounded-lg transition ${selectedFloor === 'all' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
            >
              All Floors
            </button>
            {[0, 1, 2, 3].map(floor => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-2.5 py-1.5 rounded-lg transition ${selectedFloor === floor ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}
              >
                L{floor}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="p-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
              <tr>
                <th className="py-3 px-4">Location & Room</th>
                <th className="py-3 px-4">Floor & Wing</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Doctor / Specialty</th>
                <th className="py-3 px-4">Accessibility</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No hospital locations match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLocations.map(loc => (
                  <tr key={loc.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{loc.name}</div>
                      <div className="text-xs font-mono text-primary dark:text-blue-400">{loc.roomNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800 dark:text-gray-200">{loc.floorName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{loc.wing}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {loc.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {loc.doctorName ? (
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{loc.doctorName}</span>
                          {loc.department && <span className="block text-xs text-gray-500">{loc.department}</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{loc.department || 'General Facility'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {loc.isWheelchairAccessible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span>♿</span> Verified ADA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                          Stairs Only
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      ({loc.coordinates.x}%, {loc.coordinates.y}%)
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setEditingLocation(loc)}
                        className="text-xs font-semibold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id, loc.name)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit */}
      {(isAddingNew || editingLocation) && (
        <LocationModal
          initialData={editingLocation}
          onSave={handleSaveLocation}
          onClose={() => {
            setIsAddingNew(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
};

export default WayFinderManagement;
