import React, { useState, useMemo } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  DollarSign,
  RefreshCw,
  Archive,
} from "lucide-react";
import { useAdditionalService } from "../../context/AdditionalServiceContext";
import { ServiceItemMaster, ServiceItemStatus } from "../../types/entities";

const ManageServiceItems: React.FC = () => {
  const {
    serviceItems,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    restoreServiceItem,
    getActiveServiceItems,
    getInactiveServiceItems,
  } = useAdditionalService();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ServiceItemStatus>(
    "All"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItemMaster | null>(
    null
  );

  const [formData, setFormData] = useState({
    serviceName: "",
    description: "",
    price: "",
    unitType: "one-time",
  });

  // Filter service items
  const filteredItems = useMemo(() => {
    return serviceItems.filter((item) => {
      const matchesSearch =
        item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [serviceItems, searchTerm, statusFilter]);

  const activeCount = getActiveServiceItems().length;
  const inactiveCount = getInactiveServiceItems().length;

  const handleAddService = () => {
    setShowAddModal(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addServiceItem({
      serviceName: formData.serviceName,
      category: "Both",
      description: formData.description,
      price: parseFloat(formData.price),
      unitType: formData.unitType,
      status: "Active",
      createdBy: "admin",
    });
    handleCloseAddModal();
  };

  const handleEdit = (item: ServiceItemMaster) => {
    setEditingItem(item);
    setFormData({
      serviceName: item.serviceName,
      description: item.description || "",
      price: item.price.toString(),
      unitType: item.unitType,
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    updateServiceItem(
      editingItem.id,
      {
        serviceName: formData.serviceName,
        category: editingItem.category,
        description: formData.description,
        price: parseFloat(formData.price),
        unitType: formData.unitType,
      },
      "admin"
    );
    handleCloseEditModal();
  };

  const handleDelete = (item: ServiceItemMaster) => {
    if (
      window.confirm(
        `Are you sure you want to deactivate "${item.serviceName}"?\\nThis will soft-delete the service.`
      )
    ) {
      deleteServiceItem(item.id, "admin");
    }
  };

  const handleRestore = (item: ServiceItemMaster) => {
    if (window.confirm(`Restore "${item.serviceName}" to active status?`)) {
      restoreServiceItem(item.id);
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({
      serviceName: "",
      description: "",
      price: "",
      unitType: "one-time",
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setFormData({
      serviceName: "",
      description: "",
      price: "",
      unitType: "one-time",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Service Items"
        description="Global service catalog for reservations and events"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Services</p>
              <p className="text-2xl font-bold mt-1">{serviceItems.length}</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Services</p>
              <p className="text-2xl font-bold mt-1">{activeCount}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Inactive Services</p>
              <p className="text-2xl font-bold mt-1">{inactiveCount}</p>
            </div>
            <Archive className="w-12 h-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by service name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Active">✅ Active</option>
              <option value="Inactive">❌ Inactive</option>
            </select>
          </div>
          <Button
            onClick={handleAddService}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>
      </Card>

      {/* Services Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Service Catalog
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {filteredItems.length} service
            {filteredItems.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Service Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider text-right">
                  Price (LKR)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  Unit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold">
                      {item.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Package className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {item.serviceName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 max-w-xs line-clamp-2">
                      {item.description}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-green-400">
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-md">
                      {item.unitType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        item.status === "Active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Edit service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {item.status === "Active" ? (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Deactivate service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(item)}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Restore service"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Package className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-slate-600 text-base font-medium">
                No services found
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your filters"
                  : "Add your first service to get started"}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Add New Service
              </h2>
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceName}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Airport Transfer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the service..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Unit Type *
                    </label>
                    <select
                      required
                      value={formData.unitType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="one-time">One-time</option>
                      <option value="per hour">Per Hour</option>
                      <option value="per day">Per Day</option>
                      <option value="per person">Per Person</option>
                      <option value="per session">Per Session</option>
                      <option value="per item">Per Item</option>
                      <option value="per km">Per KM</option>
                      <option value="per unit">Per Unit</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Service</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Edit Service
              </h2>
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceName}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Price (LKR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editingItem.priceHistory &&
                      editingItem.priceHistory.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Previous price: LKR{" "}
                          {editingItem.priceHistory[
                            editingItem.priceHistory.length - 1
                          ].price.toLocaleString()}
                        </p>
                      )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Unit Type *
                    </label>
                    <select
                      required
                      value={formData.unitType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="one-time">One-time</option>
                      <option value="per hour">Per Hour</option>
                      <option value="per day">Per Day</option>
                      <option value="per person">Per Person</option>
                      <option value="per session">Per Session</option>
                      <option value="per item">Per Item</option>
                      <option value="per km">Per KM</option>
                      <option value="per unit">Per Unit</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Service</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageServiceItems;

