import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  CheckCircle,
  History,
  RotateCcw,
  BarChart3,
  Settings,
  Truck,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { dispatchService } from '../services/api';
import logoUrl from '../assets/logo.png';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const pendingCount = dispatchService.getPendingPIs().length;
  const todaysCount = dispatchService.getTodaysDispatches().length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'pending-pi',
      label: 'Pending PI',
      path: '/pending-pi',
      icon: FileSpreadsheet,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
    {
      id: 'dispatch-planning',
      label: 'Dispatch Planning',
      path: '/dispatch-planning',
      icon: Layers,
      badge: 'Action',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      id: 'todays-planning',
      label: "Today's Planning",
      path: '/todays-planning',
      icon: Clock,
      badge: todaysCount > 0 ? String(todaysCount) : undefined,
      badgeColor: 'bg-blue-600 text-white font-bold',
    },
    {
      id: 'upcoming-planning',
      label: 'Upcoming Planning',
      path: '/upcoming-planning',
      icon: CalendarDays,
      badge: undefined,
    },
    {
      id: 'completed-dispatch',
      label: 'Completed Dispatch',
      path: '/completed-dispatch',
      icon: CheckCircle,
      badge: undefined,
    },
    {
      id: 'dispatch-history',
      label: 'Dispatch History',
      path: '/dispatch-history',
      icon: History,
      badge: undefined,
    },
    {
      id: 'rollback',
      label: 'Rollback & Revert',
      path: '/rollback',
      icon: RotateCcw,
      badge: 'Audit',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      badge: undefined,
    },
    {
      id: 'settings',
      label: 'System & Masters',
      path: '/settings',
      icon: Settings,
      badge: undefined,
    },
  ];

  return (
    <aside className="w-64 bg-[#181309] text-slate-200 flex flex-col shrink-0 border-r border-[#2d2516] select-none h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2d2516] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center p-0.5 shadow-sm">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[13px] font-black tracking-tight text-white uppercase font-sans leading-tight">
              DISPATCH PLANNING
            </h1>
            <p className="text-[10px] text-[#cca352] font-semibold tracking-wider uppercase">
              LOGISTICS ERP v3.2
            </p>
          </div>
        </div>
      </div>

      {/* Facility & Shift Widget */}
      <div className="mx-3 my-2.5 p-2.5 rounded-lg bg-[#221c10] border border-[#382f1b] text-xs">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-[#a89574] font-medium">Bhiwandi Central Hub</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live
          </span>
        </div>
        <div className="text-[10px] text-[#cca352] font-mono flex items-center justify-between">
          <span>Shift A (08:00 - 20:00)</span>
          <span className="text-slate-400">Bay 1-8 Active</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8f7e61]">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#F4B400] text-[#181309] font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-[#282114] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#181309]' : 'text-[#a89574]'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#2d2516] bg-[#140f07] text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            ERP Server Connected
          </span>
          <span className="text-[10px] text-slate-500 font-mono">18ms</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Dispatch Planning &copy; 2026. All rights reserved.
        </div>
      </div>
    </aside>
  );
};
