// Import required modules
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { sendEmail } from '../services/emailService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Local implementation of generateToken
const generateToken = (id, expiresIn = '1d') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn
  });
};

// Create a user from external data (Slack, etc.) and send invitation email
export const createFromExternal = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role = 'team_manager',
      slackUserId,
      profileImage,
      sendInvite = true
    } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`User with email ${email} already exists, updating with new external data`);
      
      // Update existing user with external data
      if (slackUserId) user.slackUserId = slackUserId;
      if (profileImage) user.profileImage = profileImage;
      if (role && role === 'team_manager' && user.role !== 'admin') user.role = role;
      
      await user.save();
    } else {
      console.log(`Creating new user from external data for email ${email}`);
      
      // Get organization from the request
      const organizationId = req.user.organizationId;
      const organization = await Organization.findById(organizationId);
      
      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }
      
      // Generate a temporary password
      const temporaryPassword = crypto.randomBytes(10).toString('hex');
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
      
      // Create new user
      user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        organizationId,
        slackUserId,
        profileImage,
        isEmailVerified: false,
        temporaryPassword: true
      });
      
      await user.save();
      
      // Add user to organization members - Skipping since Organization model doesn't have a members field
      /*
      if (!organization.members.includes(user._id)) {
        organization.members.push(user._id);
        await organization.save();
      }
      */
      
      // Send invitation email if requested
      if (sendInvite) {
        // Generate token for email verification
        const token = generateToken(user._id, '24h');
        
        // Get inviter's name
        const inviter = req.user;
        const inviterName = `${inviter.firstName} ${inviter.lastName}`;
        const organizationName = organization.name || 'WhisprNet.ai';
        
        // Get frontend URL with fallback
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
        
        // Email template for invitation
        const emailSubject = `🎉 You've been invited to join ${organizationName} as a Team Manager`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #2563eb;">Welcome to WhisprNet.ai! 🚀</h1>
            </div>
            
            <p>Hello ${firstName},</p>
            
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a Team Manager.</p>
            
            <p>As a Team Manager, you'll be able to:</p>
            <ul>
              <li>Access insights from team communications</li>
              <li>Manage team settings and permissions</li>
              <li>View analytics and reports</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/invitations/accept/${token}" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            
            <p>Your temporary password: <strong>${temporaryPassword}</strong></p>
            <p>(You'll be asked to change this when you first log in)</p>
            
            <p>If you have any questions, please contact your organization administrator.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e4e8; text-align: center; color: #6b7280; font-size: 12px;">
              <p>WhisprNet.ai - Privacy-focused insights</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        `;
        
        // Send the invitation email
        await sendEmail(email, emailSubject, emailHtml);
        console.log(`Invitation email sent to ${email}`);
      }
    }
    
    // Return success with user data
    return res.status(201).json({
      success: true,
      message: 'User created or updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user from external data:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 