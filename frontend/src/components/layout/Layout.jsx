import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useSocket } from '../../context/SocketContext';
import { Bell } from 'lucide-react';

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { recentNotification, setRecentNotification } = useSocket();

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 dark:bg-navy-950 overflow-hidden">
      <Navbar onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

      {/* Floating Notification Toast */}
      {recentNotification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-start space-x-3 rounded-xl bg-white p-4 shadow-2xl border border-primary-200 dark:bg-navy-900 dark:border-primary-800 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-300 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-semibold text-slate-900 dark:text-white">
              {recentNotification.title}
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
              {recentNotification.message}
            </p>
          </div>
          <button
            onClick={() => setRecentNotification(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isMobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

