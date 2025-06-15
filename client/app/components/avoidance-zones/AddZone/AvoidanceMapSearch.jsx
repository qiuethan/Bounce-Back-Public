import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";

const AvoidanceMap = ({ location, pickLocation, address, label }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && location.latitude && location.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: location.radius / 25000,
          longitudeDelta: location.radius / 25000,
        },
        500
      );
    }
  }, [location]);

  const hexToRgba = (hex, alpha = 1) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onPress={(e) => {
          const { coordinate } = e.nativeEvent;
          pickLocation(coordinate);
        }}
      >
        {location && (
          <>
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={label.trim() || address.trim() || `${location.latitude}, ${location.longitude}`}
            />
            <Circle
              center={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              radius={location.radius}
              strokeWidth={2}
              strokeColor={hexToRgba(COLORS.primary, 0.8)}
              fillColor={hexToRgba(COLORS.primary, 0.25)}
            />
          </>
        )}
      </MapView>
    </View>
  );
};

export default AvoidanceMap;

import COLORS from "../../../constants/colors";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
    overflow: "hidden",
  }
});
