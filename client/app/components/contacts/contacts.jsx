import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Linking,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { httpsCallable } from "firebase/functions";

import COLORS from "../../constants/colors";
import { FIREBASE_FUNCTIONS } from "../../../FirebaseConfig";

const getContacts = httpsCallable(FIREBASE_FUNCTIONS, "getContacts");
const deleteContact = httpsCallable(FIREBASE_FUNCTIONS, "deleteContact");
const trackContactInteraction = httpsCallable(FIREBASE_FUNCTIONS, 'trackContactInteraction');

export default function Contacts() {
  const router = useRouter();
  const navigation = useNavigation();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("name"); // or "priority"

  const loadContacts = async () => {
    setLoading(true);
    try {
      const result = await getContacts();
      setContacts(result.data.contacts || []);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact({ contactId: id });
              loadContacts(); // Refresh list
            } catch (err) {
              console.error("Failed to delete contact:", err);
              Alert.alert("Error", "Could not delete contact.");
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const handleContactPress = (item) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Edit", "Text", "Call"],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            navigateToEdit(item);
          } else if (buttonIndex === 2 && item.phone) {
            try {
              await trackContactInteraction({
                contactId: item.id,
                interactionType: 'text',
              });
              Linking.openURL(`sms:${item.phone}`);
            } catch (error) {
              console.error('Failed to track text interaction:', error);
              // Still open SMS even if tracking fails
              Linking.openURL(`sms:${item.phone}`);
            }
          } else if (buttonIndex === 3 && item.phone) {
            try {
              await trackContactInteraction({
                contactId: item.id,
                interactionType: 'call',
              });
              Linking.openURL(`tel:${item.phone}`);
            } catch (error) {
              console.error('Failed to track call interaction:', error);
              // Still make the call even if tracking fails
              Linking.openURL(`tel:${item.phone}`);
            }
          } else if (buttonIndex > 1 && !item.phone) {
            Alert.alert("No phone number", "This contact has no phone number.");
          }
        }
      );
    } else {
      // For Android, we'll show a custom modal with options
      Alert.alert(
        item.name,
        "What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Edit",
            onPress: () => navigateToEdit(item),
          },
          {
            text: "Text",
            onPress: async () => {
              if (!item.phone) {
                Alert.alert("No phone number", "This contact has no phone number.");
                return;
              }
              try {
                await trackContactInteraction({
                  contactId: item.id,
                  interactionType: 'text',
                });
                Linking.openURL(`sms:${item.phone}`);
              } catch (error) {
                console.error('Failed to track text interaction:', error);
                Linking.openURL(`sms:${item.phone}`);
              }
            },
          },
          {
            text: "Call",
            onPress: async () => {
              if (!item.phone) {
                Alert.alert("No phone number", "This contact has no phone number.");
                return;
              }
              try {
                await trackContactInteraction({
                  contactId: item.id,
                  interactionType: 'call',
                });
                Linking.openURL(`tel:${item.phone}`);
              } catch (error) {
                console.error('Failed to track call interaction:', error);
                Linking.openURL(`tel:${item.phone}`);
              }
            },
          },
        ]
      );
    }
  };

  const navigateToEdit = (item) => {
    router.push({
      pathname: "./EditContact/EditContact",
      params: {
        contactId: item.id,
        name: item.name,
        phone: item.phone,
        relationship: item.relationship,
        supportType: item.supportType?.join(","),
        closenessRating: item.closenessRating,
        contactFrequency: item.contactFrequency,
        priorityTag: item.priorityTag,
      },
    });
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity onPress={() => handleContactPress(item)}>
      <View style={styles.contactCard}>
        {item.priorityTag && (
          <View
            style={[styles.priorityStripe, styles[`priority${item.priorityTag}`]]}
          />
        )}
        <View style={{ flex: 1, padding: 16 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.contactName}>{item.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {item.priorityTag && (
                <Text
                  style={[
                    styles.priorityTagLabel,
                    styles[`priority${item.priorityTag}`],
                  ]}
                >
                  {item.priorityTag}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.contactRelationship}>{item.relationship}</Text>

          {item.supportType?.length > 0 && (
            <Text style={styles.contactDetail}>
              🛟{" "}
              {Array.isArray(item.supportType)
                ? `${item.supportType.slice(0, 2).join(", ")}${
                    item.supportType.length > 2 ? ", ..." : ""
                  }`
                : item.supportType}
            </Text>
          )}

          <View style={styles.cardRow}>
            {item.phone && (
              <Text style={styles.contactDetail}>📞 {item.phone}</Text>
            )}
            {item.contactFrequency && (
              <Text style={styles.contactDetail}>
                📅 {item.contactFrequency}
              </Text>
            )}
          </View>

          {item.lastContacted && (
            <Text style={styles.contactDetail}>
              🕒 Last contacted: {new Date(item.lastContacted).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Support Contacts</Text>

        <TouchableOpacity onPress={() => router.push("./AddContact/AddContact")} style={styles.iconButton}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {contacts.length > 0 && (
        <View style={styles.bar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() =>
              setSortMode((prev) => (prev === "name" ? "priority" : "name"))
            }
          >
            <Ionicons
              name={sortMode === "name" ? "list-outline" : "flame-outline"}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.sortText}>
              {sortMode === "name" ? "Name" : "Priority"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.primary} />
      ) : contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>No contacts yet.</Text>
          <Text style={styles.subtitle}>
            Add people you trust to call, message, or meet when you're feeling low.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("./AddContact/AddContact")}
          >
            <Text style={styles.buttonText}>+ Add Support Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contacts
            .filter((c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
              if (sortMode === "priority") {
                const p = { High: 0, Medium: 1, Low: 2 };
                return (p[a.priorityTag] ?? 3) - (p[b.priorityTag] ?? 3);
              }
              return a.name.localeCompare(b.name);
            })}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={{ paddingBottom: 20, marginHorizontal: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    marginVertical: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 16,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    marginTop: -50,
  },
  contactCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: { fontSize: 18, fontWeight: "600", color: COLORS.textDark },
  contactRelationship: { fontSize: 14, color: COLORS.textMuted },
  cardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 6,
  },
  contactDetail: { fontSize: 13, color: COLORS.textDark, marginTop: 2 },
  priorityTagLabel: {
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    overflow: "hidden",
    textTransform: "uppercase",
    marginLeft: 8,
  },
  priorityHigh: { backgroundColor: COLORS.priorityHighBg },
  priorityMedium: { backgroundColor: COLORS.priorityMediumBg },
  priorityLow: { backgroundColor: COLORS.priorityLowBg },
  noPriority: { backgroundColor: COLORS.primaryExtraLight },
  priorityStripe: {
    width: 4,
    backgroundColor: COLORS.priorityLowBg,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textDark,
    marginRight: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryExtraLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
  },
});
