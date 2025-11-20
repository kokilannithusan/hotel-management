import React, { useState, useMemo } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  User,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAdditionalService } from "../../context/AdditionalServiceContext";
import { useHotel } from "../../context/HotelContext";
import { ReservationServiceAddon, Reservation } from "../../types/entities";

const ReservationAddonService: React.FC = () => {
  const {
    reservationAddons,
    addReservationAddon,
    updateReservationAddon,
    deleteReservationAddon,
    getReservationAddonTotal,
    getActiveServiceItems,
  } = useAdditionalService();

  const { state } = useHotel();
  const reservations = state?.reservations || [];
  const customers = state?.customers || [];
  const rooms = state?.rooms || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Completed" | "Cancelled"
  >("All");
  const [selectedReservation, setSelectedReservation] = useState<string | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAddon, setEditingAddon] =
    useState<ReservationServiceAddon | null>(null);

  // Two-step process state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1 = Configuration, 2 = Confirmation
  const [pendingServices, setPendingServices] = useState<
    Array<{
      serviceId: string;
      serviceName: string;
      serviceDescription: string;
      quantity: string;
      unitPrice: number;
      unitType: string;
      serviceDate: string;
      serviceTime: string;
      status: "Pending" | "Completed" | "Cancelled";
      notes: string;
    }>
  >([]);

  // Billing mode state (appears at top of form)
  const [billingMode, setBillingMode] = useState<
    "Cash" | "Room" | "Reference No." | null
  >(null);
  const [customerName, setCustomerName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [formData, setFormData] = useState({
    serviceId: "",
    quantity: "1",
    serviceDate: new Date().toISOString().split("T")[0],
    serviceTime: "10:00",
    billingMethod: "Room" as "Cash" | "Room" | "Reference No.",
    referenceNumber: "",
    notes: "",
    status: "Pending" as "Pending" | "Completed" | "Cancelled",
  });

  const reservationServices = getActiveServiceItems("Reservation");

  // Filter addons
  const filteredAddons = useMemo(() => {
    return reservationAddons.filter((addon) => {
      if (addon.deletedAt) return false; // Hide soft-deleted
      const matchesSearch =
        addon.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.reservationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.roomNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || addon.status === statusFilter;
      const matchesReservation =
        !selectedReservation || addon.reservationId === selectedReservation;
      return matchesSearch && matchesStatus && matchesReservation;
    });
  }, [reservationAddons, searchTerm, statusFilter, selectedReservation]);

  const handleAddService = () => {
    if (!billingMode) {
      alert("Please select a billing mode first");
      return;
    }

    if (!canAddService()) {
      let message = "Please complete required fields: ";
      if (billingMode === "Cash") message += "Customer Name";
      else if (billingMode === "Room") message += "Room Number";
      else if (billingMode === "Reference No.") message += "Reference Number";
      alert(message);
      return;
    }

    setShowAddModal(true);
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();

    const service = reservationServices.find(
      (s) => s.id === formData.serviceId
    );

    if (!service) return;

    // Add service to pending list
    setPendingServices([
      ...pendingServices,
      {
        serviceId: service.id,
        serviceName: service.serviceName,
        serviceDescription: service.description || "",
        quantity: formData.quantity,
        unitPrice: service.price,
        unitType: service.unitType,
        serviceDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        status: formData.status,
        notes: formData.notes,
      },
    ]);

    // Reset form for next service
    setFormData({
      serviceId: "",
      quantity: "1",
      serviceDate: new Date().toISOString().split("T")[0],
      serviceTime: "10:00",
      billingMethod: formData.billingMethod,
      referenceNumber: formData.referenceNumber,
      notes: "",
      status: "Pending",
    });
  };

  const handleProceedToConfirmation = () => {
    if (pendingServices.length === 0) {
      alert("Please add at least one service before proceeding");
      return;
    }
    setCurrentStep(2);
  };

  const handleBackToConfiguration = () => {
    setCurrentStep(1);
  };

  const handleRemoveService = (index: number) => {
    setPendingServices(pendingServices.filter((_, i) => i !== index));
  };

  const handleSubmitAll = () => {
    if (!billingMode) return;

    // For Cash mode
    if (billingMode === "Cash") {
      pendingServices.forEach((service) => {
        addReservationAddon({
          reservationId: "CASH-" + Date.now(),
          reservationNo: "CASH-" + Date.now(),
          guestName: customerName,
          roomNo: "N/A",
          checkIn: new Date().toISOString().split("T")[0],
          checkOut: new Date().toISOString().split("T")[0],
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          quantity: parseFloat(service.quantity),
          unitType: service.unitType,
          unitPrice: service.unitPrice,
          serviceDate: service.serviceDate,
          serviceTime: service.serviceTime,
          billingMethod: "Cash",
          notes: service.notes,
          status: service.status,
          createdBy: "admin",
        });
      });
      handleCloseAddModal();
      return;
    }

    // For Room and Reference modes
    if (!selectedReservation) {
      alert(
        "No reservation found. Please verify the room number or reference."
      );
      return;
    }

    const reservation = reservations.find(
      (r: Reservation) => r.id === selectedReservation
    );

    if (!reservation) return;

    const customer = customers.find((c) => c.id === reservation.customerId);
    const room = rooms.find((r) => r.id === reservation.roomId);

    pendingServices.forEach((service) => {
      addReservationAddon({
        reservationId: reservation.id,
        reservationNo: `RES-2025-${reservation.id}`,
        guestName: customer?.name || "Unknown",
        roomNo: room?.roomNumber || roomNumber || "N/A",
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        quantity: parseFloat(service.quantity),
        unitType: service.unitType,
        unitPrice: service.unitPrice,
        serviceDate: service.serviceDate,
        serviceTime: service.serviceTime,
        billingMethod: billingMode,
        referenceNo:
          billingMode === "Reference No." ? referenceNumber : undefined,
        notes: service.notes,
        status: service.status,
        createdBy: "admin",
      });
    });

    handleCloseAddModal();
  };

  const handleEdit = (addon: ReservationServiceAddon) => {
    if (addon.isInvoiced) {
      alert("Cannot edit service that has been invoiced");
      return;
    }
    setEditingAddon(addon);
    setFormData({
      serviceId: addon.serviceId,
      quantity: addon.quantity.toString(),
      serviceDate: addon.serviceDate,
      serviceTime: addon.serviceTime || "",
      billingMethod: addon.billingMethod as "Cash" | "Room" | "Reference No.",
      referenceNumber: addon.referenceNo || "",
      notes: addon.notes || "",
      status: addon.status,
    });
    setShowEditModal(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;

    const service = reservationServices.find(
      (s) => s.id === formData.serviceId
    );
    if (!service) return;

    updateReservationAddon(
      editingAddon.id,
      {
        serviceId: service.id,
        serviceName: service.serviceName,
        quantity: parseFloat(formData.quantity),
        unitType: service.unitType,
        unitPrice: service.price,
        serviceDate: formData.serviceDate,
        serviceTime: formData.serviceTime,
        billingMethod: formData.billingMethod,
        referenceNo:
          formData.billingMethod === "Reference No."
            ? formData.referenceNumber
            : undefined,
        notes: formData.notes,
        status: formData.status,
      },
      "admin"
    );

    handleCloseEditModal();
  };

  const handleDelete = (addon: ReservationServiceAddon) => {
    if (addon.isInvoiced) {
      alert("Cannot delete service that has been invoiced");
      return;
    }
    if (
      window.confirm(`Are you sure you want to delete "${addon.serviceName}"?`)
    ) {
      deleteReservationAddon(addon.id, "admin");
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setCurrentStep(1);
    setPendingServices([]);
    setFormData({
      serviceId: "",
      quantity: "1",
      serviceDate: new Date().toISOString().split("T")[0],
      serviceTime: "10:00",
      billingMethod: "Room",
      referenceNumber: "",
      notes: "",
      status: "Pending",
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAddon(null);
    setFormData({
      serviceId: "",
      quantity: "1",
      serviceDate: new Date().toISOString().split("T")[0],
      serviceTime: "10:00",
      billingMethod: "Room",
      referenceNumber: "",
      notes: "",
      status: "Pending",
    });
  };

  const selectedReservationData = selectedReservation
    ? reservations.find((r: Reservation) => r.id === selectedReservation)
    : null;

  const selectedReservationTotal = selectedReservation
    ? getReservationAddonTotal(selectedReservation)
    : 0;

  const selectedService = formData.serviceId
    ? reservationServices.find((s) => s.id === formData.serviceId)
    : null;

  const calculatedTotal = selectedService
    ? selectedService.price * parseFloat(formData.quantity || "0")
    : 0;

  // Check if required fields are filled based on billing mode
  const canAddService = () => {
    if (!billingMode) return false;

    switch (billingMode) {
      case "Cash":
        return customerName.trim() !== "";
      case "Room":
        return roomNumber.trim() !== "";
      case "Reference No.":
        return referenceNumber.trim() !== "";
      default:
        return false;
    }
  };

  const handleBillingModeChange = (mode: "Cash" | "Room" | "Reference No.") => {
    setBillingMode(mode);
    // Reset fields when changing mode
    setCustomerName("");
    setRoomNumber("");
    setReferenceNumber("");
    setSelectedReservation(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservation Add-on Service"
        description="Manage additional services for room reservations"
      />

      {/* Billing Mode Selection (Top Priority) */}
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Step 1: Select Billing Mode
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Choose how this service will be billed
              </p>
            </div>
            <Button
              onClick={handleAddService}
              disabled={!canAddService()}
              className={`flex items-center gap-2 ${
                canAddService()
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>

          {/* Billing Mode Toggle Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleBillingModeChange("Cash")}
              className={`relative px-6 py-5 rounded-lg border-2 transition-all duration-200 ${
                billingMode === "Cash"
                  ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {billingMode === "Cash" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-4xl mb-2">💵</div>
                <div
                  className={`text-base font-semibold ${
                    billingMode === "Cash" ? "text-blue-600" : "text-slate-700"
                  }`}
                >
                  Cash
                </div>
                <div
                  className={`text-xs mt-1 ${
                    billingMode === "Cash" ? "text-blue-500" : "text-slate-600"
                  }`}
                >
                  Non-resident guests
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleBillingModeChange("Room")}
              className={`relative px-6 py-5 rounded-lg border-2 transition-all duration-200 ${
                billingMode === "Room"
                  ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {billingMode === "Room" && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-4xl mb-2">🏨</div>
                <div
                  className={`text-base font-semibold ${
                    billingMode === "Room"
                      ? "text-purple-600"
                      : "text-slate-700"
                  }`}
                >
                  Room
                </div>
                <div
                  className={`text-xs mt-1 ${
                    billingMode === "Room"
                      ? "text-purple-500"
                      : "text-slate-600"
                  }`}
                >
                  Checked-in guests
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleBillingModeChange("Reference No.")}
              className={`relative px-6 py-5 rounded-lg border-2 transition-all duration-200 ${
                billingMode === "Reference No."
                  ? "border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/20"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              {billingMode === "Reference No." && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <div
                  className={`text-base font-semibold ${
                    billingMode === "Reference No."
                      ? "text-orange-600"
                      : "text-slate-700"
                  }`}
                >
                  Reference No.
                </div>
                <div
                  className={`text-xs mt-1 ${
                    billingMode === "Reference No."
                      ? "text-orange-500"
                      : "text-slate-600"
                  }`}
                >
                  Linked billing
                </div>
              </div>
            </button>
          </div>

          {/* Mode Description */}
          {billingMode && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-6 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    billingMode === "Cash"
                      ? "text-blue-400"
                      : billingMode === "Room"
                      ? "text-purple-400"
                      : "text-orange-400"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      billingMode === "Cash"
                        ? "text-blue-300"
                        : billingMode === "Room"
                        ? "text-purple-300"
                        : "text-orange-300"
                    }`}
                  >
                    {billingMode === "Cash" && "Cash Payment Mode"}
                    {billingMode === "Room" && "Room Charge Mode"}
                    {billingMode === "Reference No." && "Reference Number Mode"}
                  </p>
                  <p
                    className={`text-sm ${
                      billingMode === "Cash"
                        ? "text-blue-400/80"
                        : billingMode === "Room"
                        ? "text-purple-400/80"
                        : "text-orange-400/80"
                    }`}
                  >
                    {billingMode === "Cash" &&
                      "For non-resident guests. Payment collected immediately. Provide customer name to proceed."}
                    {billingMode === "Room" &&
                      "For checked-in guests. Charge posts to room invoice. Provide room number to proceed."}
                    {billingMode === "Reference No." &&
                      "For guests with reservation/event reference. Charge merges to corresponding invoice. Provide reference number to proceed."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Fields Based on Billing Mode */}
          {billingMode === "Cash" && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5 animate-fadeIn">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">
                Step 2: Enter Customer Details
              </h4>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Customer Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer full name"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-slate-600 mt-2">
                  Required for cash payment identification
                </p>
              </div>
            </div>
          )}

          {billingMode === "Room" && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-5 animate-fadeIn">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">
                Step 2: Enter Room Details
              </h4>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Room Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoomNumber(value);
                    // Try to find reservation by room number
                    if (value.trim()) {
                      const room = rooms.find(
                        (r) =>
                          r.roomNumber.toLowerCase() === value.toLowerCase()
                      );
                      if (room) {
                        const activeReservation = reservations.find(
                          (res: Reservation) =>
                            res.roomId === room.id &&
                            res.status === "checked-in"
                        );
                        if (activeReservation) {
                          setSelectedReservation(activeReservation.id);
                        }
                      }
                    }
                  }}
                  placeholder="Enter room number (e.g., 101, 202)"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                <p className="text-xs text-slate-600 mt-2">
                  System will auto-fetch guest details if room is occupied
                </p>
              </div>
            </div>
          )}

          {billingMode === "Reference No." && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-5 animate-fadeIn">
              <h4 className="text-sm font-semibold text-slate-800 mb-4">
                Step 2: Enter Reference Details
              </h4>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Reservation/Event Reference Number{" "}
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReferenceNumber(value);
                    // Try to find reservation by reference
                    if (value.trim()) {
                      const matchedReservation = reservations.find(
                        (res: Reservation) => {
                          const refNo = `RES-2025-${res.id}`;
                          return refNo.toLowerCase() === value.toLowerCase();
                        }
                      );
                      if (matchedReservation) {
                        setSelectedReservation(matchedReservation.id);
                      }
                    }
                  }}
                  placeholder="Enter reservation or event reference number"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
                <p className="text-xs text-slate-600 mt-2">
                  Example: RES-2025-001 or EVT-2025-001
                </p>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {billingMode && !canAddService() && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">
                    Required Field Missing
                  </p>
                  <p className="text-sm text-red-400/80">
                    {billingMode === "Cash" &&
                      "Please enter customer name to proceed with adding services."}
                    {billingMode === "Room" &&
                      "Please enter room number to proceed with adding services."}
                    {billingMode === "Reference No." &&
                      "Please enter reference number to proceed with adding services."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display Selected Reservation Details (if found) */}
        {selectedReservation &&
          (() => {
            const reservation = reservations.find(
              (r: Reservation) => r.id === selectedReservation
            );
            if (!reservation) return null;

            const customer = customers.find(
              (c) => c.id === reservation.customerId
            );
            const room = rooms.find((r) => r.id === reservation.roomId);

            return (
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-5 mt-4 animate-fadeIn">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <User className="w-4 h-4 text-green-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    ✓ Reservation Found & Linked
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Guest Name</p>
                    <p className="text-sm font-semibold text-white">
                      {customer?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Room Number</p>
                    <p className="text-sm font-semibold text-white">
                      {room?.roomNumber || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Stay Period</p>
                    <p className="text-sm font-semibold text-white">
                      {reservation.checkIn}
                    </p>
                    <p className="text-xs text-gray-400">
                      to {reservation.checkOut}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Services Total</p>
                    <p className="text-lg font-bold text-green-400">
                      LKR{" "}
                      {getReservationAddonTotal(
                        selectedReservation
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
      </Card>

      {/* Legacy Search Section - Hidden/Removed */}
      <Card className="p-6 hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Find Reservation
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Search by reservation reference, NIC, or passport number
            </p>
          </div>
          {selectedReservation && (
            <Button
              onClick={handleAddService}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by Reservation Reference No, NIC, or Passport No..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Auto-select if only one match
                  const matches = reservations.filter(
                    (reservation: Reservation) => {
                      const customer = customers.find(
                        (c) => c.id === reservation.customerId
                      );
                      const refNo = `RES-2025-${reservation.id}`;
                      return (
                        refNo
                          .toLowerCase()
                          .includes(e.target.value.toLowerCase()) ||
                        customer?.identificationNumber
                          ?.toLowerCase()
                          .includes(e.target.value.toLowerCase())
                      );
                    }
                  );
                  if (matches.length === 1) {
                    setSelectedReservation(matches[0].id);
                  } else if (e.target.value === "") {
                    setSelectedReservation(null);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const matches = reservations.filter(
                      (reservation: Reservation) => {
                        const customer = customers.find(
                          (c) => c.id === reservation.customerId
                        );
                        const refNo = `RES-2025-${reservation.id}`;
                        return (
                          refNo
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          customer?.identificationNumber
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        );
                      }
                    );
                    if (matches.length > 0) {
                      setSelectedReservation(matches[0].id);
                      const refNo = `RES-2025-${matches[0].id}`;
                      setSearchTerm(refNo);
                    }
                  }
                }}
                className="w-full pl-11 pr-4 py-3 bg-gray-700 border border-slate-300 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <Button
              onClick={() => {
                const matches = reservations.filter(
                  (reservation: Reservation) => {
                    const customer = customers.find(
                      (c) => c.id === reservation.customerId
                    );
                    const refNo = `RES-2025-${reservation.id}`;
                    return (
                      refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      customer?.identificationNumber
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    );
                  }
                );
                if (matches.length > 0) {
                  setSelectedReservation(matches[0].id);
                  const refNo = `RES-2025-${matches[0].id}`;
                  setSearchTerm(refNo);
                }
              }}
              className="px-6 py-3 flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>

          {/* Search Results Dropdown */}
          {searchTerm &&
            (() => {
              const matches = reservations.filter(
                (reservation: Reservation) => {
                  const customer = customers.find(
                    (c) => c.id === reservation.customerId
                  );
                  const refNo = `RES-2025-${reservation.id}`;
                  return (
                    refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    customer?.identificationNumber
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  );
                }
              );

              if (matches.length > 1) {
                return (
                  <div className="bg-gray-700 border border-slate-300 rounded-lg max-h-60 overflow-y-auto">
                    {matches.map((reservation: Reservation) => {
                      const customer = customers.find(
                        (c) => c.id === reservation.customerId
                      );
                      const room = rooms.find(
                        (r) => r.id === reservation.roomId
                      );
                      const refNo = `RES-2025-${reservation.id}`;
                      return (
                        <button
                          key={reservation.id}
                          type="button"
                          onClick={() => {
                            setSelectedReservation(reservation.id);
                            setSearchTerm(refNo);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors border-b border-slate-300 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {customer?.name || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {refNo} • Room {room?.roomNumber || "N/A"} •{" "}
                                {reservation.checkIn} to {reservation.checkOut}
                              </p>
                            </div>
                            <Calendar className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              } else if (matches.length === 0) {
                return (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-sm text-red-400">
                      No reservation found matching your search
                    </p>
                  </div>
                );
              }
              return null;
            })()}

          {selectedReservationData &&
            (() => {
              const customer = customers.find(
                (c) => c.id === selectedReservationData.customerId
              );
              const room = rooms.find(
                (r) => r.id === selectedReservationData.roomId
              );
              return (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      Selected Reservation Details
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Guest Name</p>
                      <p className="text-sm font-semibold text-white">
                        {customer?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Room Number</p>
                      <p className="text-sm font-semibold text-white">
                        {room?.roomNumber || "N/A"}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Stay Period</p>
                      <p className="text-sm font-semibold text-white">
                        {selectedReservationData.checkIn}
                      </p>
                      <p className="text-xs text-gray-400">
                        to {selectedReservationData.checkOut}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">
                        Services Total
                      </p>
                      <p className="text-lg font-bold text-green-400">
                        LKR {selectedReservationTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          {!selectedReservationData && (
            <div className="bg-white/30 border border-slate-300 rounded-lg p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                Select a reservation to view details and add services
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by guest name, reservation no, service name, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "All" | "Pending" | "Completed" | "Cancelled"
              )
            }
            className="px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Add-ons Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-white/30 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Add-on Services</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filteredAddons.length} service
            {filteredAddons.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Reservation
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Guest / Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Service Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-right">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-right">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-center">
                  Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAddons.map((addon) => (
                <tr
                  key={addon.id}
                  className="hover:bg-blue-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-sm font-medium">
                      {addon.reservationNo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {addon.guestName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Room {addon.roomNo}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-white mb-0.5">
                        {addon.serviceName}
                      </p>
                      <p className="text-xs text-gray-400 mb-1">
                        {addon.unitType}
                      </p>
                      {addon.isInvoiced && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          Invoiced
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {addon.serviceDate}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {addon.serviceTime}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-white">
                      {addon.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-slate-700">
                      {addon.unitPrice.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-green-400">
                        {addon.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        addon.billingMethod === "Cash"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : addon.billingMethod === "Room"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      }`}
                    >
                      {addon.billingMethod}
                      {addon.referenceNo && (
                        <span className="ml-1 text-xs opacity-75">
                          ({addon.referenceNo})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        addon.status === "Completed"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : addon.status === "Pending"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {addon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(addon)}
                        disabled={addon.isInvoiced}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          addon.isInvoiced
                            ? "text-gray-600 cursor-not-allowed opacity-50"
                            : "text-blue-400 hover:bg-blue-500/20 hover:scale-110"
                        }`}
                        title={
                          addon.isInvoiced
                            ? "Cannot edit invoiced service"
                            : "Edit service"
                        }
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addon)}
                        disabled={addon.isInvoiced}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          addon.isInvoiced
                            ? "text-gray-600 cursor-not-allowed opacity-50"
                            : "text-red-400 hover:bg-red-500/20 hover:scale-110"
                        }`}
                        title={
                          addon.isInvoiced
                            ? "Cannot delete invoiced service"
                            : "Delete service"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAddons.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/50 mb-4">
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-base font-medium">
                No add-on services found
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {selectedReservation
                  ? "Add services to this reservation to get started"
                  : "Select a reservation and add services"}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-8 py-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/30 rounded-xl">
                  <Plus className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Add Service to Reservation
                  </h2>
                  <p className="text-sm text-slate-700 mt-1">
                    Select and configure service details
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1: Service Configuration Screen */}
            {currentStep === 1 && (
              <form
                onSubmit={handleAddToCart}
                className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400 font-bold">1</span>
                    </div>
                    Service Configuration
                  </h3>
                  <div className="text-sm text-gray-400">Step 1 of 2</div>
                </div>

                {/* Show pending services count */}
                {pendingServices.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-300">
                          {pendingServices.length} Service
                          {pendingServices.length !== 1 ? "s" : ""} Added
                        </p>
                        <p className="text-xs text-green-400/80 mt-1">
                          You can add more services or proceed to confirmation
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleProceedToConfirmation}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Proceed to Confirmation →
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Section A: Service Configuration (Left - 2/3 width) */}

                  <div className="space-y-6">
                    {/* 2.1 Select Service */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        Select Service <span className="text-red-400">*</span>
                      </label>
                      <select
                        required
                        value={formData.serviceId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serviceId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer hover:border-gray-500 hover:bg-white"
                      >
                        <option value="">Choose a service...</option>
                        {reservationServices.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.serviceName} — LKR{" "}
                            {service.price.toLocaleString()} /{" "}
                            {service.unitType}
                          </option>
                        ))}
                      </select>
                      {selectedService?.description && (
                        <p className="text-xs text-gray-400 mt-2 italic">
                          "{selectedService.description}"
                        </p>
                      )}
                    </div>

                    {/* 2.2 Quantity and Total */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2">
                          Quantity / Duration{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="0.1"
                            step="0.1"
                            value={formData.quantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                quantity: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Enter quantity"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Enter number of units or days
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2">
                          Calculated Total
                        </label>
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/40 rounded-xl p-4 h-[58px] flex items-center justify-end">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-400">LKR</span>
                            <span className="text-3xl font-bold text-green-400">
                              {calculatedTotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-right">
                          {selectedService &&
                            `${selectedService.price.toLocaleString()} × ${
                              formData.quantity || 0
                            }`}
                        </p>
                      </div>
                    </div>

                    {/* 2.4 & 2.5 Service Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Service Date <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.serviceDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              serviceDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Service Time <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.serviceTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              serviceTime: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* 3. Billing Mode */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Billing Mode <span className="text-red-400">*</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-4">
                        Choose how this service will be billed:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Cash Mode */}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              billingMethod: "Cash",
                              referenceNumber: "",
                            })
                          }
                          className={`relative px-5 py-6 rounded-xl border-2 transition-all duration-200 ${
                            formData.billingMethod === "Cash"
                              ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30"
                              : "border-slate-300/50 bg-white/30 hover:border-gray-500 hover:bg-white/50"
                          }`}
                        >
                          {formData.billingMethod === "Cash" && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-5xl mb-3">💵</div>
                            <div
                              className={`text-base font-bold mb-1 ${
                                formData.billingMethod === "Cash"
                                  ? "text-blue-200"
                                  : "text-slate-700"
                              }`}
                            >
                              Cash
                            </div>
                            <div
                              className={`text-xs ${
                                formData.billingMethod === "Cash"
                                  ? "text-blue-300"
                                  : "text-gray-500"
                              }`}
                            >
                              (Non-Resident)
                            </div>
                            <p
                              className={`text-xs mt-2 ${
                                formData.billingMethod === "Cash"
                                  ? "text-blue-300/90"
                                  : "text-gray-500"
                              }`}
                            >
                              Payment required immediately
                            </p>
                          </div>
                        </button>

                        {/* Room Charge Mode */}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              billingMethod: "Room",
                              referenceNumber: "",
                            })
                          }
                          className={`relative px-5 py-6 rounded-xl border-2 transition-all duration-200 ${
                            formData.billingMethod === "Room"
                              ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30"
                              : "border-slate-300/50 bg-white/30 hover:border-gray-500 hover:bg-white/50"
                          }`}
                        >
                          {formData.billingMethod === "Room" && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-5xl mb-3">🏨</div>
                            <div
                              className={`text-base font-bold mb-1 ${
                                formData.billingMethod === "Room"
                                  ? "text-purple-200"
                                  : "text-slate-700"
                              }`}
                            >
                              Room Charge
                            </div>
                            <div
                              className={`text-xs ${
                                formData.billingMethod === "Room"
                                  ? "text-purple-300"
                                  : "text-gray-500"
                              }`}
                            >
                              (Checked-in Guest)
                            </div>
                            <p
                              className={`text-xs mt-2 ${
                                formData.billingMethod === "Room"
                                  ? "text-purple-300/90"
                                  : "text-gray-500"
                              }`}
                            >
                              Posts directly to guest invoice
                            </p>
                          </div>
                        </button>

                        {/* Reference No. Mode */}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              billingMethod: "Reference No.",
                            })
                          }
                          className={`relative px-5 py-6 rounded-xl border-2 transition-all duration-200 ${
                            formData.billingMethod === "Reference No."
                              ? "border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/30"
                              : "border-slate-300/50 bg-white/30 hover:border-gray-500 hover:bg-white/50"
                          }`}
                        >
                          {formData.billingMethod === "Reference No." && (
                            <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-white text-sm font-bold">
                                ✓
                              </span>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-5xl mb-3">📄</div>
                            <div
                              className={`text-base font-bold mb-1 ${
                                formData.billingMethod === "Reference No."
                                  ? "text-orange-200"
                                  : "text-slate-700"
                              }`}
                            >
                              Reference No.
                            </div>
                            <div
                              className={`text-xs ${
                                formData.billingMethod === "Reference No."
                                  ? "text-orange-300"
                                  : "text-gray-500"
                              }`}
                            >
                              (External Billing)
                            </div>
                            <p
                              className={`text-xs mt-2 ${
                                formData.billingMethod === "Reference No."
                                  ? "text-orange-300/90"
                                  : "text-gray-500"
                              }`}
                            >
                              Charge billed to corporate / third party
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* Conditional Fields Based on Billing Mode */}
                      {formData.billingMethod === "Cash" && (
                        <div className="bg-blue-500/10 border-2 border-blue-500/40 rounded-xl p-5 animate-fadeIn">
                          <label className="block text-sm font-bold text-white mb-2">
                            Customer Name{" "}
                            <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={customerName}
                            readOnly
                            placeholder="Customer name (from main form)"
                            className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                          <p className="text-xs text-blue-300/80 mt-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Required for cash payment identification
                          </p>
                        </div>
                      )}

                      {formData.billingMethod === "Room" &&
                        selectedReservationData && (
                          <div className="bg-purple-500/10 border-2 border-purple-500/40 rounded-xl p-5 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">
                                  Room Number
                                </label>
                                <div className="px-4 py-3 bg-white/70 border border-slate-300 rounded-lg text-white font-bold">
                                  {rooms.find(
                                    (r) =>
                                      r.id === selectedReservationData.roomId
                                  )?.roomNumber || "N/A"}
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-2">
                                  Guest Name
                                </label>
                                <div className="px-4 py-3 bg-white/70 border border-slate-300 rounded-lg text-white font-bold truncate">
                                  {customers.find(
                                    (c) =>
                                      c.id ===
                                      selectedReservationData.customerId
                                  )?.name || "Unknown"}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-purple-300/80 mt-3 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Room and guest details have been auto-loaded from
                              reservation.
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Reference Number Field (conditional) */}
                    {formData.billingMethod === "Reference No." && (
                      <div className="bg-orange-500/10 border-2 border-orange-500/40 rounded-xl p-5 animate-fadeIn">
                        <label className="block text-sm font-bold text-white mb-2">
                          Reference Number{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.referenceNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              referenceNumber: e.target.value,
                            })
                          }
                          placeholder="Enter reservation or event reference number"
                          className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        />
                        <p className="text-xs text-orange-300/80 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Example: RES-2025-001 or EVT-2025-001
                        </p>
                      </div>
                    )}

                    {/* 4. Service Status */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        Service Status <span className="text-red-400">*</span>
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            status: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer hover:border-gray-500"
                      >
                        <option value="Pending">
                          ⏱️ Pending — Yet to be delivered/consumed
                        </option>
                        <option value="Completed">
                          ✅ Completed — Service delivered
                        </option>
                        <option value="Cancelled">
                          ❌ Cancelled — Before invoice posting
                        </option>
                      </select>
                    </div>

                    {/* 5. Additional Notes */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        placeholder="Add any special instructions or notes..."
                        style={{ minHeight: "90px" }}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Optional: Add special requirements or delivery
                        instructions
                      </p>
                    </div>

                    {/* 6. Price Lock Notice */}
                    <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-200 mb-1 flex items-center gap-2">
                            🔒 Price Lock Notice
                          </p>
                          <p className="text-xs text-blue-200/80 leading-relaxed">
                            The service price is locked at the time of
                            assignment. Any future price updates will not affect
                            this booking, ensuring billing accuracy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Step 1 */}
                  <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-700">
                    <Button
                      type="button"
                      onClick={handleCloseAddModal}
                      className="bg-gray-600 hover:bg-gray-500"
                    >
                      Cancel
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Service to List
                      </Button>
                      {pendingServices.length > 0 && (
                        <Button
                          type="button"
                          onClick={handleProceedToConfirmation}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Review & Confirm ({pendingServices.length}) →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: Service Confirmation Screen */}
            {currentStep === 2 && (
              <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-green-400 font-bold">2</span>
                    </div>
                    Confirm Services
                  </h3>
                  <div className="text-sm text-gray-400">Step 2 of 2</div>
                </div>

                {/* Customer/Billing Information */}
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 mb-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Billing Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Billing Mode</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          billingMode === "Cash"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : billingMode === "Room"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        }`}
                      >
                        {billingMode}
                      </span>
                    </div>
                    {billingMode === "Cash" && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Customer Name
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {customerName}
                        </p>
                      </div>
                    )}
                    {billingMode === "Room" && selectedReservationData && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Room Number
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {roomNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Guest Name
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {customers.find(
                              (c) => c.id === selectedReservationData.customerId
                            )?.name || "Unknown"}
                          </p>
                        </div>
                      </>
                    )}
                    {billingMode === "Reference No." && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">
                          Reference Number
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {referenceNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services List */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-sm font-bold text-white mb-4">
                    Services to be Added ({pendingServices.length})
                  </h4>
                  {pendingServices.map((service, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/60 border border-gray-700 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h5 className="text-base font-bold text-white mb-1">
                            {service.serviceName}
                          </h5>
                          {service.serviceDescription && (
                            <p className="text-xs text-gray-400 mb-3">
                              {service.serviceDescription}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleRemoveService(index)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Quantity</p>
                          <p className="text-white font-semibold">
                            {service.quantity} {service.unitType}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Unit Price
                          </p>
                          <p className="text-white font-semibold">
                            LKR {service.unitPrice.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Total</p>
                          <p className="text-green-400 font-bold text-base">
                            LKR{" "}
                            {(
                              parseFloat(service.quantity) * service.unitPrice
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Status</p>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                              service.status === "Completed"
                                ? "bg-green-500/20 text-green-300"
                                : service.status === "Cancelled"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {service.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-700">
                        <div>
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Service Date
                          </p>
                          <p className="text-white text-sm">
                            {service.serviceDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Service Time
                          </p>
                          <p className="text-white text-sm">
                            {service.serviceTime}
                          </p>
                        </div>
                      </div>

                      {service.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400 mb-1">Notes</p>
                          <p className="text-white text-sm">{service.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-2 border-green-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Grand Total</p>
                      <p className="text-3xl font-bold text-green-400">
                        LKR{" "}
                        {pendingServices
                          .reduce(
                            (sum, s) =>
                              sum + parseFloat(s.quantity) * s.unitPrice,
                            0
                          )
                          .toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pendingServices.length} service
                        {pendingServices.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-400/30" />
                  </div>
                </div>

                {/* Action Buttons for Step 2 */}
                <div className="flex justify-between gap-3 pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    onClick={handleBackToConfiguration}
                    className="bg-gray-600 hover:bg-gray-500"
                  >
                    ← Back to Configuration
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitAll}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Confirm & Add All Services
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingAddon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-6 py-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Edit2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Edit Service</h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Update service configuration and details
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Service *
                  </label>
                  <select
                    required
                    value={formData.serviceId}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select service</option>
                    {reservationServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.serviceName} - LKR{" "}
                        {service.price.toLocaleString()} ({service.unitType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Total Price
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`LKR ${calculatedTotal.toLocaleString()}`}
                      className="w-full px-4 py-2 bg-gray-600 border border-slate-300 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Service Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.serviceDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceDate: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Service Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.serviceTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serviceTime: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/30">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Billing Mode <span className="text-red-400">*</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          billingMethod: "Cash",
                          referenceNumber: "",
                        })
                      }
                      className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.billingMethod === "Cash"
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-slate-300 bg-white/50 hover:border-gray-500"
                      }`}
                    >
                      {formData.billingMethod === "Cash" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl mb-1">💵</div>
                        <div
                          className={`text-xs font-semibold ${
                            formData.billingMethod === "Cash"
                              ? "text-blue-300"
                              : "text-gray-400"
                          }`}
                        >
                          Cash
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          billingMethod: "Room",
                          referenceNumber: "",
                        })
                      }
                      className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.billingMethod === "Room"
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-slate-300 bg-white/50 hover:border-gray-500"
                      }`}
                    >
                      {formData.billingMethod === "Room" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl mb-1">🏨</div>
                        <div
                          className={`text-xs font-semibold ${
                            formData.billingMethod === "Room"
                              ? "text-purple-300"
                              : "text-gray-400"
                          }`}
                        >
                          Room
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          billingMethod: "Reference No.",
                        })
                      }
                      className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                        formData.billingMethod === "Reference No."
                          ? "border-orange-500 bg-orange-500/20"
                          : "border-slate-300 bg-white/50 hover:border-gray-500"
                      }`}
                    >
                      {formData.billingMethod === "Reference No." && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-2xl mb-1">📄</div>
                        <div
                          className={`text-xs font-semibold ${
                            formData.billingMethod === "Reference No."
                              ? "text-orange-300"
                              : "text-gray-400"
                          }`}
                        >
                          Reference No.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {formData.billingMethod === "Reference No." && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.referenceNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referenceNumber: e.target.value,
                        })
                      }
                      placeholder="Enter reference number for external billing"
                      className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-slate-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="bg-gray-600 hover:bg-gray-500"
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

export default ReservationAddonService;
