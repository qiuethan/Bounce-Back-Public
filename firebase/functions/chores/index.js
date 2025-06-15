// Chore management functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Add a new chore
exports.addChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { name, description, frequency, importance, icon } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!name || typeof name !== "string") throw new Error("Invalid name");
  if (!frequency || !['day', 'week', 'month', 'year'].includes(frequency)) {
    throw new Error("Invalid frequency");
  }
  if (!importance || !['low', 'medium', 'high'].includes(importance)) {
    throw new Error("Invalid importance");
  }

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc();

  const newChore = {
    name,
    description: description || '',
    frequency,
    importance,
    icon: icon || 'list-outline',
    isCompleted: false,
    createdAt: new Date().toISOString(),
    completionCount: 0,
  };

  await choreRef.set(newChore);

  return { success: true, id: choreRef.id };
});

// Get all chores for a user
exports.getChores = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("Unauthenticated");

  const choresRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores');

  const snapshot = await choresRef.get();
  const chores = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { chores };
});

// Get chore progress data
exports.getChoreProgress = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { timeRange = 'week' } = req.data || {};

  if (!uid) throw new Error("Unauthenticated");

  const now = new Date();
  let startDate;

  // Calculate date range based on timeRange parameter
  switch (timeRange) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to week
  }

  try {
    const userRef = admin.firestore().doc(`users/${uid}`);
    const choresRef = userRef.collection('chores');
    const snapshot = await choresRef.get();

    const chores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate progress statistics
    const totalChores = chores.length;
    const completedChores = chores.filter(chore => 
      chore.isCompleted && 
      chore.lastCompleted && 
      new Date(chore.lastCompleted) >= startDate
    ).length;

    const completionRate = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;

    // Group by importance
    const byImportance = {
      high: chores.filter(c => c.importance === 'high').length,
      medium: chores.filter(c => c.importance === 'medium').length,
      low: chores.filter(c => c.importance === 'low').length
    };

    // Group by frequency
    const byFrequency = {
      day: chores.filter(c => c.frequency === 'day').length,
      week: chores.filter(c => c.frequency === 'week').length,
      month: chores.filter(c => c.frequency === 'month').length,
      year: chores.filter(c => c.frequency === 'year').length
    };

    // Calculate completion trends
    const completedInTimeRange = chores.filter(chore => 
      chore.lastCompleted && 
      new Date(chore.lastCompleted) >= startDate
    );

    const progress = {
      totalChores,
      completedChores,
      completionRate: Math.round(completionRate * 100) / 100,
      pendingChores: totalChores - completedChores,
      byImportance,
      byFrequency,
      timeRange,
      completedInTimeRange: completedInTimeRange.length,
      averageCompletionCount: chores.length > 0 ? 
        chores.reduce((sum, chore) => sum + (chore.completionCount || 0), 0) / chores.length : 0
    };

    return { success: true, progress };
  } catch (error) {
    console.error(`❌ Failed to get chore progress for UID: ${uid}`, error);
    throw new Error("Failed to get chore progress");
  }
});

// Delete a chore
exports.deleteChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  await choreRef.delete();
  return { success: true };
});

// Complete a chore
exports.completeChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  const chore = await choreRef.get();
  if (!chore.exists) throw new Error("Chore not found");

  const currentCount = chore.data().completionCount || 0;
  await choreRef.update({
    isCompleted: true,
    lastCompleted: new Date().toISOString(),
    completionCount: currentCount + 1
  });

  return { success: true };
});

// Uncomplete a chore
exports.uncompleteChore = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { choreId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!choreId) throw new Error("Missing chore ID");

  const choreRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('chores')
    .doc(choreId);

  const chore = await choreRef.get();
  if (!chore.exists) throw new Error("Chore not found");

  const currentCount = chore.data().completionCount || 0;
  await choreRef.update({
    isCompleted: false,
    lastCompleted: null,
    completionCount: Math.max(0, currentCount - 1)
  });

  return { success: true };
}); 