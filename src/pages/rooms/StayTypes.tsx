import React, { useState, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";

import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { generateId } from "../../utils/formatters";
import { Trash2, Plus } from "lucide-react";

const STORAGE_KEY = "hotel-stay-type-combinations";

export const StayTypes: React.FC = () => {
  const { state } = useHotel();
  // (stay type CRUD modal removed — this page focuses on combinations)

  // (stay type list removed from this page — this page focuses on combinations)
  // Local state for combinations (in-memory)
  type Combination = {
    id: string;
    roomTypeId: string;
    adults: number;
    children: number;
    mealPlanId: string;
    viewTypeId: string;
  };

  // Load from localStorage on mount
  const [combinations, setCombinations] = useState<Combination[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading combinations from localStorage:", error);
      return [];
    }
  });

  const [comboForm, setComboForm] = useState<Partial<Combination>>({
    adults: 1,
    children: 0,
  });

  // Save to localStorage whenever combinations change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combinations));
    } catch (error) {
      console.error("Error saving combinations to localStorage:", error);
    }
  }, [combinations]);

  const handleAddCombination = () => {
    if (!comboForm.roomTypeId) {
      alert("Please select a Room Type");
      return;
    }
    if (!comboForm.mealPlanId) {
      alert("Please select a Meal Plan");
      return;
    }
    if (!comboForm.viewTypeId) {
      alert("Please select a View Type");
      return;
    }

    const newCombo: Combination = {
      id: generateId(),
      roomTypeId: comboForm.roomTypeId as string,
      adults: comboForm.adults ?? 1,
      children: comboForm.children ?? 0,
      mealPlanId: comboForm.mealPlanId as string,
      viewTypeId: comboForm.viewTypeId as string,
    };

    setCombinations((s) => [newCombo, ...s]);
    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
      viewTypeId: "",
    });
  };

  const handleDeleteCombination = (id: string) => {
    if (!window.confirm("Delete this combination?")) return;
    setCombinations((s) => s.filter((c) => c.id !== id));
  };

  const comboColumns = [
    {
      key: "roomType",
      header: "Room Type",
      render: (c: Combination) =>
        state.roomTypes.find((rt) => rt.id === c.roomTypeId)?.name || "Unknown",
    },
    { key: "adults", header: "Adults", render: (c: Combination) => c.adults },
    {
      key: "children",
      header: "Children",
      render: (c: Combination) => c.children,
    },
    {
      key: "mealPlan",
      header: "Meal Plan",
      render: (c: Combination) =>
        state.mealPlans.find((m) => m.id === c.mealPlanId)?.name || "Unknown",
    },
    {
      key: "viewType",
      header: "View Type",
      render: (c: Combination) =>
        state.viewTypes.find((v) => v.id === c.viewTypeId)?.name || "Unknown",
    },
    {
      key: "actions",
      header: "Actions",
      render: (c: Combination) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteCombination(c.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          Stay Type Combinations
        </h1>
        <p className="text-gray-600 mt-1">
          Create and save stay-type + room configuration combinations
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Select
            label="Room Type"
            value={comboForm.roomTypeId || ""}
            onChange={(e) =>
              setComboForm({ ...comboForm, roomTypeId: e.target.value })
            }
            options={[
              { value: "", label: "Select Room Type" },
              ...state.roomTypes.map((rt) => ({
                value: rt.id,
                label: rt.name,
              })),
            ]}
          />

          <Input
            label="Adults"
            type="number"
            value={comboForm.adults}
            onChange={(e) =>
              setComboForm({
                ...comboForm,
                adults: parseInt(e.target.value) || 0,
              })
            }
            min={0}
          />

          <Input
            label="Children"
            type="number"
            value={comboForm.children}
            onChange={(e) =>
              setComboForm({
                ...comboForm,
                children: parseInt(e.target.value) || 0,
              })
            }
            min={0}
          />

          <Select
            label="Meal Plan"
            value={comboForm.mealPlanId || ""}
            onChange={(e) =>
              setComboForm({ ...comboForm, mealPlanId: e.target.value })
            }
            options={[
              { value: "", label: "Select Meal Plan" },
              ...state.mealPlans.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />

          <Select
            label="View Type"
            value={comboForm.viewTypeId || ""}
            onChange={(e) =>
              setComboForm({ ...comboForm, viewTypeId: e.target.value })
            }
            options={[
              { value: "", label: "Select View Type" },
              ...state.viewTypes.map((v) => ({ value: v.id, label: v.name })),
            ]}
          />

          <div className="md:col-span-3">
            <Button onClick={handleAddCombination} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add Combination
            </Button>
          </div>
        </div>
      </Card>

      {/* Saved Combinations Card */}
      <Card title="Saved Combinations">
        {combinations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No combinations saved yet. Use the form above to add combinations.
          </div>
        ) : (
          <Table columns={comboColumns} data={combinations} />
        )}
      </Card>

      {/* Existing Stay Types table removed — page focuses on combinations */}
    </div>
  );
};
