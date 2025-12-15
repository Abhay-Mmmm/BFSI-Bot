import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Sidebar from './Sidebar';
import './styles.css';

const Dashboard = () => {
  // Mock data for charts - BFSI specific
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

  const TEAL_COLOR = '#00bfa5';
  const SUCCESS_COLOR = '#2e7d32';
  const BLUE_COLOR = '#1b98e0';

  const formatCurrency = (value) => {
    return '₹' + (value / 10000000).toFixed(1) + ' Cr';
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content-dashboard dashboard-single-view">
        <div className="dashboard-header-compact">
          <div className="dashboard-filters">
            <div className="filter-item">
              <span>Team</span>
              <select><option>Sales Team A</option><option>Sales Team B</option></select>
            </div>
          </div>
        </div>

        <div className="kpi-row dashboard-kpi">
          <div className="kpi-card">
            <h3>2,850</h3>
            <p>Total Applications</p>
          </div>
          <div className="kpi-card">
            <h3>1,680</h3>
            <p>Approved Applications</p>
          </div>
          <div className="kpi-card">
            <h3>{formatCurrency(541095980)}</h3>
            <p>Disbursed Amount</p>
          </div>
          <div className="kpi-card">
            <h3>{formatCurrency(510000000)}</h3>
            <p>Annual Target</p>
          </div>
          <div className="kpi-card">
            <h3 style={{ color: SUCCESS_COLOR }}>106% <span className="circle-indicator" style={{ backgroundColor: SUCCESS_COLOR }}></span></h3>
            <p>Target Achievement</p>
          </div>
        </div>

        <div className="dashboard-charts-grid">
          <div className="chart-section compact-chart-main">
            <h4>Loan Disbursement vs Target</h4>
            <div className="chart-container-sm">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Bar dataKey="loanAmount" fill={BLUE_COLOR} name="Disbursed" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="target" fill="#94a3b8" name="Target" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section compact-chart-side">
            <div className="chart-header-sm">
              <h4>Application Status</h4>
              <div className="chart-legend-sm">
                <span><div style={{ width: '8px', height: '8px', backgroundColor: '#94a3b8', borderRadius: '2px', display: 'inline-block', marginRight: '4px' }}></div>Apps</span>
                <span><div style={{ width: '8px', height: '8px', backgroundColor: SUCCESS_COLOR, borderRadius: '2px', display: 'inline-block', marginRight: '4px' }}></div>Approved</span>
              </div>
            </div>
            <div className="chart-container-sm">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="approved" stroke={SUCCESS_COLOR} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section compact-chart-side">
            <h4>Top Loan Officers</h4>
            <div className="chart-container-sm">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={agentData} layout="vertical" barSize={12}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={70} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                  <Bar dataKey="loanAmount" fill={TEAL_COLOR} radius={[0, 3, 3, 0]}>
                    {agentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TEAL_COLOR} />
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

export default Dashboard;