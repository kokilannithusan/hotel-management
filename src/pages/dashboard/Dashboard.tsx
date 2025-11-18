import { useEffect, useMemo, useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { formatCurrency } from "../../utils/formatters";
import { CheckInDialog } from "../../components/dialogs/CheckInDialog";
import { CheckOutDialog } from "../../components/dialogs/CheckOutDialog";
import { CancelReservationDialog } from "../../components/dialogs/CancelReservationDialog";

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
  const { state } = useHotel();
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  const openCheckInDialog = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setShowCheckInDialog(true);
  };

  const openCheckOutDialog = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setShowCheckOutDialog(true);
  };

  const openExtendDialog = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setShowExtendDialog(true);
  };

  const openCancelDialog = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setShowCancelDialog(true);
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

  // New filter states for Reservation Overview
  const [filterReferenceNumber, setFilterReferenceNumber] = useState("");
  const [filterRoomNumber, setFilterRoomNumber] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("all");
  const [filterDateView, setFilterDateView] = useState<"all" | "day">("day");
  const [filterSelectedDate, setFilterSelectedDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "check-in" | "check-out"
  >("all");

  // Initialize selected date to today on mount
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setFilterSelectedDate(`${year}-${month}-${day}`);
  }, []);

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
        // Get the original room status from state
        const originalRoom = state.rooms.find(
          (r) => r.roomNumber === room.number
        );

        // Check if room is in maintenance first (highest priority)
        if (
          originalRoom &&
          (originalRoom.status === "maintenance" ||
            originalRoom.status === "to-clean")
        ) {
          return {
            room: room.number,
            roomType: room.type,
            label: "Maintenance",
            color: "#dc2626",
            tag: "maintenance",
          };
        }

        const departureReservation = reservations.find((reservation) => {
          if (reservation.room !== room.number) return false;
          if (reservation.status === "Cancelled") return false;
          return sameDay(reservation.checkOut, normalizedToday);
        });
        if (departureReservation) {
          return {
            room: room.number,
            roomType: room.type,
            label: "Check-Out",
            color: "#ea580c",
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
            color: "#6b7280",
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
            label: "Check-In",
            color: "#2563eb",
            guestName: arrivalReservation.guest,
            tag: "arrival",
          };
        }
        return {
          room: room.number,
          roomType: room.type,
          label: "Available",
          color: "#16a34a",
          tag: "available",
        };
      })
      .sort((a, b) =>
        a.room.localeCompare(b.room, undefined, { numeric: true })
      );
  }, [rooms, reservations, normalizedToday, state.rooms]);

  const stats = useMemo(() => {
    // Today's total reservations (check-ins or check-outs happening today)
    const todayTotalReservations = reservations.filter((r) => {
      const isCheckInToday = sameDay(r.checkIn, normalizedToday);
      const isCheckOutToday = sameDay(r.checkOut, normalizedToday);
      return (isCheckInToday || isCheckOutToday) && r.status !== "Cancelled";
    }).length;

    // Today's check-ins
    const todayCheckIn = reservations.filter((r) => {
      return sameDay(r.checkIn, normalizedToday) && r.status !== "Cancelled";
    }).length;

    // Today's check-outs
    const todayCheckOut = reservations.filter((r) => {
      return sameDay(r.checkOut, normalizedToday) && r.status !== "Cancelled";
    }).length;

    // Occupied rooms (currently checked in)
    const occupied = reservations.filter(
      (r) => r.status === "Checked in"
    ).length;

    return [
      { label: "Today Total Reservations", value: todayTotalReservations },
      { label: "Today Check In", value: todayCheckIn },
      { label: "Today Check Out", value: todayCheckOut },
      { label: "Occupied", value: occupied },
    ];
  }, [reservations, normalizedToday]);

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

  // Filtered reservations for the new Reservation Overview table
  const filteredReservations = useMemo(() => {
    return reservations
      .filter((reservation) => {
        // Filter by reference number (reservation ID)
        if (
          filterReferenceNumber &&
          !reservation.id
            .toLowerCase()
            .includes(filterReferenceNumber.toLowerCase())
        ) {
          return false;
        }

        // Filter by room number
        if (
          filterRoomNumber &&
          !reservation.room
            .toLowerCase()
            .includes(filterRoomNumber.toLowerCase())
        ) {
          return false;
        }

        // Filter by room type
        if (filterRoomType !== "all") {
          const room = roomById.get(
            state.reservations.find((r) => r.id === reservation.id)?.roomId ||
              ""
          );
          const roomType = room ? roomTypeMap.get(room.roomTypeId)?.name : "";
          if (roomType?.toLowerCase() !== filterRoomType.toLowerCase()) {
            return false;
          }
        }

        // Filter by date range based on selected date and view mode
        const checkInDate = normalizeDate(reservation.checkIn);
        const checkOutDate = normalizeDate(reservation.checkOut);

        if (filterDateView === "day" && filterSelectedDate) {
          const selectedDate = new Date(filterSelectedDate);
          selectedDate.setHours(0, 0, 0, 0);

          // If status filter is active, apply it with the selected date
          if (filterStatus === "check-in") {
            const isCheckInOnSelectedDay =
              checkInDate &&
              checkInDate.getFullYear() === selectedDate.getFullYear() &&
              checkInDate.getMonth() === selectedDate.getMonth() &&
              checkInDate.getDate() === selectedDate.getDate();
            if (!isCheckInOnSelectedDay) {
              return false;
            }
          } else if (filterStatus === "check-out") {
            const isCheckOutOnSelectedDay =
              checkOutDate &&
              checkOutDate.getFullYear() === selectedDate.getFullYear() &&
              checkOutDate.getMonth() === selectedDate.getMonth() &&
              checkOutDate.getDate() === selectedDate.getDate();
            if (!isCheckOutOnSelectedDay) {
              return false;
            }
          } else {
            // Status is "all", show check-in or check-out on selected day
            const isCheckInOnSelectedDay =
              checkInDate &&
              checkInDate.getFullYear() === selectedDate.getFullYear() &&
              checkInDate.getMonth() === selectedDate.getMonth() &&
              checkInDate.getDate() === selectedDate.getDate();
            const isCheckOutOnSelectedDay =
              checkOutDate &&
              checkOutDate.getFullYear() === selectedDate.getFullYear() &&
              checkOutDate.getMonth() === selectedDate.getMonth() &&
              checkOutDate.getDate() === selectedDate.getDate();
            if (!isCheckInOnSelectedDay && !isCheckOutOnSelectedDay) {
              return false;
            }
          }
        }

        // Exclude cancelled reservations
        if (reservation.status === "Cancelled") {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort order: check-out today, check-in today, checked-out, checked-in
        // Priority order
        const getPriority = (reservation: typeof a) => {
          if (
            sameDay(reservation.checkOut, normalizedToday) &&
            reservation.status === "Checked in"
          )
            return 1; // check-out today
          if (
            sameDay(reservation.checkIn, normalizedToday) &&
            reservation.status !== "Checked in" &&
            reservation.status !== "Checked out"
          )
            return 2; // check-in today
          if (reservation.status === "Checked out") return 3; // checked-out
          if (reservation.status === "Checked in") return 4; // checked-in
          return 5; // others
        };

        return getPriority(a) - getPriority(b);
      });
  }, [
    reservations,
    filterReferenceNumber,
    filterRoomNumber,
    filterRoomType,
    filterDateView,
    filterSelectedDate,
    filterStatus,
    normalizedToday,
    roomById,
    roomTypeMap,
    state.reservations,
  ]);

  // Get unique room types for the filter dropdown
  const roomTypeOptions = useMemo(() => {
    const uniqueTypes = new Set<string>();
    state.roomTypes.forEach((type) => uniqueTypes.add(type.name));
    return [
      { value: "all", label: "All Room Types" },
      ...Array.from(uniqueTypes).map((name) => ({
        value: name.toLowerCase(),
        label: name,
      })),
    ];
  }, [state.roomTypes]);

  // Check if a reservation is in the future (for disabling buttons)
  const isReservationInFuture = (reservation: ReservationExtended) => {
    const checkInDate = normalizeDate(reservation.checkIn);
    if (!checkInDate) return false;
    return checkInDate.getTime() > normalizedToday.getTime();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-slate-200 p-2.5"
          >
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
              {stat.label}
            </div>
            <div className="text-lg font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            Reservation Overview
          </h2>
          <p className="text-xs text-slate-500">
            Filter and manage today's reservations with advanced search options.
          </p>
        </div>
        {/* Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Input
            label="Reference Number"
            placeholder="Search by ID..."
            value={filterReferenceNumber}
            onChange={(e) => setFilterReferenceNumber(e.target.value)}
          />
          <Input
            label="Room Number"
            placeholder="Search by room..."
            value={filterRoomNumber}
            onChange={(e) => setFilterRoomNumber(e.target.value)}
          />
          <Select
            label="Room Type"
            options={roomTypeOptions}
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value)}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Filter
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  filterDateView === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setFilterDateView("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  filterDateView === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setFilterDateView("day")}
              >
                Calendar
              </button>
            </div>
          </div>
          {filterDateView === "day" && (
            <div className="w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                className="premium-input w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-slate-300"
                value={filterSelectedDate}
                onChange={(e) => setFilterSelectedDate(e.target.value)}
              />
            </div>
          )}
        </div>{" "}
        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === "all"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === "check-in"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setFilterStatus("check-in")}
          >
            Check In
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterStatus === "check-out"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setFilterStatus("check-out")}
          >
            Check Out
          </button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reference #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Guest Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Check-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Check-Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    No reservations found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => {
                  const isFuture = isReservationInFuture(reservation);

                  // Button disabled states
                  const isCheckInDisabled =
                    reservation.status === "Checked in" ||
                    reservation.status === "Checked out" ||
                    reservation.status === "Cancelled" ||
                    isFuture;

                  const isCheckOutDisabled =
                    reservation.status !== "Checked in" || isFuture;

                  const isExtendDisabled =
                    reservation.status === "Checked out" ||
                    reservation.status === "Cancelled";

                  const isCancelDisabled =
                    reservation.status === "Checked out" ||
                    reservation.status === "Cancelled";

                  return (
                    <tr
                      key={reservation.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {reservation.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {reservation.guest}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {reservation.room}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatHumanDate(reservation.checkIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatHumanDate(reservation.checkOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={reservation.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {formatCurrency(reservation.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Check In Button */}
                          <button
                            disabled={isCheckInDisabled}
                            onClick={() => openCheckInDialog(reservation.id)}
                            title={
                              isCheckInDisabled
                                ? reservation.status === "Checked in"
                                  ? "Already checked in"
                                  : reservation.status === "Checked out"
                                  ? "Already checked out"
                                  : reservation.status === "Cancelled"
                                  ? "Reservation cancelled"
                                  : "Cannot check in future reservations"
                                : "Check In"
                            }
                            className={`group relative p-2 rounded-lg transition-all duration-200 ${
                              isCheckInDisabled
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white hover:shadow-lg hover:scale-110"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                              />
                            </svg>
                            {!isCheckInDisabled && (
                              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Check In
                              </span>
                            )}
                          </button>

                          {/* Check Out Button */}
                          <button
                            disabled={isCheckOutDisabled}
                            onClick={() => openCheckOutDialog(reservation.id)}
                            title={
                              isCheckOutDisabled
                                ? reservation.status !== "Checked in"
                                  ? "Guest must be checked in first"
                                  : "Cannot check out future reservations"
                                : "Check Out"
                            }
                            className={`group relative p-2 rounded-lg transition-all duration-200 ${
                              isCheckOutDisabled
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:scale-110"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            {!isCheckOutDisabled && (
                              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Check Out
                              </span>
                            )}
                          </button>

                          {/* Extend Button */}
                          <button
                            disabled={isExtendDisabled}
                            onClick={() => openExtendDialog(reservation.id)}
                            title={
                              isExtendDisabled
                                ? reservation.status === "Checked out"
                                  ? "Cannot extend checked out reservation"
                                  : "Cannot extend cancelled reservation"
                                : "Extend Stay"
                            }
                            className={`group relative p-2 rounded-lg transition-all duration-200 ${
                              isExtendDisabled
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white hover:shadow-lg hover:scale-110"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {!isExtendDisabled && (
                              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Extend
                              </span>
                            )}
                          </button>

                          {/* Cancel Button */}
                          <button
                            disabled={isCancelDisabled}
                            onClick={() => openCancelDialog(reservation.id)}
                            title={
                              isCancelDisabled
                                ? reservation.status === "Checked out"
                                  ? "Cannot cancel checked out reservation"
                                  : "Already cancelled"
                                : "Cancel Reservation"
                            }
                            className={`group relative p-2 rounded-lg transition-all duration-200 ${
                              isCancelDisabled
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:scale-110"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            {!isCancelDisabled && (
                              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Cancel
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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
            <LegendDot color="#16a34a" label="Available" />
            <LegendDot color="#6b7280" label="Occupied" />
            <LegendDot color="#2563eb" label="Check-In Today" />
            <LegendDot color="#ea580c" label="Check-Out Today" />
            <LegendDot color="#dc2626" label="Maintenance" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {todayRoomStatuses.map((status) => (
            <div
              key={`today-${status.room}`}
              style={{
                background: status.color,
                color: "#fff",
                borderRadius: 14,
                padding: ".65rem 1rem",
                textAlign: "center",
                boxShadow: "0 8px 16px rgba(15,23,42,.15)",
                minHeight: "110px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
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

      {/* Check-In Dialog */}
      {showCheckInDialog &&
        selectedReservationId &&
        (() => {
          const reservation = state.reservations.find(
            (r) => r.id === selectedReservationId
          );
          return reservation ? (
            <Modal
              isOpen={showCheckInDialog}
              onClose={() => setShowCheckInDialog(false)}
              title=""
              size="5xl"
            >
              <CheckInDialog
                reservation={reservation}
                onClose={() => setShowCheckInDialog(false)}
                onCheckInComplete={() => {
                  setShowCheckInDialog(false);
                  setSelectedReservationId(null);
                }}
              />
            </Modal>
          ) : null;
        })()}

      {/* Check-Out Dialog */}
      {showCheckOutDialog &&
        selectedReservationId &&
        (() => {
          const reservation = state.reservations.find(
            (r) => r.id === selectedReservationId
          );
          return reservation ? (
            <Modal
              isOpen={showCheckOutDialog}
              onClose={() => setShowCheckOutDialog(false)}
              title=""
              size="5xl"
            >
              <CheckOutDialog
                reservation={reservation}
                onClose={() => setShowCheckOutDialog(false)}
                onCheckOutComplete={() => {
                  setShowCheckOutDialog(false);
                  setSelectedReservationId(null);
                }}
              />
            </Modal>
          ) : null;
        })()}

      {/* Extend Stay Dialog */}
      {showExtendDialog &&
        selectedReservationId &&
        (() => {
          const reservation = state.reservations.find(
            (r) => r.id === selectedReservationId
          );
          return reservation ? (
            <Modal
              isOpen={showExtendDialog}
              onClose={() => setShowExtendDialog(false)}
              title=""
              size="5xl"
            >
              <CheckOutDialog
                reservation={reservation}
                initialStep="extend-date"
                onClose={() => setShowExtendDialog(false)}
                onCheckOutComplete={() => {
                  setShowExtendDialog(false);
                  setSelectedReservationId(null);
                }}
              />
            </Modal>
          ) : null;
        })()}

      {/* Cancel Reservation Dialog */}
      {showCancelDialog &&
        selectedReservationId &&
        (() => {
          const reservation = state.reservations.find(
            (r) => r.id === selectedReservationId
          );
          return reservation ? (
            <Modal
              isOpen={showCancelDialog}
              onClose={() => setShowCancelDialog(false)}
              title=""
              size="5xl"
            >
              <CancelReservationDialog
                reservation={reservation}
                onClose={() => setShowCancelDialog(false)}
                onCancelComplete={() => {
                  setShowCancelDialog(false);
                  setSelectedReservationId(null);
                }}
              />
            </Modal>
          ) : null;
        })()}
    </div>
  );
}

export default Dashboard;
