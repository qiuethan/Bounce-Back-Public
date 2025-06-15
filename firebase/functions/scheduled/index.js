// Scheduled functions (cron jobs and pub/sub)
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onMessagePublished } = require("firebase-functions/v2/pubsub");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

// Scheduled chore reset - runs daily at midnight
exports.scheduledChoreReset = onSchedule("0 0 * * *", async (event) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const choresRef = admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('chores');
      
      const choresSnapshot = await choresRef.get();
      const now = new Date();
      
      for (const choreDoc of choresSnapshot.docs) {
        const chore = choreDoc.data();
        if (!chore.isCompleted || !chore.lastCompleted) continue;
        
        const lastCompleted = new Date(chore.lastCompleted);
        let shouldReset = false;
        
        switch (chore.frequency) {
          case 'day':
            // Reset if it's a new day (past midnight)
            shouldReset = now.getDate() !== lastCompleted.getDate() ||
                         now.getMonth() !== lastCompleted.getMonth() ||
                         now.getFullYear() !== lastCompleted.getFullYear();
            break;
          case 'week':
            // Reset if more than 7 days have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            // Reset if we're in a different month
            shouldReset = now.getMonth() !== lastCompleted.getMonth() ||
                         now.getFullYear() !== lastCompleted.getFullYear();
            break;
          case 'year':
            // Reset if we're in a different year
            shouldReset = now.getFullYear() !== lastCompleted.getFullYear();
            break;
        }
        
        if (shouldReset) {
          await choreDoc.ref.update({
            isCompleted: false,
            lastCompleted: null
          });
          
          console.log(`Reset chore ${choreDoc.id} for user ${uid}`);
        }
      }
    }
    
    console.log('Completed daily chore reset check');
    return null;
  } catch (error) {
    console.error('Failed to reset chores:', error);
    return null;
  }
});

// Pub/Sub chore reset - triggered by message
exports.resetChores = onMessagePublished("daily-chore-reset", async (event) => {
  try {
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const uid = userDoc.id;
      const choresRef = admin
        .firestore()
        .collection('users')
        .doc(uid)
        .collection('chores');
      
      const choresSnapshot = await choresRef.get();
      const now = new Date();
      
      for (const choreDoc of choresSnapshot.docs) {
        const chore = choreDoc.data();
        if (!chore.isCompleted || !chore.lastCompleted) continue;
        
        const lastCompleted = new Date(chore.lastCompleted);
        let shouldReset = false;
        
        switch (chore.frequency) {
          case 'day':
            // Reset if more than 24 hours have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 24 * 60 * 60 * 1000;
            break;
          case 'week':
            // Reset if more than 7 days have passed
            shouldReset = (now.getTime() - lastCompleted.getTime()) > 7 * 24 * 60 * 60 * 1000;
            break;
          case 'month':
            // Reset if we're in a different month or more than 30 days have passed
            shouldReset = (
              now.getMonth() !== lastCompleted.getMonth() ||
              (now.getTime() - lastCompleted.getTime()) > 30 * 24 * 60 * 60 * 1000
            );
            break;
          case 'year':
            // Reset if we're in a different year
            shouldReset = now.getFullYear() !== lastCompleted.getFullYear();
            break;
        }
        
        if (shouldReset) {
          await choreDoc.ref.update({
            isCompleted: false,
            lastCompleted: null
          });
          
          logger.info(`Reset chore ${choreDoc.id} for user ${uid}`);
        }
      }
    }
    
    logger.info('Completed chore reset check');
    return null;
  } catch (error) {
    logger.error('Failed to reset chores:', error);
    return null;
  }
}); 