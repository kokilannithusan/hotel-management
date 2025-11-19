import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import { MealPlan as MealPlanEntity } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check } from "lucide-react";

export const MealPlan: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlanEntity | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    perPersonRate: 0,
    perRoomRate: 0,
    isActive: true,
  });

  const handleEdit = (mealPlan: MealPlanEntity) => {
    setEditingMealPlan(mealPlan);
    setFormData({
      name: mealPlan.name,
      code: mealPlan.code,
      description: mealPlan.description,
      perPersonRate: mealPlan.perPersonRate,
      perRoomRate: mealPlan.perRoomRate || 0,
      isActive: mealPlan.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMealPlan(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      perPersonRate: 0,
      perRoomRate: 0,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingMealPlan) {
      dispatch({
        type: "UPDATE_MEAL_PLAN",
        payload: {
          ...editingMealPlan,
          ...formData,
          perRoomRate: formData.perRoomRate || undefined,
        },
      });
    } else {
      dispatch({
        type: "ADD_MEAL_PLAN",
        payload: {
          id: generateId(),
          ...formData,
          perRoomRate: formData.perRoomRate || undefined,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (mealPlan: MealPlanEntity) => {
    if (window.confirm(`Are you sure you want to delete ${mealPlan.name}?`)) {
      dispatch({ type: "DELETE_MEAL_PLAN", payload: mealPlan.id });
    }
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "description", header: "Description" },
    {
      key: "actions",
      header: "Actions",
      render: (mp: MealPlanEntity) => (
        <div className="flex gap-2">
          <Button
            aria-label="Edit meal plan"
            title="Edit meal plan"
            size="sm"
            variant="outline"
            onClick={() => handleEdit(mp)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            aria-label="Delete meal plan"
            title="Delete meal plan"
            size="sm"
            variant="danger"
            onClick={() => handleDelete(mp)}
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
            Meal Plans
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage meal plan options and pricing
          </p>
        </div>
        <Button
          aria-label="Add meal plan"
          title="Add meal plan"
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.mealPlans} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMealPlan ? "Edit Meal Plan" : "Add Meal Plan"}
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
            label="Code"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </div>
      </Modal>
    </div>
  );
};
