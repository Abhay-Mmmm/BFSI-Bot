import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const EMIChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="emi-chart">No EMI data available</div>;
  }

  const tooltipStyle = {
    backgroundColor: '#1F2937',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    color: '#F3F4F6'
  };

  return (
    <div className="emi-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F3F4F6' }} />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Bar dataKey="principal" fill="#3B82F6" name="Principal" radius={[4, 4, 0, 0]} />
          <Bar dataKey="interest" fill="#10B981" name="Interest" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-info">
        <p>Expected monthly EMI: ₹{data[0]?.emi?.toLocaleString() || 'N/A'}</p>
        <p>Showing first {data.length} months breakdown</p>
      </div>
    </div>
  );
};

export default EMIChart;