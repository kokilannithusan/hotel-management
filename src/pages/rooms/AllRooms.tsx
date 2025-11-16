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
  Sparkles,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
} from "lucide-react";

export const AllRooms: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [viewTypeFilter, setViewTypeFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [selectedRoomAmenities, setSelectedRoomAmenities] = useState<
    { id: string; name: string }[]
  >([]);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomTypeId: "",
    areaId: "",
    status: "available" as Room["status"],
    amenities: [] as string[],
  });

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

    // Price range filter
    let matchesPrice = true;
    if (priceRangeFilter !== "all" && roomType?.basePrice) {
      const price = roomType.basePrice;
      switch (priceRangeFilter) {
        case "0-100":
          matchesPrice = price >= 0 && price <= 100;
          break;
        case "100-200":
          matchesPrice = price > 100 && price <= 200;
          break;
        case "200-300":
          matchesPrice = price > 200 && price <= 300;
          break;
        case "300+":
          matchesPrice = price > 300;
          break;
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesRoomType &&
      matchesViewType &&
      matchesPrice
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
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: "",
      roomTypeId: "",
      areaId: "",
      status: "available",
      amenities: [],
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
        return amenity ? { id: amenity.id, name: amenity.name } : null;
      })
      .filter(Boolean) as { id: string; name: string }[];
    setSelectedRoomAmenities(roomAmenities);
    setShowAmenitiesModal(true);
  };

  // Amenity icon mapping
  const getAmenityIcon = (amenityName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      WiFi: <Wifi className="w-4 h-4" />,
      AC: <Wind className="w-4 h-4" />,
      TV: <Tv className="w-4 h-4" />,
      Minibar: <Coffee className="w-4 h-4" />,
      Safe: <Shield className="w-4 h-4" />,
      Balcony: <Home className="w-4 h-4" />,
      Jacuzzi: <Waves className="w-4 h-4" />,
      Kitchenette: <ChefHat className="w-4 h-4" />,
      "Work Desk": <Briefcase className="w-4 h-4" />,
      "Coffee Maker": <Coffee className="w-4 h-4" />,
      "Hair Dryer": <Droplets className="w-4 h-4" />,
      "Iron & Board": <Scissors className="w-4 h-4" />,
    };
    return iconMap[amenityName] || <ImageIcon className="w-4 h-4" />;
  };

  // Get room image URL (placeholder for now)
  const getRoomImage = (room: Room) => {
    // You can replace this with actual image URLs from your data
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
            value={priceRangeFilter}
            onChange={(e) => setPriceRangeFilter(e.target.value)}
            options={[
              { value: "all", label: "All Prices" },
              { value: "0-100", label: "$0 - $100" },
              { value: "100-200", label: "$100 - $200" },
              { value: "200-300", label: "$200 - $300" },
              { value: "300+", label: "$300+" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredRooms.map((room) => {
            const roomType = state.roomTypes.find(
              (rt) => rt.id === room.roomTypeId
            );
            const area = state.roomAreas.find((a) => a.id === room.areaId);
            const roomAmenities = room.amenities
              .map((id) => state.amenities.find((a) => a.id === id))
              .filter(Boolean);

            // Get housekeeping status for icon display
            const housekeeping = state.housekeeping.find(
              (h) => h.roomId === room.id
            );
            const housekeepingStatus = housekeeping?.status || "cleaned";

            // Get display status (map cleaned/to-clean to available)
            const displayStatus = getDisplayStatus(room.status);

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

            // Get housekeeping icon based on housekeeping status
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
                className={`${config.bg} ${config.border} border-2 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 premium-room-grid-card`}
              >
                {/* Room Image */}
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
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <div
                      className={`${config.badge} w-3 h-3 rounded-full shadow-lg`}
                    ></div>
                  </div>
                  {/* Room Number - Top Left Corner */}
                  <div className="absolute top-2 left-2">
                    <div className="bg-white/95 backdrop-blur-sm rounded px-2 py-1 shadow-md border border-white/20">
                      <h3 className="text-sm font-bold text-slate-900">
                        {room.roomNumber}
                      </h3>
                    </div>
                  </div>
                  {/* Room Type - Bottom Left Corner (Small) */}
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                      <p className="text-xs font-semibold text-white">
                        {roomType?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-3 space-y-2">
                  {/* Price Section - Compact */}
                  {roomType?.basePrice && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2 border border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-700">
                          Price
                        </p>
                        <p className="text-sm font-bold text-blue-900">
                          {formatCurrency(roomType.basePrice)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Status</span>
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
                      <span className="font-semibold text-slate-500">Area</span>
                      <span className="font-medium text-slate-700">
                        {area.name}
                      </span>
                    </div>
                  )}

                  {roomAmenities.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShowAmenities(room)}
                      className="w-full flex items-center justify-center gap-1 text-xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Amenities ({roomAmenities.length})</span>
                    </Button>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-slate-200">
                    <Button
                      aria-label="Edit room"
                      title="Edit room"
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(room)}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      aria-label="Delete room"
                      title="Delete room"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(room)}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 gap-2">
              {state.amenities.map((amenity) => (
                <label key={amenity.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="mr-2"
                  />
                  {amenity.name}
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
            <div className="grid grid-cols-2 gap-3">
              {selectedRoomAmenities.map((amenity) => (
                <div
                  key={amenity.id}
                  className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
                >
                  <span className="text-slate-700">
                    {getAmenityIcon(amenity.name)}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {amenity.name}
                  </span>
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
