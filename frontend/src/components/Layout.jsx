import React, { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { 
  Menu, 
  Bike, 
  LayoutDashboard, 
  ClipboardList, 
  BarChart3, 
  User 
} from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Map route paths to friendly page names
  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Overview';
      case '/orders':
        return 'Orders';
      case '/statistics':
        return 'Analytics';
      case '/profile':
        return 'Profile';
      default:
        return 'Dashboard';
    }
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="app-container">
      {/* Mobile Top Navbar */}
      <header className="top-navbar">
        <button 
          className="menu-toggle" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)' }}>
          <Bike size={20} />
          <span>Uoojo Salary</span>
        </div>
        <div className="navbar-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {pageTitle}
        </div>
      </header>

      {/* Navigation Sidebar (Desktop drawer, hidden on mobile) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Mobile Backdrop overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={20} />
          <span>Orders</span>
        </NavLink>
        <NavLink to="/statistics" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Stats</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
