import React, { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EventBookingWorkflow } from "./EventBooking";
import { EventBookingsOverview } from "./EventBookingsOverview";

type ViewType = "overview" | "booking";

export const EventManagement: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>("overview");

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Card>
        <div className="p-4">
          <div className="flex space-x-4">
            <Button
              variant={activeView === "overview" ? "primary" : "outline"}
              onClick={() => setActiveView("overview")}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Bookings Overview
            </Button>
            <Button
              variant={activeView === "booking" ? "primary" : "outline"}
              onClick={() => setActiveView("booking")}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      <div>
        {activeView === "overview" && <EventBookingsOverview />}
        {activeView === "booking" && <EventBookingWorkflow />}
      </div>
    </div>
  );
};
