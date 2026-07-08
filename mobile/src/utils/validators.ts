export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const isValidMasterCode = (code: string): boolean => {
  return code.length >= 6 && /^[A-Z0-9]+$/.test(code);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRegistration = (data: {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  masterCode: string;
  acceptTerms: boolean;
}): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  const passwordCheck = isValidPassword(data.password);
  if (!passwordCheck.valid) {
    errors.password = passwordCheck.message || 'Invalid password';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!data.role) {
    errors.role = 'Please select a role';
  }

  if (!isValidMasterCode(data.masterCode)) {
    errors.masterCode = 'Please enter a valid master code';
  }

  if (!data.acceptTerms) {
    errors.acceptTerms = 'You must accept the terms and conditions';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
