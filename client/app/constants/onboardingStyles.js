import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.darkText,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 20,
    color: COLORS.textLight,
    borderRadius: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  optionalNote: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  clearIcon: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  inputFilled: {
    color: COLORS.textDark
  },
});

export default styles;
