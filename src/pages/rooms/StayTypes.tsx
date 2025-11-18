import React, { useState, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";

import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { generateId } from "../../utils/formatters";
import { Trash2, Edit2 } from "lucide-react";

const STORAGE_KEY = "hotel-stay-type-combinations";

// Guest type definitions matching ChannelPricingGrid
const guestTypes = [
  { code: "AO", name: "Adult Only", adults: 1, children: 0 },
  { code: "AC", name: "Adult + Child", adults: 1, children: 1 },
];

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

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Define function outside effects so it can be used by button
  const handleGenerateAllCombinations = (skipConfirm: boolean = false) => {
    console.log(
      "handleGenerateAllCombinations called with skipConfirm:",
      skipConfirm
    );
    console.log("  state.roomTypes.length:", state.roomTypes.length);
    console.log("  state.mealPlans.length:", state.mealPlans.length);

    if (state.roomTypes.length === 0) {
      if (!skipConfirm) {
        alert("Please add room types first");
      }
      return;
    }

    // Use mealPlans from state, filtered to only BB, RO, HB, FB
    const availableMealPlans =
      state.mealPlans && state.mealPlans.length > 0
        ? state.mealPlans.filter((mp) =>
            ["BB", "RO", "HB", "FB"].includes(mp.code)
          )
        : [
            {
              id: "mp-bb",
              name: "Bed & Breakfast",
              code: "BB",
              description: "Breakfast included",
              perPersonRate: 0,
              isActive: true,
            },
            {
              id: "mp-ro",
              name: "Room Only",
              code: "RO",
              description: "No meals",
              perPersonRate: 0,
              isActive: true,
            },
            {
              id: "mp-hb",
              name: "Half Board",
              code: "HB",
              description: "Breakfast & Dinner",
              perPersonRate: 0,
              isActive: true,
            },
            {
              id: "mp-fb",
              name: "Full Board",
              code: "FB",
              description: "All meals",
              perPersonRate: 0,
              isActive: true,
            },
          ];

    // Use setCombinations callback to get current state
    setCombinations((currentCombinations) => {
      console.log("  currentCombinations.length:", currentCombinations.length);

      const newCombinations: Combination[] = [];
      const totalPossible =
        state.roomTypes.length * guestTypes.length * availableMealPlans.length;

      // Generate all combinations: Room Type x Guest Type x Meal Plan
      state.roomTypes.forEach((roomType) => {
        guestTypes.forEach((guestType) => {
          availableMealPlans.forEach((mealPlan) => {
            // Check if combination already exists
            const exists = currentCombinations.some(
              (c) =>
                c.roomTypeId === roomType.id &&
                c.adults === guestType.adults &&
                c.children === guestType.children &&
                c.mealPlanId === mealPlan.id
            );

            if (!exists) {
              newCombinations.push({
                id: generateId(),
                roomTypeId: roomType.id,
                adults: guestType.adults,
                children: guestType.children,
                mealPlanId: mealPlan.id,
              });
            }
          });
        });
      });

      console.log("  newCombinations.length:", newCombinations.length);

      if (newCombinations.length === 0) {
        if (!skipConfirm) {
          alert(
            "✓ All combinations already exist!\n\nTotal combinations: " +
              totalPossible
          );
        }
        return currentCombinations;
      }

      // Skip confirmation if called on mount (skipConfirm = true)
      if (skipConfirm) {
        console.log(
          "StayTypes: Generated and saved",
          newCombinations.length,
          "combinations"
        );
        return [...newCombinations, ...currentCombinations];
      }

      const proceed = window.confirm(
        `Generate ${newCombinations.length} new stay type combinations?\n\n` +
          `Room Types: ${state.roomTypes.length}\n` +
          `Guest Types: ${guestTypes.length}\n` +
          `Meal Plans: ${availableMealPlans.length}\n\n` +
          `Total combinations will be: ${
            currentCombinations.length + newCombinations.length
          }`
      );

      if (proceed) {
        alert(
          `✓ Successfully added ${newCombinations.length} stay type combinations!`
        );
        return [...newCombinations, ...currentCombinations];
      }

      return currentCombinations;
    });
  };

  // Save to localStorage whenever combinations change
  useEffect(() => {
    try {
      console.log(
        "StayTypes: Saving combinations to localStorage:",
        combinations.length,
        "items"
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(combinations));
    } catch (error) {
      console.error("Error saving combinations to localStorage:", error);
    }
  }, [combinations]);

  // Auto-populate combinations on first load if empty
  useEffect(() => {
    console.log("===== StayTypes Auto-generation Effect =====");
    console.log("  combinations.length:", combinations.length);
    console.log("  state.roomTypes.length:", state.roomTypes.length);
    console.log(
      "  state.roomTypes:",
      state.roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))
    );
    console.log("  state.mealPlans.length:", state.mealPlans.length);
    console.log(
      "  state.mealPlans:",
      state.mealPlans.map((mp) => ({ id: mp.id, code: mp.code }))
    );

    // FORCE generation on mount regardless
    if (state.roomTypes.length > 0 && state.mealPlans.length > 0) {
      console.log("===== Conditions MET - Generating combinations =====");
      handleGenerateAllCombinations(true);
    } else {
      console.log("===== Conditions NOT met ===== ");
      console.log("  roomTypes?", state.roomTypes.length > 0);
      console.log("  mealPlans?", state.mealPlans.length > 0);
    }
  }, []); // Run ONLY once on mount

  const handleAddCombination = () => {
    if (!comboForm.roomTypeId) {
      alert("Please select a Room Type");
      return;
    }
    if (!comboForm.mealPlanId) {
      alert("Please select a Meal Plan");
      return;
    }

    if (isEditing && editingId) {
      // Update existing combination
      setCombinations((s) =>
        s.map((c) =>
          c.id === editingId
            ? {
                ...c,
                roomTypeId: comboForm.roomTypeId as string,
                adults: comboForm.adults ?? 1,
                children: comboForm.children ?? 0,
                mealPlanId: comboForm.mealPlanId as string,
              }
            : c
        )
      );
      setIsEditing(false);
      setEditingId(null);
    } else {
      // Add new combination
      const newCombo: Combination = {
        id: generateId(),
        roomTypeId: comboForm.roomTypeId as string,
        adults: comboForm.adults ?? 1,
        children: comboForm.children ?? 0,
        mealPlanId: comboForm.mealPlanId as string,
      };
      setCombinations((s) => [newCombo, ...s]);
    }

    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
    });
  };

  const handleEditCombination = (combo: Combination) => {
    setComboForm({
      roomTypeId: combo.roomTypeId,
      adults: combo.adults,
      children: combo.children,
      mealPlanId: combo.mealPlanId,
    });
    setIsEditing(true);
    setEditingId(combo.id);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
    });
  };

  const handleDeleteCombination = (id: string) => {
    if (!window.confirm("Delete this combination?")) return;
    setCombinations((s) => s.filter((c) => c.id !== id));
  };

  const handleClearAllCombinations = () => {
    if (!window.confirm("Delete all combinations? This cannot be undone."))
      return;
    setCombinations([]);
  };

  const comboColumns = [
    {
      key: "stayTypeName",
      header: "Stay Type Name",
      render: (c: Combination) => {
        const roomType = state.roomTypes.find((rt) => rt.id === c.roomTypeId);
        const mealPlan = state.mealPlans.find((m) => m.id === c.mealPlanId);
        const guestType =
          c.adults > 0 && c.children > 0
            ? "Adult + Child"
            : c.adults > 0
            ? "Adult Only"
            : "Unknown";

        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">
              {roomType?.name || "Unknown"}
            </span>
            <span className="text-xs text-slate-600">{guestType}</span>
            <span className="text-xs text-emerald-700 font-semibold">
              {mealPlan?.code || "Unknown"}
            </span>
          </div>
        );
      },
    },
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
      key: "actions",
      header: "Actions",
      render: (c: Combination) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleEditCombination(c)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
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
      <div className="mb-6 pb-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Stay Type Combinations
          </h1>
          <p className="text-gray-600 mt-1">
            Create and save stay-type + room configuration combinations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerateAllCombinations(false)}
            variant="primary"
            size="sm"
          >
            Generate All Types
          </Button>
          {combinations.length > 0 && (
            <Button
              onClick={handleClearAllCombinations}
              variant="danger"
              size="sm"
            >
              Clear All
            </Button>
          )}
        </div>
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
              ...state.mealPlans
                .filter((m) => ["BB", "RO", "HB", "FB"].includes(m.code))
                .map((m) => ({ value: m.id, label: m.name })),
            ]}
          />

          <div className="md:col-span-3 flex justify-end gap-2">
            {isEditing && (
              <Button onClick={handleCancelEdit} size="sm" variant="secondary">
                Cancel
              </Button>
            )}
            <Button onClick={handleAddCombination} size="sm">
              {isEditing ? "Update Combination" : "Add Combination"}
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
