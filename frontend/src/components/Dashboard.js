import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import Sidebar from './Sidebar';
import RecentActivitiesCard from './RecentActivitiesCard';
import './styles.css';
import './DarkTheme.css';

// Custom Tooltip Component for dark theme
const CustomTooltip = ({ active, payload, label }) => {
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
};

const Dashboard = () => {
  // Keep existing data - NO BACKEND CHANGES
  const monthlyData = [
    { name: 'JAN', loanAmount: 42000000, target: 44000000, applications: 186, approved: 108 },
    { name: 'FEB', loanAmount: 43000000, target: 45000000, applications: 192, approved: 112 },
    { name: 'MAR', loanAmount: 44000000, target: 45000000, applications: 178, approved: 118 },
    { name: 'APR', loanAmount: 42000000, target: 44000000, applications: 165, approved: 98 },
    { name: 'MAY', loanAmount: 46000000, target: 47000000, applications: 201, approved: 125 },
    { name: 'JUN', loanAmount: 44000000, target: 45500000, applications: 189, approved: 115 },
    { name: 'JUL', loanAmount: 43500000, target: 45000000, applications: 176, approved: 110 },
    { name: 'AUG', loanAmount: 42000000, target: 43500000, applications: 182, approved: 102 },
    { name: 'SEP', loanAmount: 44000000, target: 46000000, applications: 195, approved: 120 },
    { name: 'OCT', loanAmount: 43000000, target: 45000000, applications: 168, approved: 105 },
    { name: 'NOV', loanAmount: 42000000, target: 43500000, applications: 181, approved: 108 },
    { name: 'DEC', loanAmount: 47000000, target: 48000000, applications: 212, approved: 135 },
  ];

  const agentData = [
    { name: 'Rajesh K', loanAmount: 127401610, applications: 45 },
    { name: 'Priya M', loanAmount: 119263200, applications: 42 },
    { name: 'Amit S', loanAmount: 99576880, applications: 38 },
    { name: 'Sunita R', loanAmount: 98714120, applications: 35 },
    { name: 'Vikram P', loanAmount: 96140170, applications: 32 },
  ];

  // Loan category distribution for donut chart
  const loanCategories = [
    { name: 'Home Loan', value: 42, color: '#3B82F6' },
    { name: 'Personal Loan', value: 28, color: '#10B981' },
    { name: 'Business Loan', value: 18, color: '#F59E0B' },
    { name: 'Vehicle Loan', value: 12, color: '#8B5CF6' },
  ];

  // Note: Recent activity is now handled by RecentActivitiesCard with real-time updates

  const formatCurrency = (value) => {
    return '₹' + (value / 10000000).toFixed(1) + ' Cr';
  };

  const formatCurrencyShort = (value) => {
    if (value >= 10000000) {
      return '₹' + (value / 10000000).toFixed(1) + ' Cr';
    } else if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(1) + ' L';
    }
    return '₹' + value.toLocaleString();
  };

  // Calculate stats from existing data
  const totalApplications = 2850;
  const approvedApplications = 1680;
  const approvalRate = ((approvedApplications / totalApplications) * 100).toFixed(1);
  const disbursedAmount = 541095980;
  const targetAmount = 510000000;
  const targetAchievement = ((disbursedAmount / targetAmount) * 100).toFixed(0);

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
          <div className="dark-dashboard-actions">
            <div className="dark-date-selector">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>This month</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <button className="dark-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            <button className="dark-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
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
            <div className="dark-stat-value">{totalApplications.toLocaleString()}</div>
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
            <div className="dark-stat-value">{approvalRate}%</div>
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
            <div className="dark-stat-value">{formatCurrency(disbursedAmount)}</div>
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
            <div className="dark-stat-value">{targetAchievement}%</div>
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
          {/* Revenue Chart - Large */}
          <div className="dark-chart-card">
            <div className="dark-chart-header">
              <div>
                <h3 className="dark-chart-title">Loan Disbursement Trend</h3>
                <p className="dark-chart-subtitle">Monthly disbursement vs target</p>
              </div>
              <div className="dark-chart-legend">
                <div className="dark-legend-item">
                  <span className="dark-legend-dot" style={{ background: '#3B82F6' }}></span>
                  Disbursed
                </div>
                <div className="dark-legend-item">
                  <span className="dark-legend-dot" style={{ background: '#6B7280' }}></span>
                  Target
                </div>
              </div>
            </div>
            <div className="dark-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorDisbursed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={formatCurrency} 
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="loanAmount" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDisbursed)"
                    name="Disbursed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#6B7280" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loan Distribution Donut */}
          <div className="dark-donut-card">
            <div className="dark-donut-header">
              <h3 className="dark-donut-title">Loan Distribution</h3>
              <div className="dark-icon-btn" style={{ width: '28px', height: '28px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="7 17 17 7"/>
                  <polyline points="7 7 17 7 17 17"/>
                </svg>
              </div>
            </div>
            <div className="dark-donut-content">
              <div className="dark-donut-chart-wrapper">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={loanCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {loanCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Share']}
                      contentStyle={{ 
                        background: '#1F2937', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dark-donut-legend">
                {loanCategories.map((item, index) => (
                  <div key={index} className="dark-donut-legend-item">
                    <span className="dark-donut-legend-dot" style={{ background: item.color }}></span>
                    <span className="dark-donut-legend-text">{item.name}</span>
                    <span className="dark-donut-legend-value">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              <div className="dark-metric-value">{approvedApplications.toLocaleString()}</div>
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
              <div className="dark-metric-value">{formatCurrency(targetAmount)}</div>
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
          {/* Application Status Trend */}
          <div className="dark-chart-card">
            <div className="dark-chart-header">
              <div>
                <h3 className="dark-chart-title">Application Trends</h3>
                <p className="dark-chart-subtitle">Applications vs Approvals</p>
              </div>
              <div className="dark-chart-legend">
                <div className="dark-legend-item">
                  <span className="dark-legend-dot" style={{ background: '#6B7280' }}></span>
                  Total
                </div>
                <div className="dark-legend-item">
                  <span className="dark-legend-dot" style={{ background: '#10B981' }}></span>
                  Approved
                </div>
              </div>
            </div>
            <div className="dark-chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="#6B7280" 
                    strokeWidth={2}
                    dot={{ fill: '#6B7280', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#9CA3AF' }}
                    name="Applications"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#34D399' }}
                    name="Approved"
                  />
                </LineChart>
              </ResponsiveContainer>
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

        {/* Activity & Insights Section */}
        <div className="dark-activity-grid">
          {/* Real-time Recent Activities Card */}
          <RecentActivitiesCard maxItems={8} />

          <div className="dark-activity-card">
            <div className="dark-activity-header">
              <h3 className="dark-activity-title">AI Insights</h3>
              <span className="dark-activity-action">Configure</span>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;