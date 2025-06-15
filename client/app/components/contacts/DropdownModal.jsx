import React from "react";
import {
  Modal,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  FlatList,
} from "react-native";
import COLORS from "../../constants/colors";

export default function DropdownModal({
  visible,
  options,
  onSelect,
  onClose,
  multiSelect = false,
  selectedValues = [],
}) {
  const isSelected = (value) => selectedValues.includes(value);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select an Option</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[
                  styles.optionButton,
                  multiSelect && isSelected(item) && styles.selectedItem,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    multiSelect && isSelected(item) && styles.selectedText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <Text style={styles.moreIndicator}>⬆ Scroll for more ⬇</Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    width: "100%",
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: "center",
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textDark,
    textAlign: "center",
  },
  selectedItem: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  selectedText: {
    fontWeight: "700",
    color: COLORS.textDark,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  moreIndicator: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
