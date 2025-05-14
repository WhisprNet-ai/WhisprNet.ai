/**
 * Email templates for various email types
 */

/**
 * Generate invitation email HTML
 * @param {Object} data - Invitation data
 * @param {string} data.inviteeEmail - Email of the person being invited
 * @param {string} data.invitationToken - Unique invitation token
 * @param {string} data.organizationName - Name of the organization
 * @param {string} data.role - Role the user is being invited as
 * @param {string} data.tempPassword - Temporary password for first login
 * @param {string} data.inviteLink - Link to accept the invitation
 * @returns {string} - HTML email content
 */
export const generateInvitationEmail = (data) => {
  const {
    inviteeEmail,
    invitationToken,
    organizationName,
    role,
    tempPassword,
    inviteLink
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to WhisprNet.ai</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          padding: 30px;
          text-align: center;
        }
        
        .email-header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .email-header p {
          color: rgba(255, 255, 255, 0.9);
          margin: 10px 0 0;
          font-size: 16px;
        }
        
        .email-body {
          padding: 30px;
          color: #4b5563;
        }
        
        .email-body h2 {
          color: #111827;
          font-size: 18px;
          margin: 0 0 15px;
        }
        
        .credentials-box {
          background-color: #f3f4f6;
          border-radius: 6px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #06b6d4;
        }
        
        .credentials-box p {
          margin: 5px 0;
        }
        
        .credentials-box .label {
          font-weight: 600;
          color: #374151;
        }
        
        .credentials-box .value {
          font-family: monospace;
          background-color: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          color: #374151;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .email-footer {
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .email-footer a {
          color: #06b6d4;
          text-decoration: none;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100%;
            border-radius: 0;
          }
          
          .email-header, .email-body, .email-footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>WhisprNet.ai</h1>
          <p>You've been invited to join</p>
        </div>
        
        <div class="email-body">
          <h2>Hello!</h2>
          <p>You've been invited to join <strong>${organizationName}</strong> on WhisprNet.ai as a <strong>${role}</strong>.</p>
          
          <p>To get started, click the button below to accept your invitation:</p>
          
          <div style="text-align: center;">
            <a href="${inviteLink}" class="cta-button">Accept Invitation</a>
          </div>
          
          <div class="credentials-box">
            <p><span class="label">Email:</span> <span class="value">${inviteeEmail}</span></p>
            <p><span class="label">Temporary Password:</span> <span class="value">${tempPassword}</span></p>
            <p style="margin-top: 15px; color: #ef4444; font-size: 14px;">Please change your password after logging in.</p>
          </div>
          
          <p>If you have any questions or need assistance, please contact the organization administrator.</p>
          
          <p>Best regards,<br>The WhisprNet.ai Team</p>
        </div>
        
        <div class="email-footer">
          <p>If you did not expect this invitation, you can ignore this email.</p>
          <p>&copy; ${new Date().getFullYear()} WhisprNet.ai. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate waitlist confirmation email HTML
 * @param {Object} data - Waitlist data
 * @param {string} data.email - Email of the person joining the waitlist
 * @returns {string} - HTML email content
 */
export const generateWaitlistEmail = (data) => {
  const { email } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🎉 You're on the WhisprNet.ai Waitlist!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
          background: linear-gradient(to right, #4e42ec, #8f4ef2);
          padding: 30px;
          text-align: center;
        }
        
        .email-header h1 {
          color: white;
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        
        .email-header p {
          color: rgba(255, 255, 255, 0.9);
          margin: 10px 0 0;
          font-size: 16px;
        }
        
        .email-body {
          padding: 30px;
          color: #4b5563;
        }
        
        .email-body h2 {
          color: #111827;
          font-size: 18px;
          margin: 0 0 15px;
        }
        
        .email-footer {
          padding: 20px 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .email-footer a {
          color: #4e42ec;
          text-decoration: none;
        }
        
        @media only screen and (max-width: 600px) {
          .email-container {
            width: 100%;
            border-radius: 0;
          }
          
          .email-header, .email-body, .email-footer {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>WhisprNet.ai</h1>
          <p>🎉 You're on the Waitlist!</p>
        </div>
        
        <div class="email-body">
          <h2>Hi there 👋</h2>
          <p>Thanks for signing up to WhisprNet.ai. You're officially on our waitlist!</p>
          
          <p>We'll keep you updated as we roll out features and updates.</p>
          
          <p>— Team WhisprNet.ai 🚀</p>
        </div>
        
        <div class="email-footer">
          <p>&copy; ${new Date().getFullYear()} WhisprNet.ai. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}; 