import React from "react";
import { AuthProvider } from "./AuthContext";
import { HotelProvider } from "./HotelContext";
import { SidebarProvider } from "./SidebarContext";
import { ReservationTypeProvider } from "./ReservationTypeContext";
import { AdditionalServiceProvider } from "./AdditionalServiceContext";
import { EventInvoiceProvider } from "./EventInvoiceContext";
import { InvoiceProvider } from "./InvoiceContext";
import { EventManagementProvider } from "./EventManagementContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AuthProvider>
      <HotelProvider>
        <AdditionalServiceProvider>
          <EventManagementProvider>
            <EventInvoiceProvider>
              <InvoiceProvider>
                <ReservationTypeProvider>
                  <SidebarProvider>{children}</SidebarProvider>
                </ReservationTypeProvider>
              </InvoiceProvider>
            </EventInvoiceProvider>
          </EventManagementProvider>
        </AdditionalServiceProvider>
      </HotelProvider>
    </AuthProvider>
  );
};
