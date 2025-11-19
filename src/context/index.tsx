import React from "react";
import { AuthProvider } from "./AuthContext";
import { HotelProvider } from "./HotelContext";
import { SidebarProvider } from "./SidebarContext";
import { ReservationTypeProvider } from "./ReservationTypeContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthProvider>
      <HotelProvider>
        <ReservationTypeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ReservationTypeProvider>
      </HotelProvider>
    </AuthProvider>
  );
};
