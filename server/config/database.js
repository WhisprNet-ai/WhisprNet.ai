import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

/**
 * Connect to MongoDB database with optimal configuration
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    // Setup mongoose connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Get connection string from env vars
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/whisprnet';
    
    console.log(`Connecting to MongoDB: ${connectionString.replace(/\/\/([^:]+):[^@]+@/, '//***:***@')}`);
    
    // Connect to database
    const connection = await mongoose.connect(connectionString, options);
    
    // Setup global mongoose options
    mongoose.set('strictQuery', true); // Strict mode for queries
    
    console.log(`MongoDB Connected: ${connection.connection.host} (${connection.connection.name})`);
    
    // Add connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });
    
    // If Node process ends, close the mongoose connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });
    
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    // Exit process with failure if this is a critical error
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB servers. Exiting process...');
      process.exit(1);
    }
    
    // For other errors, just log and continue (mongoose will retry)
    return null;
  }
};

export default connectDatabase; 