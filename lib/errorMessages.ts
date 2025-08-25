interface ErrorMessages {
  [key: string]: string;
}

const authErrorMessages: ErrorMessages = {
  'Invalid login credentials': 'Credenciais de login inválidas',
  'Email not confirmed': 'E-mail não confirmado',
  'Invalid email or password': 'E-mail ou senha inválidos',
  'Missing email or phone': 'E-mail é obrigatório',
  'Password is required': 'Senha é obrigatória',
  'Email is required': 'E-mail é obrigatório',
  'Invalid email format': 'Formato de e-mail inválido',
  'User not found': 'Usuário não encontrado',
  'Email already in use': 'E-mail já está em uso',
  'Password is too weak': 'A senha é muito fraca',
  'Invalid password format': 'Formato de senha inválido',
  'Network request failed': 'Erro de conexão. Verifique sua internet',
  'Too many requests': 'Muitas tentativas. Tente novamente mais tarde',
  'Server error': 'Erro no servidor. Tente novamente mais tarde',
  'Invalid email': 'E-mail inválido',
  'Invalid password': 'Senha inválida',
};

export function translateAuthError(error: string): string {
  return authErrorMessages[error] || 'Ocorreu um erro. Tente novamente.';
}