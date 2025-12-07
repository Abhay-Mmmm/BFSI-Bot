import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Sidebar from './Sidebar';
import './styles.css';

const TeamDashboard = () => {
  const agentPerformance = [
    { name: 'Mariah', sales: 12740161, leads: 45, conversion: 28 },
    { name: 'Justin', sales: 11926320, leads: 42, conversion: 25 },
    { name: 'Bruce', sales: 9957688, leads: 38, conversion: 22 },
    { name: 'Elton', sales: 9871412, leads: 35, conversion: 24 },
    { name: 'Celine', sales: 9614017, leads: 32, conversion: 26 },
  ];

  const teamStatus = [
    { name: 'Online', value: 8 },
    { name: 'In Call', value: 4 },
    { name: 'Offline', value: 2 },
  ];

  const COLORS = ['#00bfa5', '#ffb74d', '#ef5350'];
  const TEAL_COLOR = '#00bfa5';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content-dashboard">
        <div className="dashboard-header">
          <h2>5. Team Dashboard</h2>
          <div className="dashboard-filters">
            <div className="filter-item">
              <span>Team</span>
              <select><option>Sales Team A</option></select>
            </div>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi-card">
            <h3>14</h3>
            <p>Active Agents</p>
          </div>
          <div className="kpi-card">
            <h3>85%</h3>
            <p>Avg Utilization</p>
          </div>
          <div className="kpi-card">
            <h3>₹4.2 Cr</h3>
            <p>Total Sales (Today)</p>
          </div>
          <div className="kpi-card">
            <h3>12m</h3>
            <p>Avg Call Duration</p>
          </div>
        </div>

        <div className="bottom-row">
          <div className="chart-section half-width">
            <h4>Agent Performance (Sales Volume)</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentPerformance} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="sales" fill={TEAL_COLOR} radius={[0, 4, 4, 0]}>
                    {agentPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TEAL_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section half-width">
            <h4>Team Status</h4>
            <div className="chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {teamStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    14 Agents
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
              {teamStatus.map((entry, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index] }}></div>
                  {entry.name}: {entry.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-section full-width">
          <h4>Detailed Agent Metrics</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left', color: '#546e7a' }}>
                <th style={{ padding: '10px' }}>Agent Name</th>
                <th style={{ padding: '10px' }}>Leads Processed</th>
                <th style={{ padding: '10px' }}>Conversion Rate</th>
                <th style={{ padding: '10px' }}>Total Sales</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((agent, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '15px 10px', fontWeight: '500' }}>{agent.name}</td>
                  <td style={{ padding: '15px 10px' }}>{agent.leads}</td>
                  <td style={{ padding: '15px 10px' }}>{agent.conversion}%</td>
                  <td style={{ padding: '15px 10px' }}>₹{agent.sales.toLocaleString()}</td>
                  <td style={{ padding: '15px 10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      backgroundColor: index < 3 ? '#e0f2f1' : '#fff3e0',
                      color: index < 3 ? '#00695c' : '#ef6c00'
                    }}>
                      {index < 3 ? 'Online' : 'In Call'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
