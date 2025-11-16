import { useState, useMemo } from "react";
import { Button } from "../ui/Button";
import { useHotel } from "../../context/HotelContext";
import { formatCurrency } from "../../utils/formatters";
import type { Reservation, Room } from "../../types/entities";

interface CheckInDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onCheckInComplete: () => void;
}

type DialogStep =
  | "details"
  | "change-room"
  | "confirm-change"
  | "final-checkin";

export function CheckInDialog({
  reservation,
  onClose,
  onCheckInComplete,
}: CheckInDialogProps) {
  const { state, dispatch } = useHotel();
  const [step, setStep] = useState<DialogStep>("details");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    reservation.roomId
  );

  // Editable criteria for room change
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [adults, setAdults] = useState(reservation.adults);
  const [children, setChildren] = useState(reservation.children);
  const [notes, setNotes] = useState(reservation.notes || "");

  const currentRoom = state.rooms.find((r) => r.id === reservation.roomId);
  const currentRoomType = state.roomTypes.find(
    (rt) => rt.id === currentRoom?.roomTypeId
  );
  const customer = state.customers.find((c) => c.id === reservation.customerId);
  const selectedRoom = state.rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomType = state.roomTypes.find(
    (rt) => rt.id === selectedRoom?.roomTypeId
  );

  // Calculate nights
  const nights = useMemo(() => {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [reservation.checkIn, reservation.checkOut]);

  // Get available rooms based on criteria
  const availableRooms = useMemo(() => {
    return state.rooms.filter((room) => {
      // Must be available
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
  ]);

  const calculatePrice = (room: Room) => {
    const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
    const basePrice = roomType?.basePrice || 0;
    return basePrice * nights;
  };

  const handleConfirmCheckIn = () => {
    // Update reservation status and room
    const updatedReservation = {
      ...reservation,
      roomId: selectedRoomId,
      adults,
      children,
      notes,
      status: "checked-in" as const,
      totalAmount: calculatePrice(selectedRoom!),
    };

    dispatch({ type: "UPDATE_RESERVATION", payload: updatedReservation });

    // Update old room status if changed
    if (selectedRoomId !== reservation.roomId && currentRoom) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: { ...currentRoom, status: "available" },
      });
    }

    // Update new room status to occupied
    if (selectedRoom) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: { ...selectedRoom, status: "occupied" },
      });
    }

    onCheckInComplete();
    onClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Step 1: Display Reservation Details
  if (step === "details") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Check-In</h2>
          <p className="text-sm text-slate-500">Reservation Details</p>
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
                Guests
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {reservation.adults} Adult{reservation.adults !== 1 ? "s" : ""},{" "}
                {reservation.children} Child
                {reservation.children !== 1 ? "ren" : ""}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Nights
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {nights}
              </p>
            </div>
          </div>

          {reservation.notes && (
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Special Notes
              </label>
              <p className="text-sm text-slate-700 mt-1">{reservation.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">
                Total Amount
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {formatCurrency(reservation.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => setStep("change-room")}>
            Change Room
          </Button>
          <Button onClick={() => setStep("final-checkin")}>
            Confirm Check-In
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Room Change - Edit Options
  if (step === "change-room") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Change Room</h2>
          <p className="text-sm text-slate-500">
            Update preferences and search for available rooms
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Type
            </label>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {state.roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {formatCurrency(type.basePrice)}/night
                </option>
              ))}
            </select>
          </div>

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
          <h3 className="font-semibold text-slate-900 mb-4">
            Available Rooms ({availableRooms.length})
          </h3>

          {availableRooms.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No rooms available matching your criteria
            </p>
          ) : (
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
                      setStep("confirm-change");
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
                          {nights} Night{nights !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xl font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(calculatePrice(room))}
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
          <Button variant="secondary" onClick={() => setStep("details")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Confirm Room Change
  if (step === "confirm-change") {
    const oldPrice = calculatePrice(currentRoom!);
    const newPrice = calculatePrice(selectedRoom!);
    const priceDiff = newPrice - oldPrice;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Confirm Room Change
          </h2>
          <p className="text-sm text-slate-500">
            Review the changes before proceeding
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900 font-medium">
            Are you sure you want to switch from Room {currentRoom?.roomNumber}{" "}
            to Room {selectedRoom?.roomNumber}?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">
              Current Room
            </h3>
            <p className="text-2xl font-bold text-slate-900 mb-2">
              {currentRoom?.roomNumber}
            </p>
            <p className="text-slate-600 mb-1">{currentRoomType?.name}</p>
            <p className="text-sm text-slate-500">
              {formatCurrency(currentRoomType?.basePrice || 0)}/night × {nights}{" "}
              nights
            </p>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {formatCurrency(oldPrice)}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
            <h3 className="text-sm font-semibold text-blue-600 uppercase mb-3">
              New Room
            </h3>
            <p className="text-2xl font-bold text-blue-900 mb-2">
              {selectedRoom?.roomNumber}
            </p>
            <p className="text-blue-700 mb-1">{selectedRoomType?.name}</p>
            <p className="text-sm text-blue-600">
              {formatCurrency(selectedRoomType?.basePrice || 0)}/night ×{" "}
              {nights} nights
            </p>
            <p className="text-lg font-semibold text-blue-900 mt-2">
              {formatCurrency(newPrice)}
            </p>
          </div>
        </div>

        <div className="bg-slate-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-600">Price Difference</span>
            <span
              className={`text-lg font-bold ${
                priceDiff > 0
                  ? "text-red-600"
                  : priceDiff < 0
                  ? "text-green-600"
                  : "text-slate-900"
              }`}
            >
              {priceDiff > 0 ? "+" : ""}
              {formatCurrency(Math.abs(priceDiff))}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-900">
              New Total Amount
            </span>
            <span className="text-2xl font-bold text-slate-900">
              {formatCurrency(newPrice)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("change-room")}>
            Back
          </Button>
          <Button onClick={() => setStep("final-checkin")}>
            Confirm Room Change
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Final Check-In Confirmation
  if (step === "final-checkin") {
    const finalRoom = selectedRoom || currentRoom;
    const finalRoomType = state.roomTypes.find(
      (rt) => rt.id === finalRoom?.roomTypeId
    );
    const finalPrice = calculatePrice(finalRoom!);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Final Check-In</h2>
          <p className="text-sm text-slate-500">
            Confirm all details before checking in
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Guest
              </label>
              <p className="text-base font-semibold text-green-900 mt-1">
                {customer?.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Room
              </label>
              <p className="text-base font-semibold text-green-900 mt-1">
                {finalRoom?.roomNumber} ({finalRoomType?.name})
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Check-In
              </label>
              <p className="text-base font-semibold text-green-900 mt-1">
                {formatDate(reservation.checkIn)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Check-Out
              </label>
              <p className="text-base font-semibold text-green-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Guests
              </label>
              <p className="text-base font-semibold text-green-900 mt-1">
                {adults} Adult{adults !== 1 ? "s" : ""}, {children} Child
                {children !== 1 ? "ren" : ""}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-green-700 uppercase">
                Total Amount
              </label>
              <p className="text-xl font-bold text-green-900 mt-1">
                {formatCurrency(finalPrice)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ✓ Room will be marked as <strong>Occupied</strong>
            <br />✓ Reservation status will be updated to{" "}
            <strong>Checked In</strong>
            <br />✓ Check-in timestamp will be recorded
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("details")}>
            Back to Details
          </Button>
          <Button onClick={handleConfirmCheckIn}>Confirm Check-In</Button>
        </div>
      </div>
    );
  }

  return null;
}
