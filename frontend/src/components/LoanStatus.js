import React from 'react';

const LoanStatus = ({ status }) => {
  if (!status) {
    return <div className="loan-status">No loan application data available</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981'; // green
      case 'conditional': return '#f59e0b'; // amber
      case 'rejected': return '#ef4444'; // red
      case 'under_review': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  return (
    <div className="loan-status">
      <div className="status-header">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(status.decision) }}>
          {status.decision || 'pending'}
        </div>
      </div>
      
      <div className="status-details">
        {status.loan_amount && (
          <div className="detail-item">
            <span className="label">Loan Amount:</span>
            <span className="value">₹{status.loan_amount?.toLocaleString() || 'N/A'}</span>
          </div>
        )}
        
        {status.emi_amount && (
          <div className="detail-item">
            <span className="label">Monthly EMI:</span>
            <span className="value">₹{status.emi_amount?.toLocaleString() || 'N/A'}</span>
          </div>
        )}
        
        {status.interest_rate && (
          <div className="detail-item">
            <span className="label">Interest Rate:</span>
            <span className="value">{status.interest_rate}%</span>
          </div>
        )}
        
        {status.tenure_months && (
          <div className="detail-item">
            <span className="label">Tenure:</span>
            <span className="value">{status.tenure_months} months</span>
          </div>
        )}
        
        {status.risk_category && (
          <div className="detail-item">
            <span className="label">Risk Category:</span>
            <span className="value">{status.risk_category}</span>
          </div>
        )}
        
        {status.credit_score && (
          <div className="detail-item">
            <span className="label">Credit Score:</span>
            <span className="value">{status.credit_score}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanStatus;