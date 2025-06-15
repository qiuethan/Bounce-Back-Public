// Activity tracking functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Start workout or outdoor activity
exports.startWorkout = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { type = 'workout' } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!['workout', 'outdoor_activity'].includes(type)) {
    throw new Error("Invalid activity type");
  }

  try {
    const workoutRef = await admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .add({
        type,
        startTime: new Date().toISOString(),
        status: 'active',
        duration: 0,
        xpGained: 0,
        ...(type === 'outdoor_activity' ? {
          locations: [],
          distance: 0,
        } : {}),
      });

    return {
      success: true,
      workoutId: workoutRef.id,
    };
  } catch (error) {
    console.error(`❌ Failed to start ${type} for UID: ${uid}`, error);
    throw new Error(`Failed to start ${type} tracking.`);
  }
});

// End workout or outdoor activity
exports.endWorkout = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { workoutId, duration, type = 'workout', distance, xpGained, locations, finalPath } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!workoutId || duration === undefined) throw new Error("Workout ID and duration are required");
  if (!['workout', 'outdoor_activity'].includes(type)) {
    throw new Error("Invalid activity type");
  }

  try {
    const workoutRef = admin.firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .doc(workoutId);
    
    const workout = await workoutRef.get();

    if (!workout.exists) throw new Error("Workout not found");
    if (workout.data().type !== type) throw new Error("Invalid activity type");

    // Calculate XP if not provided (for indoor workouts)
    const finalXP = xpGained || Math.floor(duration / 60);

    // Update workout with final data
    await workoutRef.update({
      endTime: new Date().toISOString(),
      duration: duration,
      status: 'completed',
      xpGained: finalXP,
      ...(type === 'outdoor_activity' ? {
        distance: distance || 0,
        locations: locations || [],
        finalPath: finalPath || [],
      } : {}),
    });

    // Update user's XP in their profile
    const userRef = admin.firestore().doc(`users/${uid}`);
    await userRef.update({
      'profile.xp': admin.firestore.FieldValue.increment(finalXP),
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to end ${type} for UID: ${uid}`, error);
    throw new Error(`Failed to end ${type}.`);
  }
});

// Get user activities
exports.getActivities = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  try {
    const activitiesRef = admin
      .firestore()
      .collection('users')
      .doc(uid)
      .collection('activities')
      .orderBy('startTime', 'desc');

    const snapshot = await activitiesRef.get();
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      activities
    };
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw new Error('Failed to fetch activities');
  }
}); 