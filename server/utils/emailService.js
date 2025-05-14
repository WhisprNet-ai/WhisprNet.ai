import nodemailer from 'nodemailer';
import config from '../config/config.js';

/**
 * Email service for sending emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML email body
   * @param {string} options.text - Plain text email body (fallback)
   * @returns {Promise} - The result of sending the email
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an invitation email
   * @param {Object} options - Invitation options
   * @param {string} options.email - Recipient email
   * @param {string} options.htmlContent - HTML email content
   * @param {string} options.textContent - Plain text email content
   * @param {string} options.inviteeName - Name of the invitee
   * @returns {Promise} - The result of sending the email
   */
  async sendInvitationEmail({ email, htmlContent, textContent, inviteeName }) {
    return this.sendEmail({
      to: email,
      subject: `You've been invited to join our platform`,
      html: htmlContent,
      text: textContent
    });
  }
}

export default new EmailService(); 