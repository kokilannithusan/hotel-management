import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useEventManagement } from "../../context/EventManagementContext";
import { useHotel } from "../../context/HotelContext";
import { useAdditionalService } from "../../context/AdditionalServiceContext";
import {
  EventPackageMaster,
  ResidencyStatus,
  ChargeType,
  EventStatus,
  PackageFormStep1,
  PackageFormStep2,
  PackageFormStep3,
} from "../../types/eventManagement";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

export const Packages: React.FC = () => {
  const { packages, events, addPackage, updatePackage, deletePackage } =
    useEventManagement();
  const { state } = useHotel();
  const { serviceItems } = useAdditionalService();
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] =
    useState<EventPackageMaster | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Form data split into steps
  const [step1Data, setStep1Data] = useState<PackageFormStep1>({
    packageName: "",
    residencyStatus: "Resident",
    eventType: "",
    attendeesCount: 0,
    chargeType: "Hour",
    venueHallId: "",
    capacityLimit: 0,
    description: "",
  });

  const [step2Data, setStep2Data] = useState<PackageFormStep2>({
    hoursRequired: 0,
    pricePerHour: 0,
    pricePerDay: 0,
    currency: "LKR",
    serviceChargePercentage: 10,
    taxPercentage: 0,
    discountType: undefined,
    discountValue: 0,
  });

  const [step3Data, setStep3Data] = useState<PackageFormStep3>({
    additionalServiceIds: [],
  });

  const activeEvents = events.filter((e) => e.status === "Active");
  // Get all active services from Manage Service Items page
  const allActiveServices = serviceItems.filter((s) => s.status === "Active");
  const currencies = ["LKR", "USD", "EUR", "GBP", "AUD"];

  const calculatePricing = () => {
    let basePrice = 0;

    if (step1Data.chargeType === "Hour" && step2Data.pricePerHour) {
      basePrice = step2Data.pricePerHour;
    } else if (step1Data.chargeType === "Day" && step2Data.pricePerDay) {
      basePrice = step2Data.pricePerDay;
    }

    const selectedServices = allActiveServices.filter((s) =>
      step3Data.additionalServiceIds.includes(s.id)
    );
    const additionalServicesTotal = selectedServices.reduce(
      (sum, s) => sum + s.price,
      0
    );

    const subtotal = basePrice + additionalServicesTotal;
    const serviceChargeAmount = 0; // Removed

    // Get taxes from selected event
    const selectedEvent = events.find(
      (e) => e.eventType === step1Data.eventType
    );
    let taxAmount = 0;
    if (selectedEvent && selectedEvent.taxIds) {
      const eventTaxes = state.taxes.filter((t) =>
        selectedEvent.taxIds?.includes(t.id)
      );
      taxAmount = eventTaxes.reduce(
        (sum, tax) => sum + (subtotal * tax.rate) / 100,
        0
      );
    }

    const discountAmount = 0; // Removed
    const grandTotal =
      subtotal + serviceChargeAmount + taxAmount - discountAmount;

    return {
      basePrice,
      additionalServicesTotal,
      serviceChargeAmount,
      taxAmount,
      discountAmount,
      grandTotal,
    };
  };

  const handleOpenModal = (pkg?: EventPackageMaster) => {
    if (pkg) {
      setEditingPackage(pkg);
      setStep1Data({
        packageName: pkg.packageName,
        residencyStatus: pkg.residencyStatus,
        eventType: pkg.eventType,
        attendeesCount: pkg.attendeesCount,
        chargeType: pkg.chargeType,
        venueHallId: pkg.venueHallId || "",
        capacityLimit: pkg.capacityLimit || 0,
        description: pkg.description || "",
      });
      setStep2Data({
        hoursRequired: pkg.hoursRequired || 0,
        pricePerHour: pkg.pricePerHour || 0,
        pricePerDay: pkg.pricePerDay || 0,
        currency: pkg.currency || "LKR",
        serviceChargePercentage: pkg.serviceChargePercentage,
        taxPercentage: pkg.taxPercentage,
        discountType: pkg.discountType,
        discountValue: pkg.discountValue || 0,
      });
      setStep3Data({
        additionalServiceIds: pkg.additionalServiceIds,
      });
    } else {
      setEditingPackage(null);
      setStep1Data({
        packageName: "",
        residencyStatus: "Resident",
        eventType: "",
        attendeesCount: 0,
        chargeType: "Hour",
        venueHallId: "",
        capacityLimit: 0,
        description: "",
      });
      setStep2Data({
        hoursRequired: 0,
        pricePerHour: 0,
        pricePerDay: 0,
        currency: "LKR",
        serviceChargePercentage: 10,
        taxPercentage: 12,
        discountType: undefined,
        discountValue: 0,
      });
      setStep3Data({
        additionalServiceIds: [],
      });
    }
    setCurrentStep(1);
    setShowModal(true);
  };

  const handleSubmit = () => {
    const pricing = calculatePricing();
    const packageData = {
      ...step1Data,
      ...step2Data,
      ...step3Data,
      ...pricing,
      status: "Active" as EventStatus,
    };

    if (editingPackage) {
      updatePackage(editingPackage.id, packageData);
    } else {
      addPackage(packageData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this package?")) {
      deletePackage(id);
    }
  };

  const handleToggleService = (serviceId: string) => {
    setStep3Data((prev) => ({
      additionalServiceIds: prev.additionalServiceIds.includes(serviceId)
        ? prev.additionalServiceIds.filter((id) => id !== serviceId)
        : [...prev.additionalServiceIds, serviceId],
    }));
  };

  const filteredPackages = packages.filter(
    (pkg) =>
      pkg.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.eventType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pricing = calculatePricing();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Package Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage event packages with pricing
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Packages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-gray-500">
            No packages found. Create your first package to get started.
          </Card>
        ) : (
          filteredPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pkg.packageName}
                    </h3>
                    <p className="text-sm text-gray-600">{pkg.eventType}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pkg.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {pkg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Residency:</span>
                    <p className="font-medium">{pkg.residencyStatus}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Charge Type:</span>
                    <p className="font-medium">{pkg.chargeType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendees:</span>
                    <p className="font-medium">{pkg.attendeesCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Services:</span>
                    <p className="font-medium">
                      {pkg.additionalServiceIds.length}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Grand Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {pkg.currency || "LKR"}{" "}
                      {pkg.grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenModal(pkg)}
                    className="flex-1"
                    size="sm"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(pkg.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Multi-Step Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPackage ? "Edit Package" : "Create New Package"}
        size="4xl"
      >
        <div className="flex gap-8">
          {/* Main Form Area */}
          <div className="flex-1">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              {[
                { num: 1, label: "General Info" },
                { num: 2, label: "Pricing" },
                { num: 3, label: "Services" },
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        step.num === currentStep
                          ? "bg-blue-600 text-white shadow-lg scale-110"
                          : step.num < currentStep
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step.num}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        step.num === currentStep
                          ? "text-blue-600"
                          : step.num < currentStep
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`h-1 w-24 mx-4 transition-all ${
                        step.num < currentStep ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: General Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                  <h3 className="text-xl font-bold text-blue-900 mb-1">
                    General Information
                  </h3>
                  <p className="text-sm text-blue-700">
                    Basic package details and configuration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Package Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    required
                    value={step1Data.packageName}
                    onChange={(e) =>
                      setStep1Data({
                        ...step1Data,
                        packageName: e.target.value,
                      })
                    }
                    placeholder="Enter a memorable package name"
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Residency Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Resident", "Non-Resident"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setStep1Data({
                              ...step1Data,
                              residencyStatus: status as ResidencyStatus,
                            })
                          }
                          className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            step1Data.residencyStatus === status
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Charge Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "Hour", label: "Per Hour" },
                        { value: "Day", label: "Per Day" },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() =>
                            setStep1Data({
                              ...step1Data,
                              chargeType: type.value as ChargeType,
                            })
                          }
                          className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            step1Data.chargeType === type.value
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Event Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={step1Data.eventType}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          eventType: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Event Type</option>
                      {activeEvents.map((event) => (
                        <option key={event.id} value={event.eventType}>
                          {event.eventName} ({event.eventType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Attendees Count <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      required
                      min="1"
                      value={step1Data.attendeesCount}
                      onChange={(e) =>
                        setStep1Data({
                          ...step1Data,
                          attendeesCount: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Number of guests"
                      className="text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Description
                  </label>
                  <textarea
                    value={step1Data.description}
                    onChange={(e) =>
                      setStep1Data({
                        ...step1Data,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any additional details about this package..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
                  <h3 className="text-xl font-bold text-green-900 mb-1">
                    Pricing Configuration
                  </h3>
                  <p className="text-sm text-green-700">
                    Set base pricing and additional charges
                  </p>
                </div>

                {/* Dynamic pricing based on Charge Type and Residency */}
                {step1Data.chargeType === "Hour" &&
                  step1Data.residencyStatus === "Resident" && (
                    <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-gray-800">
                          Base Package Price (LKR){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          Per Hour
                        </span>
                      </div>
                      <Input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={step2Data.pricePerHour}
                        onChange={(e) =>
                          setStep2Data({
                            ...step2Data,
                            pricePerHour: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        className="text-base"
                      />
                    </div>
                  )}

                {step1Data.chargeType === "Day" &&
                  step1Data.residencyStatus === "Non-Resident" && (
                    <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                      <div className="flex justify-end mb-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Per Day
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Currency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={step2Data.currency}
                            onChange={(e) =>
                              setStep2Data({
                                ...step2Data,
                                currency: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {currencies.map((curr) => (
                              <option key={curr} value={curr}>
                                {curr}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Base Package Price{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={step2Data.pricePerDay}
                            onChange={(e) =>
                              setStep2Data({
                                ...step2Data,
                                pricePerDay: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {/* Other combinations */}
                {step1Data.chargeType === "Hour" &&
                  step1Data.residencyStatus === "Non-Resident" && (
                    <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                      <div className="flex justify-end mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          Per Hour
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Currency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={step2Data.currency}
                            onChange={(e) =>
                              setStep2Data({
                                ...step2Data,
                                currency: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {currencies.map((curr) => (
                              <option key={curr} value={curr}>
                                {curr}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Base Package Price{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={step2Data.pricePerHour}
                            onChange={(e) =>
                              setStep2Data({
                                ...step2Data,
                                pricePerHour: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                            className="text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                {step1Data.chargeType === "Day" &&
                  step1Data.residencyStatus === "Resident" && (
                    <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-gray-800">
                          Base Package Price (LKR){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Per Day
                        </span>
                      </div>
                      <Input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={step2Data.pricePerDay}
                        onChange={(e) =>
                          setStep2Data({
                            ...step2Data,
                            pricePerDay: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                        className="text-base"
                      />
                    </div>
                  )}

                <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Taxes will be automatically applied
                    based on the selected Event Type. The tax rates are
                    configured in the Event Master.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Additional Services */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
                  <h3 className="text-xl font-bold text-purple-900 mb-1">
                    Additional Services
                  </h3>
                  <p className="text-sm text-purple-700">
                    Select optional services to include in this package
                  </p>
                </div>

                {allActiveServices.length === 0 ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-yellow-800">
                      No active services available. Please add services from the{" "}
                      <strong>Manage Service Items</strong> page first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Select services from Manage Service Items:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {allActiveServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleToggleService(service.id)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            step3Data.additionalServiceIds.includes(service.id)
                              ? "bg-purple-600 text-white border-purple-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-semibold">
                              {service.serviceName}
                            </div>
                            <div className="text-xs opacity-90">
                              LKR {service.price.toLocaleString()}
                              {service.unitType && ` / ${service.unitType}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Selected Services Details */}
                    {step3Data.additionalServiceIds.length > 0 && (
                      <div className="mt-6 bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          Selected Services (
                          {step3Data.additionalServiceIds.length})
                        </h4>
                        <div className="space-y-2">
                          {allActiveServices
                            .filter((s) =>
                              step3Data.additionalServiceIds.includes(s.id)
                            )
                            .map((service) => (
                              <div
                                key={service.id}
                                className="flex justify-between items-start bg-white p-3 rounded-lg"
                              >
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">
                                    {service.serviceName}
                                  </h5>
                                  {service.description && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-semibold text-purple-600">
                                    LKR {service.price.toLocaleString()}
                                  </p>
                                  {service.unitType && (
                                    <p className="text-xs text-gray-500">
                                      per {service.unitType}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t-2 mt-8">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="bg-gray-600 hover:bg-gray-700 px-6 py-3 text-base font-medium"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 px-6 py-3 text-base font-medium"
                >
                  Cancel
                </Button>
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-3 text-base font-medium"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 px-8 py-3 text-base font-medium"
                  >
                    {editingPackage ? "Update Package" : "Create Package"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Cost Summary Panel - Only show from Step 2 onwards */}
          {currentStep >= 2 && (
            <div className="w-96 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl shadow-lg border-2 border-blue-200">
              <h3 className="text-xl font-bold mb-5 text-gray-900 flex items-center">
                <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                  ₹
                </span>
                Cost Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">
                    {step2Data.currency || "LKR"}{" "}
                    {pricing.basePrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Additional Services:</span>
                  <span className="font-medium">
                    {step2Data.currency || "LKR"}{" "}
                    {pricing.additionalServicesTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Event Taxes:</span>
                    <span className="font-medium">
                      {step2Data.currency || "LKR"}{" "}
                      {pricing.taxAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {step1Data.eventType &&
                    (() => {
                      const selectedEvent = events.find(
                        (e) => e.eventType === step1Data.eventType
                      );
                      if (
                        selectedEvent &&
                        selectedEvent.taxIds &&
                        selectedEvent.taxIds.length > 0
                      ) {
                        const eventTaxes = state.taxes.filter((t) =>
                          selectedEvent.taxIds?.includes(t.id)
                        );
                        return (
                          <div className="text-xs text-gray-500 mt-1 ml-4">
                            {eventTaxes.map((tax) => (
                              <div key={tax.id}>
                                • {tax.name} ({tax.rate}%)
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Grand Total:
                    </span>
                    <span className="text-xl font-bold text-blue-600">
                      {step2Data.currency || "LKR"}{" "}
                      {pricing.grandTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Package Details Summary */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <h4 className="font-semibold text-sm text-gray-900 mb-3">
                  Package Details
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Type:</span>
                    <span className="font-medium text-gray-900">
                      {step1Data.eventType || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Residency:</span>
                    <span className="font-medium text-gray-900">
                      {step1Data.residencyStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Charge Type:</span>
                    <span className="font-medium text-gray-900">
                      {step1Data.chargeType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attendees:</span>
                    <span className="font-medium text-gray-900">
                      {step1Data.attendeesCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Services Selected:</span>
                    <span className="font-medium text-gray-900">
                      {step3Data.additionalServiceIds.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
