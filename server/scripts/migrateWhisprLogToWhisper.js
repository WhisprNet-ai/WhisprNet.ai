/**
 * Migration script to consolidate WhisprLog data into Whisper model
 * 
 * This script:
 * 1. Connects to the database
 * 2. Finds all WhisprLog entries
 * 3. Creates or updates corresponding Whisper entries
 * 4. (Optional) Can remove the WhisprLog collection when done
 * 
 * Usage: 
 * node server/scripts/migrateWhisprLogToWhisper.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Whisper from '../models/Whisper.js';
import WhisprLog from '../models/WhisprLog.js';

/**
 * Map WhisprLog priority to Whisper priority (numeric)
 * @param {string} priorityString - String priority from WhisprLog
 * @returns {number} - Numeric priority for Whisper
 */
function mapPriorityToNumeric(priorityString) {
  switch (priorityString) {
    case 'critical':
      return 1;
    case 'high':
      return 2;
    case 'medium':
      return 3;
    case 'low':
      return 4;
    default:
      return 3; // Default to medium
  }
}

/**
 * Map WhisprLog category to Whisper category
 * @param {string} category - Category from WhisprLog
 * @returns {string} - Category for Whisper
 */
function mapCategory(category) {
  switch (category) {
    case 'suggestion':
      return 'improvement';
    case 'warning':
      return 'health';
    case 'insight':
      return 'collaboration';
    case 'alert':
      return 'health';
    default:
      return 'improvement';
  }
}

/**
 * Main migration function
 */
async function migrateData() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${process.env.MONGO_URI || 'mongodb://localhost:27017/whisprnet'}`);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/whisprnet');
    console.log('Connected to MongoDB');

    // Get all WhisprLog entries
    const whisprLogs = await WhisprLog.find();
    console.log(`Found ${whisprLogs.length} WhisprLog entries to migrate`);

    // Process each WhisprLog entry
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const log of whisprLogs) {
      try {
        // Use existing whisper ID or generate a new one
        const whisperIdToUse = log.whisperId || `whspr_${Date.now()}${Math.floor(Math.random() * 10000)}`;

        // Try to find an existing Whisper with the same message and organization
        let existingWhisper = await Whisper.findOne({
          $or: [
            { organizationId: log.organization, 'content.message': log.message },
            { whisperId: log.whisperId }
          ]
        });

        if (existingWhisper) {
          // Update the existing Whisper with the normalized structure
          existingWhisper.status = log.delivered ? 'delivered' : 'pending';
          existingWhisper.delivered = log.delivered;
          existingWhisper.channel = log.channel;
          existingWhisper.priority = mapPriorityToNumeric(log.priority);
          
          // Update content if it's a real update
          if (log.message && log.message !== existingWhisper.content?.message) {
            existingWhisper.content = {
              ...existingWhisper.content,
              message: log.message,
              suggestedActions: log.suggestedActions || []
            };
          }
          
          // Save the changes
          await existingWhisper.save();
          updated++;
          console.log(`Updated existing Whisper: ${existingWhisper.whisperId}`);
        } else {
          // Create a new Whisper with the normalized structure
          const newWhisper = new Whisper({
            whisperId: whisperIdToUse,
            organizationId: log.organization,
            title: 'Migrated ' + (log.category || 'Insight'),
            category: mapCategory(log.category),
            priority: mapPriorityToNumeric(log.priority),
            content: {
              message: log.message,
              suggestedActions: log.suggestedActions || []
            },
            status: log.delivered ? 'delivered' : 'pending',
            delivered: log.delivered,
            channel: log.channel,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt || log.createdAt
          });

          await newWhisper.save();
          created++;
          console.log(`Created new Whisper: ${whisperIdToUse}`);
        }
      } catch (err) {
        console.error(`Error processing WhisprLog ${log._id}:`, err);
        errors++;
      }
    }

    console.log('Migration complete:');
    console.log(`- Created: ${created}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Errors: ${errors}`);
    console.log(`- Total processed: ${whisprLogs.length}`);

    // (Optional) Rename the old collection rather than deleting it
    // This keeps the data but makes it inaccessible to the application
    console.log('Renaming WhisprLog collection to WhisprLog_backup...');
    await mongoose.connection.db.collection('whisprlogs').rename('whisprlogs_backup');
    console.log('WhisprLog collection renamed.');
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateData().catch(console.error); 