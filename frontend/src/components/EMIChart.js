import React, { memo, useMemo } from 'react';
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

// Memoized tooltip style - defined outside component
const tooltipStyle = {
  backgroundColor: '#1F2937',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  color: '#F3F4F6'
};

const EMIChart = memo(({ data }) => {
  // Memoize chart info
  const chartInfo = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }
    return {
      emi: data[0]?.emi?.toLocaleString() || 'N/A',
      monthCount: data.length
    };
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="emi-chart">No EMI data available</div>;
  }

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
        <p>Expected monthly EMI: ₹{chartInfo.emi}</p>
        <p>Showing first {chartInfo.monthCount} months breakdown</p>
      </div>
    </div>
  );
});

EMIChart.displayName = 'EMIChart';

export default EMIChart;