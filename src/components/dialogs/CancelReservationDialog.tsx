import { useState, useMemo } from "react";
import { Button } from "../ui/Button";
import { useHotel } from "../../context/HotelContext";
import { formatCurrency } from "../../utils/formatters";
import type { Reservation } from "../../types/entities";

interface CancelReservationDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onCancelComplete: () => void;
}

type CancellationReason =
  | "guest-requested"
  | "no-show"
  | "payment-issue"
  | "duplicate-booking"
  | "other";

type RefundMethod = "cash" | "card" | "online-transfer" | "no-refund";

type DialogStep = "summary" | "reason" | "refund" | "confirm";

export function CancelReservationDialog({
  reservation,
  onClose,
  onCancelComplete,
}: CancelReservationDialogProps) {
  const { state, dispatch } = useHotel();
  const [step, setStep] = useState<DialogStep>("summary");
  const [cancellationReason, setCancellationReason] =
    useState<CancellationReason>("guest-requested");
  const [otherReasonText, setOtherReasonText] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("no-refund");
  const [refundAmount, setRefundAmount] = useState(0);
  const [transactionReference, setTransactionReference] = useState("");

  const currentRoom = state.rooms.find((r) => r.id === reservation.roomId);
  const currentRoomType = state.roomTypes.find(
    (rt) => rt.id === currentRoom?.roomTypeId
  );
  const customer = state.customers.find((c) => c.id === reservation.customerId);

  // Calculate refundable amount (simple policy: full refund if not checked in)
  const refundableAmount = useMemo(() => {
    if (
      reservation.status === "checked-in" ||
      reservation.status === "checked-out"
    ) {
      return 0; // No refund after check-in
    }

    const checkInDate = new Date(reservation.checkIn);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Example refund policy:
    // - More than 7 days: 100% refund
    // - 3-7 days: 50% refund
    // - Less than 3 days: 25% refund
    if (daysUntilCheckIn > 7) {
      return reservation.totalAmount;
    } else if (daysUntilCheckIn >= 3) {
      return reservation.totalAmount * 0.5;
    } else if (daysUntilCheckIn >= 0) {
      return reservation.totalAmount * 0.25;
    }

    return 0; // No refund for past reservations
  }, [reservation]);

  const handleConfirmCancellation = () => {
    // Update reservation status to canceled
    const updatedReservation = {
      ...reservation,
      status: "canceled" as const,
      notes: `${
        reservation.notes || ""
      }\n\nCancellation Reason: ${getCancellationReasonLabel()}\nRefund: ${formatCurrency(
        refundAmount
      )} via ${getRefundMethodLabel()}${
        transactionReference ? `\nRef: ${transactionReference}` : ""
      }`.trim(),
    };

    dispatch({ type: "UPDATE_RESERVATION", payload: updatedReservation });

    // Free the room if it was occupied
    if (
      currentRoom &&
      (currentRoom.status === "occupied" || reservation.status === "confirmed")
    ) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: { ...currentRoom, status: "available" },
      });
    }

    // TODO: Record refund transaction if amount > 0
    if (refundAmount > 0) {
      // This would integrate with your refund tracking system
      console.log("Refund processed:", {
        reservationId: reservation.id,
        amount: refundAmount,
        method: refundMethod,
        reference: transactionReference,
      });
    }

    onCancelComplete();
    onClose();
  };

  const getCancellationReasonLabel = () => {
    switch (cancellationReason) {
      case "guest-requested":
        return "Guest Requested";
      case "no-show":
        return "No-Show";
      case "payment-issue":
        return "Payment Issue";
      case "duplicate-booking":
        return "Duplicate Booking";
      case "other":
        return otherReasonText || "Other";
      default:
        return cancellationReason;
    }
  };

  const getRefundMethodLabel = () => {
    switch (refundMethod) {
      case "cash":
        return "Cash";
      case "card":
        return "Card";
      case "online-transfer":
        return "Online Transfer";
      case "no-refund":
        return "No Refund";
      default:
        return refundMethod;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "checked-out":
        return "bg-gray-100 text-gray-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "checked-in":
        return "Checked In";
      case "checked-out":
        return "Checked Out";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  // Step 1: Display Reservation Summary
  if (step === "summary") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cancel Reservation
          </h2>
          <p className="text-sm text-slate-500">Reservation Summary</p>
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
                Check-Out Date
              </label>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {formatDate(reservation.checkOut)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Current Status
              </label>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  {getStatusLabel(reservation.status)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">
                Total Paid
              </label>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(reservation.totalAmount)}
              </p>
            </div>
          </div>

          {refundableAmount > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">
                  Refundable Amount
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(refundableAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Based on cancellation policy and days until check-in
              </p>
            </div>
          )}

          {refundableAmount === 0 && reservation.status !== "canceled" && (
            <div className="pt-4 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-sm text-amber-900">
                  ⚠ No refund applicable for this reservation based on current
                  policy.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Go Back
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setRefundAmount(refundableAmount);
              setStep("reason");
            }}
          >
            Proceed with Cancellation
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Cancellation Reason
  if (step === "reason") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cancellation Reason
          </h2>
          <p className="text-sm text-slate-500">
            Select or specify the reason for cancellation
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Reason
            </label>
            <div className="space-y-2">
              {[
                { value: "guest-requested", label: "Guest Requested" },
                { value: "no-show", label: "No-Show" },
                { value: "payment-issue", label: "Payment Issue" },
                { value: "duplicate-booking", label: "Duplicate Booking" },
                { value: "other", label: "Other" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                    cancellationReason === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation-reason"
                    value={option.value}
                    checked={cancellationReason === option.value}
                    onChange={(e) =>
                      setCancellationReason(
                        e.target.value as CancellationReason
                      )
                    }
                    className="mr-3"
                  />
                  <span className="font-medium text-slate-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {cancellationReason === "other" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Please specify the reason
              </label>
              <textarea
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter detailed reason for cancellation..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("summary")}>
            Back
          </Button>
          <Button
            onClick={() => setStep(refundableAmount > 0 ? "refund" : "confirm")}
            disabled={cancellationReason === "other" && !otherReasonText.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Refund Processing
  if (step === "refund") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Refund Processing
          </h2>
          <p className="text-sm text-slate-500">Enter refund details</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">
              Refundable Amount
            </span>
            <span className="text-2xl font-bold text-green-900">
              {formatCurrency(refundableAmount)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Refund Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                min="0"
                max={refundableAmount}
                step="0.01"
                value={refundAmount}
                onChange={(e) =>
                  setRefundAmount(parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-lg border border-slate-300 pl-8 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Maximum refundable: {formatCurrency(refundableAmount)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Refund Method
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online-transfer">Online Transfer</option>
              <option value="no-refund">No Refund</option>
            </select>
          </div>

          {refundMethod !== "no-refund" && refundAmount > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Transaction Reference (Optional)
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., REF123456, Transaction ID, Check number..."
              />
            </div>
          )}
        </div>

        {refundAmount > refundableAmount && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900">
              ⚠ Refund amount cannot exceed the refundable amount of{" "}
              {formatCurrency(refundableAmount)}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setStep("reason")}>
            Back
          </Button>
          <Button
            onClick={() => setStep("confirm")}
            disabled={refundAmount > refundableAmount}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Step 4: Confirm Cancellation
  if (step === "confirm") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Confirm Cancellation
          </h2>
          <p className="text-sm text-slate-500">
            Review all details before finalizing
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Cancellation Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Guest</span>
              <span className="font-semibold text-slate-900">
                {customer?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Room</span>
              <span className="font-semibold text-slate-900">
                {currentRoom?.roomNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Reservation Dates</span>
              <span className="font-semibold text-slate-900">
                {formatDate(reservation.checkIn)} -{" "}
                {formatDate(reservation.checkOut)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Reason</span>
              <span className="font-semibold text-slate-900">
                {getCancellationReasonLabel()}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between mb-2">
                <span className="text-slate-600">Original Amount</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(reservation.totalAmount)}
                </span>
              </div>
              {refundAmount > 0 && (
                <>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">Refund Amount</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(refundAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Refund Method</span>
                    <span className="font-semibold text-slate-900">
                      {getRefundMethodLabel()}
                    </span>
                  </div>
                  {transactionReference && (
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-600 text-sm">Reference</span>
                      <span className="font-mono text-sm text-slate-900">
                        {transactionReference}
                      </span>
                    </div>
                  )}
                </>
              )}
              {refundAmount === 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Refund</span>
                  <span className="font-semibold text-slate-900">
                    No Refund
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">
                Warning: This action cannot be undone
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>
                  • Reservation status will be changed to{" "}
                  <strong>Cancelled</strong>
                </li>
                <li>• Room will be freed and made available</li>
                <li>• This cancellation will be recorded permanently</li>
                {refundAmount > 0 && (
                  <li>
                    • Refund of {formatCurrency(refundAmount)} will be processed
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={() => setStep(refundableAmount > 0 ? "refund" : "reason")}
          >
            Back
          </Button>
          <Button variant="danger" onClick={handleConfirmCancellation}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
