import React from 'react';
import { Input } from '../ui/Input';

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, error, className = '', ...props }) => {
  return <Input type="date" label={label} error={error} className={className} {...props} />;
};

