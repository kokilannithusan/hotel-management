export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateRequired = (value: string | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

export const validatePositiveNumber = (value: number): boolean => {
  return value > 0;
};

export const validateNonNegativeNumber = (value: number): boolean => {
  return value >= 0;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (
  fields: Record<string, { value: any; rules: Array<(val: any) => boolean | string> }>
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.entries(fields).forEach(([key, field]) => {
    for (const rule of field.rules) {
      const result = rule(field.value);
      if (result !== true) {
        errors[key] = typeof result === 'string' ? result : 'Invalid value';
        isValid = false;
        break;
      }
    }
  });

  return { isValid, errors };
};

