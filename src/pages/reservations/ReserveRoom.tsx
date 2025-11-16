import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/badge";
import { generateId } from "../../utils/formatters";
import {
  X,
  Users,
  Check,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Eye,
  UtensilsCrossed,
  Calendar,
} from "lucide-react";

// Room type configurations with images
const ROOM_IMAGES: Record<string, string> = {
  Standard:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&auto=format&fit=crop&q=80",
  Deluxe:
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80",
  Suite:
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop&q=80",
  Executive:
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop&q=80",
};

export const ReserveRoom: React.FC = () => {
  const { state, dispatch } = useHotel();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const extendReservationId = searchParams.get("extend");
  const isExtendMode = !!extendReservationId;

  // Get the reservation being extended
  const extendingReservation = isExtendMode
    ? state.reservations.find((r) => r.id === extendReservationId)
    : null;

  const [currentStep, setCurrentStep] = useState(isExtendMode ? 1 : 1);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    extendingReservation?.roomId || ""
  );
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<
    string | undefined
  >(extendingReservation?.mealPlanId);

  const [formData, setFormData] = useState({
    customerId: extendingReservation?.customerId || "",
    roomId: extendingReservation?.roomId || "",
    checkIn: extendingReservation?.checkIn || "",
    checkOut: extendingReservation?.checkOut || "",
    adults: extendingReservation?.adults || 1,
    children: extendingReservation?.children || 0,
    bookingChannel: extendingReservation?.channelId || "",
    notes: extendingReservation?.notes || "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestIdNumber: "",
  });

  const [errors, setErrors] = useState<{
    checkIn?: string;
    checkOut?: string;
    newCheckOut?: string;
  }>({});

  // Check room availability for the new checkout date
  const isRoomAvailableForNewDate = (newCheckOutDate: string): boolean => {
    if (!formData.roomId) return false;

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(newCheckOutDate);

    // Check if the new checkout date is after the current checkout
    if (checkOut <= new Date(formData.checkOut)) {
      return false;
    }

    // Check if room is booked during the extension period
    const otherReservations = state.reservations.filter(
      (r) => r.roomId === formData.roomId && r.id !== extendReservationId
    );

    for (const reservation of otherReservations) {
      const resCheckOut = new Date(reservation.checkOut);
      // If there's another reservation starting on or before the new checkout, it's not available
      if (resCheckOut > checkIn && resCheckOut <= checkOut) {
        return false;
      }
    }

    return true;
  };

  const validateDates = () => {
    const newErrors: typeof errors = {};

    if (!formData.checkIn) {
      newErrors.checkIn = "Invalid input: expected date, received undefined";
    }
    if (!formData.checkOut) {
      newErrors.checkOut = "Invalid input: expected date, received undefined";
    }

    // In extend mode, validate that room is available for new checkout date
    if (isExtendMode && formData.checkOut) {
      if (!isRoomAvailableForNewDate(formData.checkOut)) {
        newErrors.newCheckOut =
          "Room is not available for the selected date. Another reservation conflicts with this period.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isRoomUnavailable = () => {
    if (!isExtendMode || !formData.checkOut) return false;
    // Only show unavailable if checkout date is different from original
    if (formData.checkOut === extendingReservation?.checkOut) return false;
    return !isRoomAvailableForNewDate(formData.checkOut);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExtendMode) {
      // In extend mode, check if room is available
      const unavailable = isRoomUnavailable();

      if (unavailable) {
        // Room is not available - checkout the guest
        handleCheckIn(); // This is actually checkout in extend mode
        return;
      } else {
        // Room is available - check dates validation first
        if (validateDates()) {
          // Proceed to summary
          setCurrentStep(4);
        }
      }
    } else {
      // Normal reservation flow
      if (validateDates()) {
        setCurrentStep(2);
      }
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation("confirmed");
  };

  const handleCheckIn = () => {
    createReservation("checked-in");
  };

  const createReservation = (status: "confirmed" | "checked-in") => {
    // Handle extend mode - update existing reservation
    if (isExtendMode && extendingReservation) {
      const updatedReservation = {
        ...extendingReservation,
        checkOut: formData.checkOut,
      };
      dispatch({
        type: "UPDATE_RESERVATION",
        payload: updatedReservation,
      });
      navigate("/reservations/overview");
      return;
    }

    // Calculate total amount based on room type and nights
    const room = state.rooms.find((r) => r.id === formData.roomId);
    const roomType = state.roomTypes.find((rt) => rt.id === room?.roomTypeId);
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights =
      Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      ) || 1;

    // Calculate room cost
    const roomCost = (roomType?.basePrice || 0) * nights;

    // Calculate meal plan cost if selected
    let mealCost = 0;
    if (selectedMealPlanId) {
      const selectedMealPlan = state.mealPlans.find(
        (mp) => mp.id === selectedMealPlanId
      );
      if (selectedMealPlan) {
        const perPersonCost =
          selectedMealPlan.perPersonRate * formData.adults * nights;
        const perRoomCost = (selectedMealPlan.perRoomRate || 0) * nights;
        mealCost = perPersonCost + perRoomCost;
      }
    }

    const totalAmount = roomCost + mealCost;

    // Create or find customer
    let customerId = formData.customerId;
    if (!customerId && formData.guestEmail) {
      // Check if customer exists with this email
      const existingCustomer = state.customers.find(
        (c) => c.email.toLowerCase() === formData.guestEmail.toLowerCase()
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const newCustomerId = generateId();
        const newCustomer = {
          id: newCustomerId,
          name: formData.guestName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
          nationality: "N/A",
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "ADD_CUSTOMER", payload: newCustomer });
        customerId = newCustomerId;
      }
    }

    const newReservation = {
      id: generateId(),
      customerId: customerId || generateId(),
      roomId: formData.roomId,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      adults: formData.adults,
      children: formData.children,
      status: status,
      totalAmount,
      channelId: formData.bookingChannel || "direct",
      createdAt: new Date().toISOString(),
      notes: formData.notes || undefined,
      mealPlanId: selectedMealPlanId,
    };

    dispatch({ type: "ADD_RESERVATION", payload: newReservation });
    navigate("/reservations/overview");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "adults" || name === "children" ? parseInt(value) || 0 : value,
    }));

    // Clear errors when user types
    if (name === "checkIn" || name === "checkOut") {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 z-50 overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {isExtendMode ? "Extend Reservation" : "Booking Details"}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {isExtendMode
                ? "Update your stay with extended checkout date"
                : "Enter your check-in details and preferences"}
            </p>
          </div>
          <button
            onClick={() => navigate("/reservations/overview")}
            className="p-2 hover:bg-slate-200/50 rounded-lg transition-all duration-200 hover:shadow-md"
          >
            <X className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex gap-2">
            <div
              className={`h-2 flex-1 rounded-full transition-all duration-300 shadow-sm ${
                currentStep >= 1
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-slate-200"
              }`}
            />
            {!isExtendMode && (
              <>
                <div
                  className={`h-2 flex-1 rounded-full transition-all duration-300 shadow-sm ${
                    currentStep >= 2
                      ? "bg-gradient-to-r from-blue-500 to-blue-600"
                      : "bg-slate-200"
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full transition-all duration-300 shadow-sm ${
                    currentStep >= 3
                      ? "bg-gradient-to-r from-blue-500 to-blue-600"
                      : "bg-slate-200"
                  }`}
                />
              </>
            )}
            <div
              className={`h-2 flex-1 rounded-full transition-all duration-300 shadow-sm ${
                currentStep >= 4
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : "bg-slate-200"
              }`}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs font-medium text-slate-600">
            <span
              className={currentStep >= 1 ? "text-blue-600" : "text-slate-500"}
            >
              Dates
            </span>
            {!isExtendMode && (
              <>
                <span
                  className={
                    currentStep >= 2 ? "text-blue-600" : "text-slate-500"
                  }
                >
                  Room
                </span>
                <span
                  className={
                    currentStep >= 3 ? "text-blue-600" : "text-slate-500"
                  }
                >
                  Guest
                </span>
              </>
            )}
            <span
              className={currentStep >= 4 ? "text-blue-600" : "text-slate-500"}
            >
              Summary
            </span>
          </div>
        </div>

        {/* Step 1: Booking Details */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* Extend Mode Info */}
            {isExtendMode && (
              <Card className="bg-blue-50 border-blue-200">
                <div className="p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Extending Reservation
                  </h3>
                  <p className="text-sm text-blue-800">
                    Current Check-In: {formData.checkIn} | Current Check-Out:{" "}
                    {formData.checkOut}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    You can only modify the checkout date. The room must be
                    available for the entire extended period.
                  </p>
                </div>
              </Card>
            )}

            {/* Check-in and Check-out Dates */}
            <Card className="border-slate-200 hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-slate-50">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Stay Duration
                  </h3>
                </div>
                <div
                  className={`grid gap-6 ${
                    isExtendMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                  }`}
                >
                  {!isExtendMode && (
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-3">
                        Check-In Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <input
                          type="date"
                          name="checkIn"
                          value={formData.checkIn}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-900 font-medium ${
                            errors.checkIn
                              ? "border-red-300 bg-red-50 focus:ring-red-500"
                              : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm"
                          }`}
                          placeholder="Pick a date"
                        />
                      </div>
                      {errors.checkIn && (
                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                          <span>✕</span> {errors.checkIn}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">
                      Check-Out Date{" "}
                      {isExtendMode && (
                        <span className="text-blue-600">(New)</span>
                      )}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-slate-900 font-medium ${
                          errors.checkOut || errors.newCheckOut
                            ? "border-red-300 bg-red-50 focus:ring-red-500"
                            : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm"
                        }`}
                        placeholder="Pick a date"
                        min={isExtendMode ? formData.checkIn : undefined}
                      />
                    </div>
                    {(errors.checkOut || errors.newCheckOut) && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.checkOut || errors.newCheckOut}
                      </p>
                    )}
                  </div>
                </div>

                {/* Room Not Available Warning - Extend Mode */}
                {isExtendMode && isRoomUnavailable() && (
                  <Card className="bg-red-50 border-2 border-red-200 mt-4">
                    <div className="p-4 flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100">
                          <X className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 text-sm">
                          Room Not Available
                        </h3>
                        <p className="text-red-700 text-xs mt-1">
                          The selected checkout date conflicts with another
                          reservation. The room is not available for this
                          period.
                        </p>
                        <p className="text-red-600 text-xs font-semibold mt-2">
                          You can proceed to checkout the guest now.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            {!isExtendMode && (
              <>
                {/* Guest Information */}
                <Card>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Guest Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Number of Adults{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="adults"
                          value={formData.adults}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                        >
                          <option value="1">1 Adult</option>
                          <option value="2">2 Adults</option>
                          <option value="3">3 Adults</option>
                          <option value="4">4 Adults</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Number of Children{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="children"
                          value={formData.children}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                        >
                          <option value="0">0 Children</option>
                          <option value="1">1 Child</option>
                          <option value="2">2 Children</option>
                          <option value="3">3 Children</option>
                          <option value="4">4 Children</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Booking Channel */}
                <Card>
                  <div className="p-6">
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Booking Channel <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="bookingChannel"
                      value={formData.bookingChannel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-400"
                    >
                      <option value="">Select booking channel</option>
                      <option value="direct">Direct Booking</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="website">Website</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="expedia">Expedia</option>
                    </select>
                  </div>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-8 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                className="px-6 hover:bg-slate-100 transition-all duration-200"
                onClick={() => navigate("/reservations/overview")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                {isExtendMode
                  ? isRoomUnavailable()
                    ? "Check Out"
                    : "Proceed to Summary"
                  : "Next Step"}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Room Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Select Your Room
              </h2>
              <p className="text-sm text-slate-500">
                Choose from our available room types
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {state.rooms
                .filter((room) => room.status === "available")
                .map((room) => {
                  const roomType = state.roomTypes.find(
                    (rt) => rt.id === room.roomTypeId
                  );
                  const isSelected = selectedRoomId === room.id;
                  const roomImage =
                    ROOM_IMAGES[roomType?.name || "Standard"] ||
                    ROOM_IMAGES["Standard"];

                  return (
                    <div
                      key={room.id}
                      className={`overflow-hidden cursor-pointer transition-all duration-300 relative rounded-3xl border-2 group flex shadow-lg ${
                        isSelected
                          ? "ring-3 ring-blue-500 shadow-2xl border-blue-500 bg-gradient-to-r from-blue-50 via-white to-blue-50"
                          : "border-slate-200 hover:border-blue-400 bg-white hover:shadow-2xl"
                      }`}
                      onClick={() => {
                        setSelectedRoomId(room.id);
                        setFormData((prev) => ({ ...prev, roomId: room.id }));
                      }}
                    >
                      {/* Premium Badge */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg flex items-center gap-2 px-4 py-2">
                            <Check className="h-4 w-4" />
                            <span className="font-semibold">Selected</span>
                          </Badge>
                        </div>
                      )}

                      {/* Room Image - Left Side */}
                      <div className="relative w-64 h-auto overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0">
                        <img
                          src={roomImage}
                          alt={`${roomType?.name} Room`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Price Badge - Overlay on Image */}
                        <div className="absolute bottom-3 left-3">
                          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white/40">
                            <div className="text-3xl font-bold text-slate-900">
                              ${roomType?.basePrice || 0}
                            </div>
                            <div className="text-xs font-semibold text-slate-600">
                              per night
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room Details - Right Side */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        {/* Header */}
                        <div className="mb-4">
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {roomType?.name || "Standard"}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            Room {room.roomNumber}
                          </p>
                          <p className="text-sm text-slate-600 mt-2">
                            Premium room with modern amenities and comfortable
                            furnishings
                          </p>
                        </div>

                        {/* Features and Amenities Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          {/* Guests */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-blue-200 mb-1">
                              <Users className="h-4 w-4 text-blue-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              4 Guests
                            </span>
                          </div>

                          {/* View */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-emerald-200 mb-1">
                              <Eye className="h-4 w-4 text-emerald-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Sea View
                            </span>
                          </div>

                          {/* WiFi */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-sky-200 mb-1">
                              <Wifi className="h-4 w-4 text-sky-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              WiFi
                            </span>
                          </div>

                          {/* TV */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-purple-200 mb-1">
                              <Tv className="h-4 w-4 text-purple-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Smart TV
                            </span>
                          </div>

                          {/* A/C */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-cyan-200 mb-1">
                              <Wind className="h-4 w-4 text-cyan-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              A/C
                            </span>
                          </div>

                          {/* Coffee */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-amber-200 mb-1">
                              <Coffee className="h-4 w-4 text-amber-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Coffee
                            </span>
                          </div>

                          {/* Mini Bar */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-green-200 mb-1">
                              <Wifi className="h-4 w-4 text-green-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Mini Bar
                            </span>
                          </div>

                          {/* Balcony */}
                          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200 transition-colors">
                            <div className="p-1.5 rounded-lg bg-rose-200 mb-1">
                              <Check className="h-4 w-4 text-rose-700" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Balcony
                            </span>
                          </div>
                        </div>

                        {/* Meal Plan & Button Section */}
                        <div className="flex items-center gap-4">
                          {/* Meal Plan Selection */}
                          {isSelected && (
                            <div className="flex-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                                <div className="p-1.5 rounded-lg bg-orange-100">
                                  <UtensilsCrossed className="h-3 w-3 text-orange-600" />
                                </div>
                                Dining Plan
                              </label>
                              <select
                                value={selectedMealPlanId || ""}
                                onChange={(e) =>
                                  setSelectedMealPlanId(
                                    e.target.value || undefined
                                  )
                                }
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-medium text-slate-900 bg-gradient-to-r from-white to-slate-50 hover:border-slate-300 transition-colors appearance-none cursor-pointer"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 0.75rem center",
                                  paddingRight: "2rem",
                                }}
                              >
                                <option value="">No Meal Plan</option>
                                {state.mealPlans
                                  .filter((mp) => mp.isActive)
                                  .map((mealPlan) => {
                                    const checkIn = new Date(formData.checkIn);
                                    const checkOut = new Date(
                                      formData.checkOut
                                    );
                                    const nights =
                                      Math.ceil(
                                        (checkOut.getTime() -
                                          checkIn.getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      ) || 1;
                                    const perPersonCost =
                                      mealPlan.perPersonRate *
                                      formData.adults *
                                      nights;
                                    const perRoomCost =
                                      (mealPlan.perRoomRate || 0) * nights;
                                    const mealCost =
                                      perPersonCost + perRoomCost;

                                    return (
                                      <option
                                        key={mealPlan.id}
                                        value={mealPlan.id}
                                      >
                                        {mealPlan.name} ({mealPlan.code})
                                        {mealCost > 0
                                          ? ` +$${mealCost.toFixed(2)}`
                                          : " (Free)"}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          )}

                          {/* Selection Button */}
                          <Button
                            type="button"
                            className={`font-bold py-2 px-6 rounded-xl transition-all duration-300 whitespace-nowrap ${
                              isSelected
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                                : "bg-gradient-to-r from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoomId(room.id);
                              setFormData((prev) => ({
                                ...prev,
                                roomId: room.id,
                              }));
                            }}
                          >
                            {isSelected ? (
                              <>
                                <Check className="h-4 w-4 mr-2 inline" />
                                Ready
                              </>
                            ) : (
                              "Select Room"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                className="px-6 hover:bg-slate-100 transition-all duration-200"
                onClick={() => setCurrentStep(1)}
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6 hover:bg-slate-100 transition-all duration-200"
                  onClick={() => navigate("/reservations/overview")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    if (selectedRoomId) {
                      setCurrentStep(3);
                    } else {
                      alert("Please select a room");
                    }
                  }}
                  disabled={!selectedRoomId}
                >
                  Continue to Guest Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guest Information */}
        {currentStep === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Guest Information
              </h2>
              <p className="text-sm text-slate-500">
                Provide your contact information
              </p>
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="guestEmail"
                    value={formData.guestEmail}
                    onChange={handleChange}
                    required
                    placeholder="john.smith@email.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="guestPhone"
                    value={formData.guestPhone}
                    onChange={handleChange}
                    required
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* ID/Passport Number */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  ID/Passport Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="guestIdNumber"
                  value={formData.guestIdNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., AB123456789"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Any special requests or requirements..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                className="px-6 hover:bg-slate-100 transition-all duration-200"
                onClick={() => setCurrentStep(2)}
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6 hover:bg-slate-100 transition-all duration-200"
                  onClick={() => navigate("/reservations/overview")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Review Booking
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Step 4: Booking Summary */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {isExtendMode
                  ? "Extend Reservation - Summary"
                  : "Booking Summary"}
              </h2>
              <p className="text-sm text-slate-500">
                {isExtendMode
                  ? "Review your extended stay details"
                  : "Review your reservation details before confirming"}
              </p>
            </div>

            {/* Extend Mode Info Card */}
            {isExtendMode && (
              <Card className="bg-amber-50 border-amber-200">
                <div className="p-6">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    Extended Stay Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-amber-700 uppercase">
                        Original Check-Out
                      </label>
                      <p className="text-amber-900 font-medium">
                        {extendingReservation?.checkOut
                          ? new Date(
                              extendingReservation.checkOut
                            ).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-700 uppercase">
                        New Check-Out
                      </label>
                      <p className="text-amber-900 font-medium">
                        {new Date(formData.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-700 uppercase">
                        Additional Nights
                      </label>
                      <p className="text-amber-900 font-medium">
                        {(() => {
                          const originalCheckOut = new Date(
                            extendingReservation?.checkOut || formData.checkIn
                          );
                          const newCheckOut = new Date(formData.checkOut);
                          const additionalNights = Math.ceil(
                            (newCheckOut.getTime() -
                              originalCheckOut.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return Math.max(0, additionalNights);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Booking Details Card */}
            <Card>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Information - Hide in extend mode */}
                  {!isExtendMode && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Guest Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            Name
                          </label>
                          <p className="text-slate-900 font-medium">
                            {formData.guestName}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            Email
                          </label>
                          <p className="text-slate-900">
                            {formData.guestEmail}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            Phone
                          </label>
                          <p className="text-slate-900">
                            {formData.guestPhone}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            ID/Passport
                          </label>
                          <p className="text-slate-900 font-mono">
                            {formData.guestIdNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reservation Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Reservation Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">
                          Check-In
                        </label>
                        <p className="text-slate-900 font-medium">
                          {new Date(formData.checkIn).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">
                          Check-Out
                        </label>
                        <p className="text-slate-900 font-medium">
                          {new Date(formData.checkOut).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">
                          Guests
                        </label>
                        <p className="text-slate-900">
                          {formData.adults} Adult
                          {formData.adults > 1 ? "s" : ""}
                          {formData.children > 0 &&
                            `, ${formData.children} Child${
                              formData.children > 1 ? "ren" : ""
                            }`}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase">
                          Booking Channel
                        </label>
                        <p className="text-slate-900 capitalize">
                          {formData.bookingChannel.replace(/_/g, " ") ||
                            "Direct"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Room Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Room & Meal Plan
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            Room
                          </label>
                          <p className="text-slate-900 font-medium">
                            {(() => {
                              const room = state.rooms.find(
                                (r) => r.id === formData.roomId
                              );
                              const roomType = state.roomTypes.find(
                                (rt) => rt.id === room?.roomTypeId
                              );
                              return `${roomType?.name} - Room ${room?.roomNumber}`;
                            })()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 uppercase">
                            Meal Plan
                          </label>
                          <p className="text-slate-900">
                            {selectedMealPlanId
                              ? state.mealPlans.find(
                                  (mp) => mp.id === selectedMealPlanId
                                )?.name || "No meal plan"
                              : "No meal plan"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Price Summary
                      </h3>
                      <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                        {(() => {
                          const room = state.rooms.find(
                            (r) => r.id === formData.roomId
                          );
                          const roomType = state.roomTypes.find(
                            (rt) => rt.id === room?.roomTypeId
                          );
                          const checkIn = new Date(formData.checkIn);
                          const checkOut = new Date(formData.checkOut);
                          const nights =
                            Math.ceil(
                              (checkOut.getTime() - checkIn.getTime()) /
                                (1000 * 60 * 60 * 24)
                            ) || 1;
                          const roomCost = (roomType?.basePrice || 0) * nights;

                          let mealCost = 0;
                          if (selectedMealPlanId) {
                            const selectedMealPlan = state.mealPlans.find(
                              (mp) => mp.id === selectedMealPlanId
                            );
                            if (selectedMealPlan) {
                              const perPersonCost =
                                selectedMealPlan.perPersonRate *
                                formData.adults *
                                nights;
                              const perRoomCost =
                                (selectedMealPlan.perRoomRate || 0) * nights;
                              mealCost = perPersonCost + perRoomCost;
                            }
                          }

                          const totalAmount = roomCost + mealCost;

                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-600">
                                  Room ({nights} night{nights > 1 ? "s" : ""} ×$
                                  {roomType?.basePrice || 0})
                                </span>
                                <span className="font-semibold text-slate-900">
                                  ${roomCost.toFixed(2)}
                                </span>
                              </div>
                              {mealCost > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">
                                    Meal Plan
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    ${mealCost.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <div className="border-t border-blue-200 pt-2 mt-2">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-900">
                                    Total Amount
                                  </span>
                                  <span className="text-2xl font-bold text-blue-600">
                                    ${totalAmount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                className="px-6 hover:bg-slate-100 transition-all duration-200"
                onClick={() => setCurrentStep(isExtendMode ? 1 : 3)}
              >
                ← Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-6 hover:bg-slate-100 transition-all duration-200"
                  onClick={() => navigate("/reservations/overview")}
                >
                  Cancel
                </Button>
                {!isExtendMode && (
                  <>
                    <Button
                      type="button"
                      onClick={handleCheckIn}
                      className="px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Check-in
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFinalSubmit}
                      className="px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Confirm Booking
                    </Button>
                  </>
                )}
                {isExtendMode && (
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="px-8 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    Confirm Extension
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReserveRoom;
