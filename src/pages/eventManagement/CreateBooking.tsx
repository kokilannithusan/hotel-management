import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Calendar,
  User,
  FileText,
  CreditCard,
} from "lucide-react";
import { useEventManagement } from "../../context/EventManagementContext";
import { useHotel } from "../../context/HotelContext";
import { EventCustomer } from "../../types/eventManagement";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export const CreateBooking: React.FC = () => {
  const {
    events,
    packages,
    services,
    addBooking,
    addCustomer,
    getCustomerByNicOrPassport,
    getPackagesByEventType,
  } = useEventManagement();
  const { state } = useHotel();

  const [currentStep, setCurrentStep] = useState(1);
  const [billingMode, setBillingMode] = useState<
    "Cash" | "Room" | "Reservation"
  >("Cash");
  const [roomNo, setRoomNo] = useState("");
  const [reservationNo, setReservationNo] = useState("");
  const [selectedEventTypeId, setSelectedEventTypeId] = useState("");
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [nicOrPassport, setNicOrPassport] = useState("");
  const [existingCustomer, setExistingCustomer] =
    useState<EventCustomer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [customerData, setCustomerData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    nicOrPassport: "",
    country: "",
    addressLine1: "",
    addressLine2: "",
    documentUrl: "",
  });

  const [bookingData, setBookingData] = useState({
    eventDate: "",
    eventStartTime: "",
    eventEndTime: "",
    numberOfDays: 0,
    numberOfHours: 0,
    selectedServiceQuantities: {} as Record<string, number>,
    specialRequests: "",
  });

  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  const activeEvents = events.filter((e) => e.status === "Active");
  const selectedEvent = events.find((e) => e.id === selectedEventTypeId);
  const availablePackages = selectedEventTypeId
    ? getPackagesByEventType(selectedEvent?.eventType || "")
    : [];
  const selectedPackages = packages.filter((p) =>
    selectedPackageIds.includes(p.id)
  );

  const handleCustomerLookup = () => {
    if (billingMode === "Cash") {
      // Lookup by NIC/Passport
      const customer = getCustomerByNicOrPassport(nicOrPassport);
      if (customer) {
        setExistingCustomer(customer);
        setShowCustomerForm(false);
        setCustomerData({
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          nicOrPassport: customer.nicOrPassport,
          country: customer.country,
          addressLine1: customer.addressLine1 || "",
          addressLine2: customer.addressLine2 || "",
          documentUrl: customer.documentUrl || "",
        });
      } else {
        setExistingCustomer(null);
        setShowCustomerForm(true);
        setCustomerData({
          ...customerData,
          nicOrPassport: nicOrPassport,
        });
      }
    } else if (billingMode === "Room") {
      // Lookup by Room Number
      const room = state.rooms.find((room) => room.roomNumber === roomNo);
      if (room) {
        const reservation = state.reservations.find(
          (r) => r.roomId === room.id && r.status === "checked-in"
        );
        if (reservation) {
          const hotelCustomer = state.customers.find(
            (c) => c.id === reservation.customerId
          );
          if (hotelCustomer) {
            setExistingCustomer(null);
            setShowCustomerForm(false);
            setCustomerData({
              fullName: hotelCustomer.name,
              email: hotelCustomer.email,
              phoneNumber: hotelCustomer.phone,
              nicOrPassport: hotelCustomer.identificationNumber || "",
              country: hotelCustomer.country || "",
              addressLine1: hotelCustomer.addressLine1 || "",
              addressLine2: hotelCustomer.addressLine2 || "",
              documentUrl: "",
            });
          } else {
            alert("Customer not found for this room.");
          }
        } else {
          alert("No active checked-in reservation found for this room number.");
        }
      } else {
        alert("Room not found.");
      }
    } else if (billingMode === "Reservation") {
      // Lookup by Reservation Number
      const reservation = state.reservations.find(
        (r) => r.id === reservationNo
      );
      if (reservation) {
        const hotelCustomer = state.customers.find(
          (c) => c.id === reservation.customerId
        );
        if (hotelCustomer) {
          setExistingCustomer(null);
          setShowCustomerForm(false);
          setCustomerData({
            fullName: hotelCustomer.name,
            email: hotelCustomer.email,
            phoneNumber: hotelCustomer.phone,
            nicOrPassport: hotelCustomer.identificationNumber || "",
            country: hotelCustomer.country || "",
            addressLine1: hotelCustomer.addressLine1 || "",
            addressLine2: hotelCustomer.addressLine2 || "",
            documentUrl: "",
          });
        } else {
          alert("Customer not found for this reservation.");
        }
      } else {
        alert("Reservation not found.");
      }
    }
  };

  const calculateTotalCost = () => {
    if (selectedPackages.length === 0)
      return { subtotal: 0, serviceCharge: 0, tax: 0, discount: 0, total: 0 };

    let totalBasePrice = 0;
    let totalAdditionalServicesCost = 0;
    let totalDiscount = 0;

    selectedPackages.forEach((pkg) => {
      // Calculate base price with duration multiplier based on charge type
      let packageBasePrice = pkg.basePrice;
      if (pkg.chargeType === "Day") {
        packageBasePrice = pkg.basePrice * bookingData.numberOfDays;
      } else if (pkg.chargeType === "Hour") {
        packageBasePrice = pkg.basePrice * bookingData.numberOfHours;
      }
      totalBasePrice += packageBasePrice;

      if (pkg.additionalServiceIds.length > 0) {
        const selectedServices = services.filter((s) =>
          pkg.additionalServiceIds.includes(s.id)
        );
        totalAdditionalServicesCost += selectedServices.reduce(
          (sum, service) => {
            const quantity =
              bookingData.selectedServiceQuantities[service.id] || 1;
            return sum + service.price * quantity;
          },
          0
        );
      }

      totalDiscount += pkg.discountAmount || 0;
    });

    const subtotal = totalBasePrice + totalAdditionalServicesCost;
    const total = subtotal - totalDiscount;

    return {
      basePrice: totalBasePrice,
      additionalServicesCost: totalAdditionalServicesCost,
      subtotal,
      discount: totalDiscount,
      total,
    };
  };

  const handleConfirmBooking = () => {
    if (!selectedEvent || selectedPackages.length === 0) return;

    // Add customer if new
    let customerId = existingCustomer?.id;
    if (!existingCustomer) {
      const newCustomer = addCustomer(customerData);
      customerId = newCustomer.id;
    }

    const costs = calculateTotalCost();
    const allServiceIds = new Set<string>();
    selectedPackages.forEach((pkg) => {
      pkg.additionalServiceIds.forEach((id) => allServiceIds.add(id));
    });
    const selectedServices = services
      .filter((s) => allServiceIds.has(s.id))
      .map((service) => ({
        serviceId: service.id,
        serviceName: service.serviceName,
        price: service.price,
        quantity: bookingData.selectedServiceQuantities[service.id] || 1,
        total:
          service.price *
          (bookingData.selectedServiceQuantities[service.id] || 1),
      }));

    const booking = addBooking({
      eventTypeId: selectedEventTypeId,
      eventTypeName: selectedEvent.eventName,
      packageId: selectedPackageIds.join(", "),
      packageName: selectedPackages.map((p) => p.packageName).join(", "),
      customerId: customerId!,
      customerName: customerData.fullName,
      customerEmail: customerData.email,
      customerPhone: customerData.phoneNumber,
      customerNicOrPassport: customerData.nicOrPassport,
      selectedServices,
      eventDate: bookingData.eventDate,
      eventStartTime: bookingData.eventStartTime,
      eventEndTime: bookingData.eventEndTime,
      basePrice: costs.basePrice || 0,
      additionalServicesCost: costs.additionalServicesCost || 0,
      serviceChargePercentage: 0,
      serviceChargeAmount: 0,
      taxPercentage: 0,
      taxAmount: 0,
      discountAmount: costs.discount,
      totalPayableAmount: costs.total,
      currency: selectedPackages[0]?.currency || "LKR",
      bookingStatus: "Confirmed",
      paymentStatus: "Pending",
      specialRequests: bookingData.specialRequests,
    });

    setConfirmedBooking(booking);
    setBookingConfirmed(true);
  };

  const resetBooking = () => {
    setCurrentStep(1);
    setBillingMode("Cash");
    setRoomNo("");
    setReservationNo("");
    setSelectedEventTypeId("");
    setSelectedPackageIds([]);
    setNicOrPassport("");
    setExistingCustomer(null);
    setShowCustomerForm(false);
    setCustomerData({
      fullName: "",
      email: "",
      phoneNumber: "",
      nicOrPassport: "",
      country: "",
      addressLine1: "",
      addressLine2: "",
      documentUrl: "",
    });
    setBookingData({
      eventDate: "",
      eventStartTime: "",
      eventEndTime: "",
      numberOfDays: 0,
      numberOfHours: 0,
      selectedServiceQuantities: {},
      specialRequests: "",
    });
    setBookingConfirmed(false);
    setConfirmedBooking(null);
  };

  const costs = calculateTotalCost();

  if (bookingConfirmed && confirmedBooking) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600">
              Your event booking has been successfully created
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Booking Reference Number
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {confirmedBooking.bookingReferenceNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Booking Status</p>
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                  {confirmedBooking.bookingStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Event Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 block mb-1">Event Type:</span>
                  <span className="font-medium text-base">
                    {confirmedBooking.eventTypeName}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <span className="text-gray-600 block mb-2 font-semibold">
                    Selected Packages:
                  </span>
                  <div className="space-y-3">
                    {selectedPackages.map((pkg) => {
                      // Calculate end date for day-based packages
                      const calculateEndDate = (
                        startDate: string,
                        days: number
                      ) => {
                        const date = new Date(startDate);
                        date.setDate(date.getDate() + days - 1);
                        return date.toISOString().split("T")[0];
                      };

                      return (
                        <div key={pkg.id} className="bg-blue-50 rounded p-3">
                          <div className="font-medium text-blue-900 mb-2">
                            {pkg.packageName}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Charge Type:
                              </span>
                              <span className="font-medium">
                                {pkg.chargeType}
                              </span>
                            </div>

                            {pkg.chargeType === "Day" && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Duration:
                                  </span>
                                  <span className="font-medium">
                                    {bookingData.numberOfDays} Day(s)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Start Date:
                                  </span>
                                  <span className="font-medium">
                                    {new Date(
                                      confirmedBooking.eventDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    End Date:
                                  </span>
                                  <span className="font-medium">
                                    {new Date(
                                      calculateEndDate(
                                        confirmedBooking.eventDate,
                                        bookingData.numberOfDays
                                      )
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </>
                            )}

                            {pkg.chargeType === "Hour" && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Duration:
                                  </span>
                                  <span className="font-medium">
                                    {bookingData.numberOfHours} Hour(s)
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-medium">
                                    {new Date(
                                      confirmedBooking.eventDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Start Time:
                                  </span>
                                  <span className="font-medium">
                                    {confirmedBooking.eventStartTime}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    End Time:
                                  </span>
                                  <span className="font-medium">
                                    {confirmedBooking.eventEndTime}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="flex justify-between border-t pt-1 mt-1">
                              <span className="text-gray-600">Base Price:</span>
                              <span className="font-medium">
                                {pkg.currency} {pkg.basePrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Attendees:</span>
                              <span className="font-medium">
                                {pkg.attendeesCount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Additional Services:
                              </span>
                              <span className="font-medium">
                                {pkg.additionalServiceIds.length} service(s)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {bookingData.specialRequests && (
                  <div className="border-t pt-3">
                    <span className="text-gray-600 block mb-1">
                      Special Requests:
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                      {bookingData.specialRequests}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{confirmedBooking.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">
                    {confirmedBooking.customerEmail}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">
                    {confirmedBooking.customerPhone}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">NIC/Passport:</span>
                  <p className="font-medium">
                    {confirmedBooking.customerNicOrPassport}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">
                Payment Summary
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 text-sm">
                {/* Individual Package Calculations */}
                <div className="space-y-3">
                  <span className="text-gray-700 font-semibold block mb-2">
                    Package Breakdown:
                  </span>
                  {selectedPackages.map((pkg) => {
                    // Calculate individual package costs
                    let packageBasePrice = pkg.basePrice;
                    if (pkg.chargeType === "Day") {
                      packageBasePrice =
                        pkg.basePrice * bookingData.numberOfDays;
                    } else if (pkg.chargeType === "Hour") {
                      packageBasePrice =
                        pkg.basePrice * bookingData.numberOfHours;
                    }

                    const pkgServices = services.filter((s) =>
                      pkg.additionalServiceIds.includes(s.id)
                    );
                    const pkgAdditionalServicesCost = pkgServices.reduce(
                      (sum, service) => {
                        const quantity =
                          bookingData.selectedServiceQuantities[service.id] ||
                          1;
                        return sum + service.price * quantity;
                      },
                      0
                    );

                    const pkgSubtotal =
                      packageBasePrice + pkgAdditionalServicesCost;
                    const pkgDiscount = pkg.discountAmount || 0;
                    const pkgTotal = pkgSubtotal - pkgDiscount;

                    return (
                      <div
                        key={pkg.id}
                        className="bg-white rounded p-3 border border-gray-300"
                      >
                        <div className="font-medium text-gray-900 mb-2 text-xs">
                          {pkg.packageName}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Base Price{" "}
                              {pkg.chargeType === "Day" &&
                                `(${bookingData.numberOfDays} days × ${
                                  pkg.currency
                                } ${pkg.basePrice.toLocaleString()})`}
                              {pkg.chargeType === "Hour" &&
                                `(${bookingData.numberOfHours} hours × ${
                                  pkg.currency
                                } ${pkg.basePrice.toLocaleString()})`}
                              :
                            </span>
                            <span className="font-medium">
                              {pkg.currency} {packageBasePrice.toLocaleString()}
                            </span>
                          </div>
                          {pkgAdditionalServicesCost > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Additional Services:
                              </span>
                              <span className="font-medium">
                                {pkg.currency}{" "}
                                {pkgAdditionalServicesCost.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {pkgDiscount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span className="font-medium">
                                - {pkg.currency} {pkgDiscount.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span className="font-semibold">
                              Package Total:
                            </span>
                            <span className="font-semibold text-blue-700">
                              {pkg.currency} {pkgTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Total Summary */}
                <div className="border-t-2 border-gray-400 pt-3 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-700">Total Base Price:</span>
                    <span>
                      {confirmedBooking.currency}{" "}
                      {confirmedBooking.basePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-700">
                      Total Additional Services:
                    </span>
                    <span>
                      {confirmedBooking.currency}{" "}
                      {confirmedBooking.additionalServicesCost.toLocaleString()}
                    </span>
                  </div>
                  {confirmedBooking.discountAmount > 0 && (
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Total Discount:</span>
                      <span>
                        - {confirmedBooking.currency}{" "}
                        {confirmedBooking.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-gray-400 pt-3 flex justify-between bg-blue-100 p-3 rounded">
                  <span className="font-bold text-lg">Grand Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {confirmedBooking.currency}{" "}
                    {confirmedBooking.totalPayableAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button onClick={() => window.print()} className="flex-1">
              Print Booking
            </Button>
            <Button
              onClick={resetBooking}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Create New Booking
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Create Event Booking
        </h1>
        <p className="text-gray-600 mt-1">
          Book an event package for your customer
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4">
          {[
            { num: 1, label: "Billing Mode", icon: CreditCard },
            { num: 2, label: "Select Event", icon: Calendar },
            { num: 3, label: "Select Package", icon: FileText },
            { num: 4, label: "Event Details", icon: Calendar },
            ...(billingMode === "Cash"
              ? [{ num: 5, label: "Customer Details", icon: User }]
              : []),
            {
              num: billingMode === "Cash" ? 6 : 5,
              label: "Review & Confirm",
              icon: CheckCircle,
            },
          ].map((step, idx) => (
            <React.Fragment key={step.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                    step.num === currentStep
                      ? "bg-blue-600 text-white"
                      : step.num < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {step.label}
                </span>
              </div>
              {idx < (billingMode === "Cash" ? 5 : 4) && (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Card className="p-8">
        {/* Step 1: Billing Mode & Customer Lookup */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Select Billing Mode</h2>

            {/* Billing Mode Selection */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4 text-gray-900">
                Choose Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBillingMode("Cash");
                    setRoomNo("");
                    setReservationNo("");
                    setNicOrPassport("");
                    setExistingCustomer(null);
                    setShowCustomerForm(false);
                    setCustomerData({
                      fullName: "",
                      email: "",
                      phoneNumber: "",
                      nicOrPassport: "",
                      country: "",
                      addressLine1: "",
                      addressLine2: "",
                      documentUrl: "",
                    });
                  }}
                  className={`px-6 py-6 rounded-lg border-2 transition-all font-medium text-center ${
                    billingMode === "Cash"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-3xl mb-2">💵</div>
                  <div className="font-bold">Cash</div>
                  <div className="text-xs mt-1 opacity-80">Direct Payment</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingMode("Room");
                    setNicOrPassport("");
                    setReservationNo("");
                    setExistingCustomer(null);
                    setShowCustomerForm(false);
                    setCustomerData({
                      fullName: "",
                      email: "",
                      phoneNumber: "",
                      nicOrPassport: "",
                      country: "",
                      addressLine1: "",
                      addressLine2: "",
                      documentUrl: "",
                    });
                  }}
                  className={`px-6 py-6 rounded-lg border-2 transition-all font-medium text-center ${
                    billingMode === "Room"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="font-bold">Room No</div>
                  <div className="text-xs mt-1 opacity-80">Bill to Room</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingMode("Reservation");
                    setNicOrPassport("");
                    setRoomNo("");
                    setExistingCustomer(null);
                    setShowCustomerForm(false);
                    setCustomerData({
                      fullName: "",
                      email: "",
                      phoneNumber: "",
                      nicOrPassport: "",
                      country: "",
                      addressLine1: "",
                      addressLine2: "",
                      documentUrl: "",
                    });
                  }}
                  className={`px-6 py-6 rounded-lg border-2 transition-all font-medium text-center ${
                    billingMode === "Reservation"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-3xl mb-2">📋</div>
                  <div className="font-bold">Reservation No</div>
                  <div className="text-xs mt-1 opacity-80">Bill to Booking</div>
                </button>
              </div>
            </div>

            {/* Customer Lookup - Only for Room and Reservation modes */}
            {billingMode !== "Cash" &&
              !showCustomerForm &&
              !existingCustomer &&
              customerData.fullName === "" && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h3 className="font-medium mb-4">
                    {billingMode === "Room" && "Customer Lookup by Room Number"}
                    {billingMode === "Reservation" &&
                      "Customer Lookup by Reservation Number"}
                  </h3>
                  <div className="flex gap-4">
                    {billingMode === "Room" && (
                      <Input
                        type="text"
                        placeholder="Enter Room Number"
                        value={roomNo}
                        onChange={(e) => setRoomNo(e.target.value)}
                        className="flex-1"
                      />
                    )}
                    {billingMode === "Reservation" && (
                      <Input
                        type="text"
                        placeholder="Enter Reservation Number"
                        value={reservationNo}
                        onChange={(e) => setReservationNo(e.target.value)}
                        className="flex-1"
                      />
                    )}
                    <Button onClick={handleCustomerLookup}>Lookup</Button>
                  </div>
                </div>
              )}

            {/* Existing Customer Found or Retrieved - Only for Room and Reservation modes */}
            {billingMode !== "Cash" &&
              (existingCustomer ||
                (customerData.fullName && !showCustomerForm)) && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">
                        Customer Details Retrieved!
                      </h3>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <p className="font-medium">
                            {existingCustomer
                              ? existingCustomer.fullName
                              : customerData.fullName}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">
                            {existingCustomer
                              ? existingCustomer.email
                              : customerData.email}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium">
                            {existingCustomer
                              ? existingCustomer.phoneNumber
                              : customerData.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Country:</span>
                          <p className="font-medium">
                            {existingCustomer
                              ? existingCustomer.country
                              : customerData.country}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setExistingCustomer(null);
                        setCustomerData({
                          fullName: "",
                          email: "",
                          phoneNumber: "",
                          nicOrPassport: "",
                          country: "",
                          addressLine1: "",
                          addressLine2: "",
                          documentUrl: "",
                        });
                        setNicOrPassport("");
                        setRoomNo("");
                        setReservationNo("");
                      }}
                      className="bg-gray-500"
                    >
                      Change Customer
                    </Button>
                  </div>
                </div>
              )}

            {/* Information for Cash mode */}
            {billingMode === "Cash" && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-2xl">ℹ️</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Cash Payment Selected
                    </h3>
                    <p className="text-sm text-blue-800">
                      You will be able to search for existing customers or
                      register a new customer in the{" "}
                      <strong>Customer Details</strong> step.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Registration Form - Only for Room/Reservation modes */}
            {billingMode !== "Cash" && showCustomerForm && (
              <div className="space-y-4">
                <h3 className="font-medium">New Customer Registration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.fullName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      required
                      value={customerData.phoneNumber}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIC/Passport Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.nicOrPassport}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          nicOrPassport: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.country}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <Input
                      type="text"
                      value={customerData.addressLine1}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          addressLine1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <Input
                      type="text"
                      value={customerData.addressLine2}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          addressLine2: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Event Type */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Select Event Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventTypeId(event.id)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedEventTypeId === event.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.eventName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.eventType}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Time: {event.timeOfDay}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Package */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Select Package</h2>
            {availablePackages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No packages available for this event type. Please select a
                different event.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availablePackages.map((pkg) => {
                  const isSelected = selectedPackageIds.includes(pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPackageIds(
                            selectedPackageIds.filter((id) => id !== pkg.id)
                          );
                        } else {
                          setSelectedPackageIds([
                            ...selectedPackageIds,
                            pkg.id,
                          ]);
                        }
                      }}
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <h3 className="text-xl font-semibold text-gray-900">
                        {pkg.packageName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {pkg.residencyStatus} - {pkg.chargeType}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Attendees:</span>
                          <p className="font-medium">{pkg.attendeesCount}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Services:</span>
                          <p className="font-medium">
                            {pkg.additionalServiceIds.length}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {pkg.currency} {pkg.grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Event Date & Time */}
        {currentStep === 4 &&
          (() => {
            // Determine which charge types are in selected packages
            const hasDayChargeType = selectedPackages.some(
              (pkg) => pkg.chargeType === "Day"
            );
            const hasHourChargeType = selectedPackages.some(
              (pkg) => pkg.chargeType === "Hour"
            );

            // Auto-calculate end time when start time and hours change
            const handleStartTimeChange = (startTime: string) => {
              let endTime = bookingData.eventEndTime;

              if (
                startTime &&
                hasHourChargeType &&
                bookingData.numberOfHours > 0
              ) {
                const [hours, minutes] = startTime.split(":").map(Number);
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0, 0);
                startDate.setHours(
                  startDate.getHours() + bookingData.numberOfHours
                );

                const endHours = startDate
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const endMinutes = startDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                endTime = `${endHours}:${endMinutes}`;
              }

              setBookingData({
                ...bookingData,
                eventStartTime: startTime,
                eventEndTime: endTime,
              });
            };

            const handleHoursChange = (hours: number) => {
              let endTime = bookingData.eventEndTime;

              if (
                bookingData.eventStartTime &&
                hasHourChargeType &&
                hours > 0
              ) {
                const [startHours, startMinutes] = bookingData.eventStartTime
                  .split(":")
                  .map(Number);
                const startDate = new Date();
                startDate.setHours(startHours, startMinutes, 0, 0);
                startDate.setHours(startDate.getHours() + hours);

                const endHours = startDate
                  .getHours()
                  .toString()
                  .padStart(2, "0");
                const endMinutes = startDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                endTime = `${endHours}:${endMinutes}`;
              }

              setBookingData({
                ...bookingData,
                numberOfHours: hours,
                eventEndTime: endTime,
              });
            };

            return (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Event Date & Time</h2>

                <div className="space-y-4">
                  {/* Duration Details - Show First */}
                  {(hasDayChargeType || hasHourChargeType) && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Duration Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {hasDayChargeType && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Number of Days{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              required
                              min="1"
                              value={bookingData.numberOfDays}
                              onChange={(e) =>
                                setBookingData({
                                  ...bookingData,
                                  numberOfDays: parseInt(e.target.value) || 1,
                                })
                              }
                              placeholder="Enter number of days"
                            />
                          </div>
                        )}
                        {hasHourChargeType && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Number of Hours{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              required
                              min="1"
                              value={bookingData.numberOfHours}
                              onChange={(e) =>
                                handleHoursChange(parseInt(e.target.value) || 1)
                              }
                              placeholder="Enter number of hours"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Date and Time Fields */}
                  <div
                    className={`grid ${
                      hasDayChargeType && !hasHourChargeType
                        ? "grid-cols-1"
                        : "grid-cols-3"
                    } gap-4`}
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        required
                        value={bookingData.eventDate}
                        onChange={(e) =>
                          setBookingData({
                            ...bookingData,
                            eventDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Show time fields only if Hour charge type exists */}
                    {hasHourChargeType && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="time"
                            required
                            value={bookingData.eventStartTime}
                            onChange={(e) =>
                              handleStartTimeChange(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time{" "}
                            <span className="text-gray-400">
                              (Auto-calculated)
                            </span>
                          </label>
                          <Input
                            type="time"
                            value={bookingData.eventEndTime}
                            disabled
                            className="bg-gray-100 cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          specialRequests: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any special requirements or requests..."
                    />
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Step 5: Customer Details - Only for Cash Mode */}
        {currentStep === 5 && billingMode === "Cash" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Customer Details</h2>

            {/* Customer Lookup */}
            {!showCustomerForm && !existingCustomer && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h3 className="font-medium mb-4">
                  Customer Lookup by NIC/Passport
                </h3>
                <div className="flex gap-4">
                  <Input
                    type="text"
                    placeholder="Enter NIC or Passport Number"
                    value={nicOrPassport}
                    onChange={(e) => setNicOrPassport(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCustomerLookup}>Lookup</Button>
                </div>
              </div>
            )}

            {/* Existing Customer Found */}
            {existingCustomer && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      Customer Found!
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium">
                          {existingCustomer.fullName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium">{existingCustomer.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium">
                          {existingCustomer.phoneNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Country:</span>
                        <p className="font-medium">
                          {existingCustomer.country}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setExistingCustomer(null);
                      setNicOrPassport("");
                    }}
                    className="bg-gray-500"
                  >
                    Change Customer
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Registration Form */}
            {showCustomerForm && (
              <div className="space-y-4">
                <h3 className="font-medium">New Customer Registration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.fullName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          fullName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      required
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      required
                      value={customerData.phoneNumber}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIC/Passport Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.nicOrPassport}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          nicOrPassport: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={customerData.country}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          country: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 1
                    </label>
                    <Input
                      type="text"
                      value={customerData.addressLine1}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          addressLine1: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address Line 2
                    </label>
                    <Input
                      type="text"
                      value={customerData.addressLine2}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          addressLine2: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5/6: Review & Confirm */}
        {((currentStep === 6 && billingMode === "Cash") ||
          (currentStep === 5 && billingMode !== "Cash")) &&
          (() => {
            // Calculate end date for day-based packages
            const calculateEndDate = (startDate: string, days: number) => {
              const date = new Date(startDate);
              date.setDate(date.getDate() + days - 1);
              return date.toISOString().split("T")[0];
            };

            return (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">
                  Review & Confirm Booking
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Event Details
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-600 block mb-1">
                            Event Type:
                          </span>
                          <span className="font-medium text-base">
                            {selectedEvent?.eventName}
                          </span>
                        </div>

                        <div className="border-t pt-3">
                          <span className="text-gray-600 block mb-2 font-semibold">
                            Selected Packages:
                          </span>
                          <div className="space-y-3">
                            {selectedPackages.map((pkg) => (
                              <div
                                key={pkg.id}
                                className="bg-blue-50 rounded p-3"
                              >
                                <div className="font-medium text-blue-900 mb-2">
                                  {pkg.packageName}
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Charge Type:
                                    </span>
                                    <span className="font-medium">
                                      {pkg.chargeType}
                                    </span>
                                  </div>

                                  {pkg.chargeType === "Day" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Duration:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.numberOfDays} Day(s)
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Start Date:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.eventDate}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          End Date:
                                        </span>
                                        <span className="font-medium">
                                          {calculateEndDate(
                                            bookingData.eventDate,
                                            bookingData.numberOfDays
                                          )}
                                        </span>
                                      </div>
                                    </>
                                  )}

                                  {pkg.chargeType === "Hour" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Duration:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.numberOfHours} Hour(s)
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Date:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.eventDate}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          Start Time:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.eventStartTime}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">
                                          End Time:
                                        </span>
                                        <span className="font-medium">
                                          {bookingData.eventEndTime}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {bookingData.specialRequests && (
                          <div className="border-t pt-3">
                            <span className="text-gray-600 block mb-1">
                              Special Requests:
                            </span>
                            <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                              {bookingData.specialRequests}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Customer Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">
                            {customerData.fullName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">
                            {customerData.email}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">
                            {customerData.phoneNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">NIC/Passport:</span>
                          <span className="font-medium">
                            {customerData.nicOrPassport}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Payment Summary */}
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Payment Summary
                    </h3>
                    <div className="space-y-4 text-sm">
                      {/* Individual Package Calculations */}
                      <div className="space-y-3">
                        <span className="text-gray-700 font-semibold block mb-2">
                          Package Breakdown:
                        </span>
                        {selectedPackages.map((pkg) => {
                          // Calculate individual package costs
                          let packageBasePrice = pkg.basePrice;
                          if (pkg.chargeType === "Day") {
                            packageBasePrice =
                              pkg.basePrice * bookingData.numberOfDays;
                          } else if (pkg.chargeType === "Hour") {
                            packageBasePrice =
                              pkg.basePrice * bookingData.numberOfHours;
                          }

                          const pkgServices = services.filter((s) =>
                            pkg.additionalServiceIds.includes(s.id)
                          );
                          const pkgAdditionalServicesCost = pkgServices.reduce(
                            (sum, service) => {
                              const quantity =
                                bookingData.selectedServiceQuantities[
                                  service.id
                                ] || 1;
                              return sum + service.price * quantity;
                            },
                            0
                          );

                          const pkgSubtotal =
                            packageBasePrice + pkgAdditionalServicesCost;
                          const pkgDiscount = pkg.discountAmount || 0;
                          const pkgTotal = pkgSubtotal - pkgDiscount;

                          return (
                            <div
                              key={pkg.id}
                              className="bg-white rounded p-3 border border-blue-200"
                            >
                              <div className="font-medium text-blue-900 mb-2 text-xs">
                                {pkg.packageName}
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Base Price{" "}
                                    {pkg.chargeType === "Day" &&
                                      `(${bookingData.numberOfDays} days × ${
                                        pkg.currency
                                      } ${pkg.basePrice.toLocaleString()})`}
                                    {pkg.chargeType === "Hour" &&
                                      `(${bookingData.numberOfHours} hours × ${
                                        pkg.currency
                                      } ${pkg.basePrice.toLocaleString()})`}
                                    :
                                  </span>
                                  <span className="font-medium">
                                    {pkg.currency}{" "}
                                    {packageBasePrice.toLocaleString()}
                                  </span>
                                </div>
                                {pkgAdditionalServicesCost > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Additional Services:
                                    </span>
                                    <span className="font-medium">
                                      {pkg.currency}{" "}
                                      {pkgAdditionalServicesCost.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                {pkgDiscount > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">
                                      - {pkg.currency}{" "}
                                      {pkgDiscount.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t pt-1 mt-1">
                                  <span className="font-semibold">
                                    Package Total:
                                  </span>
                                  <span className="font-semibold text-blue-700">
                                    {pkg.currency} {pkgTotal.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grand Total Summary */}
                      <div className="border-t-2 border-gray-400 pt-3 space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-700">
                            Total Base Price:
                          </span>
                          <span>
                            {selectedPackages[0]?.currency || "LKR"}{" "}
                            {(costs.basePrice || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-gray-700">
                            Total Additional Services:
                          </span>
                          <span>
                            {selectedPackages[0]?.currency || "LKR"}{" "}
                            {(
                              costs.additionalServicesCost || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                        {costs.discount > 0 && (
                          <div className="flex justify-between font-semibold text-green-600">
                            <span>Total Discount:</span>
                            <span>
                              - {selectedPackages[0]?.currency || "LKR"}{" "}
                              {costs.discount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t-2 border-gray-400 pt-3 flex justify-between bg-blue-100 p-3 rounded">
                        <span className="font-bold text-lg">Grand Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {selectedPackages[0]?.currency || "LKR"}{" "}
                          {costs.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t mt-8">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
          </div>
          <div>
            {(currentStep < 6 && billingMode === "Cash") ||
            (currentStep < 5 && billingMode !== "Cash") ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 &&
                    billingMode !== "Cash" &&
                    !customerData.fullName &&
                    !existingCustomer) ||
                  (currentStep === 2 && !selectedEventTypeId) ||
                  (currentStep === 3 && selectedPackageIds.length === 0) ||
                  (currentStep === 4 &&
                    (() => {
                      const hasHourChargeType = selectedPackages.some(
                        (pkg) => pkg.chargeType === "Hour"
                      );
                      // If hour charge type exists, require time fields
                      if (hasHourChargeType) {
                        return (
                          !bookingData.eventDate ||
                          !bookingData.eventStartTime ||
                          !bookingData.eventEndTime
                        );
                      }
                      // Otherwise, only require event date
                      return !bookingData.eventDate;
                    })()) ||
                  (currentStep === 5 &&
                    billingMode === "Cash" &&
                    (!customerData.fullName ||
                      !customerData.email ||
                      !customerData.nicOrPassport ||
                      !customerData.country))
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleConfirmBooking}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm Booking
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
