// Avoidance zones management functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Toggle avoidance zones feature
exports.toggleAvoidanceZones = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { enabled } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (typeof enabled !== "boolean") throw new Error("Invalid value for enabled");

  const userRef = admin.firestore().doc(`users/${uid}`);
  await userRef.update({
    "profile.avoidanceZonesEnabled": enabled,
  });

  return { success: true };
});

// Add a new avoidance zone
exports.addAvoidanceZone = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { label, lat, lng, radius } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!label || typeof label !== "string") throw new Error("Invalid label");
  if (!lat || !lng) throw new Error("Invalid coordinates");
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Coordinates must be numbers");
  }

  const avoidanceZoneRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones')
    .doc();

  const newEntry = {
    label,
    coordinates: {
      lat,
      lng,
    },
    radius: radius
  };

  await avoidanceZoneRef.set(newEntry);

  return { success: true, id: avoidanceZoneRef.id };
});

// Delete an avoidance zone
exports.deleteAvoidanceZone = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { zoneId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!zoneId) throw new Error("Missing zone ID");

  const zoneRef = admin.firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones')
    .doc(zoneId);

  await zoneRef.delete();

  return { success: true };
});

// Get all avoidance zones for a user
exports.getAvoidanceZones = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;

  if (!uid) throw new Error("Unauthenticated");

  const zonesRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('avoidanceZones');

  const snapshot = await zonesRef.get();

  const zones = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { zones };
}); 