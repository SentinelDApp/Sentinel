const nodemailer = require('nodemailer');

/**
 * EMAIL SERVICE
 * 
 * Handles sending approval/rejection emails to stakeholders
 * Uses Nodemailer with Gmail or SMTP configuration
 */

// Create transporter based on environment configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // App password for Gmail
    }
  });
};

/**
 * Send Approval Email
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.fullName - Recipient's full name
 * @param {string} params.role - Approved role
 * @param {string} params.walletAddress - User's wallet address
 */
exports.sendApprovalEmail = async ({ to, fullName, role, walletAddress }) => {
  const transporter = createTransporter();

  const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);

  const mailOptions = {
    from: {
      name: 'Sentinel Supply Chain',
      address: process.env.EMAIL_USER
    },
    to,
    subject: '✅ Your Sentinel Account Has Been Approved!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin-top: 10px; }
          .content { padding: 40px 30px; }
          .success-badge { display: inline-flex; align-items: center; gap: 8px; background: #ecfdf5; color: #059669; padding: 12px 20px; border-radius: 50px; font-weight: 600; margin-bottom: 20px; }
          .info-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #64748b; font-size: 14px; }
          .info-value { color: #1e293b; font-weight: 600; font-size: 14px; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Sentinel</h1>
            <p>Blockchain Supply Chain Tracking</p>
          </div>
          <div class="content">
            <div class="success-badge">✅ Account Approved</div>
            <h2 style="color: #1e293b; margin-top: 0;">Hello, ${fullName}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Great news! Your stakeholder registration has been <strong>approved</strong> by our admin team. 
              You can now access the Sentinel platform with your registered wallet.
            </p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Role</span>
                <span class="info-value">${roleDisplayName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Wallet Address</span>
                <span class="info-value" style="font-family: monospace; font-size: 12px;">${walletAddress}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: #059669;">Active</span>
              </div>
            </div>

            <p style="color: #475569; line-height: 1.6;">
              Connect your MetaMask wallet and login to start using the platform.
            </p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="cta-button">
              Login to Dashboard →
            </a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sentinel Supply Chain. All rights reserved.</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Rejection Email
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.fullName - Recipient's full name
 * @param {string} params.role - Requested role
 * @param {string} params.reason - Rejection reason
 */
exports.sendRejectionEmail = async ({ to, fullName, role, reason }) => {
  const transporter = createTransporter();

  const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);

  const mailOptions = {
    from: {
      name: 'Sentinel Supply Chain',
      address: process.env.EMAIL_USER
    },
    to,
    subject: '❌ Update on Your Sentinel Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .header p { color: rgba(255,255,255,0.9); margin-top: 10px; }
          .content { padding: 40px 30px; }
          .rejected-badge { display: inline-flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; padding: 12px 20px; border-radius: 50px; font-weight: 600; margin-bottom: 20px; }
          .reason-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .reason-title { color: #dc2626; font-weight: 600; margin-bottom: 8px; }
          .reason-text { color: #7f1d1d; line-height: 1.6; }
          .info-box { background: #f8fafc; border-left: 4px solid #64748b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #64748b; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Sentinel</h1>
            <p>Blockchain Supply Chain Tracking</p>
          </div>
          <div class="content">
            <div class="rejected-badge">❌ Registration Not Approved</div>
            <h2 style="color: #1e293b; margin-top: 0;">Hello, ${fullName}</h2>
            <p style="color: #475569; line-height: 1.6;">
              We regret to inform you that your registration request for the <strong>${roleDisplayName}</strong> role 
              has not been approved at this time.
            </p>
            
            <div class="reason-box">
              <div class="reason-title">📋 Reason for Rejection:</div>
              <div class="reason-text">${reason}</div>
            </div>

            <div class="info-box">
              <p style="color: #475569; margin: 0; line-height: 1.6;">
                <strong>What can you do?</strong><br>
                You may re-apply with corrected information or proper documentation. 
                If you believe this was a mistake, please contact our support team.
              </p>
            </div>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup" class="cta-button">
              Apply Again →
            </a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sentinel Supply Chain. All rights reserved.</p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Rejection email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send rejection email:', error);
    return { success: false, error: error.message };
  }
};
