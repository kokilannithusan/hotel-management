import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId, formatCurrency } from "../../utils/formatters";
import { Amenity } from "../../types/entities";
import {
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  Wifi,
  Tv,
  Coffee,
  Wind,
  Utensils,
  Waves,
  Dumbbell,
  ParkingCircle,
  Leaf,
  Music,
  Sofa,
  Bed,
  Bath,
  Zap,
  Microwave,
  Wine,
  UtensilsCrossed,
  Accessibility,
  Monitor,
  Lightbulb,
  Key,
  Shield,
  Flag,
  Waves as Jacuzzi,
  ChefHat,
  Shirt,
} from "lucide-react";

export const Amenities: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "", price: "" });

  // Map amenity names to icons
  const amenityIconMap: Record<string, React.ReactNode> = {
    wifi: <Wifi className="w-5 h-5 text-blue-500" />,
    tv: <Tv className="w-5 h-5 text-slate-600" />,
    ac: <Wind className="w-5 h-5 text-cyan-500" />,
    "air conditioning": <Wind className="w-5 h-5 text-cyan-500" />,
    "coffee maker": <Coffee className="w-5 h-5 text-amber-700" />,
    kitchen: <Utensils className="w-5 h-5 text-orange-500" />,
    kitchenette: <Utensils className="w-5 h-5 text-orange-500" />,
    pool: <Waves className="w-5 h-5 text-blue-400" />,
    gym: <Dumbbell className="w-5 h-5 text-red-500" />,
    parking: <ParkingCircle className="w-5 h-5 text-slate-600" />,
    garden: <Leaf className="w-5 h-5 text-green-500" />,
    "music system": <Music className="w-5 h-5 text-purple-500" />,
    sofa: <Sofa className="w-5 h-5 text-indigo-500" />,
    bed: <Bed className="w-5 h-5 text-pink-500" />,
    bathroom: <Bath className="w-5 h-5 text-teal-500" />,
    bathtub: <Bath className="w-5 h-5 text-teal-500" />,
    dryer: <Zap className="w-5 h-5 text-yellow-400" />,
    "hair dryer": <Zap className="w-5 h-5 text-yellow-400" />,
    microwave: <Microwave className="w-5 h-5 text-yellow-600" />,
    wine: <Wine className="w-5 h-5 text-red-600" />,
    dining: <UtensilsCrossed className="w-5 h-5 text-amber-600" />,
    "wheelchair accessible": (
      <Accessibility className="w-5 h-5 text-green-600" />
    ),
    accessible: <Accessibility className="w-5 h-5 text-green-600" />,
    desk: <Monitor className="w-5 h-5 text-slate-700" />,
    "work desk": <Monitor className="w-5 h-5 text-slate-700" />,
    workspace: <Monitor className="w-5 h-5 text-slate-700" />,
    lighting: <Lightbulb className="w-5 h-5 text-yellow-500" />,
    safe: <Key className="w-5 h-5 text-gray-700" />,
    security: <Shield className="w-5 h-5 text-blue-600" />,
    minibar: <Wine className="w-5 h-5 text-purple-600" />,
    balcony: <Flag className="w-5 h-5 text-orange-400" />,
    jacuzzi: <Jacuzzi className="w-5 h-5 text-cyan-400" />,
    "iron & board": <Shirt className="w-5 h-5 text-slate-500" />,
  };

  const getAmenityIcon = (name: string): React.ReactNode => {
    const val = (name || "").trim();
    const lowerName = val.toLowerCase();
    if (amenityIconMap[lowerName]) return amenityIconMap[lowerName];
    // If user provided an emoji or custom icon string, render it directly
    if (/[^a-z0-9\s\-&]/i.test(val))
      return <span className="text-lg">{val}</span>;
    return <span className="text-slate-400">●</span>;
  };

  const handleEdit = (amenity: Amenity) => {
    setEditingAmenity(amenity);
    setFormData({
      name: amenity.name,
      icon: amenity.icon || "",
      price: amenity.price !== undefined ? String(amenity.price) : "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingAmenity(null);
    setFormData({ name: "", icon: "", price: "" });
    setShowModal(true);
  };

  const handleSave = () => {
    // Simple validation
    if (!formData.name || !formData.name.trim()) {
      alert("Amenity name is required.");
      return;
    }

    const payload: Amenity = {
      ...(editingAmenity || { id: generateId() }),
      name: formData.name.trim(),
      icon: formData.icon?.trim() || undefined,
      price: formData.price ? Number(formData.price) : undefined,
    };

    if (editingAmenity) {
      dispatch({ type: "UPDATE_AMENITY", payload });
    } else {
      dispatch({ type: "ADD_AMENITY", payload });
    }
    setShowModal(false);
  };

  const handleDelete = (amenity: Amenity) => {
    if (window.confirm(`Are you sure you want to delete ${amenity.name}?`)) {
      dispatch({ type: "DELETE_AMENITY", payload: amenity.id });
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    {
      key: "icon",
      header: "Icon",
      render: (amenity: Amenity) => (
        <div className="flex items-center justify-start">
          {getAmenityIcon(
            amenity.icon && amenity.icon.length > 0
              ? amenity.icon
              : amenity.name
          )}
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (amenity: Amenity) => (
        <div className="text-sm text-slate-700">
          {amenity.price !== undefined ? formatCurrency(amenity.price) : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (amenity: Amenity) => (
        <div className="flex gap-2">
          <Button
            aria-label="Edit amenity"
            title="Edit amenity"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(amenity)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            aria-label="Delete amenity"
            title="Delete amenity"
            size="sm"
            variant="danger"
            onClick={() => handleDelete(amenity)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Amenities
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage room amenities and features
          </p>
        </div>
        <Button
          aria-label="Add amenity"
          title="Add amenity"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          <span className="ml-2">Add</span>
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.amenities} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAmenity ? "Edit Amenity" : "Add Amenity"}
        footer={
          <>
            <Button
              aria-label="Cancel"
              title="Cancel"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button aria-label="Save" title="Save" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Icon (optional)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="Icon name or emoji"
          />
          <Input
            label="Price (optional)"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value })
            }
            placeholder="0.00"
          />
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">Preview:</div>
            <div className="p-1 bg-slate-50 rounded border border-slate-200">
              {getAmenityIcon(
                formData.icon && formData.icon.length > 0
                  ? formData.icon
                  : formData.name
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
