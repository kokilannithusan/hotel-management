import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProviders } from "./context";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/auth/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { RoomCalenderOverview } from "./pages/dashboard/RoomCalenderOverview";

// Reservations

import { ReserveRoom } from "./pages/reservations/ReserveRoom";
import { ReservationsHistory } from "./pages/reservations/History";

// Customers
import { ManageCustomer } from "./pages/customers/ManageCustomer";

// Events
import { EventPackages } from "./pages/events/EventPackages";
import { CreateEvent } from "./pages/events/CreateEvent";
import { CreateEventForm } from "./pages/events/CreateEventForm";
import { EventManagement } from "./pages/events/EventManagement";
import { HallManagement } from "./pages/events/HallManagement";
import { EventBookingWorkflow } from "./pages/events/EventBooking";
import { EventBookingsOverview } from "./pages/events/EventBookingsOverview";

// Invoicing
import { Bill } from "./pages/invoicing/Bill";
import { AdditionalBilling } from "./pages/invoicing/AdditionalBilling";
import { InvoiceList } from "./pages/invoicing/InvoiceList";
import { InvoiceView } from "./pages/invoicing/InvoiceView";
import { CreateInvoice } from "./pages/invoicing/CreateInvoice";
import { ReceiptsList } from "./pages/invoicing/ReceiptsList";
import { ViewReceipt } from "./pages/invoicing/ViewReceipt";
import { CreateReceipt } from "./pages/invoicing/CreateReceipt";
import { RefundsNew } from "./pages/invoicing/RefundsList";
import { ViewRefund } from "./pages/invoicing/ViewRefund";
import { CreateRefund } from "./pages/invoicing/CreateRefund";
import { CreditNotesList } from "./pages/invoicing/CreditNotesList";
import { ViewCreditNote } from "./pages/invoicing/ViewCreditNote";
import { CreateCreditNote } from "./pages/invoicing/CreateCreditNote";
import { EventInvoicesList } from "./pages/invoicing/EventInvoicesList";
import { ViewEventInvoice } from "./pages/invoicing/ViewEventInvoice";
import { CreateEventInvoice } from "./pages/invoicing/CreateEventInvoice";

// Rooms
import { RoomsOverview } from "./pages/rooms/Overview";
import { AllRooms } from "./pages/rooms/AllRooms";
import { ViewType } from "./pages/rooms/ViewType";
import { Amenities } from "./pages/rooms/Amenities";
import { RoomAreas } from "./pages/rooms/RoomAreas";
import { RoomTypes } from "./pages/rooms/RoomTypes";

import { MealPlan } from "./pages/rooms/MealPlan";
import { RoomChecklist } from "./pages/rooms/RoomChecklist";

// Room Status
import { Housekeeping } from "./pages/houseKeeping/Housekeeping";
import { CleaningTaskList } from "./pages/houseKeeping/CleaningTaskList";

// Channels
import { ChannelsWrapper } from "./pages/channels/ChannelsWrapper";
import { ReservationTypeManager } from "./pages/channels/ReservationTypeManager";
import { Seasonal } from "./pages/channels/Seasonal";
import { ChannelPricingGrid } from "./pages/channels/ChannelPricingGrid";
import { SeasonalType } from "./pages/channels/SeasonalType";
import { StayTypes } from "./pages/rooms/StayTypes";

// Other
import { Tax } from "./pages/tax/Tax";
import { Policies } from "./pages/policies/Policies";
import { ChildPolicies } from "./pages/policies/ChildPolicies";
import { CancellationPolicies } from "./pages/policies/CancellationPolicies";
import { CurrencyRate } from "./pages/currency/CurrencyRate";
import { Settings } from "./pages/settings/Settings";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/dashboard/room-calendar"
                      element={<RoomCalenderOverview />}
                    />
                    <Route
                      path="/reservations/reserve"
                      element={<ReserveRoom />}
                    />
                    <Route
                      path="/reservations/history"
                      element={<ReservationsHistory />}
                    />
                    <Route path="/customers" element={<ManageCustomer />} />
                    <Route
                      path="/events/packages"
                      element={<EventPackages />}
                    />
                    <Route path="/events/create" element={<CreateEvent />} />
                    <Route path="/events/form" element={<CreateEventForm />} />
                    <Route
                      path="/events/management"
                      element={<EventManagement />}
                    />
                    <Route
                      path="/events/hall-management"
                      element={<HallManagement />}
                    />
                    <Route
                      path="/events/booking"
                      element={<EventBookingWorkflow />}
                    />
                    <Route
                      path="/events/overview"
                      element={<EventBookingsOverview />}
                    />
                    <Route
                      path="/invoicing/invoices"
                      element={<InvoiceList />}
                    />
                    <Route
                      path="/invoicing/invoices/create"
                      element={<CreateInvoice />}
                    />
                    <Route
                      path="/invoicing/invoices/:id"
                      element={<InvoiceView />}
                    />
                    <Route
                      path="/invoicing/receipts"
                      element={<ReceiptsList />}
                    />
                    <Route
                      path="/invoicing/receipts/create"
                      element={<CreateReceipt />}
                    />
                    <Route
                      path="/invoicing/receipts/:id"
                      element={<ViewReceipt />}
                    />
                    <Route path="/invoicing/refunds" element={<RefundsNew />} />
                    <Route
                      path="/invoicing/refunds/create"
                      element={<CreateRefund />}
                    />
                    <Route
                      path="/invoicing/refunds/:id"
                      element={<ViewRefund />}
                    />
                    <Route
                      path="/invoicing/credit-notes"
                      element={<CreditNotesList />}
                    />
                    <Route
                      path="/invoicing/credit-notes/create"
                      element={<CreateCreditNote />}
                    />
                    <Route
                      path="/invoicing/credit-notes/:id"
                      element={<ViewCreditNote />}
                    />
                    <Route
                      path="/invoicing/event-invoices"
                      element={<EventInvoicesList />}
                    />
                    <Route
                      path="/invoicing/event-invoices/create"
                      element={<CreateEventInvoice />}
                    />
                    <Route
                      path="/invoicing/event-invoices/:id"
                      element={<ViewEventInvoice />}
                    />
                    <Route
                      path="/invoicing/additional"
                      element={<AdditionalBilling />}
                    />
                    <Route path="/invoicing/bill" element={<Bill />} />
                    <Route path="/rooms/overview" element={<RoomsOverview />} />
                    <Route path="/rooms/all" element={<AllRooms />} />
                    <Route
                      path="/rooms/checklist"
                      element={<RoomChecklist />}
                    />
                    <Route path="/rooms/view-type" element={<ViewType />} />
                    <Route path="/rooms/amenities" element={<Amenities />} />
                    <Route path="/rooms/areas" element={<RoomAreas />} />
                    <Route path="/rooms/types" element={<RoomTypes />} />
                    <Route path="/rooms/stay-types" element={<StayTypes />} />
                    <Route path="/rooms/meal-plan" element={<MealPlan />} />
                    <Route
                      path="/housekeeping/manager"
                      element={<Housekeeping key="manager" mode="manager" />}
                    />
                    <Route
                      path="/housekeeping/housekeeper"
                      element={
                        <Housekeeping key="housekeeper" mode="housekeeper" />
                      }
                    />
                    <Route
                      path="/housekeeping/cleaning-task-list"
                      element={<CleaningTaskList />}
                    />
                    <Route
                      path="/housekeeping"
                      element={<Navigate to="/housekeeping/manager" replace />}
                    />
                    {/* Legacy route for backward compatibility */}
                    <Route
                      path="/room-status"
                      element={<Housekeeping key="legacy" mode="housekeeper" />}
                    />
                    <Route
                      path="/channels/channels"
                      element={<ChannelsWrapper />}
                    />
                    <Route
                      path="/channels/registration"
                      element={<ReservationTypeManager />}
                    />
                    <Route path="/channels/seasonal" element={<Seasonal />} />
                    <Route
                      path="/channels/seasonal-type"
                      element={<SeasonalType />}
                    />
                    <Route path="/channels/stay-type" element={<StayTypes />} />
                    <Route
                      path="/channels/price-grid"
                      element={<ChannelPricingGrid />}
                    />
                    <Route path="/tax" element={<Tax />} />
                    <Route path="/policies" element={<Policies />} />
                    <Route path="/policies/child" element={<ChildPolicies />} />
                    <Route
                      path="/policies/cancellation"
                      element={<CancellationPolicies />}
                    />
                    <Route path="/currency" element={<CurrencyRate />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/:section" element={<Settings />} />
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
