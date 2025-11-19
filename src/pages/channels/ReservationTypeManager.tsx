import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import { Edit, Trash2, Plus, X, Check } from "lucide-react";
import { useReservationTypes } from "../../context/ReservationTypeContext";

export interface CustomReservationType {
  id: string;
  name: string;
  code: string;
}

export const ReservationTypeManager: React.FC = () => {
  const { customTypes, setCustomTypes: onTypesChange } = useReservationTypes();
  const [isAdding, setIsAdding] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingType, setEditingType] = useState<CustomReservationType | null>(
    null
  );
  const [editName, setEditName] = useState("");

  const defaultReservationTypes = ["DIRECT", "WEB", "OTA", "TA"];

  const handleAddClick = () => {
    setIsAdding(true);
    setNewTypeName("");
  };

  const handleSaveNew = () => {
    if (!newTypeName.trim()) {
      alert("Name is required");
      return;
    }

    const generatedCode = newTypeName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 6);

    if (defaultReservationTypes.includes(generatedCode)) {
      alert("This code is reserved for default types");
      return;
    }

    if (customTypes.some((t) => t.code === generatedCode)) {
      alert("A type with this code already exists");
      return;
    }

    onTypesChange([
      ...customTypes,
      {
        id: generateId(),
        name: newTypeName.trim(),
        code: generatedCode,
      },
    ]);
    setIsAdding(false);
    setNewTypeName("");
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewTypeName("");
  };

  const handleEditClick = (type: CustomReservationType) => {
    setEditingType(type);
    setEditName(type.name);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingType) {
      alert("Name is required");
      return;
    }

    const generatedCode = editName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, 6);

    if (defaultReservationTypes.includes(generatedCode)) {
      alert("This code is reserved for default types");
      return;
    }

    if (
      customTypes.some(
        (t) => t.code === generatedCode && t.id !== editingType.id
      )
    ) {
      alert("A type with this code already exists");
      return;
    }

    onTypesChange(
      customTypes.map((t) =>
        t.id === editingType.id
          ? { ...t, name: editName.trim(), code: generatedCode }
          : t
      )
    );
    setEditingType(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setEditName("");
  };

  const handleDelete = (type: CustomReservationType) => {
    if (window.confirm(`Are you sure you want to delete "${type.name}"?`)) {
      onTypesChange(customTypes.filter((t) => t.id !== type.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/20 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-3 rounded-xl shadow-lg">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Reservation Type Registration
            </h1>
            <p className="text-slate-600 mt-1 font-medium text-sm">
              Create and manage custom reservation types
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Custom Reservation Types
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {customTypes.length} custom type
                {customTypes.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            {!isAdding && (
              <Button
                onClick={handleAddClick}
                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add Type
              </Button>
            )}
          </div>

          {/* Inline Add Form */}
          {isAdding && (
            <div className="mb-6 p-5 rounded-xl border-2 border-blue-300 bg-blue-50 shadow-sm">
              <div className="flex items-center gap-3">
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Enter type name (e.g., Corporate, Group Booking)"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNew();
                    if (e.key === "Escape") handleCancelAdd();
                  }}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNew}
                    className="gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelAdd}
                    className="gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Press Enter to save, Escape to cancel
              </p>
            </div>
          )}

          {/* Default Types Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Default Reservation Types (Read-only)
            </h3>
            <div className="flex gap-2 flex-wrap">
              {defaultReservationTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Custom Types List */}
          {customTypes.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
              <Plus className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No custom types yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add your first custom reservation type to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTypes.map((type) => (
                <div
                  key={type.id}
                  className="relative p-5 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {editingType?.id === type.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Type name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEdit}
                          className="flex-1 gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={handleCancelEdit}
                          className="flex-1 gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-base">
                            {type.name}
                          </h3>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {type.code}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleEditClick(type)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition-all"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
