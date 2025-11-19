import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import { Season } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check } from "lucide-react";

export const Seasonal: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Format date to show only month and day (MM-DD)
  const formatSeasonalDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };

  // Convert MM-DD to full date string for storage
  const monthDayToDate = (monthDay: string) => {
    if (!monthDay) return "";
    const currentYear = new Date().getFullYear();
    return `${currentYear}-${monthDay}`;
  };

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      startDate: formatSeasonalDate(season.startDate),
      endDate: formatSeasonalDate(season.endDate),
      isActive: season.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSeason(null);
    setFormData({ name: "", startDate: "", endDate: "", isActive: true });
    setShowModal(true);
  };

  const validateDate = (dateStr: string): boolean => {
    const regex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    return regex.test(dateStr);
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      alert("Please enter a season name");
      return;
    }
    if (!formData.startDate || !validateDate(formData.startDate)) {
      alert("Please enter a valid start date in MM-DD format (e.g., 06-01)");
      return;
    }
    if (!formData.endDate || !validateDate(formData.endDate)) {
      alert("Please enter a valid end date in MM-DD format (e.g., 08-31)");
      return;
    }

    const seasonData = {
      name: formData.name,
      startDate: monthDayToDate(formData.startDate),
      endDate: monthDayToDate(formData.endDate),
      isActive: formData.isActive,
    };

    if (editingSeason) {
      dispatch({
        type: "UPDATE_SEASON",
        payload: {
          ...editingSeason,
          ...seasonData,
        },
      });
    } else {
      dispatch({
        type: "ADD_SEASON",
        payload: {
          id: generateId(),
          ...seasonData,
        },
      });
    }
    setShowModal(false);
    setFormData({ name: "", startDate: "", endDate: "", isActive: true });
  };

  const handleDelete = (season: Season) => {
    if (window.confirm(`Are you sure you want to delete ${season.name}?`)) {
      dispatch({ type: "DELETE_SEASON", payload: season.id });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Season Name",
      render: (s: Season) => (
        <span className="font-semibold text-slate-900">{s.name}</span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date (Month-Day)",
      render: (s: Season) => (
        <span className="font-medium text-blue-600">
          {formatSeasonalDate(s.startDate)}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "End Date (Month-Day)",
      render: (s: Season) => (
        <span className="font-medium text-blue-600">
          {formatSeasonalDate(s.endDate)}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (s: Season) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            s.isActive
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {s.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (s: Season) => (
        <div className="flex gap-2">
          <Button
            aria-label="Edit season"
            title="Edit season"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(s)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            aria-label="Delete season"
            title="Delete season"
            size="sm"
            variant="danger"
            onClick={() => handleDelete(s)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/20 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-3 rounded-xl shadow-lg">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Seasonal Periods
              </h1>
              <p className="text-slate-600 mt-1 font-medium text-sm">
                Define recurring seasonal periods for pricing (year-independent)
              </p>
            </div>
          </div>
          <Button
            aria-label="Add season"
            title="Add season"
            onClick={handleAdd}
            className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Season
          </Button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6">
          {state.seasons.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
              <Plus className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold text-lg">
                No seasons defined yet
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Add your first seasonal period to get started
              </p>
            </div>
          ) : (
            <Table columns={columns} data={state.seasons} />
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSeason ? "Edit Seasonal Period" : "Add Seasonal Period"}
      >
        <div className="space-y-5">
          <Input
            label="Season Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Summer, Winter, Holiday Season"
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              📅 Enter dates in MM-DD format (e.g., 06-01 for June 1st)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              These dates will apply every year automatically
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Start Date (MM-DD)
            </label>
            <input
              type="text"
              value={formData.startDate}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and dash, max 5 characters (MM-DD)
                if (/^[\d-]*$/.test(value) && value.length <= 5) {
                  setFormData({ ...formData, startDate: value });
                }
              }}
              placeholder="MM-DD (e.g., 06-01)"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              End Date (MM-DD)
            </label>
            <input
              type="text"
              value={formData.endDate}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers and dash, max 5 characters (MM-DD)
                if (/^[\d-]*$/.test(value) && value.length <= 5) {
                  setFormData({ ...formData, endDate: value });
                }
              }}
              placeholder="MM-DD (e.g., 08-31)"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
              required
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Active (This season will be applied to pricing)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200">
          <Button
            aria-label="Cancel"
            title="Cancel"
            variant="secondary"
            onClick={() => setShowModal(false)}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            aria-label="Save"
            title="Save"
            onClick={handleSave}
            className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Check className="w-4 h-4" />
            Save Season
          </Button>
        </div>
      </Modal>
    </div>
  );
};
