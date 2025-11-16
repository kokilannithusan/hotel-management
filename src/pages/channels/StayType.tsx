import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import { StayType as StayTypeEntity } from "../../types/entities";
import {
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  Clock,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";

export const StayType: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingStayType, setEditingStayType] = useState<StayTypeEntity | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    hours: 24,
    rateMultiplier: 1.0,
    description: "",
  });

  const handleEdit = (stayType: StayTypeEntity) => {
    setEditingStayType(stayType);
    setFormData({
      name: stayType.name,
      hours: stayType.hours || 24,
      rateMultiplier: stayType.rateMultiplier,
      description: stayType.description || "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingStayType(null);
    setFormData({ name: "", hours: 24, rateMultiplier: 1.0, description: "" });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.rateMultiplier <= 0) {
      alert("Please fill in all required fields with valid values");
      return;
    }

    if (editingStayType) {
      dispatch({
        type: "UPDATE_STAY_TYPE",
        payload: { ...editingStayType, ...formData },
      });
    } else {
      dispatch({
        type: "ADD_STAY_TYPE",
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (stayType: StayTypeEntity) => {
    if (window.confirm(`Are you sure you want to delete "${stayType.name}"?`)) {
      dispatch({ type: "DELETE_STAY_TYPE", payload: stayType.id });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Stay Type Name",
      render: (stayType: StayTypeEntity) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-amber-600" />
          <span className="font-semibold text-gray-900">{stayType.name}</span>
        </div>
      ),
    },
    {
      key: "hours",
      header: "Duration",
      render: (stayType: StayTypeEntity) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="text-gray-700">
            {stayType.hours ? `${stayType.hours} hours` : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "rateMultiplier",
      header: "Rate Multiplier",
      render: (stayType: StayTypeEntity) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-medium text-gray-900">
            {stayType.rateMultiplier.toFixed(2)}x
          </span>
          <span className="text-xs text-gray-500">
            ({(stayType.rateMultiplier * 100).toFixed(0)}%)
          </span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (stayType: StayTypeEntity) => (
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 text-sm">
            {stayType.description || "No description"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (stayType: StayTypeEntity) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(stayType)}
            className="flex items-center space-x-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(stayType)}
            className="flex items-center space-x-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent">
            Stay Types
          </h1>
          <p className="text-gray-600 mt-1">
            Manage different stay duration types and their pricing multipliers
          </p>
        </div>
        <Button onClick={handleAdd} className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Stay Type</span>
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Stay Types
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {state.stayTypes.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">
                Average Duration
              </p>
              <p className="text-2xl font-bold text-green-900">
                {state.stayTypes.length > 0
                  ? Math.round(
                      state.stayTypes.reduce(
                        (sum, st) => sum + (st.hours || 24),
                        0
                      ) / state.stayTypes.length
                    )
                  : 0}
                h
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">
                Avg Rate Multiplier
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {state.stayTypes.length > 0
                  ? (
                      state.stayTypes.reduce(
                        (sum, st) => sum + st.rateMultiplier,
                        0
                      ) / state.stayTypes.length
                    ).toFixed(2)
                  : "0.00"}
                x
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stay Types Table */}
      <Card title="Stay Types List" className="hover-lift">
        <Table
          columns={columns}
          data={state.stayTypes}
          emptyMessage="No stay types found. Add your first stay type to get started."
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStayType ? "Edit Stay Type" : "Add Stay Type"}
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">About Stay Types</p>
                <p>
                  Stay types define different booking durations and their
                  pricing. The rate multiplier is applied to the base room
                  price. For example, a multiplier of 0.5 means 50% of the base
                  rate.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Stay Type Name"
            placeholder="e.g., Overnight, Day Use, Extended Stay"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Duration (Hours)"
            type="number"
            placeholder="e.g., 24"
            value={formData.hours}
            onChange={(e) =>
              setFormData({
                ...formData,
                hours: parseInt(e.target.value) || 24,
              })
            }
            min={1}
            required
          />

          <div>
            <Input
              label="Rate Multiplier"
              type="number"
              step="0.1"
              placeholder="e.g., 1.0"
              value={formData.rateMultiplier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rateMultiplier: parseFloat(e.target.value) || 1.0,
                })
              }
              min={0.1}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current: {(formData.rateMultiplier * 100).toFixed(0)}% of base
              price
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="e.g., Standard overnight stay (24 hours)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Examples Section */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Common Examples:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                • <span className="font-medium">Overnight</span>: 24h, 1.0x
                multiplier
              </p>
              <p>
                • <span className="font-medium">Day Use</span>: 6h, 0.5x
                multiplier
              </p>
              <p>
                • <span className="font-medium">Extended Stay</span>: 48h, 1.8x
                multiplier
              </p>
              <p>
                • <span className="font-medium">Hourly</span>: 3h, 0.3x
                multiplier
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            {editingStayType ? "Update" : "Add"} Stay Type
          </Button>
        </div>
      </Modal>
    </div>
  );
};
