import React, { memo, useMemo, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Sidebar from './Sidebar';
import RecentActivitiesCard from './RecentActivitiesCard';
import PotentialCustomersCard from './PotentialCustomersCard';
import './styles.css';
import './DarkTheme.css';

// Memoized Custom Tooltip Component for dark theme
const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="dark-chart-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="value" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000000 
              ? `₹${(entry.value / 10000000).toFixed(2)} Cr` 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const Dashboard = () => {
  // Memoize static data - NO BACKEND CHANGES
  const agentData = useMemo(() => [
    { name: 'Rajesh K', loanAmount: 127401610, applications: 45 },
    { name: 'Priya M', loanAmount: 119263200, applications: 42 },
    { name: 'Amit S', loanAmount: 99576880, applications: 38 },
    { name: 'Sunita R', loanAmount: 98714120, applications: 35 },
    { name: 'Vikram P', loanAmount: 96140170, applications: 32 },
  ], []);

  // Note: Recent activity is now handled by RecentActivitiesCard with real-time updates

  const formatCurrency = useCallback((value) => {
    return '₹' + (value / 10000000).toFixed(1) + ' Cr';
  }, []);

  const formatCurrencyShort = useCallback((value) => {
    if (value >= 10000000) {
      return '₹' + (value / 10000000).toFixed(1) + ' Cr';
    } else if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(1) + ' L';
    }
    return '₹' + value.toLocaleString();
  }, []);

  // Memoize calculated stats
  const stats = useMemo(() => {
    const totalApplications = 2850;
    const approvedApplications = 1680;
    const approvalRate = ((approvedApplications / totalApplications) * 100).toFixed(1);
    const disbursedAmount = 541095980;
    const targetAmount = 510000000;
    const targetAchievement = ((disbursedAmount / targetAmount) * 100).toFixed(0);
    
    return {
      totalApplications,
      approvedApplications,
      approvalRate,
      disbursedAmount,
      targetAmount,
      targetAchievement
    };
  }, []);

  return (
    <div className="app-container dark-theme">
      <Sidebar />
      <div className="dark-dashboard">
        {/* Dashboard Header */}
        <div className="dark-dashboard-header">
          <div className="dark-dashboard-greeting">
            <h1>
              Welcome back! 👋
            </h1>
            <p>Here's what's happening with your loan portfolio today.</p>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="dark-kpi-grid">
          <div className="dark-stat-card">
            <div className="dark-stat-header">
              <span className="dark-stat-label">Total Applications</span>
              <div className="dark-stat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
            </div>
            <div className="dark-stat-value">{stats.totalApplications.toLocaleString()}</div>
            <div className="dark-stat-footer">
              <span className="dark-stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
                +12.5%
              </span>
              <span className="dark-stat-period">vs last month</span>
            </div>
          </div>

          <div className="dark-stat-card">
            <div className="dark-stat-header">
              <span className="dark-stat-label">Approval Rate</span>
              <div className="dark-stat-icon success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
            </div>
            <div className="dark-stat-value">{stats.approvalRate}%</div>
            <div className="dark-stat-footer">
              <span className="dark-stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
                +2.3%
              </span>
              <span className="dark-stat-period">vs last month</span>
            </div>
          </div>

          <div className="dark-stat-card">
            <div className="dark-stat-header">
              <span className="dark-stat-label">Disbursed Amount</span>
              <div className="dark-stat-icon purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
            </div>
            <div className="dark-stat-value">{formatCurrency(stats.disbursedAmount)}</div>
            <div className="dark-stat-footer">
              <span className="dark-stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
                +8.7%
              </span>
              <span className="dark-stat-period">vs last month</span>
            </div>
          </div>

          <div className="dark-stat-card">
            <div className="dark-stat-header">
              <span className="dark-stat-label">Target Achievement</span>
              <div className="dark-stat-icon warning">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="6"/>
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
            </div>
            <div className="dark-stat-value">{stats.targetAchievement}%</div>
            <div className="dark-stat-footer">
              <span className="dark-stat-change positive">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
                +6%
              </span>
              <span className="dark-stat-period">above target</span>
            </div>
          </div>
        </div>

        {/* Main Charts Row */}
        <div className="dark-chart-grid">
          {/* Real-time Recent Activities Card - Moved here */}
          <RecentActivitiesCard maxItems={8} />

          {/* Potential Customers Card */}
          <PotentialCustomersCard maxItems={5} />
        </div>

        {/* Secondary Metrics Row */}
        <div className="dark-metrics-grid">
          <div className="dark-metric-card">
            <div className="dark-metric-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="dark-metric-content">
              <div className="dark-metric-value">{stats.approvedApplications.toLocaleString()}</div>
              <div className="dark-metric-label">Approved Applications</div>
              <div className="dark-metric-subtext">+156 this week</div>
            </div>
          </div>

          <div className="dark-metric-card">
            <div className="dark-metric-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="dark-metric-content">
              <div className="dark-metric-value">{formatCurrency(stats.targetAmount)}</div>
              <div className="dark-metric-label">Annual Target</div>
              <div className="dark-metric-subtext">Q4 in progress</div>
            </div>
          </div>

          <div className="dark-metric-card">
            <div className="dark-metric-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="dark-metric-content">
              <div className="dark-metric-value">3.2 days</div>
              <div className="dark-metric-label">Avg Processing Time</div>
              <div className="dark-metric-subtext">-0.5 days vs last month</div>
            </div>
          </div>
        </div>

        {/* Bottom Charts Row */}
        <div className="dark-chart-grid">
          {/* AI Insights - Moved up */}
          <div className="dark-activity-card">
            <div className="dark-activity-header">
              <h3 className="dark-activity-title">AI Insights</h3>
            </div>
            <div className="dark-activity-list">
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>Portfolio health is excellent</strong> - 98.2% on-time payments
                  </p>
                  <span className="dark-activity-time">Updated just now</span>
                </div>
              </div>
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>12 applications</strong> awaiting document verification
                  </p>
                  <span className="dark-activity-time">Action recommended</span>
                </div>
              </div>
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>Home loan segment</strong> shows 15% growth potential
                  </p>
                  <span className="dark-activity-time">Market analysis</span>
                </div>
              </div>
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>Q4 target</strong> on track for 108% achievement
                  </p>
                  <span className="dark-activity-time">Forecast updated</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Loan Officers */}
          <div className="dark-chart-card">
            <div className="dark-chart-header">
              <div>
                <h3 className="dark-chart-title">Top Loan Officers</h3>
                <p className="dark-chart-subtitle">By disbursement volume</p>
              </div>
            </div>
            <div className="dark-chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={agentData} layout="vertical" barSize={16}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    type="number" 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={formatCurrencyShort} 
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={70} 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="loanAmount" fill="#10B981" radius={[0, 6, 6, 0]} name="Amount">
                    {agentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#3B82F6' : '#10B981'} 
                        opacity={1 - (index * 0.12)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);