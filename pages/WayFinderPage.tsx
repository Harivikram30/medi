import React, { useState, useEffect, useMemo } from 'react';
import type { HospitalLocation, WayFinderRoute } from '../types';
import { getHospitalLocations, calculateRoute } from '../services/wayFinderService';
import FloorMapCanvas from '../components/WayFinder/FloorMapCanvas';
import QRCodeModal from '../components/WayFinder/QRCodeModal';

interface WayFinderPageProps {
  initialDestinationId?: string;
}

export const WayFinderPage: React.FC<WayFinderPageProps> = ({ initialDestinationId }) => {
  const [locations, setLocations] = useState<HospitalLocation[]>(() => getHospitalLocations());
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isWheelchairAccessible, setIsWheelchairAccessible] = useState<boolean>(true);
  const [selectionMode, setSelectionMode] = useState<'destination' | 'start'>('destination');
  const [inspectedLocation, setInspectedLocation] = useState<HospitalLocation | null>(null);

  // Default starting point: Main Hospital Entrance & Reception (NOT an elevator)
  const FALLBACK_LOCATION: HospitalLocation = {
    id: 'loc_g01',
    name: 'Main Hospital Entrance & Reception',
    roomNumber: 'Lobby',
    floor: 0,
    floorName: 'Ground Floor',
    wing: 'Central Atrium',
    category: 'Amenities',
    description: 'Main hospital entrance, welcome desk and visitor information.',
    isWheelchairAccessible: true,
    coordinates: { x: 50, y: 88 },
    openHours: '24/7'
  };

  const defaultStart = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];
    return list.find(l => l?.id === 'loc_g01') || 
           list.find(l => (l?.name || '').toLowerCase().includes('entrance')) || 
           list[0] ||
           FALLBACK_LOCATION;
  }, [locations]);

  // Destination defaults to initialDestinationId or Cardiology Room 204
  const defaultDestination = useMemo(() => {
    const list = Array.isArray(locations) ? locations : [];
    if (initialDestinationId) {
      const match = list.find(l => l?.id === initialDestinationId || (l?.roomNumber || '').toLowerCase().includes(initialDestinationId.toLowerCase()));
      if (match) return match;
    }
    return list.find(l => l?.roomNumber === 'Room 204') || list[1] || list[0] || FALLBACK_LOCATION;
  }, [initialDestinationId, locations]);

  const [startLocation, setStartLocation] = useState<HospitalLocation>(defaultStart);
  const [selectedLocation, setSelectedLocation] = useState<HospitalLocation>(defaultDestination);
  const [isQRModalOpen, setQRModalOpen] = useState(false);

  // Sync on real-time update events
  useEffect(() => {
    const handleUpdate = () => {
      const updated = getHospitalLocations();
      setLocations(updated);
      setStartLocation(prev => updated.find(l => l.id === prev.id) || prev);
      setSelectedLocation(prev => updated.find(l => l.id === prev.id) || prev);
    };
    window.addEventListener('mediconnect_wayfinder_updated', handleUpdate);
    return () => window.removeEventListener('mediconnect_wayfinder_updated', handleUpdate);
  }, []);

  // Sync inspected location with selected location by default
  useEffect(() => {
    if (!inspectedLocation && selectedLocation) {
      setInspectedLocation(selectedLocation);
    }
  }, [selectedLocation, inspectedLocation]);

  // Handle URL parameters directly on load or when initialDestinationId changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const destParam = initialDestinationId || params.get('dest');
    const roomParam = params.get('room');
    const wheelchairParam = params.get('wheelchair');
    const startParam = params.get('start');

    if (wheelchairParam !== null) {
      setIsWheelchairAccessible(wheelchairParam === '1' || wheelchairParam === 'true');
    }

    if (startParam) {
      const matchStart = locations.find(l => 
        l.id.toLowerCase() === startParam.toLowerCase() || 
        l.roomNumber.toLowerCase().includes(startParam.toLowerCase()) ||
        l.name.toLowerCase().includes(startParam.toLowerCase())
      );
      if (matchStart) {
        setStartLocation(matchStart);
      }
    }

    const targetQuery = destParam || roomParam;
    if (targetQuery) {
      const targetLower = targetQuery.toLowerCase();
      const match = locations.find(l => 
        l.id.toLowerCase() === targetLower || 
        l.roomNumber.toLowerCase().includes(targetLower) ||
        l.name.toLowerCase().includes(targetLower)
      );
      if (match) {
        setSelectedLocation(match);
        setInspectedLocation(match);
        setCurrentFloor(match.floor);
      }
    }
  }, [initialDestinationId, locations]);

  // Calculate active route immediately whenever start, destination, or wheelchair mode changes
  const activeRoute: WayFinderRoute | null = useMemo(() => {
    if (!startLocation || !selectedLocation) return null;
    return calculateRoute(startLocation, selectedLocation, isWheelchairAccessible);
  }, [startLocation, selectedLocation, isWheelchairAccessible]);

  // Filtered locations based on search query and category
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesCategory = selectedCategory === 'All' || loc.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesQuery = 
        loc.name.toLowerCase().includes(query) ||
        loc.roomNumber.toLowerCase().includes(query) ||
        (loc.department && loc.department.toLowerCase().includes(query)) ||
        (loc.doctorName && loc.doctorName.toLowerCase().includes(query)) ||
        loc.wing.toLowerCase().includes(query) ||
        loc.floorName.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [locations, searchQuery, selectedCategory]);

  const floors = [
    { number: 0, name: 'Ground Floor (L0)', label: 'Emergency, OPD, Pharmacy & Reception' },
    { number: 1, name: '1st Floor (L1)', label: 'General Physician, Pediatrics & Diagnostic Lab' },
    { number: 2, name: '2nd Floor (L2)', label: 'Cardiology, Internal Medicine & ICU' },
    { number: 3, name: '3rd Floor (L3)', label: 'Neurology, Orthopedics & Dental Studio' },
  ];

  const categories: string[] = ['All', 'Clinical', 'Emergency', 'Diagnostics', 'Pharmacy & Admin', 'Amenities'];

  // Swap starting point and destination
  const handleSwapPoints = () => {
    const temp = startLocation;
    setStartLocation(selectedLocation);
    setSelectedLocation(temp);
    setInspectedLocation(temp);
    setCurrentFloor(temp.floor);
  };

  // Set location as Start Point
  const handleSetStartLocation = (loc: HospitalLocation) => {
    setStartLocation(loc);
    setInspectedLocation(loc);
  };

  // Set location as Destination
  const handleSetDestinationLocation = (loc: HospitalLocation) => {
    setSelectedLocation(loc);
    setInspectedLocation(loc);
    setCurrentFloor(loc.floor);
  };

  // Group locations by floor for clear dropdown selection
  const groupedLocations = useMemo(() => {
    return [0, 1, 2, 3].map(floorNum => ({
      floorNum,
      floorName: floors[floorNum]?.name || `Floor ${floorNum}`,
      items: locations.filter(l => l.floor === floorNum)
    }));
  }, [locations]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
      {/* Page Title & Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🧭</span>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              MediConnect WayFinder™
            </h1>
            <span className="bg-primary/10 text-primary dark:bg-primary/30 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Interactive Hospital Maps
            </span>
          </div>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            Interactive floor maps, step-by-step turn directions, and verified wheelchair-accessible routes.
          </p>
        </div>

        {/* Quick QR Mobile Scan Action */}
        <button
          onClick={() => setQRModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-800 text-white font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all text-sm self-start md:self-auto"
        >
          <span>📱</span> Open QR Mobile Pass
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-md border border-gray-200 dark:border-dark-border mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search doctors, departments, rooms, entrance, reception or elevators (e.g. Reception, ER-101, Elevator A, Dr. Jane Smith, Room 204)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-800 transition text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* Instant Search Results Dropdown Panel */}
        {searchQuery.trim() && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block px-1">
              Matching Locations ({filteredLocations.length}):
            </span>
            {filteredLocations.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 px-1 py-2">
                No hospital locations found matching "{searchQuery}".
              </p>
            ) : (
              filteredLocations.map(loc => (
                <div 
                  key={loc.id} 
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-xs hover:border-primary transition"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-gray-900 dark:text-white truncate block">{loc.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-[11px] block">
                      {loc.roomNumber} • {loc.floorName} ({loc.wing})
                      {loc.doctorName && ` • 👨‍⚕️ ${loc.doctorName}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetStartLocation(loc)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                        startLocation.id === loc.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
                      }`}
                    >
                      <span>🚩</span> Start
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDestinationLocation(loc)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1 ${
                        selectedLocation.id === loc.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <span>📍</span> Dest
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
            Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Route Planner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center: Interactive Floor Map (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Floor Switcher Tabs with Start / Dest Badges */}
          <div className="bg-white dark:bg-dark-card p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {floors.map((floor) => {
              const isStartFloor = startLocation?.floor === floor.number;
              const isDestFloor = selectedLocation?.floor === floor.number;
              const isCurrent = currentFloor === floor.number;

              return (
                <button
                  key={floor.number}
                  onClick={() => setCurrentFloor(floor.number)}
                  className={`py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all text-center flex flex-col items-center justify-center relative ${
                    isCurrent
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="truncate">{floor.name}</span>
                  <div className="flex gap-1 mt-1">
                    {isStartFloor && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500 text-white shadow-xs">
                        🚩 Start
                      </span>
                    )}
                    {isDestFloor && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-white shadow-xs">
                        📍 Dest
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Interactive Map Canvas */}
          <FloorMapCanvas
            currentFloor={currentFloor}
            locations={filteredLocations}
            selectedLocation={selectedLocation}
            startLocation={startLocation}
            activeRoute={activeRoute}
            onSelectLocation={handleSetDestinationLocation}
            onSelectStartLocation={handleSetStartLocation}
            selectionMode={selectionMode}
            onToggleSelectionMode={(mode) => setSelectionMode(mode)}
            isWheelchairAccessible={isWheelchairAccessible}
          />

          {/* Inspected / Selected Location Summary Card with BOTH Start & Dest Action Buttons */}
          {(inspectedLocation || selectedLocation) && (() => {
            const displayLoc = inspectedLocation || selectedLocation;
            const isStart = startLocation.id === displayLoc.id;
            const isDest = selectedLocation.id === displayLoc.id;

            return (
              <div className="bg-white dark:bg-dark-card p-5 rounded-2xl shadow-md border border-gray-200 dark:border-dark-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {isStart ? '🚩' : isDest ? '📍' : '🏢'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {displayLoc.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {displayLoc.roomNumber} • {displayLoc.floorName} ({displayLoc.wing})
                    </p>
                  </div>

                  {/* Explicit Action Buttons to Set as Start or Destination */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetStartLocation(displayLoc)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm ${
                        isStart
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <span>🚩</span>
                      <span>{isStart ? 'Current Start Point' : 'Set as Starting Point'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetDestinationLocation(displayLoc)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 shadow-sm ${
                        isDest
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      <span>📍</span>
                      <span>{isDest ? 'Current Destination' : 'Set as Destination'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQRModalOpen(true)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-semibold transition"
                      title="Open QR Code pass for this location"
                    >
                      QR Code
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                  {displayLoc.description}
                </p>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {displayLoc.doctorName && (
                    <div>
                      Attending: <strong className="text-gray-900 dark:text-white">{displayLoc.doctorName}</strong>
                    </div>
                  )}
                  <div>
                    Hours: <strong className="text-gray-900 dark:text-white">{displayLoc.openHours}</strong>
                  </div>
                  {displayLoc.contactExt && (
                    <div>
                      Ext: <strong className="text-gray-900 dark:text-white">{displayLoc.contactExt}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right: Step-by-Step Directions & Route Planner (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-md border border-gray-200 dark:border-dark-border space-y-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🚶</span> Route Directions
            </h2>

            {/* Start and Destination Selection Inputs */}
            <div className="space-y-3">
              {/* Start Location Selector */}
              <div>
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🚩</span> Starting Point
                  </span>
                  <span className="text-[11px] font-normal text-gray-400">
                    {startLocation?.floorName}
                  </span>
                </label>
                <select
                  id="startingPointSelect"
                  value={startLocation?.id}
                  onChange={(e) => {
                    const match = locations.find(l => l.id === e.target.value);
                    if (match) {
                      handleSetStartLocation(match);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {groupedLocations.map(group => (
                    <optgroup key={group.floorNum} label={group.floorName}>
                      {group.items.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.roomNumber})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-1">
                <button
                  type="button"
                  onClick={handleSwapPoints}
                  title="Swap Starting Point & Destination"
                  className="p-1.5 px-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition text-xs font-bold shadow-sm flex items-center gap-1 border border-gray-200 dark:border-gray-600"
                >
                  <span>⇅</span> Swap Start & Destination
                </button>
              </div>

              {/* Destination Location Selector */}
              <div>
                <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>📍</span> Destination Room / Facility
                  </span>
                  <span className="text-[11px] font-normal text-gray-400">
                    {selectedLocation?.floorName}
                  </span>
                </label>
                <select
                  id="destinationSelect"
                  value={selectedLocation?.id}
                  onChange={(e) => {
                    const match = locations.find(l => l.id === e.target.value);
                    if (match) {
                      handleSetDestinationLocation(match);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {groupedLocations.map(group => (
                    <optgroup key={group.floorNum} label={group.floorName}>
                      {group.items.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.roomNumber})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Wheelchair Accessibility Route Toggle */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">♿</span>
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Wheelchair-Accessible Route
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Avoids stairs • Uses ADA elevators & wide ramps
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsWheelchairAccessible(!isWheelchairAccessible)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isWheelchairAccessible ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={isWheelchairAccessible}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isWheelchairAccessible ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Route Summary Overview Card */}
            {activeRoute && (
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide text-[10px]">
                    Navigation Overview
                  </span>
                  <span className="font-mono text-gray-500 dark:text-gray-400">
                    {startLocation.floor === selectedLocation.floor ? 'Single Floor' : `Transit (${Math.abs(startLocation.floor - selectedLocation.floor)} Floors)`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 bg-white dark:bg-dark-card rounded-lg shadow-xs">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Est. Time</span>
                    <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                      ~{activeRoute.estimatedMinutes} min
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-dark-card rounded-lg shadow-xs">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Distance</span>
                    <span className="text-lg font-extrabold text-gray-800 dark:text-white">
                      {activeRoute.totalDistanceMeters} m
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step-by-Step Directions Turn List */}
            {activeRoute && (
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Step-by-Step Instructions ({activeRoute.steps.length})
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {activeRoute.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 text-xs flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                        {step.icon || step.stepNumber}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.distanceMeters > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Approx. {step.distanceMeters} meters
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal for Phone Handoff */}
      {selectedLocation && (
        <QRCodeModal
          location={selectedLocation}
          route={activeRoute}
          isOpen={isQRModalOpen}
          onClose={() => setQRModalOpen(false)}
        />
      )}
    </div>
  );
};

export default WayFinderPage;
