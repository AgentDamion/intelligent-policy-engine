export const getAuthErrorMessage = (error: any): string => {
  const message = error?.message || '';
  
  // Map Supabase errors to user-friendly messages
  if (message.includes('User already registered')) {
    return 'This email is already registered. Try signing in instead.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email to confirm your account.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  // Generic fallback
  return message || 'An unexpected error occurred. Please try again.';
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  return 'strong';
};
