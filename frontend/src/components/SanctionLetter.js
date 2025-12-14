import React from 'react';

const SanctionLetter = ({ letter }) => {
  if (!letter) {
    return <div className="sanction-letter card p-lg">No sanction letter generated yet</div>;
  }

  return (
    <div className="sanction-letter card p-lg">
      <div className="letter-header mb-lg">
        <h4 className="header-3 mb-sm">Loan Sanction Letter</h4>
        <p className="body-large text-primary">Congratulations! Your loan has been approved.</p>
      </div>

      <div className="letter-details mb-lg">
        <div className="detail-item d-flex justify-between mb-md">
          <span className="label text-tertiary">Customer:</span>
          <span className="value body-default font-semibold">{letter.customerName}</span>
        </div>
        <div className="detail-item d-flex justify-between mb-md">
          <span className="label text-tertiary">Loan Amount:</span>
          <span className="value body-default font-semibold">{letter.loanAmount}</span>
        </div>
        <div className="detail-item d-flex justify-between mb-md">
          <span className="label text-tertiary">Interest Rate:</span>
          <span className="value body-default font-semibold">{letter.interestRate}</span>
        </div>
        <div className="detail-item d-flex justify-between mb-md">
          <span className="label text-tertiary">Monthly EMI:</span>
          <span className="value body-default font-semibold">{letter.emi}</span>
        </div>
        <div className="detail-item d-flex justify-between">
          <span className="label text-tertiary">Tenure:</span>
          <span className="value body-default font-semibold">{letter.tenure}</span>
        </div>
      </div>

      <div className="letter-actions">
        <a href={letter.downloadUrl} className="button button-primary d-flex align-center justify-center gap-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2V10M8 10L11 7M8 10L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Download Sanction Letter
        </a>
      </div>
    </div>
  );
};

export default SanctionLetter;