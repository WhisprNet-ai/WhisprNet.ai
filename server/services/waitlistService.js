import Waitlist from '../models/Waitlist.js';
import { generateWaitlistEmail } from '../utils/emailTemplates.js';
import * as emailService from './emailService.js';

/**
 * Add a new email to the waitlist
 * @param {string} email - Email address to add to waitlist
 * @returns {Promise<Object>} - Result object with success status and message
 */
export const addToWaitlist = async (email) => {
  try {
    // Validate email format
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }

    // Check if email already exists in the waitlist
    const existingEmail = await Waitlist.findOne({ email: email.toLowerCase() });
    
    if (existingEmail) {
      return {
        success: true,
        message: 'Email already registered',
        alreadyRegistered: true
      };
    }

    // Create new waitlist entry
    const waitlistEntry = await Waitlist.create({
      email: email.toLowerCase(),
      joinedAt: new Date()
    });

    // Send confirmation email
    const emailContent = generateWaitlistEmail({ email });
    const emailSent = await emailService.sendWaitlistConfirmationEmail(email, emailContent);

    // Log results for debugging
    console.log(`[WAITLIST SERVICE] Added email to waitlist: ${email}`);
    console.log(`[WAITLIST SERVICE] Confirmation email sent: ${emailSent ? 'Yes' : 'No'}`);

    return {
      success: true,
      message: 'Successfully added to waitlist',
      data: waitlistEntry
    };
  } catch (error) {
    console.error('[WAITLIST SERVICE] Error adding to waitlist:', error);
    return {
      success: false,
      message: 'Failed to add to waitlist',
      error: error.message
    };
  }
}; 