import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CustomerInsights = ({ data = [] }) => {
  // Mock data for customer demographics
  const demographicData = [
    { name: '25-35', value: 45 },
    { name: '36-45', value: 30 },
    { name: '46-55', value: 15 },
    { name: '56+', value: 10 },
  ];

  const loanPurposeData = [
    { name: 'Home Renovation', value: 25 },
    { name: 'Education', value: 20 },
    { name: 'Business', value: 30 },
    { name: 'Medical', value: 15 },
    { name: 'Other', value: 10 },
  ];

  // Dark theme colors matching the design system
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#F3F4F6'
  };

  return (
    <div className="customer-insights">
      <h3>Customer Insights</h3>
      
      <div className="charts-container">
        <div className="chart-section">
          <h4>Customer Age Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={demographicData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8B5CF6"
                dataKey="value"
              >
                {demographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="chart-section">
          <h4>Loan Purposes</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={loanPurposeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CustomerInsights;