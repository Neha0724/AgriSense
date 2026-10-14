import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../ui/Toast';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
};
