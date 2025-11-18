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
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [selectedRoomAmenities, setSelectedRoomAmenities] = useState<
    { id: string; name: string; price?: number }[]
  >([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomTypeId: "",
    areaId: "",
    status: "available" as Room["status"],
    amenities: [] as string[],
    floor: undefined as number | undefined,
    size: undefined as number | undefined,
    image: "" as string,
  });

  // Initialize default currency when component mounts
  React.useEffect(() => {
    if (!selectedCurrency && state.currencyRates.length > 0) {
      setSelectedCurrency(state.currencyRates[0].id);
    }
  }, [state.currencyRates, selectedCurrency]);

  // Map room status to display status (cleaned/to-clean -> available)
  const getDisplayStatus = (roomStatus: string): string => {
    if (roomStatus === "cleaned" || roomStatus === "to-clean") {
      return "available";
    }
    return roomStatus;
  };

  const filteredRooms = state.rooms.filter((room) => {
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

    const matchesFloor =
      floorFilter === "all" ||
      (room.floor !== undefined && String(room.floor) === floorFilter);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRoomType &&
      matchesViewType &&
      matchesFloor
    );
  });

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      areaId: room.areaId || "",
      status: room.status,
      amenities: room.amenities,
      floor: room.floor,
      size: room.size,
      image: room.image || "",
    });
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
      roomTypeId: defaultRoomType ? defaultRoomType.id : "",
      areaId: "",
      status: "available",
      amenities: defaultRoomType?.amenities || [],
      floor: undefined,
      size: undefined,
      image: "",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingRoom) {
      dispatch({
        type: "UPDATE_ROOM",
        payload: {
          ...editingRoom,
          ...formData,
        },
      });
    } else {
      dispatch({
        type: "ADD_ROOM",
        payload: {
          id: generateId(),
          ...formData,
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
          <Select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            options={[
              { value: "all", label: "All Floors" },
              ...Array.from(
                new Set(
                  state.rooms.map((r) => r.floor).filter((f) => f !== undefined)
                )
              ).map((f) => ({ value: String(f), label: `Floor ${f}` })),
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
          <div className="custom-table max-h-[65vh] overflow-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Area
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    View
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Persons
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room Type
                  </th>
                  <th className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700">
                        Price
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">Currency:</span>
                        <select
                          value={selectedCurrency}
                          onChange={(e) => setSelectedCurrency(e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select currency</option>
                          {state.currencyRates.map((cr) => (
                            <option key={cr.id} value={cr.id}>
                              {cr.code} ({cr.rate.toFixed(4)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
                  const viewType = roomType?.viewTypeId
                    ? state.viewTypes.find((v) => v.id === roomType.viewTypeId)
                    : undefined;
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              statusColors[displayStatus] ||
                              statusColors.available
                            }`}
                          >
                            {displayStatus.charAt(0).toUpperCase() +
                              displayStatus.slice(1)}
                          </span>
                          {reservationsForRoom.length > 0 && (
                            <button
                              onClick={() => handleShowAmenities(room)}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                              title={`${reservationsForRoom.length} reservation(s)`}
                            >
                              ({reservationsForRoom.length})
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {area?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {viewType ? (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold text-white ${getViewTypeColor(
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
                        {roomType?.capacity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {roomType?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {roomType && selectedCurrency
                          ? (() => {
                              const selectedRate = state.currencyRates.find(
                                (cr) => cr.id === selectedCurrency
                              );
                              const baseRate =
                                state.currencyRates.length > 0
                                  ? state.currencyRates[0].rate
                                  : 1;
                              const convertedPrice =
                                selectedRate && baseRate
                                  ? roomType.basePrice *
                                    (selectedRate.rate / baseRate)
                                  : roomType.basePrice;
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-blue-700">
                                    {convertedPrice.toFixed(2)}
                                  </span>
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">
                                    {selectedRate?.code}
                                  </span>
                                </div>
                              );
                            })()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            aria-label="Edit room"
                            title="Edit room"
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(room)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            aria-label="Delete room"
                            title="Delete room"
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(room)}
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
          <Input
            label="Room Number"
            value={formData.roomNumber}
            onChange={(e) =>
              setFormData({ ...formData, roomNumber: e.target.value })
            }
            required
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
            label="Floor (optional)"
            type="number"
            value={formData.floor ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                floor: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="e.g., 1"
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
          <Input
            label="Room Size (sq ft) (optional)"
            type="number"
            value={formData.size ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                size: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="e.g., 250"
          />
          <Input
            label="Image URL (optional)"
            value={formData.image}
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.value })
            }
            placeholder="e.g., https://example.com/room.jpg"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {state.amenities.map((amenity) => (
                <label key={amenity.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          amenities: [...formData.amenities, amenity.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          amenities: formData.amenities.filter(
                            (id) => id !== amenity.id
                          ),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="flex items-center gap-2">
                    {getAmenityIcon(amenity.name)}
                    {amenity.name}
                  </span>
                </label>
              ))}
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
