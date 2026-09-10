"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, AlertCircle, MonitorSmartphone, Settings, Users, Building2, Menu, X, LaptopMinimal, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";
import toast from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const socket = getSocket();
      
      socket?.on('new_fault', (data) => {
        if (user.role === 'admin') {
          toast(`New fault reported: ${data.description.substring(0, 30)}...`, {
            icon: '⚠️',
          });
        }
      });

      socket?.on('update_fault', (data) => {
        if (user.role === 'user' || user.role === 'admin') {
          toast.success(`Fault #${data.id} status updated to: ${data.status}`);
        }
      });

      return () => {
        socket?.off('new_fault');
        socket?.off('update_fault');
      };
    }
  }, [user]);

  if (!user) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Fault Reports", href: "/dashboard/faults", icon: AlertCircle },
    { name: "Equipment Map", href: "/dashboard/equipment-map", icon: MonitorSmartphone },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: "Manage Equipment", href: "/dashboard/equipment", icon: Settings });
    navItems.push({ name: "Manage Labs", href: "/dashboard/labs", icon: Building2 });
    navItems.push({ name: "Manage Technicians", href: "/dashboard/technicians", icon: Users });
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-3 my-1 rounded-lg transition-colors ${
              isActive 
                ? "bg-primary text-white" 
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-xl font-bold text-primary">
            <span className="relative mr-2 inline-block h-7 w-8" aria-label="Cracked laptop logo">
              <LaptopMinimal className="h-7 w-8" strokeWidth={1.8} />
              <Zap className="absolute left-3 top-0.5 h-3 w-3 text-secondary fill-secondary" strokeWidth={2.5} />
            </span>
            SmartLab
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 p-2">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">SmartLab</h1>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
