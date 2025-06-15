// Authentication related functions
const { auth } = require("firebase-functions/v1");
const admin = require("firebase-admin");

// Create user data when a new user is created
exports.createUserData = auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const name = user.displayName || "User";

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.set({
      profile: {
        name,
        createdAt: new Date(),
        onboardingComplete: false,
        avoidanceZonesEnabled: false,
        xp: 0
      }
    });

    // Create empty collections
    const collections = [
      'journals',
      'moodEntries',
      'outdoor_activities',
      'avoidanceZones',
      'moodProgress'
    ];

    // Create a dummy document in each collection to initialize it
    // This document will be deleted immediately after creation
    for (const collectionName of collections) {
      const dummyDocRef = userRef.collection(collectionName).doc('init');
      await dummyDocRef.set({ init: true });
      await dummyDocRef.delete();
    }

    // Add a welcome journal entry
    const journalRef = userRef.collection("journals").doc();
    await journalRef.set({
      text: "Welcome to Bounce Back! This is your first journal entry.",
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Created profile + collections for UID: ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to create user data for UID: ${uid}`, error);
    throw new Error(`Failed to create user data: ${error.message}`);
  }
}); 