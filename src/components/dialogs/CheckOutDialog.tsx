import { useState, useMemo, useEffect, ChangeEvent } from "react";
import { Button } from "../ui/Button";
import { useHotel } from "../../context/HotelContext";
import { formatCurrency } from "../../utils/formatters";
import type { Reservation, Room, Customer } from "../../types/entities";

interface CheckOutDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onCheckOutComplete: () => void;
  initialStep?: DialogStep;
}

type DialogStep =
  | "summary"
  | "extend-date"
  | "extend-room"
  | "confirm-extension"
  | "final-checkout";

export function CheckOutDialog({
  reservation,
  onClose,
  onCheckOutComplete,
  initialStep = "summary",
}: CheckOutDialogProps) {
  const { state, dispatch } = useHotel();
  const [step, setStep] = useState<DialogStep>(initialStep);
  const isExtendOnlyMode = initialStep === "extend-date";

  // Extension states
  const [newCheckOutDate, setNewCheckOutDate] = useState(reservation.checkOut);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    reservation.roomId
  );
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [adults, setAdults] = useState(reservation.adults);
  const [children, setChildren] = useState(reservation.children);
  const [notes, setNotes] = useState(reservation.notes || "");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [identificationDocumentName, setIdentificationDocumentName] =
    useState("");
  const [identificationDocumentUrl, setIdentificationDocumentUrl] =
    useState("");
  const [identificationError, setIdentificationError] = useState("");
  const [keyTag, setKeyTag] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [keyReturnStatus, setKeyReturnStatus] = useState<
    "returned" | "pending"
  >("returned");
  const [extensionMode, setExtensionMode] = useState<
    "change-room" | "change-stay-type" | null
  >(null);
  const [selectedStayTypeCombinationId, setSelectedStayTypeCombinationId] =
    useState<string | null>(null);

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

  const currentRoom = state.rooms.find((r) => r.id === reservation.roomId);
  const currentRoomType = state.roomTypes.find(
    (rt) => rt.id === currentRoom?.roomTypeId
  );
  const customer = state.customers.find((c) => c.id === reservation.customerId);
  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomType = state.roomTypes.find(
    (rt) => rt.id === selectedRoom?.roomTypeId
  );

  useEffect(() => {
    setIdentificationNumber(customer?.identificationNumber ?? "");
    setIdentificationDocumentName(customer?.identificationDocumentName ?? "");
    setIdentificationDocumentUrl(customer?.identificationDocumentUrl ?? "");
  }, [
    customer?.identificationNumber,
    customer?.identificationDocumentName,
    customer?.identificationDocumentUrl,
  ]);

  // Calculate original nights
  const originalNights = useMemo(() => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [reservation.checkIn, reservation.checkOut]);

  // Calculate extended nights
  const extendedNights = useMemo(() => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(newCheckOutDate);
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [reservation.checkIn, newCheckOutDate]);

  // Additional nights for extension
  const additionalNights = extendedNights - originalNights;

  // Get available rooms for extension
  const availableRooms = useMemo(() => {
    if (step !== "extend-room") return [];

    // If in change-stay-type mode, only show the current room
    if (extensionMode === "change-stay-type") {
      const currentRoom = state.rooms.find((r) => r.id === reservation.roomId);
      return currentRoom ? [currentRoom] : [];
    }

    // If in change-room mode, show available rooms
    return state.rooms.filter((room) => {
      // Check if room is available or is the current room
      if (room.status !== "available" && room.id !== reservation.roomId)
        return false;

      // If room type filter is set, match it
      if (roomTypeId && room.roomTypeId !== roomTypeId) return false;

      // Check capacity
      const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
      if (roomType && roomType.capacity < adults + children) return false;

      return true;
    });
  }, [
    state.rooms,
    state.roomTypes,
    roomTypeId,
    adults,
    children,
    reservation.roomId,
    step,
    extensionMode,
  ]);

  const calculateExtensionPrice = (room: Room) => {
    const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
    const basePrice = roomType?.basePrice || 0;
    return basePrice * additionalNights;
  };

  const handleDocumentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setIdentificationDocumentName(file.name);
      setIdentificationDocumentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  const persistIdentificationToCustomer = () => {
    if (!customer) return;
    const updatedCustomer: Customer = {
      ...customer,
      identificationNumber: identificationNumber.trim() || undefined,
      identificationDocumentName: identificationDocumentName || undefined,
      identificationDocumentUrl: identificationDocumentUrl || undefined,
    };
    dispatch({ type: "UPDATE_CUSTOMER", payload: updatedCustomer });
  };

  const isIdentificationComplete = Boolean(
    identificationNumber.trim() && identificationDocumentUrl
  );

  const handleProcessCheckOut = () => {
    if (!isIdentificationComplete) {
      setIdentificationError(
        "NIC/Passport number and an ID document must be recorded before checkout."
      );
      return;
    }

    setIdentificationError("");
    persistIdentificationToCustomer();

    const updatedReservation = {
      ...reservation,
      status: "checked-out" as const,
    };

    dispatch({ type: "UPDATE_RESERVATION", payload: updatedReservation });

    if (currentRoom) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: { ...currentRoom, status: "maintenance" },
      });

      const housekeepingEntry = state.housekeeping.find(
        (h) => h.roomId === currentRoom.id
      );
      if (housekeepingEntry) {
        dispatch({
          type: "UPDATE_HOUSEKEEPING",
          payload: { ...housekeepingEntry, status: "to-clean" },
        });
      }
    }

    onCheckOutComplete();
    onClose();
  };

  const handleConfirmExtension = () => {
    const extensionPrice = calculateExtensionPrice(selectedRoom!);
    const newTotalAmount = reservation.totalAmount + extensionPrice;

    // Update reservation with new checkout date, room, and amount
    const updatedReservation = {
      ...reservation,
      checkOut: newCheckOutDate,
      roomId: selectedRoomId,
      adults,
      children,
      notes,
      totalAmount: newTotalAmount,
    };

    dispatch({ type: "UPDATE_RESERVATION", payload: updatedReservation });

    // If room changed, update room statuses
    if (selectedRoomId !== reservation.roomId) {
      // Free old room
      if (currentRoom) {
        dispatch({
          type: "UPDATE_ROOM",
          payload: { ...currentRoom, status: "available" },
        });
      }
      // Occupy new room
      if (selectedRoom) {
        dispatch({
          type: "UPDATE_ROOM",
          payload: { ...selectedRoom, status: "occupied" },
        });
      }
    }

    // If opened in extend-only mode, close the dialog
    // Otherwise, go back to summary for checkout flow
    if (isExtendOnlyMode) {
      onCheckOutComplete();
      onClose();
    } else {
      setStep("summary");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMinExtensionDate = () => {
    const checkOut = new Date(reservation.checkOut);
    checkOut.setDate(checkOut.getDate() + 1);
    return checkOut.toISOString().split("T")[0];
  };

  // Step 1: Stay Summary
  if (step === "summary") {
    const pendingCharges = 0; // TODO: Calculate from additional services

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check-Out</h2>
          <p className="text-sm text-slate-500">Stay Summary</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Guest Name
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {customer?.name || "Unknown Guest"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Room Number
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {currentRoom?.roomNumber} ({currentRoomType?.name})
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Check-In Date
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {formatDate(reservation.checkIn)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Scheduled Check-Out
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Nights Stayed
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {originalNights}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Amount Paid
              </label>
              <p className="text-base font-semibold text-green-600 mt-1">
                {formatCurrency(reservation.totalAmount)}
              </p>
            </div>
          </div>

          {pendingCharges > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  Pending Charges
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(pendingCharges)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => setStep("extend-date")}>
            Extend Stay
          </Button>
          <Button onClick={() => setStep("final-checkout")}>
            Confirm Check-Out
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Extend Stay - Select New Date
  if (step === "extend-date") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Extend Stay</h2>
          <p className="text-sm text-slate-500">Select new check-out date</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Current Check-Out
              </label>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Current Nights
              </label>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {originalNights}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            New Check-Out Date
          </label>
          <input
            type="date"
            value={newCheckOutDate.split("T")[0]}
            min={getMinExtensionDate()}
            onChange={(e) => setNewCheckOutDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {additionalNights > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">
                Additional Nights
              </span>
              <span className="text-2xl font-bold text-green-900">
                {additionalNights}
              </span>
            </div>
          </div>
        )}

        {additionalNights <= 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-900 text-sm">
              Please select a date after the current check-out date to extend
              the stay.
            </p>
          </div>
        )}

        {/* Change Room or Stay Type Options */}
        {additionalNights > 0 && (
          <div className="space-y-4">
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Would you like to make any changes for the extended stay?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExtensionMode("change-room");
                    setRoomTypeId("");
                    setStep("extend-room");
                  }}
                  className="flex-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Change Room
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExtensionMode("change-stay-type");
                    setSelectedRoomId(reservation.roomId);
                    setStep("extend-room");
                  }}
                  className="flex-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Change Stay Type
                </Button>
              </div>
            </div>
            <div className="flex gap-3 justify-between">
              <Button variant="secondary" onClick={() => setStep("summary")}>
                Back
              </Button>
              <Button onClick={() => setStep("confirm-extension")}>
                Continue with Same Room
              </Button>
            </div>
          </div>
        )}

        {additionalNights <= 0 && (
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStep("summary")}>
              Back
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Step 3: Extend Stay - Edit Options and Select Room
  if (step === "extend-room") {
    const isChangeRoomMode = extensionMode === "change-room";
    const isChangeStayTypeMode = extensionMode === "change-stay-type";

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isChangeStayTypeMode
              ? "Change Stay Type"
              : "Change Room for Extended Stay"}
          </h2>
          <p className="text-sm text-slate-500">
            {isChangeStayTypeMode
              ? `Select a different stay type for Room ${
                  currentRoom?.roomNumber || "your room"
                }`
              : "Select a new room and preferences for your extended stay"}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-900 text-sm">
            Extending stay by{" "}
            <strong>
              {additionalNights} night{additionalNights !== 1 ? "s" : ""}
            </strong>{" "}
            until <strong>{formatDate(newCheckOutDate)}</strong>
          </p>
        </div>

        <div className="space-y-4">
          {isChangeRoomMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Room Type
              </label>
              <select
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Room Types</option>
                {state.roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {formatCurrency(type.basePrice)}/night
                  </option>
                ))}
              </select>
            </div>
          )}

          {isChangeStayTypeMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Room Number: <strong>{currentRoom?.roomNumber}</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You will remain in the same room. Only the stay type will be
                    updated.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Adults
              </label>
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Children
              </label>
              <input
                type="number"
                min="0"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Special Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requests or preferences..."
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-2">
            {isChangeStayTypeMode
              ? `Available Stay Types for Room ${currentRoom?.roomNumber}`
              : `Select a Room (${availableRooms.length} available)`}
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            {isChangeStayTypeMode
              ? "Choose a different stay type configuration for your room"
              : "Click on a room card to select it for your extended stay"}
          </p>

          {availableRooms.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No rooms available matching your criteria
            </p>
          ) : isChangeStayTypeMode ? (
            // Show stay type combination options for the current room type
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 scroll-smooth">
              {stayTypeCombinations
                .filter((combo) => combo.roomTypeId === currentRoom?.roomTypeId)
                .map((combo) => {
                  const room = availableRooms[0]; // Current room
                  const roomType = state.roomTypes.find(
                    (rt) => rt.id === room.roomTypeId
                  );
                  const mealPlan = state.mealPlans.find(
                    (mp) => mp.id === combo.mealPlanId
                  );
                  const viewType = state.viewTypes.find(
                    (vt) => vt.id === combo.viewTypeId
                  );

                  // Get price from combination
                  const comboPrice = combo.pricing[0]?.price || 0;
                  const totalPrice = comboPrice * additionalNights;
                  const isSelected = selectedStayTypeCombinationId === combo.id;

                  return (
                    <div
                      key={combo.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStayTypeCombinationId(combo.id);
                        setAdults(combo.adults);
                        setChildren(combo.children);
                        setStep("confirm-extension");
                      }}
                      className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] min-h-[200px] flex flex-col ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
                      }`}
                    >
                      {/* Capacity Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap bg-purple-600 text-white">
                          {combo.adults} Adult{combo.adults !== 1 ? "s" : ""}
                          {combo.children > 0 &&
                            ` + ${combo.children} Child${
                              combo.children !== 1 ? "ren" : ""
                            }`}
                        </span>
                      </div>

                      {/* Room Type */}
                      <div className="text-2xl font-bold text-slate-900 mb-2 pr-20">
                        {roomType?.name}
                      </div>

                      {/* Configuration Details */}
                      <div className="space-y-2 mb-4">
                        {viewType && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span className="font-medium">{viewType.name}</span>
                          </div>
                        )}
                        {mealPlan && (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span className="font-medium">
                              {mealPlan.name} ({mealPlan.code})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Room Info */}
                      <div className="text-sm text-slate-600 mb-4">
                        Room {room.roomNumber}
                      </div>

                      {/* Pricing */}
                      <div className="mt-auto space-y-2">
                        <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                          <span className="text-slate-600">Rate/Night</span>
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {formatCurrency(comboPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm text-slate-600">
                            {additionalNights} Night
                            {additionalNights !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xl font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(totalPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Select Indicator */}
                      {isSelected && (
                        <div className="mt-3 flex items-center justify-center text-blue-600 font-bold text-sm bg-blue-100 rounded-lg py-2">
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Selected
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            // Show room options for changing room
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[500px] overflow-y-auto pr-2 scroll-smooth">
              {availableRooms.map((room) => {
                const roomType = state.roomTypes.find(
                  (rt) => rt.id === room.roomTypeId
                );
                const isCurrent = room.id === reservation.roomId;
                const isSelected = room.id === selectedRoomId;
                return (
                  <div
                    key={room.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRoomId(room.id);
                      setStep("confirm-extension");
                    }}
                    className={`relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] min-h-[200px] flex flex-col ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-lg"
                        : isCurrent
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        {isCurrent ? "Same Room" : "Available"}
                      </span>
                    </div>

                    {/* Room Number */}
                    <div className="text-3xl font-bold text-slate-900 mb-2 pr-20">
                      Room {room.roomNumber}
                    </div>

                    {/* Room Type */}
                    <div className="text-base font-semibold text-slate-700 mb-4">
                      {roomType?.name}
                    </div>

                    {/* Pricing */}
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                        <span className="text-slate-600">Rate/Night</span>
                        <span className="font-semibold text-slate-900 whitespace-nowrap">
                          {formatCurrency(roomType?.basePrice || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm text-slate-600">
                          {additionalNights} Extra Night
                          {additionalNights !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xl font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(calculateExtensionPrice(room))}
                        </span>
                      </div>
                    </div>

                    {/* Select Indicator */}
                    {isSelected && (
                      <div className="mt-3 flex items-center justify-center text-blue-600 font-bold text-sm bg-blue-100 rounded-lg py-2">
                        <svg
                          className="w-5 h-5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("extend-date")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Confirm Extension
  if (step === "confirm-extension") {
    const extensionPrice = calculateExtensionPrice(selectedRoom!);
    const newTotalAmount = reservation.totalAmount + extensionPrice;
    const roomChanged = selectedRoomId !== reservation.roomId;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Confirm Extension
          </h2>
          <p className="text-sm text-slate-500">
            Review extension details before proceeding
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Guest
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {customer?.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Room
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {selectedRoom?.roomNumber} ({selectedRoomType?.name})
                {roomChanged && (
                  <span className="text-xs ml-2 px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                    Changed
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Original Check-Out
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                New Check-Out
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {formatDate(newCheckOutDate)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Additional Nights
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {additionalNights}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-blue-700 uppercase">
                Guests
              </label>
              <p className="text-base font-semibold text-blue-900 mt-1">
                {adults} Adult{adults !== 1 ? "s" : ""}, {children} Child
                {children !== 1 ? "ren" : ""}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-300 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">Original Amount</span>
              <span className="font-semibold text-blue-900">
                {formatCurrency(reservation.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-700">
                Extension Charges ({additionalNights} nights)
              </span>
              <span className="font-semibold text-blue-900">
                {formatCurrency(extensionPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="font-bold text-blue-900">New Total Amount</span>
              <span className="text-2xl font-bold text-blue-900">
                {formatCurrency(newTotalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("extend-room")}>
            Back
          </Button>
          <Button onClick={handleConfirmExtension}>Confirm Extension</Button>
        </div>
      </div>
    );
  }

  // Step 5: Final Check-Out
  if (step === "final-checkout") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Final Check-Out</h2>
          <p className="text-sm text-slate-500">Process guest departure</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Guest Name
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {customer?.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Room
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {currentRoom?.roomNumber} ({currentRoomType?.name})
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Check-In
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {formatDate(reservation.checkIn)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Check-Out
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Total Nights
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {originalNights}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Final Amount
              </label>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(reservation.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Required Identification
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-600 gap-1">
              NIC / Passport number
              <input
                type="text"
                value={identificationNumber}
                onChange={(event) =>
                  setIdentificationNumber(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NIC or passport"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>ID Document</span>
                <span className="font-semibold text-slate-900">
                  {identificationDocumentName || "No document uploaded"}
                </span>
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-500 hover:shadow-sm">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleDocumentUpload}
                />
                Upload document
              </label>
            </div>
          </div>
          {identificationError && (
            <p className="text-xs text-red-600">{identificationError}</p>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">
              Room Key Return
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">
              Key Tag / Number
            </label>
            <input
              type="text"
              value={keyTag}
              onChange={(event) => setKeyTag(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Record the returned key tag"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">
              Notes
            </label>
            <textarea
              value={handoverNotes}
              onChange={(event) => setHandoverNotes(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Optional notes about the return"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 uppercase">
              Key Return Status
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="keyReturnStatus"
                  value="returned"
                  checked={keyReturnStatus === "returned"}
                  onChange={() => setKeyReturnStatus("returned")}
                  className="text-blue-600"
                />
                Returned to staff
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="keyReturnStatus"
                  value="pending"
                  checked={keyReturnStatus === "pending"}
                  onChange={() => setKeyReturnStatus("pending")}
                  className="text-blue-600"
                />
                Pending / guest still holds key
              </label>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            ✓ Final invoice will be generated
            <br />✓ Room will be marked as <strong>Needs Cleaning</strong>
            <br />✓ Reservation status will be updated to{" "}
            <strong>Checked Out</strong>
            <br />✓ Housekeeping will be notified
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("summary")}>
            Back to Summary
          </Button>
          <Button
            onClick={handleProcessCheckOut}
            disabled={!isIdentificationComplete}
          >
            Process Check-Out
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
