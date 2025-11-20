import React, { useState, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
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
    pricing: Array<{ currency: string; price: number }>;
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
    pricing: [],
  });

  const [pricingRows, setPricingRows] = useState<
    Array<{ currency: string; price: number }>
  >([{ currency: "", price: 0 }]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<
    Array<{ currency: string; price: number }>
  >([]);
  const [editingPricingComboId, setEditingPricingComboId] = useState<
    string | null
  >(null);
  const [isPricingEditMode, setIsPricingEditMode] = useState(false);

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

    const validPricing = pricingRows.filter((p) => p.currency && p.price > 0);
    if (validPricing.length === 0) {
      alert("Please add at least one currency and price for this combination");
      return;
    }

    const newCombo: Combination = {
      id: generateId(),
      roomTypeId: comboForm.roomTypeId as string,
      adults: comboForm.adults ?? 1,
      children: comboForm.children ?? 0,
      mealPlanId: comboForm.mealPlanId as string,
      viewTypeId: comboForm.viewTypeId as string,
      pricing: validPricing,
    };

    setCombinations((s) => [newCombo, ...s]);
    setComboForm({
      adults: 1,
      children: 0,
      roomTypeId: "",
      mealPlanId: "",
      viewTypeId: "",
    });
    setPricingRows([{ currency: "", price: 0 }]);
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
    });
    setPricingRows(
      combo.pricing && combo.pricing.length > 0
        ? combo.pricing
        : [{ currency: "", price: 0 }]
    );
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

    const validPricing = pricingRows.filter((p) => p.currency && p.price > 0);
    if (validPricing.length === 0) {
      alert("Please add at least one currency and price for this combination");
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
              pricing: validPricing,
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
    });
    setPricingRows([{ currency: "", price: 0 }]);
    setShowModal(false);
  };

  const handleDeleteCombination = (id: string) => {
    if (!window.confirm("Delete this combination?")) return;
    setCombinations((s) => s.filter((c) => c.id !== id));
  };

  // Commented out - no longer needed with single Price column
  // const getAllCurrencies = (): string[] => {
  //   const currencies = new Set<string>();
  //   combinations.forEach((combo) => {
  //     if (combo.pricing && Array.isArray(combo.pricing)) {
  //       combo.pricing.forEach((p) => {
  //         if (p.currency) currencies.add(p.currency);
  //       });
  //     }
  //   });
  //   return Array.from(currencies).sort();
  // };

  // const uniqueCurrencies = getAllCurrencies();

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
            });
            setPricingRows([{ currency: "", price: 0 }]);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Combination
        </Button>
      </div>

      {/* Saved Combinations Card */}
      <Card title="Saved Combinations">
        {combinations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No combinations saved yet. Use the Add button above to create
            combinations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Room Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Adults
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Children
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Meal Plan
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    View Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combo, idx) => (
                  <tr
                    key={combo.id}
                    className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-700">
                      {state.roomTypes.find((rt) => rt.id === combo.roomTypeId)
                        ?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{combo.adults}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {combo.children}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {state.mealPlans.find((m) => m.id === combo.mealPlanId)
                        ?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {state.viewTypes.find((v) => v.id === combo.viewTypeId)
                        ?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {combo.pricing &&
                      Array.isArray(combo.pricing) &&
                      combo.pricing.length > 0 ? (
                        combo.pricing.length === 1 ? (
                          <span className="font-semibold">
                            {combo.pricing[0].currency}{" "}
                            {combo.pricing[0].price.toFixed(2)}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPricing([...combo.pricing]);
                              setEditingPricingComboId(combo.id);
                              setIsPricingEditMode(false);
                              setShowPricingModal(true);
                            }}
                          >
                            View Pricing ({combo.pricing.length})
                          </Button>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCombination(combo.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteCombination(combo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "Edit Combination" : "Add New Combination"}
        size="3xl"
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
          {/* Row 1: Room Type, View Type, Meal Plan */}
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Row 2: Adults and Children */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Row 3: Currency and Price with Add Button */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 items-start">
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
              <div className="h-8"></div>
            </div>
            {pricingRows.map((row, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-end">
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
                <div className="flex gap-2 justify-end">
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
                  {pricingRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPricingRows(
                          pricingRows.filter((_, i) => i !== index)
                        );
                      }}
                      className="h-10 px-3 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center flex-shrink-0"
                      title="Delete this pricing row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Pricing Details Modal */}
      <Modal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setEditingPricingComboId(null);
          setIsPricingEditMode(false);
        }}
        title={isPricingEditMode ? "Edit Pricing" : "Pricing Details"}
        size="lg"
        footer={
          isPricingEditMode ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  // Reload original pricing on cancel
                  const combo = combinations.find(
                    (c) => c.id === editingPricingComboId
                  );
                  if (combo) {
                    setSelectedPricing([...combo.pricing]);
                  }
                  setIsPricingEditMode(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingPricingComboId) return;
                  const validPricing = selectedPricing.filter(
                    (p) => p.currency && p.price > 0
                  );
                  if (validPricing.length === 0) {
                    alert(
                      "Please add at least one currency and price for this combination"
                    );
                    return;
                  }
                  setCombinations((s) =>
                    s.map((c) =>
                      c.id === editingPricingComboId
                        ? { ...c, pricing: validPricing }
                        : c
                    )
                  );
                  setIsPricingEditMode(false);
                  setShowPricingModal(false);
                  setEditingPricingComboId(null);
                }}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setShowPricingModal(false);
                setEditingPricingComboId(null);
              }}
            >
              Close
            </Button>
          )
        }
      >
        <div className="space-y-4">
          {!isPricingEditMode ? (
            // View Mode - Read-only table
            <>
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPricingEditMode(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Pricing
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Currency
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPricing.map((entry, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-700 font-medium">
                          {entry.currency}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">
                          {entry.price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            // Edit Mode - Editable inputs
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 items-start">
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
                <div className="h-8"></div>
              </div>
              {selectedPricing.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-4 items-end">
                  <Select
                    label=""
                    value={entry.currency || ""}
                    onChange={(e) => {
                      const updated = [...selectedPricing];
                      updated[idx].currency = e.target.value;
                      setSelectedPricing(updated);
                    }}
                    options={[
                      { value: "", label: "Select Currency" },
                      ...state.currencyRates.map((cr) => ({
                        value: cr.code,
                        label: `${cr.code} - ${cr.currency}`,
                      })),
                    ]}
                  />
                  <Input
                    label=""
                    type="number"
                    step="0.01"
                    value={entry.price}
                    onChange={(e) => {
                      const updated = [...selectedPricing];
                      updated[idx].price = parseFloat(e.target.value) || 0;
                      setSelectedPricing(updated);
                    }}
                    min={0}
                    placeholder="0.00"
                  />
                  <div className="flex gap-2 justify-end">
                    {idx === selectedPricing.length - 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPricing([
                            ...selectedPricing,
                            { currency: "", price: 0 },
                          ])
                        }
                        className="h-10 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center flex-shrink-0"
                        title="Add another pricing row"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    {selectedPricing.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPricing(
                            selectedPricing.filter((_, i) => i !== idx)
                          );
                        }}
                        className="h-10 px-3 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center flex-shrink-0"
                        title="Delete this pricing row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
