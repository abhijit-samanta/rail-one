import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Info,
  QrCode,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';
import { RAIL_STATIONS, UNRESERVED_UPCOMING_TRAINS } from '../data/railData';
import {
  calculatePlatformFare,
  calculateUnreservedFare,
  formatBookingDateLabel,
  formatBookingTimestamp,
  generateUtsNumber,
} from '../utils/railLogic';
import {
  calculateFare,
  calculateSuburbanFareBreakdown,
  findSuburbanPath,
  getOfficialEasternRailwayFareDb,
} from '../utils/suburbanLogic';
import type { BookingRecord, Station, UserProfile } from '../types/rail';
import type { EasternRailwaySuburbanFareDb, SuburbanIndex } from '../types/suburban';
import { StationSearchField } from './StationSearchField';

interface UnreservedBookingViewProps {
  initialTab?: 'unreserved' | 'platform';
  initialFromCode?: string;
  initialToCode?: string;
  initialPlatformCode?: string;
  stations?: Station[];
  suburbanIndex?: SuburbanIndex | null;
  fareDb?: EasternRailwaySuburbanFareDb;
  profile: UserProfile;
  onBack: () => void;
  onCompleteBooking: (booking: BookingRecord, debitWallet: number) => void;
  onOpenBookings: () => void;
}

export function UnreservedBookingView({
  initialTab = 'unreserved',
  initialFromCode,
  initialToCode,
  initialPlatformCode,
  stations = RAIL_STATIONS,
  suburbanIndex = null,
  fareDb = getOfficialEasternRailwayFareDb(),
  profile,
  onBack,
  onCompleteBooking,
  onOpenBookings,
}: UnreservedBookingViewProps) {
  const [ticketMode, setTicketMode] = useState<'unreserved' | 'platform'>(initialTab);
  const [utsSubMode, setUtsSubMode] = useState<'Normal' | 'Season'>('Normal');
  const [stationProximity, setStationProximity] = useState<'Outside Station' | 'At Station'>(
    'Outside Station'
  );
  const [fromCode, setFromCode] = useState(initialFromCode ?? 'NDLS');
  const [toCode, setToCode] = useState(initialToCode ?? 'PWL');
  const [trainType, setTrainType] = useState<'Ordinary' | 'Mail/Express' | 'Superfast'>('Ordinary');
  const [classCode, setClassCode] = useState<'II' | 'FC'>('II');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [payWithRWallet, setPayWithRWallet] = useState(true);

  // Platform ticket state
  const [platformStationCode, setPlatformStationCode] = useState(initialPlatformCode ?? 'NDLS');
  const [platformPersons, setPlatformPersons] = useState(1);

  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<BookingRecord | null>(null);

  useEffect(() => {
    setTicketMode(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialFromCode) setFromCode(initialFromCode);
  }, [initialFromCode]);

  useEffect(() => {
    if (initialToCode) setToCode(initialToCode);
  }, [initialToCode]);

  useEffect(() => {
    if (initialPlatformCode) setPlatformStationCode(initialPlatformCode);
  }, [initialPlatformCode]);

  const fromStation =
    stations.find(
      (s) =>
        s.code.toUpperCase() === fromCode.toUpperCase() ||
        s.stationId?.toLowerCase() === fromCode.toLowerCase()
    ) ?? stations[0];
  const toStation =
    stations.find(
      (s) =>
        s.code.toUpperCase() === toCode.toUpperCase() ||
        s.stationId?.toLowerCase() === toCode.toLowerCase()
    ) ?? stations[2] ?? stations[0];
  const platformStation =
    stations.find(
      (s) =>
        s.code.toUpperCase() === platformStationCode.toUpperCase() ||
        s.stationId?.toLowerCase() === platformStationCode.toLowerCase()
    ) ?? stations[0];

  const suburbanPath = useMemo(() => {
    if (!suburbanIndex) return null;
    const fromSubKey = fromStation.stationId ?? fromStation.code;
    const toSubKey = toStation.stationId ?? toStation.code;
    const res = findSuburbanPath(suburbanIndex, fromSubKey, toSubKey);
    return res.fromStation && res.toStation ? res : null;
  }, [suburbanIndex, fromStation, toStation]);

  const estimatedDistanceKm = useMemo(() => {
    if (fromCode === toCode) return 1;
    if (suburbanPath && suburbanPath.found && suburbanPath.totalProvisionalKm !== null) {
      return Math.max(1, suburbanPath.totalProvisionalKm);
    }
    const idxA = stations.findIndex((s) => s.code === fromCode);
    const idxB = stations.findIndex((s) => s.code === toCode);
    return Math.max(5, Math.abs(idxA - idxB) * 12 + 20);
  }, [fromCode, toCode, suburbanPath, stations]);

  const suburbanFareBreakdown = useMemo(() => {
    if (!suburbanPath || !suburbanPath.found || suburbanPath.totalProvisionalKm === null) {
      return null;
    }
    return calculateSuburbanFareBreakdown(suburbanPath.totalProvisionalKm, fareDb);
  }, [suburbanPath, fareDb]);

  const unreservedFare = useMemo(() => {
    if (
      suburbanFareBreakdown &&
      suburbanPath?.totalProvisionalKm !== null &&
      suburbanPath?.totalProvisionalKm !== undefined &&
      trainType === 'Ordinary' &&
      fromCode !== toCode
    ) {
      const distKm = suburbanPath.totalProvisionalKm;
      const safeAdults = Math.max(1, adults);
      const safeChildren = Math.max(0, children);

      let baseFare = 0;
      if (utsSubMode === 'Normal' && classCode === 'II' && distKm > 0) {
        const adultUnit = calculateFare(distKm, 'adult', fareDb);
        const childUnit = calculateFare(distKm, 'child', fareDb);
        baseFare = Number((adultUnit * safeAdults + childUnit * safeChildren).toFixed(2));
      } else {
        const paxUnits = safeAdults + safeChildren * 0.5;
        const singleUnit =
          utsSubMode === 'Season'
            ? classCode === 'FC'
              ? suburbanFareBreakdown.monthlySeasonII * 3
              : suburbanFareBreakdown.monthlySeasonII
            : suburbanFareBreakdown.fcSingle;
        baseFare = Number((singleUnit * paxUnits).toFixed(2));
      }

      const discountPercent = payWithRWallet ? 3 : 0;
      const discountAmount = payWithRWallet ? Number(((baseFare * 3) / 100).toFixed(2)) : 0;
      const finalFare = Number((baseFare - discountAmount).toFixed(2));
      return { baseFare, discountAmount, finalFare, discountPercent };
    }
    return calculateUnreservedFare({
      distanceKm: estimatedDistanceKm,
      trainType,
      classCode,
      adults,
      children,
      mode: utsSubMode,
      payWithRWallet,
    });
  }, [
    suburbanFareBreakdown,
    suburbanPath,
    fareDb,
    estimatedDistanceKm,
    trainType,
    classCode,
    adults,
    children,
    utsSubMode,
    payWithRWallet,
    fromCode,
    toCode,
  ]);

  const platformBaseFare = calculatePlatformFare(platformPersons);
  const platformFinalFare = payWithRWallet
    ? Number((platformBaseFare * 0.97).toFixed(2))
    : platformBaseFare;

  const handleSwap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const handleBookUnreserved = () => {
    if (fromCode === toCode) {
      setErrorMsg('From and To stations must be different.');
      return;
    }
    if (payWithRWallet && profile.rWalletBalance < unreservedFare.finalFare) {
      setErrorMsg('Insufficient R-Wallet balance. Top up R-Wallet or switch payment mode.');
      return;
    }
    setErrorMsg(null);
    const utsNo = generateUtsNumber();
    const now = new Date();
    const booking: BookingRecord = {
      id: `uts-${Date.now()}`,
      kind: 'unreserved',
      pnrOrTicketNo: utsNo,
      title: `UTS Paperless Ticket · ${utsSubMode}`,
      subtitle: `${classCode === 'II' ? 'Second Class (II)' : 'First Class (FC)'} · ${stationProximity}`,
      ticketType: utsSubMode === 'Season' ? 'SEASON' : 'JOURNEY',
      via: '-',
      adultsCount: adults,
      childrenCount: children,
      fromCode: fromStation.code,
      fromName: fromStation.name,
      toCode: toStation.code,
      toName: toStation.name,
      distanceKm: estimatedDistanceKm,
      journeyDate: now.toISOString().slice(0, 10),
      journeyDisplayDate: utsSubMode === 'Season' ? 'Valid 30 Days' : 'Valid 3 hrs',
      bookingDateLabel: formatBookingDateLabel(now),
      bookedAtTimestamp: formatBookingTimestamp(now),
      departureTime: trainType,
      classOrMode: `${classCode} · ${trainType}`,
      fare: unreservedFare.finalFare,
      originalFare: unreservedFare.baseFare,
      discountSaved: unreservedFare.discountAmount,
      paymentMethod: payWithRWallet ? 'R-Wallet' : 'UPI',
      status: 'Active',
      passengers: [
        {
          name: `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child` : ''}`,
          age: 30,
          gender: 'M',
          coach: 'GEN',
          berth: 'Unreserved',
          status: 'ACTIVE',
        },
      ],
      createdAt: now.toISOString(),
    };
    onCompleteBooking(booking, payWithRWallet ? unreservedFare.finalFare : 0);
    setIssuedTicket(booking);
  };

  const handleBookPlatform = () => {
    if (payWithRWallet && profile.rWalletBalance < platformFinalFare) {
      setErrorMsg('Insufficient R-Wallet balance.');
      return;
    }
    setErrorMsg(null);
    const utsNo = generateUtsNumber();
    const now = new Date();
    const booking: BookingRecord = {
      id: `plt-${Date.now()}`,
      kind: 'platform',
      pnrOrTicketNo: utsNo,
      title: `Platform Ticket · ${platformStation.name}`,
      subtitle: `${platformPersons} Person${platformPersons > 1 ? 's' : ''} · Valid 2 Hours`,
      ticketType: 'PLATFORM',
      via: '-',
      adultsCount: platformPersons,
      childrenCount: 0,
      fromCode: platformStation.code,
      fromName: platformStation.name,
      toCode: platformStation.code,
      toName: platformStation.name,
      distanceKm: 0,
      journeyDate: now.toISOString().slice(0, 10),
      journeyDisplayDate: 'Valid 2 hrs',
      bookingDateLabel: formatBookingDateLabel(now),
      bookedAtTimestamp: formatBookingTimestamp(now),
      departureTime: 'All Platforms',
      classOrMode: 'Platform Entry',
      fare: platformFinalFare,
      originalFare: platformBaseFare,
      discountSaved: payWithRWallet ? Number((platformBaseFare - platformFinalFare).toFixed(2)) : 0,
      paymentMethod: payWithRWallet ? 'R-Wallet' : 'UPI',
      status: 'Active',
      passengers: [
        {
          name: `${platformPersons} Visitor${platformPersons > 1 ? 's' : ''}`,
          age: 30,
          gender: 'M',
          coach: 'PF',
          berth: 'Entry Pass',
          status: 'ACTIVE',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    onCompleteBooking(booking, payWithRWallet ? platformFinalFare : 0);
    setIssuedTicket(booking);
  };

  if (issuedTicket) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto shadow-xs space-y-5">
        <div className="flex items-center gap-3 text-emerald-700">
          <CheckCircle2 className="h-8 w-8 shrink-0" />
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Paperless QR Ticket Issued
            </h2>
            <p className="text-xs text-slate-500">
              UTS No: <span className="font-mono-num font-bold text-slate-900">{issuedTicket.pnrOrTicketNo}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F4F8FD] border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="h-28 w-28 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
            <QrCode className="h-20 w-20 text-slate-900" />
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <p className="font-display font-bold text-slate-900">{issuedTicket.title}</p>
            <p className="text-sm font-semibold text-[#0B63E5]">
              {issuedTicket.fromCode} {issuedTicket.kind !== 'platform' ? `→ ${issuedTicket.toCode}` : ''}
            </p>
            <p className="text-xs text-slate-600">{issuedTicket.subtitle}</p>
            <p className="font-mono-num text-sm font-bold text-slate-900">
              Paid: ₹ {issuedTicket.fare.toFixed(2)}{' '}
              {issuedTicket.discountSaved ? (
                <span className="text-emerald-700 text-xs">
                  (Saved ₹{issuedTicket.discountSaved.toFixed(2)} via R-Wallet)
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onOpenBookings}
            className="flex-1 min-h-[44px] rounded-xl bg-[#0B63E5] text-white text-sm font-semibold hover:bg-[#0952C2]"
          >
            Show Ticket in My Bookings
          </button>
          <button
            type="button"
            onClick={() => setIssuedTicket(null)}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Header matching Screenshot 5 & 12 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Home"
              className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-slate-900">
              {ticketMode === 'unreserved' ? 'Unreserved E-Ticket' : 'Platform E-Ticket'}
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTicketMode('unreserved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                ticketMode === 'unreserved' ? 'bg-white text-[#0B63E5] shadow-xs' : 'text-slate-600'
              }`}
            >
              Unreserved
            </button>
            <button
              type="button"
              onClick={() => setTicketMode('platform')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                ticketMode === 'platform' ? 'bg-white text-[#0B63E5] shadow-xs' : 'text-slate-600'
              }`}
            >
              Platform
            </button>
          </div>
        </div>

        {ticketMode === 'unreserved' ? (
          <div className="p-5 space-y-5">
            {/* Normal | Season Segmented Control (Screenshot 5) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              {(['Normal', 'Season'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setUtsSubMode(m)}
                  className={`min-h-[42px] rounded-xl text-sm font-semibold transition-all ${
                    utsSubMode === m
                      ? 'bg-white text-[#0B63E5] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Outside Station | At Station Toggle (Screenshot 5) */}
            <div className="grid grid-cols-2 gap-3">
              {(['Outside Station', 'At Station'] as const).map((loc) => {
                const active = stationProximity === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setStationProximity(loc)}
                    className={`min-h-[44px] px-4 rounded-full border flex items-center justify-between text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#0B63E5] border-[#0B63E5] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{loc}</span>
                    <Info className="h-4 w-4 opacity-80 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* From / To Station Block with searchable picker & swap button */}
            <div className="relative rounded-2xl border border-slate-200 bg-[#F9FBFF] p-4 space-y-3">
              <div className="pr-12">
                <StationSearchField
                  id="uts-from"
                  label="From"
                  valueCode={fromCode}
                  stations={stations}
                  onChange={(st) => setFromCode(st.code)}
                />
              </div>

              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap From and To stations"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-[#DCEAFF] text-[#0B63E5] border border-blue-200 flex items-center justify-center hover:bg-[#0B63E5] hover:text-white transition-colors shadow-xs"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>

              <div className="pr-12">
                <StationSearchField
                  id="uts-to"
                  label="To"
                  valueCode={toCode}
                  stations={stations}
                  onChange={(st) => setToCode(st.code)}
                />
              </div>
            </div>

            {suburbanPath && (
              <div
                className={`rounded-2xl p-3.5 text-xs space-y-1 border ${
                  suburbanFareBreakdown
                    ? 'bg-[#F4F8FD] border-blue-200/80 text-slate-800'
                    : 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                }`}
              >
                <p className="font-semibold flex items-center gap-1.5">
                  {suburbanFareBreakdown ? (
                    <TrainFront className="h-3.5 w-3.5 text-[#0B63E5] shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  )}
                  {suburbanPath.found
                    ? suburbanPath.kind === 'direct'
                      ? `Kolkata Suburban Corridor: ${suburbanPath.legs[0]?.routeName} (${suburbanPath.totalStopCount} stops)`
                      : `Suburban Route via ${suburbanPath.interchangeStation?.stationName ?? 'Junction'} (${suburbanPath.totalStopCount} stops)`
                    : 'Suburban corridor connection pending verification'}
                </p>
                <p className="text-[11px] opacity-85 font-mono-num">
                  {suburbanFareBreakdown
                    ? `Map Distance: ${suburbanFareBreakdown.distanceKm} km (Slab ${suburbanFareBreakdown.iiSlabLabel}) · II Adult: ₹${suburbanFareBreakdown.iiSingle} · II Child (5–11 yrs): ₹${suburbanFareBreakdown.iiChildSingle} · Return II: ₹${suburbanFareBreakdown.iiReturn} · FC: ₹${suburbanFareBreakdown.fcSingle} · MST II: ₹${suburbanFareBreakdown.monthlySeasonII}`
                    : suburbanPath.totalProvisionalKm !== null && suburbanPath.totalProvisionalKm > 500
                    ? `Distance (${suburbanPath.totalProvisionalKm} km) exceeds published 500 km ER suburban chart. No extrapolation applied.`
                    : 'Distance unverified. Fare below is an illustrative mainline estimate.'}
                </p>
              </div>
            )}

            {/* Train Type, Class & Passenger Count */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="uts-train-type" className="block text-[11px] font-medium text-slate-500 mb-1">
                  Train Type
                </label>
                <select
                  id="uts-train-type"
                  value={trainType}
                  onChange={(e) =>
                    setTrainType(e.target.value as 'Ordinary' | 'Mail/Express' | 'Superfast')
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="Ordinary">Ordinary</option>
                  <option value="Mail/Express">Mail / Express</option>
                  <option value="Superfast">Superfast</option>
                </select>
              </div>

              <div>
                <label htmlFor="uts-class" className="block text-[11px] font-medium text-slate-500 mb-1">
                  Class
                </label>
                <select
                  id="uts-class"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value as 'II' | 'FC')}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                >
                  <option value="II">Second (II)</option>
                  <option value="FC">First (FC)</option>
                </select>
              </div>

              <div>
                <label htmlFor="uts-adults" className="block text-[11px] font-medium text-slate-500 mb-1">
                  Adults
                </label>
                <select
                  id="uts-adults"
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} Adult{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="uts-children" className="block text-[11px] font-medium text-slate-500 mb-1">
                  Children
                </label>
                <select
                  id="uts-children"
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800"
                >
                  {[0, 1, 2, 3].map((n) => (
                    <option key={n} value={n}>
                      {n} Child
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* R-Wallet 3% Discount Toggle & Fare Summary */}
            <div className="rounded-2xl bg-[#EAF4FF] border border-blue-200/80 p-4 space-y-2.5">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-[#0B63E5]" />
                  Pay with R-Wallet (Save 3% instantly)
                </span>
                <input
                  type="checkbox"
                  checked={payWithRWallet}
                  onChange={(e) => setPayWithRWallet(e.target.checked)}
                  className="h-4 w-4 accent-[#0B63E5]"
                />
              </label>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-blue-200/60">
                <span>
                  Approx. Distance: {estimatedDistanceKm} km · Base ₹{unreservedFare.baseFare}
                  {unreservedFare.discountAmount > 0 &&
                    ` − ₹${unreservedFare.discountAmount.toFixed(2)} (3% off)`}
                </span>
                <span className="font-mono-num text-base font-bold text-[#0B63E5]">
                  ₹ {unreservedFare.finalFare.toFixed(2)}
                </span>
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {errorMsg}
              </p>
            )}

            {/* Primary & Secondary CTAs matching Screenshot 5 */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleBookUnreserved}
                className="w-full min-h-[48px] rounded-full bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2] transition-colors shadow-sm"
              >
                Proceed To Book · ₹ {unreservedFare.finalFare.toFixed(2)}
              </button>
              <button
                type="button"
                onClick={() => setShowUpcomingModal(true)}
                className="w-full min-h-[46px] rounded-full border border-[#0B63E5] text-[#0B63E5] text-sm font-semibold hover:bg-[#EAF4FF] transition-colors"
              >
                Check Upcoming Trains
              </button>
            </div>
          </div>
        ) : (
          /* Platform Ticket Booking View */
          <div className="p-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-[#F9FBFF] p-4 space-y-3">
              <StationSearchField
                id="pf-station"
                label="Station Name"
                valueCode={platformStationCode}
                stations={stations}
                onChange={(st) => setPlatformStationCode(st.code)}
              />

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Number of Persons</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPlatformPersons(cnt)}
                      className={`min-h-[42px] rounded-xl border text-sm font-bold transition-colors ${
                        platformPersons === cnt
                          ? 'bg-[#0B63E5] border-[#0B63E5] text-white'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#EAF4FF] border border-blue-200/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Platform Entry · Valid for 2 Hours
                </p>
                <p className="text-xs text-slate-600">
                  ₹10/person {payWithRWallet ? '· 3% R-Wallet discount applied' : ''}
                </p>
              </div>
              <span className="font-mono-num text-lg font-bold text-[#0B63E5]">
                ₹ {platformFinalFare.toFixed(2)}
              </span>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              onClick={handleBookPlatform}
              className="w-full min-h-[48px] rounded-full bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2] transition-colors"
            >
              Book Platform Ticket · ₹ {platformFinalFare.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Trains Sheet */}
      {showUpcomingModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Upcoming Trains"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Upcoming Trains ({fromStation.code} → {toStation.code})
                </h2>
                <p className="text-xs text-slate-500">Next 4 hours · Unreserved / MEMU / Express</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpcomingModal(false)}
                aria-label="Close Upcoming Trains"
                className="h-9 w-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {UNRESERVED_UPCOMING_TRAINS.map((tr) => (
                <div
                  key={tr.number}
                  className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-10 w-10 rounded-xl bg-[#EAF4FF] text-[#0B63E5] flex items-center justify-center shrink-0">
                      <TrainFront className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-slate-900 truncate">
                        {tr.number} · {tr.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tr.type} · PF {tr.platform} · {tr.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-num text-sm font-bold text-slate-900">
                      {tr.departureTime}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" /> {tr.arrivalTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
