// Contact management functions
const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Add a new contact
exports.addContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { 
    name, 
    phone, 
    relationship, 
    closenessRating, 
    supportType, 
    lastContacted, 
    priorityTag, 
    contactFrequency,
  } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!name || typeof name !== "string") throw new Error("Invalid name");
  if (!phone || typeof phone !== "string") throw new Error("Invalid phone number");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc();

  const newContact = {
    name,
    phone,
    relationship,
    closenessRating,
    supportType,
    lastContacted,
    priorityTag,
    contactFrequency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await contactRef.set(newContact);

  return { success: true, id: contactRef.id };
});

// Get all contacts for a user
exports.getContacts = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;

  if (!uid) {
    throw new Error("Unauthenticated");
  }

  try {
    const contactsRef = admin
      .firestore()
      .collection("users")
      .doc(uid)
      .collection("contacts");

    const snapshot = await contactsRef.get();

    const contacts = snapshot.docs.map((doc) => {
      const data = doc.data();
      const { closenessRating, ...publicData } = data; // Hide sensitive field
      return { id: doc.id, ...publicData };
    });

    return { success: true, contacts };
  } catch (error) {
    console.error("Failed to get contacts:", error);
    throw new Error("Failed to get contacts");
  }
});

// Update a contact
exports.updateContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId, updates } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId || typeof contactId !== "string") throw new Error("Invalid contact ID");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  await contactRef.update(updates);

  return { success: true };
});

// Delete a contact
exports.deleteContact = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  await contactRef.delete();

  return { success: true };
});

// Track contact interaction
exports.trackContactInteraction = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId, interactionType, timestamp } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");
  if (!interactionType || !["call", "text"].includes(interactionType)) {
    throw new Error("Invalid interaction type");
  }

  const contactRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId);

  const interactionRef = contactRef.collection('interactions').doc();

  const interaction = {
    type: interactionType,
    timestamp: timestamp || new Date().toISOString(),
  };

  await Promise.all([
    // Add the interaction
    interactionRef.set(interaction),
    // Update the contact's lastContacted field
    contactRef.update({
      lastContacted: interaction.timestamp,
    })
  ]);

  return { success: true, id: interactionRef.id };
});

// Get contact interactions
exports.getContactInteractions = onCall({ cors: true }, async (req) => {
  const uid = req.auth?.uid;
  const { contactId } = req.data;

  if (!uid) throw new Error("Unauthenticated");
  if (!contactId) throw new Error("Missing contact ID");

  const interactionsRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('contacts')
    .doc(contactId)
    .collection('interactions');

  const snapshot = await interactionsRef
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const interactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { success: true, interactions };
}); 