import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Wallet, 
  Gift, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  TrendingDown,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats and recent 5 orders concurrently
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/stats'),
        api.get('/orders?limit=5&page=1')
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders);
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stat-value" style={{ fontSize: '1.25rem' }}>Loading summary dashboard...</div>
      </div>
    );
  }

  // Fallbacks if no data
  const lifetime = stats?.lifetime || { count: 0, totalSalary: 0, totalAllowance: 0, totalIncome: 0 };
  const today = stats?.today || { count: 0, totalSalary: 0, totalAllowance: 0, totalIncome: 0 };
  const weekly = stats?.weekly || { count: 0, totalSalary: 0, totalAllowance: 0, totalIncome: 0 };
  const monthly = stats?.monthly || { count: 0, totalSalary: 0, totalAllowance: 0, totalIncome: 0 };
  const typeBreakdown = stats?.typeBreakdown || [];

  return (
    <div>
      {/* Header welcome banner */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Hello, {user?.name}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here is your delivery performance and salary summary.</p>
        </div>
        <div className="page-actions">
          <Link to="/orders?add=true" className="btn btn-primary">
            <Plus size={18} />
            <span>Add Record</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid">
        {/* Total Orders Card */}
        <div className="glass-panel stat-card stat-orders">
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{lifetime.count}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <strong>{today.count}</strong> today • <strong>{weekly.count}</strong> this week
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Total Salary Card */}
        <div className="glass-panel stat-card stat-salary">
          <div className="stat-content">
            <span className="stat-label">Salary Earned</span>
            <span className="stat-value">{formatCurrency(lifetime.totalSalary)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Base delivery earnings
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <Wallet size={24} />
          </div>
        </div>

        {/* Total Allowance Card */}
        <div className="glass-panel stat-card stat-allowance">
          <div className="stat-content">
            <span className="stat-label">Allowances</span>
            <span className="stat-value">{formatCurrency(lifetime.totalAllowance)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Fuel, distance & bonus incentives
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <Gift size={24} />
          </div>
        </div>

        {/* Grand Total Income Card */}
        <div className="glass-panel stat-card stat-total">
          <div className="stat-content">
            <span className="stat-label">Grand Total Income</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              {formatCurrency(lifetime.totalIncome)}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Salary + Allowance combined
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Main Row: Order Type Breakdown & Recent Activity */}
      <div className="dashboard-sections-grid">
        
        {/* Order Type breakdown panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <span>Earnings by Order Type</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, justifyContent: 'center' }}>
            {typeBreakdown.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data entered yet.</p>
            ) : (
              typeBreakdown.map((item) => {
                const percentage = lifetime.totalIncome > 0 
                  ? Math.round((item.totalEarnings / lifetime.totalIncome) * 100) 
                  : 0;

                const getBadgeClass = (type) => {
                  if (type === 'Long Distance') return 'badge-long';
                  if (type === 'Bonus Delivery') return 'badge-bonus';
                  return 'badge-normal';
                };

                return (
                  <div key={item.order_type} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                      <span className={`badge ${getBadgeClass(item.order_type)}`}>
                        {item.order_type}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                        {formatCurrency(item.totalEarnings)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{item.count} orders</span>
                      <span>{percentage}% of total</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${percentage}%`, 
                          backgroundColor: item.order_type === 'Long Distance' ? 'var(--warning)' : item.order_type === 'Bonus Delivery' ? 'var(--success)' : 'var(--info)',
                          borderRadius: '3px' 
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders activity table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} />
              <span>Recent Delivery Records</span>
            </h2>
            <Link to="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't recorded any deliveries yet.</p>
              <Link to="/orders?add=true" className="btn btn-secondary btn-sm">Add Your First Record</Link>
            </div>
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="desktop-only">
                <div className="table-wrapper" style={{ marginTop: 0 }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Earnings</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => {
                        const getBadgeClass = (type) => {
                          if (type === 'Long Distance') return 'badge-long';
                          if (type === 'Bonus Delivery') return 'badge-bonus';
                          return 'badge-normal';
                        };
                        return (
                          <tr key={order.id}>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'none', padding: '1.1rem 1rem' }}>
                              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                              <span>{order.date}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                                <span>{order.location}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getBadgeClass(order.order_type)}`}>
                                {order.order_type}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Sal: {formatCurrency(order.salary)}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                All: {formatCurrency(order.allowance)}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
                              {formatCurrency(order.salary + order.allowance)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View Card List */}
              <div className="mobile-only">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {recentOrders.map((order) => {
                    const getBadgeClass = (type) => {
                      if (type === 'Long Distance') return 'badge-long';
                      if (type === 'Bonus Delivery') return 'badge-bonus';
                      return 'badge-normal';
                    };
                    return (
                      <div key={order.id} className="record-card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {order.location}
                          </span>
                          <span className={`badge ${getBadgeClass(order.order_type)}`}>
                            {order.order_type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>{order.date}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                            {formatCurrency(order.salary + order.allowance)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
