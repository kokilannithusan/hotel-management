import React, { ChangeEvent, useState, useEffect, useRef } from "react";
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
  SignalHigh,
  DollarSign,
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
type AdultProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  country: string;
  address: string;
  documentName: string;
  documentUrl: string;
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

  // Load stay type combinations from localStorage
  type StayTypeCombination = {
    id: string;
    roomTypeId: string;
    adults: number;
    children: number;
    mealPlanId: string;
    viewTypeId: string;
    pricing: Array<{ currency: string; price: number }>;
  };

  const [stayTypeCombinations] = useState<StayTypeCombination[]>(() => {
    try {
      const saved = localStorage.getItem("hotel-stay-type-combinations");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading stay type combinations:", error);
      return [];
    }
  });

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
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(
    () => state.settings?.currency || state.currencyRates[0]?.code || "USD"
  );

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
    guestCountry: "",
    guestAddressLine2: "",
    guestDocumentName: "",
    guestDocumentUrl: "",
    childAges: initialChildAges,
  });

  const createAdultProfile = (
    seed: Partial<AdultProfile> = {}
  ): AdultProfile => ({
    id: generateId(),
    fullName: seed.fullName || "",
    email: seed.email || "",
    phone: seed.phone || "",
    idNumber: seed.idNumber || "",
    country: seed.country || "",
    address: seed.address || "",
    documentName: seed.documentName || "",
    documentUrl: seed.documentUrl || "",
  });

  const [adultProfiles, setAdultProfiles] = useState<AdultProfile[]>(() => [
    createAdultProfile({
      fullName: formData.guestName,
      email: formData.guestEmail,
      phone: formData.guestPhone,
      idNumber: formData.guestIdNumber,
      country: formData.guestCountry,
      address: formData.guestAddressLine2,
      documentName: formData.guestDocumentName,
      documentUrl: formData.guestDocumentUrl,
    }),
  ]);
  useEffect(() => {
    setAdultProfiles((prev) => {
      if (prev.length === formData.adults) return prev;
      if (prev.length < formData.adults) {
        const additions = Array.from(
          { length: formData.adults - prev.length },
          () => createAdultProfile()
        );
        return [...prev, ...additions];
      }
      return prev.slice(0, formData.adults);
    });
  }, [formData.adults]);

  useEffect(() => {
    setAdultProfiles((prev) => {
      if (prev.length === 0) return [createAdultProfile()];
      const first = prev[0];
      if (
        first.fullName === formData.guestName &&
        first.email === formData.guestEmail &&
        first.phone === formData.guestPhone &&
        first.idNumber === formData.guestIdNumber &&
        first.country === formData.guestCountry &&
        first.address === formData.guestAddressLine2 &&
        first.documentName === formData.guestDocumentName &&
        first.documentUrl === formData.guestDocumentUrl
      ) {
        return prev;
      }
      const next = [...prev];
      next[0] = {
        ...first,
        fullName: formData.guestName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        idNumber: formData.guestIdNumber,
        country: formData.guestCountry,
        address: formData.guestAddressLine2,
        documentName: formData.guestDocumentName,
        documentUrl: formData.guestDocumentUrl,
      };
      return next;
    });
  }, [
    formData.guestName,
    formData.guestEmail,
    formData.guestPhone,
    formData.guestIdNumber,
    formData.guestCountry,
    formData.guestAddressLine2,
    formData.guestDocumentName,
    formData.guestDocumentUrl,
  ]);

  const updateAdultProfile = (
    index: number,
    field: keyof AdultProfile,
    value: string
  ) => {
    setAdultProfiles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    if (index === 0) {
      const updates: Partial<typeof formData> = {};
      if (field === "fullName") updates.guestName = value;
      if (field === "email") updates.guestEmail = value;
      if (field === "phone") updates.guestPhone = value;
      if (field === "idNumber") updates.guestIdNumber = value;
      if (field === "country") updates.guestCountry = value;
      if (field === "address") updates.guestAddressLine2 = value;
      if (field === "documentName") updates.guestDocumentName = value;
      if (field === "documentUrl") updates.guestDocumentUrl = value;
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleAdultDocumentUpload = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      updateAdultProfile(index, "documentName", file.name);
      updateAdultProfile(index, "documentUrl", data);
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

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

  useEffect(() => {
    if (
      state.settings?.currency &&
      state.settings.currency !== selectedCurrencyCode
    ) {
      setSelectedCurrencyCode(state.settings.currency);
    }
  }, [state.settings?.currency, selectedCurrencyCode]);

  useEffect(() => {
    if (
      state.currencyRates.length > 0 &&
      !state.currencyRates.some((rate) => rate.code === selectedCurrencyCode)
    ) {
      setSelectedCurrencyCode(state.currencyRates[0].code);
    }
  }, [selectedCurrencyCode, state.currencyRates]);

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
        const [guestFirstName, ...guestLastParts] = formData.guestName
          .trim()
          .split(" ");
        const guestLastName =
          guestLastParts.length > 0 ? guestLastParts.join(" ") : guestFirstName;
        const guestFullName = `${guestFirstName} ${guestLastName}`.trim();
        const newCustomer = {
          id: newCustomerId,
          name: guestFullName,
          firstName: guestFirstName,
          lastName: guestLastName,
          email: formData.guestEmail,
          phone: formData.guestPhone,
          identificationNumber: formData.guestIdNumber,
          nationality: "N/A",
          country: formData.guestCountry || "",
          addressLine2: formData.guestAddressLine2 || "",
          identificationDocumentName: formData.guestDocumentName || undefined,
          identificationDocumentUrl: formData.guestDocumentUrl || undefined,
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
    navigate("/dashboard");
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
          guestCountry: prev.guestCountry || found.country || "",
          guestAddressLine2: prev.guestAddressLine2 || found.addressLine2 || "",
          guestDocumentName:
            prev.guestDocumentName || found.identificationDocumentName || "",
          guestDocumentUrl:
            prev.guestDocumentUrl || found.identificationDocumentUrl || "",
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
      guestCountry: prev.guestCountry || customer.country || "",
      guestAddressLine2: prev.guestAddressLine2 || customer.addressLine2 || "",
      guestDocumentName:
        prev.guestDocumentName || customer.identificationDocumentName || "",
      guestDocumentUrl:
        prev.guestDocumentUrl || customer.identificationDocumentUrl || "",
    }));
  };

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

  const guestNameParts = formData.guestName
    ? formData.guestName.trim().split(/\s+/).filter(Boolean)
    : [];
  const guestFirstName = guestNameParts[0] ?? "";
  const guestLastName = guestNameParts.slice(1).join(" ");

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
      <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-center">
        <p className="text-[10px] font-semibold text-slate-900">
          Room {roomCount}
        </p>
        <p className="text-[9px] text-slate-500">
          {formData.adults} Adult{formData.adults > 1 ? "s" : ""}
          {formData.children > 0
            ? `, ${formData.children} Child${
                formData.children > 1 ? "ren" : ""
              }`
            : ""}
        </p>
      </div>

      <div className="space-y-2">
        <div className="border border-slate-200 rounded-md p-2 space-y-1">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
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
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition text-sm"
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
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md p-2 space-y-1">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
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
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition text-sm"
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
                className="w-7 h-7 rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition text-sm"
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
                className="border border-slate-200 rounded-md p-1.5 flex items-center justify-between"
              >
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
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
                  className="w-14 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] focus:border-blue-500 focus:outline-none"
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

  const guestDetailLabel = `${formData.adults} Adult${
    formData.adults > 1 ? "s" : ""
  }${
    formData.children > 0
      ? `, ${formData.children} Child${formData.children > 1 ? "ren" : ""}`
      : ""
  }`;
  const channelLabel = formData.bookingChannel?.replace(/_/g, " ") || "Direct";
  const selectedCurrencyRate =
    state.currencyRates.find((rate) => rate.code === selectedCurrencyCode) ||
    state.currencyRates[0];
  const currencyLabel = selectedCurrencyRate
    ? `${selectedCurrencyRate.currency} (${selectedCurrencyRate.code})`
    : selectedCurrencyCode || state.settings?.currency || "USD";

  return (
    <>
      <div className="flex h-screen bg-white">
        {/* Two Column Layout: Form (Center) + Invoice (Right) - Sidebar shows naturally from Layout */}
        {/* Center - Form Content (Takes remaining space between sidebar and invoice) */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-8 py-4">
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {isExtendMode ? "Extend Reservation" : "Booking Details"}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
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

              {/* Guest / Date controls were moved to the Dates step */}

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

                <div className="relative mb-[500px]" ref={calendarRef}>
                  <Card className="shadow-lg border border-slate-200">
                    <div className="p-4">
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 divide-x divide-slate-200">
                        <button
                          type="button"
                          onClick={() => openCalendarPopover("checkIn")}
                          className={`text-left px-3 py-1.5 transition focus:outline-none ${
                            isCalendarOpen &&
                            calendarSelectionMode === "checkIn"
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
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
                          className={`text-left px-3 py-1.5 transition focus:outline-none ${
                            isCalendarOpen &&
                            calendarSelectionMode === "checkOut"
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                                Check-out
                              </p>
                              <p className="text-sm font-semibold text-slate-900">
                                {checkOutDisplay}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="relative w-full">
                          <button
                            type="button"
                            onClick={toggleGuestPanel}
                            ref={guestButtonRef}
                            className={`text-left px-3 py-1.5 transition focus:outline-none h-full w-full ${
                              showGuestPanel ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2 h-full">
                              <Users className="h-4 w-4 text-blue-600" />
                              <div className="flex-1">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                                  Guests
                                </p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {guestSummaryLabel}
                                </p>
                              </div>
                            </div>
                          </button>
                          {showGuestPanel && !isExtendMode && (
                            <div
                              ref={guestDropdownRef}
                              className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] rounded-md border border-blue-200 bg-white shadow-lg"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1.5 rounded-t-md">
                                <p className="text-[8px] font-bold tracking-[0.15em] text-blue-700">
                                  GUESTS
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setShowGuestPanel(false)}
                                  className="rounded-full p-0.5 text-blue-600 transition hover:bg-white"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                              <div className="space-y-2 p-2.5">
                                {renderGuestDetailsContent()}
                                <Button
                                  type="button"
                                  variant="primary"
                                  className="w-full"
                                  onClick={() => setShowGuestPanel(false)}
                                >
                                  Done
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {!isExtendMode && (
                          <div className="flex flex-col gap-1 px-3 py-1.5">
                            <div className="flex items-center gap-2">
                              <SignalHigh className="h-4 w-4 text-blue-600" />
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                                Booking Channel
                              </span>
                            </div>
                            <select
                              name="bookingChannel"
                              value={formData.bookingChannel}
                              onChange={handleChange}
                              required
                              className="w-full appearance-none rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition hover:border-slate-400 bg-white"
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
                        )}
                        <div className="flex flex-col gap-1 px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                              Currency
                            </span>
                          </div>
                          <select
                            value={selectedCurrencyCode}
                            onChange={(e) =>
                              setSelectedCurrencyCode(e.target.value)
                            }
                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition hover:border-slate-400"
                          >
                            {state.currencyRates.length > 0 ? (
                              state.currencyRates.map((rate) => (
                                <option key={rate.id} value={rate.code}>
                                  {rate.currency} ({rate.code})
                                </option>
                              ))
                            ) : (
                              <option value={selectedCurrencyCode}>
                                {currencyLabel}
                              </option>
                            )}
                          </select>
                          <p className="text-[11px] text-slate-400">
                            Hotel base currency
                          </p>
                        </div>

                        {/* Search Button inline */}
                        <div className="flex items-center justify-center px-3 py-1.5">
                          <Button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            {isExtendMode
                              ? isRoomUnavailable()
                                ? "Check Out"
                                : "Proceed to Summary"
                              : "Search"}
                          </Button>
                        </div>
                      </div>

                      {/* Calendar positioned below the card */}
                      {isCalendarOpen && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-white shadow-md max-w-lg">
                          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1.5 rounded-t-lg">
                            <p className="text-[8px] font-bold tracking-wide text-blue-700">
                              {calendarSelectionMode === "checkIn"
                                ? "SELECT CHECK-IN"
                                : "SELECT CHECK-OUT"}
                            </p>
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setCalendarBaseMonth((prev) =>
                                    addMonths(prev, -1)
                                  )
                                }
                                className="rounded-full p-0.5 text-blue-600 transition hover:bg-white"
                              >
                                <ChevronLeft className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCalendarBaseMonth((prev) =>
                                    addMonths(prev, 1)
                                  )
                                }
                                className="rounded-full p-0.5 text-blue-600 transition hover:bg-white"
                              >
                                <ChevronRight className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          </div>
                          <div className="grid gap-2 px-2.5 py-2 md:grid-cols-2">
                            {[0, 1].map((offset) => {
                              const monthDate = addMonths(
                                calendarBaseMonth,
                                offset
                              );
                              const days = generateMonthDays(monthDate);
                              return (
                                <div key={offset} className="space-y-1.5">
                                  <div className="flex items-center justify-center pb-0.5 border-b border-slate-100">
                                    <span className="text-[10px] font-bold text-blue-700">
                                      {formatDateFns(monthDate, "MMMM yyyy")}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-7 gap-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-500 text-center">
                                    {WEEK_DAYS.map((dayAbbrev) => (
                                      <span key={`${offset}-${dayAbbrev}`}>
                                        {dayAbbrev}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="grid grid-cols-7 gap-0.5">
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
                                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm scale-105"
                                          : isInRange
                                          ? "bg-blue-100 text-blue-800 font-semibold"
                                          : isCurrentMonth
                                          ? "text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                                          : "text-slate-300";
                                      return (
                                        <button
                                          key={day.toISOString()}
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() =>
                                            handleCalendarDayClick(day)
                                          }
                                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-150 ${highlightClass} ${
                                            isDisabled
                                              ? "cursor-not-allowed opacity-40"
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
                    </div>
                  </Card>
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
              </form>
            )}

            {/* Step 2: Room Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
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

                {/* Room Grid - Grouped by Room Type */}
                <div className="space-y-8">
                  {(() => {
                    // Filter rooms based on availability and stay type combinations
                    const filteredRooms = state.rooms.filter((room) => {
                      // Only show available rooms
                      if (room.status !== "available") return false;

                      // Filter by stay type combinations only if combinations exist
                      if (stayTypeCombinations.length > 0) {
                        // Find combinations for this room type that can accommodate the selected number of adults
                        const matchingCombinations =
                          stayTypeCombinations.filter(
                            (combo) =>
                              combo.roomTypeId === room.roomTypeId &&
                              combo.adults >= formData.adults
                          );

                        // If no matching combinations found, don't show this room
                        if (matchingCombinations.length === 0) return false;
                      }

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
                    });

                    // Group rooms by room type
                    const roomsByType = filteredRooms.reduce((acc, room) => {
                      const typeId = room.roomTypeId;
                      if (!acc[typeId]) {
                        acc[typeId] = [];
                      }
                      acc[typeId].push(room);
                      return acc;
                    }, {} as Record<string, typeof state.rooms>);

                    // Sort room types (Suite, Executive, Deluxe, Standard, etc.)
                    const typeOrder = [
                      "Suite",
                      "Executive",
                      "Deluxe",
                      "Standard",
                    ];
                    const sortedTypeIds = Object.keys(roomsByType).sort(
                      (a, b) => {
                        const typeA = state.roomTypes.find((rt) => rt.id === a);
                        const typeB = state.roomTypes.find((rt) => rt.id === b);
                        const indexA = typeOrder.indexOf(typeA?.name || "");
                        const indexB = typeOrder.indexOf(typeB?.name || "");

                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                      }
                    );

                    return sortedTypeIds.map((typeId) => {
                      const roomType = state.roomTypes.find(
                        (rt) => rt.id === typeId
                      );
                      const roomsOfType = roomsByType[typeId];

                      // Get unique meal plans for this room type
                      const roomCombinations = stayTypeCombinations.filter(
                        (combo) =>
                          combo.roomTypeId === typeId &&
                          combo.adults >= formData.adults
                      );

                      const uniqueMealPlanIds = [
                        ...new Set(roomCombinations.map((c) => c.mealPlanId)),
                      ];

                      return (
                        <div key={typeId} className="space-y-4">
                          {/* Room Type Header */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {roomType?.name}
                            </h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
                            <span className="text-sm text-slate-500 font-medium">
                              {roomsOfType.length} available
                            </span>
                          </div>

                          {/* Cards Grid - One card per meal plan */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {uniqueMealPlanIds.map((mealPlanId) => {
                              // Pick first available room of this type
                              const representativeRoom = roomsOfType[0];
                              const isSelected = selectedRooms.some(
                                (r) => r.roomId === representativeRoom.id
                              );
                              const roomImage =
                                ROOM_IMAGES[roomType?.name || "Standard"] ||
                                ROOM_IMAGES["Standard"];

                              const mealPlan = state.mealPlans.find(
                                (mp) => mp.id === mealPlanId
                              );

                              return (
                                <div
                                  key={`${typeId}-${mealPlanId}`}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedRooms((prev) =>
                                        prev.filter(
                                          (r) =>
                                            r.roomId !== representativeRoom.id
                                        )
                                      );
                                    } else {
                                      setSelectedRooms((prev) => [
                                        ...prev,
                                        { roomId: representativeRoom.id },
                                      ]);
                                    }
                                  }}
                                >
                                  <Card
                                    key={`${typeId}-card`}
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

                                        {/* Meal Plan Section */}
                                        {mealPlan && (
                                          <div className="space-y-2">
                                            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                              Meal Plan
                                            </h4>
                                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full text-sm font-semibold border border-emerald-200 justify-center">
                                              <Coffee className="h-4 w-4" />
                                              {mealPlan.code}
                                            </div>
                                          </div>
                                        )}

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
                                                setSelectedRoomForAmenities(
                                                  representativeRoom.id
                                                );
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
                                                prev.filter(
                                                  (r) =>
                                                    r.roomId !==
                                                    representativeRoom.id
                                                )
                                              );
                                            } else {
                                              setSelectedRooms((prev) => [
                                                ...prev,
                                                {
                                                  roomId: representativeRoom.id,
                                                },
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
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Pagination - Removed since we're showing all rooms grouped by type */}
                {false &&
                  Math.ceil(
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
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : ""
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
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    Guest Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Provide your contact information
                  </p>
                </div>

                {/* Returning guest helper */}
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-2.5 flex flex-col gap-1.5">
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

                <div className="space-y-3">
                  <div className="space-y-3">
                    {adultProfiles.map((profile, index) => (
                      <div
                        key={profile.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-slate-800">
                            Adult {index + 1}
                          </h3>
                          {index === 0 && (
                            <span className="text-xs font-semibold text-red-500">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Full Name{" "}
                              {index === 0 && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={profile.fullName}
                              required={index === 0}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "fullName",
                                  e.target.value
                                )
                              }
                              placeholder="John Smith"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Email{" "}
                              {index === 0 && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="email"
                              value={profile.email}
                              required={index === 0}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="john.smith@email.com"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Phone{" "}
                              {index === 0 && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="tel"
                              value={profile.phone}
                              required={index === 0}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "phone",
                                  e.target.value
                                )
                              }
                              placeholder="+1 234 567 8900"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              ID/Passport{" "}
                              {index === 0 && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={profile.idNumber}
                              required={index === 0}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "idNumber",
                                  e.target.value
                                )
                              }
                              placeholder="AB123456789"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              value={profile.country}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "country",
                                  e.target.value
                                )
                              }
                              placeholder="Country"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              value={profile.address}
                              onChange={(e) =>
                                updateAdultProfile(
                                  index,
                                  "address",
                                  e.target.value
                                )
                              }
                              placeholder="Apt, suite, building, etc."
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-900 mb-1">
                              Document
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer transition hover:border-blue-400 hover:text-blue-600">
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(event) =>
                                  handleAdultDocumentUpload(index, event)
                                }
                              />
                              Upload
                            </label>
                            {profile.documentName && (
                              <p className="mt-1 text-xs text-slate-500">
                                <span className="font-medium">
                                  {profile.documentName}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-900 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Any special requests..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Payment Option Section */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-800">
                        Payment Option
                      </h3>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {["full", "half", "custom"].map((mode) => (
                        <Button
                          key={mode}
                          type="button"
                          variant={paymentMode === mode ? "primary" : "outline"}
                          onClick={() =>
                            setPaymentMode(mode as typeof paymentMode)
                          }
                        >
                          {mode === "full"
                            ? "Full Payment"
                            : mode === "half"
                            ? "50% Payment"
                            : "Custom Amount"}
                        </Button>
                      ))}
                    </div>

                    {paymentMode === "custom" && (
                      <div>
                        <label className="block text-xs font-medium text-slate-900 mb-1">
                          Custom Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Total Amount Due</span>
                        <span className="font-semibold text-slate-900">
                          ${invoice.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Paying Now</span>
                        <span className="font-semibold text-blue-600">
                          ${computePaymentAmount().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
                        <span className="text-slate-600">Balance</span>
                        <span className="font-semibold text-red-600">
                          $
                          {Math.max(
                            0,
                            invoice.total - computePaymentAmount()
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-4 hover:bg-slate-100 transition-all duration-200"
                    onClick={() => setCurrentStep(2)}
                  >
                    ← Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-4 hover:bg-slate-100 transition-all duration-200"
                      onClick={() => navigate("/reservations/overview")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        // Set payment summary when proceeding to next step
                        const paid = Math.max(0, computePaymentAmount());
                        const balance = Math.max(
                          0,
                          Number(invoice.total) - paid
                        );
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
                        setCurrentStep(5);
                      }}
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
                  <div className="rounded-lg border border-slate-200 bg-white/90 shadow-sm overflow-x-auto">
                    <table className="min-w-full text-[11px] text-slate-600">
                      <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">First name</th>
                          <th className="px-3 py-2 text-left">Last name</th>
                          <th className="px-3 py-2 text-left">
                            ID (NIC/Passport)
                          </th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Phone</th>
                          <th className="px-3 py-2 text-left">Country</th>
                          <th className="px-3 py-2 text-left">Add. 2</th>
                          <th className="px-3 py-2 text-left">
                            NIC/Passport doc
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="text-sm font-medium text-slate-900">
                          <td className="px-3 py-2">{guestFirstName || "—"}</td>
                          <td className="px-3 py-2">{guestLastName || "—"}</td>
                          <td className="px-3 py-2">
                            {formData.guestIdNumber || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formData.guestEmail || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formData.guestPhone || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formData.guestCountry || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formData.guestAddressLine2 || "—"}
                          </td>
                          <td className="px-3 py-2">
                            {formData.guestDocumentUrl ? (
                              <a
                                href={formData.guestDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline"
                              >
                                {formData.guestDocumentName || "View document"}
                              </a>
                            ) : (
                              <span className="text-slate-400">
                                Not uploaded
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Stay Information */}
              {(formData.checkIn || formData.checkOut) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    Stay Details
                  </h3>
                  <div className="rounded-lg border border-slate-200 bg-white/90 shadow-sm">
                    <div className="space-y-2 px-5 py-4 text-sm text-slate-600">
                      {formData.checkIn && (
                        <div className="flex items-center justify-between">
                          <span>Check-in</span>
                          <span className="text-slate-900 font-semibold">
                            {new Date(formData.checkIn).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {formData.checkOut && (
                        <div className="flex items-center justify-between">
                          <span>Check-out</span>
                          <span className="text-slate-900 font-semibold">
                            {new Date(formData.checkOut).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {invoice.nights > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Duration</span>
                          <span className="text-blue-600 font-semibold">
                            {invoice.nights} night
                            {invoice.nights > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span>Guests</span>
                        <span className="text-slate-900 font-semibold">
                          {guestDetailLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Booking Channel</span>
                        <span className="text-slate-900 font-semibold">
                          {channelLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Currency</span>
                        <span className="text-slate-900 font-semibold">
                          {currencyLabel}
                        </span>
                      </div>
                    </div>
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
