import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { httpsCallable } from "firebase/functions";
import * as Contacts from "expo-contacts";

import COLORS from "../../../constants/colors";
import DropdownModal from "../DropdownModal";
import { FIREBASE_FUNCTIONS } from "../../../../FirebaseConfig";

const relationshipOptions = [
  "Friend", "Family", "Parent", "Sibling", "Partner", "Therapist", "Doctor", "Coworker", "Mentor", "Other",
];
const supportTypeOptions = [
  "Listens", "Distracts", "Advises", "Checks In", "Calms Me Down", "Encourages Me", "Other",
];
const closenessRatingOptions = ["1", "2", "3", "4", "5"];
const contactFrequencyOptions = ["Daily", "Weekly", "Monthly", "Rarely"];
const priorityTagOptions = ["High", "Medium", "Low"];

const updateContact = httpsCallable(FIREBASE_FUNCTIONS, "updateContact");

export default function EditContact() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const [name, setName] = useState(params.name || "");
  const [phone, setPhone] = useState(params.phone || "");
  const [relationship, setRelationship] = useState(params.relationship || "");
  const [supportType, setSupportType] = useState(
    typeof params.supportType === "string"
      ? params.supportType.split(",")
      : params.supportType || []
  );
  const [closenessRating, setClosenessRating] = useState(params.closenessRating || "");
  const [contactFrequency, setContactFrequency] = useState(params.contactFrequency || "");
  const [priorityTag, setPriorityTag] = useState(params.priorityTag || "");

  const [dropdownType, setDropdownType] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name) return Alert.alert("Name is required.");

    try {
      setLoading(true);

      const rawUpdates = {
        name,
        phone,
        relationship,
        supportType,
        closenessRating,
        contactFrequency,
        priorityTag,
      };

      const updates = Object.fromEntries(
        Object.entries(rawUpdates).filter(([_, v]) =>
          v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
        )
      );

      await updateContact({
        contactId: params.contactId,
        updates,
      });

      setLoading(false);
      router.back();
    } catch (err) {
      console.error("Update contact error:", err);
      Alert.alert("Error", "Failed to update contact.");
      setLoading(false);
    }
  };

  const openContactModal = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please grant contacts access.");
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });
    const withPhones = data.filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0);
    setContactList(withPhones);
    setContactModalVisible(true);
  };

  const selectContact = (contact) => {
    setName(contact.name);
    setPhone(contact.phoneNumbers[0].number);
    setContactModalVisible(false);
  };

  const openDropdown = (type) => {
    setDropdownType(type);
    setDropdownVisible(true);
  };

  const selectDropdownOption = (value) => {
    if (dropdownType === "supportType") {
      setSupportType((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else if (dropdownType === "relationship") {
      setRelationship(value);
      setDropdownVisible(false);
    } else if (dropdownType === "closeness") {
      setClosenessRating(value);
      setDropdownVisible(false);
    } else if (dropdownType === "frequency") {
      setContactFrequency(value);
      setDropdownVisible(false);
    } else if (dropdownType === "priority") {
      setPriorityTag(value);
      setDropdownVisible(false);
    }
  };

  const currentOptions = {
    relationship: relationshipOptions,
    supportType: supportTypeOptions,
    closeness: closenessRatingOptions,
    frequency: contactFrequencyOptions,
    priority: priorityTagOptions,
  }[dropdownType] || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Support Contact</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <TouchableOpacity style={styles.importButton} onPress={openContactModal}>
          <Text style={styles.importButtonText}>📇 Choose from Phone Contacts</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="(555) 123-4567"
          placeholderTextColor={COLORS.textMuted}
        />

        <Text style={styles.label}>Relationship</Text>
        <TouchableOpacity style={styles.input} onPress={() => openDropdown("relationship")}>
          <Text style={{ color: relationship ? COLORS.textDark : COLORS.textMuted }}>
            {relationship || "Select a relationship..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Support Type</Text>
        <TouchableOpacity style={styles.input} onPress={() => openDropdown("supportType")}>
          <Text style={{ color: supportType.length > 0 ? COLORS.textDark : COLORS.textMuted }}>
            {supportType.length > 0 ? supportType.join(", ") : "Select support types..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Closeness Rating (1-5)</Text>
        <TouchableOpacity style={styles.input} onPress={() => openDropdown("closeness")}>
          <Text style={{ color: closenessRating ? COLORS.textDark : COLORS.textMuted }}>
            {closenessRating || "Choose closeness rating..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Contact Frequency</Text>
        <TouchableOpacity style={styles.input} onPress={() => openDropdown("frequency")}>
          <Text style={{ color: contactFrequency ? COLORS.textDark : COLORS.textMuted }}>
            {contactFrequency || "Select frequency..."}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Priority</Text>
        <TouchableOpacity style={styles.input} onPress={() => openDropdown("priority")}>
          <Text style={{ color: priorityTag ? COLORS.textDark : COLORS.textMuted }}>
            {priorityTag || "Select priority..."}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <TouchableOpacity style={styles.button}>
            <ActivityIndicator color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Contact</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <DropdownModal
        visible={dropdownVisible}
        options={currentOptions}
        onSelect={selectDropdownOption}
        onClose={() => setDropdownVisible(false)}
        multiSelect={dropdownType === "supportType"}
        selectedValues={dropdownType === "supportType" ? supportType : []}
      />

      <Modal visible={contactModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Contact</Text>
            <TouchableOpacity onPress={() => setContactModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={COLORS.textMuted}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
          <FlatList
            data={contactList
              .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .sort((a, b) => a.name.localeCompare(b.name))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.contactItem} onPress={() => selectContact(item)}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactNumber}>{item.phoneNumbers[0].number}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  iconButton: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'center',
  },
  form: { paddingHorizontal: 24, paddingBottom: 40 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  importButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  importButtonText: {
    color: COLORS.textDark,
    fontWeight: "600",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    marginHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "600", color: COLORS.textDark },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderColor: COLORS.border,
    borderWidth: 1,
    padding: 10,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactName: { fontSize: 16, fontWeight: "500", color: COLORS.textDark },
  contactNumber: { fontSize: 14, color: COLORS.textMuted },
});
