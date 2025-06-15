import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { httpsCallable } from "firebase/functions";

import COLORS from "../../constants/colors";
import ZoneCard from "./ShowZones/ZoneCard";

import { FIREBASE_FUNCTIONS } from "../../../FirebaseConfig";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";

import * as Location from "expo-location";
import { Linking, Platform } from 'react-native';

const Avoidance = () => {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);


  const navigation = useNavigation();

  const loadZones = async () => {
    setLoading(true);
    try {
      const getAvoidanceZones = httpsCallable(FIREBASE_FUNCTIONS, "getAvoidanceZones");
      const result = await getAvoidanceZones();
      setZones(result.data.zones || []);
    } catch (err) {
      console.error("Failed to fetch zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (zoneId) => {
    Alert.alert(
      "Delete Zone",
      `Are you sure you want to delete this zone?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteZone(zoneId),
        },
      ]
    );
  };

  const handleDeleteZone = async (zoneId) => {
    try {
      const deleteZone = httpsCallable(FIREBASE_FUNCTIONS, "deleteAvoidanceZone");
      await deleteZone({ zoneId });
      loadZones();
    } catch (err) {
      console.error("Failed to delete zone:", err);
      Alert.alert("Error", "Could not delete the zone.");
    }
  };

  const loadToggleStatus = async () => {
    try {
      const getProfile = httpsCallable(FIREBASE_FUNCTIONS, "getProfile");
      const result = await getProfile();
      setEnabled(result.data.profile?.avoidanceZonesEnabled || false);
    } catch (err) {
      console.error("Failed to load toggle state:", err);
    }
  };

  const handleToggle = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Access Needed",
          "Enable location services to use avoidance zones.",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      setToggling(true);
      const toggleAvoidance = httpsCallable(FIREBASE_FUNCTIONS, "toggleAvoidanceZones");
      await toggleAvoidance({ enabled: !enabled });
      setEnabled((prev) => !prev);
    } catch (err) {
      console.error("Failed to toggle:", err);
      Alert.alert("Error", "Could not update setting.");
    } finally {
      setToggling(false);
    }
  };


  useFocusEffect(
    useCallback(() => {
      loadToggleStatus();
      loadZones();
    }, [])
  );

  const renderZone = ({ item }) => (
    <View style={styles.zoneCard}>
      <View style={styles.zoneContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.zoneLabel}>{item.label}</Text>
          <Text style={styles.zoneDetails}>
            📍 Lat: {item.coordinates.lat.toFixed(3)}, Lng: {item.coordinates.lng.toFixed(3)}
          </Text>
          <Text style={styles.zoneDetails}>📏 Radius: {item.radius} m</Text>
        </View>
        <TouchableOpacity onPress={() => confirmDelete(item.id, item.label)}>
          <Ionicons name="trash-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Avoidance Zones</Text>

          <TouchableOpacity onPress={() => {router.push("./AddZone/AddAvoidance")}} style={styles.iconButton}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Avoidance Zones Enabled</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          thumbColor={enabled ? COLORS.primary : "#ccc"}
          trackColor={{ false: "#eee", true: COLORS.primaryLight }}
          disabled={toggling}
        />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.primary} />
      ) : zones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>Avoid places that hurt.</Text>
          <Text style={styles.subtitle}>
            Set zones to stay away from locations that may hurt you.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("./AddZone/AddAvoidance")}
          >
            <Text style={styles.buttonText}>+ Add Avoidance Zone</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ZoneCard zone={item} onDelete={confirmDelete} />
          )}
          contentContainerStyle={{ paddingVertical: 20, marginHorizontal: 16 }}
        />
      )}
    </SafeAreaView>
  );
};

export default Avoidance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    flex: 1,
    textAlign: "center",
  },
  iconButton: {
    padding: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.textDark,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  zoneCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  zoneContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  zoneLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  zoneDetails: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
