import {
  BarChart3,
  ChevronRight,
  Globe,
  HeartHandshake,
  LogIn,
  MapPin,
  PhoneCall,
  Shield,
  TrainFront,
  Wallet,
} from 'lucide-react';
import { FREIGHT_ZONE_DATA, MONTHLY_TONNAGE_DATA } from '../data/railData';
import type { ActiveScreen, LanguageCode, UserProfile } from '../types/rail';

interface MenuViewProps {
  profile: UserProfile;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenAuthModal: () => void;
  showPerformanceOnly?: boolean;
  onBackFromPerf?: () => void;
}

export function MenuView({
  profile,
  language,
  onChangeLanguage,
  onNavigate,
  onOpenAuthModal,
  showPerformanceOnly = false,
  onBackFromPerf,
}: MenuViewProps) {
  if (showPerformanceOnly) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-8">
        <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs">
          <div className="bg-[#0B63E5] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBackFromPerf && (
                <button
                  type="button"
                  onClick={onBackFromPerf}
                  className="px-3 py-1.5 rounded-xl bg-white/15 text-xs font-semibold hover:bg-white/25"
                >
                  ← Back
                </button>
              )}
              <h1 className="font-display text-lg font-bold">Performance Dashboard</h1>
            </div>
            <span className="text-xs text-blue-100">CRIS Freight &amp; Ops</span>
          </div>

          <div className="p-5 space-y-6">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 mb-3">
                Live Statistics
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[#EEF2FF] p-3.5">
                  <p className="text-[11px] font-medium text-slate-600">Rakes on Run</p>
                  <p className="font-mono-num text-xl font-bold text-slate-900 mt-1">6610</p>
                  <p className="font-mono-num text-[11px] text-slate-500 mt-0.5">
                    L: 3958 / E: 2652
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFF3EB] p-3.5">
                  <p className="text-[11px] font-medium text-slate-600">Under Loading</p>
                  <p className="font-mono-num text-xl font-bold text-slate-900 mt-1">276</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">All Zones</p>
                </div>
                <div className="rounded-2xl bg-[#E8F8EE] p-3.5">
                  <p className="text-[11px] font-medium text-slate-600">Under Unloading</p>
                  <p className="font-mono-num text-xl font-bold text-slate-900 mt-1">501</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Active Terminals</p>
                </div>
              </div>
            </div>

            {/* Under Loading Bar Chart matching Screenshot 8 */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-display text-sm font-bold text-slate-900 text-center mb-4">
                Under Loading by Railway Zone
              </h3>
              <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 pt-4 border-b border-slate-200 px-1">
                {FREIGHT_ZONE_DATA.map((d) => {
                  const heightPct = Math.max(8, Math.round((d.val / 45) * 100));
                  return (
                    <div
                      key={d.zone}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <span className="font-mono-num text-[9px] text-slate-600 mb-1">
                        {d.val}
                      </span>
                      <div
                        className="w-full max-w-[18px] rounded-t-sm bg-[#2E7D32] group-hover:bg-[#1B5E20] transition-colors"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-1 sm:gap-2 px-1 pt-1.5">
                {FREIGHT_ZONE_DATA.map((d) => (
                  <span
                    key={d.zone}
                    className="flex-1 text-center text-[9px] font-semibold text-slate-500 truncate"
                  >
                    {d.zone}
                  </span>
                ))}
              </div>
            </div>

            {/* Today's Metrics */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-bold text-slate-900">Today&apos;s</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Consignments Booked</span>
                  <span className="font-mono-num text-base font-bold text-slate-900">144</span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Loading (in MT)</span>
                  <span className="font-mono-num text-base font-bold text-slate-900">0</span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Freight (₹ Cr)</span>
                  <span className="font-mono-num text-base font-bold text-slate-900">24</span>
                </div>
              </div>
            </div>

            {/* Monthly Loading Chart */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-display text-sm font-bold text-slate-900 text-center mb-4">
                Monthly Loading (Tonnage in MT - 12 Months)
              </h3>
              <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 h-36 pt-4 border-b border-slate-200 px-1">
                {MONTHLY_TONNAGE_DATA.map((m) => {
                  const heightPct = Math.max(15, Math.round(((m.val - 90) / 80) * 100));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                      <span className="font-mono-num text-[9px] text-slate-600 mb-1">
                        {m.val}
                      </span>
                      <div
                        className="w-full max-w-[24px] rounded-t-sm bg-[#0284C7]"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 px-1 pt-1.5">
                {MONTHLY_TONNAGE_DATA.map((m) => (
                  <span
                    key={m.month}
                    className="flex-1 text-center text-[10px] font-medium text-slate-500"
                  >
                    {m.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
          RailOne Menu &amp; Services
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          CRIS Integrated Services · Multilingual Settings &amp; Freight Dashboard
        </p>
      </div>

      {/* Language Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-[#EAF4FF] text-[#0B63E5] flex items-center justify-center">
            <Globe className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-slate-900">App Language</p>
            <p className="text-xs text-slate-500">Multilingual Indian Railways support</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {(
            [
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी' },
              { code: 'bn', label: 'বাংলা' },
            ] as const
          ).map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => onChangeLanguage(l.code)}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
                language === l.code
                  ? 'bg-white text-[#0B63E5] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu List Rows */}
      <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {[
          {
            title: 'Station Search & Suburban Network',
            subtitle: 'Search all 396 Kolkata Suburban stations, 28 corridors & ER fares',
            Icon: MapPin,
            iconBg: 'bg-blue-50 text-[#0B63E5]',
            onClick: () => onNavigate('station-search'),
          },
          {
            title: 'Performance Dashboard',
            subtitle: 'Live Freight Rakes on Run, Loading & Zone Statistics',
            Icon: BarChart3,
            iconBg: 'bg-emerald-50 text-emerald-700',
            onClick: () => onNavigate('performance-dashboard'),
          },
          {
            title: 'Search Trains & Schedule',
            subtitle: 'Look up any train timetable and halt stations',
            Icon: TrainFront,
            iconBg: 'bg-sky-50 text-[#0B63E5]',
            onClick: () => onNavigate('search-trains'),
          },
          {
            title: 'R-Wallet & Refund Tracker',
            subtitle: `Balance ₹ ${profile.rWalletBalance.toFixed(2)} · File TDR / Check Refunds`,
            Icon: Wallet,
            iconBg: 'bg-amber-50 text-amber-700',
            onClick: () => onNavigate('file-refund'),
          },
          {
            title: 'Rail Madad & Helpline 139',
            subtitle: '24x7 Security, Medical Assistance & Grievance Portal',
            Icon: HeartHandshake,
            iconBg: 'bg-rose-50 text-rose-600',
            onClick: () => onNavigate('rail-madad'),
          },
          {
            title: 'RailOne Single Sign-On (SSO)',
            subtitle: 'Sign in with MPIN, Password, Rail Connect or UTS',
            Icon: LogIn,
            iconBg: 'bg-indigo-50 text-indigo-700',
            onClick: onOpenAuthModal,
          },
        ].map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-slate-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Emergency 139 & CRIS Info */}
      <div className="rounded-2xl bg-[#E8F8EE] border border-emerald-200 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PhoneCall className="h-5 w-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-display text-sm font-bold text-emerald-900">
              139 · Integrated Railway Helpline
            </p>
            <p className="text-xs text-emerald-800">
              Security, Medical Assistance &amp; Enquiry · 24x7 Support
            </p>
          </div>
        </div>
        <Shield className="h-5 w-5 text-emerald-700 shrink-0" />
      </div>
    </div>
  );
}
