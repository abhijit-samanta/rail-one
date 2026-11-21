import { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileWarning,
  MapPin,
  MessageSquareHeart,
  Mic,
  PhoneCall,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  TrainFront,
  UtensilsCrossed,
  Video,
} from 'lucide-react';
import { FOOD_MENU_ITEMS, RAIL_STATIONS, RAIL_TRAINS } from '../data/railData';
import { validatePnr } from '../utils/railLogic';
import type {
  BookingRecord,
  CoachPositionItem,
  FeedbackEntry,
  RailMadadComplaint,
  Station,
  UserProfile,
} from '../types/rail';

/* -------------------------------------------------------------------------- */
/* 1. PNR STATUS VIEW                                                         */
/* -------------------------------------------------------------------------- */
export function PnrStatusView({
  bookings,
  onBack,
  onOpenOrderFood,
  onOpenTrackTrain,
}: {
  bookings: BookingRecord[];
  onBack: () => void;
  onOpenOrderFood: () => void;
  onOpenTrackTrain: () => void;
}) {
  const reservedBookings = bookings.filter((b) => b.kind === 'reserved');
  const [pnrInput, setPnrInput] = useState(reservedBookings[0]?.pnrOrTicketNo ?? '2418956320');
  const [checkedPnr, setCheckedPnr] = useState<string | null>(
    reservedBookings[0]?.pnrOrTicketNo ?? '2418956320'
  );
  const [error, setError] = useState<string | null>(null);

  const matchedBooking = reservedBookings.find((b) => b.pnrOrTicketNo === checkedPnr);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePnr(pnrInput)) {
      setError('Enter a valid 10-digit numeric PNR number.');
      return;
    }
    setError(null);
    setCheckedPnr(pnrInput.trim());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">PNR Status</h1>
            <p className="text-xs text-slate-500">Live Indian Railways reservation &amp; chart status</p>
          </div>
        </div>

        <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            maxLength={10}
            value={pnrInput}
            onChange={(e) => setPnrInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 10-digit PNR"
            aria-label="10-digit PNR Number"
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 px-3.5 font-mono-num text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B63E5]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-6 rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2] inline-flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" /> Check Status
          </button>
        </form>

        {error && (
          <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Your PNRs:</span>
          {reservedBookings.slice(0, 3).map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setPnrInput(b.pnrOrTicketNo);
                setCheckedPnr(b.pnrOrTicketNo);
                setError(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#EAF4FF] text-[#0B63E5] font-mono-num text-xs font-semibold hover:bg-[#D7E9FF]"
            >
              {b.pnrOrTicketNo}
            </button>
          ))}
        </div>
      </div>

      {checkedPnr && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          {matchedBooking ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <p className="font-mono-num text-xs font-semibold text-[#0B63E5]">
                    PNR: {matchedBooking.pnrOrTicketNo}
                  </p>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    {matchedBooking.title}
                  </h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {matchedBooking.status === 'Confirmed' ? 'Chart Prepared · CNF' : matchedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs bg-[#F8FBFF] rounded-2xl p-3.5">
                <div>
                  <p className="text-slate-500">Boarding</p>
                  <p className="font-bold text-slate-900">{matchedBooking.fromCode}</p>
                  <p className="font-mono-num text-slate-600">{matchedBooking.departureTime}</p>
                </div>
                <div className="text-center self-center">
                  <p className="font-semibold text-slate-800">{matchedBooking.journeyDisplayDate}</p>
                  <p className="text-slate-500">{matchedBooking.classOrMode}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Destination</p>
                  <p className="font-bold text-slate-900">{matchedBooking.toCode}</p>
                  <p className="font-mono-num text-slate-600">{matchedBooking.arrivalTime}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Passenger Current Status</p>
                {matchedBooking.passengers.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs"
                  >
                    <span className="font-semibold text-slate-900">
                      Passenger {i + 1}: {p.name} ({p.age}Y/{p.gender})
                    </span>
                    <span className="font-mono-num font-bold text-emerald-700">
                      {p.status} · Coach {p.coach} · {p.berth}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onOpenOrderFood}
                  className="min-h-[40px] px-4 rounded-xl bg-[#EAF4FF] text-[#0B63E5] text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5" /> Order Food for PNR
                </button>
                <button
                  type="button"
                  onClick={onOpenTrackTrain}
                  className="min-h-[40px] px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5" /> Track Live Train
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <ClipboardCheck className="h-8 w-8 text-[#0B63E5] mx-auto" />
              <p className="font-display font-bold text-slate-900">
                PNR {checkedPnr} · Live Status: RAC 4 / Expected CNF
              </p>
              <p className="text-xs text-slate-500">
                12314 SEALDAH RAJDHNI · 3A · Chart preparation 4 hours prior to departure.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. COACH POSITION FINDER                                                   */
/* -------------------------------------------------------------------------- */
export function CoachPositionView({ onBack }: { onBack: () => void }) {
  const [selectedTrainNo, setSelectedTrainNo] = useState(RAIL_TRAINS[0].number);
  const [selectedCoach, setSelectedCoach] = useState<CoachPositionItem | null>(null);

  const train = RAIL_TRAINS.find((t) => t.number === selectedTrainNo) ?? RAIL_TRAINS[0];
  const activeCoach = selectedCoach ?? train.coachComposition[3] ?? train.coachComposition[0];

  const coachColor = (type: CoachPositionItem['type']) => {
    switch (type) {
      case 'engine':
        return 'bg-slate-800 text-white border-slate-900';
      case 'ac1':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'ac2':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'ac3':
      case 'chair':
        return 'bg-blue-50 text-[#0B63E5] border-blue-200';
      case 'exec':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'pantry':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              Coach Position Finder
            </h1>
            <p className="text-xs text-slate-500">
              See exact coach alignment on the platform relative to Foot Over Bridge &amp; stairs
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="cp-train" className="block text-xs font-medium text-slate-500 mb-1">
            Select Train
          </label>
          <select
            id="cp-train"
            value={selectedTrainNo}
            onChange={(e) => {
              setSelectedTrainNo(e.target.value);
              setSelectedCoach(null);
            }}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
          >
            {RAIL_TRAINS.map((t) => (
              <option key={t.number} value={t.number}>
                {t.number} - {t.name} ({t.fromCode} → {t.toCode})
              </option>
            ))}
          </select>
        </div>

        {/* Platform Alignment Diagram */}
        <div className="rounded-2xl bg-[#F8FBFF] border border-slate-200 p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              Platform {train.liveStatus.expectedPlatform} · Direction →
            </span>
            <span>Tap any coach to inspect position</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {train.coachComposition.map((c) => {
              const isSelected = activeCoach.position === c.position;
              return (
                <button
                  key={`${c.position}-${c.label}`}
                  type="button"
                  onClick={() => setSelectedCoach(c)}
                  className={`min-w-[58px] h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all shrink-0 ${coachColor(
                    c.type
                  )} ${isSelected ? 'ring-2 ring-[#0B63E5] scale-105 shadow-sm' : ''}`}
                >
                  <span className="font-mono-num text-[10px] opacity-70">#{c.position}</span>
                  <span className="font-display text-xs font-bold">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Platform Landmarks */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dashed border-slate-300 text-[11px] text-slate-600 text-center">
            <div className="bg-white rounded-lg py-1.5 px-2 border border-slate-200">
              North Foot Over Bridge (Coach #2–3)
            </div>
            <div className="bg-white rounded-lg py-1.5 px-2 border border-slate-200">
              Main Stairs &amp; Escalator (Coach #6–7)
            </div>
            <div className="bg-white rounded-lg py-1.5 px-2 border border-slate-200">
              South Exit &amp; Water Booth (Coach #10–11)
            </div>
          </div>

          <div className="rounded-xl bg-white border border-blue-200 p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-display text-sm font-bold text-slate-900">
                Coach {activeCoach.label} · Position {activeCoach.position} from Engine
              </p>
              <p className="text-xs text-slate-500">
                Approx. {(activeCoach.position - 1) * 23} metres from front of train
                {activeCoach.seats ? ` · ${activeCoach.seats} seats/berths` : ''}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0B63E5]">
              Expected PF {train.liveStatus.expectedPlatform}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. TRACK YOUR TRAIN (LIVE STATUS)                                          */
/* -------------------------------------------------------------------------- */
export function TrackTrainView({ onBack }: { onBack: () => void }) {
  const [selectedTrainNo, setSelectedTrainNo] = useState(RAIL_TRAINS[0].number);
  const [refreshing, setRefreshing] = useState(false);

  const train = RAIL_TRAINS.find((t) => t.number === selectedTrainNo) ?? RAIL_TRAINS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="bg-[#0B63E5] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Home"
              className="h-10 w-10 rounded-xl hover:bg-white/15 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold">Track Your Train</h1>
              <p className="text-xs text-blue-100">NTES Live Running Status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 450);
            }}
            className="min-h-[36px] px-3 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="p-5 space-y-5">
          <select
            aria-label="Select Train to Track"
            value={selectedTrainNo}
            onChange={(e) => setSelectedTrainNo(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
          >
            {RAIL_TRAINS.map((t) => (
              <option key={t.number} value={t.number}>
                {t.number} · {t.name} ({t.fromCode} → {t.toCode})
              </option>
            ))}
          </select>

          {/* Live Status Summary Card */}
          <div className="rounded-2xl bg-[#EAF4FF] border border-blue-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-600">Current Location</p>
                <p className="font-display text-base font-bold text-slate-900">
                  {train.liveStatus.currentStationName} ({train.liveStatus.currentStationCode})
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-lg ${
                  train.liveStatus.delayMins === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {train.liveStatus.delayMins === 0
                  ? 'Right On Time'
                  : `Delayed by ${train.liveStatus.delayMins} mins`}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-white overflow-hidden">
              <div
                className="h-full bg-[#0B63E5] rounded-full"
                style={{ width: `${train.liveStatus.progressPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600">
              <span>
                Next Halt: <strong className="text-slate-900">{train.liveStatus.nextStationName}</strong> (ETA{' '}
                <span className="font-mono-num">{train.liveStatus.nextStationEta}</span>)
              </span>
              <span>
                PF <strong className="font-mono-num text-slate-900">{train.liveStatus.expectedPlatform}</strong> · Updated {train.liveStatus.lastUpdated}
              </span>
            </div>
          </div>

          {/* Route Timeline */}
          <div className="space-y-0">
            {train.schedule.map((stop, idx) => {
              const isCurrent = stop.status === 'current';
              const isDeparted = stop.status === 'departed';
              return (
                <div key={stop.sr} className="flex items-stretch gap-4">
                  <div className="flex flex-col items-center w-6 shrink-0">
                    <div
                      className={`h-4 w-4 rounded-full border-2 mt-1 ${
                        isCurrent
                          ? 'bg-[#0B63E5] border-[#0B63E5] ring-4 ring-blue-100'
                          : isDeparted
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                    {idx < train.schedule.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 my-1 ${
                          isDeparted ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>

                  <div
                    className={`flex-1 pb-5 flex items-center justify-between gap-2 ${
                      isCurrent ? 'font-semibold' : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm text-slate-900 flex items-center gap-2">
                        {stop.stationName} ({stop.stationCode})
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B63E5] text-white">
                            Train Here
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        PF {stop.platform} · {stop.distanceKm} km
                      </p>
                    </div>
                    <div className="text-right font-mono-num text-xs">
                      <p className="text-slate-900">
                        {stop.arrival} / {stop.departure}
                      </p>
                      <p className={stop.delayMins ? 'text-amber-700' : 'text-emerald-700'}>
                        {stop.delayMins ? `+${stop.delayMins}m` : 'On Time'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. ORDER FOOD (E-CATERING)                                                 */
/* -------------------------------------------------------------------------- */
export function OrderFoodView({
  profile,
  bookings,
  onBack,
  onPlaceFoodOrder,
}: {
  profile: UserProfile;
  bookings: BookingRecord[];
  onBack: () => void;
  onPlaceFoodOrder: (booking: BookingRecord, debitWallet: number) => void;
}) {
  const reserved = bookings.filter((b) => b.kind === 'reserved');
  const [selectedPnr, setSelectedPnr] = useState(reserved[0]?.pnrOrTicketNo ?? '2418956320');
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  const visibleMenu = vegOnly ? FOOD_MENU_ITEMS.filter((f) => f.isVeg) : FOOD_MENU_ITEMS;

  const totalAmount = FOOD_MENU_ITEMS.reduce(
    (sum, item) => sum + item.price * (cart[item.id] ?? 0),
    0
  );
  const totalCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleCheckout = () => {
    if (totalAmount <= 0) return;
    if (profile.rWalletBalance < totalAmount) return;
    const orderNo = `FD${Math.floor(100000 + Math.random() * 900000)}`;
    const itemsSummary = FOOD_MENU_ITEMS.filter((f) => (cart[f.id] ?? 0) > 0)
      .map((f) => `${cart[f.id]}x ${f.name}`)
      .join(', ');

    const newBooking: BookingRecord = {
      id: `food-${Date.now()}`,
      kind: 'food',
      pnrOrTicketNo: orderNo,
      title: `E-Catering · PNR ${selectedPnr}`,
      subtitle: itemsSummary,
      fromCode: 'CNB',
      fromName: 'KANPUR CENTRAL JN.',
      toCode: 'SEAT',
      toName: 'Delivered at Seat',
      journeyDate: new Date().toISOString().slice(0, 10),
      journeyDisplayDate: 'Today · Next Halt',
      departureTime: '20 mins',
      classOrMode: 'IRCTC E-Catering',
      fare: totalAmount,
      paymentMethod: 'R-Wallet',
      status: 'Confirmed',
      passengers: [
        {
          name: profile.name,
          age: 34,
          gender: 'M',
          coach: 'C4',
          berth: '24',
          status: 'CONFIRMED',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    onPlaceFoodOrder(newBooking, totalAmount);
    setCart({});
    setOrderPlaced(orderNo);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Home"
              className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">Order Food on Train</h1>
              <p className="text-xs text-slate-500">Fresh IRCTC Partner Meals delivered to your seat</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVegOnly((v) => !v)}
            className={`min-h-[38px] px-3.5 rounded-xl border text-xs font-semibold ${
              vegOnly
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'border-slate-200 text-slate-700'
            }`}
          >
            Veg Only {vegOnly ? '✓' : ''}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="food-pnr" className="text-xs font-semibold text-slate-600">
            Delivery PNR:
          </label>
          <input
            id="food-pnr"
            type="text"
            value={selectedPnr}
            onChange={(e) => setSelectedPnr(e.target.value)}
            className="min-h-[40px] rounded-xl border border-slate-200 px-3 font-mono-num text-xs font-bold"
          />
        </div>

        {orderPlaced && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            Order {orderPlaced} confirmed for PNR {selectedPnr}! View it under My Bookings → Food Orders.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {visibleMenu.map((item) => {
            const qty = cart[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {item.isVeg ? 'Pure Veg' : 'Non-Veg'} · {item.stationCode}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500" /> {item.rating}
                    </span>
                  </div>
                  <h2 className="font-display text-sm font-bold text-slate-900 mt-1">
                    {item.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.vendor}</p>
                  <p className="text-xs text-slate-600 mt-1.5">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-mono-num text-sm font-bold text-slate-900">
                    ₹ {item.price}
                  </span>
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => setCart((c) => ({ ...c, [item.id]: 1 }))}
                      className="min-h-[36px] px-4 rounded-xl bg-[#EAF4FF] text-[#0B63E5] text-xs font-bold hover:bg-[#D9EAFF]"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCart((c) => ({ ...c, [item.id]: Math.max(0, qty - 1) }))}
                        className="h-8 w-8 rounded-lg bg-slate-100 font-bold text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono-num text-xs font-bold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setCart((c) => ({ ...c, [item.id]: qty + 1 }))}
                        className="h-8 w-8 rounded-lg bg-[#0B63E5] text-white font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {totalCount > 0 && (
          <div className="rounded-2xl bg-[#0B63E5] text-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5" />
              <div>
                <p className="text-xs text-blue-100">{totalCount} Meal Item(s)</p>
                <p className="font-mono-num text-base font-bold">Total: ₹ {totalAmount}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="min-h-[42px] px-5 rounded-xl bg-white text-[#0B63E5] text-xs font-bold hover:bg-blue-50"
            >
              Pay via R-Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. FILE REFUND / TDR                                                       */
/* -------------------------------------------------------------------------- */
export function FileRefundView({
  bookings,
  onFileTdr,
  onBack,
}: {
  bookings: BookingRecord[];
  onFileTdr: (bookingId: string, reason: string) => void;
  onBack: () => void;
}) {
  const eligible = bookings.filter((b) => b.kind === 'reserved');
  const [selectedId, setSelectedId] = useState(eligible[0]?.id ?? '');
  const [reason, setReason] = useState('Train Delayed More Than 3 Hours');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">
              File Refund (TDR) &amp; Status
            </h1>
            <p className="text-xs text-slate-500">
              Request Ticket Deposit Receipt refund directly to R-Wallet / Source
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="tdr-bk" className="block text-xs font-medium text-slate-600 mb-1">
              Select Booking / PNR
            </label>
            <select
              id="tdr-bk"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              {eligible.map((b) => (
                <option key={b.id} value={b.id}>
                  PNR {b.pnrOrTicketNo} · {b.title} ({b.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tdr-reason" className="block text-xs font-medium text-slate-600 mb-1">
              TDR Filing Reason
            </label>
            <select
              id="tdr-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              <option>Train Delayed More Than 3 Hours</option>
              <option>AC Failure During Journey</option>
              <option>Train Cancelled by Railways</option>
              <option>Passenger Not Travelled</option>
            </select>
          </div>

          {submitted && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              TDR Refund Request filed successfully. Refund will credit within 48 hours.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (selectedId) {
                onFileTdr(selectedId, reason);
                setSubmitted(true);
              }
            }}
            className="w-full min-h-[46px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
          >
            Submit TDR Refund Request
          </button>
        </div>

        {/* Refund History */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <h2 className="font-display text-xs font-bold text-slate-700">Recent Refunds &amp; TDRs</h2>
          {eligible
            .filter((b) => b.status === 'Cancelled' || b.status === 'Refunded' || b.tdrReason)
            .map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-mono-num font-bold text-slate-900">PNR {b.pnrOrTicketNo}</p>
                  <p className="text-slate-500">{b.tdrReason ?? 'Ticket Cancelled'}</p>
                </div>
                <span className="font-mono-num font-bold text-emerald-700">
                  ₹ {(b.refundAmount ?? b.fare).toFixed(2)} · {b.status}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. RAIL MADAD (Exact match to Screenshot 16)                               */
/* -------------------------------------------------------------------------- */
export function RailMadadView({
  stations = RAIL_STATIONS,
  complaints,
  onSubmitComplaint,
  onBack,
}: {
  stations?: Station[];
  complaints: RailMadadComplaint[];
  onSubmitComplaint: (complaint: RailMadadComplaint) => void;
  onBack: () => void;
}) {
  const [mediaType, setMediaType] = useState<'Video' | 'Audio' | 'Image'>('Image');
  const [mode, setMode] = useState<'Train' | 'Station'>('Train');
  const [location, setLocation] = useState('NEW DELHI - NDLS');
  const [helpFor, setHelpFor] = useState('Cleanliness & Hygiene');
  const [problemFaced, setProblemFaced] = useState('Coach / Toilet Cleaning Required');
  const [description, setDescription] = useState('');
  const [viewMode, setViewMode] = useState<'form' | 'track' | 'suggestions'>('form');
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refNo = `RM2026${Math.floor(100000 + Math.random() * 900000)}`;
    const newCmp: RailMadadComplaint = {
      id: `cmp-${Date.now()}`,
      referenceNo: refNo,
      mode,
      location,
      helpFor,
      problemFaced,
      description: description.trim() || problemFaced,
      mediaType,
      status: 'Registered',
      createdAt: 'Just now',
    };
    onSubmitComplaint(newCmp);
    setDescription('');
    setSuccessRef(refNo);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="bg-[#0B63E5] text-white px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-white/15 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg font-bold">Rail Madad</h1>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-center text-xs font-semibold text-[#0B63E5]">
            We are Committed to Make Your Journey Pleasant!
          </p>

          <div className="rounded-xl bg-[#EEF5FF] px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-[#0B63E5]">
            <MapPin className="h-3.5 w-3.5" />
            <span>Your Location:</span>
            <select
              aria-label="Select your current station"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-transparent font-bold focus:outline-none max-w-[220px] truncate"
            >
              {stations.map((s) => (
                <option key={`${s.code}-${s.stationId ?? s.name}`} value={`${s.name} - ${s.code}`}>
                  {s.name} - {s.hasVerifiedCode === false ? 'NO CODE' : s.code}
                </option>
              ))}
            </select>
          </div>

          {viewMode === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-800 mb-2">Your Concern</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { id: 'Video', Icon: Video },
                      { id: 'Audio', Icon: Mic },
                      { id: 'Image', Icon: Camera },
                    ] as const
                  ).map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMediaType(id)}
                      className={`min-h-[42px] rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                        mediaType === id
                          ? 'border-[#0B63E5] bg-[#EAF4FF] text-[#0B63E5]'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-800">Help Required At</span>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  {(['Train', 'Station'] as const).map((m) => (
                    <label key={m} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="madad-mode"
                        checked={mode === m}
                        onChange={() => setMode(m)}
                        className="accent-[#0B63E5]"
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="rm-for" className="block text-xs font-medium text-slate-500 mb-1">
                  Help Required For
                </label>
                <select
                  id="rm-for"
                  value={helpFor}
                  onChange={(e) => setHelpFor(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
                >
                  <option>Cleanliness &amp; Hygiene</option>
                  <option>Medical Assistance</option>
                  <option>Security</option>
                  <option>Water Availability</option>
                  <option>Electrical / AC Equipment</option>
                  <option>Catering / Vending</option>
                </select>
              </div>

              <div>
                <label htmlFor="rm-prob" className="block text-xs font-medium text-slate-500 mb-1">
                  Problem Faced
                </label>
                <select
                  id="rm-prob"
                  value={problemFaced}
                  onChange={(e) => setProblemFaced(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900"
                >
                  <option>Coach / Toilet Cleaning Required</option>
                  <option>AC Not Cooling</option>
                  <option>No Water in Washroom</option>
                  <option>Overcharging by Vendor</option>
                  <option>Seat / Berth Dispute</option>
                </select>
              </div>

              <div>
                <label htmlFor="rm-desc" className="block text-xs font-medium text-slate-500 mb-1">
                  Describe More
                </label>
                <textarea
                  id="rm-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share PNR, Coach/Seat number, or issue details..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B63E5]"
                />
              </div>

              {successRef && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
                  Complaint Registered! Reference No: <span className="font-mono-num">{successRef}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] rounded-full bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
              >
                Submit
              </button>
            </form>
          )}

          {viewMode === 'track' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-slate-900">
                  Registered Complaints ({complaints.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setViewMode('form')}
                  className="text-xs font-semibold text-[#0B63E5]"
                >
                  + New Complaint
                </button>
              </div>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 p-3.5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num font-bold text-[#0B63E5]">
                      {c.referenceNo}
                    </span>
                    <span className="font-semibold text-emerald-700">{c.status}</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {c.helpFor} · {c.problemFaced}
                  </p>
                  <p className="text-slate-500">
                    {c.mode}: {c.location} · {c.createdAt}
                  </p>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'suggestions' && (
            <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-900">Railway Improvement Suggestions</p>
              <p>
                Share ideas for station accessibility, Vande Bharat routes, or digital services.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="text-[#0B63E5] font-semibold"
              >
                ← Back to Complaint Form
              </button>
            </div>
          )}

          {/* Suggestions & Track Complaint Pills + 139 Banner */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'suggestions' ? 'form' : 'suggestions')}
              className="min-h-[42px] rounded-full bg-[#B9D6FF] text-[#084298] text-xs font-bold hover:bg-[#A6CAFF]"
            >
              Suggestions
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'track' ? 'form' : 'track')}
              className="min-h-[42px] rounded-full bg-[#B9D6FF] text-[#084298] text-xs font-bold hover:bg-[#A6CAFF]"
            >
              Track Complaint
            </button>
          </div>

          <div className="rounded-full bg-[#E6F6EC] py-2 px-4 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5">
            <PhoneCall className="h-3.5 w-3.5" /> 139 for Security/Medical Assistance
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. TRAVEL FEEDBACK                                                         */
/* -------------------------------------------------------------------------- */
export function TravelFeedbackView({
  feedbacks,
  onSubmitFeedback,
  onBack,
}: {
  feedbacks: FeedbackEntry[];
  onSubmitFeedback: (entry: FeedbackEntry) => void;
  onBack: () => void;
}) {
  const [pnrOrTrain, setPnrOrTrain] = useState('22416 · VANDE BHARAT EXP');
  const [rating, setRating] = useState(5);
  const [cleanliness, setCleanliness] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback({
      id: `fb-${Date.now()}`,
      pnrOrTrain,
      rating,
      cleanliness,
      punctuality,
      comment: comment.trim() || 'Smooth and comfortable railway journey.',
      createdAt: 'Just now',
    });
    setComment('');
    setSaved(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="h-10 w-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold text-slate-900">Travel Feedback</h1>
            <p className="text-xs text-slate-500">Rate your train journey, coach hygiene &amp; punctuality</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fb-train" className="block text-xs font-medium text-slate-600 mb-1">
              Train / Journey
            </label>
            <select
              id="fb-train"
              value={pnrOrTrain}
              onChange={(e) => setPnrOrTrain(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"
            >
              {RAIL_TRAINS.map((t) => (
                <option key={t.number} value={`${t.number} · ${t.name}`}>
                  {t.number} · {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Overall Experience</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} stars`}
                  className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-amber-50"
                >
                  <Star
                    className={`h-5 w-5 ${
                      n <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fb-clean" className="block text-xs font-medium text-slate-600 mb-1">
                Coach Cleanliness ({cleanliness}/5)
              </label>
              <input
                id="fb-clean"
                type="range"
                min={1}
                max={5}
                value={cleanliness}
                onChange={(e) => setCleanliness(Number(e.target.value))}
                className="w-full accent-[#0B63E5]"
              />
            </div>
            <div>
              <label htmlFor="fb-punc" className="block text-xs font-medium text-slate-600 mb-1">
                Punctuality ({punctuality}/5)
              </label>
              <input
                id="fb-punc"
                type="range"
                min={1}
                max={5}
                value={punctuality}
                onChange={(e) => setPunctuality(Number(e.target.value))}
                className="w-full accent-[#0B63E5]"
              />
            </div>
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write feedback about onboard staff, cleanliness, or catering..."
            aria-label="Journey feedback comments"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />

          {saved && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl p-3">
              Thank you! Your travel feedback has been shared with CRIS &amp; Indian Railways.
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
          >
            Submit Feedback
          </button>
        </form>

        {feedbacks.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h2 className="font-display text-xs font-bold text-slate-700">Your Recent Feedback</h2>
            {feedbacks.map((f) => (
              <div key={f.id} className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>{f.pnrOrTrain}</span>
                  <span>{f.rating}/5 ★</span>
                </div>
                <p className="text-slate-600">{f.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
