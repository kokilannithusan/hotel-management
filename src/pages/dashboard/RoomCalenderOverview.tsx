import { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { formatCurrency } from "../../utils/formatters";
import RoomCalendar from "../../components/organisms/RoomCalendar";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Booked: "bg-blue-100 text-blue-800",
    Confirmed: "bg-green-100 text-green-800",
    "Checked in": "bg-purple-100 text-purple-800",
    "Checked out": "bg-gray-100 text-gray-800",
    Cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        colors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}

const reservationStatusLabelMap: Record<string, string> = {
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
  Extend: "Extend",
  canceled: "Cancelled",
};

const roomStatusLabelMap: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  "to-clean": "Maintenance",
  "cleaning-in-progress": "Maintenance",
  cleaned: "Available",
};

function normalizeDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? null : new Date(parsed.setHours(0, 0, 0, 0));
}

function formatHumanDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function RoomCalenderOverview() {
  const { state } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent(null);
  };

  // Prepare rooms data
  const rooms = state.rooms.map((room) => {
    const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
    return {
      id: room.id,
      number: `${room.roomNumber} - ${roomType?.name || "Unknown"}`,
      status: roomStatusLabelMap[room.status] || room.status,
    };
  });

  // Prepare reservations data
  const reservations = state.reservations.map((reservation) => {
    const room = state.rooms.find((r) => r.id === reservation.roomId);
    const roomType = state.roomTypes.find((rt) => rt.id === room?.roomTypeId);
    const customer = state.customers.find(
      (c) => c.id === reservation.customerId
    );

    return {
      id: reservation.id,
      guest: customer?.name || "Unknown Guest",
      room: `${room?.roomNumber || "—"} - ${roomType?.name || "Unknown"}`,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      status:
        reservationStatusLabelMap[reservation.status] || reservation.status,
      amount: reservation.totalAmount,
    };
  });

  // Prepare housekeeping data - convert to ticket format
  const housekeeping = state.housekeeping.map((hk, index) => ({
    id: `hk-${index}`,
    roomId: hk.roomId,
    room: hk.roomNumber,
    status: hk.status,
    assignedTo: "",
    priority: "normal" as const,
    notes: "",
    createdAt: new Date().toISOString(),
    completedAt: undefined,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Room Calendar Overview
          </h1>
          <p className="text-sm text-slate-500">
            Visual representation of room availability and reservations
          </p>
        </div>
      </div>

      <RoomCalendar
        heading="Room Calendar"
        rooms={rooms}
        reservations={reservations}
        housekeeping={housekeeping}
        onCellSelect={({ roomNumber, date }) => {
          const normalizedNumber = roomNumber.split("-")[0].trim();
          const matches = reservations.filter((reservation) => {
            if (reservation.status === "Cancelled") return false;
            const reservationRoom = reservation.room.split("-")[0].trim();
            if (reservationRoom !== normalizedNumber) return false;
            const checkIn = normalizeDate(reservation.checkIn);
            const checkOut = normalizeDate(reservation.checkOut);
            if (!checkIn || !checkOut) return false;
            return date >= checkIn && date < checkOut;
          });

          if (matches.length === 0) return;

          const content = (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Occupancy – Room {normalizedNumber}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {formatHumanDate(date.toISOString())}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={closeModal}>
                  Close
                </Button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2 text-left">Guest</th>
                      <th className="px-4 py-2 text-left">Check-in</th>
                      <th className="px-4 py-2 text-left">Check-out</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {matches.map((reservation) => (
                      <tr key={`occupancy-${reservation.id}`}>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {reservation.guest}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatHumanDate(reservation.checkIn)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatHumanDate(reservation.checkOut)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={reservation.status} />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-800">
                          {formatCurrency(reservation.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );

          openModal(content);
        }}
      />

      <Modal isOpen={showModal} onClose={closeModal} title="Modal">
        {modalContent}
      </Modal>
    </div>
  );
}
