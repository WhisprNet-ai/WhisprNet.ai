import { addToWaitlist } from '../../services/waitlistService.js';

/**
 * @desc    Add email to waitlist
 * @route   POST /api/waitlist
 * @access  Public
 */
export const joinWaitlist = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email existence
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format with regex
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Add email to waitlist
    const result = await addToWaitlist(email);

    // If email is already registered
    if (result.alreadyRegistered) {
      return res.status(200).json({
        success: true,
        message: 'Email already registered'
      });
    }

    // If successful registration
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Successfully joined the waitlist'
      });
    }

    // If there was an error in the service
    return res.status(400).json({
      success: false,
      error: result.message
    });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}; 