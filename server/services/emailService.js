/**
 * Email Service
 * Handles sending emails to users for various purposes such as invitations,
 * password resets, notifications, etc.
 * 
 * Note: This is a placeholder implementation. In a production environment,
 * you would integrate with an actual email service provider like SendGrid,
 * Mailgun, AWS SES, etc.
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { generateInvitationEmail, generateWaitlistEmail } from '../utils/emailTemplates.js';
import config from '../config/config.js';

dotenv.config();

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
};

/**
 * Send an invitation email to a user
 * @param {Object} invitation - The invitation object containing recipient details
 * @param {string} invitation.email - Email of the invitee
 * @param {string} invitation._id - Invitation ID (MongoDB ObjectId)
 * @param {Object} invitation.organizationId - ID or populated organization object
 * @param {string} [invitation.organizationName] - Name of the organization (for org invites)
 * @param {string} [invitation.tempPassword] - Temporary password (for org invites)
 * @param {string} [invitation.role] - Role being assigned to the invitee
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendInvitationEmail = async (invitation) => {
  try {
    // Validate that email is provided
    if (!invitation.email) {
      console.error('[EMAIL SERVICE] Error: No email address provided for invitation');
      return false;
    }

    // Validate that we have an ID
    if (!invitation._id) {
      console.error('[EMAIL SERVICE] Error: No invitation ID provided for invitation to', invitation.email);
      return false;
    }

    // Generate a JWT token for the invitation
    const token = jwt.sign(
      { id: invitation._id.toString() },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '7d' }
    );

    // Determine organization name from either direct property or populated object
    let organizationName = 'WhisprNet.ai';
    if (invitation.organizationName) {
      organizationName = invitation.organizationName;
    } else if (invitation.organizationId?.name) {
      organizationName = invitation.organizationId.name;
    } else if (typeof invitation.organizationId === 'object' && invitation.organizationId?.name) {
      organizationName = invitation.organizationId.name;
    }
    
    // Get role-specific content
    let roleTitle = 'User';
    let roleDescription = 'join our platform';
    
    if (invitation.role === 'team_manager') {
      roleTitle = 'Team Manager';
      roleDescription = 'manage your team and view insights';
    } else if (invitation.role === 'org_admin') {
      roleTitle = 'Organization Admin';
      roleDescription = 'manage your organization';
    }
    
    // Generate invitation link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
    const inviteLink = `${frontendUrl}/invitations/accept?token=${token}`;
    
    // Log details for debugging purposes
    console.log(`[EMAIL SERVICE] Sending invitation email to: ${invitation.email}`);
    console.log(`[EMAIL SERVICE] JWT Token created for invitation ID: ${invitation._id}`);
    console.log(`[EMAIL SERVICE] Organization: ${organizationName}`);
    console.log(`[EMAIL SERVICE] Role: ${roleTitle}`);
    console.log(`[EMAIL SERVICE] Invite Link: ${inviteLink}`);
    
    // Set up email data
    const emailData = {
      to: invitation.email,
      from: process.env.EMAIL_FROM || 'no-reply@whisprnet.ai',
      subject: `Invitation to join ${organizationName} as ${roleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to WhisprNet</h2>
          <p>Hello,</p>
          <p>You've been invited to join <strong>${organizationName}</strong> as a <strong>${roleTitle}</strong> on WhisprNet.</p>
          <p>As a ${roleTitle}, you'll be able to ${roleDescription}.</p>
          <p style="margin-top: 30px;"><a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Accept Invitation</a></p>
          <p style="margin-top: 15px; font-size: 14px;">Or copy and paste this URL into your browser:</p>
          <p style="font-size: 14px;"><a href="${inviteLink}">${inviteLink}</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 50px;">This invitation will expire in 7 days.</p>
        </div>
      `
    };

    // Send the email
    return await sendEmail(emailData);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

/**
 * Send a password reset email to a user
 * @param {Object} user - The user object
 * @param {string} resetToken - The password reset token
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetLink = `${config.server.frontendUrl}/reset-password/${resetToken}`;
    console.log(`[EMAIL SERVICE] Sending password reset email to: ${user.email}`);
    
    // Initialize the transporter
    const transporter = createTransporter();
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: user.email,
      subject: 'Reset Your WhisprNet.ai Password',
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset for your WhisprNet.ai account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    console.log(`[EMAIL SERVICE] Password reset email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send a welcome email to a new user
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendWelcomeEmail = async (user) => {
  try {
    console.log(`[EMAIL SERVICE] Sending welcome email to: ${user.email}`);
    
    // Initialize the transporter
    const transporter = createTransporter();
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: user.email,
      subject: 'Welcome to WhisprNet.ai',
      html: `
        <h1>Welcome to WhisprNet.ai!</h1>
        <p>Thank you for joining our platform.</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in and start using our services.</p>
      `
    });

    console.log(`[EMAIL SERVICE] Welcome email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send a waitlist confirmation email to a user
 * @param {string} email - The user's email address
 * @param {string} emailContent - The HTML content of the email (optional, will use default if not provided)
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export const sendWaitlistConfirmationEmail = async (email, emailContent = null) => {
  try {
    // Validate that email is provided
    if (!email) {
      console.error('[EMAIL SERVICE] Error: No email address provided for waitlist confirmation');
      return false;
    }
    
    // Generate email content if not provided
    if (!emailContent) {
      emailContent = generateWaitlistEmail({ email });
    }
    
    console.log(`[EMAIL SERVICE] Sending waitlist confirmation email to: ${email}`);
    
    // Initialize the transporter
    const transporter = createTransporter();
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: email,
      subject: "🎉 You're on the WhisprNet.ai Waitlist!",
      html: emailContent
    });

    console.log(`[EMAIL SERVICE] Waitlist confirmation email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending waitlist confirmation email:', error);
    return false;
  }
};

/**
 * Send an email using configured email service
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise} - Email send result
 */
export const sendEmail = async (emailData) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail(emailData);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}; 