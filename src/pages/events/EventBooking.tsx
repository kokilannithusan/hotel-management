import React, { useState } from "react";
import {
  Users,
  MapPin,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";

import { useHotel } from "../../context/HotelContext";
import { Event, Customer, EventType, EventStatus } from "../../types/entities";

interface BookingStepProps {
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  title: string;
  description: string;
}

const BookingStep: React.FC<BookingStepProps> = ({
  isActive,
  isCompleted,
  stepNumber,
  title,
  description,
}) => (
  <div
    className={`flex flex-col items-center text-center p-4 rounded-lg border-2 transition-colors h-32 ${
      isActive
        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
        : isCompleted
        ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400"
        : "border-gray-200 dark:border-gray-700"
    }`}
  >
    <div
      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold mb-3 flex-shrink-0 ${
        isActive
          ? "bg-blue-500 text-white"
          : isCompleted
          ? "bg-green-500 text-white"
          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      }`}
    >
      {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNumber}
    </div>
    <div className="flex-1 flex flex-col justify-center">
      <h3
        className={`font-semibold text-sm mb-1 ${
          isActive
            ? "text-blue-700 dark:text-blue-300"
            : isCompleted
            ? "text-green-700 dark:text-green-300"
            : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {title}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
        {description}
      </p>
    </div>
  </div>
);

interface HallAvailabilityCheck {
  hallId: string;
  startDateTime: string;
  endDateTime: string;
  isAvailable: boolean;
  conflictingEvents?: Event[];
}

export const EventBookingWorkflow: React.FC = () => {
  const { state, createEvent } = useHotel();

  // Debug: Check if component is rendering
  console.log("EventBookingWorkflow component rendering", state);

  // If state is not loaded, show loading
  if (!state) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    identificationType: "nic" as "nic" | "passport",
    identificationNumber: "",
  });

  // Hall filter state
  const [hallSearchTerm, setHallSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState({ field: "", order: "" });

  // Booking data state
  const [bookingData, setBookingData] = useState({
    eventName: "",
    eventType: "conference" as EventType,
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    guestId: "",
    startDateTime: "",
    endDateTime: "",
    expectedAttendees: "",
    hallId: "",
    packageId: "",
    customPricing: "",
    notes: "",
    requirements: "",
    decorationType: "",
    cateringRequirements: "",
  });

  const [availabilityCheck, setAvailabilityCheck] =
    useState<HallAvailabilityCheck | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [quotationGenerated, setQuotationGenerated] = useState(false);

  // Get real data from context
  const availableHalls = (state.halls || []).filter(
    (hall: any) => hall.status === "available"
  );
  const availablePackages = (state.eventPackages || []).filter(
    (pkg: any) => pkg.isActive
  );
  const allCustomers = state.customers || [];

  // Filter halls based on search and filters
  const filteredHalls = availableHalls
    .filter((hall: any) => {
      // Search filter
      const matchesSearch =
        !hallSearchTerm ||
        hall.name.toLowerCase().includes(hallSearchTerm.toLowerCase()) ||
        hall.location.toLowerCase().includes(hallSearchTerm.toLowerCase()) ||
        hall.facilities.some((facility: string) =>
          facility.toLowerCase().includes(hallSearchTerm.toLowerCase())
        );

      // Capacity filter - only show halls that can accommodate expected attendees
      const expectedAttendees = parseInt(bookingData.expectedAttendees) || 0;
      const hasCapacity =
        expectedAttendees === 0 || hall.capacity >= expectedAttendees;

      return matchesSearch && hasCapacity;
    })
    .sort((a: any, b: any) => {
      // Apply sorting if selected
      if (sortBy.field && sortBy.order) {
        const fieldA = sortBy.field === "price" ? a.pricePerHour : a.capacity;
        const fieldB = sortBy.field === "price" ? b.pricePerHour : b.capacity;

        if (sortBy.order === "asc") {
          return fieldA - fieldB;
        } else if (sortBy.order === "desc") {
          return fieldB - fieldA;
        }
      }
      return 0; // No sorting
    });

  // Debug logging for available data
  console.log("Available data:", {
    halls: availableHalls.length,
    packages: availablePackages.length,
    customers: allCustomers.length,
    currentStep,
    bookingData,
    selectedCustomer,
  });

  const steps = [
    {
      number: 1,
      title: "Event Details",
      description: "Basic event information and timing",
    },
    {
      number: 2,
      title: "Hall Selection",
      description: "Choose and validate hall availability",
    },
    {
      number: 3,
      title: "Customer Selection",
      description: "Select or create customer profile",
    },
    {
      number: 4,
      title: "Package & Services",
      description: "Select package and pricing options",
    },
    {
      number: 5,
      title: "Review & Confirmation",
      description: "Review details and confirm booking",
    },
  ];

  // Check hall availability
  const checkHallAvailability = (
    hallId: string,
    startDateTime: string,
    endDateTime: string
  ): HallAvailabilityCheck => {
    // Mock availability check - in real app this would check against existing bookings
    const isAvailable = Math.random() > 0.3; // 70% chance available
    return {
      hallId,
      startDateTime,
      endDateTime,
      isAvailable,
      conflictingEvents: isAvailable
        ? []
        : [
            {
              id: "conflict-1",
              name: "Corporate Meeting",
              type: "corporate" as EventType,
              organizerName: "John Smith",
              identificationType: "nic" as any,
              identificationNumber: "123456789",
              startDateTime: "2024-12-15T14:00:00Z",
              endDateTime: "2024-12-15T18:00:00Z",
              expectedAttendees: 25,
              hallIds: [hallId],
              totalRevenue: 800,
              status: "confirmed" as EventStatus,
              paymentStatus: "paid" as any,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
              createdBy: "system",
            },
          ],
    };
  };

  const calculateTotal = (): {
    baseAmount: number;
    overtimeCharges: number;
    total: number;
  } => {
    const selectedHall = availableHalls.find(
      (h: any) => h.id === bookingData.hallId
    );
    const selectedPackage = availablePackages.find(
      (p: any) => p.id === bookingData.packageId
    );

    let baseAmount = 0;
    let overtimeCharges = 0;

    if (bookingData.customPricing) {
      baseAmount = parseFloat(bookingData.customPricing);
    } else if (selectedPackage) {
      baseAmount = selectedPackage.basePrice;

      // Calculate overtime charges for packages
      if (
        bookingData.startDateTime &&
        bookingData.endDateTime &&
        selectedHall
      ) {
        const start = new Date(bookingData.startDateTime);
        const end = new Date(bookingData.endDateTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // Package includes standard hours (e.g., 8 hours), charge for additional hours
        const standardHours = selectedPackage.includedHours || 8;
        if (hours > standardHours) {
          const extraHours = Math.ceil(hours - standardHours);
          const overtimeRate = selectedHall.pricePerHour * 1.5; // 50% surcharge for overtime
          overtimeCharges = extraHours * overtimeRate;
        }
      }
    } else if (
      selectedHall &&
      bookingData.startDateTime &&
      bookingData.endDateTime
    ) {
      // Calculate based on duration
      const start = new Date(bookingData.startDateTime);
      const end = new Date(bookingData.endDateTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (hours >= 8) {
        baseAmount = selectedHall.pricePerDay;
        // For daily rates, charge overtime for hours beyond 12 hours
        if (hours > 12) {
          const extraHours = Math.ceil(hours - 12);
          const overtimeRate = selectedHall.pricePerHour * 1.5; // 50% surcharge for overtime
          overtimeCharges = extraHours * overtimeRate;
        }
      } else {
        baseAmount = selectedHall.pricePerHour * hours;
      }
    }

    return {
      baseAmount,
      overtimeCharges,
      total: baseAmount + overtimeCharges,
    };
  };

  const handleStepChange = (step: number) => {
    console.log(
      `Attempting to change to step ${step}, current step: ${currentStep}`
    );
    if (step > currentStep + 1) {
      console.log("Cannot skip steps");
      return; // Prevent skipping steps
    }

    // Validate current step before proceeding
    const isValid = validateCurrentStep();
    console.log(`Current step validation result: ${isValid}`);
    if (step > currentStep && !isValid) {
      console.log("Validation failed, cannot proceed");
      return;
    }

    console.log(`Moving to step ${step}`);
    setCurrentStep(step);
  };

  const validateCurrentStep = (): boolean => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = !!(
          bookingData.eventName &&
          bookingData.startDateTime &&
          bookingData.endDateTime &&
          bookingData.expectedAttendees
        );
        console.log(`Step 1 validation:`, {
          eventName: !!bookingData.eventName,
          startDateTime: !!bookingData.startDateTime,
          endDateTime: !!bookingData.endDateTime,
          expectedAttendees: !!bookingData.expectedAttendees,
          isValid,
        });
        return isValid;
      case 2:
        isValid = !!(bookingData.hallId && availabilityCheck?.isAvailable);
        console.log(`Step 2 validation:`, {
          hallId: !!bookingData.hallId,
          isAvailable: availabilityCheck?.isAvailable,
          isValid,
        });
        return isValid;
      case 3:
        isValid = !!(bookingData.guestId || selectedCustomer);
        console.log(`Step 3 validation:`, {
          guestId: !!bookingData.guestId,
          selectedCustomer: !!selectedCustomer,
          isValid,
        });
        return isValid;
      case 4:
        isValid = !!(bookingData.packageId || bookingData.customPricing);
        console.log(`Step 4 validation:`, {
          packageId: !!bookingData.packageId,
          customPricing: !!bookingData.customPricing,
          isValid,
        });
        return isValid;
      case 5:
        // Additional services are optional, so always return true
        console.log(`Step 5 validation: true (services are optional)`);
        return true;
      default:
        console.log(`Default step validation: true`);
        return true;
    }
  };

  const handleHallSelection = (hallId: string) => {
    setBookingData({ ...bookingData, hallId });

    if (bookingData.startDateTime && bookingData.endDateTime) {
      const check = checkHallAvailability(
        hallId,
        bookingData.startDateTime,
        bookingData.endDateTime
      );
      setAvailabilityCheck(check);
    }
  };

  const handleDateTimeChange = () => {
    if (
      bookingData.hallId &&
      bookingData.startDateTime &&
      bookingData.endDateTime
    ) {
      const check = checkHallAvailability(
        bookingData.hallId,
        bookingData.startDateTime,
        bookingData.endDateTime
      );
      setAvailabilityCheck(check);
    }
  };

  const generateQuotation = () => {
    setQuotationGenerated(true);
    console.log("Quotation generated for:", bookingData);
  };

  const confirmBooking = async () => {
    try {
      const pricing = calculateTotal();
      const totalAmount = pricing.total;

      const eventData = {
        name: bookingData.eventName,
        type: bookingData.eventType,
        organizerName: selectedCustomer?.name || bookingData.organizerName,
        organizerEmail: selectedCustomer?.email || bookingData.organizerEmail,
        organizerPhone: selectedCustomer?.phone || bookingData.organizerPhone,
        identificationType:
          (selectedCustomer as any)?.identificationType || ("nic" as any),
        identificationNumber:
          (selectedCustomer as any)?.identificationNumber || "temp-id",
        startDateTime: bookingData.startDateTime,
        endDateTime: bookingData.endDateTime,
        expectedAttendees: parseInt(bookingData.expectedAttendees),
        hallIds: [bookingData.hallId],
        packageId: bookingData.packageId || undefined,
        totalRevenue: totalAmount,
        status: "confirmed" as EventStatus,
        paymentStatus: "pending" as any,
        notes: bookingData.notes,
        requirements: bookingData.requirements,
        decorationType: bookingData.decorationType,
        cateringRequirements: bookingData.cateringRequirements,
        createdBy: "user",
      };

      await createEvent(eventData);
      console.log("Event created successfully:", eventData);
      alert("Booking confirmed successfully! Event has been created.");

      // Reset form for new booking
      setCurrentStep(1);
      setBookingData({
        eventName: "",
        eventType: "conference" as EventType,
        organizerName: "",
        organizerEmail: "",
        organizerPhone: "",
        guestId: "",
        startDateTime: "",
        endDateTime: "",
        expectedAttendees: "",
        hallId: "",
        packageId: "",
        customPricing: "",
        notes: "",
        requirements: "",
        decorationType: "",
        cateringRequirements: "",
      });
      setSelectedCustomer(null);
      setQuotationGenerated(false);
      setAvailabilityCheck(null);
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to confirm booking. Please try again.");
    }
  };

  const renderStepContent = () => {
    console.log(`Rendering step ${currentStep}`);
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Let's Start Planning Your Event
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Tell us about your event so we can help you create the perfect
                experience. All fields marked with * are required.
              </p>
            </div>

            {/* Event Basic Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Event Information
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Basic details about your event
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <Input
                    label="Event Name *"
                    value={bookingData.eventName}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        eventName: e.target.value,
                      })
                    }
                    required
                    placeholder="e.g., Annual Company Gala, Wedding Reception, Product Launch"
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose a memorable name that describes your event
                  </p>
                </div>

                <div className="lg:col-span-1">
                  <Select
                    label="Event Type *"
                    value={bookingData.eventType}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        eventType: e.target.value as EventType,
                      })
                    }
                    options={[
                      { value: "conference", label: "🏢 Conference" },
                      { value: "wedding", label: "💒 Wedding" },
                      { value: "seminar", label: "📚 Seminar" },
                      { value: "corporate", label: "🏛️ Corporate Event" },
                      { value: "birthday", label: "🎂 Birthday Party" },
                      { value: "anniversary", label: "💑 Anniversary" },
                      { value: "meeting", label: "🤝 Meeting" },
                      { value: "workshop", label: "🛠️ Workshop" },
                      { value: "gala", label: "✨ Gala" },
                      { value: "other", label: "📝 Other" },
                    ]}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This helps us suggest the right packages and services
                  </p>
                </div>
              </div>
            </div>

            {/* Event Timing */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    When is Your Event?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select your preferred date and time
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="Start Date & Time *"
                    type="datetime-local"
                    value={bookingData.startDateTime}
                    onChange={(e) => {
                      setBookingData({
                        ...bookingData,
                        startDateTime: e.target.value,
                      });
                      setTimeout(handleDateTimeChange, 100);
                    }}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When does your event begin?
                  </p>
                </div>

                <div>
                  <Input
                    label="End Date & Time *"
                    type="datetime-local"
                    value={bookingData.endDateTime}
                    onChange={(e) => {
                      setBookingData({
                        ...bookingData,
                        endDateTime: e.target.value,
                      });
                      setTimeout(handleDateTimeChange, 100);
                    }}
                    required
                    min={
                      bookingData.startDateTime ||
                      new Date().toISOString().slice(0, 16)
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When does your event end?
                  </p>
                </div>

                <div>
                  <Input
                    label="Expected Attendees *"
                    type="number"
                    value={bookingData.expectedAttendees}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        expectedAttendees: e.target.value,
                      })
                    }
                    required
                    placeholder="50"
                    min="1"
                    max="1000"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Approximate number of guests
                  </p>
                </div>
              </div>

              {/* Duration Display */}
              {bookingData.startDateTime && bookingData.endDateTime && (
                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Event Duration:
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {(() => {
                        const start = new Date(bookingData.startDateTime);
                        const end = new Date(bookingData.endDateTime);
                        const diffMs = end.getTime() - start.getTime();
                        const diffHours =
                          Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
                        const diffDays = Math.floor(diffHours / 24);
                        const remainingHours = diffHours % 24;

                        if (diffDays > 0) {
                          return `${diffDays} day${diffDays > 1 ? "s" : ""} ${
                            remainingHours > 0 ? `${remainingHours} hours` : ""
                          }`;
                        } else {
                          return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Additional Information
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Optional details to help us serve you better
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Requirements or Notes
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 resize-none"
                  rows={4}
                  placeholder="Tell us about any special requirements, accessibility needs, dietary restrictions, or other important details we should know about..."
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Help us prepare by sharing any special needs or preferences
                  </p>
                  <span className="text-xs text-gray-400">
                    {bookingData.notes.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Step 1 Completion
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(() => {
                    let completed = 0;
                    let total = 4;
                    if (bookingData.eventName) completed++;
                    if (bookingData.startDateTime) completed++;
                    if (bookingData.endDateTime) completed++;
                    if (bookingData.expectedAttendees) completed++;
                    return `${completed}/${total}`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(() => {
                      let completed = 0;
                      let total = 4;
                      if (bookingData.eventName) completed++;
                      if (bookingData.startDateTime) completed++;
                      if (bookingData.endDateTime) completed++;
                      if (bookingData.expectedAttendees) completed++;
                      return (completed / total) * 100;
                    })()}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Fill in all required fields to proceed to hall selection
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Hall Selection
            </h3>

            {/* Search and Filter Section */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Search Halls"
                  value={hallSearchTerm}
                  onChange={(e) => setHallSearchTerm(e.target.value)}
                  placeholder="Search by name, location, or facilities..."
                />
                <Select
                  label="Sort By"
                  value={
                    sortBy.field && sortBy.order
                      ? `${sortBy.field}_${sortBy.order}`
                      : ""
                  }
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("_");
                    setSortBy({ field: field || "", order: order || "" });
                  }}
                  options={[
                    { value: "", label: "No Sorting" },
                    { value: "price_asc", label: "Price: Low to High" },
                    { value: "price_desc", label: "Price: High to Low" },
                    { value: "capacity_asc", label: "Capacity: Low to High" },
                    { value: "capacity_desc", label: "Capacity: High to Low" },
                  ]}
                />
              </div>

              {/* Clear Filters Button */}
              {(hallSearchTerm || sortBy.field) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHallSearchTerm("");
                    setSortBy({ field: "", order: "" });
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredHalls.length} of {availableHalls.length}{" "}
                  available halls
                  {bookingData.expectedAttendees && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                      (filtered for {bookingData.expectedAttendees} attendees)
                    </span>
                  )}
                </div>
                {bookingData.expectedAttendees && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Only showing halls with capacity ≥{" "}
                    {bookingData.expectedAttendees} people
                  </div>
                )}
              </div>
            </div>

            {availabilityCheck && !availabilityCheck.isAvailable && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800 dark:text-red-400">
                    Hall Not Available
                  </h4>
                </div>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  The selected hall is not available during the requested time.
                  Please choose a different hall or time slot.
                </p>
              </div>
            )}

            {filteredHalls.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {parseInt(bookingData.expectedAttendees) > 0 &&
                  availableHalls.length > 0
                    ? "No halls available for your group size"
                    : "No halls found"}
                </h3>
                <p className="text-sm">
                  {parseInt(bookingData.expectedAttendees) > 0 &&
                  availableHalls.length > 0
                    ? `No halls can accommodate ${bookingData.expectedAttendees} attendees. Try reducing the number of attendees or contact us for larger venue options.`
                    : "Try adjusting your search criteria or filters to find suitable halls."}
                </p>
                {parseInt(bookingData.expectedAttendees) > 0 &&
                  availableHalls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">
                        Available hall capacities:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {availableHalls.slice(0, 5).map((hall: any) => (
                          <span
                            key={hall.id}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs"
                          >
                            {hall.name}: {hall.capacity} people
                          </span>
                        ))}
                        {availableHalls.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{availableHalls.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHalls.map((hall) => (
                  <div
                    key={hall.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      bookingData.hallId === hall.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => handleHallSelection(hall.id)}
                  >
                    <Card className="h-full">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {hall.name}
                          </h4>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                              parseInt(bookingData.expectedAttendees) > 0 &&
                              hall.capacity >=
                                parseInt(bookingData.expectedAttendees)
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {hall.capacity} capacity
                            </span>
                            {parseInt(bookingData.expectedAttendees) > 0 &&
                              hall.capacity >=
                                parseInt(bookingData.expectedAttendees) && (
                                <span className="ml-1 text-xs">✓</span>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {hall.location}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Facilities:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {hall.facilities.slice(0, 3).map((facility) => (
                              <span
                                key={facility}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                              >
                                {facility}
                              </span>
                            ))}
                            {hall.facilities.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{hall.facilities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">
                              ${hall.pricePerHour}/hr
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ${hall.pricePerDay}/day
                            </span>
                          </div>
                          {bookingData.hallId === hall.id &&
                            availabilityCheck?.isAvailable && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        const filteredCustomers = allCustomers.filter(
          (customer) =>
            customer.name
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase()) ||
            customer.email
              .toLowerCase()
              .includes(customerSearchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(customerSearchTerm)) ||
            ((customer as any).identificationNumber &&
              (customer as any).identificationNumber
                .toLowerCase()
                .includes(customerSearchTerm.toLowerCase()))
        );

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Selection
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Search for an existing customer or create a new customer profile.
            </p>

            {/* Customer Search */}
            <div className="space-y-4">
              <Input
                label="Search Customers"
                placeholder="Search by name, email, phone, or ID number..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />

              {customerSearchTerm && filteredCustomers.length > 0 && (
                <Card title={`Found ${filteredCustomers.length} Customer(s)`}>
                  <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedCustomer?.id === customer.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-600"
                        }`}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setBookingData({
                            ...bookingData,
                            guestId: customer.id,
                          });
                          setCustomerSearchTerm("");
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {customer.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-sm text-gray-500">
                                {customer.phone}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(customer);
                              setBookingData({
                                ...bookingData,
                                guestId: customer.id,
                              });
                              setCustomerSearchTerm("");
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {customerSearchTerm && filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No customers found matching "{customerSearchTerm}"</p>
                  <p className="text-sm">
                    Try searching by name, email, phone, or ID number, or create
                    a new customer.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Customer
              </Button>

              {selectedCustomer && selectedCustomer.id !== "new-customer" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setBookingData({ ...bookingData, guestId: "" });
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Selection
                </Button>
              )}
            </div>

            {/* New Customer Form */}
            {showCustomerForm && (
              <Card title="Create New Customer">
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      value={newCustomerData.name}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                      required
                    />
                    <Input
                      label="Email Address *"
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          email: e.target.value,
                        })
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      value={newCustomerData.phone}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                    <Input
                      label="Address"
                      value={newCustomerData.address}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          address: e.target.value,
                        })
                      }
                      placeholder="123 Main St, City, State"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Identification Type *"
                      value={newCustomerData.identificationType}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          identificationType: e.target.value as
                            | "nic"
                            | "passport",
                        })
                      }
                      options={[
                        { value: "nic", label: "NIC (National Identity Card)" },
                        { value: "passport", label: "Passport" },
                      ]}
                    />
                    <Input
                      label={`${newCustomerData.identificationType.toUpperCase()} Number *`}
                      value={newCustomerData.identificationNumber}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          identificationNumber: e.target.value,
                        })
                      }
                      placeholder={
                        newCustomerData.identificationType === "nic"
                          ? "123456789V"
                          : "A12345678"
                      }
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={async () => {
                        if (
                          newCustomerData.name &&
                          newCustomerData.email &&
                          newCustomerData.identificationNumber
                        ) {
                          try {
                            const newCustomer: Customer = {
                              id: `customer-${Date.now()}`,
                              name: newCustomerData.name,
                              email: newCustomerData.email,
                              phone: newCustomerData.phone || "",
                              nationality: "",
                              createdAt: new Date().toISOString(),
                            };

                            // Add customer to state (would dispatch ADD_CUSTOMER action in real app)
                            state.customers?.push(newCustomer);

                            setSelectedCustomer(newCustomer);
                            setBookingData({
                              ...bookingData,
                              guestId: newCustomer.id,
                            });
                            setShowCustomerForm(false);
                            setNewCustomerData({
                              name: "",
                              email: "",
                              phone: "",
                              address: "",
                              identificationType: "nic" as "nic" | "passport",
                              identificationNumber: "",
                            });
                          } catch (error) {
                            console.error("Failed to create customer:", error);
                          }
                        }
                      }}
                      disabled={
                        !newCustomerData.name ||
                        !newCustomerData.email ||
                        !newCustomerData.identificationNumber
                      }
                    >
                      Create Customer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCustomerForm(false);
                        setNewCustomerData({
                          name: "",
                          email: "",
                          phone: "",
                          address: "",
                          identificationType: "nic" as "nic" | "passport",
                          identificationNumber: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {selectedCustomer && (
              <Card>
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Selected Guest
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedCustomer.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedCustomer.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedCustomer.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Identification Type
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {(selectedCustomer as any).identificationType === "nic"
                          ? "NIC"
                          : (selectedCustomer as any).identificationType ===
                            "passport"
                          ? "Passport"
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ID Number
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">
                        {(selectedCustomer as any).identificationNumber ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 4:
        const applicablePackages = availablePackages.filter(
          (pkg: any) =>
            pkg.isActive &&
            (pkg.applicableEventTypes?.includes(bookingData.eventType) || true)
        );

        const selectedPackageForDisplay = availablePackages.find(
          (pkg: any) => pkg.id === bookingData.packageId
        );

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Package & Pricing
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  id="use-package"
                  name="pricing-method"
                  checked={!!bookingData.packageId}
                  onChange={() =>
                    setBookingData({
                      ...bookingData,
                      customPricing: "",
                      packageId: applicablePackages[0]?.id || "",
                    })
                  }
                />
                <label
                  htmlFor="use-package"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Select Event Package
                </label>
              </div>

              {bookingData.packageId && applicablePackages.length > 0 && (
                <div className="space-y-4">
                  <Select
                    value={bookingData.packageId}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        packageId: e.target.value,
                      })
                    }
                    options={applicablePackages.map((pkg) => ({
                      value: pkg.id,
                      label: `${pkg.name} - $${pkg.basePrice}`,
                    }))}
                  />

                  {/* Display Selected Package Details */}
                  {selectedPackageForDisplay && (
                    <Card title="Package Details">
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {selectedPackageForDisplay.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {selectedPackageForDisplay.description}
                            </p>
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                  ${selectedPackageForDisplay.basePrice}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                  base price
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Tax: {selectedPackageForDisplay.taxRate}%
                              </div>
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Included Services:
                            </h5>
                            {selectedPackageForDisplay.includedServices &&
                            selectedPackageForDisplay.includedServices.length >
                              0 ? (
                              <ul className="space-y-2">
                                {selectedPackageForDisplay.includedServices.map(
                                  (service: string, index: number) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      <span>{service}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No specific services listed for this package
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedPackageForDisplay.applicableEventTypes &&
                          selectedPackageForDisplay.applicableEventTypes
                            .length > 0 && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Suitable for Event Types:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {selectedPackageForDisplay.applicableEventTypes.map(
                                  (eventType: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full capitalize"
                                    >
                                      {eventType}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  id="custom-pricing"
                  name="pricing-method"
                  checked={!!bookingData.customPricing}
                  onChange={() =>
                    setBookingData({ ...bookingData, packageId: "" })
                  }
                />
                <label
                  htmlFor="custom-pricing"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Custom Pricing
                </label>
              </div>

              {!bookingData.packageId && (
                <Input
                  label="Custom Price ($)"
                  type="number"
                  step="0.01"
                  value={bookingData.customPricing}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      customPricing: e.target.value,
                    })
                  }
                  placeholder="2500.00"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Decoration Type"
                value={bookingData.decorationType}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    decorationType: e.target.value,
                  })
                }
                options={[
                  { value: "", label: "Select decoration type" },
                  { value: "elegant", label: "Elegant" },
                  { value: "modern", label: "Modern" },
                  { value: "traditional", label: "Traditional" },
                  { value: "rustic", label: "Rustic" },
                  { value: "vintage", label: "Vintage" },
                  { value: "minimalist", label: "Minimalist" },
                  { value: "luxury", label: "Luxury" },
                  { value: "casual", label: "Casual" },
                  { value: "themed", label: "Themed" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Select
                label="Catering Requirements"
                value={bookingData.cateringRequirements}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    cateringRequirements: e.target.value,
                  })
                }
                options={[
                  { value: "", label: "Select catering requirements" },
                  { value: "vegetarian", label: "Vegetarian" },
                  { value: "vegan", label: "Vegan" },
                  { value: "halal", label: "Halal" },
                  { value: "kosher", label: "Kosher" },
                  { value: "gluten-free", label: "Gluten-Free" },
                  {
                    value: "no-restrictions",
                    label: "No Dietary Restrictions",
                  },
                  { value: "mixed", label: "Mixed Options" },
                  { value: "buffet", label: "Buffet Style" },
                  { value: "plated", label: "Plated Service" },
                  { value: "cocktail", label: "Cocktail Style" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>
          </div>
        );

      case 5:
        const selectedHall = availableHalls.find(
          (h) => h.id === bookingData.hallId
        );
        const selectedPackage = availablePackages.find(
          (p) => p.id === bookingData.packageId
        );
        const pricing = calculateTotal();
        const taxAmount = selectedPackage
          ? (pricing.total * selectedPackage.taxRate) / 100
          : pricing.total * 0.085;
        const finalTotal = pricing.total + taxAmount;

        // Calculate event duration for display
        const eventDuration =
          bookingData.startDateTime && bookingData.endDateTime
            ? {
                hours:
                  (new Date(bookingData.endDateTime).getTime() -
                    new Date(bookingData.startDateTime).getTime()) /
                  (1000 * 60 * 60),
                standardHours: selectedPackage
                  ? selectedPackage.includedHours || 8
                  : 8,
              }
            : null;

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Review & Generate Quotation
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Summary */}
              <Card title="Event Summary">
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Event Name:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {bookingData.eventName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Type:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100 capitalize">
                        {bookingData.eventType}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Organizer:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {bookingData.organizerName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Attendees:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {bookingData.expectedAttendees}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Start:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(
                          bookingData.startDateTime
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(
                          bookingData.startDateTime
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        End:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(bookingData.endDateTime).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(bookingData.endDateTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {selectedHall && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Hall:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedHall.name} - {selectedHall.location}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Pricing Summary */}
              <Card title="Pricing Summary">
                <div className="p-6 space-y-4">
                  {selectedPackage ? (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Package:
                      </span>
                      <p className="text-gray-900 dark:text-gray-100">
                        {selectedPackage.name}
                      </p>
                      <div className="mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Included Services:
                        </span>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {selectedPackage.includedServices.map(
                            (service, index) => (
                              <li key={index}>{service}</li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Custom Pricing
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Base Amount:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        ${pricing.baseAmount.toFixed(2)}
                      </span>
                    </div>

                    {pricing.overtimeCharges > 0 && (
                      <div className="flex justify-between text-orange-600 dark:text-orange-400">
                        <span className="flex items-center gap-1">
                          Additional Hours Fees:
                          <span className="text-xs text-gray-500">
                            (
                            {eventDuration
                              ? (
                                  eventDuration.hours -
                                  eventDuration.standardHours
                                ).toFixed(1)
                              : "0"}{" "}
                            hrs × $
                            {selectedHall
                              ? (selectedHall.pricePerHour * 1.5).toFixed(2)
                              : "0"}
                            )
                          </span>
                        </span>
                        <span className="font-medium">
                          +${pricing.overtimeCharges.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        Subtotal:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        ${pricing.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">
                        Tax ({selectedPackage?.taxRate || 8.5}%):
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        ${taxAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="text-gray-900 dark:text-gray-100">
                        Total:
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Overtime Policy Information */}
            {eventDuration &&
              eventDuration.hours > eventDuration.standardHours && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-orange-800 dark:text-orange-400">
                      Overtime Charges Applied
                    </h4>
                  </div>
                  <div className="text-orange-700 dark:text-orange-300 text-sm space-y-1">
                    <p>
                      <strong>Event Duration:</strong>{" "}
                      {eventDuration.hours.toFixed(1)} hours
                    </p>
                    <p>
                      <strong>Standard Hours:</strong>{" "}
                      {eventDuration.standardHours} hours{" "}
                      {selectedPackage
                        ? "(included in package)"
                        : "(daily rate limit)"}
                    </p>
                    <p>
                      <strong>Extra Hours:</strong>{" "}
                      {(
                        eventDuration.hours - eventDuration.standardHours
                      ).toFixed(1)}{" "}
                      hours
                    </p>
                    <p>
                      <strong>Overtime Policy:</strong> Additional hours are
                      charged at 150% of the standard hourly rate.
                    </p>
                    {selectedHall && (
                      <p>
                        <strong>Overtime Rate:</strong> $
                        {(selectedHall.pricePerHour * 1.5).toFixed(2)}/hour
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Standard Policy Information */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800 dark:text-blue-400">
                  Pricing Policy
                </h4>
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <p>
                  • Standard packages include up to{" "}
                  {selectedPackage ? selectedPackage.includedHours || 8 : 8}{" "}
                  hours of event time.
                </p>
                <p>• Daily rates cover up to 12 hours of usage.</p>
                <p>
                  • Additional hours beyond the standard time are charged at
                  150% of the regular hourly rate.
                </p>
                <p>
                  • Setup and breakdown time may be included in your booking
                  duration.
                </p>
                <p>
                  • All overtime charges are calculated automatically and shown
                  in your quotation.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!quotationGenerated ? (
                <Button
                  onClick={generateQuotation}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Quotation
                </Button>
              ) : (
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download Quotation
                  </Button>
                  <Button
                    onClick={confirmBooking}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirm Booking
                  </Button>
                </div>
              )}
            </div>

            {quotationGenerated && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800 dark:text-green-400">
                    Quotation Generated
                  </h4>
                </div>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Proforma invoice has been generated and is ready for guest
                  approval.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
          Event Booking Workflow
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete event booking process with availability validation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {steps.map((step) => (
          <div
            key={step.number}
            onClick={() => {
              if (step.number <= currentStep + 1) {
                handleStepChange(step.number);
              }
            }}
            className={`transition-transform hover:scale-105 ${
              step.number <= currentStep + 1
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-50"
            }`}
          >
            <BookingStep
              stepNumber={step.number}
              title={step.title}
              description={step.description}
              isActive={currentStep === step.number}
              isCompleted={currentStep > step.number}
            />
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <div className="p-6">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between">
          <Button
            variant="secondary"
            onClick={() => handleStepChange(currentStep - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={!validateCurrentStep()}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
