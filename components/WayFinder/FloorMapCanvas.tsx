import React from 'react';
import type { HospitalLocation, WayFinderRoute } from '../../types';

interface Point {
  x: number;
  y: number;
}

interface FloorMapCanvasProps {
  currentFloor: number;
  locations: HospitalLocation[];
  selectedLocation: HospitalLocation | null;
  startLocation: HospitalLocation | null;
  activeRoute: WayFinderRoute | null;
  onSelectLocation: (location: HospitalLocation) => void;
  onSelectStartLocation?: (location: HospitalLocation) => void;
  selectionMode?: 'destination' | 'start';
  onToggleSelectionMode?: (mode: 'destination' | 'start') => void;
  isWheelchairAccessible: boolean;
}

// Generates connected hallway waypoints between two points on the same floor
const generateCorridorPath = (p1: Point, p2: Point): Point[] => {
  const points: Point[] = [p1];

  const getCorridorX = (p: Point): number => {
    if (p.x < 36) return 20; // West Wing hallway
    if (p.x > 64) return 80; // East Wing hallway
    return 50; // Central Atrium hallway
  };

  const c1X = getCorridorX(p1);
  const c2X = getCorridorX(p2);

  // 1. Move from start room to its wing corridor
  if (p1.x !== c1X) {
    points.push({ x: c1X, y: p1.y });
  }

  // 2. Intra-corridor vs Cross-wing routing
  if (c1X === c2X) {
    // Both points are in the same wing / corridor
    if (p1.y !== p2.y) {
      points.push({ x: c1X, y: p2.y });
    }
  } else {
    // Different wings: Route through horizontal connector at y = 50
    if (p1.y !== 50) {
      points.push({ x: c1X, y: 50 });
    }
    // Cross central junction
    points.push({ x: 50, y: 50 });
    // Move into target wing horizontal corridor
    if (p2.y !== 50) {
      points.push({ x: c2X, y: 50 });
    }
    if (p2.y !== 50) {
      points.push({ x: c2X, y: p2.y });
    }
  }

  // 3. Move into destination room
  points.push(p2);
  return points;
};

export const FloorMapCanvas: React.FC<FloorMapCanvasProps> = ({
  currentFloor,
  locations,
  selectedLocation,
  startLocation,
  activeRoute,
  onSelectLocation,
  onSelectStartLocation,
  selectionMode = 'destination',
  onToggleSelectionMode,
  isWheelchairAccessible,
}) => {
  const floorLocations = locations.filter(loc => loc.floor === currentFloor);

  const getCategoryIcon = (cat: HospitalLocation['category']) => {
    switch (cat) {
      case 'Emergency': return '🚨';
      case 'Clinical': return '🩺';
      case 'Diagnostics': return '🔬';
      case 'Pharmacy & Admin': return '💊';
      case 'Amenities': return '♿';
      default: return '📍';
    }
  };

  // Determine path points on this floor
  const isStartOnThisFloor = startLocation?.floor === currentFloor;
  const isDestOnThisFloor = selectedLocation?.floor === currentFloor;
  const isMultiFloor = startLocation && selectedLocation && startLocation.floor !== selectedLocation.floor;

  // Elevator A coordinates on each floor
  const elevatorCoords: Point = { x: 50, y: 38 };

  let floorPathPoints: Point[] = [];
  let pathStartPoint: Point | null = null;
  let pathEndPoint: Point | null = null;

  if (activeRoute && startLocation && selectedLocation) {
    if (isStartOnThisFloor && isDestOnThisFloor) {
      // Both start and destination are on this floor
      if (startLocation.id !== selectedLocation.id) {
        pathStartPoint = startLocation.coordinates;
        pathEndPoint = selectedLocation.coordinates;
        floorPathPoints = generateCorridorPath(startLocation.coordinates, selectedLocation.coordinates);
      }
    } else if (isStartOnThisFloor && !isDestOnThisFloor) {
      // Journey starts on this floor, routes to Elevator A for vertical transit
      pathStartPoint = startLocation.coordinates;
      pathEndPoint = elevatorCoords;
      floorPathPoints = generateCorridorPath(startLocation.coordinates, elevatorCoords);
    } else if (!isStartOnThisFloor && isDestOnThisFloor) {
      // Journey arrives on this floor from Elevator A, routes to destination
      pathStartPoint = elevatorCoords;
      pathEndPoint = selectedLocation.coordinates;
      floorPathPoints = generateCorridorPath(elevatorCoords, selectedLocation.coordinates);
    }
  }

  // Generate SVG path string from connected corridor waypoints
  const pathD = floorPathPoints.length > 1
    ? floorPathPoints.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '')
    : '';

  const handleMarkerClick = (loc: HospitalLocation) => {
    if (selectionMode === 'start') {
      if (onSelectStartLocation) {
        onSelectStartLocation(loc);
      }
    } else {
      onSelectLocation(loc);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selection Mode Toggle Bar */}
      {onToggleSelectionMode && (
        <div className="flex items-center justify-between bg-white dark:bg-dark-card px-3.5 py-2 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm text-xs">
          <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>🖱️</span>
            <span>Map Click Target:</span>
          </span>
          <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 font-bold">
            <button
              type="button"
              onClick={() => onToggleSelectionMode('start')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
                selectionMode === 'start'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🚩</span> Set Starting Point
            </button>
            <button
              type="button"
              onClick={() => onToggleSelectionMode('destination')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1 ${
                selectionMode === 'destination'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>📍</span> Set Destination
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Map Frame */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 select-none">
        
        {/* Background Architectural Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* SVG Map Layout & Corridor Path Network */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Hospital Wings Outline */}
          {/* West Wing */}
          <rect x="8" y="15" width="28" height="70" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
          {/* Central Corridor & Atrium */}
          <rect x="36" y="25" width="28" height="58" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
          {/* East Wing */}
          <rect x="64" y="15" width="28" height="70" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />

          {/* Connected Architectural Hallway Paths (Gray Guides) */}
          {/* Horizontal Central Connector */}
          <line x1="20" y1="50" x2="80" y2="50" stroke="#475569" strokeWidth="1.6" strokeDasharray="1.5,1.5" />
          {/* West Wing Vertical Hallway */}
          <line x1="20" y1="20" x2="20" y2="80" stroke="#475569" strokeWidth="1.6" strokeDasharray="1.5,1.5" />
          {/* East Wing Vertical Hallway */}
          <line x1="80" y1="20" x2="80" y2="80" stroke="#475569" strokeWidth="1.6" strokeDasharray="1.5,1.5" />
          {/* Central Atrium Hallway */}
          <line x1="50" y1="35" x2="50" y2="88" stroke="#475569" strokeWidth="1.6" strokeDasharray="1.5,1.5" />

          {/* Wing Labels */}
          <text x="22" y="12" fill="#94a3b8" fontSize="2.8" fontWeight="bold" textAnchor="middle">WEST WING</text>
          <text x="50" y="22" fill="#38bdf8" fontSize="2.9" fontWeight="bold" textAnchor="middle">CENTRAL ATRIUM & ELEVATORS</text>
          <text x="78" y="12" fill="#94a3b8" fontSize="2.8" fontWeight="bold" textAnchor="middle">EAST WING</text>

          {/* Elevator & Vertical Transit Hub Indicator */}
          <rect x="44" y="32" width="12" height="12" rx="2" fill="#0369a1" fillOpacity="0.35" stroke="#38bdf8" strokeWidth="0.6" />
          <text x="50" y="39" fill="#bae6fd" fontSize="2.2" fontWeight="bold" textAnchor="middle">🛗 ELEVATOR A</text>
          <text x="50" y="42.5" fill="#38bdf8" fontSize="1.7" textAnchor="middle">♿ ADA Ramp</text>

          {/* Dynamic Connected Corridor Route Line */}
          {pathD && (
            <g>
              <path
                d={pathD}
                fill="none"
                stroke={isWheelchairAccessible ? "#10b981" : "#f59e0b"}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2,2"
                className="animate-pulse"
              />
              {/* Path Start Pin */}
              {pathStartPoint && (
                <circle cx={pathStartPoint.x} cy={pathStartPoint.y} r="2.4" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.9" />
              )}
              {/* Path End Pin */}
              {pathEndPoint && (
                <circle cx={pathEndPoint.x} cy={pathEndPoint.y} r="2.8" fill={isWheelchairAccessible ? "#10b981" : "#ef4444"} stroke="#ffffff" strokeWidth="1.0" />
              )}
            </g>
          )}
        </svg>

        {/* Floor Transit Banners */}
        {isMultiFloor && isStartOnThisFloor && (
          <div className="absolute top-3 left-3 bg-blue-950/90 border border-blue-500/80 text-blue-200 text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <span>🚩</span>
            <span>Route to Elevator A to reach {selectedLocation?.floorName}</span>
          </div>
        )}

        {isMultiFloor && isDestOnThisFloor && (
          <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
            <span>🛗</span>
            <span>Exit Elevator A from {startLocation?.floorName} → Follow path to destination</span>
          </div>
        )}

        {isWheelchairAccessible && pathD && (
          <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-xs px-2.5 py-1 rounded-full shadow flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>♿ Verified ADA Route Active</span>
          </div>
        )}

        {/* Interactive Location Markers */}
        {floorLocations.map(loc => {
          const isSelectedDest = selectedLocation?.id === loc.id;
          const isSelectedStart = startLocation?.id === loc.id;

          return (
            <div
              key={loc.id}
              style={{
                left: `${loc.coordinates.x}%`,
                top: `${loc.coordinates.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
            >
              {/* Ripple Pulse for Active Points */}
              {isSelectedDest && (
                <span className="absolute -inset-2 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
              )}
              {isSelectedStart && (
                <span className="absolute -inset-2 rounded-full bg-blue-400/40 animate-ping pointer-events-none" />
              )}

              {/* Pin Badge Button */}
              <button
                type="button"
                onClick={() => handleMarkerClick(loc)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg border transition-all cursor-pointer focus:outline-none ${
                  isSelectedDest
                    ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-400/40 scale-125 z-30'
                    : isSelectedStart
                    ? 'bg-blue-600 text-white border-white ring-4 ring-blue-400/40 scale-125 z-30'
                    : 'bg-slate-800/90 text-slate-200 border-slate-600 hover:bg-slate-700 hover:text-white hover:scale-110'
                }`}
                title={loc.name}
              >
                <span className="text-xs">
                  {isSelectedStart ? '🚩' : isSelectedDest ? '📍' : getCategoryIcon(loc.category)}
                </span>
                <span className="truncate max-w-[85px] sm:max-w-[120px]">{loc.roomNumber}</span>
              </button>

              {/* Interactive Hover Tooltip with Start & Destination Actions */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-900 text-slate-100 text-xs rounded-xl shadow-2xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-40 text-left">
                <div className="font-bold text-white truncate">{loc.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{loc.roomNumber} • {loc.wing}</div>
                {loc.doctorName && (
                  <div className="text-[11px] text-emerald-400 font-medium mt-1 truncate">👨‍⚕️ {loc.doctorName}</div>
                )}
                {loc.isWheelchairAccessible && (
                  <div className="text-[10px] text-blue-400 font-semibold mt-1">✓ Wheelchair Accessible</div>
                )}
                
                {/* Direct Set Buttons inside tooltip */}
                <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectStartLocation) onSelectStartLocation(loc);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                      isSelectedStart
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white'
                    }`}
                  >
                    <span>🚩</span> Start
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLocation(loc);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                      isSelectedDest
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white'
                    }`}
                  >
                    <span>📍</span> Dest
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map Legend */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Start (🚩)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Destination (📍)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Hallway Route</span>
        </div>
      </div>
    </div>
  );
};

export default FloorMapCanvas;
