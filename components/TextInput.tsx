import { TextInput as RNTextInput, StyleSheet, TextInputProps } from 'react-native';

interface CustomTextInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function TextInput({ value, onChangeText, ...props }: CustomTextInputProps) {
  return (
    <RNTextInput
      {...props}
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="rgba(255,255,255,0.5)"
      selectionColor="#fff"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent',
    outlineStyle: 'none',
  },
});