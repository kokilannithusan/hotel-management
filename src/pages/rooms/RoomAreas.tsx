import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Trash2, Edit, Plus, X, Check } from "lucide-react";
import { generateId } from "../../utils/formatters";

export const RoomAreas: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [formData, setFormData] = useState({ roomNumber: "", size: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = "Room number is required";
    }

    if (!formData.size.trim()) {
      newErrors.size = "Room size is required";
    } else if (isNaN(Number(formData.size)) || Number(formData.size) <= 0) {
      newErrors.size = "Room size must be a valid positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    // Extract size from description if it exists (e.g., "250 sq ft")
    const sizeMatch = room.description?.match(/(\d+)/);
    setFormData({
      roomNumber: room.name || "",
      size: sizeMatch ? sizeMatch[1] : "",
    });
    setErrors({});
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({ roomNumber: "", size: "" });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (editingRoom) {
      dispatch({
        type: "UPDATE_ROOM_AREA",
        payload: {
          ...editingRoom,
          name: formData.roomNumber,
          description: `${formData.size} sq ft`,
        },
      });
    } else {
      dispatch({
        type: "ADD_ROOM_AREA",
        payload: {
          id: generateId(),
          name: formData.roomNumber,
          description: `${formData.size} sq ft`,
        },
      });
    }
    setShowModal(false);
  };

  const handleDeleteRoom = (roomId: string, roomNumber?: string) => {
    const label = roomNumber || roomId;
    if (window.confirm(`Are you sure you want to delete room ${label}?`)) {
      dispatch({ type: "DELETE_ROOM_AREA", payload: roomId });
    }
  };

  const columns = [
    { key: "name", header: "Room Number" },
    {
      key: "description",
      header: "Room Size (sq ft)",
      render: (room: any) => room.description || "",
    },
    {
      key: "actions",
      header: "Actions",
      render: (room: any) => (
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
            onClick={() => handleDeleteRoom(room.id, room.name)}
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
            Rooms
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            List of individual rooms with size (sq ft)
          </p>
        </div>
        <Button
          aria-label="Add new room area"
          title="Add new room area"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
          New Room Area
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.roomAreas} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoom ? "Edit Room Area" : "Add New Room Area"}
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
          <div>
            <Input
              label="Room Number"
              value={formData.roomNumber}
              onChange={(e) =>
                setFormData({ ...formData, roomNumber: e.target.value })
              }
              placeholder="e.g., 101, 102, 103"
              required
            />
            {errors.roomNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
            )}
          </div>
          <div>
            <Input
              label="Room Size (sq ft)"
              type="number"
              value={formData.size}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
              placeholder="e.g., 250"
              required
            />
            {errors.size && (
              <p className="text-red-500 text-sm mt-1">{errors.size}</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
