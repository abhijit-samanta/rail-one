import type {
  BookingKind,
  BookingRecord,
  BookingStatus,
  QuotaType,
  TrainInfo,
  UserProfile,
} from '../types/rail';

export interface UnreservedFareResult {
  baseFare: number;
  discountAmount: number;
  finalFare: number;
  discountPercent: number;
}

/**
 * Computes Indian Railways UTS unreserved fare with 3% R-Wallet bonus discount.
 */
export function calculateUnreservedFare(params: {
  distanceKm: number;
  trainType: 'Ordinary' | 'Mail/Express' | 'Superfast';
  classCode: 'II' | 'FC';
  adults: number;
  children: number;
  mode: 'Normal' | 'Season';
  payWithRWallet: boolean;
}): UnreservedFareResult {
  const dist = Math.max(5, params.distanceKm);
  const perKm =
    params.trainType === 'Ordinary' ? 0.35 : params.trainType === 'Mail/Express' ? 0.65 : 0.85;
  const classMultiplier = params.classCode === 'FC' ? 3.2 : 1;
  const singleAdultRaw = Math.max(10, Math.round((dist * perKm * classMultiplier) / 5) * 5);

  const passengerUnits = Math.max(1, params.adults) + Math.max(0, params.children) * 0.5;
  const seasonMultiplier = params.mode === 'Season' ? 15 : 1;

  const baseFare = Math.round(singleAdultRaw * passengerUnits * seasonMultiplier);
  const discountPercent = params.payWithRWallet ? 3 : 0;
  const discountAmount = params.payWithRWallet ? Number(((baseFare * 3) / 100).toFixed(2)) : 0;
  const finalFare = Number((baseFare - discountAmount).toFixed(2));

  return {
    baseFare,
    discountAmount,
    finalFare,
    discountPercent,
  };
}

export function calculatePlatformFare(persons: number): number {
  const safeCount = Math.min(4, Math.max(1, Math.floor(persons)));
  return safeCount * 10;
}

export function calculateReservedFare(params: {
  baseClassFare: number;
  quota: QuotaType;
  passengerCount: number;
  cateringSelected: boolean;
}): {
  ticketFare: number;
  quotaCharge: number;
  cateringCharge: number;
  convenienceFee: number;
  totalFare: number;
} {
  const count = Math.max(1, params.passengerCount);
  const ticketFare = params.baseClassFare * count;

  let perPaxQuota = 0;
  if (params.quota === 'Tatkal') {
    perPaxQuota = Math.min(400, Math.max(100, Math.round(params.baseClassFare * 0.3)));
  }
  const quotaCharge = perPaxQuota * count;
  const cateringCharge = params.cateringSelected ? 185 * count : 0;
  const convenienceFee = 20;
  const totalFare = ticketFare + quotaCharge + cateringCharge + convenienceFee;

  return {
    ticketFare,
    quotaCharge,
    cateringCharge,
    convenienceFee,
    totalFare,
  };
}

export function calculateRefundAmount(params: {
  fare: number;
  status: BookingStatus;
  hoursBeforeDeparture: number;
}): { refundAmount: number; deduction: number; ruleSummary: string } {
  if (params.status === 'Cancelled' || params.status === 'Refunded') {
    return {
      refundAmount: 0,
      deduction: params.fare,
      ruleSummary: 'Ticket is already cancelled or refunded.',
    };
  }

  if (params.status === 'WL') {
    const clerkage = Math.min(params.fare, 60);
    return {
      refundAmount: Math.max(0, params.fare - clerkage),
      deduction: clerkage,
      ruleSummary: 'Waitlisted ticket cancelled: ₹60 clerkage deducted.',
    };
  }

  if (params.hoursBeforeDeparture >= 48) {
    const flatFee = Math.min(params.fare, 180);
    return {
      refundAmount: Math.max(0, params.fare - flatFee),
      deduction: flatFee,
      ruleSummary: 'Cancelled >48h before departure: flat ₹180 cancellation charge.',
    };
  }

  if (params.hoursBeforeDeparture >= 12) {
    const deduction = Math.round(params.fare * 0.25);
    return {
      refundAmount: Math.max(0, params.fare - deduction),
      deduction,
      ruleSummary: 'Cancelled 12h–48h before departure: 25% cancellation deduction.',
    };
  }

  if (params.hoursBeforeDeparture >= 4) {
    const deduction = Math.round(params.fare * 0.5);
    return {
      refundAmount: Math.max(0, params.fare - deduction),
      deduction,
      ruleSummary: 'Cancelled 4h–12h before departure: 50% cancellation deduction.',
    };
  }

  return {
    refundAmount: 0,
    deduction: params.fare,
    ruleSummary: 'Less than 4h before departure: File TDR for special refund.',
  };
}

export interface BookingFilterCriteria {
  kind: 'all' | BookingKind;
  statusGroup: 'all' | 'active' | 'completed' | 'cancelled';
  durationDays: 'all' | 30 | 180;
  nowMs?: number;
}

export function filterBookings(
  bookings: BookingRecord[],
  criteria: BookingFilterCriteria
): BookingRecord[] {
  const now = criteria.nowMs ?? Date.now();
  return bookings.filter((b) => {
    if (criteria.kind !== 'all' && b.kind !== criteria.kind) {
      return false;
    }

    if (criteria.statusGroup === 'active') {
      if (b.status !== 'Confirmed' && b.status !== 'WL' && b.status !== 'Active') return false;
    } else if (criteria.statusGroup === 'completed') {
      if (b.status !== 'Completed') return false;
    } else if (criteria.statusGroup === 'cancelled') {
      if (b.status !== 'Cancelled' && b.status !== 'Refunded') return false;
    }

    if (criteria.durationDays !== 'all') {
      const createdMs = Date.parse(b.createdAt);
      if (!Number.isNaN(createdMs)) {
        const diffDays = (now - createdMs) / (1000 * 60 * 60 * 24);
        if (diffDays > criteria.durationDays) return false;
      }
    }

    return true;
  });
}

export function searchTrains(
  trains: TrainInfo[],
  params: {
    fromCode?: string;
    toCode?: string;
    query?: string;
    onlyAvailable?: boolean;
  }
): TrainInfo[] {
  const q = (params.query ?? '').trim().toLowerCase();
  const from = (params.fromCode ?? '').trim().toUpperCase();
  const to = (params.toCode ?? '').trim().toUpperCase();

  return trains.filter((t) => {
    if (from && t.fromCode !== from && !t.schedule.some((s) => s.stationCode === from)) {
      return false;
    }
    if (to && t.toCode !== to && !t.schedule.some((s) => s.stationCode === to)) {
      return false;
    }
    if (from && to) {
      const idxFrom = t.schedule.findIndex((s) => s.stationCode === from);
      const idxTo = t.schedule.findIndex((s) => s.stationCode === to);
      if (idxFrom !== -1 && idxTo !== -1 && idxFrom >= idxTo) {
        return false;
      }
    }
    if (q) {
      const matchesNameOrNumber =
        t.number.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
      if (!matchesNameOrNumber) return false;
    }
    if (params.onlyAvailable) {
      const hasAvail = t.classes.some((c) => c.kind === 'available');
      if (!hasAvail) return false;
    }
    return true;
  });
}

export function validatePnr(pnr: string): boolean {
  return /^\d{10}$/.test(pnr.trim());
}

export function generatePnr(seedNumber?: number): string {
  const prefix = ['241', '652', '834', '419', '671'][Math.floor(Math.random() * 5)];
  const tail =
    seedNumber !== undefined
      ? String(Math.abs(seedNumber) % 10000000).padStart(7, '0')
      : String(Math.floor(1000000 + Math.random() * 9000000));
  return `${prefix}${tail}`;
}

export function generateUtsNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'X';
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function computeProfileCompletion(profile: UserProfile): number {
  let score = 0;
  if (profile.name.trim().length > 1) score += 25;
  if (profile.mobile.trim().length >= 10) score += 20;
  if (profile.email.includes('@')) score += 15;
  if (profile.emailVerified) score += 15;
  if (profile.aadhaarVerified) score += 15;
  if (profile.mpinSet) score += 10;
  return Math.min(100, score);
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatBookingDateLabel(date: Date = new Date()): string {
  const dayName = SHORT_DAYS[date.getDay()];
  const dayNum = String(date.getDate()).padStart(2, '0');
  const monthName = SHORT_MONTHS[date.getMonth()];
  const yr = String(date.getFullYear()).slice(-2);
  return `${dayName}, ${dayNum} ${monthName} ${yr}`;
}

export function formatBookingTimestamp(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function buildBookingSummarySpec(booking: BookingRecord): {
  headerBadge: string;
  invoiceCategoryTitle: string;
  bookedOnLine: string;
  viaLabel: string;
  statusLine: string;
  passengerLabelDetails: string;
  passengerLabelInvoice: string;
  tariffLine: string;
} {
  const headerBadge =
    booking.kind === 'unreserved'
      ? 'JOURNEY'
      : booking.kind === 'platform'
      ? 'PLATFORM'
      : booking.kind === 'food'
      ? 'FOOD ORDER'
      : 'RESERVED';

  const invoiceCategoryTitle =
    booking.kind === 'unreserved'
      ? 'Journey Ticket'
      : booking.kind === 'platform'
      ? 'Platform Ticket'
      : booking.kind === 'food'
      ? 'E-Catering Order'
      : 'Reserved Ticket';

  let bookedOnLine = booking.bookedAtTimestamp;
  if (!bookedOnLine) {
    const parsed = new Date(booking.createdAt);
    bookedOnLine = Number.isNaN(parsed.getTime())
      ? `${booking.journeyDate} 12:00:00`
      : formatBookingTimestamp(parsed);
  }

  const viaLabel = booking.via?.trim() ? booking.via : '-';

  const statusLine =
    booking.status === 'Completed'
      ? 'Ticket Expired'
      : booking.status === 'Cancelled'
      ? 'Ticket Cancelled'
      : booking.status === 'Refunded'
      ? 'Ticket Refunded'
      : booking.status === 'WL'
      ? 'Ticket Waitlisted'
      : booking.kind === 'unreserved' || booking.kind === 'platform'
      ? `Ticket Active · ${booking.journeyDisplayDate}`
      : 'Ticket Confirmed';

  let adults = booking.adultsCount;
  let children = booking.childrenCount;
  if (adults === undefined || children === undefined) {
    const firstName = booking.passengers[0]?.name ?? '';
    const adultMatch = firstName.match(/(\d+)\s*Adult/i);
    const childMatch = firstName.match(/(\d+)\s*Child/i);
    if (adultMatch || childMatch) {
      adults = adultMatch ? Number(adultMatch[1]) : 1;
      children = childMatch ? Number(childMatch[1]) : 0;
    } else if (booking.kind === 'reserved' || booking.kind === 'food') {
      adults = Math.max(1, booking.passengers.length);
      children = 0;
    } else {
      adults = 1;
      children = 0;
    }
  }

  const adultWord = adults === 1 ? 'Adult' : 'Adults';
  const childWord = children === 1 ? 'Child' : 'Children';
  const passengerLabelDetails = `${adults} ${adultWord} , ${children} ${children === 0 ? 'Child' : childWord}`;
  const passengerLabelInvoice = `${adults} ${adultWord}, ${children} ${children === 0 ? 'Child' : childWord}`;

  const displayFare =
    booking.originalFare ??
    (booking.discountSaved && booking.discountSaved > 0
      ? Number((booking.fare + booking.discountSaved).toFixed(2))
      : booking.fare);

  let tariffLine: string;
  if (booking.kind === 'unreserved') {
    const rawClass = booking.classOrMode.toUpperCase();
    const className = rawClass.includes('FC') || rawClass.includes('FIRST') ? 'FIRST' : 'SECOND';
    const modeName = rawClass.includes('SUPERFAST')
      ? 'SUPERFAST'
      : rawClass.includes('MAIL') || rawClass.includes('EXP')
      ? 'MAIL/EXP'
      : 'ORDINARY';
    const typeName = (booking.ticketType ?? 'JOURNEY').toUpperCase();
    tariffLine = `${className} | ${modeName} | ${typeName} | ₹${displayFare.toFixed(2)}`;
  } else if (booking.kind === 'platform') {
    tariffLine = `PLATFORM | ENTRY | 2 HRS | ₹${displayFare.toFixed(2)}`;
  } else {
    tariffLine = `${booking.classOrMode.toUpperCase()} | ${booking.quota?.toUpperCase() ?? 'GN'} | ₹${displayFare.toFixed(2)}`;
  }

  return {
    headerBadge,
    invoiceCategoryTitle,
    bookedOnLine,
    viaLabel,
    statusLine,
    passengerLabelDetails,
    passengerLabelInvoice,
    tariffLine,
  };
}

export function formatUpcomingPreviewDateTime(booking: BookingRecord): string {
  const rawTs = booking.bookedAtTimestamp;
  if (rawTs) {
    const match = rawTs.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      const yr = match[1];
      const monthIdx = Math.max(0, Math.min(11, Number(match[2]) - 1));
      const dayNum = String(Number(match[3])).padStart(2, '0');
      const hh = match[4];
      const min = match[5];
      return `${dayNum} ${SHORT_MONTHS[monthIdx]} ${yr}, ${hh}:${min}`;
    }
  }
  const parsed = new Date(booking.createdAt);
  if (!Number.isNaN(parsed.getTime())) {
    const dayNum = String(parsed.getDate()).padStart(2, '0');
    const monthName = SHORT_MONTHS[parsed.getMonth()];
    const yr = parsed.getFullYear();
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return `${dayNum} ${monthName} ${yr}, ${hh}:${min}`;
  }
  return `${booking.journeyDate}, 00:00`;
}

export function buildUpcomingTicketFields(booking: BookingRecord): {
  categoryTitle: string;
  statusBadge: string;
  bookingDateTime: string;
  subRefCode: string;
  distanceLabel: string;
  passengerLabel: string;
  ticketTypeLabel: string;
  trainTypeLabel: string;
  classLabel: string;
  fareLabel: string;
  viaLabel: string;
} {
  const summary = buildBookingSummarySpec(booking);
  const displayFare =
    booking.originalFare ??
    (booking.discountSaved && booking.discountSaved > 0
      ? Number((booking.fare + booking.discountSaved).toFixed(2))
      : booking.fare);

  const rawClass = booking.classOrMode.toUpperCase();
  const classLabel =
    booking.kind === 'unreserved'
      ? rawClass.includes('FC') || rawClass.includes('FIRST')
        ? 'FIRST'
        : 'SECOND'
      : booking.kind === 'platform'
      ? 'PLATFORM'
      : booking.classOrMode.toUpperCase();

  const trainTypeLabel =
    booking.kind === 'unreserved'
      ? rawClass.includes('SUPERFAST')
        ? 'SUPERFAST'
        : rawClass.includes('MAIL') || rawClass.includes('EXP')
        ? 'MAIL/EXP'
        : 'ORDINARY'
      : booking.kind === 'platform'
      ? 'ENTRY PASS'
      : booking.departureTime.toUpperCase();

  const ticketTypeLabel =
    booking.kind === 'unreserved'
      ? (booking.ticketType ?? 'JOURNEY').toUpperCase()
      : booking.kind === 'platform'
      ? 'PLATFORM'
      : (booking.quota ?? 'GENERAL').toUpperCase();

  const statusBadge =
    booking.status === 'Confirmed'
      ? 'CONFIRMED'
      : booking.status === 'WL'
      ? 'WL'
      : 'ACTIVE';

  let hash = 27675;
  for (let i = 0; i < booking.pnrOrTicketNo.length; i += 1) {
    hash = (hash * 31 + booking.pnrOrTicketNo.charCodeAt(i)) % 90000;
  }
  const subRefCode = `R${String(10000 + hash).slice(0, 5)}`;

  return {
    categoryTitle: summary.invoiceCategoryTitle,
    statusBadge,
    bookingDateTime: formatUpcomingPreviewDateTime(booking),
    subRefCode,
    distanceLabel:
      booking.distanceKm !== undefined && booking.distanceKm > 0
        ? `${booking.distanceKm} km`
        : '—',
    passengerLabel: summary.passengerLabelInvoice,
    ticketTypeLabel,
    trainTypeLabel,
    classLabel,
    fareLabel: `₹${displayFare.toFixed(2)}`,
    viaLabel: summary.viaLabel,
  };
}

export function formatCountdownParts(secondsLeft: number): { mins: string; secs: string } {
  const clamped = Math.max(0, Math.floor(secondsLeft));
  const mins = String(Math.floor(clamped / 60)).padStart(2, '0');
  const secs = String(clamped % 60).padStart(2, '0');
  return { mins, secs };
}

export function calculateCountdownProgress(secondsLeft: number, totalSeconds = 300): number {
  if (totalSeconds <= 0) return 100;
  const clamped = Math.max(0, Math.min(totalSeconds, secondsLeft));
  return Number((((totalSeconds - clamped) / totalSeconds) * 100).toFixed(4));
}

export function buildHighDensityQrData(
  seedStr: string,
  size = 133
): { size: number; pathData: string; alignmentCenters: number[] } {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (row0: number, col0: number) => {
    for (let r = -1; r <= 7; r += 1) {
      for (let c = -1; c <= 7; c += 1) {
        const rr = row0 + r;
        const cc = col0 + c;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          grid[rr][cc] = false;
        } else if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[rr][cc] = true;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Version 29 (133x133) alignment pattern grid centers (6x6 grid matching UTS high-density QR)
  const alignmentCenters = [6, 30, 54, 78, 102, size - 7];
  const lastIdx = alignmentCenters.length - 1;
  for (let i = 0; i < alignmentCenters.length; i += 1) {
    for (let j = 0; j < alignmentCenters.length; j += 1) {
      if ((i === 0 && j === 0) || (i === 0 && j === lastIdx) || (i === lastIdx && j === 0)) {
        continue;
      }
      const ar = alignmentCenters[i];
      const ac = alignmentCenters[j];
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          const rr = ar + r;
          const cc = ac + c;
          reserved[rr][cc] = true;
          grid[rr][cc] =
            Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    if (!reserved[6][i]) {
      reserved[6][i] = true;
      grid[6][i] = i % 2 === 0;
    }
    if (!reserved[i][6]) {
      reserved[i][6] = true;
      grid[i][6] = i % 2 === 0;
    }
  }

  // Format information reserved strips around finders
  for (let i = 0; i <= 8; i += 1) {
    if (!reserved[8][i]) {
      reserved[8][i] = true;
      grid[8][i] = i % 3 !== 1;
    }
    if (!reserved[i][8]) {
      reserved[i][8] = true;
      grid[i][8] = i % 2 === 0;
    }
  }
  for (let i = size - 8; i < size; i += 1) {
    reserved[8][i] = true;
    grid[8][i] = i % 2 === 1;
    if (i < size - 7) continue;
    reserved[i][8] = true;
    grid[i][8] = i % 2 === 0;
  }

  // Version information 6x3 & 3x6 blocks beside top-right & bottom-left finders
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      reserved[r][size - 11 + c] = true;
      grid[r][size - 11 + c] = ((r + c) % 2) === 0;
      reserved[size - 11 + c][r] = true;
      grid[size - 11 + c][r] = ((r + c) % 2) === 0;
    }
  }

  // Dark module
  reserved[size - 8][8] = true;
  grid[size - 8][8] = true;

  // Deterministic seeded PRNG for dense authentic UTS QR data codewords
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (reserved[r][c]) continue;
      h ^= ((r + 1) * 131 + (c + 1) * 67) & 0xff;
      h = Math.imul(h, 16777619);
      grid[r][c] = ((h >>> 16) & 1) === 1;
    }
  }

  const parts: string[] = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (grid[r][c]) {
        parts.push(`M${c} ${r}h1v1h-1z`);
      }
    }
  }

  return {
    size,
    pathData: parts.join(''),
    alignmentCenters,
  };
}

export function getUpcomingBookings(bookings: BookingRecord[]): BookingRecord[] {
  return bookings
    .filter((b) => b.status === 'Active' || b.status === 'Confirmed' || b.status === 'WL')
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
}

export function formatBookingKindLabel(kind: BookingKind): string {
  switch (kind) {
    case 'unreserved':
      return 'Unreserved';
    case 'reserved':
      return 'Reserved';
    case 'platform':
      return 'Platform';
    case 'food':
      return 'Food Order';
    default:
      return 'Ticket';
  }
}
