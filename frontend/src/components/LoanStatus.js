import React, { useState } from 'react';
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

const LoanStatus = ({ status }) => {
  const [viewMode, setViewMode] = useState('quick'); // 'quick' or 'detailed'

  if (!status) {
    return <div className="loan-status">No loan application data available</div>;
  }

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

  // Check if loan is sanctioned
  const isSanctioned = status.decision === 'approved' || status.sanction_complete || status.sanction_letter_generated;

  // Generate sanction letter PDF
  const downloadSanctionLetter = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    const referenceNo = `PRIMUM/${today.getFullYear()}/${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const letterContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Loan Sanction Letter - PRIMUM</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #0a3d62; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #0a3d62; }
    .logo span { color: #1b98e0; }
    .subtitle { color: #666; font-size: 12px; letter-spacing: 2px; margin-top: 5px; }
    .ref-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
    .title { text-align: center; font-size: 20px; color: #0a3d62; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
    .greeting { margin-bottom: 20px; }
    .content { margin-bottom: 25px; text-align: justify; }
    .details-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .details-table th, .details-table td { padding: 12px 15px; text-align: left; border: 1px solid #ddd; }
    .details-table th { background: #0a3d62; color: white; width: 40%; }
    .details-table td { background: #f9f9f9; }
    .details-table tr:nth-child(even) td { background: #fff; }
    .highlight-row td { background: #e8f4fd !important; font-weight: bold; }
    .terms { margin: 25px 0; padding: 20px; background: #f5f7fa; border-radius: 8px; }
    .terms h4 { color: #0a3d62; margin-bottom: 15px; }
    .terms ul { margin-left: 20px; }
    .terms li { margin-bottom: 8px; font-size: 13px; }
    .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-box { text-align: center; }
    .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 60px; padding-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 11px; color: #666; }
    .stamp { color: #2e7d32; font-weight: bold; font-size: 18px; margin-top: 10px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PRIMUM<span>AI</span></div>
    <div class="subtitle">SMART BANKING • PERSONAL LOANS</div>
  </div>
  
  <div class="ref-section">
    <div><strong>Reference No:</strong> ${referenceNo}</div>
    <div><strong>Date:</strong> ${formattedDate}</div>
  </div>
  
  <div class="title">📋 Loan Sanction Letter</div>
  
  <div class="greeting">
    <p>Dear Valued Customer,</p>
  </div>
  
  <div class="content">
    <p>We are pleased to inform you that your Personal Loan application has been <strong style="color: #2e7d32;">APPROVED</strong>. 
    Based on our assessment of your profile and creditworthiness, we are sanctioning a loan as per the details mentioned below.</p>
  </div>
  
  <table class="details-table">
    <tr>
      <th>Sanctioned Loan Amount</th>
      <td>₹${loanAmount.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <th>Interest Rate (per annum)</th>
      <td>${interestRate}% p.a.</td>
    </tr>
    <tr>
      <th>Loan Tenure</th>
      <td>${tenureMonths} Months</td>
    </tr>
    <tr class="highlight-row">
      <th>Monthly EMI</th>
      <td>₹${emi.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <th>Processing Fee</th>
      <td>₹${processingFee.toLocaleString('en-IN')} + GST</td>
    </tr>
    <tr>
      <th>Total Interest Payable</th>
      <td>₹${totalInterest.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <th>Total Amount Payable</th>
      <td>₹${totalCost.toLocaleString('en-IN')}</td>
    </tr>
    <tr>
      <th>EMI Start Date</th>
      <td>${new Date(today.getFullYear(), today.getMonth() + 1, 5).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
    </tr>
  </table>
  
  <div class="terms">
    <h4>Terms & Conditions:</h4>
    <ul>
      <li>This sanction is valid for 30 days from the date of issue.</li>
      <li>Loan disbursement is subject to completion of documentation and verification.</li>
      <li>EMI will be deducted from your registered bank account on the 5th of every month.</li>
      <li>Prepayment is allowed after 6 EMIs without any charges.</li>
      <li>Late payment will attract a penalty of 2% per month on the overdue amount.</li>
      <li>This offer is non-transferable and subject to our standard terms and conditions.</li>
    </ul>
  </div>
  
  <div class="content">
    <p>Please visit your nearest branch or complete the e-signing process online to proceed with the disbursement. 
    For any queries, contact our customer support at <strong>1800-XXX-XXXX</strong> or email us at <strong>support@primum.ai</strong>.</p>
  </div>
  
  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">Customer Signature</div>
    </div>
    <div class="signature-box">
      <div class="stamp">✓ APPROVED</div>
      <div class="signature-line">Authorized Signatory<br/><small>PRIMUM AI Banking</small></div>
    </div>
  </div>
  
  <div class="footer">
    <p>This is a system-generated document and does not require a physical signature.</p>
    <p>PRIMUM AI Banking | CIN: U65100MH2024PTC123456 | RBI Reg. No: B-XX.XXXXX</p>
  </div>
</body>
</html>`;

    // Open new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(letterContent);
    printWindow.document.close();
    
    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Generate chart data for first 12 months
  const generateChartData = () => {
    const chartData = [];
    let balance = loanAmount;
    const monthlyRate = interestRate / 100 / 12;
    
    for (let month = 1; month <= 12; month++) {
      const interestPaid = Math.round(balance * monthlyRate);
      const principalPaid = Math.round(emi - interestPaid);
      balance = balance - principalPaid;
      
      chartData.push({
        month: month.toString(),
        principal: principalPaid,
        interest: interestPaid,
        emi: emi
      });
    }
    
    return chartData;
  };

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

  const chartData = generateChartData();

  return (
    <div className="loan-breakdown-panel">
      {/* Header with Status Badge */}
      <div className="breakdown-header">
        <h3>Loan Breakdown</h3>
        <span className={`status-badge ${status.decision === 'approved' ? 'approved' : status.decision === 'rejected' ? 'rejected' : 'pending'}`}>
          {(status.decision || 'pending').toUpperCase()}
        </span>
      </div>

      {/* Download Invoice Button - Show when sanctioned */}
      {isSanctioned && (
        <div className="sanction-download-section">
          <button 
            className="download-invoice-btn"
            onClick={downloadSanctionLetter}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Sanction Letter
          </button>
          <p className="download-hint">PDF will open in a new tab for printing/saving</p>
        </div>
      )}

      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'quick' ? 'active' : ''}`}
          onClick={() => setViewMode('quick')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Quick View
        </button>
        <button
          className={`toggle-btn ${viewMode === 'detailed' ? 'active' : ''}`}
          onClick={() => setViewMode('detailed')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Detailed View
        </button>
      </div>

      {viewMode === 'quick' ? (
        <div className="quick-view-content">
          {/* EMI Highlight */}
          <div className="emi-highlight">
            <span className="emi-label">Monthly EMI</span>
            <span className="emi-value">₹{emi.toLocaleString('en-IN')}</span>
            <span className="emi-tenure">for {tenureMonths} months</span>
          </div>

          {/* Loan Details Row */}
          <div className="loan-details-row">
            <div className="detail-box">
              <span className="detail-label">Loan Amount</span>
              <span className="detail-value">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="detail-box">
              <span className="detail-label">Interest Rate</span>
              <span className="detail-value">{interestRate}%</span>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="cost-breakdown">
            <div className="breakdown-title">Total Cost Breakdown</div>
            <div className="breakdown-row">
              <span>Principal</span>
              <span className="amount">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row highlight">
              <span>Interest Payable</span>
              <span className="amount interest">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row">
              <span>Processing Fee</span>
              <span className="amount">₹{processingFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row">
              <span>GST (18%)</span>
              <span className="amount">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row total">
              <span>Total Payable</span>
              <span className="amount total-amount">₹{totalCost.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Tip Box */}
          <div className="tip-box">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              <strong>Tip:</strong> Paying ₹500 extra monthly can save you ~₹{Math.round(totalInterest * 0.15).toLocaleString('en-IN')} in interest
            </span>
          </div>

          {/* EMI Chart */}
          <div className="emi-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F3F4F6'
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
                <Bar dataKey="principal" fill="#3B82F6" name="Principal" radius={[2, 2, 0, 0]} />
                <Bar dataKey="interest" fill="#10B981" name="Interest" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-footer">
              <span>Expected monthly EMI: ₹{emi.toLocaleString('en-IN')}</span>
              <span>Showing first 12 months breakdown</span>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed View */
        <div className="detailed-view-content">
          {/* Cost Summary */}
          <div className="cost-summary-section">
            <h4>Cost Summary</h4>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Loan Amount (Principal)</td>
                  <td>₹{loanAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Total Interest ({interestRate}% for {tenureMonths} months)</td>
                  <td className="highlight">₹{totalInterest.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>
                    Processing Fee (0.5%)
                    <small>One-time bank charge</small>
                  </td>
                  <td>₹{processingFee.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>GST on Processing Fee (18%)</td>
                  <td>₹{gst.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Total Amount Payable</strong></td>
                  <td><strong>₹{totalCost.toLocaleString('en-IN')}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amortization Schedule */}
          <div className="amortization-section">
            <h4>EMI Breakdown Over Time</h4>
            <p className="section-desc">See how your EMI is split between principal and interest</p>
            <table className="amortization-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {generateAmortization().map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.month}</td>
                    <td className="principal">₹{row.principal.toLocaleString('en-IN')}</td>
                    <td className="interest">₹{row.interest.toLocaleString('en-IN')}</td>
                    <td>₹{row.balance.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Explanation */}
          <div className="explanation-box">
            <strong>📝 What This Means:</strong>
            <p>
              You borrowed <strong>₹{loanAmount.toLocaleString('en-IN')}</strong> and will repay over <strong>{tenureMonths} months</strong> with EMIs of <strong>₹{emi.toLocaleString('en-IN')}</strong>.
              Across the loan period, you'll pay <strong>₹{totalInterest.toLocaleString('en-IN')}</strong> as interest.
              Initially, most of your EMI covers interest, but gradually more goes toward the principal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanStatus;