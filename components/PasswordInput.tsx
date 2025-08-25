import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface PasswordInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function PasswordInput({ value, onChangeText, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        placeholderTextColor="rgba(255,255,255,0.5)"
        selectionColor="#fff"
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff size={20} color="rgba(255,255,255,0.7)" />
        ) : (
          <Eye size={20} color="rgba(255,255,255,0.7)" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    paddingRight: 45,
    borderRadius: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    backgroundColor: 'transparent',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});