import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBookingSummarySpec,
  buildHighDensityQrData,
  buildUpcomingTicketFields,
  calculateCountdownProgress,
  calculatePlatformFare,
  calculateRefundAmount,
  calculateReservedFare,
  calculateUnreservedFare,
  computeProfileCompletion,
  filterBookings,
  formatBookingKindLabel,
  formatBookingTimestamp,
  formatCountdownParts,
  formatUpcomingPreviewDateTime,
  generatePnr,
  getUpcomingBookings,
  searchTrains,
  validatePnr,
} from './railLogic';
import { RAIL_TRAINS, SEED_BOOKINGS } from '../data/railData';

test('unreserved fare applies exact 3% R-Wallet discount', () => {
  const withWallet = calculateUnreservedFare({
    distanceKm: 60,
    trainType: 'Ordinary',
    classCode: 'II',
    adults: 1,
    children: 0,
    mode: 'Normal',
    payWithRWallet: true,
  });
  assert.equal(withWallet.baseFare, 20);
  assert.equal(withWallet.discountAmount, 0.6);
  assert.equal(withWallet.finalFare, 19.4);

  const withoutWallet = calculateUnreservedFare({
    distanceKm: 60,
    trainType: 'Ordinary',
    classCode: 'II',
    adults: 1,
    children: 0,
    mode: 'Normal',
    payWithRWallet: false,
  });
  assert.equal(withoutWallet.discountAmount, 0);
  assert.equal(withoutWallet.finalFare, 20);
});

test('platform ticket fare scales linearly at ₹10 per person up to 4', () => {
  assert.equal(calculatePlatformFare(1), 10);
  assert.equal(calculatePlatformFare(3), 30);
  assert.equal(calculatePlatformFare(8), 40);
});

test('reserved fare computes Tatkal surcharge and catering accurately', () => {
  const result = calculateReservedFare({
    baseClassFare: 1000,
    quota: 'Tatkal',
    passengerCount: 2,
    cateringSelected: true,
  });
  assert.equal(result.ticketFare, 2000);
  assert.equal(result.quotaCharge, 600);
  assert.equal(result.cateringCharge, 370);
  assert.equal(result.convenienceFee, 20);
  assert.equal(result.totalFare, 2990);
});

test('refund calculation respects Indian Railways cancellation slabs', () => {
  const early = calculateRefundAmount({
    fare: 1070,
    status: 'Confirmed',
    hoursBeforeDeparture: 72,
  });
  assert.equal(early.refundAmount, 890);

  const mid = calculateRefundAmount({
    fare: 1000,
    status: 'Confirmed',
    hoursBeforeDeparture: 24,
  });
  assert.equal(mid.refundAmount, 750);

  const wl = calculateRefundAmount({
    fare: 570,
    status: 'WL',
    hoursBeforeDeparture: 2,
  });
  assert.equal(wl.refundAmount, 510);
});

test('booking filter separates reserved, unreserved, and status groups', () => {
  const sampleFixture = [
    ...SEED_BOOKINGS,
    {
      ...SEED_BOOKINGS[0],
      id: 'fixture-res',
      kind: 'reserved' as const,
      status: 'Confirmed' as const,
    },
    {
      ...SEED_BOOKINGS[0],
      id: 'fixture-can',
      kind: 'reserved' as const,
      status: 'Cancelled' as const,
    },
  ];
  const reservedOnly = filterBookings(sampleFixture, {
    kind: 'reserved',
    statusGroup: 'all',
    durationDays: 'all',
  });
  assert.ok(reservedOnly.length >= 1);
  assert.ok(reservedOnly.every((b) => b.kind === 'reserved'));

  const cancelledOnly = filterBookings(sampleFixture, {
    kind: 'all',
    statusGroup: 'cancelled',
    durationDays: 'all',
  });
  assert.ok(cancelledOnly.length >= 1);
  assert.ok(cancelledOnly.every((b) => b.status === 'Cancelled' || b.status === 'Refunded'));
});

test('PNR validator & generator produce valid 10-digit PNRs', () => {
  const pnr = generatePnr(1234567);
  assert.equal(pnr.length, 10);
  assert.equal(validatePnr(pnr), true);
  assert.equal(validatePnr('12345'), false);
  assert.equal(validatePnr('ABC1234567'), false);
});

test('train search finds NDLS -> CNB trains and filters available classes', () => {
  const ndlsToCnb = searchTrains(RAIL_TRAINS, {
    fromCode: 'NDLS',
    toCode: 'CNB',
  });
  assert.ok(ndlsToCnb.some((t) => t.number === '22416'));

  const onlyAvail = searchTrains(RAIL_TRAINS, {
    fromCode: 'NDLS',
    toCode: 'CNB',
    onlyAvailable: true,
  });
  assert.ok(onlyAvail.every((t) => t.classes.some((c) => c.kind === 'available')));
});

test('profile completion reaches 100% when verified', () => {
  const pct = computeProfileCompletion({
    name: 'Kailash Kumar',
    userId: 'kailash_rail',
    mobile: '9876543210',
    email: 'kailash@railone.in',
    emailVerified: true,
    aadhaarVerified: true,
    nameEditedOnce: false,
    biometricEnabled: false,
    isGuest: false,
    rWalletBalance: 916.4,
    mpinSet: true,
  });
  assert.equal(pct, 100);
});

test('booking summary spec and timestamp formatter match Booking Details and UTS Invoice format', () => {
  const formatted = formatBookingTimestamp(new Date(2026, 1, 18, 14, 52, 57));
  assert.equal(formatted, '2026-02-18 14:52:57');

  const spec = buildBookingSummarySpec(SEED_BOOKINGS[0]);
  assert.equal(spec.headerBadge, 'JOURNEY');
  assert.equal(spec.invoiceCategoryTitle, 'Journey Ticket');
  assert.equal(spec.viaLabel, '-');
  assert.equal(spec.bookedOnLine, '2026-02-18 14:52:57');
  assert.equal(spec.statusLine, 'Ticket Expired');
  assert.equal(spec.passengerLabelDetails, '1 Adult , 0 Child');
  assert.equal(spec.passengerLabelInvoice, '1 Adult, 0 Child');
  assert.equal(spec.tariffLine, 'SECOND | ORDINARY | RETURN | ₹20.00');

  const activeFc = buildBookingSummarySpec({
    ...SEED_BOOKINGS[0],
    status: 'Active',
    ticketType: 'JOURNEY',
    classOrMode: 'FC · Superfast',
    adultsCount: 2,
    childrenCount: 1,
    fare: 97,
  });
  assert.equal(activeFc.passengerLabelDetails, '2 Adults , 1 Child');
  assert.equal(activeFc.passengerLabelInvoice, '2 Adults, 1 Child');
  assert.equal(activeFc.tariffLine, 'FIRST | SUPERFAST | JOURNEY | ₹97.00');

  const rWalletDiscounted = buildBookingSummarySpec({
    ...SEED_BOOKINGS[0],
    status: 'Active',
    ticketType: 'JOURNEY',
    classOrMode: 'II · Ordinary',
    fare: 19.4,
    originalFare: 20,
    discountSaved: 0.6,
  });
  assert.equal(rWalletDiscounted.tariffLine, 'SECOND | ORDINARY | JOURNEY | ₹20.00');

  const legacyDiscounted = buildBookingSummarySpec({
    ...SEED_BOOKINGS[0],
    status: 'Active',
    ticketType: 'JOURNEY',
    classOrMode: 'II · Ordinary',
    fare: 9.7,
    discountSaved: 0.3,
  });
  assert.equal(legacyDiscounted.tariffLine, 'SECOND | ORDINARY | JOURNEY | ₹10.00');
});

test('upcoming ticket fields format dynamic booking date, original fare, and distance cleanly', () => {
  const fields = buildUpcomingTicketFields({
    ...SEED_BOOKINGS[0],
    pnrOrTicketNo: 'XEC8EI90HI',
    fromName: 'BARRACKPORE',
    toName: 'PALTA',
    distanceKm: 3,
    ticketType: 'JOURNEY',
    classOrMode: 'II · Ordinary',
    fare: 4.85,
    originalFare: 5,
    discountSaved: 0.15,
    status: 'Active',
    bookedAtTimestamp: '2026-11-22 00:03:11',
  });
  assert.equal(fields.categoryTitle, 'Journey Ticket');
  assert.equal(fields.statusBadge, 'ACTIVE');
  assert.equal(fields.bookingDateTime, '22 Nov 2026, 00:03');
  assert.equal(fields.distanceLabel, '3 km');
  assert.equal(fields.passengerLabel, '1 Adult, 0 Child');
  assert.equal(fields.ticketTypeLabel, 'JOURNEY');
  assert.equal(fields.trainTypeLabel, 'ORDINARY');
  assert.equal(fields.classLabel, 'SECOND');
  assert.equal(fields.fareLabel, '₹5.00');
  assert.equal(fields.viaLabel, '-');
  assert.match(fields.subRefCode, /^R\d{5}$/);

  assert.equal(
    formatUpcomingPreviewDateTime({
      ...SEED_BOOKINGS[0],
      bookedAtTimestamp: '2026-11-22 00:03:11',
    }),
    '22 Nov 2026, 00:03'
  );
});

test('formatCountdownParts splits MM:SS pairs consistently across minute and second ticks', () => {
  assert.deepEqual(formatCountdownParts(300), { mins: '05', secs: '00' });
  assert.deepEqual(formatCountdownParts(299), { mins: '04', secs: '59' });
  assert.deepEqual(formatCountdownParts(215), { mins: '03', secs: '35' });
  assert.deepEqual(formatCountdownParts(214), { mins: '03', secs: '34' });
  assert.deepEqual(formatCountdownParts(-5), { mins: '00', secs: '00' });
});

test('calculateCountdownProgress tracks yellow line from 0% at start to 100% at expiry', () => {
  assert.equal(calculateCountdownProgress(300, 300), 0);
  assert.equal(calculateCountdownProgress(240, 300), 20);
  assert.equal(calculateCountdownProgress(150, 300), 50);
  assert.equal(calculateCountdownProgress(0, 300), 100);
});

test('buildHighDensityQrData generates Version 29 (133x133) deterministic path with 6x6 alignment centers', () => {
  const qr = buildHighDensityQrData('XEC8EI90HI|BRP|PTF|₹5.00');
  assert.equal(qr.size, 133);
  assert.deepEqual(qr.alignmentCenters, [6, 30, 54, 78, 102, 126]);
  assert.ok(qr.pathData.length > 50000);
  const qr2 = buildHighDensityQrData('XEC8EI90HI|BRP|PTF|₹5.00');
  assert.equal(qr.pathData, qr2.pathData);
});

test('getUpcomingBookings returns only active/confirmed/WL sorted newest first and formats kind labels', () => {
  const sample = [
    ...SEED_BOOKINGS,
    {
      ...SEED_BOOKINGS[0],
      id: 'up-old',
      status: 'Active' as const,
      createdAt: '2026-11-21T10:00:00.000Z',
    },
    {
      ...SEED_BOOKINGS[0],
      id: 'up-new',
      status: 'Confirmed' as const,
      createdAt: '2026-11-21T11:00:00.000Z',
    },
  ];
  const upcoming = getUpcomingBookings(sample);
  assert.equal(upcoming.length, 2);
  assert.equal(upcoming[0].id, 'up-new');
  assert.equal(upcoming[1].id, 'up-old');
  assert.equal(formatBookingKindLabel('unreserved'), 'Unreserved');
  assert.equal(formatBookingKindLabel('reserved'), 'Reserved');
  assert.equal(formatBookingKindLabel('platform'), 'Platform');
  assert.equal(formatBookingKindLabel('food'), 'Food Order');
});
