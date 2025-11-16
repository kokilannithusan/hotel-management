import { useEffect, useMemo, useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { formatCurrency } from "../../utils/formatters";
import type { ReservationStatus } from "../../types/entities";
import RoomCalendar from "../../components/organisms/RoomCalendar";

type ReservationExtended = {
  id: string;
  guest: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
  price?: number;
  netPrice?: number;
  extras?: string[];
  discountPercent?: number;
  discountAmount?: number;
  roomSubtotal?: number;
  extrasSubtotal?: number;
  seasonalMultiplier?: number;
  commissionRate?: number;
  commissionAmount?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const overviewStatuses: string[] = ["Booked", "Confirmed", "Checked in"];

type TodayRoomStatus = {
  room: string;
  roomType?: string;
  label: string;
  color: string;
  guestName?: string;
  tag: "available" | "occupied" | "arrival" | "departure" | "maintenance";
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}
    >
      <span
        style={{ width: 12, height: 12, borderRadius: 999, background: color }}
      />
      {label}
    </span>
  );
}

const reservationStatusLabelMap: Record<string, string> = {
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "checked-out": "Checked out",
  canceled: "Cancelled",
};

const reservationStatusValueMap: Record<string, ReservationStatus> = {
  Booked: "confirmed",
  Confirmed: "confirmed",
  "Checked in": "checked-in",
  "Checked out": "checked-out",
  Cancelled: "canceled",
};

const roomStatusLabelMap: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
  "to-clean": "Maintenance",
  "cleaning-in-progress": "Maintenance",
  cleaned: "Available",
};

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

export function Dashboard() {
  const { state, dispatch } = useHotel();
  const [query, setQuery] = useState("");
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

  const roomById = useMemo(() => {
    return new Map(state.rooms.map((room) => [room.id, room]));
  }, [state.rooms]);

  const roomTypeMap = useMemo(() => {
    return new Map(state.roomTypes.map((type) => [type.id, type]));
  }, [state.roomTypes]);

  const customerMap = useMemo(() => {
    return new Map(state.customers.map((customer) => [customer.id, customer]));
  }, [state.customers]);

  const rooms = useMemo(
    () =>
      state.rooms.map((room) => ({
        number: room.roomNumber,
        type: roomTypeMap.get(room.roomTypeId)?.name ?? "Standard",
        status: roomStatusLabelMap[room.status] ?? "Available",
        cleanliness: room.status === "maintenance" ? "Cleaning" : "Clean",
        price: roomTypeMap.get(room.roomTypeId)?.basePrice ?? 0,
      })),
    [state.rooms, roomTypeMap]
  );

  const hotelReservations = useMemo<ReservationExtended[]>(
    () =>
      state.reservations.map((entity) => {
        const room = roomById.get(entity.roomId);
        const guest = customerMap.get(entity.customerId);
        return {
          id: entity.id,
          guest: guest?.name ?? "Guest",
          room: room?.roomNumber ?? "Unassigned",
          checkIn: entity.checkIn,
          checkOut: entity.checkOut,
          status: reservationStatusLabelMap[entity.status] ?? "Booked",
          amount: entity.totalAmount,
          roomSubtotal: entity.totalAmount,
          extrasSubtotal: 0,
        };
      }),
    [state.reservations, roomById, customerMap]
  );

  const reservations = hotelReservations;

  const housekeeping = useMemo(
    () =>
      state.housekeeping.map((entry) => {
        const totalTasks = entry.tasks?.length ?? 0;
        const completedTasks =
          entry.tasks?.filter((task) => task.completed).length ?? 0;
        const progress =
          totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : entry.status === "cleaned"
            ? 100
            : 0;
        return {
          id: entry.roomId,
          room: roomById.get(entry.roomId)?.roomNumber ?? "Unknown",
          status:
            entry.status === "maintenance" ||
            entry.status === "cleaning-in-progress"
              ? "In Progress"
              : entry.status === "to-clean"
              ? "Scheduled"
              : "Completed",
          openedAt: entry.lastCleaned ?? new Date().toISOString(),
          checkoutAt: entry.lastCleaned,
          progress,
          tasksCompleted: completedTasks,
          tasksTotal: totalTasks,
        };
      }),
    [state.housekeeping, roomById]
  );

  type RangeFilter = "today" | "week" | "month" | "year" | "all";
  const [range, setRange] = useState<RangeFilter>("today");
  const [cardView, setCardView] = useState<"all" | "todayCheckout">(
    "todayCheckout"
  );
  const [cardStatusFilter, setCardStatusFilter] = useState<"all" | string>(
    "all"
  );

  const [todayKey, setTodayKey] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  useEffect(() => {
    const handle = window.setInterval(() => {
      const next = new Date();
      next.setHours(0, 0, 0, 0);
      const nextKey = next.getTime();
      setTodayKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 60 * 1000);
    return () => window.clearInterval(handle);
  }, []);

  const normalizedToday = useMemo(() => {
    const d = new Date(todayKey);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [todayKey]);

  const normalizeDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const sameDay = (value: string | Date | null | undefined, target: Date) => {
    const date =
      value instanceof Date ? value : normalizeDate(value ?? undefined);
    if (!date) return false;
    return (
      date.getFullYear() === target.getFullYear() &&
      date.getMonth() === target.getMonth() &&
      date.getDate() === target.getDate()
    );
  };

  const todayRoomStatuses = useMemo<TodayRoomStatus[]>(() => {
    return rooms
      .map<TodayRoomStatus>((room) => {
        const departureReservation = reservations.find((reservation) => {
          if (reservation.room !== room.number) return false;
          if (reservation.status === "Cancelled") return false;
          return sameDay(reservation.checkOut, normalizedToday);
        });
        if (departureReservation) {
          return {
            room: room.number,
            roomType: room.type,
            label: "Departure",
            color: "#fb923c",
            guestName: departureReservation.guest,
            tag: "departure",
          };
        }
        const occupiedReservation = reservations.find((reservation) => {
          if (
            reservation.room !== room.number ||
            reservation.status !== "Checked in"
          )
            return false;
          const checkIn = normalizeDate(reservation.checkIn);
          const checkOut = normalizeDate(reservation.checkOut);
          if (!checkIn || !checkOut) return false;
          return (
            normalizedToday.getTime() >= checkIn.getTime() &&
            normalizedToday.getTime() < checkOut.getTime()
          );
        });
        if (occupiedReservation) {
          return {
            room: room.number,
            roomType: room.type,
            label: "Occupied",
            color: "#1d4ed8",
            guestName: occupiedReservation.guest,
            tag: "occupied",
          };
        }
        const arrivalReservation = reservations.find((reservation) => {
          if (reservation.room !== room.number) return false;
          if (
            reservation.status === "Cancelled" ||
            reservation.status === "Checked out"
          )
            return false;
          return sameDay(reservation.checkIn, normalizedToday);
        });
        if (arrivalReservation) {
          return {
            room: room.number,
            roomType: room.type,
            label: "Arrival",
            color: "#f59e0b",
            guestName: arrivalReservation.guest,
            tag: "arrival",
          };
        }
        return {
          room: room.number,
          roomType: room.type,
          label: "Available",
          color: "#22c55e",
          tag: "available",
        };
      })
      .sort((a, b) =>
        a.room.localeCompare(b.room, undefined, { numeric: true })
      );
  }, [rooms, reservations, normalizedToday]);

  const matchesRange = (reservation: ReservationExtended) => {
    if (range === "all") return true;
    const checkIn = normalizeDate(reservation.checkIn);
    const checkOut = normalizeDate(reservation.checkOut);
    const checkInDiff = checkIn
      ? Math.floor((checkIn.getTime() - normalizedToday.getTime()) / DAY_MS)
      : null;
    const checkOutDiff = checkOut
      ? Math.floor((checkOut.getTime() - normalizedToday.getTime()) / DAY_MS)
      : null;

    const withinFutureWindow = (diff: number | null, days: number) =>
      diff !== null && diff >= 0 && diff < days;

    const sameMonth = (date: Date | null) =>
      !!date &&
      date.getFullYear() === normalizedToday.getFullYear() &&
      date.getMonth() === normalizedToday.getMonth();

    const sameYear = (date: Date | null) =>
      !!date && date.getFullYear() === normalizedToday.getFullYear();

    switch (range) {
      case "today":
        return (
          sameDay(checkIn, normalizedToday) ||
          sameDay(checkOut, normalizedToday)
        );
      case "week":
        return (
          withinFutureWindow(checkInDiff, 7) ||
          withinFutureWindow(checkOutDiff, 7)
        );
      case "month":
        return sameMonth(checkIn) || sameMonth(checkOut);
      case "year":
        return sameYear(checkIn) || sameYear(checkOut);
      default:
        return true;
    }
  };

  const prioritizedRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesNeedle = (reservation: ReservationExtended) =>
      [reservation.guest, reservation.room, reservation.status]
        .join(" ")
        .toLowerCase()
        .includes(needle);

    const matchesStatusForToday = (reservation: ReservationExtended) => {
      const checkoutToday =
        sameDay(reservation.checkOut, normalizedToday) &&
        reservation.status === "Checked in";
      const checkinToday =
        sameDay(reservation.checkIn, normalizedToday) &&
        !["Checked in", "Checked out", "Cancelled"].includes(
          reservation.status
        );

      return { checkoutToday, checkinToday };
    };

    const base = reservations.filter((reservation) => {
      if (!matchesNeedle(reservation)) return false;
      if (!matchesRange(reservation)) return false;

      if (range === "today") {
        const { checkoutToday, checkinToday } =
          matchesStatusForToday(reservation);
        if (!checkoutToday && !checkinToday) {
          return false;
        }
      }

      return true;
    });

    const priorityFor = (reservation: ReservationExtended) => {
      const { checkoutToday, checkinToday } =
        matchesStatusForToday(reservation);

      if (checkoutToday) return 0;
      if (checkinToday) return 1;

      if (reservation.status === "Cancelled") return 4;
      if (sameDay(reservation.checkOut, normalizedToday)) return 2;
      if (sameDay(reservation.checkIn, normalizedToday)) return 3;
      return 5;
    };

    return base.slice().sort((a, b) => {
      const diff = priorityFor(a) - priorityFor(b);
      if (diff !== 0) return diff;
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
    });
  }, [reservations, query, range, normalizedToday]);

  const stats = useMemo(() => {
    const total = reservations.length;
    const checkedIn = reservations.filter(
      (r) => r.status === "Checked in"
    ).length;
    const confirmed = reservations.filter(
      (r) => r.status === "Confirmed"
    ).length;
    const revenue = reservations.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );
    return [
      { label: "Total Reservations", value: total },
      { label: "Checked In", value: checkedIn },
      { label: "Confirmed", value: confirmed },
      { label: "Revenue", value: formatCurrency(revenue) },
    ];
  }, [reservations]);

  const updateReservation = (
    id: string,
    updater: (record: ReservationExtended) => ReservationExtended
  ) => {
    const entity = state.reservations.find(
      (reservation) => reservation.id === id
    );
    if (!entity) return;
    const current = reservations.find((reservation) => reservation.id === id);
    if (!current) return;
    const updated = updater(current);

    const updatedEntity = {
      ...entity,
      checkIn: updated.checkIn,
      checkOut: updated.checkOut,
      status: reservationStatusValueMap[updated.status] ?? entity.status,
      totalAmount: updated.amount,
    };

    dispatch({ type: "UPDATE_RESERVATION", payload: updatedEntity });
  };

  const formatHumanDate = (value: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sameDateValue = (a?: string, b?: Date) => {
    if (!a || !b) return false;
    return sameDay(a, b);
  };

  const cardReservations = useMemo(() => {
    return reservations
      .filter((reservation) => {
        if (!overviewStatuses.includes(reservation.status)) return false;
        if (
          cardView === "todayCheckout" &&
          !sameDateValue(reservation.checkOut, normalizedToday)
        )
          return false;
        if (
          cardStatusFilter !== "all" &&
          reservation.status !== cardStatusFilter
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime()
      );
  }, [reservations, cardView, cardStatusFilter, normalizedToday]);

  const rangeOptions: { label: string; value: RangeFilter }[] = [
    { label: "Today", value: "today" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to Grand Hotel
          </h1>
          <p className="text-sm text-slate-500">
            Today's overview and quick actions.
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reservations"
          className="rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="text-sm text-slate-500 font-medium">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {stat.value}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Reservation Overview
            </h2>
            <p className="text-sm text-slate-500">
              Focus on today's check-outs or view all upcoming stays.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Today checkout", value: "todayCheckout" },
              { label: "All", value: "all" },
            ].map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={cardView === option.value ? "primary" : "secondary"}
                onClick={() =>
                  setCardView(option.value as "all" | "todayCheckout")
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {["all", ...overviewStatuses].map((status) => (
            <button
              key={`card-status-${status}`}
              type="button"
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                cardStatusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setCardStatusFilter(status)}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardReservations.length === 0 && (
            <p className="text-slate-500 col-span-full">
              No reservations match this filter.
            </p>
          )}
          {cardReservations.map((reservation) => (
            <div
              key={`card-${reservation.id}`}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-slate-900">
                    {reservation.guest}
                  </div>
                  <div className="text-sm text-slate-500">
                    Room {reservation.room}
                  </div>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Check-in</span>
                  <strong className="text-slate-900">
                    {formatHumanDate(reservation.checkIn)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Check-out</span>
                  <strong className="text-slate-900">
                    {formatHumanDate(reservation.checkOut)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount</span>
                  <strong className="text-slate-900">
                    {formatCurrency(reservation.amount)}
                  </strong>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  disabled={
                    reservation.status === "Checked in" ||
                    reservation.status === "Checked out" ||
                    reservation.status === "Cancelled"
                  }
                  onClick={() =>
                    updateReservation(reservation.id, (rec) => ({
                      ...rec,
                      status: "Checked in",
                    }))
                  }
                >
                  Check in
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={
                    reservation.status === "Cancelled" ||
                    reservation.status === "Checked out"
                  }
                  onClick={() =>
                    updateReservation(reservation.id, (rec) => ({
                      ...rec,
                      status: "Checked out",
                    }))
                  }
                >
                  Check out
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Reservation Priority
            </h2>
            <p className="text-sm text-slate-500">
              Filter upcoming arrivals/departures quickly.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {rangeOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={range === option.value ? "primary" : "secondary"}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Guest Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {prioritizedRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                    {row.guest}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.room}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.status === "Cancelled"
                      ? "—"
                      : formatHumanDate(row.checkIn)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.status === "Cancelled"
                      ? "—"
                      : formatHumanDate(row.checkOut)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {row.status !== "Checked in" &&
                        row.status !== "Checked out" &&
                        row.status !== "Cancelled" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updateReservation(row.id, (rec) => ({
                                ...rec,
                                status: "Checked in",
                              }))
                            }
                          >
                            Check in
                          </Button>
                        )}
                      {row.status !== "Cancelled" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            updateReservation(row.id, (rec) => ({
                              ...rec,
                              status: "Checked out",
                            }))
                          }
                        >
                          Check out
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          updateReservation(row.id, (rec) => ({
                            ...rec,
                            status: "Cancelled",
                          }))
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Today's Room Status
          </h2>
          <div className="flex gap-4 flex-wrap text-sm">
            <LegendDot color="#22c55e" label="Available" />
            <LegendDot color="#1d4ed8" label="Occupied" />
            <LegendDot color="#f59e0b" label="Arrival (check-in today)" />
            <LegendDot color="#fb923c" label="Departure (check-out today)" />
            <LegendDot color="#4b5563" label="Maintenance" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {todayRoomStatuses.map((status) => (
            <div
              key={`today-${status.room}`}
              style={{
                background: status.color,
                color: "#fff",
                borderRadius: 14,
                padding: ".65rem 1.25rem",
                minWidth: 130,
                textAlign: "center",
                boxShadow: "0 8px 16px rgba(15,23,42,.15)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: ".95rem" }}>
                Room {status.room}
              </div>
              {status.roomType && (
                <div style={{ fontSize: ".78rem", opacity: 0.9 }}>
                  {status.roomType}
                </div>
              )}
              <div
                style={{
                  fontSize: ".82rem",
                  fontWeight: 600,
                  marginTop: ".25rem",
                }}
              >
                {status.label}
              </div>
              {status.guestName && (
                <div
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 500,
                    marginTop: ".15rem",
                    opacity: 0.9,
                  }}
                >
                  {status.tag === "arrival" && `Arriving: ${status.guestName}`}
                  {status.tag === "departure" &&
                    `Departing: ${status.guestName}`}
                  {status.tag === "occupied" && `Guest: ${status.guestName}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <RoomCalendar
        heading="Room Calendar Overview"
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

export default Dashboard;
