import React, { useState } from 'react';

const LoanStatus = ({ status }) => {
  const [viewMode, setViewMode] = useState('quick'); // 'quick' or 'detailed'

  if (!status) {
    return <div className="loan-status">No loan application data available</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'conditional': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'under_review': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  // Calculate breakdown values
  const loanAmount = status.loan_amount || 0;
  const interestRate = status.interest_rate || 10.5;
  const tenureMonths = status.tenure_months || 60;
  const emi = status.emi_amount || Math.round((loanAmount * (interestRate/100/12) * Math.pow(1 + (interestRate/100/12), tenureMonths)) / (Math.pow(1 + (interestRate/100/12), tenureMonths) - 1));
  
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - loanAmount;
  const processingFee = Math.round(loanAmount * 0.005); // 0.5%
  const gst = Math.round(processingFee * 0.18); // 18% GST
  const totalCost = totalPayable + processingFee + gst;

  // Generate amortization schedule for detailed view
  const generateAmortization = () => {
    const schedule = [];
    let balance = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    
    const milestones = [1, 12, 24, 36, 48, tenureMonths];
    
    milestones.forEach(month => {
      if (month <= tenureMonths) {
        const interestPaid = balance * monthlyRate;
        const principalPaid = emi - interestPaid;
        balance = balance - principalPaid;
        
        schedule.push({
          month,
          emi,
          principal: Math.round(principalPaid),
          interest: Math.round(interestPaid),
          balance: Math.max(0, Math.round(balance))
        });
      }
    });
    
    return schedule;
  };

  return (
    <div className="loan-status" style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
      <div className="status-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Loan Breakdown</h3>
          <div className="status-badge" style={{ 
            backgroundColor: getStatusColor(status.decision),
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            textTransform: 'uppercase'
          }}>
            {status.decision || 'pending'}
          </div>
        </div>
        
        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => setViewMode('quick')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: viewMode === 'quick' ? '#00bfa5' : '#fff',
              color: viewMode === 'quick' ? '#fff' : '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📊 Quick View
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: viewMode === 'detailed' ? '#00bfa5' : '#fff',
              color: viewMode === 'detailed' ? '#fff' : '#666',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📝 Detailed View
          </button>
        </div>
      </div>
      
      {viewMode === 'quick' ? (
        /* Quick View */
        <div className="quick-view">
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Monthly EMI</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00bfa5' }}>₹{emi.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>for {tenureMonths} months</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>Loan Amount</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>₹{loanAmount.toLocaleString()}</div>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>Interest Rate</div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{interestRate}%</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff5e6', padding: '12px', borderRadius: '8px', border: '1px solid #ffe4b3' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Cost Breakdown</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px' }}>Principal</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{loanAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px' }}>Interest Payable</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#ff9800' }}>₹{totalInterest.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px' }}>Processing Fee</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{processingFee.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #ffe4b3' }}>
              <span style={{ fontSize: '13px' }}>GST (18%)</span>
              <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{gst.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Total Payable</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#00bfa5' }}>₹{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', fontSize: '12px', color: '#1976d2' }}>
            💡 <strong>Tip:</strong> Paying ₹500 extra monthly can save you ~₹{Math.round(totalInterest * 0.15).toLocaleString()} in interest
          </div>
        </div>
      ) : (
        /* Detailed View */
        <div className="detailed-view">
          {/* Cost Summary */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Cost Summary</h4>
            <table style={{ width: '100%', fontSize: '13px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666' }}>Loan Amount (Principal)</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{loanAmount.toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666' }}>Total Interest ({interestRate}% for {tenureMonths}mo)</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: '#ff9800' }}>₹{totalInterest.toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666' }}>
                    Processing Fee (0.5%)
                    <div style={{ fontSize: '11px', color: '#999' }}>One-time bank charge</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{processingFee.toLocaleString()}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px 0', color: '#666' }}>GST on Processing Fee (18%)</td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{gst.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 0 0 0', fontWeight: 'bold', fontSize: '15px' }}>Total Amount Payable</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#00bfa5', paddingTop: '12px' }}>₹{totalCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amortization Schedule */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>EMI Breakdown Over Time</h4>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
              See how your EMI is split between principal and interest
            </div>
            <table style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: '#666' }}>Month</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#666' }}>Principal</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#666' }}>Interest</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: '#666' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {generateAmortization().map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px' }}>{row.month}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#00bfa5', fontWeight: '500' }}>₹{row.principal.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#ff9800', fontWeight: '500' }}>₹{row.interest.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>₹{row.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanation */}
          <div style={{ backgroundColor: '#f0f7ff', padding: '14px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', color: '#1976d2' }}>
            <strong>📝 What This Means:</strong><br/>
            You borrowed <strong>₹{loanAmount.toLocaleString()}</strong> and will repay over <strong>{tenureMonths} months</strong> with EMIs of <strong>₹{emi.toLocaleString()}</strong>. 
            Across the loan period, you'll pay <strong>₹{totalInterest.toLocaleString()}</strong> as interest. 
            Initially, most of your EMI covers interest, but gradually more goes toward the principal.
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanStatus;