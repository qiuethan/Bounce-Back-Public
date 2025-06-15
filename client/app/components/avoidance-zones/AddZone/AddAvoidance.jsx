import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import axios from "axios";
import * as Location from "expo-location";

import AvoidanceMap from "./AvoidanceMapSearch";
import SearchBar from "./SearchBar";
import COLORS from "../../../constants/colors";
import { GOOGLE_API_KEY } from "@env";

import { httpsCallable } from "firebase/functions";
import { FIREBASE_FUNCTIONS } from "../../../../FirebaseConfig";
import { set } from "lodash";

const addAvoidanceZone = httpsCallable(FIREBASE_FUNCTIONS, "addAvoidanceZone");

const AddAvoidance = () => {
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, radius: 50 });
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const userLoc = await requestLocationAccess();
      if (userLoc) {
        setLocation({ latitude: userLoc.latitude, longitude: userLoc.longitude, radius: 50 });
        fetchAddress(userLoc.latitude, userLoc.longitude);
      }
    })();
  }, []);

  const requestLocationAccess = async () => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

    if (status === "granted") {
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }

    if (canAskAgain) {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    }

    Alert.alert(
      "Location Access Needed",
      "Please enable location access in your settings to improve search results.",
      [
        {
          text: "Open Settings",
          onPress: () => {
            if (Platform.OS === "ios") {
              Linking.openURL("app-settings:");
            } else {
              Linking.openSettings();
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );

    return null;
  };

  const pickLocation = (coordinate) => {
    setLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radius: location.radius,
    });
    fetchAddress(coordinate.latitude, coordinate.longitude);
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_API_KEY,
        },
      });

      const result = response.data.results[0];
      if (result) setAddress(result.formatted_address);
      else setAddress("Unknown location");
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setAddress("Unable to fetch address");
    }
  };

  const handleAddZone = async () => {
    if (!label.trim()) {
      Alert.alert("Label Required", "Please enter a name for this zone.");
      return;
    }

    const tempLabel = label.trim();
    setLabel("");

    try{
      setLoading(true);
      const result = await addAvoidanceZone({
        label: tempLabel || address,
        lat: location.latitude,
        lng: location.longitude,
        radius: location.radius,
      });
      setLoading(false);

      if (result?.data?.success) {
        Alert.alert("Zone Added", `📍 ${address}\n📏 ${location.radius} meters`);
        navigation.goBack();
      } else {
        throw new Error("Unknown error");
      }
    } catch (err) {
      console.error("❌ Failed to add zone:", err);
      Alert.alert("Error", "Could not save the avoidance zone.");
    }
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1, backgroundColor: COLORS.white }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Avoidance Zone</Text>

          <View style={styles.iconButton} />
        </View>

        <SearchBar pickLocation={pickLocation} location={location} />
        {!typing && <AvoidanceMap pickLocation={pickLocation} location={location} label={label} address={address} />}

        {location && (
          <>
            <Pressable style={styles.inputWrapper} onPress={Keyboard.dismiss}>
              <Text style={styles.inputLabel}>Label This Zone</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Bar"
                value={label}
                onChangeText={setLabel}
                placeholderTextColor={COLORS.textLight}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
              />
            </Pressable>
            <Pressable style={styles.infoCard} onPress={Keyboard.dismiss}>
              <Text style={styles.infoTitle}>Selected Location:</Text>
              <Text style={styles.infoText}>📍 {address}</Text>
              <Text style={styles.infoText}>📏 Radius: {location.radius} meters</Text>

              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={50}
                maximumValue={1000}
                step={50}
                value={location.radius}
                minimumTrackTintColor={COLORS.primary}
                thumbTintColor={COLORS.primary}
                onValueChange={(value) => {
                  setLocation((prev) => ({ ...prev, radius: value }));
                }}
              />
            </Pressable>

            {
              loading && (
                <TouchableOpacity style={styles.bottomButton}>
                  <ActivityIndicator color={COLORS.primary} />
                </TouchableOpacity>
              )
            }
            {!loading && (
              <TouchableOpacity style={styles.bottomButton} onPress={handleAddZone}>
                <Text style={styles.bottomButtonText}>+ Add Avoidance Zone</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default AddAvoidance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
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
  infoCard: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  inputWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.textDark,
  },
  bottomButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
  },
  bottomButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
