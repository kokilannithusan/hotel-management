import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { generateId, formatCurrency } from "../../utils/formatters";
import { Room } from "../../types/entities";
import {
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
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

export const AllRooms: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [viewTypeFilter, setViewTypeFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [selectedRoomAmenities, setSelectedRoomAmenities] = useState<
    { id: string; name: string; price?: number }[]
  >([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(
    null
  );
  const [calendarRoom, setCalendarRoom] = useState<Room | null>(null);
  const [calendarMonthForRoom, setCalendarMonthForRoom] = useState<Date>(
    new Date()
  );
  const [showViewTypeModal, setShowViewTypeModal] = useState(false);
  const [selectedRoomForViewType, setSelectedRoomForViewType] =
    useState<Room | null>(null);
  const [pricingRows, setPricingRows] = useState<
    Array<{ currency: string; price: number }>
  >([{ currency: "", price: 0 }]);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomName: "",
    roomTypeId: "",
    areaId: "",
    status: "available" as Room["status"],
    amenities: [] as string[],
    floor: undefined as number | undefined,
    size: undefined as number | undefined,
    image: "" as string,
    viewTypeId: "" as string,
    roomTelephone: "" as string,
    maxAdults: undefined as number | undefined,
    maxChildren: undefined as number | undefined,
  });

  // Map room status to display status (cleaned/to-clean -> available)
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

  // Get all unique currencies from all rooms pricing
  // const getAllCurrencies = (): string[] => {
  //   const currencies = new Set<string>();
  //   filteredRooms.forEach((room) => {
  //     if (room.pricing) {
  //       room.pricing.forEach((p) => {
  //         if (p.currency) currencies.add(p.currency);
  //       });
  //     }
  //   });
  //   return Array.from(currencies).sort();
  // };

  // const uniqueCurrencies = getAllCurrencies();

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      roomName: room.roomName || "",
      roomTypeId: room.roomTypeId,
      areaId: room.areaId || "",
      status: room.status,
      amenities: room.amenities,
      floor: room.floor,
      size: room.size,
      image: room.image || "",
      viewTypeId: room.viewTypeId || "",
      roomTelephone: room.roomTelephone || "",
      maxAdults: room.maxAdults,
      maxChildren: room.maxChildren,
    });
    setPricingRows(
      room.pricing && room.pricing.length > 0
        ? room.pricing
        : [{ currency: "", price: 0 }]
    );
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    // Default to 'Standard' room type if present
    const defaultRoomType = state.roomTypes.find(
      (rt) => rt.name && rt.name.toLowerCase() === "standard"
    );
    setFormData({
      roomNumber: "",
      roomName: "",
      roomTypeId: defaultRoomType ? defaultRoomType.id : "",
      areaId: "",
      status: "available",
      amenities: defaultRoomType?.amenities || [],
      floor: undefined,
      size: undefined,
      image: "",
      viewTypeId: "",
      roomTelephone: "",
      maxAdults: undefined,
      maxChildren: undefined,
    });
    setPricingRows([{ currency: "", price: 0 }]);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingRoom) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: {
          ...editingRoom,
          ...formData,
          pricing: pricingRows.filter((p) => p.currency && p.price > 0),
        },
      });
    } else {
      dispatch({
        type: "ADD_ROOM",
        payload: {
          id: generateId(),
          ...formData,
          pricing: pricingRows.filter((p) => p.currency && p.price > 0),
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (room: Room) => {
    if (
      window.confirm(`Are you sure you want to delete room ${room.roomNumber}?`)
    ) {
      dispatch({ type: "DELETE_ROOM", payload: room.id });
    }
  };

  const toggleAmenity = (amenityId: string) => {
    if (formData.amenities.includes(amenityId)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter((id) => id !== amenityId),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityId],
      });
    }
  };

  const handleShowAmenities = (room: Room) => {
    const roomAmenities = room.amenities
      .map((id) => {
        const amenity = state.amenities.find((a) => a.id === id);
        return amenity
          ? { id: amenity.id, name: amenity.name, price: amenity.price }
          : null;
      })
      .filter(Boolean) as { id: string; name: string; price?: number }[];
    setSelectedRoomAmenities(roomAmenities);
    setShowAmenitiesModal(true);
  };

  // Amenity icon mapping
  const getAmenityIcon = (amenityName: string) => {
    // normalize to lowercase so name variations (WiFi / wifi) map correctly
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

  // Get room image URL (placeholder for now)
  const getRoomImage = (room: Room) => {
    // Use room's custom image if available
    if (room.image) {
      return room.image;
    }
    // Otherwise use default based on room type
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
    if (name.includes("city"))
      return "bg-gradient-to-r from-gray-400 to-slate-600";
    return "bg-gradient-to-r from-slate-400 to-slate-600";
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

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

  const closeRoomCalendar = () => setCalendarRoom(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            All Rooms
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage all hotel rooms and their details
          </p>
        </div>
        <Button aria-label="Add room" title="Add room" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search by room number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
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

        {/* Table view */}
        <div
          className="overflow-x-auto border rounded-lg shadow-sm"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 #f1f5f9" }}
        >
          <style>{`
            .custom-table::-webkit-scrollbar { height: 8px; }
            .custom-table::-webkit-scrollbar-track { background: #f1f5f9; }
            .custom-table::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            .custom-table::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>
          <div
            className="custom-table max-h-[65vh] overflow-auto"
            style={{ minWidth: "1200px" }}
          >
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    View Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Telephone
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Size (sq ft)
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Max Adults
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Max Children
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Area
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, idx) => {
                  const roomType = state.roomTypes.find(
                    (rt) => rt.id === room.roomTypeId
                  );
                  const area = state.roomAreas.find(
                    (a) => a.id === room.areaId
                  );
                  const viewType = room.viewTypeId
                    ? state.viewTypes.find((v) => v.id === room.viewTypeId)
                    : roomType?.viewTypeId
                    ? state.viewTypes.find((v) => v.id === roomType.viewTypeId)
                    : undefined;
                  const roomAmenities = room.amenities
                    .map((id) => state.amenities.find((a) => a.id === id))
                    .filter(Boolean) as any[];
                  const reservationsForRoom = state.reservations.filter(
                    (r) => r.roomId === room.id && r.status !== "canceled"
                  );
                  const displayStatus = getDisplayStatus(room.status);

                  const statusColors: Record<string, string> = {
                    available: "bg-green-100 text-green-800",
                    occupied: "bg-blue-100 text-blue-800",
                    maintenance: "bg-yellow-100 text-yellow-800",
                  };

                  return (
                    <tr
                      key={room.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {room.roomNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {room.roomName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              statusColors[displayStatus] ||
                              statusColors.available
                            }`}
                          >
                            {displayStatus.charAt(0).toUpperCase() +
                              displayStatus.slice(1)}
                          </span>
                          {reservationsForRoom.length > 0 && (
                            <button
                              onClick={() => setSelectedRoomDetails(room)}
                              className="text-xs underline text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                              title={`${reservationsForRoom.length} reservation(s)`}
                            >
                              ({reservationsForRoom.length})
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {roomType?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {viewType ? (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap inline-block ${getViewTypeColor(
                              viewType.name
                            )}`}
                          >
                            {viewType.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {room.roomTelephone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {room.size ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {room.maxAdults ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {room.maxChildren ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(room)}
                            className="flex items-center gap-1"
                            title="Edit room"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(room)}
                            className="flex items-center gap-1"
                            title="Delete room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No rooms found</p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? "Edit Room" : "Add Room"}
        size="4xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Row 1: Room Name, Room Number, Status */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Room Name"
              value={formData.roomName}
              onChange={(e) =>
                setFormData({ ...formData, roomName: e.target.value })
              }
              placeholder="e.g., Deluxe Room A"
            />
            <Input
              label="Room Number"
              value={formData.roomNumber}
              onChange={(e) =>
                setFormData({ ...formData, roomNumber: e.target.value })
              }
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as Room["status"],
                })
              }
              options={[
                { value: "available", label: "Available" },
                { value: "occupied", label: "Occupied" },
                { value: "maintenance", label: "Maintenance" },
                { value: "cleaned", label: "Cleaned" },
                { value: "to-clean", label: "To Clean" },
              ]}
            />
          </div>

          {/* Row 2: View Type, Room Type, Telephone */}
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="View Type"
              value={formData.viewTypeId}
              onChange={(e) =>
                setFormData({ ...formData, viewTypeId: e.target.value })
              }
              options={[
                { value: "", label: "None" },
                ...state.viewTypes.map((vt) => ({
                  value: vt.id,
                  label: vt.name,
                })),
              ]}
            />
            <Select
              label="Room Type"
              value={formData.roomTypeId}
              onChange={(e) =>
                setFormData({ ...formData, roomTypeId: e.target.value })
              }
              options={state.roomTypes.map((rt) => ({
                value: rt.id,
                label: rt.name,
              }))}
              required
            />
            <Input
              label="Room Telephone"
              value={formData.roomTelephone}
              onChange={(e) =>
                setFormData({ ...formData, roomTelephone: e.target.value })
              }
              placeholder="e.g., +1-234-567-8900"
            />
          </div>

          {/* Row 3: Size and Area */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Room Size (sq ft)"
              type="number"
              value={formData.size ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  size: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="e.g., 270"
            />
            <Select
              label="Area"
              value={formData.areaId}
              onChange={(e) =>
                setFormData({ ...formData, areaId: e.target.value })
              }
              options={[
                { value: "", label: "None" },
                ...state.roomAreas.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          </div>

          {/* Row 4: Max Adults, Max Children */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Maximum Number of Adults"
              type="number"
              value={formData.maxAdults ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAdults: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="e.g., 2"
              min={1}
            />
            <Input
              label="Maximum Number of Children"
              type="number"
              value={formData.maxChildren ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxChildren: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="e.g., 1"
              min={0}
            />
          </div>

          {/* Row 5: Pricing - Currency and Price */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Currency
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price
                </label>
              </div>
            </div>
            {pricingRows.map((row, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 items-end">
                <Select
                  label=""
                  value={row.currency || ""}
                  onChange={(e) => {
                    const updated = [...pricingRows];
                    updated[index].currency = e.target.value;
                    setPricingRows(updated);
                  }}
                  options={[
                    { value: "", label: "Select Currency" },
                    ...state.currencyRates.map((cr) => ({
                      value: cr.code,
                      label: `${cr.code} - ${cr.currency}`,
                    })),
                  ]}
                />
                <div className="flex gap-2">
                  <Input
                    label=""
                    type="number"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => {
                      const updated = [...pricingRows];
                      updated[index].price = parseFloat(e.target.value) || 0;
                      setPricingRows(updated);
                    }}
                    min={0}
                    placeholder="0.00"
                  />
                  {index === pricingRows.length - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPricingRows([
                          ...pricingRows,
                          { currency: "", price: 0 },
                        ])
                      }
                      className="h-10 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center flex-shrink-0"
                      title="Add another pricing row"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Image
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("bg-blue-50", "border-blue-500");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(
                  "bg-blue-50",
                  "border-blue-500"
                );
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove(
                  "bg-blue-50",
                  "border-blue-500"
                );
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  if (file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setFormData({
                          ...formData,
                          image: event.target.result as string,
                        });
                      }
                    };
                    reader.readAsDataURL(file);
                  } else {
                    alert("Please upload a valid image file");
                  }
                }
              }}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              {formData.image ? (
                <div className="space-y-3">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded"
                  />
                  <p className="text-sm text-slate-600">
                    Drag and drop to replace, or click to upload
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setFormData({
                              ...formData,
                              image: event.target.result as string,
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-sm font-medium"
                  >
                    Change Image
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg
                    className="w-12 h-12 mx-auto text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-700">
                    Drag and drop your image here
                  </p>
                  <p className="text-xs text-slate-500">or</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setFormData({
                              ...formData,
                              image: event.target.result as string,
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload-initial"
                  />
                  <label
                    htmlFor="image-upload-initial"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 text-sm font-medium"
                  >
                    Click to Upload
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Amenities Modal */}
      <Modal
        isOpen={showAmenitiesModal}
        onClose={() => setShowAmenitiesModal(false)}
        title="Room Amenities"
        footer={
          <Button
            variant="secondary"
            onClick={() => setShowAmenitiesModal(false)}
          >
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {selectedRoomAmenities.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {selectedRoomAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-700">
                      {getAmenityIcon(amenity.name)}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {amenity.name}
                    </span>
                  </div>
                  <div className="text-right">
                    {amenity.price !== undefined && amenity.price > 0 ? (
                      <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded">
                        {formatCurrency(amenity.price)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Included</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              No amenities available
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
