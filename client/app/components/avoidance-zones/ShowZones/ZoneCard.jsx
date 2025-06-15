import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../../constants/colors";

const ZoneCard = ({ zone, onDelete }) => {
  const { label, radius, coordinates } = zone;

  return (
    <View style={styles.card}>
      <MapView
        style={styles.map}
        region={{
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }} />
        <Circle
          center={{ latitude: coordinates.lat, longitude: coordinates.lng }}
          radius={radius}
          strokeColor={COLORS.primary}
          fillColor="rgba(255,107,138,0.2)"
        />
      </MapView>

      <View style={styles.infoContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => onDelete(zone.id)}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={COLORS.textMuted} />
            <Text style={styles.details}>
              {coordinates.lat.toFixed(3)}, {coordinates.lng.toFixed(3)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="resize" size={16} color={COLORS.textMuted} />
            <Text style={styles.details}>{radius} meters</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ZoneCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    height: 140,
    width: "100%",
  },
  infoContainer: {
    padding: 12,
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  deleteButton: {
    padding: 4,
  },
  detailsContainer: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  details: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
