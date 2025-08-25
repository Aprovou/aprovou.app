import { View, Text, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';

interface PasswordValidationProps {
  password: string;
}

export function PasswordValidation({ password }: PasswordValidationProps) {
  const validations = [
    {
      label: 'Mínimo de 8 caracteres',
      isValid: password.length >= 8,
    },
    {
      label: 'Pelo menos uma letra maiúscula',
      isValid: /[A-Z]/.test(password),
    },
    {
      label: 'Pelo menos uma letra minúscula',
      isValid: /[a-z]/.test(password),
    },
    {
      label: 'Pelo menos um número',
      isValid: /[0-9]/.test(password),
    },
    {
      label: 'Pelo menos um caractere especial',
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  return (
    <View style={styles.container}>
      {validations.map((validation, index) => (
        <View key={index} style={styles.row}>
          {validation.isValid ? (
            <Check size={16} color="#74f787" />
          ) : (
            <X size={16} color="#ff4444" />
          )}
          <Text style={[
            styles.text,
            { color: validation.isValid ? '#74f787' : '#ff4444' }
          ]}>
            {validation.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
  },
});