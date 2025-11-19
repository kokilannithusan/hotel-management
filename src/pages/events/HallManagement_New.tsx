import React, { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Mic,
  Snowflake,
  Monitor,
  Music,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { useHotel } from "../../context/HotelContext";
import { Hall, HallStatus } from "../../types/entities";

interface HallFormProps {
  hall?: Hall;
  onClose: () => void;
  onSuccess: () => void;
}

const HallForm: React.FC<HallFormProps> = ({ hall, onClose, onSuccess }) => {
  const { createHall, updateHall } = useHotel();
  const [formData, setFormData] = useState({
    name: hall?.name || "",
    capacity: hall?.capacity || 0,
    location: hall?.location || "",
    pricePerHour: hall?.pricePerHour || 0,
    pricePerDay: hall?.pricePerDay || 0,
    squareFootage: hall?.squareFootage || 0,
    setupTime: hall?.setupTime || 2,
    cleanupTime: hall?.cleanupTime || 1,
    description: hall?.description || "",
    status: hall?.status || ("available" as HallStatus),
    facilities: hall?.facilities || [],
    availableFacilities: {
      airConditioning: hall?.availableFacilities?.airConditioning || false,
      projector: hall?.availableFacilities?.projector || false,
      soundSystem: hall?.availableFacilities?.soundSystem || false,
      wifi: hall?.availableFacilities?.wifi || false,
      parking: hall?.availableFacilities?.parking || false,
      catering: hall?.availableFacilities?.catering || false,
      stage: hall?.availableFacilities?.stage || false,
      danceFloor: hall?.availableFacilities?.danceFloor || false,
      bar: hall?.availableFacilities?.bar || false,
      kitchen: hall?.availableFacilities?.kitchen || false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      formData.capacity <= 0 ||
      formData.pricePerHour <= 0
    ) {
      alert("Please fill in all required fields with valid values");
      return;
    }

    // Generate facilities array based on selected checkboxes
    const facilitiesList = [];
    if (formData.availableFacilities.airConditioning)
      facilitiesList.push("Air Conditioning");
    if (formData.availableFacilities.projector)
      facilitiesList.push("Projector");
    if (formData.availableFacilities.soundSystem)
      facilitiesList.push("Sound System");
    if (formData.availableFacilities.wifi) facilitiesList.push("WiFi");
    if (formData.availableFacilities.parking) facilitiesList.push("Parking");
    if (formData.availableFacilities.catering)
      facilitiesList.push("Catering Kitchen");
    if (formData.availableFacilities.stage) facilitiesList.push("Stage");
    if (formData.availableFacilities.danceFloor)
      facilitiesList.push("Dance Floor");
    if (formData.availableFacilities.bar) facilitiesList.push("Bar Area");
    if (formData.availableFacilities.kitchen)
      facilitiesList.push("Full Kitchen");

    const hallData: Omit<Hall, "id" | "createdAt" | "updatedAt"> = {
      ...formData,
      facilities: facilitiesList,
    };

    try {
      if (hall) {
        // Update existing hall
        updateHall({ ...hall, ...hallData });
        alert("Hall updated successfully!");
      } else {
        // Create new hall
        createHall(hallData);
        alert("Hall created successfully!");
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save hall:", error);
      alert("Failed to save hall. Please try again.");
    }
  };

  const facilityOptions = [
    { key: "airConditioning", label: "Air Conditioning", icon: Snowflake },
    { key: "projector", label: "Projector", icon: Monitor },
    { key: "soundSystem", label: "Sound System", icon: Mic },
    { key: "wifi", label: "WiFi Internet", icon: Wifi },
    { key: "parking", label: "Parking Available", icon: Car },
    { key: "catering", label: "Catering Kitchen", icon: Utensils },
    { key: "stage", label: "Stage", icon: Building2 },
    { key: "danceFloor", label: "Dance Floor", icon: Music },
    { key: "bar", label: "Bar Area", icon: Building2 },
    { key: "kitchen", label: "Full Kitchen", icon: Utensils },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hall Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Grand Ballroom"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capacity (People) *
            </label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: Number(e.target.value) })
              }
              placeholder="0"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location *
          </label>
          <Input
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="e.g., Ground Floor, Building A"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed description of the hall..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price per Hour ($) *
            </label>
            <Input
              type="number"
              value={formData.pricePerHour}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerHour: Number(e.target.value),
                })
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price per Day ($) *
            </label>
            <Input
              type="number"
              value={formData.pricePerDay}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerDay: Number(e.target.value),
                })
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Square Footage
            </label>
            <Input
              type="number"
              value={formData.squareFootage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  squareFootage: Number(e.target.value),
                })
              }
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Setup Time (Hours)
            </label>
            <Input
              type="number"
              value={formData.setupTime}
              onChange={(e) =>
                setFormData({ ...formData, setupTime: Number(e.target.value) })
              }
              placeholder="2"
              min="0"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cleanup Time (Hours)
            </label>
            <Input
              type="number"
              value={formData.cleanupTime}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cleanupTime: Number(e.target.value),
                })
              }
              placeholder="1"
              min="0"
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as HallStatus,
                })
              }
              options={[
                { value: "available", label: "Available" },
                { value: "reserved", label: "Reserved" },
                { value: "maintenance", label: "Under Maintenance" },
              ]}
            />
          </div>
        </div>

        {/* Facilities Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Facilities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {facilityOptions.map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.availableFacilities[
                    key as keyof typeof formData.availableFacilities
                  ]
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    formData.availableFacilities[
                      key as keyof typeof formData.availableFacilities
                    ]
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availableFacilities: {
                        ...formData.availableFacilities,
                        [key]: e.target.checked,
                      },
                    })
                  }
                  className="sr-only"
                />
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-xs text-center">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions - Fixed at bottom */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {hall ? "Update Hall" : "Create Hall"}
        </Button>
      </div>
    </form>
  );
};

export const HallManagement: React.FC = () => {
  const { state, deleteHall, updateHall } = useHotel();
  const halls = state.halls || [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HallStatus>("all");
  const [capacityFilter, setCapacityFilter] = useState<
    "all" | "small" | "medium" | "large"
  >("all");

  const filteredHalls = useMemo(() => {
    return halls.filter((hall) => {
      const matchesSearch =
        hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hall.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hall.facilities.some((facility) =>
          facility.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all" || hall.status === statusFilter;

      const matchesCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "small" && hall.capacity <= 50) ||
        (capacityFilter === "medium" &&
          hall.capacity > 50 &&
          hall.capacity <= 200) ||
        (capacityFilter === "large" && hall.capacity > 200);

      return matchesSearch && matchesStatus && matchesCapacity;
    });
  }, [halls, searchTerm, statusFilter, capacityFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: HallStatus) => {
    const colorMap = {
      available: "bg-green-100 text-green-800 border-green-200",
      reserved: "bg-yellow-100 text-yellow-800 border-yellow-200",
      maintenance: "bg-red-100 text-red-800 border-red-200",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getCapacityCategory = (capacity: number) => {
    if (capacity <= 50)
      return { label: "Small", color: "bg-blue-100 text-blue-800" };
    if (capacity <= 200)
      return { label: "Medium", color: "bg-green-100 text-green-800" };
    return { label: "Large", color: "bg-purple-100 text-purple-800" };
  };

  const handleEditHall = (hall: Hall) => {
    setSelectedHall(hall);
    setIsEditModalOpen(true);
  };

  const handleViewHall = (hall: Hall) => {
    setSelectedHall(hall);
    setIsViewModalOpen(true);
  };

  const handleDeleteHall = (hallId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this hall? This action cannot be undone."
      )
    ) {
      deleteHall(hallId);
      alert("Hall deleted successfully!");
    }
  };

  const toggleHallStatus = (hallId: string) => {
    const hall = halls.find((h) => h.id === hallId);
    if (!hall) return;

    const newStatus: HallStatus =
      hall.status === "available"
        ? "reserved"
        : hall.status === "reserved"
        ? "maintenance"
        : "available";

    updateHall({ ...hall, status: newStatus });
  };

  const facilityIcons = {
    "Air Conditioning": Snowflake,
    Projector: Monitor,
    "Sound System": Mic,
    WiFi: Wifi,
    Parking: Car,
    "Catering Kitchen": Utensils,
    Stage: Building2,
    "Dance Floor": Music,
    "Bar Area": Building2,
    "Full Kitchen": Utensils,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Hall Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage event halls, facilities, pricing, and availability
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add New Hall
        </Button>
      </div>

      {/* Hall Management */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Halls
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredHalls.length} of {halls.length} halls
            </span>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search halls by name, location, or facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | HallStatus)
                }
                options={[
                  { value: "all", label: "All Status" },
                  { value: "available", label: "Available" },
                  { value: "reserved", label: "Reserved" },
                  { value: "maintenance", label: "Maintenance" },
                ]}
              />

              <Select
                value={capacityFilter}
                onChange={(e) =>
                  setCapacityFilter(
                    e.target.value as "all" | "small" | "medium" | "large"
                  )
                }
                options={[
                  { value: "all", label: "All Sizes" },
                  { value: "small", label: "Small (≤50)" },
                  { value: "medium", label: "Medium (51-200)" },
                  { value: "large", label: "Large (200+)" },
                ]}
              />
            </div>
          </div>

          {/* Halls Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hall Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Capacity & Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Facilities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHalls.map((hall) => {
                  const capacityCategory = getCapacityCategory(hall.capacity);
                  return (
                    <tr
                      key={hall.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {hall.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {hall.location}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Users className="w-4 h-4 mr-1" />
                            {hall.capacity} people
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${capacityCategory.color}`}
                          >
                            {capacityCategory.label}
                          </span>
                          {hall.squareFootage && (
                            <div className="text-xs text-gray-500 mt-1">
                              {hall.squareFootage} sq ft
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(hall.pricePerHour)}/hr
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(hall.pricePerDay)}/day
                          </div>
                          {hall.setupTime && hall.cleanupTime && (
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              Setup: {hall.setupTime}h, Cleanup:{" "}
                              {hall.cleanupTime}h
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {hall.facilities.slice(0, 3).map((facility) => {
                            const Icon =
                              facilityIcons[
                                facility as keyof typeof facilityIcons
                              ] || Building2;
                            return (
                              <div
                                key={facility}
                                className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                title={facility}
                              >
                                <Icon className="w-3 h-3" />
                              </div>
                            );
                          })}
                          {hall.facilities.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{hall.facilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleHallStatus(hall.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                            hall.status
                          )}`}
                        >
                          {hall.status === "available" && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {hall.status === "reserved" && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {hall.status === "maintenance" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {hall.status.charAt(0).toUpperCase() +
                            hall.status.slice(1)}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewHall(hall)}
                            className="flex items-center justify-center w-12 h-12 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                            title="View Details"
                          >
                            <Eye className="w-8 h-8" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditHall(hall)}
                            className="flex items-center justify-center w-12 h-12 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                            title="Edit Hall"
                          >
                            <Edit className="w-8 h-8" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteHall(hall.id)}
                            className="flex items-center justify-center w-12 h-12 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            title="Delete Hall"
                          >
                            <Trash2 className="w-8 h-8" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredHalls.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {halls.length === 0
                    ? "No halls found"
                    : "No halls match your criteria"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {halls.length === 0
                    ? "Create your first event hall to start hosting events"
                    : "Try adjusting your search terms or filters to find halls"}
                </p>
                {halls.length === 0 && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Hall
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create Hall Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Hall"
      >
        <div className="h-[80vh] flex flex-col">
          <HallForm
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              // In a real app, this would refresh the halls list
            }}
          />
        </div>
      </Modal>

      {/* Edit Hall Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedHall(null);
        }}
        title="Edit Hall"
      >
        <div className="h-[80vh] flex flex-col">
          {selectedHall && (
            <HallForm
              hall={selectedHall}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedHall(null);
              }}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setSelectedHall(null);
                // In a real app, this would refresh the halls list
              }}
            />
          )}
        </div>
      </Modal>

      {/* View Hall Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedHall(null);
        }}
        title="Hall Details"
      >
        {selectedHall && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedHall.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedHall.location}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-2" />
                    Capacity: {selectedHall.capacity} people
                  </div>
                  {selectedHall.squareFootage && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4 mr-2" />
                      {selectedHall.squareFootage} square feet
                    </div>
                  )}
                  {selectedHall.setupTime && selectedHall.cleanupTime && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      Setup: {selectedHall.setupTime}h, Cleanup:{" "}
                      {selectedHall.cleanupTime}h
                    </div>
                  )}
                </div>

                {selectedHall.description && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Description
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedHall.description}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Pricing Information
                </h4>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Hourly Rate:
                    </span>
                    <span className="font-medium text-lg">
                      {formatCurrency(selectedHall.pricePerHour)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Daily Rate:
                    </span>
                    <span className="font-medium text-lg">
                      {formatCurrency(selectedHall.pricePerDay)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        selectedHall.status
                      )}`}
                    >
                      {selectedHall.status.charAt(0).toUpperCase() +
                        selectedHall.status.slice(1)}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Available Facilities ({selectedHall.facilities.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedHall.facilities.map((facility) => {
                    const Icon =
                      facilityIcons[facility as keyof typeof facilityIcons] ||
                      Building2;
                    return (
                      <div
                        key={facility}
                        className="flex items-center text-sm text-gray-700 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <Icon className="w-4 h-4 mr-2 text-blue-600" />
                        {facility}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditHall(selectedHall);
                }}
                className="mr-3"
              >
                Edit Hall
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedHall(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
