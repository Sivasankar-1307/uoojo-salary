import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          height: '100vh', 
          width: '100vw', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'var(--bg-app)', 
          color: 'var(--text-heading)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="user-avatar" style={{ margin: '0 auto 1rem auto', animation: 'spin 2s linear infinite' }}>U</div>
          <p>Loading Uoojo Salary...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
