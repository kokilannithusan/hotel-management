import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { Reservation, Room } from "../../types/entities";
import {
  Calendar as CalendarIcon,
  Wifi,
  Wind,
  Tv,
  Coffee,
  Shield,
  Home,
  Waves,
  ChefHat,
  Briefcase,
  Droplets,
  Scissors,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
} from "lucide-react";

export const RoomsOverview: React.FC = () => {
  const { state } = useHotel();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [viewTypeFilter, setViewTypeFilter] = useState<string>("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [calendarRoom, setCalendarRoom] = useState<Room | null>(null);
  const [calendarMonthForRoom, setCalendarMonthForRoom] = useState<Date>(
    new Date()
  );

  const openRoomCalendar = (room: Room) => {
    setCalendarRoom(room);
    setCalendarMonthForRoom(new Date());
  };

  const closeRoomCalendar = () => setCalendarRoom(null);
  const currentMonth = new Date();

  // Normalize room status for display (hoisted for filters and rendering)
  const getDisplayStatus = (roomStatus: string): string => {
    if (roomStatus === "cleaned" || roomStatus === "to-clean") {
      return "available";
    }
    return roomStatus;
  };

  const filteredRooms = state.rooms.filter((room) => {
    if (!room) return false;

    const matchesSearch =
      !searchTerm ||
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const displayStatus = getDisplayStatus(room.status);
    const matchesStatus =
      statusFilter === "all" || displayStatus === statusFilter;

    const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
    const matchesRoomType =
      roomTypeFilter === "all" || room.roomTypeId === roomTypeFilter;
    const matchesViewType =
      viewTypeFilter === "all" || roomType?.viewTypeId === viewTypeFilter;

    return matchesSearch && matchesStatus && matchesRoomType && matchesViewType;
  });

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentMonth);

  const getCustomerName = (customerId: string) => {
    const customer = state.customers.find((c) => c.id === customerId);
    return customer?.name || "Guest";
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Amenity icon mapping shared with All Rooms
  const getAmenityIcon = (amenityName: string) => {
    const key = (amenityName || "").toLowerCase();
    const iconMap: Record<string, React.ReactNode> = {
      wifi: <Wifi className="w-4 h-4" />,
      ac: <Wind className="w-4 h-4" />,
      tv: <Tv className="w-4 h-4" />,
      minibar: <Coffee className="w-4 h-4" />,
      safe: <Shield className="w-4 h-4" />,
      balcony: <Home className="w-4 h-4" />,
      jacuzzi: <Waves className="w-4 h-4" />,
      kitchenette: <ChefHat className="w-4 h-4" />,
      "work desk": <Briefcase className="w-4 h-4" />,
      "coffee maker": <Coffee className="w-4 h-4" />,
      "hair dryer": <Droplets className="w-4 h-4" />,
      "iron & board": <Scissors className="w-4 h-4" />,
    };
    return iconMap[key] || <ImageIcon className="w-4 h-4" />;
  };

  // Get room image URL (fallback per room type)
  const getRoomImage = (room: Room) => {
    const roomType = state.roomTypes.find((rt) => rt.id === room.roomTypeId);
    const imageMap: Record<string, string> = {
      Standard:
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop",
      Deluxe:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop",
      Suite:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop",
      Presidential:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
      Family:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop",
    };
    return (
      imageMap[roomType?.name || "Standard"] ||
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop"
    );
  };

  // Map view type name to a Tailwind color / gradient class for a small badge
  const getViewTypeColor = (viewTypeName?: string) => {
    const name = (viewTypeName || "").toLowerCase();
    if (!name) return "bg-slate-400";
    if (name.includes("sea") || name.includes("ocean"))
      return "bg-gradient-to-r from-sky-500 to-teal-400";
    if (name.includes("pool"))
      return "bg-gradient-to-r from-cyan-400 to-blue-500";
    if (name.includes("garden"))
      return "bg-gradient-to-r from-emerald-400 to-green-600";
    if (name.includes("mountain") || name.includes("hill"))
      return "bg-gradient-to-r from-indigo-500 to-purple-500";
    return "bg-slate-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Room Occupancy Calendar
          </h1>
          <p className="text-slate-600 mt-1">
            Visualize room availability and bookings
          </p>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1 rounded-l ${
              viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-600"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 ${
              viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-600"
            }`}
          >
            List
          </button>
        </div>
      </div>

      <Card className="hover-lift">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              placeholder="Search by room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "available", label: "Available" },
              { value: "occupied", label: "Occupied" },
              { value: "maintenance", label: "Maintenance" },
            ]}
          />
          <Select
            label="Room Type"
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            options={[
              { value: "all", label: "All Room Types" },
              ...state.roomTypes.map((rt) => ({
                value: rt.id,
                label: rt.name,
              })),
            ]}
          />
          <Select
            label="View Type"
            value={viewTypeFilter}
            onChange={(e) => setViewTypeFilter(e.target.value)}
            options={[
              { value: "all", label: "All View Types" },
              ...state.viewTypes.map((vt) => ({
                value: vt.id,
                label: vt.name,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Legend removed per user request */}

      <Card className="hover-lift premium-calendar-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3"></span>
            All Rooms
          </h3>
          <p className="text-sm text-slate-500">
            Viewing in {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}{" "}
            mode
          </p>
        </div>

        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredRooms.map((room) => {
              const roomType = state.roomTypes.find(
                (rt) => rt.id === room.roomTypeId
              );
              const area = state.roomAreas.find((a) => a.id === room.areaId);
              const roomAmenities = room.amenities
                .map((id) => state.amenities.find((a) => a.id === id))
                .filter(Boolean);

              const displayStatus = getDisplayStatus(room.status);
              const housekeeping = state.housekeeping.find(
                (h) => h.roomId === room.id
              );
              const housekeepingStatus = housekeeping?.status || "cleaned";

              const statusConfig: Record<
                string,
                {
                  bg: string;
                  border: string;
                  text: string;
                  badge: string;
                  label: string;
                }
              > = {
                available: {
                  bg: "bg-gradient-to-br from-green-50 to-green-100",
                  border: "border-green-200",
                  text: "text-green-700",
                  badge: "bg-green-500",
                  label: "Available",
                },
                occupied: {
                  bg: "bg-gradient-to-br from-blue-50 to-blue-100",
                  border: "border-blue-200",
                  text: "text-blue-700",
                  badge: "bg-blue-500",
                  label: "Occupied",
                },
                maintenance: {
                  bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
                  border: "border-yellow-200",
                  text: "text-yellow-700",
                  badge: "bg-yellow-500",
                  label: "Maintenance",
                },
              };

              const config =
                statusConfig[displayStatus] || statusConfig.available;

              const getHousekeepingIcon = () => {
                switch (housekeepingStatus) {
                  case "cleaned":
                    return <CheckCircle className="w-4 h-4 text-green-600" />;
                  case "to-clean":
                    return <AlertCircle className="w-4 h-4 text-blue-700" />;
                  case "cleaning-in-progress":
                    return <Clock className="w-4 h-4 text-blue-600" />;
                  case "maintenance":
                    return <Wrench className="w-4 h-4 text-yellow-600" />;
                  default:
                    return <CheckCircle className="w-4 h-4 text-green-600" />;
                }
              };

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`${config.bg} ${config.border} border-2 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 premium-room-grid-card cursor-pointer`}
                >
                  {/* Image header with overlays */}
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={getRoomImage(room)}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop";
                      }}
                    />
                    <div className="absolute top-3 right-3">
                      <div
                        className={`${config.badge} w-3 h-3 rounded-full shadow-lg`}
                      ></div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="bg-white/95 backdrop-blur-sm rounded px-2 py-1 shadow-md border border-white/20">
                        <h3 className="text-sm font-bold text-slate-900">
                          {room.roomNumber}
                        </h3>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                        <p className="text-xs font-semibold text-white">
                          {roomType?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <button
                        aria-label={`Open calendar for room ${room.roomNumber}`}
                        title={`Open calendar for room ${room.roomNumber}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRoomCalendar(room);
                        }}
                        className="w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getHousekeepingIcon()}
                        <span
                          className={`font-bold ${config.text} px-2 py-0.5 rounded-full ${config.bg}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {area && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">
                          Area
                        </span>
                        <span className="font-medium text-slate-700">
                          {area.name}
                        </span>
                      </div>
                    )}

                    {roomType?.viewTypeId &&
                      (() => {
                        const vt = state.viewTypes.find(
                          (v) => v.id === roomType.viewTypeId
                        );
                        return (
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-500">
                              View
                            </span>
                            <span
                              className={`text-white text-xs font-semibold px-2 py-0.5 rounded ${getViewTypeColor(
                                vt?.name
                              )}`}
                            >
                              {vt?.name}
                            </span>
                          </div>
                        );
                      })()}

                    {roomAmenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {roomAmenities.slice(0, 3).map((a: any) => (
                          <div
                            key={a!.id}
                            className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded"
                          >
                            <span className="text-slate-700">
                              {getAmenityIcon(a!.name)}
                            </span>
                            <span className="text-xs text-slate-700">
                              {a!.name}
                            </span>
                          </div>
                        ))}
                        {roomAmenities.length > 3 && (
                          <span className="text-xs text-slate-600">
                            +{roomAmenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "list" && (
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const roomType = state.roomTypes.find(
                (rt) => rt.id === room.roomTypeId
              );
              const area = state.roomAreas.find((a) => a.id === room.areaId);
              const roomAmenities = room.amenities
                .map((id) => state.amenities.find((a) => a.id === id))
                .filter(Boolean) as any[];

              const housekeeping = state.housekeeping.find(
                (h) => h.roomId === room.id
              );
              const housekeepingStatus = housekeeping?.status || "cleaned";
              const displayStatus = getDisplayStatus(room.status);
              const config =
                (
                  {
                    available: {
                      bg: "bg-gradient-to-br from-green-50 to-green-100",
                      border: "border-green-200",
                      text: "text-green-700",
                      badge: "bg-green-500",
                      label: "Available",
                    },
                    occupied: {
                      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
                      border: "border-blue-200",
                      text: "text-blue-700",
                      badge: "bg-blue-500",
                      label: "Occupied",
                    },
                    maintenance: {
                      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
                      border: "border-yellow-200",
                      text: "text-yellow-700",
                      badge: "bg-yellow-500",
                      label: "Maintenance",
                    },
                  } as Record<string, any>
                )[displayStatus] ||
                ({
                  bg: "bg-gradient-to-br from-green-50 to-green-100",
                  border: "border-green-200",
                  text: "text-green-700",
                  badge: "bg-green-500",
                  label: "Available",
                } as any);

              const getHousekeepingIcon = () => {
                switch (housekeepingStatus) {
                  case "cleaned":
                    return <CheckCircle className="w-4 h-4 text-green-600" />;
                  case "to-clean":
                    return <AlertCircle className="w-4 h-4 text-blue-700" />;
                  case "cleaning-in-progress":
                    return <Clock className="w-4 h-4 text-blue-600" />;
                  case "maintenance":
                    return <Wrench className="w-4 h-4 text-yellow-600" />;
                  default:
                    return <CheckCircle className="w-4 h-4 text-green-600" />;
                }
              };

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex items-center p-3 rounded-lg ${config.bg} ${config.border} border cursor-pointer`}
                >
                  <div className="relative w-40 h-28 rounded overflow-hidden">
                    <img
                      src={getRoomImage(room)}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop";
                      }}
                    />
                    <div className="absolute bottom-3 right-3">
                      <button
                        aria-label={`Open calendar for room ${room.roomNumber}`}
                        title={`Open calendar for room ${room.roomNumber}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openRoomCalendar(room);
                        }}
                        className="w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xl text-slate-900">
                          {room.roomNumber}{" "}
                          <span className="text-sm font-medium text-slate-600">
                            {roomType?.name}
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">{area?.name}</p>
                        {roomType?.viewTypeId &&
                          (() => {
                            const vt = state.viewTypes.find(
                              (v) => v.id === roomType.viewTypeId
                            );
                            return (
                              <div className="mt-1">
                                <span
                                  className={`text-white text-xs font-semibold px-2 py-0.5 rounded ${getViewTypeColor(
                                    vt?.name
                                  )}`}
                                >
                                  {vt?.name}
                                </span>
                              </div>
                            );
                          })()}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end mt-2">
                          {getHousekeepingIcon()}
                          <span className={`ml-2 font-bold ${config.text}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {roomAmenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {roomAmenities.map((a) => (
                          <div
                            key={a!.id}
                            className="flex items-center gap-2 bg-white/60 px-2 py-1 rounded"
                          >
                            <span className="text-slate-700">
                              {getAmenityIcon(a!.name)}
                            </span>
                            <span className="text-sm text-slate-700">
                              {a!.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Room Details Modal (status-specific) */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`Room ${selectedRoom.roomNumber} - Detailed Information`}
          size="3xl"
          footer={
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setSelectedRoom(null)}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
            </div>
          }
        >
          {/* Shared calendar renderer */}
          {(() => {
            const room = selectedRoom;
            const roomType = state.roomTypes.find(
              (rt) => rt.id === room.roomTypeId
            );

            // helper: collect reservations for this room
            const reservationsForRoom = state.reservations
              .filter((r) => r.roomId === room.id && r.status !== "canceled")
              .sort(
                (a, b) =>
                  new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
              );

            const todayStr = new Date().toISOString().split("T")[0];

            const nextReservation = reservationsForRoom.find(
              (r) => r.checkIn > todayStr
            );
            const currentRes = reservationsForRoom.find(
              (r) =>
                r.checkIn <= todayStr &&
                r.checkOut > todayStr &&
                r.status === "checked-in"
            );

            // maintenance: if room.status === 'maintenance' mark maintenance for entire month; otherwise none
            const isRoomUnderMaintenance = room.status === "maintenance";

            const renderCalendar = () => {
              // compute booked dates and map to reservations
              const bookedMap: Record<string, Reservation[]> = {};
              reservationsForRoom.forEach((r) => {
                const start = new Date(r.checkIn);
                const end = new Date(r.checkOut);
                for (
                  let d = new Date(start);
                  d < end;
                  d.setDate(d.getDate() + 1)
                ) {
                  const key = d.toISOString().split("T")[0];
                  if (!bookedMap[key]) bookedMap[key] = [];
                  bookedMap[key].push(r);
                }
              });

              return (
                <div className="mt-4">
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {daysInMonth.map((day) => {
                      const dateStr = day.toISOString().split("T")[0];
                      const booked = !!bookedMap[dateStr];
                      const isMaintenance = isRoomUnderMaintenance;
                      const bg = isMaintenance
                        ? "bg-yellow-400"
                        : booked
                        ? "bg-blue-500"
                        : "bg-green-400";
                      const title = booked
                        ? bookedMap[dateStr]
                            .map(
                              (r) =>
                                `${getCustomerName(r.customerId)} (${
                                  r.status
                                }) - ${formatCurrency(r.totalAmount)}`
                            )
                            .join("\n")
                        : "Available";

                      return (
                        <div
                          key={dateStr}
                          className={`p-2 text-center rounded ${bg} text-white`}
                          title={title}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded" /> Available
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" /> Occupied
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded" />{" "}
                      Maintenance
                    </div>
                  </div>
                  {/* removed booked-dates text per UI request */}
                </div>
              );
            };

            // Render different content by status
            if (room.status === "available") {
              const resInfo = nextReservation;
              return (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Reservation Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Number
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.roomNumber}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Type
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {roomType?.name || "N/A"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Adults
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo?.adults ?? "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Children
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo?.children ?? "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Status
                      </p>
                      <p className="text-lg font-bold text-green-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Available
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Channel
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo
                          ? state.channels.find(
                              (ch) => ch.id === resInfo.channelId
                            )?.name || "-"
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Total Amount
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {resInfo ? formatCurrency(resInfo.totalAmount) : "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Notes
                      </p>
                      <p className="text-base text-slate-700">
                        {resInfo ? resInfo.notes || "-" : "Available"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Availability Calendar
                      </h4>
                      <button
                        className="p-2 rounded-lg hover:bg-blue-200/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarRoom(room);
                          setCalendarMonthForRoom(new Date());
                        }}
                        title="Open room calendar"
                      >
                        <CalendarIcon className="w-5 h-5 text-blue-700" />
                      </button>
                    </div>
                  </div>
                  {renderCalendar()}

                  {/* Room Details - show all room fields from data */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                      Room Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          ID
                        </p>
                        <p className="text-base font-medium text-slate-900">
                          {room.id}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Room Number
                        </p>
                        <p className="text-base font-medium text-slate-900">
                          {room.roomNumber}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Room Type
                        </p>
                        <p className="text-base text-slate-900">
                          {roomType?.name || "N/A"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Area
                        </p>
                        <p className="text-base text-slate-900">
                          {state.roomAreas.find((a) => a.id === room.areaId)
                            ?.name || "-"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <p className="text-base text-slate-900">
                          {room.status}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          Size
                        </p>
                        <p className="text-base text-slate-900">
                          {room.size ?? "-"}
                        </p>
                      </div>
                      <div className="md:col-span-2 bg-white rounded-lg p-3 shadow-sm border border-slate-200">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {room.amenities.map((am) => (
                            <span
                              key={am}
                              className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full"
                            >
                              {state.amenities.find((x) => x.id === am)?.name ||
                                am}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (room.status === "maintenance") {
              const resInfo = nextReservation;
              return (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                      Reservation Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Number
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.roomNumber}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Type
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {roomType?.name || "N/A"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Adults
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo?.adults ?? "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Children
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo?.children ?? "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Status
                      </p>
                      <p className="text-lg font-bold text-yellow-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        Maintenance
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Channel
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo
                          ? state.channels.find(
                              (ch) => ch.id === resInfo.channelId
                            )?.name || "-"
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Total Amount
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {resInfo ? formatCurrency(resInfo.totalAmount) : "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Notes
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        Maintenance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-yellow-800">
                      Maintenance Calendar
                    </h4>
                    <button
                      className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-colors flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalendarRoom(room);
                        setCalendarMonthForRoom(new Date());
                      }}
                      title="Open room calendar"
                    >
                      <CalendarIcon className="w-5 h-5 text-slate-700" />
                    </button>
                  </div>
                  {renderCalendar()}
                  {/* Room Details - show all room fields from data */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-500 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-slate-800">
                        Room Details
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          ID
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {room.id}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Room Number
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {room.roomNumber}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Room Type
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {roomType?.name || "N/A"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Area
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {state.roomAreas.find((a) => a.id === room.areaId)
                            ?.name || "-"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Status
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {room.status}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Size
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          {room.size ?? "-"}
                        </p>
                      </div>
                      <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {room.amenities.map((am) => (
                            <span
                              key={am}
                              className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full"
                            >
                              {state.amenities.find((x) => x.id === am)?.name ||
                                am}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Occupied or other statuses
            const res =
              currentRes ||
              reservationsForRoom.find((r) => r.status === "checked-in");
            const customer = res
              ? state.customers.find((c) => c.id === res.customerId)
              : null;
            return (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Customer Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Name
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {customer?.name || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Email
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {customer?.email || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Phone
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {customer?.phone || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Nationality
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {customer?.nationality || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Check-In Date
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res ? formatDate(res.checkIn) : "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Check-Out Date
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res ? formatDate(res.checkOut) : "-"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Reservation Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Room Number
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {room.roomNumber}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Room Type
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {roomType?.name || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Adults
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res?.adults ?? "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Children
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res?.children ?? "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Status
                    </p>
                    <p className="text-lg font-bold text-blue-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      Occupied
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Channel
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res
                        ? state.channels.find((ch) => ch.id === res.channelId)
                            ?.name || "-"
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Total Amount
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res ? formatCurrency(res.totalAmount) : "-"}
                    </p>
                  </div>
                  <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Notes
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {res?.notes || "Late check-out requested"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Occupancy Calendar
                  </h4>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCalendarRoom(room);
                      setCalendarMonthForRoom(new Date());
                    }}
                    title="Open room calendar"
                  >
                    <CalendarIcon className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
                {renderCalendar()}
                {/* Room Details - show all room fields from data */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-l-4 border-slate-500 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Room Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        ID
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.id}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Number
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.roomNumber}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Room Type
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {roomType?.name || "N/A"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Area
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {state.roomAreas.find((a) => a.id === room.areaId)
                          ?.name || "-"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Status
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.status}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Size
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {room.size ?? "-"}
                      </p>
                    </div>
                    <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Amenities
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {room.amenities.map((am) => (
                          <span
                            key={am}
                            className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-full"
                          >
                            {state.amenities.find((x) => x.id === am)?.name ||
                              am}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Calendar-only modal triggered by calendar icon on room cards */}
      {calendarRoom && (
        <Modal
          isOpen={!!calendarRoom}
          onClose={closeRoomCalendar}
          title={`Room ${calendarRoom.roomNumber} — Calendar (${
            monthNames[calendarMonthForRoom.getMonth()]
          } ${calendarMonthForRoom.getFullYear()})`}
          footer={<Button onClick={closeRoomCalendar}>Close</Button>}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-700 font-medium">
              {calendarRoom.roomNumber} —{" "}
              {state.roomTypes.find((rt) => rt.id === calendarRoom.roomTypeId)
                ?.name || "N/A"}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCalendarMonthForRoom(
                    new Date(
                      calendarMonthForRoom.getFullYear(),
                      calendarMonthForRoom.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCalendarMonthForRoom(
                    new Date(
                      calendarMonthForRoom.getFullYear(),
                      calendarMonthForRoom.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>

          {/* Build days for this modal month */}
          {(() => {
            const days = getDaysInMonth(calendarMonthForRoom);
            const reservationsForRoom = state.reservations.filter(
              (r) => r.roomId === calendarRoom.id && r.status !== "canceled"
            );
            const bookedMap: Record<string, Reservation[]> = {};
            reservationsForRoom.forEach((r) => {
              const start = new Date(r.checkIn);
              const end = new Date(r.checkOut);
              for (
                let d = new Date(start);
                d < end;
                d.setDate(d.getDate() + 1)
              ) {
                const key = d.toISOString().split("T")[0];
                if (!bookedMap[key]) bookedMap[key] = [];
                bookedMap[key].push(r);
              }
            });

            const isMaintenance = calendarRoom.status === "maintenance";

            return (
              <div>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {days.map((day) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const booked = !!bookedMap[dateStr];
                    const bg = isMaintenance
                      ? "bg-yellow-400"
                      : booked
                      ? "bg-blue-500"
                      : "bg-green-400";
                    const tooltip = booked
                      ? bookedMap[dateStr]
                          .map(
                            (r) =>
                              `${getCustomerName(r.customerId)} • ${
                                r.status
                              } • ${formatCurrency(r.totalAmount)}`
                          )
                          .join("\n")
                      : isMaintenance
                      ? "Maintenance"
                      : "Available";

                    return (
                      <div
                        key={dateStr}
                        className={`p-3 text-center rounded ${bg} text-white`}
                        title={tooltip}
                      >
                        <div className="font-semibold">{day.getDate()}</div>
                        <div className="text-[10px] opacity-90">
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded" /> Available
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" /> Booked
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded" />{" "}
                    Maintenance
                  </div>
                </div>

                {/* booked ranges text removed to keep calendar read-only and compact */}
              </div>
            );
          })()}
        </Modal>
      )}

      {selectedReservation && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedReservation(null);
          }}
          title="Reservation Details"
          footer={
            <Button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedReservation(null);
              }}
            >
              Close
            </Button>
          }
        >
          {(() => {
            const customer = state.customers.find(
              (c) => c.id === selectedReservation.customerId
            );
            const room = state.rooms.find(
              (r) => r.id === selectedReservation.roomId
            );
            const roomType = room
              ? state.roomTypes.find((rt) => rt.id === room.roomTypeId)
              : null;
            const channel = state.channels.find(
              (ch) => ch.id === selectedReservation.channelId
            );
            // Compute customer type
            const customerReservations = state.reservations.filter(
              (r) =>
                r.customerId === selectedReservation.customerId &&
                r.status !== "canceled"
            );
            const visitCount = customerReservations.length;
            const customerBills = state.bills.filter((b) =>
              customerReservations.some((r) => r.id === b.reservationId)
            );
            const hasExtras = customerBills.some((b) => {
              const relatedRes = customerReservations.find(
                (r) => r.id === b.reservationId
              );
              if (!relatedRes) return false;
              // VIP if billed base (amount before tax) exceeds reservation totalAmount
              // or if there are multiple line items indicating extras
              const extrasByAmount = b.amount > relatedRes.totalAmount;
              const extrasByLines =
                Array.isArray(b.lineItems) && b.lineItems.length > 1;
              return extrasByAmount || extrasByLines;
            });
            const customerType: "VIP" | "Regular" | "New" = hasExtras
              ? "VIP"
              : visitCount > 1
              ? "Regular"
              : "New";
            const typeStyles: Record<string, string> = {
              VIP: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900",
              Regular: "bg-green-100 text-green-800",
              New: "bg-blue-100 text-blue-800",
            };
            const statusColors = {
              confirmed: "bg-blue-100 text-blue-800",
              "checked-in": "bg-green-100 text-green-800",
              "checked-out": "bg-slate-100 text-slate-800",
              canceled: "bg-red-100 text-red-800",
            };

            return (
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                    Customer Information
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${typeStyles[customerType]}`}
                    >
                      <span>
                        {customerType === "VIP" ? "VIP" : customerType}
                      </span>
                      {customerType !== "New" && (
                        <span className="opacity-80">
                          • {visitCount} visit{visitCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Name</p>
                      <p className="text-base text-slate-900 mt-1">
                        {customer?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Email
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {customer?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Phone
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {customer?.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Nationality
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {customer?.nationality || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reservation Information */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                    Reservation Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Room Number
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {room?.roomNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Room Type
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {roomType?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Check-in Date
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {formatDate(selectedReservation.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Check-out Date
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {formatDate(selectedReservation.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Adults
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {selectedReservation.adults}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Children
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {selectedReservation.children}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                          statusColors[selectedReservation.status]
                        }`}
                      >
                        {selectedReservation.status.charAt(0).toUpperCase() +
                          selectedReservation.status.slice(1).replace("-", " ")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Channel
                      </p>
                      <p className="text-base text-slate-900 mt-1">
                        {channel?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Total Amount
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {formatCurrency(selectedReservation.totalAmount)}
                      </p>
                    </div>
                    {selectedReservation.notes && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-slate-500">
                          Notes
                        </p>
                        <p className="text-base text-slate-900 mt-1">
                          {selectedReservation.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
