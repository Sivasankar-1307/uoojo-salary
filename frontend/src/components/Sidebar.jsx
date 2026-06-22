import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  TrendingUp, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  Bike
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { to: '/orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { to: '/statistics', label: 'Statistics', icon: <TrendingUp size={20} /> },
    { to: '/profile', label: 'Profile', icon: <User size={20} /> },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile Close Button */}
      <button 
        className="menu-toggle" 
        onClick={onClose} 
        style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'none' }}
        id="sidebar-close-btn"
      >
        <X size={24} />
      </button>

      {/* App Branding */}
      <div className="sidebar-logo">
        <Bike size={28} strokeWidth={2.5} />
        <span>Uoojo Salary</span>
      </div>

      {/* Navigation Links */}
      <nav style={{ flexGrow: 1 }}>
        <ul className="sidebar-menu">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink 
                to={item.to} 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Controls & User profile */}
      <div className="sidebar-footer">
        {/* Theme Toggle */}
        <button 
          className="sidebar-link" 
          onClick={toggleTheme}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center' }}
        >
          {theme === 'dark' ? <Sun size={20} className="text-yellow" /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Logout Link */}
        <button 
          className="sidebar-link" 
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center' }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        {/* User Snippet */}
        {user && (
          <div className="user-snippet">
            <div className="user-avatar">
              {getInitials(user.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
