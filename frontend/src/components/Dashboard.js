import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import Sidebar from './Sidebar';
import './styles.css';

const Dashboard = () => {
  // Mock data for charts
  const monthlyData = [
    { name: 'JAN', sales: 4200000, target: 4400000, listings: 16, newListings: 24 },
    { name: 'FEB', sales: 4300000, target: 4500000, listings: 15, newListings: 30 },
    { name: 'MAR', sales: 4400000, target: 4500000, listings: 17, newListings: 27 },
    { name: 'APR', sales: 4200000, target: 4400000, listings: 13, newListings: 17 },
    { name: 'MAI', sales: 4600000, target: 4700000, listings: 12, newListings: 22 },
    { name: 'JUN', sales: 4400000, target: 4550000, listings: 16, newListings: 18 },
    { name: 'JUL', sales: 4350000, target: 4500000, listings: 19, newListings: 21 },
    { name: 'AUG', sales: 4200000, target: 4350000, listings: 16, newListings: 25 },
    { name: 'SEP', sales: 4400000, target: 4600000, listings: 15, newListings: 24 },
    { name: 'OCT', sales: 4300000, target: 4500000, listings: 13, newListings: 25 },
    { name: 'NOV', sales: 4200000, target: 4350000, listings: 14, newListings: 20 },
    { name: 'DEC', sales: 4700000, target: 4800000, listings: 15, newListings: 18 },
  ];

  const agentData = [
    { name: 'Mariah', sales: 12740161 },
    { name: 'Justin', sales: 11926320 },
    { name: 'Bruce', sales: 9957688 },
    { name: 'Elton', sales: 9871412 },
    { name: 'Celine', sales: 9614017 },
  ];

  const TEAL_COLOR = '#00bfa5';
  const DARK_BG = '#263238';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content-dashboard">
        <div className="dashboard-header">
          <h2>4. Dashboard</h2>
          <div className="dashboard-filters">
            <div className="filter-item">
              <span>Agent</span>
              <select><option>All</option></select>
            </div>
            <div className="filter-item">
              <span>Month</span>
              <select><option>Total</option></select>
            </div>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-card">
            <h3>396</h3>
            <p># Applications</p>
          </div>
          <div className="kpi-card">
            <h3>181</h3>
            <p># Approved</p>
          </div>
          <div className="kpi-card">
            <h3>54 109 598</h3>
            <p>$ Disbursed</p>
          </div>
          <div className="kpi-card">
            <h3>51 000 000</h3>
            <p>$ Target</p>
          </div>
          <div className="kpi-card">
            <h3>106% <span className="circle-indicator"></span></h3>
            <p>Target vs. Actual $</p>
          </div>
        </div>

        <div className="chart-section full-width">
          <h4>Target vs. Actual $</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="sales" fill={TEAL_COLOR} name="$ Sales" />
                <Bar dataKey="target" fill="#546e7a" name="$ Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bottom-row">
          <div className="chart-section half-width">
            <div className="chart-header">
              <h4># Applications</h4>
              <div className="chart-legend">
                <span><input type="checkbox" /> # Applications</span>
                <span><input type="checkbox" checked readOnly /> # New</span>
                <span><input type="checkbox" checked readOnly /> # Approved</span>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="listings" stroke="#546e7a" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sales" stroke={TEAL_COLOR} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="newListings" stroke="#fbc02d" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section half-width">
            <h4>Sales by Agent</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agentData} layout="vertical" barSize={20}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="sales" fill={TEAL_COLOR}>
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