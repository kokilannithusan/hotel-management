import React from 'react';
import { AuthProvider } from './AuthContext';
import { HotelProvider } from './HotelContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <HotelProvider>{children}</HotelProvider>
    </AuthProvider>
  );
};

