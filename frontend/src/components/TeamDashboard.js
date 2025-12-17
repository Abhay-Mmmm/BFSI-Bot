import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import Sidebar from './Sidebar';
import RecentActivitiesCard from './RecentActivitiesCard';
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
            {entry.name}: {typeof entry.value === 'number' && entry.value > 100000 
              ? `₹${(entry.value / 100000).toFixed(1)} L` 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

const TeamDashboard = memo(() => {
  // Memoize static data - NO BACKEND CHANGES
  const agentPerformance = useMemo(() => [
    { name: 'Mariah', sales: 12740161, leads: 45, conversion: 28, status: 'online', role: 'Senior RM' },
    { name: 'Justin', sales: 11926320, leads: 42, conversion: 25, status: 'online', role: 'Loan Officer' },
    { name: 'Bruce', sales: 9957688, leads: 38, conversion: 22, status: 'busy', role: 'Senior RM' },
    { name: 'Elton', sales: 9871412, leads: 35, conversion: 24, status: 'online', role: 'Loan Officer' },
    { name: 'Celine', sales: 9614017, leads: 32, conversion: 26, status: 'busy', role: 'Sales Lead' },
  ], []);

  const teamStatus = useMemo(() => [
    { name: 'Online', value: 8, color: '#10B981' },
    { name: 'In Call', value: 4, color: '#F59E0B' },
    { name: 'Offline', value: 2, color: '#6B7280' },
  ], []);

  // Weekly performance trend data
  const weeklyTrend = useMemo(() => [
    { day: 'Mon', leads: 32, closed: 12 },
    { day: 'Tue', leads: 45, closed: 18 },
    { day: 'Wed', leads: 38, closed: 15 },
    { day: 'Thu', leads: 52, closed: 22 },
    { day: 'Fri', leads: 48, closed: 20 },
    { day: 'Sat', leads: 25, closed: 10 },
    { day: 'Sun', leads: 12, closed: 5 },
  ], []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Debounce search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 150);

  // Memoized filtered agents - uses debounced search
  const filteredAgents = useMemo(() => {
    return agentPerformance.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agentPerformance, debouncedSearchTerm, statusFilter]);

  // Memoized currency formatter
  const formatCurrency = useCallback((value) => {
    if (value >= 10000000) {
      return '₹' + (value / 10000000).toFixed(1) + ' Cr';
    } else if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(1) + ' L';
    }
    return '₹' + value.toLocaleString();
  }, []);

  // Memoized initials getter
  const getInitials = useCallback((name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, []);

  // Memoized handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e) => {
    setStatusFilter(e.target.value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
  }, []);

  return (
    <div className="app-container dark-theme">
      <Sidebar />
      <div className="dark-dashboard">
        {/* Dashboard Header */}
        <div className="dark-dashboard-header">
          <div className="dark-dashboard-greeting">
            <h1>Team Dashboard</h1>
            <p>Monitor your team's performance and manage leads efficiently.</p>
          </div>
          <div className="dark-dashboard-actions">
            <div className="dark-search-input">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search agents..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button className="dark-icon-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
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

        {/* Team Status Cards with Gradients - Like reference order cards */}
        <div className="dark-team-status-grid">
          <div className="dark-team-status-card new-orders">
            <div className="dark-team-status-label">New Leads</div>
            <div className="dark-team-status-value">12</div>
            <div className="dark-team-status-change">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
              +2.8%
            </div>
          </div>

          <div className="dark-team-status-card pending">
            <div className="dark-team-status-label">Pending Review</div>
            <div className="dark-team-status-value">20</div>
            <div className="dark-team-status-change">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
              +2.6%
            </div>
          </div>

          <div className="dark-team-status-card in-progress">
            <div className="dark-team-status-label">In Progress</div>
            <div className="dark-team-status-value">57</div>
            <div className="dark-team-status-change">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
              +4.8%
            </div>
          </div>

          <div className="dark-team-status-card completed">
            <div className="dark-team-status-label">Completed</div>
            <div className="dark-team-status-value">98</div>
            <div className="dark-team-status-change">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              </svg>
              +1.8%
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="dark-chart-grid">
          {/* Agent Performance Chart */}
          <div className="dark-chart-card">
            <div className="dark-chart-header">
              <div>
                <h3 className="dark-chart-title">Agent Performance</h3>
                <p className="dark-chart-subtitle">Sales volume by agent</p>
              </div>
            </div>
            <div className="dark-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agentPerformance} layout="vertical" barSize={20}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis 
                    type="number" 
                    hide 
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
                  <Bar dataKey="sales" fill="#10B981" radius={[0, 8, 8, 0]} name="Sales">
                    {agentPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#8B5CF6'} 
                        opacity={1 - (index * 0.1)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Status Donut */}
          <div className="dark-donut-card">
            <div className="dark-donut-header">
              <h3 className="dark-donut-title">Team Status</h3>
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
                      data={teamStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {teamStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Agents']}
                      contentStyle={{ 
                        background: '#1F2937', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#F3F4F6" fontSize="24" fontWeight="bold">
                      14
                    </text>
                    <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fill="#9CA3AF" fontSize="11">
                      Agents
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dark-donut-legend">
                {teamStatus.map((item, index) => (
                  <div key={index} className="dark-donut-legend-item">
                    <span className="dark-donut-legend-dot" style={{ background: item.color }}></span>
                    <span className="dark-donut-legend-text">{item.name}</span>
                    <span className="dark-donut-legend-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="dark-chart-card" style={{ marginBottom: '24px' }}>
          <div className="dark-chart-header">
            <div>
              <h3 className="dark-chart-title">Weekly Lead Trend</h3>
              <p className="dark-chart-subtitle">Leads received vs closed this week</p>
            </div>
            <div className="dark-chart-legend">
              <div className="dark-legend-item">
                <span className="dark-legend-dot" style={{ background: '#3B82F6' }}></span>
                Leads
              </div>
              <div className="dark-legend-item">
                <span className="dark-legend-dot" style={{ background: '#10B981' }}></span>
                Closed
              </div>
            </div>
          </div>
          <div className="dark-chart-container" style={{ height: '180px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis 
                  dataKey="day" 
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
                  dataKey="leads" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#60A5FA' }}
                  name="Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="closed" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#34D399' }}
                  name="Closed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Activity Section */}
        <div className="dark-activity-grid" style={{ marginBottom: '24px' }}>
          <RecentActivitiesCard maxItems={6} />
          
          {/* Quick Stats Card */}
          <div className="dark-activity-card">
            <div className="dark-activity-header">
              <h3 className="dark-activity-title">Team Quick Stats</h3>
              <span className="dark-activity-action">Refresh</span>
            </div>
            <div className="dark-activity-list">
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>12 agents</strong> currently online
                  </p>
                  <span className="dark-activity-time">Active now</span>
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
                    <strong>28% conversion</strong> rate this week
                  </p>
                  <span className="dark-activity-time">+3% from last week</span>
                </div>
              </div>
              <div className="dark-activity-item">
                <div className="dark-activity-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="dark-activity-content">
                  <p className="dark-activity-text">
                    <strong>2.4 hours</strong> avg response time
                  </p>
                  <span className="dark-activity-time">-18 min from target</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Table - Like reference order list */}
        <div className="dark-agent-table-card">
          <div className="dark-table-header">
            <h3 className="dark-table-title">Agent List</h3>
            <div className="dark-table-actions">
              <div className="dark-search-input" style={{ width: 'auto' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  style={{ width: '120px' }}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={handleStatusChange}
                style={{
                  padding: '8px 12px',
                  background: 'var(--dark-bg-input)',
                  border: '1px solid var(--dark-border-primary)',
                  borderRadius: '8px',
                  color: 'var(--dark-text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
              <button style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Agent
              </button>
            </div>
          </div>

          {/* Filter chips */}
          {statusFilter !== 'all' && (
            <div className="dark-filter-chips">
              <div className="dark-filter-chip">
                {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                <span className="remove" onClick={handleClearFilters}>×</span>
              </div>
              <span style={{ color: 'var(--dark-text-muted)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={handleClearFilters}>
                Clear all
              </span>
            </div>
          )}

          <table className="dark-agent-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Role</th>
                <th>Leads</th>
                <th>Conversion</th>
                <th>Total Sales</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent, index) => (
                <tr key={index}>
                  <td>
                    <div className="dark-agent-name">
                      <div className="dark-agent-avatar" style={{
                        background: index === 0 ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' :
                                   index === 1 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                                   index === 2 ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' :
                                   index === 3 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                                   'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
                      }}>
                        {getInitials(agent.name)}
                      </div>
                      <div className="dark-agent-info">
                        <span className="name">{agent.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>{agent.role}</td>
                  <td>{agent.leads}</td>
                  <td>{agent.conversion}%</td>
                  <td style={{ fontWeight: '600', color: 'var(--dark-text-primary)' }}>
                    {formatCurrency(agent.sales)}
                  </td>
                  <td>
                    <span className={`dark-status-badge ${agent.status}`}>
                      {agent.status === 'online' ? 'Online' : agent.status === 'busy' ? 'In Call' : 'Offline'}
                    </span>
                  </td>
                  <td>
                    <div className="dark-action-btns">
                      <button className="dark-action-btn" title="View Profile">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button className="dark-action-btn" title="Send Message">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <button className="dark-action-btn" title="More Options">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                          <circle cx="5" cy="12" r="1"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderTop: '1px solid var(--dark-border-primary)'
          }}>
            <span style={{ color: 'var(--dark-text-muted)', fontSize: '0.875rem' }}>
              Showing {filteredAgents.length} of {agentPerformance.length} agents
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="dark-action-btn" style={{ padding: '6px 12px', width: 'auto' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button className="dark-action-btn" style={{ 
                padding: '6px 12px', 
                width: 'auto',
                background: 'var(--dark-accent-primary)',
                borderColor: 'var(--dark-accent-primary)',
                color: 'white'
              }}>
                1
              </button>
              <button className="dark-action-btn" style={{ padding: '6px 12px', width: 'auto' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TeamDashboard.displayName = 'TeamDashboard';

export default TeamDashboard;
