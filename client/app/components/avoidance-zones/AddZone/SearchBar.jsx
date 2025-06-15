import React, { useState, useCallback } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import axios from "axios";
import debounce from "lodash/debounce";
import { Ionicons } from "@expo/vector-icons";
import { GOOGLE_API_KEY } from "@env";
import COLORS from "../../../constants/colors";

const SearchBar = ({ pickLocation, location }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (text, loc) => {
    if (text.length < 2) return setSuggestions([]);

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: text,
            key: GOOGLE_API_KEY,
            location: `${loc.latitude},${loc.longitude}`,
            radius: 50000,
          },
        }
      );
      setSuggestions(response.data.predictions.slice(0, 5));
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 300), []);

  const handleChange = (text) => {
    setQuery(text);
    debouncedFetch(text, location);
  };

  const handleManualSearch = () => {
    fetchSuggestions(query, location);
  };

  const handleSelect = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_API_KEY,
          },
        }
      );
      const loc = response.data.result.geometry.location;
      pickLocation({ latitude: loc.lat, longitude: loc.lng });
      setSuggestions([]);
      setQuery("");
    } catch (err) {
      console.error("Place details error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a place"
          value={query}
          onChangeText={handleChange}
        />
        <TouchableOpacity onPress={handleManualSearch} style={styles.iconButton}>
          <Ionicons name="search" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestion}
            onPress={() => handleSelect(item.place_id)}
          >
            <Text style={styles.suggestionText}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: COLORS.textDark,
  },
  iconButton: {
    paddingLeft: 10,
  },
  suggestion: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 6,
  },
  suggestionText: {
    fontSize: 16,
    color: COLORS.textDark,
  },
});
