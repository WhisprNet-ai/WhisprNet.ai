import mongoose from 'mongoose';

/**
 * Waitlist Schema
 * Stores user email addresses who have registered for the waitlist
 */
const WaitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// Create an index on email field for faster lookups
WaitlistSchema.index({ email: 1 });

const Waitlist = mongoose.model('Waitlist', WaitlistSchema);

export default Waitlist; 