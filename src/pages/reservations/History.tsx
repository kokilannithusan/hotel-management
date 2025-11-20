import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { CheckInDialog } from "../../components/dialogs/CheckInDialog";
import { CheckOutDialog } from "../../components/dialogs/CheckOutDialog";
import {
  formatDate,
  formatCurrency,
  formatPhoneNumber,
} from "../../utils/formatters";
import { Reservation, ReservationStatus } from "../../types/entities";
import {
  Mail,
  Phone,
  User,
  Calendar,
  Home,
  UtensilsCrossed,
} from "lucide-react";

type StatusKey = ReservationStatus | "all";
type SortOption = "recent" | "oldest" | "amount-high" | "amount-low";

const STATUS_FILTERS: Array<{
  value: StatusKey;
  label: string;
  tone: string;
  description: string;
}> = [
  {
    value: "checked-out",
    label: "Checked out",
    tone: "bg-slate-100 text-slate-700",
    description: "Guests who have completed their stay",
  },
  {
    value: "canceled",
    label: "Cancelled",
    tone: "bg-red-100 text-red-700",
    description: "Reservations that were canceled",
  },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-high", label: "Highest amount" },
  { value: "amount-low", label: "Lowest amount" },
];

const STATUS_BADGE_CLASS: Record<ReservationStatus, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  "checked-in": "bg-green-100 text-green-800",
  "checked-out": "bg-slate-100 text-slate-800",
  canceled: "bg-red-100 text-red-800",
};

export const ReservationsHistory: React.FC = () => {
  const { state, dispatch } = useHotel();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("checked-out");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceReservationId, setInvoiceReservationId] = useState<
    string | null
  >(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [activeReservation, setActiveReservation] =
    useState<Reservation | null>(null);
  const currencyCode = state.settings?.currency ?? "USD";

  const customerById = useMemo(() => {
    const map = new Map<string, (typeof state.customers)[number]>();
    state.customers.forEach((customer) => map.set(customer.id, customer));
    return map;
  }, [state.customers]);

  const roomById = useMemo(() => {
    const map = new Map<string, (typeof state.rooms)[number]>();
    state.rooms.forEach((room) => map.set(room.id, room));
    return map;
  }, [state.rooms]);

  const roomTypeById = useMemo(() => {
    const map = new Map<string, (typeof state.roomTypes)[number]>();
    state.roomTypes.forEach((roomType) => map.set(roomType.id, roomType));
    return map;
  }, [state.roomTypes]);

  const channelById = useMemo(() => {
    const map = new Map<string, (typeof state.channels)[number]>();
    state.channels.forEach((channel) => map.set(channel.id, channel));
    return map;
  }, [state.channels]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusKey, number> = {
      all: state.reservations.length,
      confirmed: 0,
      "checked-in": 0,
      "checked-out": 0,
      canceled: 0,
    };

    state.reservations.forEach((res) => {
      counts[res.status] += 1;
    });

    return counts;
  }, [state.reservations]);

  const filteredReservations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    // Only show checked-out and canceled (not checked-in/occupied)
    const filtered = state.reservations.filter((res) => {
      if (res.status === "checked-in" || res.status === "confirmed")
        return false;
      const customer = customerById.get(res.customerId);
      const matchesSearch =
        !normalizedSearch ||
        res.id.toLowerCase().includes(normalizedSearch) ||
        (customer &&
          (customer.name.toLowerCase().includes(normalizedSearch) ||
            customer.email.toLowerCase().includes(normalizedSearch)));
      const matchesStatus =
        statusFilter === "all" || res.status === statusFilter;
      const matchesChannel =
        channelFilter === "all" || res.channelId === channelFilter;
      return matchesSearch && matchesStatus && matchesChannel;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "amount-high":
          return b.totalAmount - a.totalAmount;
        case "amount-low":
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });
  }, [
    state.reservations,
    customerById,
    searchTerm,
    statusFilter,
    channelFilter,
    sortOption,
  ]);

  const filtersActive =
    searchTerm.trim().length > 0 ||
    statusFilter !== "checked-out" ||
    channelFilter !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("checked-out");
    setChannelFilter("all");
  };

  const reservationStats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const summary = {
      total: filteredReservations.length,
      upcoming: 0,
      inHouse: 0,
      canceled: 0,
      revenue: 0,
    };

    filteredReservations.forEach((res) => {
      const checkInDate = new Date(res.checkIn);
      const checkOutDate = new Date(res.checkOut);

      if (res.status === "canceled") {
        summary.canceled += 1;
      }

      if (checkInDate > startOfToday) {
        summary.upcoming += 1;
      }

      if (
        res.status !== "canceled" &&
        checkInDate <= startOfToday &&
        checkOutDate >= startOfToday
      ) {
        summary.inHouse += 1;
      }

      if (res.status !== "canceled") {
        summary.revenue += res.totalAmount;
      }
    });

    return summary;
  }, [filteredReservations]);

  const totalReservations = state.reservations.filter(
    (res) => res.status === "checked-out" || res.status === "canceled"
  ).length;

  const getNightCount = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diff = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 1;
  };

  const selectedReservation = useMemo(() => {
    if (!selectedReservationId) {
      return null;
    }
    return (
      state.reservations.find((res) => res.id === selectedReservationId) || null
    );
  }, [selectedReservationId, state.reservations]);

  const selectedCustomer = selectedReservation
    ? customerById.get(selectedReservation.customerId)
    : undefined;
  const selectedRoom = selectedReservation
    ? roomById.get(selectedReservation.roomId)
    : undefined;
  const selectedRoomType = selectedRoom?.roomTypeId
    ? roomTypeById.get(selectedRoom.roomTypeId)
    : undefined;
  const selectedChannel = selectedReservation
    ? channelById.get(selectedReservation.channelId)
    : undefined;
  const selectedNights = selectedReservation
    ? getNightCount(selectedReservation.checkIn, selectedReservation.checkOut)
    : 0;

  const handleCancel = (reservation: Reservation, onSuccess?: () => void) => {
    if (window.confirm("Are you sure you want to cancel this reservation?")) {
      dispatch({
        type: "UPDATE_RESERVATION",
        payload: { ...reservation, status: "canceled" },
      });
      onSuccess?.();
    }
  };

  const handleCheckIn = (reservation: Reservation) => {
    setActiveReservation(reservation);
    setCheckInDialogOpen(true);
  };

  const handleCheckOut = (reservation: Reservation) => {
    setActiveReservation(reservation);
    setCheckOutDialogOpen(true);
  };

  const confirmCheckOut = (reservationId: string) => {
    const reservation = state.reservations.find((r) => r.id === reservationId);
    if (reservation) {
      dispatch({
        type: "UPDATE_RESERVATION",
        payload: { ...reservation, status: "checked-out" },
      });
      setInvoiceOpen(false);
      setInvoiceReservationId(null);
    }
  };

  const handleExtend = (reservation: Reservation) => {
    // Navigate to ReserveRoom with extend mode
    navigate(`/reservations/reserve?extend=${reservation.id}`);
  };

  const handleOpenReservation = (reservation: Reservation) => {
    setSelectedReservationId(reservation.id);
    setDetailsOpen(true);
  };

  const handleCloseReservation = () => {
    setDetailsOpen(false);
    setSelectedReservationId(null);
  };

  const columns = [
    {
      key: "reservation",
      header: "Reservation",
      cellClassName: "whitespace-normal",
      render: (res: Reservation) => {
        const createdLabel = formatDate(res.createdAt);

        return (
          <div className="space-y-1.5">
            <div className="font-mono text-sm font-bold text-slate-900">
              #{res.id.slice(0, 8)}
            </div>
            <div className="text-xs text-slate-500">{createdLabel}</div>
          </div>
        );
      },
    },
    {
      key: "guest",
      header: "Guest",
      cellClassName: "whitespace-normal",
      render: (res: Reservation) => {
        const customer = customerById.get(res.customerId);
        if (!customer) {
          return <span className="text-sm text-slate-500">Unknown guest</span>;
        }
        return (
          <div className="text-sm font-semibold text-slate-900">
            {customer.name}
          </div>
        );
      },
    },
    {
      key: "stay",
      header: "Stay",
      cellClassName: "whitespace-normal",
      render: (res: Reservation) => {
        const nights = getNightCount(res.checkIn, res.checkOut);
        return (
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-slate-900">
              {formatDate(res.checkIn)}
            </div>
            <div className="text-xs text-slate-500">
              {nights} nights • {res.adults} guest{res.adults > 1 ? "s" : ""}
              {res.children > 0
                ? ` • ${res.children} child${res.children > 1 ? "ren" : ""}`
                : ""}
            </div>
          </div>
        );
      },
    },
    {
      key: "room",
      header: "Room",
      cellClassName: "whitespace-normal",
      render: (res: Reservation) => {
        const room = roomById.get(res.roomId);
        const roomType = room?.roomTypeId
          ? roomTypeById.get(room.roomTypeId)
          : undefined;
        return room ? (
          <div>
            <div className="text-sm font-bold text-slate-900">
              {room.roomNumber}
            </div>
            <div className="text-xs text-slate-500">
              {roomType?.name || "Unknown"}
            </div>
          </div>
        ) : (
          <span className="text-sm text-slate-500">—</span>
        );
      },
    },
    {
      key: "channel",
      header: "Channel",
      render: (res: Reservation) => {
        const channel = channelById.get(res.channelId);
        return (
          <div className="text-sm text-slate-700">
            {channel?.name || "Direct"}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (res: Reservation) => {
        const statusText =
          res.status.charAt(0).toUpperCase() +
          res.status.slice(1).replace("-", " ");
        const statusConfig: Record<
          ReservationStatus,
          { bg: string; text: string }
        > = {
          confirmed: {
            bg: "bg-blue-100",
            text: "text-blue-800",
          },
          "checked-in": {
            bg: "bg-green-100",
            text: "text-green-800",
          },
          "checked-out": {
            bg: "bg-slate-100",
            text: "text-slate-800",
          },
          canceled: {
            bg: "bg-red-100",
            text: "text-red-800",
          },
        };
        const config = statusConfig[res.status];
        return (
          <span
            className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Amount",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right",
      render: (res: Reservation) => (
        <div className="text-sm font-bold text-slate-900">
          {formatCurrency(res.totalAmount, currencyCode)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right",
      render: (res: Reservation) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md transition-all duration-200"
            onClick={(event) => {
              event.stopPropagation();
              handleOpenReservation(res);
            }}
          >
            View
          </Button>
          {res.status === "confirmed" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCheckIn(res);
                }}
              >
                Check-in
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCancel(res);
                }}
              >
                Cancel
              </Button>
            </>
          )}
          {res.status === "checked-in" && (
            <>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={(event) => {
                  event.stopPropagation();
                  handleExtend(res);
                }}
              >
                Extend
              </Button>
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCheckOut(res);
                }}
              >
                Check-out
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Reservation History
        </h1>
        <p className="text-slate-600">View and manage all past reservations</p>
      </div>
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Reservation overview
              </p>
              <p className="text-xs text-slate-500">
                Showing {reservationStats.total} of {totalReservations}{" "}
                reservations
              </p>
            </div>
            {filtersActive && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset filters
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {STATUS_FILTERS.map(({ value, label, description }) => {
              const isActive = statusFilter === value;
              const count = statusCounts[value] ?? 0;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value === statusFilter && value !== "all" ? "all" : value
                    )
                  }
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:shadow-md"
                  }`}
                  title={description}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Search
              </label>
              <Input
                placeholder="Search by ID, guest, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Channel
              </label>
              <Select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Channels" },
                  ...state.channels.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
                className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Sort By
              </label>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                options={SORT_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                className="border-2 border-slate-200 focus:border-blue-500 rounded-lg"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border-2 border-slate-200 mt-8 bg-white shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredReservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center py-16 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <svg
                            className="w-16 h-16 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-lg font-medium">
                            No reservations found
                          </p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReservations.map((res) => (
                      <tr
                        key={res.id}
                        className="border-b border-slate-100 hover:bg-blue-50/50 transition-all duration-150 cursor-pointer group"
                        onClick={() => handleOpenReservation(res)}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-6 py-5 ${
                              col.cellClassName || "align-top"
                            }`}
                          >
                            {col.render(res)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
      {selectedReservation && (
        <Modal
          isOpen={detailsOpen}
          onClose={handleCloseReservation}
          title={`Reservation #${selectedReservation.id.slice(0, 8)}`}
          footer={
            <div className="flex w-full flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-between">
              {selectedReservation.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      handleCancel(selectedReservation, handleCloseReservation)
                    }
                  >
                    Cancel reservation
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleCheckIn(selectedReservation);
                      handleCloseReservation();
                    }}
                  >
                    Check-in
                  </Button>
                </>
              )}
              {selectedReservation.status === "checked-in" && (
                <>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      handleCheckOut(selectedReservation);
                      handleCloseReservation();
                    }}
                  >
                    Check-out
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      handleExtend(selectedReservation);
                      handleCloseReservation();
                    }}
                  >
                    Extend stay
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCloseReservation}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  STATUS_BADGE_CLASS[selectedReservation.status]
                }`}
              >
                {selectedReservation.status.charAt(0).toUpperCase() +
                  selectedReservation.status.slice(1).replace("-", " ")}
              </span>
              {selectedChannel && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  {selectedChannel.name}
                </span>
              )}
              <span className="text-xs text-slate-500">
                Created {formatDate(selectedReservation.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Guest
                </p>
                <div className="mt-1 space-y-1 text-sm text-slate-900">
                  <p className="font-medium">
                    {selectedCustomer ? selectedCustomer.name : "Unknown guest"}
                  </p>
                  {selectedCustomer && (
                    <>
                      <p className="text-xs text-slate-500">
                        {selectedCustomer.email}
                      </p>
                      {selectedCustomer.phone && (
                        <p className="text-xs text-slate-500">
                          {formatPhoneNumber(selectedCustomer.phone)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stay details
                </p>
                <div className="mt-1 space-y-1 text-sm text-slate-900">
                  <p>
                    {formatDate(selectedReservation.checkIn)} —{" "}
                    {formatDate(selectedReservation.checkOut)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedNights} night{selectedNights !== 1 ? "s" : ""},{" "}
                    {selectedReservation.adults} adult
                    {selectedReservation.adults !== 1 ? "s" : ""}
                    {selectedReservation.children > 0 && (
                      <>
                        , {selectedReservation.children} child
                        {selectedReservation.children !== 1 ? "ren" : ""}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Room
                </p>
                <div className="mt-1 space-y-1 text-sm text-slate-900">
                  <p className="font-medium">
                    {selectedRoom
                      ? `Room ${selectedRoom.roomNumber}`
                      : "Unknown room"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedRoomType?.name || "Room type unavailable"}
                  </p>
                  {selectedRoom && (
                    <p className="text-xs text-slate-500">
                      Status:{" "}
                      {selectedRoom.status.charAt(0).toUpperCase() +
                        selectedRoom.status.slice(1).replace("-", " ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Billing
                </p>
                <div className="mt-1 space-y-1 text-sm text-slate-900">
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(
                      selectedReservation.totalAmount,
                      currencyCode
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Reservation reference: {selectedReservation.id}
                  </p>
                </div>
              </div>
            </div>

            {selectedReservation.notes && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {selectedReservation.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Invoice Modal for Checkout */}
      {invoiceReservationId && (
        <Modal
          isOpen={invoiceOpen}
          onClose={() => {
            setInvoiceOpen(false);
            setInvoiceReservationId(null);
          }}
          title="Checkout Invoice"
          footer={
            <div className="flex w-full flex-col gap-2 sm:flex-row-reverse sm:items-center sm:justify-between">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => confirmCheckOut(invoiceReservationId)}
              >
                Confirm Checkout
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setInvoiceOpen(false);
                  setInvoiceReservationId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          }
        >
          {(() => {
            const reservation = state.reservations.find(
              (r) => r.id === invoiceReservationId
            );
            const customer = reservation
              ? customerById.get(reservation.customerId)
              : undefined;
            const room = reservation
              ? roomById.get(reservation.roomId)
              : undefined;
            const roomType = room?.roomTypeId
              ? roomTypeById.get(room.roomTypeId)
              : undefined;
            const mealPlan = reservation?.mealPlanId
              ? state.mealPlans.find((mp) => mp.id === reservation.mealPlanId)
              : undefined;

            if (!reservation) return null;

            const checkInDate = new Date(reservation.checkIn);
            const checkOutDate = new Date(reservation.checkOut);
            const nights = Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            const roomCost = (roomType?.basePrice || 0) * nights;
            const mealCost = mealPlan
              ? mealPlan.perPersonRate * reservation.adults * nights +
                (mealPlan.perRoomRate || 0) * nights
              : 0;

            return (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-bold text-slate-900">INVOICE</h3>
                  <p className="text-sm text-slate-500">
                    Invoice #: {reservation.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">
                    Date: {formatDate(new Date().toISOString())}
                  </p>
                </div>

                {/* Guest Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Details Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-blue-600">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">
                        Guest Details
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {/* Name */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                        <User className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Name
                          </p>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {customer?.name || "Unknown"}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                        <Mail className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Email
                          </p>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {customer?.email || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      {customer?.phone && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                          <Phone className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Phone
                            </p>
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {formatPhoneNumber(customer.phone)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stay Details Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-emerald-600">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">
                        Stay Details
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {/* Check-In */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                        <Calendar className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Check-In
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(reservation.checkIn)}
                          </p>
                        </div>
                      </div>

                      {/* Check-Out */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                        <Calendar className="h-4 w-4 text-emerald-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Check-Out
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {formatDate(reservation.checkOut)}
                          </p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors">
                        <span className="inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-emerald-600 mt-1 flex-shrink-0">
                          🌙
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Duration
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {nights} night{nights !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room and Meal Details */}
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-purple-600">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg text-slate-900">
                      Accommodation
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* Room */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Home className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Room Type
                          </p>
                          <p className="text-sm font-medium text-slate-900">
                            {roomType?.name || "Room"} (Room{" "}
                            {room?.roomNumber || "-"})
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {nights} night
                            {nights !== 1 ? "s" : ""} × $
                            {(roomType?.basePrice || 0).toFixed(2)}/night
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-purple-700">
                          ${roomCost.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Meal Plan */}
                    {mealPlan && (
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 hover:bg-white transition-colors justify-between border-t border-purple-200">
                        <div className="flex items-start gap-3 flex-1">
                          <UtensilsCrossed className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Meal Plan
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {mealPlan.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {reservation.adults} guest
                              {reservation.adults !== 1 ? "s" : ""} × {nights}{" "}
                              night{nights !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-700">
                            ${mealCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg p-6 text-white">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold uppercase tracking-wider opacity-90">
                      Total Amount Due
                    </span>
                    <span className="text-4xl font-bold">
                      {formatCurrency(reservation.totalAmount, currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Payment Note */}
                <div className="text-xs text-slate-600 text-center border-t border-slate-200 pt-4">
                  <p className="font-medium">Thank you for your stay!</p>
                  <p className="mt-1 text-slate-500">
                    Please settle any outstanding balance.
                  </p>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Check-In Dialog */}
      {checkInDialogOpen && activeReservation && (
        <CheckInDialog
          reservation={activeReservation}
          onClose={() => {
            setCheckInDialogOpen(false);
            setActiveReservation(null);
          }}
          onCheckInComplete={() => {
            setCheckInDialogOpen(false);
            setActiveReservation(null);
          }}
        />
      )}

      {/* Check-Out Dialog */}
      {checkOutDialogOpen && activeReservation && (
        <CheckOutDialog
          reservation={activeReservation}
          onClose={() => {
            setCheckOutDialogOpen(false);
            setActiveReservation(null);
          }}
          onCheckOutComplete={() => {
            setCheckOutDialogOpen(false);
            setActiveReservation(null);
          }}
        />
      )}
    </div>
  );
};
