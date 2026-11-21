import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Clock,
  Search,
  TrainFront,
} from 'lucide-react';
import { RAIL_STATIONS, RAIL_TRAINS } from '../data/railData';
import { searchTrains } from '../utils/railLogic';
import type { Station, TrainInfo } from '../types/rail';
import { StationSearchField } from './StationSearchField';

interface TrainSearchScheduleViewProps {
  stations?: Station[];
  onBack: () => void;
  onSelectTrainForBooking: (train: TrainInfo) => void;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function TrainSearchScheduleView({
  stations = RAIL_STATIONS,
  onBack,
  onSelectTrainForBooking,
}: TrainSearchScheduleViewProps) {
  const [selectedTrainNo, setSelectedTrainNo] = useState('12930');
  const [fromCode, setFromCode] = useState('NDLS');
  const [toCode, setToCode] = useState('CNB');
  const [runFilter, setRunFilter] = useState<'All Trains' | 'Trains on Run'>('All Trains');
  const [activeScheduleTrain, setActiveScheduleTrain] = useState<TrainInfo | null>(null);
  const [routeResults, setRouteResults] = useState<TrainInfo[] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '12930 · BRC - BL INTERCITY',
    '22416 · VANDE BHARAT EXP',
    'NDLS → CNB',
  ]);

  const handleOpenSchedule = (trainNo: string) => {
    const found = RAIL_TRAINS.find((t) => t.number === trainNo) ?? RAIL_TRAINS[0];
    setActiveScheduleTrain(found);
    setRecentSearches((prev) =>
      prev.includes(`${found.number} · ${found.name}`)
        ? prev
        : [`${found.number} · ${found.name}`, ...prev.slice(0, 4)]
    );
  };

  const handleRouteSearch = () => {
    const res = searchTrains(RAIL_TRAINS, { fromCode, toCode });
    setRouteResults(res);
    const label = `${fromCode} → ${toCode}`;
    setRecentSearches((prev) => (prev.includes(label) ? prev : [label, ...prev.slice(0, 4)]));
  };

  // Screenshot 15: Blue Train Schedule Screen
  if (activeScheduleTrain) {
    return (
      <div className="max-w-3xl mx-auto pb-8">
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#0B63E5] text-white px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveScheduleTrain(null)}
                aria-label="Back to Search Trains"
                className="h-10 w-10 rounded-xl hover:bg-white/15 flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-base sm:text-lg font-bold">Train Schedule</h1>
                <p className="text-xs text-blue-100">Schedule Date: Today</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTrainForBooking(activeScheduleTrain)}
              className="min-h-[36px] px-3.5 rounded-xl bg-white text-[#0B63E5] text-xs font-bold hover:bg-blue-50"
            >
              Book Seats
            </button>
          </div>

          <div className="p-5 bg-[#F8FBFF] border-b border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-sm sm:text-base font-bold text-slate-900">
                <span className="font-mono-num">{activeScheduleTrain.number}</span> |{' '}
                {activeScheduleTrain.name}
              </p>
              <span className="text-xs font-semibold text-[#0B63E5]">
                {activeScheduleTrain.category} ·{' '}
                {activeScheduleTrain.classes.map((c) => c.code).join(', ')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>
                {activeScheduleTrain.fromName} ({activeScheduleTrain.fromCode})
              </span>
              <span className="font-mono-num font-semibold text-slate-800">
                — {activeScheduleTrain.duration} —
              </span>
              <span>
                {activeScheduleTrain.toName} ({activeScheduleTrain.toCode})
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-1">
              {DAY_LETTERS.map((l, i) => (
                <span
                  key={i}
                  className={`text-[11px] font-bold ${
                    activeScheduleTrain.runningDays[i] ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule Table matching Screenshot 15 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">Sr</th>
                  <th className="py-3 px-4">Station Name</th>
                  <th className="py-3 px-3 text-center">Day</th>
                  <th className="py-3 px-4">Arr. / Dep.</th>
                  <th className="py-3 px-3 text-right">Halt</th>
                  <th className="py-3 px-4 text-right">Dist. Kms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeScheduleTrain.schedule.map((stop) => (
                  <tr key={stop.sr} className="hover:bg-[#F8FBFF]">
                    <td className="py-3 px-4 font-mono-num text-slate-500">{stop.sr}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{stop.stationCode}</p>
                      <p className="text-[11px] text-slate-500">{stop.stationName}</p>
                    </td>
                    <td className="py-3 px-3 text-center font-mono-num text-slate-700">
                      {stop.day}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-slate-800">
                      <div>{stop.arrival}</div>
                      <div className="text-slate-500">{stop.departure}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-600">
                      {stop.haltMins > 0 ? `${stop.haltMins}m` : '0'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-800">
                      {stop.distanceKm}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Screenshot 14: Search Trains Screen
  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
            Search Trains
          </h1>
        </div>

        {/* Search by Train Number / Name */}
        <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-[#F9FBFF]">
          <label htmlFor="train-sched-select" className="block text-xs font-semibold text-slate-600">
            Train Number / Name
          </label>
          <div className="flex items-center gap-2">
            <TrainFront className="h-5 w-5 text-[#0B63E5] shrink-0" />
            <select
              id="train-sched-select"
              value={selectedTrainNo}
              onChange={(e) => setSelectedTrainNo(e.target.value)}
              className="flex-1 min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
            >
              {RAIL_TRAINS.map((t) => (
                <option key={t.number} value={t.number}>
                  {t.number} - {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => handleOpenSchedule(selectedTrainNo)}
            className="w-full min-h-[46px] rounded-full bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2] transition-colors"
          >
            Schedule
          </button>
        </div>

        {/* Search by From / To */}
        <div className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-[#F9FBFF] relative">
          <div className="pr-12">
            <StationSearchField
              id="st-from"
              label="From"
              valueCode={fromCode}
              stations={stations}
              onChange={(st) => setFromCode(st.code)}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFromCode(toCode);
              setToCode(fromCode);
            }}
            aria-label="Swap stations"
            className="absolute right-4 top-[78px] z-10 h-10 w-10 rounded-full bg-[#DCEAFF] text-[#0B63E5] border border-blue-200 flex items-center justify-center hover:bg-[#0B63E5] hover:text-white transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>

          <div className="pr-12">
            <StationSearchField
              id="st-to"
              label="To"
              valueCode={toCode}
              stations={stations}
              onChange={(st) => setToCode(st.code)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['All Trains', 'Trains on Run'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRunFilter(tab)}
                className={`min-h-[40px] rounded-full border text-xs font-semibold transition-colors ${
                  runFilter === tab
                    ? 'border-[#0B63E5] bg-[#EAF4FF] text-[#0B63E5]'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRouteSearch}
            className="w-full min-h-[46px] rounded-full bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2] transition-colors inline-flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </div>

        {/* Recent Searches */}
        <div className="space-y-2">
          <h2 className="font-display text-xs font-bold text-slate-600">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  const num = item.split(' ')[0];
                  if (/^\d+$/.test(num)) {
                    setSelectedTrainNo(num);
                    handleOpenSchedule(num);
                  } else {
                    const [f, t] = item.split(' → ');
                    if (f && t) {
                      setFromCode(f);
                      setToCode(t);
                      setRouteResults(searchTrains(RAIL_TRAINS, { fromCode: f, toCode: t }));
                    }
                  }
                }}
                className="min-h-[36px] px-3 rounded-xl bg-slate-100 hover:bg-[#EAF4FF] hover:text-[#0B63E5] text-xs font-medium text-slate-700 inline-flex items-center gap-1.5"
              >
                <Clock className="h-3 w-3" /> {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Route Search Results */}
      {routeResults && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-bold text-slate-800">
            {routeResults.length} Trains Found ({fromCode} → {toCode} · {runFilter})
          </h2>
          {routeResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              No direct trains found for {fromCode} → {toCode}. Try NDLS → CNB or BRC → BL.
            </div>
          ) : (
            routeResults.map((tr) => (
              <div
                key={tr.number}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="font-mono-num text-xs font-semibold text-[#0B63E5]">
                    {tr.number} · {tr.category}
                  </p>
                  <p className="font-display text-sm font-bold text-slate-900">{tr.name}</p>
                  <p className="text-xs text-slate-500 font-mono-num">
                    {tr.departureTime} ({tr.fromCode}) → {tr.arrivalTime} ({tr.toCode}) ·{' '}
                    {tr.duration}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSchedule(tr.number)}
                    className="min-h-[38px] px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTrainForBooking(tr)}
                    className="min-h-[38px] px-3.5 rounded-xl bg-[#0B63E5] text-white text-xs font-semibold hover:bg-[#0952C2]"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
