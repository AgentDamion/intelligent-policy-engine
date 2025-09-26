// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Password strength details
export const getPasswordStrength = (password: string): {
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
} => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { score, requirements, strength };
};

// Organization name validation
export const isValidOrgName = (name: string): boolean => {
  // At least 3 characters, alphanumeric, spaces, hyphens, and apostrophes allowed
  return name.trim().length >= 3 && /^[a-zA-Z0-9\s\-']+$/.test(name);
};

// Domain validation
export const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
};

// Email domain extraction
export const extractEmailDomain = (email: string): string | null => {
  if (!isValidEmail(email)) return null;
  return email.split('@')[1];
};

// Invite code validation (alphanumeric, 6-10 characters)
export const isValidInviteCode = (code: string): boolean => {
  return /^[A-Z0-9]{6,10}$/.test(code);
};

// Region validation
export const isValidRegion = (region: string, validRegions: string[]): boolean => {
  return validRegions.includes(region);
};

// Form validation helper
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateSignInForm = (data: {
  email: string;
  password?: string;
  useMagicLink?: boolean;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.useMagicLink && !data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCreateOrgForm = (data: {
  orgName: string;
  region: string;
  emailDomain?: string;
  enableSSO: boolean;
  ssoProvider?: string;
  orgType: string;
  initialRoles: string[];
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.orgName) {
    errors.orgName = 'Organization name is required';
  } else if (!isValidOrgName(data.orgName)) {
    errors.orgName = 'Organization name must be at least 3 characters and contain only letters, numbers, spaces, hyphens, or apostrophes';
  }

  if (!data.region) {
    errors.region = 'Region is required';
  }

  if (data.emailDomain && !isValidDomain(data.emailDomain)) {
    errors.emailDomain = 'Please enter a valid domain (e.g., example.com)';
  }

  if (data.enableSSO && !data.ssoProvider) {
    errors.ssoProvider = 'Please select an SSO provider';
  }

  if (!data.orgType) {
    errors.orgType = 'Organization type is required';
  }

  if (data.initialRoles.length === 0) {
    errors.initialRoles = 'Please select at least one role';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateJoinOrgForm = (data: {
  email: string;
  inviteCode?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.inviteCode && !isValidInviteCode(data.inviteCode)) {
    errors.inviteCode = 'Invite code must be 6-10 alphanumeric characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
