import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHotel } from "../../context/HotelContext";
import { Customer } from "../../types/entities";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId, formatDate } from "../../utils/formatters";
import {
  X,
  Users,
  Check,
  Wifi,
  Tv,
  Wind,
  Coffee,
  Eye,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format as formatDateFns,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

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

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];
type CalendarMode = "checkIn" | "checkOut";

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

  // Multi-room selection state
  const [selectedRooms, setSelectedRooms] = useState<
    Array<{
      roomId: string;
      mealPlanId?: string;
    }>
  >(
    extendingReservation?.roomId
      ? [
          {
            roomId: extendingReservation.roomId,
            mealPlanId: extendingReservation.mealPlanId,
          },
        ]
      : []
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

  // Filter state
  const [filterRoomType, setFilterRoomType] = useState<string>("");
  const [filterViewType, setFilterViewType] = useState<string>("");

  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [selectedRoomForAmenities, setSelectedRoomForAmenities] = useState<
    string | null
  >(null);
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [calendarSelectionMode, setCalendarSelectionMode] =
    useState<CalendarMode>("checkIn");
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const guestDropdownRef = useRef<HTMLDivElement | null>(null);
  const guestButtonRef = useRef<HTMLButtonElement | null>(null);

  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"full" | "half" | "custom">(
    "full"
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSummary, setPaymentSummary] = useState<{
    amountPaid: number;
    balance: number;
    mode: string;
  } | null>(null);

  const initialChildAges = Array.from(
    { length: extendingReservation?.children ?? 0 },
    () => 1
  );

  const [formData, setFormData] = useState({
    customerId: extendingReservation?.customerId || "",
    roomId: extendingReservation?.roomId || "",
    checkIn: extendingReservation?.checkIn || "",
    checkOut: extendingReservation?.checkOut || "",
    adults: extendingReservation?.adults || 1,
    children: extendingReservation?.children || 0,
    bookingChannel: extendingReservation?.channelId || "direct",
    notes: extendingReservation?.notes || "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestIdNumber: "",
    childAges: initialChildAges,
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

  // useEffect hooks for click-outside detection
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isCalendarOpen]);

  useEffect(() => {
    if (!showGuestPanel) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        guestDropdownRef.current &&
        guestDropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      if (
        guestButtonRef.current &&
        guestButtonRef.current.contains(event.target as Node)
      ) {
        return;
      }
      setShowGuestPanel(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showGuestPanel]);

  useEffect(() => {
    if (currentStep !== 1) {
      setIsCalendarOpen(false);
      setShowGuestPanel(false);
    }
  }, [currentStep]);

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
      navigate("/dashboard");
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
    const firstRoom = selectedRooms[0];
    if (firstRoom && firstRoom.mealPlanId) {
      const selectedMealPlan = state.mealPlans.find(
        (mp) => mp.id === firstRoom.mealPlanId
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
          identificationNumber: formData.guestIdNumber,
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
      mealPlanId: firstRoom?.mealPlanId,
    };

    dispatch({ type: "ADD_RESERVATION", payload: newReservation });

    // Use setTimeout to ensure state update completes before navigation
    setTimeout(() => {
      navigate("/dashboard");
    }, 0);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Quick lookup by ID/Passport for returning guests
    if (name === "guestIdNumber") {
      const enteredId = value;
      const found = state.customers.find(
        (c) =>
          c.identificationNumber &&
          c.identificationNumber.toLowerCase() ===
            enteredId.trim().toLowerCase()
      );

      if (found) {
        setMatchedCustomer(found);
        setFormData((prev) => ({
          ...prev,
          guestIdNumber: enteredId,
          guestName: prev.guestName || found.name,
          guestEmail: prev.guestEmail || found.email,
          guestPhone: prev.guestPhone || found.phone,
          customerId: found.id,
        }));
      } else {
        setMatchedCustomer(null);
        setFormData((prev) => ({
          ...prev,
          guestIdNumber: enteredId,
        }));
      }
      return;
    }

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

  const applyCustomerDetails = (customer: Customer) => {
    setMatchedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      guestName: customer.name,
      guestEmail: customer.email,
      guestPhone: customer.phone,
      guestIdNumber: prev.guestIdNumber || customer.identificationNumber || "",
      customerId: customer.id,
    }));
  };

  // Calendar helper functions
  const generateMonthDays = (monthDate: Date) => {
    const start = startOfWeek(startOfMonth(monthDate));
    const end = endOfWeek(endOfMonth(monthDate));
    return eachDayOfInterval({ start, end });
  };

  const openCalendarPopover = (mode: CalendarMode) => {
    setShowGuestPanel(false);
    let baseDate = new Date();
    if (mode === "checkIn" && formData.checkIn) {
      baseDate = new Date(formData.checkIn);
    } else if (mode === "checkOut" && formData.checkOut) {
      baseDate = new Date(formData.checkOut);
    } else if (formData.checkIn) {
      baseDate = new Date(formData.checkIn);
    }
    setCalendarBaseMonth(startOfMonth(baseDate));
    setCalendarSelectionMode(mode);
    setIsCalendarOpen(true);
  };

  const toggleGuestPanel = () => {
    setIsCalendarOpen(false);
    setShowGuestPanel((prev) => !prev);
  };

  const handleCalendarDayClick = (day: Date) => {
    const iso = formatDateFns(day, "yyyy-MM-dd");
    setFormData((prev) => {
      if (calendarSelectionMode === "checkIn") {
        const existingCheckOut = prev.checkOut ? new Date(prev.checkOut) : null;
        const nextCheckOut =
          existingCheckOut && isAfter(existingCheckOut, day)
            ? prev.checkOut
            : formatDateFns(addDays(day, 1), "yyyy-MM-dd");
        return { ...prev, checkIn: iso, checkOut: nextCheckOut };
      }
      return { ...prev, checkOut: iso };
    });
    if (calendarSelectionMode === "checkIn") {
      setCalendarSelectionMode("checkOut");
    } else {
      setIsCalendarOpen(false);
    }
  };

  const renderGuestDetailsContent = () => (
    <div className="space-y-2">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
        <p className="text-xs font-semibold text-slate-900">Room {roomCount}</p>
        <p className="text-[10px] text-slate-500">
          {formData.adults} Adult{formData.adults > 1 ? "s" : ""}
          {formData.children > 0
            ? `, ${formData.children} Child${
                formData.children > 1 ? "ren" : ""
              }`
            : ""}
        </p>
      </div>

      <div className="space-y-2">
        <div className="border border-slate-200 rounded-lg p-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Adults
          </p>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{formData.adults}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) =>
                    prev.adults > 1
                      ? { ...prev, adults: prev.adults - 1 }
                      : prev
                  )
                }
                disabled={formData.adults <= 1}
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 text-sm"
              >
                –
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) =>
                    prev.adults < 10
                      ? { ...prev, adults: prev.adults + 1 }
                      : prev
                  )
                }
                disabled={formData.adults >= 10}
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Children
          </p>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{formData.children}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => {
                    if (prev.children <= 0) return prev;
                    const nextChildren = prev.children - 1;
                    return {
                      ...prev,
                      children: nextChildren,
                      childAges: prev.childAges.slice(0, nextChildren),
                    };
                  })
                }
                disabled={formData.children <= 0}
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 text-sm"
              >
                -
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => {
                    if (prev.children >= 10) return prev;
                    return {
                      ...prev,
                      children: prev.children + 1,
                      childAges: [...prev.childAges, 1],
                    };
                  })
                }
                disabled={formData.children >= 10}
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {formData.children > 0 && (
          <div className="space-y-1.5">
            {formData.childAges.map((age, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-2"
              >
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Child {index + 1} Age*
                </label>
                <select
                  value={age}
                  onChange={(e) =>
                    setFormData((prev) => {
                      const nextAges = [...prev.childAges];
                      nextAges[index] = parseInt(e.target.value, 10) || 1;
                      return { ...prev, childAges: nextAges };
                    })
                  }
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const totalGuests = formData.adults + formData.children;
  const roomCount = Math.max(1, selectedRooms.length);
  const guestSummaryLabel = `${totalGuests} guest${
    totalGuests > 1 ? "s" : ""
  }, ${roomCount} room${roomCount > 1 ? "s" : ""}`;
  const checkInDateValue = formData.checkIn ? new Date(formData.checkIn) : null;
  const checkOutDateValue = formData.checkOut
    ? new Date(formData.checkOut)
    : null;
  const today = startOfDay(new Date());
  const checkInDisplay = formData.checkIn
    ? formatDate(formData.checkIn, "EEE, MMM dd, yyyy")
    : "Add date";
  const checkOutDisplay = formData.checkOut
    ? formatDate(formData.checkOut, "EEE, MMM dd, yyyy")
    : "Add date";

  // Calculate total amount in real-time
  const calculateInvoice = () => {
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights =
      formData.checkIn && formData.checkOut
        ? Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          ) || 1
        : 0;

    let roomCost = 0;
    let mealCost = 0;
    const roomDetails: Array<{
      roomNumber: string;
      roomType: string;
      price: number;
      mealPlan: string;
      mealCost: number;
    }> = [];

    selectedRooms.forEach((selectedRoom) => {
      const room = state.rooms.find((r) => r.id === selectedRoom.roomId);
      const roomType = state.roomTypes.find((rt) => rt.id === room?.roomTypeId);
      const roomPrice = (roomType?.basePrice || 0) * nights;
      roomCost += roomPrice;

      let roomMealCost = 0;
      let mealPlanName = "No meal plan";
      if (selectedRoom.mealPlanId) {
        const selectedMealPlan = state.mealPlans.find(
          (mp) => mp.id === selectedRoom.mealPlanId
        );
        if (selectedMealPlan) {
          mealPlanName = selectedMealPlan.name;
          const perPersonCost =
            selectedMealPlan.perPersonRate * formData.adults * nights;
          const perRoomCost = (selectedMealPlan.perRoomRate || 0) * nights;
          roomMealCost = perPersonCost + perRoomCost;
          mealCost += roomMealCost;
        }
      }

      roomDetails.push({
        roomNumber: room?.roomNumber || "",
        roomType: roomType?.name || "",
        price: roomPrice,
        mealPlan: mealPlanName,
        mealCost: roomMealCost,
      });
    });

    const preTax = roomCost + mealCost;
    const tax = preTax * 0.1; // 10% tax
    const total = preTax + tax;

    return {
      nights,
      roomCost,
      mealCost,
      subtotal: preTax,
      tax,
      total,
      roomDetails,
    };
  };

  const invoice = calculateInvoice();

  const computePaymentAmount = () => {
    if (paymentMode === "half") {
      return Number(invoice.total) / 2;
    }
    if (paymentMode === "custom") {
      const parsed = Number(paymentAmount);
      return isNaN(parsed) ? 0 : parsed;
    }
    return Number(invoice.total);
  };

  const handleApplyPayment = () => {
    const paid = Math.max(0, computePaymentAmount());
    const balance = Math.max(0, Number(invoice.total) - paid);
    setPaymentSummary({
      amountPaid: paid,
      balance,
      mode:
        paymentMode === "custom"
          ? "Custom"
          : paymentMode === "half"
          ? "50%"
          : "Full",
    });
    setShowPaymentModal(false);
  };

  return (
    <>
      <div className="flex h-screen bg-white overflow-hidden">
        {/* Two Column Layout: Form (Center) + Invoice (Right) - Sidebar shows naturally from Layout */}
        {/* Center - Form Content (Takes remaining space between sidebar and invoice) */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Header */}
            <div className="mb-8 pb-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-6">
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
              <div>
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
                          currentStep >= 4
                            ? "bg-gradient-to-r from-blue-500 to-blue-600"
                            : "bg-slate-200"
                        }`}
                      />
                    </>
                  )}
                  <div
                    className={`h-2 flex-1 rounded-full transition-all duration-300 shadow-sm ${
                      currentStep >= 5
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : "bg-slate-200"
                    }`}
                  />
                </div>
                <div className="flex justify-between mt-3 text-xs font-medium text-slate-600">
                  <span
                    className={
                      currentStep >= 1 ? "text-blue-600" : "text-slate-500"
                    }
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
                        Rooms
                      </span>
                      <span
                        className={
                          currentStep >= 4 ? "text-blue-600" : "text-slate-500"
                        }
                      >
                        Guest
                      </span>
                    </>
                  )}
                  <span
                    className={
                      currentStep >= 5 ? "text-blue-600" : "text-slate-500"
                    }
                  >
                    Confirmation
                  </span>
                </div>
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
                        Current Check-In: {formData.checkIn} | Current
                        Check-Out: {formData.checkOut}
                      </p>
                      <p className="text-xs text-blue-700 mt-2">
                        You can only modify the checkout date. The room must be
                        available for the entire extended period.
                      </p>
                    </div>
                  </Card>
                )}

                <div className="relative mb-6" ref={calendarRef}>
                  <div className="grid gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => openCalendarPopover("checkIn")}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition hover:shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-slate-50 p-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                            Check-in
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {checkInDisplay}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => openCalendarPopover("checkOut")}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition hover:shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-slate-50 p-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                            Check-out
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {checkOutDisplay}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={toggleGuestPanel}
                      ref={guestButtonRef}
                      className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 p-2 text-white shadow">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                            Guests
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {guestSummaryLabel}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                  {isCalendarOpen && (
                    <div className="absolute inset-x-4 top-full z-30 mt-4 mx-auto w-[min(580px,100%)] rounded-3xl border border-slate-200 bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                        <p className="text-xs font-semibold tracking-[0.4em] text-slate-500">
                          {calendarSelectionMode === "checkIn"
                            ? "SELECT CHECK-IN"
                            : "SELECT CHECK-OUT"}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarBaseMonth((prev) =>
                                addMonths(prev, -1)
                              )
                            }
                            className="rounded-full p-1 text-slate-600 transition hover:bg-slate-100"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarBaseMonth((prev) => addMonths(prev, 1))
                            }
                            className="rounded-full p-1 text-slate-600 transition hover:bg-slate-100"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                        {[0, 1].map((offset) => {
                          const monthDate = addMonths(
                            calendarBaseMonth,
                            offset
                          );
                          const days = generateMonthDays(monthDate);
                          return (
                            <div key={offset} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">
                                  {formatDateFns(monthDate, "MMMM yyyy")}
                                </span>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-[9px] font-semibold uppercase tracking-[0.4em] text-slate-400">
                                {WEEK_DAYS.map((dayAbbrev) => (
                                  <span key={`${offset}-${dayAbbrev}`}>
                                    {dayAbbrev}
                                  </span>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {days.map((day) => {
                                  const isCurrentMonth =
                                    day.getMonth() === monthDate.getMonth();
                                  const isDisabled =
                                    isBefore(day, today) ||
                                    (calendarSelectionMode === "checkOut" &&
                                      Boolean(
                                        checkInDateValue &&
                                          !isAfter(day, checkInDateValue)
                                      ));
                                  const isStart = Boolean(
                                    checkInDateValue &&
                                      isSameDay(day, checkInDateValue)
                                  );
                                  const isEnd = Boolean(
                                    checkOutDateValue &&
                                      isSameDay(day, checkOutDateValue)
                                  );
                                  const hasRange = Boolean(
                                    checkInDateValue && checkOutDateValue
                                  );
                                  const isInRange =
                                    hasRange &&
                                    isWithinInterval(day, {
                                      start: checkInDateValue!,
                                      end: checkOutDateValue!,
                                    });
                                  const highlightClass =
                                    isStart || isEnd
                                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg"
                                      : isInRange
                                      ? "bg-blue-100 text-blue-700"
                                      : isCurrentMonth
                                      ? "text-slate-700 hover:bg-blue-50"
                                      : "text-slate-300";
                                  return (
                                    <button
                                      key={day.toISOString()}
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() =>
                                        handleCalendarDayClick(day)
                                      }
                                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${highlightClass} ${
                                        isDisabled
                                          ? "cursor-not-allowed opacity-60"
                                          : ""
                                      }`}
                                    >
                                      {day.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {showGuestPanel && !isExtendMode && (
                    <div
                      ref={guestDropdownRef}
                      className="absolute right-0 top-full z-30 mt-4 w-[min(280px,100%)] rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                        <p className="text-[10px] font-semibold tracking-wider text-slate-500">
                          GUESTS
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowGuestPanel(false)}
                          className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-2 p-3">
                        {renderGuestDetailsContent()}
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full text-xs py-1.5"
                          onClick={() => setShowGuestPanel(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Messages */}
                {errors.checkIn && (
                  <p className="text-red-500 text-xs mt-2">{errors.checkIn}</p>
                )}
                {(errors.checkOut || errors.newCheckOut) && (
                  <p className="text-red-500 text-xs mt-2">
                    {errors.checkOut || errors.newCheckOut}
                  </p>
                )}

                {/* Room Not Available Warning - Extend Mode */}
                {isExtendMode && isRoomUnavailable() && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
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
                  </div>
                )}

                {!isExtendMode && (
                  <>
                    {/* Booking Channel */}
                    <Card>
                      <div className="p-6">
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Booking Channel{" "}
                          <span className="text-red-500">*</span>
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
                {/* Header with Selected Count */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      Select Your Rooms
                    </h2>
                    <p className="text-sm text-slate-600">
                      Choose one or more rooms •{" "}
                      {
                        state.rooms.filter(
                          (room) => room.status === "available"
                        ).length
                      }{" "}
                      rooms available
                    </p>
                  </div>
                  {selectedRooms.length > 0 && (
                    <div className="text-center">
                      <div className="bg-blue-600 text-white text-3xl font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                        {selectedRooms.length}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      Room Type:
                    </label>
                    <select
                      value={filterRoomType}
                      onChange={(e) => {
                        setFilterRoomType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">All Types</option>
                      {state.roomTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">
                      View Type:
                    </label>
                    <select
                      value={filterViewType}
                      onChange={(e) => {
                        setFilterViewType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">All Views</option>
                      {state.viewTypes.map((view) => (
                        <option key={view.id} value={view.id}>
                          {view.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(filterRoomType || filterViewType) && (
                    <button
                      onClick={() => {
                        setFilterRoomType("");
                        setFilterViewType("");
                        setCurrentPage(1);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.rooms
                    .filter((room) => {
                      // Only show available rooms
                      if (room.status !== "available") return false;

                      // Filter by room type
                      if (filterRoomType && room.roomTypeId !== filterRoomType)
                        return false;

                      // Filter by view type (check via room type)
                      if (filterViewType) {
                        const roomType = state.roomTypes.find(
                          (rt) => rt.id === room.roomTypeId
                        );
                        if (!roomType || roomType.viewTypeId !== filterViewType)
                          return false;
                      }

                      return true;
                    })
                    .slice(
                      (currentPage - 1) * roomsPerPage,
                      currentPage * roomsPerPage
                    )
                    .map((room) => {
                      const roomType = state.roomTypes.find(
                        (rt) => rt.id === room.roomTypeId
                      );
                      const isSelected = selectedRooms.some(
                        (r) => r.roomId === room.id
                      );
                      const roomImage =
                        ROOM_IMAGES[roomType?.name || "Standard"] ||
                        ROOM_IMAGES["Standard"];

                      return (
                        <div
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRooms((prev) =>
                                prev.filter((r) => r.roomId !== room.id)
                              );
                            } else {
                              setSelectedRooms((prev) => [
                                ...prev,
                                { roomId: room.id },
                              ]);
                            }
                          }}
                        >
                          <Card
                            key={room.id}
                            className={`group transition-all duration-300 overflow-hidden flex flex-col h-full rounded-xl ${
                              isSelected
                                ? "ring-4 ring-green-500 ring-offset-2 shadow-2xl transform scale-[1.02]"
                                : "hover:shadow-2xl hover:-translate-y-1 border-2 border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="relative flex flex-col h-full">
                              {/* Room Image */}
                              <div className="relative h-48 overflow-hidden">
                                <img
                                  src={roomImage}
                                  alt={`${roomType?.name} Room`}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                                {/* Selected Badge Overlay */}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[1px] flex items-center justify-center">
                                    <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in zoom-in duration-200">
                                      <Check className="h-5 w-5" />
                                      <span className="font-bold">
                                        SELECTED
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Room Number Badge */}
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg shadow-lg">
                                  <span className="text-xs font-bold">
                                    Room {room.roomNumber}
                                  </span>
                                </div>

                                {/* Price Badge */}
                                <div className="absolute bottom-3 right-3 bg-white rounded-xl px-4 py-2 shadow-2xl">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-blue-600">
                                      ${roomType?.basePrice || 0}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      /night
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Room Details */}
                              <div className="p-5 space-y-3 bg-gradient-to-b from-white to-slate-50 flex-1 flex flex-col">
                                {/* Header */}
                                <div>
                                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                                    {roomType?.name || "Standard"}
                                  </h3>
                                  <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <Users className="h-4 w-4 text-blue-600" />
                                      <span>Up to 4 guests</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Amenities Section */}
                                <div className="flex-1">
                                  <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                      <Wifi className="h-3.5 w-3.5" />
                                      WiFi
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                      <Wind className="h-3.5 w-3.5" />
                                      A/C
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                      <Tv className="h-3.5 w-3.5" />
                                      TV
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoomForAmenities(room.id);
                                        setShowAmenitiesModal(true);
                                      }}
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold hover:underline"
                                    >
                                      <Info className="h-3.5 w-3.5" />
                                      View All
                                    </button>
                                  </div>
                                </div>

                                {/* Select/Deselect Room Button */}
                                <Button
                                  type="button"
                                  className={`w-full text-sm font-bold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                                    isSelected
                                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) {
                                      setSelectedRooms((prev) =>
                                        prev.filter((r) => r.roomId !== room.id)
                                      );
                                    } else {
                                      setSelectedRooms((prev) => [
                                        ...prev,
                                        { roomId: room.id },
                                      ]);
                                    }
                                  }}
                                >
                                  {isSelected ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <Check className="h-4 w-4" />
                                      Selected
                                    </span>
                                  ) : (
                                    "Select Room"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                </div>

                {/* Pagination */}
                {Math.ceil(
                  state.rooms.filter((room) => {
                    if (room.status !== "available") return false;
                    if (filterRoomType && room.roomTypeId !== filterRoomType)
                      return false;
                    if (filterViewType) {
                      const roomType = state.roomTypes.find(
                        (rt) => rt.id === room.roomTypeId
                      );
                      if (!roomType || roomType.viewTypeId !== filterViewType)
                        return false;
                    }
                    return true;
                  }).length / roomsPerPage
                ) > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2"
                    >
                      ← Previous
                    </Button>

                    <div className="flex gap-2">
                      {Array.from(
                        {
                          length: Math.ceil(
                            state.rooms.filter((room) => {
                              if (room.status !== "available") return false;
                              if (
                                filterRoomType &&
                                room.roomTypeId !== filterRoomType
                              )
                                return false;
                              if (filterViewType) {
                                const roomType = state.roomTypes.find(
                                  (rt) => rt.id === room.roomTypeId
                                );
                                if (
                                  !roomType ||
                                  roomType.viewTypeId !== filterViewType
                                )
                                  return false;
                              }
                              return true;
                            }).length / roomsPerPage
                          ),
                        },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          type="button"
                          variant={
                            currentPage === page ? "primary" : "secondary"
                          }
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 ${
                            currentPage === page ? "bg-blue-600 text-white" : ""
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            Math.ceil(
                              state.rooms.filter((room) => {
                                if (room.status !== "available") return false;
                                if (
                                  filterRoomType &&
                                  room.roomTypeId !== filterRoomType
                                )
                                  return false;
                                if (filterViewType) {
                                  const roomType = state.roomTypes.find(
                                    (rt) => rt.id === room.roomTypeId
                                  );
                                  if (
                                    !roomType ||
                                    roomType.viewTypeId !== filterViewType
                                  )
                                    return false;
                                }
                                return true;
                              }).length / roomsPerPage
                            ),
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(
                          state.rooms.filter((room) => {
                            if (room.status !== "available") return false;
                            if (
                              filterRoomType &&
                              room.roomTypeId !== filterRoomType
                            )
                              return false;
                            if (filterViewType) {
                              const roomType = state.roomTypes.find(
                                (rt) => rt.id === room.roomTypeId
                              );
                              if (
                                !roomType ||
                                roomType.viewTypeId !== filterViewType
                              )
                                return false;
                            }
                            return true;
                          }).length / roomsPerPage
                        )
                      }
                      className="px-4 py-2"
                    >
                      Next →
                    </Button>
                  </div>
                )}

                {/* Meal Plan Selection - Show for each selected room */}
                {selectedRooms.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">
                      Configure Meal Plans
                    </h3>
                    {selectedRooms.map((selectedRoom) => {
                      const room = state.rooms.find(
                        (r) => r.id === selectedRoom.roomId
                      );
                      const roomType = state.roomTypes.find(
                        (rt) => rt.id === room?.roomTypeId
                      );

                      return (
                        <Card key={selectedRoom.roomId}>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {roomType?.name || "Standard"} - Room{" "}
                                  {room?.roomNumber}
                                </h4>
                                <p className="text-sm text-slate-500">
                                  Select meal plan for this room
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRooms((prev) =>
                                    prev.filter(
                                      (r) => r.roomId !== selectedRoom.roomId
                                    )
                                  );
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Room Only */}
                              <label
                                className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                                  selectedRoom.mealPlanId === "1"
                                    ? "border-blue-500 bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`mealPlan-${selectedRoom.roomId}`}
                                    value="1"
                                    checked={selectedRoom.mealPlanId === "1"}
                                    onChange={(e) => {
                                      setSelectedRooms((prev) =>
                                        prev.map((r) =>
                                          r.roomId === selectedRoom.roomId
                                            ? {
                                                ...r,
                                                mealPlanId: e.target.value,
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-slate-900">
                                      Room Only
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      No meals included
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right mt-2 text-lg font-bold text-slate-900">
                                  $0
                                </div>
                              </label>

                              {/* Bed & Breakfast */}
                              <label
                                className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                                  selectedRoom.mealPlanId === "2"
                                    ? "border-blue-500 bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`mealPlan-${selectedRoom.roomId}`}
                                    value="2"
                                    checked={selectedRoom.mealPlanId === "2"}
                                    onChange={(e) => {
                                      setSelectedRooms((prev) =>
                                        prev.map((r) =>
                                          r.roomId === selectedRoom.roomId
                                            ? {
                                                ...r,
                                                mealPlanId: e.target.value,
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-slate-900">
                                      Bed & Breakfast
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      Breakfast included
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right mt-2 text-lg font-bold text-slate-900">
                                  +$
                                  {15 *
                                    formData.adults *
                                    (Math.ceil(
                                      (new Date(formData.checkOut).getTime() -
                                        new Date(formData.checkIn).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) || 1)}
                                </div>
                              </label>

                              {/* Half Board */}
                              <label
                                className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                                  selectedRoom.mealPlanId === "3"
                                    ? "border-blue-500 bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`mealPlan-${selectedRoom.roomId}`}
                                    value="3"
                                    checked={selectedRoom.mealPlanId === "3"}
                                    onChange={(e) => {
                                      setSelectedRooms((prev) =>
                                        prev.map((r) =>
                                          r.roomId === selectedRoom.roomId
                                            ? {
                                                ...r,
                                                mealPlanId: e.target.value,
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-slate-900">
                                      Half Board
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      Breakfast & dinner
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right mt-2 text-lg font-bold text-slate-900">
                                  +$
                                  {35 *
                                    formData.adults *
                                    (Math.ceil(
                                      (new Date(formData.checkOut).getTime() -
                                        new Date(formData.checkIn).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) || 1)}
                                </div>
                              </label>

                              {/* Full Board */}
                              <label
                                className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50 ${
                                  selectedRoom.mealPlanId === "4"
                                    ? "border-blue-500 bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`mealPlan-${selectedRoom.roomId}`}
                                    value="4"
                                    checked={selectedRoom.mealPlanId === "4"}
                                    onChange={(e) => {
                                      setSelectedRooms((prev) =>
                                        prev.map((r) =>
                                          r.roomId === selectedRoom.roomId
                                            ? {
                                                ...r,
                                                mealPlanId: e.target.value,
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-slate-900">
                                      Full Board
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      All meals included
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right mt-2 text-lg font-bold text-slate-900">
                                  +$
                                  {50 *
                                    formData.adults *
                                    (Math.ceil(
                                      (new Date(formData.checkOut).getTime() -
                                        new Date(formData.checkIn).getTime()) /
                                        (1000 * 60 * 60 * 24)
                                    ) || 1)}
                                </div>
                              </label>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Amenities Modal */}
                {showAmenitiesModal && selectedRoomForAmenities && (
                  <Modal
                    isOpen={showAmenitiesModal}
                    onClose={() => {
                      setShowAmenitiesModal(false);
                      setSelectedRoomForAmenities(null);
                    }}
                    title="Room Amenities"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Wifi className="h-5 w-5 text-blue-600" />
                          <span>Free WiFi</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Tv className="h-5 w-5 text-blue-600" />
                          <span>Smart TV</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Wind className="h-5 w-5 text-blue-600" />
                          <span>Air Conditioning</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Coffee className="h-5 w-5 text-blue-600" />
                          <span>Coffee Maker</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-blue-600" />
                          <span>Sea View</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-blue-600" />
                          <span>Mini Bar</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-blue-600" />
                          <span>Balcony</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-blue-600" />
                          <span>Room Service</span>
                        </div>
                      </div>
                    </div>
                  </Modal>
                )}

                {/* Action Buttons - Fixed at Bottom */}
                <div className="sticky bottom-0 bg-white border-t-2 border-slate-200 py-6 shadow-lg">
                  <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-6 hover:bg-slate-100 transition-all duration-200"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← Back to Dates
                    </Button>
                    <div className="flex items-center gap-4">
                      {selectedRooms.length > 0 && (
                        <div className="text-sm text-slate-600">
                          <span className="font-bold text-blue-600">
                            {selectedRooms.length}
                          </span>{" "}
                          room{selectedRooms.length > 1 ? "s" : ""} selected
                        </div>
                      )}
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
                          if (selectedRooms.length > 0) {
                            setCurrentStep(3);
                          } else {
                            alert("Please select at least one room");
                          }
                        }}
                        disabled={selectedRooms.length === 0}
                      >
                        Next Step
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Booking Summary */}
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

                {/* Returning guest helper */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex flex-col gap-2">
                  {matchedCustomer ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-800">
                            Returning guest detected
                          </p>
                          <p className="text-sm text-blue-700">
                            {matchedCustomer.name} | {matchedCustomer.email} |{" "}
                            {matchedCustomer.phone}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyCustomerDetails(matchedCustomer)}
                        >
                          Use details
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Enter an ID/Passport number to auto-fill a returning
                      guest.
                    </p>
                  )}
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
                      variant="outline"
                      className="px-6"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Payment
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 4: Guest Information */}
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
                                extendingReservation?.checkOut ||
                                  formData.checkIn
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
                                {selectedRooms.length > 0 &&
                                selectedRooms[0].mealPlanId
                                  ? state.mealPlans.find(
                                      (mp) =>
                                        mp.id === selectedRooms[0].mealPlanId
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
                              const roomCost =
                                (roomType?.basePrice || 0) * nights;

                              let mealCost = 0;
                              const firstRoom = selectedRooms[0];
                              if (firstRoom && firstRoom.mealPlanId) {
                                const selectedMealPlan = state.mealPlans.find(
                                  (mp) => mp.id === firstRoom.mealPlanId
                                );
                                if (selectedMealPlan) {
                                  const perPersonCost =
                                    selectedMealPlan.perPersonRate *
                                    formData.adults *
                                    nights;
                                  const perRoomCost =
                                    (selectedMealPlan.perRoomRate || 0) *
                                    nights;
                                  mealCost = perPersonCost + perRoomCost;
                                }
                              }

                              const totalAmount = roomCost + mealCost;

                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">
                                      Room ({nights} night
                                      {nights > 1 ? "s" : ""} ×$
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
                    onClick={() => setCurrentStep(isExtendMode ? 1 : 2)}
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
                      className="px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      Continue →
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {isExtendMode
                      ? "Confirm Extension"
                      : "Confirm Your Reservation"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isExtendMode
                      ? "Please review and confirm your extended stay"
                      : "You're almost done! Confirm your booking to complete the reservation"}
                  </p>
                </div>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Ready to Confirm
                    </h3>
                    <p className="text-slate-600">
                      {isExtendMode
                        ? "Click the button below to confirm your extended stay"
                        : "Choose how you'd like to proceed with this reservation"}
                    </p>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between pt-8 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-6 hover:bg-slate-100 transition-all duration-200"
                    onClick={() => setCurrentStep(4)}
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
                      variant="outline"
                      className="px-6"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Payment
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

        {/* Right Side - Live Invoice */}
        {currentStep !== 1 && (
          <div className="w-96 bg-white overflow-y-auto shadow-2xl border-l border-slate-200">
            <div className="p-6 sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-slate-200">
              <h2 className="text-2xl font-bold mb-1 text-slate-900">
                Invoice
              </h2>
              <p className="text-sm text-slate-500">Live Booking Summary</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Guest Information */}
              {formData.guestName && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Guest Details
                  </h3>
                  <div className="space-y-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">Name</p>
                      <p className="font-medium text-slate-900">
                        {formData.guestName}
                      </p>
                    </div>
                    {formData.guestEmail && (
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-slate-700">
                          {formData.guestEmail}
                        </p>
                      </div>
                    )}
                    {formData.guestPhone && (
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm text-slate-700">
                          {formData.guestPhone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stay Information */}
              {(formData.checkIn || formData.checkOut) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Stay Details
                  </h3>
                  <div className="space-y-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    {formData.checkIn && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-in</span>
                        <span className="font-medium text-slate-900">
                          {new Date(formData.checkIn).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {formData.checkOut && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Check-out</span>
                        <span className="font-medium text-slate-900">
                          {new Date(formData.checkOut).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {invoice.nights > 0 && (
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-500">Duration</span>
                        <span className="font-bold text-blue-600">
                          {invoice.nights} night{invoice.nights > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {formData.adults > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Guests</span>
                        <span className="text-slate-900">
                          {formData.adults} Adult
                          {formData.adults > 1 ? "s" : ""}
                          {formData.children > 0
                            ? `, ${formData.children} Child${
                                formData.children > 1 ? "ren" : ""
                              }`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Room Details */}
              {invoice.roomDetails.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Rooms ({invoice.roomDetails.length})
                  </h3>
                  <div className="space-y-3">
                    {invoice.roomDetails.map((room, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {room.roomType}
                            </p>
                            <p className="text-xs text-slate-500">
                              Room {room.roomNumber}
                            </p>
                          </div>
                          <p className="font-bold text-blue-600">
                            ${room.price.toFixed(2)}
                          </p>
                        </div>
                        {room.mealPlan !== "No meal plan" && (
                          <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                            <span className="text-slate-600">
                              {room.mealPlan}
                            </span>
                            <span className="text-green-600">
                              +${room.mealCost.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              {invoice.nights > 0 && invoice.roomDetails.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Price Summary
                  </h3>
                  <div className="space-y-2 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Room Cost</span>
                      <span className="font-medium">
                        ${invoice.roomCost.toFixed(2)}
                      </span>
                    </div>
                    {invoice.mealCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Meal Plans</span>
                        <span className="font-medium">
                          ${invoice.mealCost.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-slate-700">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="font-medium">
                        ${invoice.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tax (10%)</span>
                      <span className="font-medium">
                        ${invoice.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-blue-500">
                      <span className="text-lg font-bold">Total Amount</span>
                      <span className="text-2xl font-bold text-blue-400">
                        ${invoice.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {paymentSummary && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Payment Summary
                  </h3>
                  <div className="space-y-2 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>Mode</span>
                      <span className="font-semibold text-emerald-700">
                        {paymentSummary.mode}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>Paid</span>
                      <span className="font-semibold text-emerald-700">
                        ${paymentSummary.amountPaid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>Balance</span>
                      <span className="font-semibold text-red-600">
                        ${paymentSummary.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {invoice.nights === 0 && invoice.roomDetails.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    Fill in the booking details to see your invoice
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        footer={
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.print()}
            >
              Print Invoice
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleApplyPayment}>
                Apply Payment
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {["full", "half", "custom"].map((mode) => (
              <Button
                key={mode}
                type="button"
                variant={paymentMode === mode ? "primary" : "outline"}
                onClick={() => setPaymentMode(mode as typeof paymentMode)}
              >
                {mode === "full" ? "Full" : mode === "half" ? "50%" : "Custom"}
              </Button>
            ))}
          </div>
          {paymentMode === "custom" && (
            <Input
              label="Custom amount"
              type="number"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount paid"
            />
          )}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total due</span>
              <span className="font-semibold">${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Paying now</span>
              <span className="font-semibold text-blue-600">
                ${computePaymentAmount().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Balance</span>
              <span className="font-semibold text-red-600">
                $
                {Math.max(0, invoice.total - computePaymentAmount()).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReserveRoom;
