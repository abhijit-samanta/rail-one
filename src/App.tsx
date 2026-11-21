import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Home,
  Menu as MenuIcon,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { AuthSSOModal } from './components/AuthSSOModal';
import { BookingsView } from './components/BookingsView';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import {
  CoachPositionView,
  FileRefundView,
  OrderFoodView,
  PnrStatusView,
  RailMadadView,
  TrackTrainView,
  TravelFeedbackView,
} from './components/RailServicesViews';
import { ReservedBookingView } from './components/ReservedBookingView';
import { StationSearchExplorer } from './components/StationSearchExplorer';
import { TrainSearchScheduleView } from './components/TrainSearchScheduleView';
import { UnreservedBookingView } from './components/UnreservedBookingView';
import { UpcomingBookingDetailsScreen } from './components/UpcomingBookingDetailsScreen';
import { YouView } from './components/YouView';
import { getUpcomingBookings } from './utils/railLogic';
import {
  RAIL_STATIONS,
  SEED_BOOKINGS,
  SEED_COMPLAINTS,
  SEED_SAVED_PASSENGERS,
  SEED_USER_PROFILE,
  SEED_WALLET_TRANSACTIONS,
  UI_LABELS,
} from './data/railData';
import type {
  ActiveScreen,
  BookingRecord,
  FeedbackEntry,
  LanguageCode,
  MainTab,
  RailMadadComplaint,
  SavedPassenger,
  UserProfile,
  WalletTransaction,
} from './types/rail';
import type {
  EasternRailwaySuburbanFareDb,
  KolkataSuburbanDb,
} from './types/suburban';
import {
  buildSuburbanIndex,
  getOfficialEasternRailwayFareDb,
  mergeUnifiedStations,
  setOfficialEasternRailwayFareDb,
} from './utils/suburbanLogic';

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [language, setLanguage] = useState<LanguageCode>(() =>
    loadStored<LanguageCode>('railone_lang', 'en')
  );

  const [profile, setProfile] = useState<UserProfile>(() =>
    loadStored<UserProfile>('railone_profile', SEED_USER_PROFILE)
  );
  const [bookings, setBookings] = useState<BookingRecord[]>(() =>
    loadStored<BookingRecord[]>('railone_bookings_v2', SEED_BOOKINGS)
  );
  const [savedPassengers, setSavedPassengers] = useState<SavedPassenger[]>(() =>
    loadStored<SavedPassenger[]>('railone_passengers', SEED_SAVED_PASSENGERS)
  );
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() =>
    loadStored<WalletTransaction[]>('railone_wallet_tx', SEED_WALLET_TRANSACTIONS)
  );
  const [complaints, setComplaints] = useState<RailMadadComplaint[]>(() =>
    loadStored<RailMadadComplaint[]>('railone_complaints', SEED_COMPLAINTS)
  );
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>(() =>
    loadStored<FeedbackEntry[]>('railone_feedbacks', [])
  );

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQuickTopup, setShowQuickTopup] = useState(false);
  const [quickTopupAmt, setQuickTopupAmt] = useState('500');

  // Kolkata Suburban Railway database & official fare table fetch state
  const [suburbanDb, setSuburbanDb] = useState<KolkataSuburbanDb | null>(null);
  const [fareDb, setFareDb] = useState<EasternRailwaySuburbanFareDb>(() =>
    getOfficialEasternRailwayFareDb()
  );
  const [suburbanLoading, setSuburbanLoading] = useState<boolean>(true);
  const [suburbanError, setSuburbanError] = useState<string | null>(null);
  const [stationSearchQuery, setStationSearchQuery] = useState<string>('');
  const [preselectedFrom, setPreselectedFrom] = useState<string | undefined>(undefined);
  const [preselectedTo, setPreselectedTo] = useState<string | undefined>(undefined);
  const [preselectedPlatform, setPreselectedPlatform] = useState<string | undefined>(undefined);
  const [homeUpcomingTicketId, setHomeUpcomingTicketId] = useState<string | null>(null);

  const fetchSuburbanDatabase = useCallback(async () => {
    setSuburbanLoading(true);
    setSuburbanError(null);
    try {
      const [stationRes, fareRes] = await Promise.all([
        fetch('/assets/aistudio/kolkata_suburban_railway_database_0a0fee1d.json'),
        fetch('/assets/aistudio/eastern_railway_suburban_second_class_fares_412194ad.json'),
      ]);
      if (!stationRes.ok) {
        throw new Error(`HTTP ${stationRes.status} while fetching station database`);
      }
      const data = (await stationRes.json()) as KolkataSuburbanDb;
      if (fareRes.ok) {
        const officialFareData = (await fareRes.json()) as EasternRailwaySuburbanFareDb;
        setOfficialEasternRailwayFareDb(officialFareData);
        setFareDb(officialFareData);
      }
      setSuburbanDb(data);
    } catch (err) {
      setSuburbanError(err instanceof Error ? err.message : 'Failed to load station database');
    } finally {
      setSuburbanLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuburbanDatabase();
  }, [fetchSuburbanDatabase]);

  const suburbanIndex = useMemo(
    () => (suburbanDb ? buildSuburbanIndex(suburbanDb) : null),
    [suburbanDb]
  );

  const unifiedStations = useMemo(
    () => mergeUnifiedStations(RAIL_STATIONS, suburbanIndex),
    [suburbanIndex]
  );

  useEffect(() => {
    try {
      localStorage.setItem('railone_lang', JSON.stringify(language));
      localStorage.setItem('railone_profile', JSON.stringify(profile));
      localStorage.setItem('railone_bookings_v2', JSON.stringify(bookings));
      localStorage.setItem('railone_passengers', JSON.stringify(savedPassengers));
      localStorage.setItem('railone_wallet_tx', JSON.stringify(walletTransactions));
      localStorage.setItem('railone_complaints', JSON.stringify(complaints));
      localStorage.setItem('railone_feedbacks', JSON.stringify(feedbacks));
    } catch {
      // ignore storage quota failures
    }
  }, [
    language,
    profile,
    bookings,
    savedPassengers,
    walletTransactions,
    complaints,
    feedbacks,
  ]);

  const t = UI_LABELS[language];

  const handleSelectTab = (tab: MainTab) => {
    setHomeUpcomingTicketId(null);
    setActiveTab(tab);
    setActiveScreen('home');
  };

  const handleNavigateScreen = (screen: ActiveScreen) => {
    setHomeUpcomingTicketId(null);
    setActiveTab('home');
    setActiveScreen(screen);
  };

  const upcomingBookings = useMemo(() => getUpcomingBookings(bookings), [bookings]);

  const homeUpcomingTicket = useMemo(
    () =>
      homeUpcomingTicketId
        ? bookings.find((b) => b.id === homeUpcomingTicketId) ?? null
        : null,
    [bookings, homeUpcomingTicketId]
  );

  const handleBookAgain = (bk: BookingRecord) => {
    setHomeUpcomingTicketId(null);
    if (bk.kind === 'unreserved') {
      setPreselectedFrom(bk.fromCode);
      setPreselectedTo(bk.toCode);
      handleNavigateScreen('unreserved');
    } else if (bk.kind === 'platform') {
      setPreselectedPlatform(bk.fromCode);
      handleNavigateScreen('platform');
    } else if (bk.kind === 'food') {
      handleNavigateScreen('order-food');
    } else {
      handleNavigateScreen('reserved');
    }
  };

  const handleBookConnecting = (bk: BookingRecord) => {
    setHomeUpcomingTicketId(null);
    setPreselectedFrom(bk.toCode);
    handleNavigateScreen('unreserved');
  };

  const handleCompleteBooking = (booking: BookingRecord, debitWallet: number) => {
    setBookings((prev) => [booking, ...prev]);
    if (debitWallet > 0) {
      setProfile((prev) => ({
        ...prev,
        rWalletBalance: Number(Math.max(0, prev.rWalletBalance - debitWallet).toFixed(2)),
      }));
      setWalletTransactions((prev) => [
        {
          id: `wt-${Date.now()}`,
          title: booking.title,
          amount: debitWallet,
          type: 'debit',
          date: 'Today',
          refId: booking.pnrOrTicketNo,
        },
        ...prev,
      ]);
    }
  };

  const handleCancelBooking = (bookingId: string, refundAmount: number) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Cancelled', refundAmount }
          : b
      )
    );
    if (refundAmount > 0) {
      setProfile((prev) => ({
        ...prev,
        rWalletBalance: Number((prev.rWalletBalance + refundAmount).toFixed(2)),
      }));
      setWalletTransactions((prev) => [
        {
          id: `wt-ref-${Date.now()}`,
          title: 'Ticket Cancellation Refund',
          amount: refundAmount,
          type: 'credit',
          date: 'Today',
          refId: `REF${Math.floor(100000 + Math.random() * 900000)}`,
        },
        ...prev,
      ]);
    }
  };

  const handleFileTdr = (bookingId: string, reason: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'Refunded', tdrReason: reason, refundAmount: b.fare }
          : b
      )
    );
  };

  const handleAddWalletMoney = (amount: number) => {
    setProfile((prev) => ({
      ...prev,
      rWalletBalance: Number((prev.rWalletBalance + amount).toFixed(2)),
    }));
    setWalletTransactions((prev) => [
      {
        id: `wt-${Date.now()}`,
        title: 'R-Wallet Top-up via UPI',
        amount,
        type: 'credit',
        date: 'Today',
        refId: `UPI${Math.floor(10000000 + Math.random() * 89999999)}`,
      },
      ...prev,
    ]);
  };

  const handleSavePassenger = (pax: SavedPassenger) => {
    setSavedPassengers((prev) => {
      const exists = prev.some((p) => p.id === pax.id);
      return exists ? prev.map((p) => (p.id === pax.id ? pax : p)) : [...prev, pax];
    });
  };

  const handleDeletePassenger = (id: string) => {
    setSavedPassengers((prev) => prev.filter((p) => p.id !== id));
  };

  const cycleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : prev === 'hi' ? 'bn' : 'en'));
  };

  const navItems: Array<{ id: MainTab; label: string; Icon: typeof Home }> = [
    { id: 'home', label: t.home, Icon: Home },
    { id: 'bookings', label: t.myBookings, Icon: Ticket },
    { id: 'you', label: t.you, Icon: User },
    { id: 'menu', label: t.menu, Icon: MenuIcon },
  ];

  const renderMainContent = () => {
    if (activeTab === 'you') {
      return (
        <YouView
          profile={profile}
          savedPassengers={savedPassengers}
          walletTransactions={walletTransactions}
          onUpdateProfile={setProfile}
          onAddWalletMoney={handleAddWalletMoney}
          onSavePassenger={handleSavePassenger}
          onDeletePassenger={handleDeletePassenger}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      );
    }

    if (activeTab === 'menu') {
      return (
        <MenuView
          profile={profile}
          language={language}
          onChangeLanguage={setLanguage}
          onNavigate={handleNavigateScreen}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      );
    }

    // Home Tab Sub-screens
    switch (activeScreen) {
      case 'reserved':
        return (
          <ReservedBookingView
            stations={unifiedStations}
            profile={profile}
            savedPassengers={savedPassengers}
            onBack={() => setActiveScreen('home')}
            onCompleteBooking={handleCompleteBooking}
            onOpenBookings={() => handleSelectTab('bookings')}
          />
        );
      case 'unreserved':
        return (
          <UnreservedBookingView
            initialTab="unreserved"
            initialFromCode={preselectedFrom}
            initialToCode={preselectedTo}
            stations={unifiedStations}
            suburbanIndex={suburbanIndex}
            fareDb={fareDb}
            profile={profile}
            onBack={() => setActiveScreen('home')}
            onCompleteBooking={handleCompleteBooking}
            onOpenBookings={() => handleSelectTab('bookings')}
          />
        );
      case 'platform':
        return (
          <UnreservedBookingView
            initialTab="platform"
            initialPlatformCode={preselectedPlatform}
            stations={unifiedStations}
            suburbanIndex={suburbanIndex}
            fareDb={fareDb}
            profile={profile}
            onBack={() => setActiveScreen('home')}
            onCompleteBooking={handleCompleteBooking}
            onOpenBookings={() => handleSelectTab('bookings')}
          />
        );
      case 'search-trains':
        return (
          <TrainSearchScheduleView
            stations={unifiedStations}
            onBack={() => setActiveScreen('home')}
            onSelectTrainForBooking={() => setActiveScreen('reserved')}
          />
        );
      case 'station-search':
        return (
          <StationSearchExplorer
            suburbanIndex={suburbanIndex}
            fareDb={fareDb}
            loading={suburbanLoading}
            error={suburbanError}
            initialQuery={stationSearchQuery}
            onRetryFetch={fetchSuburbanDatabase}
            onBack={() => setActiveScreen('home')}
            onBookUnreservedPair={(fromCode, toCode) => {
              setPreselectedFrom(fromCode);
              setPreselectedTo(toCode);
              setActiveScreen('unreserved');
            }}
            onBookPlatformStation={(stationCode) => {
              setPreselectedPlatform(stationCode);
              setActiveScreen('platform');
            }}
          />
        );
      case 'pnr-status':
        return (
          <PnrStatusView
            bookings={bookings}
            onBack={() => setActiveScreen('home')}
            onOpenOrderFood={() => setActiveScreen('order-food')}
            onOpenTrackTrain={() => setActiveScreen('track-train')}
          />
        );
      case 'coach-position':
        return <CoachPositionView onBack={() => setActiveScreen('home')} />;
      case 'track-train':
        return <TrackTrainView onBack={() => setActiveScreen('home')} />;
      case 'order-food':
        return (
          <OrderFoodView
            profile={profile}
            bookings={bookings}
            onBack={() => setActiveScreen('home')}
            onPlaceFoodOrder={handleCompleteBooking}
          />
        );
      case 'file-refund':
        return (
          <FileRefundView
            bookings={bookings}
            onFileTdr={handleFileTdr}
            onBack={() => setActiveScreen('home')}
          />
        );
      case 'rail-madad':
        return (
          <RailMadadView
            stations={unifiedStations}
            complaints={complaints}
            onSubmitComplaint={(cmp) => setComplaints((prev) => [cmp, ...prev])}
            onBack={() => setActiveScreen('home')}
          />
        );
      case 'travel-feedback':
        return (
          <TravelFeedbackView
            feedbacks={feedbacks}
            onSubmitFeedback={(fb) => setFeedbacks((prev) => [fb, ...prev])}
            onBack={() => setActiveScreen('home')}
          />
        );
      case 'performance-dashboard':
        return (
          <MenuView
            profile={profile}
            language={language}
            onChangeLanguage={setLanguage}
            onNavigate={handleNavigateScreen}
            onOpenAuthModal={() => setShowAuthModal(true)}
            showPerformanceOnly
            onBackFromPerf={() => {
              setActiveTab('menu');
              setActiveScreen('home');
            }}
          />
        );
      default:
        return (
          <HomeView
            profile={profile}
            language={language}
            upcomingBookings={upcomingBookings}
            suburbanStationCount={suburbanIndex?.stations.length ?? 396}
            suburbanRouteCount={suburbanIndex?.routes.length ?? 28}
            onNavigate={handleNavigateScreen}
            onSearchStationFromHome={(q) => {
              setStationSearchQuery(q);
              handleNavigateScreen('station-search');
            }}
            onOpenWalletTopup={() => setShowQuickTopup(true)}
            onBookAgain={handleBookAgain}
            onViewUpcomingDetails={(bk) => setHomeUpcomingTicketId(bk.id)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {activeTab === 'home' && activeScreen === 'home' && homeUpcomingTicket ? (
        <UpcomingBookingDetailsScreen
          booking={homeUpcomingTicket}
          profile={profile}
          onBack={() => setHomeUpcomingTicketId(null)}
          onBookConnecting={handleBookConnecting}
        />
      ) : activeTab === 'bookings' ? (
        <BookingsView
          bookings={bookings}
          profile={profile}
          onCancelBooking={handleCancelBooking}
          onNavigate={handleNavigateScreen}
          onBackToHome={() => handleSelectTab('home')}
          onBookAgain={handleBookAgain}
          onBookConnecting={handleBookConnecting}
        />
      ) : (
        <>
          {/* Main Content Shell */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar: Circular A/अ button, centered RailOne wordmark, Circular Notification Bell */}
            <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6">
              <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={cycleLanguage}
                    aria-label={`Switch language (current ${language.toUpperCase()})`}
                    className="h-10 w-10 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-[#0B63E5] hover:bg-slate-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                      <text
                        x="3"
                        y="14"
                        fill="#0B63E5"
                        fontSize="11.5"
                        fontWeight="700"
                        fontFamily="Plus Jakarta Sans, sans-serif"
                      >
                        A
                      </text>
                      <text
                        x="11.5"
                        y="20"
                        fill="#0B63E5"
                        fontSize="11.5"
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        अ
                      </text>
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-center select-none">
                  <span className="font-display text-[22px] tracking-tight text-[#43464B]">
                    <span className="font-normal">Rail</span>
                    <span className="font-bold text-[#2D3138]">One</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigateScreen('station-search')}
                    className="hidden md:inline-flex min-h-[36px] px-3 rounded-full bg-[#EAF4FF] text-[#0B63E5] text-xs font-semibold hover:bg-[#DCEBFF] transition-colors whitespace-nowrap shrink-0 items-center"
                  >
                    Station Search ({suburbanIndex?.stations.length ?? 396})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(true)}
                    aria-label="Open notifications"
                    className="h-10 w-10 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </header>

            {/* Main View Area */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-24">
              {renderMainContent()}
            </main>
          </div>

          {/* Fixed Solid Blue 4-Tab Bottom Navigation Bar */}
          <nav
            aria-label="Bottom Navigation"
            className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0066FF] text-white shadow-lg"
          >
            <div className="max-w-5xl mx-auto h-full grid grid-cols-4 items-center">
              {navItems.map(({ id, label, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectTab(id)}
                    className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                      active ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.75} />
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </>
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="RailOne Notifications"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-start justify-end p-4"
        >
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl mt-12">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">Notifications</h2>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl bg-[#EAF4FF] p-3">
                <p className="font-bold text-slate-900">22416 Vande Bharat Express</p>
                <p className="text-slate-600 mt-0.5">
                  Expected departure from Platform 16 at 15:00. Coach position updated.
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="font-bold text-emerald-900">3% R-Wallet Bonus Active</p>
                <p className="text-emerald-800 mt-0.5">
                  Enjoy 3% instant savings on all UTS unreserved and platform tickets.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="font-bold text-slate-900">Rail Madad Ref RM202611140842</p>
                <p className="text-slate-600 mt-0.5">
                  Your cleanliness request was marked Resolved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick R-Wallet Top-Up Modal */}
      {showQuickTopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Money to R-Wallet"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Add Money to R-Wallet
              </h2>
              <button
                type="button"
                onClick={() => setShowQuickTopup(false)}
                aria-label="Close wallet topup"
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Current Balance:{' '}
              <span className="font-mono-num font-bold text-slate-900">
                ₹ {profile.rWalletBalance.toFixed(2)}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['200', '500', '1000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuickTopupAmt(amt)}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold ${
                    quickTopupAmt === amt
                      ? 'border-[#0B63E5] bg-[#EAF4FF] text-[#0B63E5]'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  + ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={50}
              max={10000}
              value={quickTopupAmt}
              onChange={(e) => setQuickTopupAmt(e.target.value)}
              aria-label="R-Wallet top-up amount"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 font-mono-num text-sm font-bold"
            />
            <button
              type="button"
              onClick={() => {
                const v = Number(quickTopupAmt);
                if (!Number.isNaN(v) && v > 0) {
                  handleAddWalletMoney(v);
                  setShowQuickTopup(false);
                }
              }}
              className="w-full min-h-[46px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
            >
              Recharge ₹ {Number(quickTopupAmt) || 0}
            </button>
          </div>
        </div>
      )}

      {/* RailOne SSO Auth Modal */}
      {showAuthModal && (
        <AuthSSOModal
          currentName={profile.name}
          onLoginSuccess={(name, isGuest) => {
            setProfile((prev) => ({
              ...prev,
              name,
              isGuest,
            }));
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
