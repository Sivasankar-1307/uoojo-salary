import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart3, 
  TrendingUp, 
  CalendarDays, 
  Coins, 
  ChevronRight, 
  PieChart, 
  Activity 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { showToast } = useToast();
  const { theme } = useTheme();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load performance analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="stat-value" style={{ fontSize: '1.25rem' }}>Loading analytics dashboard...</div>
      </div>
    );
  }

  // Theme-sensitive chart styling configurations
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  // 1. Daily Earnings Chart Data Setup
  const dailyLabels = stats.dailyTrend.map(d => d.date);
  const dailyIncome = stats.dailyTrend.map(d => d.total);
  const dailySalary = stats.dailyTrend.map(d => d.salary);
  const dailyAllowance = stats.dailyTrend.map(d => d.allowance);

  const dailyChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Total Earnings',
        data: dailyIncome,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Base Salary',
        data: dailySalary,
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointStyle: 'circle',
        pointRadius: 2,
        fill: false,
      }
    ]
  };

  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 500 } }
      },
      tooltip: {
        titleFont: { family: 'Plus Jakarta Sans' },
        bodyFont: { family: 'Plus Jakarta Sans' }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  // 2. Monthly Earnings Chart Data Setup
  const monthlyLabels = stats.monthlyTrend.map(m => {
    // Convert YYYY-MM to Month Name
    const [year, month] = m.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short' }) + ' ' + year.substring(2);
  });
  const monthlySalary = stats.monthlyTrend.map(m => m.salary);
  const monthlyAllowance = stats.monthlyTrend.map(m => m.allowance);

  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Base Salary',
        data: monthlySalary,
        backgroundColor: '#4f46e5',
        borderRadius: 6,
      },
      {
        label: 'Allowances',
        data: monthlyAllowance,
        backgroundColor: '#f59e0b',
        borderRadius: 6,
      }
    ]
  };

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 500 } }
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
      },
      y: {
        stacked: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  // 3. Order Type Distribution Data Setup
  const typeLabels = stats.typeBreakdown.map(t => t.order_type);
  const typeCounts = stats.typeBreakdown.map(t => t.count);
  const typeEarnings = stats.typeBreakdown.map(t => t.totalEarnings);

  const doughnutChartData = {
    labels: typeLabels,
    datasets: [
      {
        data: typeEarnings,
        backgroundColor: typeLabels.map(label => {
          if (label === 'Long Distance') return '#f59e0b';
          if (label === 'Bonus Delivery') return '#10b981';
          return '#3b82f6';
        }),
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#0f172a' : '#fff',
      }
    ]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 500 }, padding: 15 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) label += ': ';
            label += formatCurrency(context.raw);
            return label;
          }
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Statistics</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visualize your delivery metrics and income trends.</p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="stats-summary-grid">
        {/* Today */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label">Today's Income</span>
            <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(stats.today.totalIncome)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.today.count} orders delivered</span>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: 'var(--info)', boxShadow: 'none' }}>
            <Activity size={20} />
          </div>
        </div>

        {/* Weekly */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label">Weekly Income</span>
            <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(stats.weekly.totalIncome)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.weekly.count} orders delivered</span>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: 'var(--primary)', boxShadow: 'none' }}>
            <CalendarDays size={20} />
          </div>
        </div>

        {/* Monthly */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label">Monthly Income</span>
            <span className="stat-value" style={{ fontSize: '1.5rem' }}>{formatCurrency(stats.monthly.totalIncome)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.monthly.count} orders delivered</span>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: 'var(--warning)', boxShadow: 'none' }}>
            <Coins size={20} />
          </div>
        </div>

        {/* Lifetime */}
        <div className="glass-panel stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-content">
            <span className="stat-label">Lifetime Income</span>
            <span className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{formatCurrency(stats.lifetime.totalIncome)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.lifetime.count} orders delivered</span>
          </div>
          <div className="stat-icon-wrapper" style={{ width: 42, height: 42, backgroundColor: 'var(--success)', boxShadow: 'none' }}>
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Main Row Charts */}
      <div className="charts-grid">
        {/* Daily Line Chart */}
        <div className="glass-panel chart-card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <span>Daily Earnings Trend (Active Days)</span>
          </h2>
          <div style={{ height: '280px', position: 'relative' }}>
            {stats.dailyTrend.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--text-muted)' }}>No data recorded yet</div>
            ) : (
              <Line data={dailyChartData} options={dailyChartOptions} />
            )}
          </div>
        </div>

        {/* Monthly Stacked Bar Chart */}
        <div className="glass-panel chart-card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--warning)' }} />
            <span>Monthly Salary Breakdown</span>
          </h2>
          <div style={{ height: '280px', position: 'relative' }}>
            {stats.monthlyTrend.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--text-muted)' }}>No data recorded yet</div>
            ) : (
              <Bar data={monthlyChartData} options={monthlyChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Doughnut breakdown & Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="charts-grid">
        {/* Doughnut Chart */}
        <div className="glass-panel chart-card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} style={{ color: 'var(--info)' }} />
            <span>Order Type Revenue Distribution</span>
          </h2>
          <div style={{ height: '280px', position: 'relative' }}>
            {stats.typeBreakdown.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--text-muted)' }}>No data recorded yet</div>
            ) : (
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            )}
          </div>
        </div>

        {/* Table representation for precise analytics */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={18} style={{ color: 'var(--success)' }} />
            <span>Detailed Order Type Metrics</span>
          </h2>
          {stats.typeBreakdown.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No delivery records entered.</div>
          ) : (
            <div className="table-wrapper" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order Type</th>
                    <th>Orders</th>
                    <th>Total Revenue</th>
                    <th>Avg / Order</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.typeBreakdown.map((item) => {
                    const avg = item.count > 0 ? (item.totalEarnings / item.count) : 0;
                    return (
                      <tr key={item.order_type}>
                        <td>
                          <span className={`badge ${
                            item.order_type === 'Long Distance' ? 'badge-long' : item.order_type === 'Bonus Delivery' ? 'badge-bonus' : 'badge-normal'
                          }`}>
                            {item.order_type}
                          </span>
                        </td>
                        <td>{item.count} orders</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(item.totalEarnings)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatCurrency(avg)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
