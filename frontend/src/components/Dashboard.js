import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNotification } from './NotificationProvider';
import './styles.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    approvedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
    totalDisbursed: 0,
    avgProcessingTime: 0
  });

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { addNotification } = useNotification();

  // Mock data for charts
  const monthlyData = [
    { name: 'Jan', applications: 45, approvals: 30 },
    { name: 'Feb', applications: 52, approvals: 38 },
    { name: 'Mar', applications: 48, approvals: 35 },
    { name: 'Apr', applications: 60, approvals: 42 },
    { name: 'May', applications: 55, approvals: 40 },
    { name: 'Jun', applications: 62, approvals: 48 },
  ];

  const loanPurposeData = [
    { name: 'Home Renovation', value: 25 },
    { name: 'Education', value: 20 },
    { name: 'Business', value: 30 },
    { name: 'Medical', value: 15 },
    { name: 'Other', value: 10 },
  ];

  const ageDistributionData = [
    { name: '25-35', value: 45 },
    { name: '36-45', value: 30 },
    { name: '46-55', value: 15 },
    { name: '56+', value: 10 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Mock data for initial dashboard
  useEffect(() => {
    // In a real app, this would come from an API
    const mockStats = {
      totalApplications: 42,
      approvedApplications: 28,
      pendingApplications: 10,
      rejectedApplications: 4,
      totalDisbursed: 8500000,
      avgProcessingTime: 2.4
    };

    const mockApplications = [
      {
        id: 'APP001',
        customerName: 'John Doe',
        loanAmount: '₹5,00,000',
        status: 'Approved',
        date: '2023-12-01',
        stage: 'Sanctioned'
      },
      {
        id: 'APP002',
        customerName: 'Jane Smith',
        loanAmount: '₹8,00,000',
        status: 'Pending',
        date: '2023-12-02',
        stage: 'Verification'
      },
      {
        id: 'APP003',
        customerName: 'Robert Johnson',
        loanAmount: '₹12,00,000',
        status: 'Approved',
        date: '2023-12-01',
        stage: 'Disbursed'
      },
      {
        id: 'APP004',
        customerName: 'Emily Davis',
        loanAmount: '₹6,50,000',
        status: 'Rejected',
        date: '2023-11-30',
        stage: 'Underwriting'
      },
      {
        id: 'APP005',
        customerName: 'Michael Wilson',
        loanAmount: '₹10,00,000',
        status: 'Approved',
        date: '2023-12-03',
        stage: 'Documents Submitted'
      }
    ];

    setStats(mockStats);
    setApplications(mockApplications);
    setIsLoading(false);
  }, []);

  // Status badge component
  const StatusBadge = ({ status }) => {
    let className = 'status-badge ';
    switch(status.toLowerCase()) {
      case 'approved':
        className += 'status-approved';
        break;
      case 'pending':
        className += 'status-pending';
        break;
      case 'rejected':
        className += 'status-rejected';
        break;
      default:
        className += 'status-default';
    }
    return <span className={className}>{status}</span>;
  };

  // Handler functions for button actions
  const handleNewApplication = () => {
    addNotification('New application form opened', 'info');
  };

  const handleGenerateReport = () => {
    addNotification('Report generation started. This may take a moment...', 'info', 5000);
  };

  const handleExportData = () => {
    addNotification('Data export completed successfully', 'success');
  };

  const handleViewApplication = (id) => {
    addNotification(`Viewing application ${id}`, 'info', 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Monitor loan applications, performance metrics, and customer insights</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.approvedApplications}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-rupee-sign"></i>
          </div>
          <div className="stat-info">
            <h3>₹{Math.round(stats.totalDisbursed / 100000)}L</h3>
            <p>Total Disbursed</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <h2>Monthly Applications</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="approvals" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Loan Purposes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loanPurposeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {loanPurposeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts and Data Section */}
      <div className="dashboard-content">
        <div className="dashboard-left">
          {/* Recent Applications Table */}
          <div className="data-card">
            <h2>Recent Applications</h2>
            <div className="table-controls">
              <div className="search-box">
                <input type="text" placeholder="Search applications..." />
                <i className="fas fa-search"></i>
              </div>
              <div className="filter-options">
                <select>
                  <option>All Statuses</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Customer Name</th>
                    <th>Loan Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Stage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => (
                    <tr key={index}>
                      <td>{app.id}</td>
                      <td>{app.customerName}</td>
                      <td>{app.loanAmount}</td>
                      <td><StatusBadge status={app.status} /></td>
                      <td>{app.date}</td>
                      <td>{app.stage}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleViewApplication(app.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-right">
          {/* Performance Metrics */}
          <div className="data-card">
            <h2>Performance Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-item">
                <h3>Avg. Processing Time</h3>
                <p className="metric-value">{stats.avgProcessingTime} days</p>
                <p className="metric-trend">↓ 0.3 days</p>
              </div>
              <div className="metric-item">
                <h3>Approval Rate</h3>
                <p className="metric-value">{Math.round((stats.approvedApplications / stats.totalApplications) * 100)}%</p>
                <p className="metric-trend">↑ 5%</p>
              </div>
              <div className="metric-item">
                <h3>Conversion Rate</h3>
                <p className="metric-value">67%</p>
                <p className="metric-trend">↑ 3%</p>
              </div>
              <div className="metric-item">
                <h3>Customer Satisfaction</h3>
                <p className="metric-value">4.8/5</p>
                <p className="metric-trend">↑ 0.2</p>
              </div>
            </div>
          </div>

          {/* Customer Age Distribution */}
          <div className="data-card">
            <h2>Customer Age Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageDistributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="data-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-btn" onClick={handleNewApplication}>
                <i className="fas fa-plus"></i>
                New Application
              </button>
              <button className="action-btn" onClick={handleGenerateReport}>
                <i className="fas fa-chart-bar"></i>
                Generate Report
              </button>
              <button className="action-btn" onClick={handleExportData}>
                <i className="fas fa-download"></i>
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;