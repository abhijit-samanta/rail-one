import { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  Fingerprint,
  KeyRound,
  LogIn,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { computeProfileCompletion } from '../utils/railLogic';
import type { SavedPassenger, UserProfile, WalletTransaction } from '../types/rail';

interface YouViewProps {
  profile: UserProfile;
  savedPassengers: SavedPassenger[];
  walletTransactions: WalletTransaction[];
  onUpdateProfile: (next: UserProfile) => void;
  onAddWalletMoney: (amount: number) => void;
  onSavePassenger: (pax: SavedPassenger) => void;
  onDeletePassenger: (id: string) => void;
  onOpenAuthModal: () => void;
}

export function YouView({
  profile,
  savedPassengers,
  walletTransactions,
  onUpdateProfile,
  onAddWalletMoney,
  onSavePassenger,
  onDeletePassenger,
  onOpenAuthModal,
}: YouViewProps) {
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [showProfileDetails, setShowProfileDetails] = useState<'view' | 'edit' | null>(null);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [showPassbook, setShowPassbook] = useState(false);
  const [showPaxModal, setShowPaxModal] = useState<SavedPassenger | 'new' | null>(null);
  const [paxForm, setPaxForm] = useState<SavedPassenger>({
    id: '',
    name: '',
    age: 28,
    gender: 'M',
    berthPref: 'LB',
    mealPref: 'Veg',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordMsg, setNewPasswordMsg] = useState<string | null>(null);
  const [walletRefreshing, setWalletRefreshing] = useState(false);

  const completionPct = computeProfileCompletion(profile);

  const handleOpenNewPax = () => {
    setPaxForm({
      id: `pax-${Date.now()}`,
      name: '',
      age: 28,
      gender: 'M',
      berthPref: 'LB',
      mealPref: 'Veg',
    });
    setShowPaxModal('new');
  };

  const handleOpenEditPax = (p: SavedPassenger) => {
    setPaxForm({ ...p });
    setShowPaxModal(p);
  };

  const handleSavePaxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paxForm.name.trim() || paxForm.age < 1 || paxForm.age > 120) return;
    onSavePassenger({ ...paxForm, name: paxForm.name.trim() });
    setShowPaxModal(null);
  };

  const handleRefreshWallet = () => {
    setWalletRefreshing(true);
    setTimeout(() => setWalletRefreshing(false), 450);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Top Profile Banner matching Screenshot 6 */}
      <div className="rounded-3xl bg-gradient-to-b from-[#DFF0FF] via-[#EEF7FF] to-white border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-[#B9D8F8] text-[#0B63E5] flex items-center justify-center shadow-inner mb-3">
            <User className="h-10 w-10" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">{profile.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold text-[#0B63E5]">
            <button
              type="button"
              onClick={() => setShowProfileDetails('view')}
              className="inline-flex items-center gap-1 hover:underline min-h-[32px]"
            >
              <Eye className="h-3.5 w-3.5" /> View Details
            </button>
            <span className="text-slate-300" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={() => {
                setEditName(profile.name);
                setEditEmail(profile.email);
                setShowProfileDetails('edit');
              }}
              className="inline-flex items-center gap-1 hover:underline min-h-[32px]"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Details
            </button>
          </div>
        </div>

        {/* R-Wallet Card (Screenshot 6) */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-[#EAF4FF] text-[#0B63E5] flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <button
                type="button"
                onClick={() => setShowPassbook(true)}
                className="text-xs font-medium text-slate-500 hover:text-[#0B63E5] flex items-center gap-1"
              >
                R-Wallet · Passbook
              </button>
              <p className="font-mono-num text-xl font-bold text-slate-900">
                ₹ {profile.rWalletBalance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshWallet}
              aria-label="Refresh R-Wallet balance"
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#0B63E5]"
            >
              <RefreshCw className={`h-4 w-4 ${walletRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowAddMoney(true)}
              className="min-h-[40px] px-4 rounded-full bg-[#0B63E5] text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-[#0952C2] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Profile Complete Progress Bar */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Profile Complete</span>
            <span className="font-mono-num text-emerald-700">{completionPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Authenticate with Aadhaar */}
        <button
          type="button"
          onClick={() =>
            onUpdateProfile({
              ...profile,
              aadhaarVerified: true,
            })
          }
          className="w-full min-h-[46px] rounded-2xl bg-[#EEF5FF] border border-blue-200 px-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#0B63E5] hover:bg-[#E1EEFF] transition-colors"
        >
          <ShieldCheck className="h-4 w-4" />
          {profile.aadhaarVerified ? 'Aadhaar Authenticated ✓' : 'Authenticate with Aadhaar'}
        </button>

        {/* Saved Passengers Card */}
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="bg-[#FFF4DF] px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900">Saved Passengers</h2>
              <p className="text-[11px] text-slate-600">Add / Edit Passenger Info</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewPax}
              className="min-h-[36px] px-3.5 rounded-full bg-[#F59E0B] text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-[#D97706] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {savedPassengers.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">
                No saved passengers yet. Add co-passengers for 1-tap booking.
              </p>
            ) : (
              savedPassengers.map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.age} Y, {p.gender}, {p.berthPref} | {p.mealPref}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPax(p)}
                      aria-label={`Edit ${p.name}`}
                      className="h-9 w-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePassenger(p.id)}
                      aria-label={`Delete ${p.name}`}
                      className="h-9 w-9 rounded-xl hover:bg-rose-50 flex items-center justify-center text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom 3 Pastel Action Tiles (Screenshot 6) */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setNewPasswordMsg(null);
              setShowPasswordModal(true);
            }}
            className="rounded-2xl bg-[#E3F2FD] hover:bg-[#D4EAFB] p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors min-h-[104px]"
          >
            <KeyRound className="h-6 w-6 text-[#0B63E5]" />
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              Change Password
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowProfileDetails('view')}
            className="rounded-2xl bg-[#E6F7EC] hover:bg-[#D5F2DF] p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors min-h-[104px]"
          >
            <UserCheck className="h-6 w-6 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              My Account
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateProfile({
                ...profile,
                biometricEnabled: !profile.biometricEnabled,
              })
            }
            role="switch"
            aria-checked={profile.biometricEnabled}
            className="rounded-2xl bg-[#FDECF0] hover:bg-[#FADCE4] p-4 flex flex-col items-center justify-center gap-2 text-center transition-colors min-h-[104px]"
          >
            <div className="flex items-center gap-1.5">
              <Fingerprint className="h-5 w-5 text-rose-600" />
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  profile.biometricEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-600 text-white'
                }`}
              >
                {profile.biometricEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              Biometric
            </span>
          </button>
        </div>

        {/* Single Sign-On Login Screen Launcher */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="w-full min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <LogIn className="h-4 w-4 text-[#0B63E5]" />
          Switch Account / RailOne SSO Login (Rail Connect &amp; UTS)
        </button>
      </div>

      {/* Add Money to R-Wallet Modal */}
      {showAddMoney && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Money to R-Wallet"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Top Up R-Wallet
              </h2>
              <button
                type="button"
                onClick={() => setShowAddMoney(false)}
                aria-label="Close R-Wallet modal"
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
                  onClick={() => setTopupAmount(amt)}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold ${
                    topupAmount === amt
                      ? 'border-[#0B63E5] bg-[#EAF4FF] text-[#0B63E5]'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  + ₹{amt}
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="wallet-amt" className="block text-xs font-medium text-slate-600 mb-1">
                Custom Amount (₹)
              </label>
              <input
                id="wallet-amt"
                type="number"
                min={50}
                max={10000}
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 font-mono-num text-sm font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const val = Number(topupAmount);
                if (!Number.isNaN(val) && val > 0) {
                  onAddWalletMoney(val);
                  setShowAddMoney(false);
                }
              }}
              className="w-full min-h-[46px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
            >
              Add ₹ {Number(topupAmount) || 0} via UPI
            </button>
          </div>
        </div>
      )}

      {/* Passbook Modal */}
      {showPassbook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="R-Wallet Passbook"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                R-Wallet Passbook
              </h2>
              <button
                type="button"
                onClick={() => setShowPassbook(false)}
                aria-label="Close passbook"
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {walletTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{tx.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {tx.date} · {tx.refId}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num text-xs font-bold shrink-0 ${
                      tx.type === 'credit' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'} ₹ {tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View / Edit Profile Modal */}
      {showProfileDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Details"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                {showProfileDetails === 'edit' ? 'Edit Account Details' : 'My Account Details'}
              </h2>
              <button
                type="button"
                onClick={() => setShowProfileDetails(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {showProfileDetails === 'view' ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-semibold text-slate-900">{profile.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">RailOne ID</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    {profile.userId}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mobile Number</span>
                  <span className="font-mono-num font-semibold text-slate-900">
                    +91 {profile.mobile}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900">
                    {profile.email} {profile.emailVerified ? '(Verified)' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onUpdateProfile({
                    ...profile,
                    name: profile.nameEditedOnce ? profile.name : editName.trim() || profile.name,
                    nameEditedOnce:
                      profile.nameEditedOnce || editName.trim() !== profile.name,
                    email: editEmail.trim() || profile.email,
                    emailVerified: true,
                  });
                  setShowProfileDetails(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="prof-name" className="block text-xs font-medium text-slate-600 mb-1">
                    Name {profile.nameEditedOnce ? '(Already edited once)' : '(Can be edited once)'}
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    disabled={profile.nameEditedOnce}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="prof-email" className="block text-xs font-medium text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
                >
                  Save Details
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Saved Passenger Modal */}
      {showPaxModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Saved Passenger Form"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSavePaxSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-display text-base font-bold text-slate-900">
                {showPaxModal === 'new' ? 'Add Saved Passenger' : 'Edit Passenger'}
              </h2>
              <button
                type="button"
                onClick={() => setShowPaxModal(null)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="sp-name" className="block text-xs font-medium text-slate-600 mb-1">
                Passenger Full Name
              </label>
              <input
                id="sp-name"
                type="text"
                required
                value={paxForm.name}
                onChange={(e) => setPaxForm({ ...paxForm, name: e.target.value })}
                className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sp-age" className="block text-xs font-medium text-slate-600 mb-1">
                  Age
                </label>
                <input
                  id="sp-age"
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={paxForm.age}
                  onChange={(e) => setPaxForm({ ...paxForm, age: Number(e.target.value) })}
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="sp-gender" className="block text-xs font-medium text-slate-600 mb-1">
                  Gender
                </label>
                <select
                  id="sp-gender"
                  value={paxForm.gender}
                  onChange={(e) =>
                    setPaxForm({ ...paxForm, gender: e.target.value as 'M' | 'F' | 'T' })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="T">Transgender</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sp-berth" className="block text-xs font-medium text-slate-600 mb-1">
                  Berth Preference
                </label>
                <select
                  id="sp-berth"
                  value={paxForm.berthPref}
                  onChange={(e) =>
                    setPaxForm({
                      ...paxForm,
                      berthPref: e.target.value as SavedPassenger['berthPref'],
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="LB">Lower Berth (LB)</option>
                  <option value="MB">Middle Berth (MB)</option>
                  <option value="UB">Upper Berth (UB)</option>
                  <option value="SL">Side Lower (SL)</option>
                  <option value="WS">Window Side (WS)</option>
                </select>
              </div>
              <div>
                <label htmlFor="sp-meal" className="block text-xs font-medium text-slate-600 mb-1">
                  Meal Preference
                </label>
                <select
                  id="sp-meal"
                  value={paxForm.mealPref}
                  onChange={(e) =>
                    setPaxForm({
                      ...paxForm,
                      mealPref: e.target.value as SavedPassenger['mealPref'],
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="No Food">No Food</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
            >
              Save Passenger
            </button>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Change Password"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Change RailOne Password
              </h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="password"
              placeholder="Current Password / MPIN"
              aria-label="Current Password"
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input
              type="password"
              placeholder="New Password"
              aria-label="New Password"
              className="w-full min-h-[42px] rounded-xl border border-slate-200 px-3 text-sm"
            />
            {newPasswordMsg && (
              <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {newPasswordMsg}
              </p>
            )}
            <button
              type="button"
              onClick={() => setNewPasswordMsg('SSO password & MPIN updated securely.')}
              className="w-full min-h-[44px] rounded-xl bg-[#0B63E5] text-white text-sm font-bold hover:bg-[#0952C2]"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
