// User profile management functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Update user data
exports.updateUserData = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { profile = {} } = req.data;

  if (!uid) throw new Error("Unauthenticated");

  const userRef = admin.firestore().doc(`users/${uid}`);
  const updates = {};

  // Merge profile fields
  if (Object.keys(profile).length > 0) {
    for (const key in profile) {
      updates[`profile.${key}`] = profile[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No valid fields to update.");
  }

  try {
    await userRef.update(updates);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to update user ${uid}:`, error);
    throw new Error("Failed to update user data.");
  }
});

// Get onboarding status
exports.getOnboardingStatus = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const userRef = admin.firestore().doc(`users/${uid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const data = userSnap.data();
  const onboardingComplete = data?.profile?.onboardingComplete || false;

  return { onboardingComplete };
});

// Get user profile
exports.getProfile = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Create default profile for new users
      const defaultProfile = {
        name: "User",
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        avoidanceZonesEnabled: false,
        xp: 0
      };

      await userRef.set({ profile: defaultProfile });
      return { profile: defaultProfile };
    }

    const profile = userSnap.get("profile") || {};
    return { profile };
  } catch (error) {
    console.error(`❌ Failed to get/create profile for UID: ${uid}`, error);
    throw new Error("Failed to get profile data");
  }
}); 