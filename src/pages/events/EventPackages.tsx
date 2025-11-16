import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  DollarSign,
  Building2,
  Clock,
  Users,
  Star,
  Eye,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { useHotel } from "../../context/HotelContext";
import { EventPackage, EventType } from "../../types/entities";

interface PackageFormProps {
  eventPackage?: EventPackage;
  onClose: () => void;
  onSuccess: () => void;
}

const PackageForm: React.FC<PackageFormProps> = ({
  eventPackage,
  onClose,
  onSuccess,
}) => {
  const { createEventPackage, updateEventPackage } = useHotel();
  const [formData, setFormData] = useState({
    name: eventPackage?.name || "",
    description: eventPackage?.description || "",
    basePrice: eventPackage?.basePrice || 0,
    taxRate: eventPackage?.taxRate || 10,
    duration:
      eventPackage?.duration ||
      ("full-day" as "half-day" | "full-day" | "hourly"),
    isActive: eventPackage?.isActive ?? true,
    includedServices: Array.isArray(eventPackage?.includedServices)
      ? eventPackage.includedServices
      : [],
    applicableEventTypes: Array.isArray(eventPackage?.applicableEventTypes)
      ? eventPackage.applicableEventTypes
      : [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      formData.basePrice <= 0
    ) {
      alert("Please fill in all required fields with valid values");
      return;
    }

    if (eventPackage) {
      // Update existing package
      const updatedPackage: EventPackage = {
        ...eventPackage,
        ...formData,
      };
      updateEventPackage(updatedPackage);
    } else {
      // Create new package
      const packageData: Omit<EventPackage, "id" | "createdAt" | "updatedAt"> =
        {
          ...formData,
          includedServices: formData.includedServices,
          applicableEventTypes: formData.applicableEventTypes,
        };
      createEventPackage(packageData);
    }

    onSuccess();
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        includedServices: [...formData.includedServices, service],
      });
    } else {
      setFormData({
        ...formData,
        includedServices: formData.includedServices.filter(
          (s) => s !== service
        ),
      });
    }
  };

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        applicableEventTypes: [
          ...formData.applicableEventTypes,
          eventType as EventType,
        ],
      });
    } else {
      setFormData({
        ...formData,
        applicableEventTypes: formData.applicableEventTypes.filter(
          (t) => t !== (eventType as EventType)
        ),
      });
    }
  };

  const availableServices = [
    "Catering Service",
    "Audio/Visual Equipment",
    "Event Decoration",
    "Professional Photography",
    "Music & DJ Services",
    "Security Services",
    "Cleaning Services",
    "Parking Management",
    "Event Coordination",
    "Lighting Setup",
  ];

  const eventTypes: EventType[] = [
    "wedding",
    "corporate",
    "conference",
    "birthday",
    "anniversary",
    "meeting",
    "seminar",
    "workshop",
    "gala",
    "other",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-blue-600" />
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Package Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Premium Wedding Package"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base Price ($) *
            </label>
            <Input
              type="number"
              value={formData.basePrice}
              onChange={(e) =>
                setFormData({ ...formData, basePrice: Number(e.target.value) })
              }
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Package Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Detailed description of what this package includes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Pricing & Duration Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Pricing & Duration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration
            </label>
            <Select
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: e.target.value as
                    | "half-day"
                    | "full-day"
                    | "hourly",
                })
              }
              options={[
                { value: "half-day", label: "Half Day (4 hours)" },
                { value: "full-day", label: "Full Day (8 hours)" },
                { value: "hourly", label: "Hourly Rate" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              value={formData.taxRate}
              onChange={(e) =>
                setFormData({ ...formData, taxRate: Number(e.target.value) })
              }
              placeholder="10"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Event Types Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-600" />
          Event Types
        </h3>

        {/* Applicable Event Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Applicable Event Types
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Select the types of events this package can be used for)
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            {eventTypes.map((eventType) => (
              <label
                key={eventType}
                className="flex items-center space-x-2 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors min-h-[44px] border border-transparent hover:border-blue-200 dark:hover:border-blue-500"
              >
                <input
                  type="checkbox"
                  checked={formData.applicableEventTypes.includes(
                    eventType as EventType
                  )}
                  onChange={(e) =>
                    handleEventTypeChange(eventType, e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize font-medium leading-tight">
                  {eventType}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Select at least one event type to make this package available for
            booking
          </p>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-orange-600" />
          Services & Add-ons
        </h3>

        {/* Included Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Included Services
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Select all services included in this package)
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            {availableServices.map((service) => (
              <label
                key={service}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.includedServices.includes(service)}
                  onChange={(e) =>
                    handleServiceChange(service, e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {service}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Choose services that will be included in the package price
          </p>
        </div>
      </div>

      {/* Package Settings Section */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-gray-600" />
          Package Settings
        </h3>

        {/* Package Status */}
        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
          />
          <div>
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Package is active and available for booking
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Inactive packages won't be shown to customers during event booking
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {eventPackage ? "Update Package" : "Create Package"}
        </Button>
      </div>
    </form>
  );
};

export const EventPackages: React.FC = () => {
  const { state, updateEventPackage, deleteEventPackage } = useHotel();
  const packages = state.eventPackages || [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<EventPackage | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [priceFilter, setPriceFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.includedServices || []).some((service) =>
          service.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && pkg.isActive) ||
        (statusFilter === "inactive" && !pkg.isActive);

      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "low" && pkg.basePrice < 1000) ||
        (priceFilter === "medium" &&
          pkg.basePrice >= 1000 &&
          pkg.basePrice < 5000) ||
        (priceFilter === "high" && pkg.basePrice >= 5000);

      return matchesSearch && matchesStatus && matchesPrice;
    });
  }, [packages, searchTerm, statusFilter, priceFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDuration = (duration: string) => {
    switch (duration) {
      case "half-day":
        return "Half Day (4hrs)";
      case "full-day":
        return "Full Day (8hrs)";
      case "hourly":
        return "Hourly Rate";
      default:
        return duration;
    }
  };

  const handleEditPackage = (pkg: EventPackage) => {
    setSelectedPackage(pkg);
    setIsEditModalOpen(true);
  };

  const handleViewPackage = (pkg: EventPackage) => {
    setSelectedPackage(pkg);
    setIsViewModalOpen(true);
  };

  const handleDeletePackage = (packageId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this package? This action cannot be undone."
      )
    ) {
      deleteEventPackage(packageId);
    }
  };

  const togglePackageStatus = (packageId: string) => {
    const packageToToggle = packages.find((p) => p.id === packageId);
    if (packageToToggle) {
      updateEventPackage({
        ...packageToToggle,
        isActive: !packageToToggle.isActive,
      });
    }
  };

  const packageStats = {
    total: packages.length,
    active: packages.filter((p) => p.isActive).length,
    averagePrice:
      packages.length > 0
        ? packages.reduce((sum, p) => sum + p.basePrice, 0) / packages.length
        : 0,
    totalRevenue: packages.reduce((sum, p) => sum + p.basePrice, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Event Packages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage event packages, pricing, and services for your hotel events
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create New Package
        </Button>
      </div>

      {/* Package Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Packages</p>
                <p className="text-3xl font-bold">{packageStats.total}</p>
              </div>
              <Package className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Active Packages</p>
                <p className="text-3xl font-bold">{packageStats.active}</p>
              </div>
              <Building2 className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Average Price</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(packageStats.averagePrice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(packageStats.totalRevenue)}
                </p>
              </div>
              <Star className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </Card>
      </div>

      {/* Packages Management */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Event Packages
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredPackages.length} of {packages.length} packages
            </span>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search packages by name, description, or services..."
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
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active Only" },
                  { value: "inactive", label: "Inactive Only" },
                ]}
              />

              <Select
                value={priceFilter}
                onChange={(e) =>
                  setPriceFilter(
                    e.target.value as "all" | "low" | "medium" | "high"
                  )
                }
                options={[
                  { value: "all", label: "All Prices" },
                  { value: "low", label: "< $1,000" },
                  { value: "medium", label: "$1,000 - $5,000" },
                  { value: "high", label: "> $5,000" },
                ]}
              />
            </div>
          </div>

          {/* Packages Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Package Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pricing & Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Services & Events
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
                {filteredPackages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {pkg.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {pkg.description}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(pkg.basePrice)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(pkg.duration)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Tax: {pkg.taxRate}%
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Users className="w-3 h-3 mr-1" />
                          {pkg.includedServices?.length || 0} services
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {pkg.includedServices?.slice(0, 2)?.join(", ") ||
                            "No services"}
                          {(pkg.includedServices?.length || 0) > 2 &&
                            ` +${(pkg.includedServices?.length || 0) - 2} more`}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {pkg.applicableEventTypes?.length || 0} event types
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePackageStatus(pkg.id)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          pkg.isActive
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}
                      >
                        {pkg.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPackage(pkg)}
                          className="flex items-center justify-center w-12 h-12 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                          title="View Details"
                        >
                          <Eye className="w-8 h-8" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPackage(pkg)}
                          className="flex items-center justify-center w-12 h-12 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                          title="Edit Package"
                        >
                          <Edit className="w-8 h-8" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="flex items-center justify-center w-12 h-12 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          title="Delete Package"
                        >
                          <Trash2 className="w-8 h-8" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPackages.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {packages.length === 0
                    ? "No event packages found"
                    : "No packages match your criteria"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {packages.length === 0
                    ? "Create your first event package to get started with event management"
                    : "Try adjusting your search terms or filters to find packages"}
                </p>
                {packages.length === 0 && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Package
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Create Package Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Event Package"
        size="4xl"
      >
        <PackageForm
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            // In a real app, this would refresh the packages list
          }}
        />
      </Modal>

      {/* Edit Package Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPackage(null);
        }}
        title="Edit Event Package"
        size="4xl"
      >
        {selectedPackage && (
          <PackageForm
            eventPackage={selectedPackage}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedPackage(null);
            }}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedPackage(null);
              // In a real app, this would refresh the packages list
            }}
          />
        )}
      </Modal>

      {/* View Package Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPackage(null);
        }}
        title="Package Details"
        size="2xl"
      >
        {selectedPackage && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedPackage.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedPackage.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Base Price:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(selectedPackage.basePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Tax Rate:
                    </span>
                    <span className="font-medium">
                      {selectedPackage.taxRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Duration:
                    </span>
                    <span className="font-medium">
                      {formatDuration(selectedPackage.duration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Status:
                    </span>
                    <span
                      className={`font-medium ${
                        selectedPackage.isActive
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {selectedPackage.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Included Services (
                  {selectedPackage.includedServices?.length || 0})
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {(selectedPackage.includedServices || []).map(
                    (service, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {service}
                      </li>
                    )
                  )}
                </ul>

                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">
                  Applicable Event Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedPackage.applicableEventTypes || []).map(
                    (eventType, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                      >
                        {eventType}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditPackage(selectedPackage);
                }}
                className="mr-3"
              >
                Edit Package
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedPackage(null);
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
