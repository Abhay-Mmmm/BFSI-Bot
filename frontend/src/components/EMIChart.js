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

  return (
    <div className="emi-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="principal" fill="#3b82f6" name="Principal" />
          <Bar dataKey="interest" fill="#10b981" name="Interest" />
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