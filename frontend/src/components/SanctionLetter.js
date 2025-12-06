import React from 'react';

const SanctionLetter = ({ letter }) => {
  if (!letter) {
    return <div className="sanction-letter">No sanction letter generated yet</div>;
  }

  return (
    <div className="sanction-letter">
      <div className="letter-header">
        <h4>Loan Sanction Letter</h4>
        <p>Congratulations! Your loan has been approved.</p>
      </div>
      
      <div className="letter-details">
        <div className="detail-item">
          <span className="label">Customer:</span>
          <span className="value">{letter.customerName}</span>
        </div>
        <div className="detail-item">
          <span className="label">Loan Amount:</span>
          <span className="value">{letter.loanAmount}</span>
        </div>
        <div className="detail-item">
          <span className="label">Interest Rate:</span>
          <span className="value">{letter.interestRate}</span>
        </div>
        <div className="detail-item">
          <span className="label">Monthly EMI:</span>
          <span className="value">{letter.emi}</span>
        </div>
        <div className="detail-item">
          <span className="label">Tenure:</span>
          <span className="value">{letter.tenure}</span>
        </div>
      </div>
      
      <div className="letter-actions">
        <a href={letter.downloadUrl} className="download-btn">
          Download Sanction Letter
        </a>
      </div>
    </div>
  );
};

export default SanctionLetter;