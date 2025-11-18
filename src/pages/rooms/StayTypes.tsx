import React, { useState, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { generateId } from "../../utils/formatters";
import { Trash2, Plus, Edit } from "lucide-react";

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
    price?: number;
    currency?: string;
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
    price: 0,
    currency: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  // Initialize default currency when component mounts
  React.useEffect(() => {
    if (!selectedCurrency && state.currencyRates.length > 0) {
      setSelectedCurrency(state.currencyRates[0].id);
    }
  }, [state.currencyRates, selectedCurrency]);

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

    if (comboForm.price === undefined || comboForm.price === null) {
      alert("Please enter a price for this combination");
      return;
    }

    const newCombo: Combination = {
      id: generateId(),
      roomTypeId: comboForm.roomTypeId as string,
      adults: comboForm.adults ?? 1,
      children: comboForm.children ?? 0,
      mealPlanId: comboForm.mealPlanId as string,
      viewTypeId: comboForm.viewTypeId as string,
      price: comboForm.price ?? 0,
      currency: comboForm.currency || "",
    };

    setCombinations((s) => [newCombo, ...s]);
    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
      viewTypeId: "",
      price: 0,
      currency: "",
    });
    setShowModal(false);
  };

  const handleEditCombination = (id: string) => {
    const combo = combinations.find((c) => c.id === id);
    if (!combo) return;
    setComboForm({
      roomTypeId: combo.roomTypeId,
      adults: combo.adults,
      children: combo.children,
      mealPlanId: combo.mealPlanId,
      viewTypeId: combo.viewTypeId,
      price: combo.price ?? 0,
      currency: combo.currency || "",
    });
    setEditingId(id);
    setShowModal(true);
  };

  const handleUpdateCombination = () => {
    if (!editingId) return;
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
    if (comboForm.price === undefined || comboForm.price === null) {
      alert("Please enter a price for this combination");
      return;
    }

    setCombinations((s) =>
      s.map((c) =>
        c.id === editingId
          ? {
              ...c,
              roomTypeId: comboForm.roomTypeId as string,
              adults: comboForm.adults ?? 1,
              children: comboForm.children ?? 0,
              mealPlanId: comboForm.mealPlanId as string,
              viewTypeId: comboForm.viewTypeId as string,
              price: comboForm.price ?? 0,
              currency: comboForm.currency || "",
            }
          : c
      )
    );
    // reset
    setEditingId(null);
    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
      viewTypeId: "",
      price: 0,
      currency: "",
    });
    setShowModal(false);
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
      key: "price",
      header: "Price",
      render: (c: Combination) => {
        let convertedPrice = c.price ?? 0;
        let displayCurrency = c.currency || "USD";

        if (selectedCurrency) {
          const selectedRate = state.currencyRates.find(
            (cr) => cr.id === selectedCurrency
          );
          const baseCurrencyRate = state.currencyRates.find(
            (cr) => cr.code === (c.currency || "USD")
          );
          const baseRate = baseCurrencyRate?.rate || 1;

          if (selectedRate && baseRate) {
            convertedPrice = (c.price ?? 0) * (selectedRate.rate / baseRate);
            displayCurrency = selectedRate.code;
          }
        }

        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-700">
              {convertedPrice.toFixed(2)}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">
              {displayCurrency}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (c: Combination) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditCombination(c.id)}
          >
            <Edit className="w-4 h-4" />
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
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Stay Type Combinations
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Create and save stay-type + room configuration combinations
          </p>
        </div>
        <Button
          aria-label="Add new combination"
          title="Add new combination"
          onClick={() => {
            setEditingId(null);
            setComboForm({
              adults: 1,
              children: 0,
              roomTypeId: "",
              mealPlanId: "",
              viewTypeId: "",
              price: 0,
            });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Combination
        </Button>
      </div>

      {/* Saved Combinations Card */}
      <Card title="Saved Combinations">
        {combinations.length > 0 && (
          <div className="mb-4 flex justify-end items-center gap-2">
            <span className="text-sm text-gray-600">Display Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select currency</option>
              {state.currencyRates.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.code} - {cr.currency} ({cr.rate.toFixed(4)})
                </option>
              ))}
            </select>
          </div>
        )}
        {combinations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No combinations saved yet. Use the Add button above to create
            combinations.
          </div>
        ) : (
          <Table columns={comboColumns} data={combinations} />
        )}
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Combination" : "Add New Combination"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={
                editingId ? handleUpdateCombination : handleAddCombination
              }
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
            required
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
            required
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
            required
          />

          <Input
            label="Number of Adults"
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
            label="Number of Children"
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
            label="Currency"
            value={comboForm.currency || ""}
            onChange={(e) =>
              setComboForm({ ...comboForm, currency: e.target.value })
            }
            options={[
              { value: "", label: "Select Currency" },
              ...state.currencyRates.map((cr) => ({
                value: cr.code,
                label: `${cr.code} - ${cr.currency}`,
              })),
            ]}
          />

          <Input
            label="Price"
            type="number"
            step="0.01"
            value={comboForm.price}
            onChange={(e) =>
              setComboForm({
                ...comboForm,
                price: parseFloat(e.target.value) || 0,
              })
            }
            min={0}
            required
          />
        </div>
      </Modal>
    </div>
  );
};
