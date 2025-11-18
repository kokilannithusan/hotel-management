import React from "react";
import { AuthProvider } from "./AuthContext";
import { HotelProvider } from "./HotelContext";
import { SidebarProvider } from "./SidebarContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthProvider>
      <HotelProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </HotelProvider>
    </AuthProvider>
  );
};
