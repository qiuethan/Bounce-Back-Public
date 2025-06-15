// Data management and privacy functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Get available data types for user data export/deletion
exports.getDataTypes = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  // Define data types on the server side
  const dataTypes = [
    { id: 'activities', label: 'Activity History', icon: 'fitness-outline' },
    { id: 'avoidanceZones', label: 'Avoidance Zones', icon: 'ban-outline' },
    { id: 'chores', label: 'Chore History', icon: 'checkbox-outline' },
    { id: 'journals', label: 'Journal Entries', icon: 'book-outline' },
    { id: 'moodEntries', label: 'Mood Entries', icon: 'happy-outline' },
    { id: 'contacts', label: 'Support Contacts', icon: 'people-outline' },
    { id: 'progressSnapshots', label: 'Progress Snapshots', icon: 'stats-chart-outline' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  return { dataTypes };
});

// Delete user data for specific collections
exports.deleteUserData = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { collections } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!collections || !Array.isArray(collections)) {
    throw new Error("Invalid collections parameter");
  }

  // Define allowed collections on the server side
  const allowedCollections = [
    'activities',
    'moodEntries',
    'journals',
    'chores',
    'avoidanceZones',
    'contacts',
    'progressSnapshots'
  ];

  // Validate collections
  const invalidCollections = collections.filter(col => !allowedCollections.includes(col));
  if (invalidCollections.length > 0) {
    throw new Error(`Invalid collections: ${invalidCollections.join(', ')}`);
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const batch = admin.firestore().batch();

    for (const collection of collections) {
      const collectionRef = userRef.collection(collection);
      const docs = await collectionRef.get();
      
      docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to delete user data for UID: ${uid}`, error);
    throw new Error("Failed to delete user data");
  }
}); 