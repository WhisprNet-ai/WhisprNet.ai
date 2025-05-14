import Invitation from '../../models/Invitation.js';
import User from '../../models/User.js';
import Organization from '../../models/Organization.js';
import { sendInvitationEmail } from '../../services/emailService.js';
import emailService from '../../utils/emailService.js';
import { generateInvitationEmail } from '../../utils/emailTemplates.js';
import { generatePassword } from '../../utils/passwordGenerator.js';
import config from '../../config/config.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// @desc    Create a new invitation
// @route   POST /api/invitations
// @access  Private/Admin or Org Admin
export const createInvitation = async (req, res, next) => {
  try {
    const { email, role, organizationId, allowedIntegrations } = req.body;
    
    // Check if user's organization matches the organization they're inviting to
    // or if they are a system admin
    if (req.user.role !== 'admin' && req.user.organizationId.toString() !== organizationId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send invitations for this organization'
      });
    }
    
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }
    
    // Get the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ 
      email, 
      organizationId,
      status: 'pending'
    });
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'An invitation has already been sent to this email'
      });
    }
    
    // Create invitation
    const invitation = new Invitation({
      email,
      role: role || 'user',
      organizationId: organization._id,
      organizationName: organization.name,
      createdBy: req.user.id,
      allowedIntegrations: allowedIntegrations || []
    });
    
    await invitation.save();
    
    // Send invitation email
    await sendInvitationEmail(invitation);
    
    res.status(201).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    next(error);
  }
};

// @desc    Get all invitations
// @route   GET /api/invitations
// @access  Private/Admin
export const getInvitations = async (req, res, next) => {
  try {
    let query = {};
    
    // If not admin, only get invitations for their organization
    if (req.user.role !== 'admin') {
      query.organizationId = req.user.organizationId;
    }
    
    const invitations = await Invitation.find(query)
      .populate({
        path: 'organizationId',
        select: 'name'
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email'
      });
    
    res.status(200).json({
      success: true,
      count: invitations.length,
      data: invitations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend invitation
// @route   POST /api/invitations/:id/resend
// @access  Private/Admin or Org Admin
export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate invitation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid invitation ID format' });
    }
    
    // Find invitation by ID
    const invitation = await Invitation.findById(id);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }
    
    // Check if invitation belongs to the current user's organization
    const user = await User.findById(req.user.id);
    if (!user || !user.organizationId.equals(invitation.organizationId)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to resend this invitation' });
    }
    
    // Check if invitation is expired - if so, refresh expiration
    const now = new Date();
    if (invitation.expiresAt < now) {
      // Set new expiration date (e.g., 7 days from now)
      invitation.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await invitation.save();
    }
    
    // Find organization
    const organization = await Organization.findById(invitation.organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: invitation._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Determine role-specific content
    let roleTitle = 'User';
    let roleDescription = 'join our platform';
    
    if (invitation.role === 'team_manager') {
      roleTitle = 'Team Manager';
      roleDescription = 'manage your team and view insights';
    } else if (invitation.role === 'org_admin') {
      roleTitle = 'Organization Admin';
      roleDescription = 'manage your organization';
    }
    
    // Create invite URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
    const inviteUrl = `${frontendUrl}/invitations/accept/${token}`;
    
    // Email template
    const emailData = {
      to: invitation.email,
      from: process.env.EMAIL_FROM || 'no-reply@whisprnet.ai',
      subject: `Re-invitation to join ${organization.name} as ${roleTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited to WhisprNet</h2>
          <p>Hello,</p>
          <p>You've been invited to join <strong>${organization.name}</strong> as a <strong>${roleTitle}</strong> on WhisprNet.</p>
          <p>As a ${roleTitle}, you'll be able to ${roleDescription}.</p>
          <p style="margin-top: 30px;"><a href="${inviteUrl}" style="background-color: #4F46E5; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">Accept Invitation</a></p>
          <p style="margin-top: 15px; font-size: 14px;">Or copy and paste this URL into your browser:</p>
          <p style="font-size: 14px;"><a href="${inviteUrl}">${inviteUrl}</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 50px;">This invitation will expire in 7 days.</p>
        </div>
      `
    };
    
    // Send email
    await sendEmail(emailData);
    
    // Update invitation history
    invitation.history.push({
      action: 'resent',
      timestamp: new Date(),
      by: req.user.id
    });
    await invitation.save();
    
    return res.status(200).json({
      success: true,
      message: `Invitation resent to ${invitation.email}`,
      data: invitation
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resend invitation. Please try again.'
    });
  }
};

// @desc    Cancel invitation
// @route   DELETE /api/invitations/:id
// @access  Private/Admin or Org Admin
export const cancelInvitation = async (req, res, next) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }
    
    // Check authorization
    if (
      req.user.role !== 'admin' && 
      req.user.organizationId.toString() !== invitation.organizationId.toString()
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this invitation'
      });
    }
    
    // Update status to cancelled
    invitation.status = 'cancelled';
    await invitation.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invitation (public route)
// @route   GET /api/invitations/accept/:token
// @access  Public
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    console.log(`[INVITATION] Processing invitation accept request for token: ${token}`);
    
    // Decode the JWT token to get the invitation ID
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret');
    } catch (err) {
      console.log(`[INVITATION] Invalid token: ${token} - JWT verification failed:`, err.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invitation token'
      });
    }
    
    // Find invitation by ID from token
    const invitation = await Invitation.findById(decoded.id)
      .populate('organizationId', 'name');
    
    if (!invitation) {
      console.log(`[INVITATION] Invalid token: ${token} - invitation not found for ID: ${decoded.id}`);
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }
    
    console.log(`[INVITATION] Found invitation for: ${invitation.email}, organization: ${invitation.organizationId.name || invitation.organizationId}`);
    
    // Check if invitation is expired
    const now = new Date();
    if (invitation.expiresAt && invitation.expiresAt < now) {
      console.log(`[INVITATION] Expired invitation for: ${invitation.email}`);
      invitation.status = 'expired';
      await invitation.save();
      
      return res.status(400).json({
        success: false,
        error: 'This invitation has expired'
      });
    }
    
    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      console.log(`[INVITATION] Invitation already ${invitation.status} for: ${invitation.email}`);
      return res.status(400).json({
        success: false,
        error: `This invitation is ${invitation.status}`
      });
    }
    
    console.log(`[INVITATION] Successfully validated invitation for: ${invitation.email}`);
    
    res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        organizationId: invitation.organizationId._id,
        organizationName: invitation.organizationId.name,
        role: invitation.role,
        token
      }
    });
  } catch (error) {
    console.error('[INVITATION] Error in acceptInvitation:', error);
    next(error);
  }
};

// @desc    Complete registration from invitation
// @route   POST /api/invitations/register/:token
// @access  Public
export const registerFromInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { firstName, lastName, password } = req.body;
    
    console.log(`[INVITATION] Processing registration from invitation token: ${token}`);
    
    // Validate required fields
    if (!firstName || !lastName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }
    
    // Decode the JWT token to get the invitation ID
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret');
    } catch (err) {
      console.log(`[INVITATION] Invalid token: ${token} - JWT verification failed:`, err.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired invitation token'
      });
    }
    
    // Find invitation by ID from token
    const invitation = await Invitation.findById(decoded.id)
      .populate('organizationId', 'name');
    
    if (!invitation) {
      console.log(`[INVITATION] Invalid token: ${token} - invitation not found for ID: ${decoded.id}`);
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }
    
    // Check if invitation is expired
    const now = new Date();
    if (invitation.expiresAt && invitation.expiresAt < now) {
      console.log(`[INVITATION] Expired invitation for: ${invitation.email}`);
      invitation.status = 'expired';
      await invitation.save();
      
      return res.status(400).json({
        success: false,
        error: 'This invitation has expired'
      });
    }
    
    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      console.log(`[INVITATION] Invitation already ${invitation.status} for: ${invitation.email}`);
      return res.status(400).json({
        success: false,
        error: `This invitation is ${invitation.status}`
      });
    }
    
    console.log(`[INVITATION] Creating user for: ${invitation.email}, organization: ${invitation.organizationId.name || invitation.organizationId}`);
    
    // Create user
    const user = new User({
      firstName,
      lastName,
      email: invitation.email,
      password,
      role: invitation.role,
      organizationId: invitation.organizationId._id,
      isEmailVerified: true // Auto-verify since they came through an invitation
    });
    
    // Set additional data for team managers if applicable
    if (invitation.role === 'team_manager' && invitation.allowedIntegrations) {
      user.managerConfig = {
        allowedIntegrations: invitation.allowedIntegrations
      };
    }
    
    await user.save();
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();
    
    // Generate token for authentication
    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '7d' }
    );
    
    console.log(`[INVITATION] Successfully registered user: ${user._id} for invitation: ${decoded.id}`);
    
    // Find user's organization
    const organization = await Organization.findById(user.organizationId);
    
    // Send notification to organization admins
    await sendAcceptanceNotificationEmail(user, organization, invitation.role);
    
    res.status(201).json({
      success: true,
      token: authToken,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error('[INVITATION] Error in registerFromInvitation:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }
    
    next(error);
  }
};

// @desc    Create a new organization invitation
// @route   POST /api/invitations/organization
// @access  Private/Admin
export const createOrganizationInvitation = async (req, res, next) => {
  try {
    const { email, organizationName, domain, adminRole } = req.body;
    
    // Check if user is system admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send organization invitations'
      });
    }
    
    // Check if user already exists with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }
    
    // Check if the organization already exists with this name
    const existingOrg = await Organization.findOne({ 
      name: { $regex: new RegExp(`^${organizationName}$`, 'i') }
    });
    
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: 'An organization with this name already exists'
      });
    }
    
    // Generate a slug for the organization
    const slug = organizationName
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-') + 
      '-' + Math.random().toString(36).substring(2, 8);
    
    // Create a new organization
    const organization = await Organization.create({
      name: organizationName,
      slug: slug,
      domain: domain || undefined,
      createdBy: req.user.id
    });
    
    // Create invitation for organization admin
    const invitation = await Invitation.create({
      email,
      role: adminRole || 'admin',
      organizationId: organization._id,
      organizationName: organization.name,
      domain: organization.domain,
      createdBy: req.user.id
    });
    
    // Generate temporary password
    const tempPassword = generatePassword(12);
    
    // Prepare invitation link
    const inviteLink = `${config.server.frontendUrl}/invitations/accept/${invitation.token}`;
    
    // Log the invitation for development purposes
    console.log(`[ORGANIZATION INVITATION] Sent to: ${email}`);
    console.log(`[ORGANIZATION INVITATION] Organization: ${organizationName}`);
    console.log(`[ORGANIZATION INVITATION] Invitation link: ${inviteLink}`);
    console.log(`[ORGANIZATION INVITATION] Temporary password: ${tempPassword}`);
    
    // Convert Mongoose document to plain object and add additional properties
    const invitationData = {
      email: email, // Explicitly set email to ensure it's included
      token: invitation.token,
      organizationId: invitation.organizationId,
      organizationName: organization.name,
      domain: organization.domain,
      role: invitation.role,
      tempPassword: tempPassword,
      inviteLink: inviteLink
    };
    
    // Send email using the email service
    await sendInvitationEmail(invitationData);
    
    res.status(201).json({
      success: true,
      data: {
        invitation,
        organization: {
          id: organization._id,
          name: organization.name,
          domain: organization.domain
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send notification email when a user accepts an invitation
 * @param {Object} user - The user who accepted the invitation
 * @param {Object} organization - The organization the user joined
 * @param {string} role - The role of the user (org_admin, team_manager)
 */
const sendAcceptanceNotificationEmail = async (user, organization, role) => {
  try {
    if (!user || !organization) {
      console.error('Missing required data for sending acceptance notification');
      return false;
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
    const orgAdminEmails = await User.find(
      { organizationId: organization._id, role: 'org_admin' },
      'email'
    ).lean();
    
    if (!orgAdminEmails || orgAdminEmails.length === 0) {
      console.warn('No organization admins found to notify about invitation acceptance');
      return false;
    }
    
    const adminEmails = orgAdminEmails.map(admin => admin.email);
    
    // Set up email data
    const emailData = {
      to: adminEmails,
      from: process.env.EMAIL_FROM || 'no-reply@whisprnet.ai',
      subject: `${user.firstName} ${user.lastName} has accepted their invitation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>WhisprNet Invitation Accepted</h2>
          <p>Hello,</p>
          <p><strong>${user.firstName} ${user.lastName}</strong> (${user.email}) has accepted their invitation and joined your organization as a <strong>${role === 'team_manager' ? 'Team Manager' : 'Organization Admin'}</strong>.</p>
          <p>They now have access to your WhisprNet dashboard.</p>
          <p style="margin-top: 30px;"><a href="${frontendUrl}/team-management" style="background-color: #4F46E5; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none;">View Team Management</a></p>
          <p style="color: #666; font-size: 14px; margin-top: 50px;">This is an automated message from WhisprNet.</p>
        </div>
      `
    };

    // Send the email
    await sendEmail(emailData);
    return true;
  } catch (error) {
    console.error('Error sending acceptance notification email:', error);
    return false;
  }
}; 