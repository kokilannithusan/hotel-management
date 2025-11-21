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
    Building2,
    Receipt,
    CheckCircle,
    X,
} from "lucide-react";
import { useAdditionalService } from "../../context/AdditionalServiceContext";
import { useHotel } from "../../context/HotelContext";
import {
    ReservationServiceAddon,
    Reservation,
    Customer,
} from "../../types/entities";

const ReservationAddonService: React.FC = () => {
    const {
        reservationAddons,
        addReservationAddon,
        updateReservationAddon,
        deleteReservationAddon,
        getReservationAddonTotal,
        getActiveServiceItems,
    } = useAdditionalService();

    const { state, dispatch } = useHotel();
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

    // Four-step process state
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1); // 1 = Billing Mode, 2 = Customer Lookup, 3 = Configuration, 4 = Confirmation
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

    // Billing mode state
    const [billingMode, setBillingMode] = useState<
        "Cash" | "Room" | "Reference No." | null
    >(null);
    const [customerName, setCustomerName] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [referenceNumber, setReferenceNumber] = useState("");

    // Customer lookup and registration state
    const [nicPassportNumber, setNicPassportNumber] = useState("");
    const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
    const [showCustomerRegistrationModal, setShowCustomerRegistrationModal] =
        useState(false);
    const [customerRegistrationForm, setCustomerRegistrationForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nationality: "",
        identificationNumber: "",
        identificationDocumentName: "",
        dob: "",
        country: "",
        city: "",
        addressLine1: "",
        addressLine2: "",
    });

    const [formData, setFormData] = useState({
        serviceId: "",
        quantity: "1",
        serviceDate: new Date().toISOString().split("T")[0],
        serviceTime: "10:00",
        billingMethod: (billingMode || "Room") as "Cash" | "Room" | "Reference No.",
        referenceNumber: "",
        notes: "",
        status: "Pending" as "Pending" | "Completed" | "Cancelled",
    });

    // Service tabs state
    const [selectedServiceTab, setSelectedServiceTab] = useState<string>("all");

    const reservationServices = getActiveServiceItems("Reservation");

    // Get unique service categories
    const serviceCategories = useMemo(() => {
        const categories = new Set<string>();
        reservationServices.forEach((service) => {
            if (service.category) categories.add(service.category);
        });
        return Array.from(categories).sort();
    }, [reservationServices]);

    // Filter services by selected tab
    const filteredServicesByTab = useMemo(() => {
        if (selectedServiceTab === "all") {
            return reservationServices;
        }
        return reservationServices.filter(
            (service) => service.category === selectedServiceTab
        );
    }, [reservationServices, selectedServiceTab]);

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
        setCurrentStep(1);
        setBillingMode(null);
        setShowAddModal(true);
    };

    const handleBillingModeSelect = (mode: "Cash" | "Room" | "Reference No.") => {
        setBillingMode(mode);
        setFormData({
            ...formData,
            billingMethod: mode,
            referenceNumber: "",
        });
        setCustomerName("");
        setRoomNumber("");
        setReferenceNumber("");
        setNicPassportNumber("");
        setFoundCustomer(null);
        setCurrentStep(2);
    };

    // Customer lookup function for Cash mode
    const handleLookupCustomer = () => {
        if (!nicPassportNumber.trim()) {
            alert("Please enter NIC/Passport number");
            return;
        }

        const existingCustomer = customers.find(
            (c) =>
                c.identificationNumber?.toLowerCase() ===
                nicPassportNumber.toLowerCase()
        );

        if (existingCustomer) {
            setFoundCustomer(existingCustomer);
            setCustomerName(existingCustomer.name || "");
        } else {
            // Customer not found, show registration form
            setFoundCustomer(null);
            setCustomerRegistrationForm({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                nationality: "",
                identificationNumber: "",
                identificationDocumentName: "",
                dob: "",
                country: "",
                city: "",
                addressLine1: "",
                addressLine2: "",
            });
            setShowCustomerRegistrationModal(true);
        }
    };

    // Register new customer
    const handleRegisterCustomer = () => {
        if (!customerRegistrationForm.firstName.trim()) {
            alert("Please enter first name");
            return;
        }
        if (!customerRegistrationForm.email.trim()) {
            alert("Please enter email");
            return;
        }
        if (!customerRegistrationForm.phone.trim()) {
            alert("Please enter phone number");
            return;
        }

        const newCustomer: Customer = {
            id: Date.now().toString(),
            name: `${customerRegistrationForm.firstName} ${customerRegistrationForm.lastName}`.trim(),
            firstName: customerRegistrationForm.firstName,
            lastName: customerRegistrationForm.lastName,
            email: customerRegistrationForm.email,
            phone: customerRegistrationForm.phone,
            nationality: customerRegistrationForm.nationality,
            identificationNumber: customerRegistrationForm.identificationNumber,
            identificationDocumentName:
                customerRegistrationForm.identificationDocumentName,
            dob: customerRegistrationForm.dob,
            country: customerRegistrationForm.country,
            city: customerRegistrationForm.city,
            addressLine1: customerRegistrationForm.addressLine1,
            addressLine2: customerRegistrationForm.addressLine2,
            createdAt: new Date().toISOString(),
            status: "new customer",
        };

        dispatch({ type: "ADD_CUSTOMER", payload: newCustomer });
        setFoundCustomer(newCustomer);
        setCustomerName(newCustomer.name);
        setShowCustomerRegistrationModal(false);
    };

    const getBillingModeIcon = (mode: "Cash" | "Room" | "Reference No.") => {
        switch (mode) {
            case "Cash":
                return <DollarSign className="w-6 h-6 text-blue-600" />;
            case "Room":
                return <Building2 className="w-6 h-6 text-purple-600" />;
            case "Reference No.":
                return <Receipt className="w-6 h-6 text-orange-600" />;
            default:
                return <DollarSign className="w-6 h-6 text-blue-600" />;
        }
    };

    const handleProceedToConfirmation = () => {
        if (pendingServices.length === 0) {
            alert("Please add at least one service before proceeding");
            return;
        }
        setCurrentStep(3);
    };

    const handleBackToConfiguration = () => {
        setCurrentStep(3);
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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reservation Add-on Service"
                description="Manage additional services for room reservations"
            />

            {/* Add Service Section */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            Reservation Services
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage additional services for room reservations
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Add Service
                    </Button>
                </div>
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
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${addon.billingMethod === "Cash"
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
                                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${addon.status === "Completed"
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
                                                className={`p-2 rounded-lg transition-all duration-200 ${addon.isInvoiced
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
                                                className={`p-2 rounded-lg transition-all duration-200 ${addon.isInvoiced
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-7xl h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-white to-white">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Add Service to Reservation
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Step {currentStep} of 4
                                </p>
                            </div>
                            <button
                                onClick={handleCloseAddModal}
                                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div className="bg-white px-8 py-6 border-b border-gray-200">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                {/* Step 1 */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all shadow-sm ${currentStep >= 1
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        1
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <div
                                            className={`font-semibold text-sm transition-colors ${currentStep >= 1 ? "text-gray-900" : "text-gray-600"
                                                }`}
                                        >
                                            Billing
                                        </div>
                                        <div
                                            className={`text-xs transition-colors ${currentStep >= 1 ? "text-blue-600" : "text-gray-500"
                                                }`}
                                        >
                                            Mode
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`h-1.5 flex-1 rounded-full transition-all ${currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                ></div>

                                {/* Step 2 */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all shadow-sm ${currentStep >= 2
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        2
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <div
                                            className={`font-semibold text-sm transition-colors ${currentStep >= 2 ? "text-gray-900" : "text-gray-600"
                                                }`}
                                        >
                                            Customer
                                        </div>
                                        <div
                                            className={`text-xs transition-colors ${currentStep >= 2 ? "text-blue-600" : "text-gray-500"
                                                }`}
                                        >
                                            Lookup
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`h-1.5 flex-1 rounded-full transition-all ${currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
                                        }`}
                                ></div>

                                {/* Step 3 */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all shadow-sm ${currentStep >= 3
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        3
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <div
                                            className={`font-semibold text-sm transition-colors ${currentStep >= 3 ? "text-gray-900" : "text-gray-600"
                                                }`}
                                        >
                                            Services
                                        </div>
                                        <div
                                            className={`text-xs transition-colors ${currentStep >= 3 ? "text-blue-600" : "text-gray-500"
                                                }`}
                                        >
                                            Selection
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`h-1.5 flex-1 rounded-full transition-all ${currentStep >= 4 ? "bg-green-600" : "bg-gray-300"
                                        }`}
                                ></div>

                                {/* Step 4 */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all shadow-sm ${currentStep >= 4
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-200 text-gray-600"
                                            }`}
                                    >
                                        4
                                    </div>
                                    <div className="hidden md:block min-w-0">
                                        <div
                                            className={`font-semibold text-sm transition-colors ${currentStep >= 4 ? "text-gray-900" : "text-gray-600"
                                                }`}
                                        >
                                            Review
                                        </div>
                                        <div
                                            className={`text-xs transition-colors ${currentStep >= 4 ? "text-green-600" : "text-gray-500"
                                                }`}
                                        >
                                            Confirm
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center pt-3 border-t border-gray-200 text-gray-700 text-sm font-medium">
                                Step {currentStep} of 4 •
                                {currentStep === 1
                                    ? " Select billing mode"
                                    : currentStep === 2
                                        ? " Customer lookup"
                                        : currentStep === 3
                                            ? " Select services"
                                            : " Review & Confirm"}
                            </div>
                        </div>

                        {/* Step 1: Billing Mode Selection */}
                        {currentStep === 1 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 p-8 overflow-y-auto modal-scrollbar min-h-0">
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                            Select Billing Mode
                                        </h3>
                                        <p className="text-gray-600 ml-13">
                                            Choose how this service will be billed to proceed
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                                        {(["Cash", "Room", "Reference No."] as const).map(
                                            (mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => handleBillingModeSelect(mode)}
                                                    className="p-6 rounded-xl border-2 transition-all duration-200 text-center hover:border-blue-500 hover:bg-blue-50 border-gray-300 bg-white shadow-sm hover:shadow-lg"
                                                >
                                                    <div className="flex justify-center mb-4">
                                                        <div className="p-4 rounded-full bg-blue-100 border border-blue-200">
                                                            {getBillingModeIcon(mode)}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                                        {mode}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {mode === "Cash" && "Immediate payment collected"}
                                                        {mode === "Room" && "Charge to room"}
                                                        {mode === "Reference No." &&
                                                            "Corporate/third-party billing"}
                                                    </p>
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-5 shadow-lg flex justify-center gap-4">
                                    <Button
                                        type="button"
                                        onClick={handleCloseAddModal}
                                        className="px-10 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Customer Lookup (for Cash mode) */}
                        {currentStep === 2 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 overflow-y-auto p-8 modal-scrollbar min-h-0">
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-6 h-6" />
                                            </div>
                                            Customer Lookup
                                        </h3>
                                        <p className="text-gray-600 ml-13">
                                            Find or register a customer for this purchase
                                        </p>
                                    </div>

                                    {billingMode === "Cash" ? (
                                        <div className="space-y-6">
                                            {/* Billing Mode Info */}
                                            <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-4">
                                                <div className="flex items-start gap-3">
                                                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            Billing Mode: Cash
                                                        </h4>
                                                        <p className="text-sm text-gray-700 mt-1">
                                                            Enter customer NIC/Passport number to look up
                                                            existing customer or register a new one.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer Lookup Form */}
                                            <div className="bg-gray-50 rounded-xl p-6">
                                                <label className="block text-sm font-bold text-gray-900 mb-2">
                                                    Customer NIC/Passport Number{" "}
                                                    <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="e.g., AB123456789"
                                                        value={nicPassportNumber}
                                                        onChange={(e) =>
                                                            setNicPassportNumber(e.target.value)
                                                        }
                                                        className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={handleLookupCustomer}
                                                        className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold whitespace-nowrap"
                                                    >
                                                        Lookup
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Found Customer Display */}
                                            {foundCustomer && (
                                                <div className="bg-green-50 border border-green-300 rounded-xl p-6">
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">
                                                                Customer Found
                                                            </h4>
                                                            <p className="text-sm text-gray-700 mt-1">
                                                                Ready to add services
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-4 space-y-3">
                                                        <div>
                                                            <p className="text-xs text-gray-600">Name</p>
                                                            <p className="font-semibold text-gray-900">
                                                                {foundCustomer.name}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <p className="text-xs text-gray-600">Email</p>
                                                                <p className="text-sm text-gray-900">
                                                                    {foundCustomer.email || "N/A"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-600">Phone</p>
                                                                <p className="text-sm text-gray-900">
                                                                    {foundCustomer.phone || "N/A"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Change Customer Button */}
                                            {foundCustomer && (
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setNicPassportNumber("");
                                                        setFoundCustomer(null);
                                                    }}
                                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                                                >
                                                    Change Customer
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-700 font-medium">
                                                Customer lookup is only for Cash billing mode
                                            </p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                You selected: {billingMode || "No billing mode"}
                                            </p>
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentStep(1)}
                                                className="mt-4 bg-blue-600 hover:bg-blue-700"
                                            >
                                                Back to Billing Mode
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Step 2 Navigation */}
                                <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                                    <div className="flex justify-between items-center gap-6">
                                        <Button
                                            type="button"
                                            onClick={() => setCurrentStep(1)}
                                            className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all"
                                        >
                                            ← Back
                                        </Button>

                                        <div className="text-center flex-1">
                                            <div className="text-lg font-bold text-gray-900">
                                                Step 2 of 4
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Customer Lookup
                                            </div>
                                        </div>

                                        {billingMode === "Cash" &&
                                            (foundCustomer || customerName) ? (
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentStep(3)}
                                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all whitespace-nowrap"
                                            >
                                                Next →
                                            </Button>
                                        ) : billingMode !== "Cash" ? (
                                            <Button
                                                type="button"
                                                onClick={() => setCurrentStep(3)}
                                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all whitespace-nowrap"
                                            >
                                                Skip →
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                disabled
                                                className="px-8 py-3 bg-gray-400 text-white rounded-lg font-bold shadow-md cursor-not-allowed whitespace-nowrap"
                                            >
                                                Next →
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Service Configuration Screen */}
                        {currentStep === 3 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 p-8 overflow-y-auto modal-scrollbar min-h-0">
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            Select Services
                                        </h3>
                                        <p className="text-gray-600 ml-13">
                                            Choose the services you want to add
                                            {billingMode && (
                                                <span className="text-gray-600">
                                                    {" •  "}
                                                    {billingMode} billing
                                                </span>
                                            )}
                                        </p>
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
                                        {/* Show pending services count */}
                                        {pendingServices.length > 0 && (
                                            <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="text-sm font-bold text-green-900">
                                                            {pendingServices.length} Service
                                                            {pendingServices.length !== 1 ? "s" : ""} Selected
                                                        </p>
                                                        <p className="text-xs text-green-700 mt-1">
                                                            Click services below to add or remove them
                                                        </p>
                                                    </div>
                                                    {pendingServices.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            onClick={handleProceedToConfirmation}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-6 whitespace-nowrap flex-shrink-0"
                                                        >
                                                            Next →
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Section A: Service Configuration (Left - 2/3 width) */}

                                        <div className="space-y-6">
                                            {/* 3.1 Select Multiple Services with Tabs */}
                                            <div>
                                                <label className="block text-base font-bold text-gray-900 mb-4">
                                                    Available Services
                                                </label>

                                                {/* Service Category Tabs */}
                                                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedServiceTab("all")}
                                                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedServiceTab === "all"
                                                            ? "bg-blue-600 text-white shadow-md"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                            }`}
                                                    >
                                                        All Services
                                                    </button>
                                                    {serviceCategories.map((category) => (
                                                        <button
                                                            key={category}
                                                            type="button"
                                                            onClick={() => setSelectedServiceTab(category)}
                                                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedServiceTab === category
                                                                ? "bg-blue-600 text-white shadow-md"
                                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                                }`}
                                                        >
                                                            {category}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Service Selection Grid with Checkboxes */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {filteredServicesByTab.map((service) => {
                                                        const isSelected = pendingServices.some(
                                                            (s) => s.serviceId === service.id
                                                        );
                                                        return (
                                                            <button
                                                                key={service.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        // Remove service
                                                                        setPendingServices(
                                                                            pendingServices.filter(
                                                                                (s) => s.serviceId !== service.id
                                                                            )
                                                                        );
                                                                    } else {
                                                                        // Add service
                                                                        setPendingServices([
                                                                            ...pendingServices,
                                                                            {
                                                                                serviceId: service.id,
                                                                                serviceName: service.serviceName,
                                                                                serviceDescription:
                                                                                    service.description || "",
                                                                                quantity: "1",
                                                                                unitPrice: service.price,
                                                                                unitType: service.unitType,
                                                                                serviceDate: new Date()
                                                                                    .toISOString()
                                                                                    .split("T")[0],
                                                                                serviceTime: "10:00",
                                                                                status: "Pending",
                                                                                notes: "",
                                                                            },
                                                                        ]);
                                                                    }
                                                                }}
                                                                className={`p-4 rounded-lg border-2 text-left transition-all flex items-start gap-3 ${isSelected
                                                                    ? "border-blue-600 bg-blue-50 shadow-md"
                                                                    : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm"
                                                                    }`}
                                                            >
                                                                <div
                                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected
                                                                        ? "bg-blue-600 border-blue-600"
                                                                        : "border-gray-400 bg-white"
                                                                        }`}
                                                                >
                                                                    {isSelected && (
                                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-gray-900">
                                                                        {service.serviceName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        LKR {service.price.toLocaleString()} /{" "}
                                                                        {service.unitType}
                                                                    </div>
                                                                    {service.description && (
                                                                        <div className="text-xs text-gray-500 mt-2 italic">
                                                                            {service.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {filteredServicesByTab.length === 0 && (
                                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500">
                                                            No services available in this category
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 3.2 Quantity */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-2">
                                                        Quantity / Duration{" "}
                                                        <span className="text-red-500">*</span>
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
                                                            className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                            placeholder="Enter quantity"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Enter number of units or days
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-2">
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
                                                            `${selectedService.price.toLocaleString()} × ${formData.quantity || 0
                                                            }`}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* 2.4 & 2.5 Service Date and Time */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        Service Date <span className="text-red-500">*</span>
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
                                                        className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        Service Time <span className="text-red-500">*</span>
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
                                                        className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* 3. Service Status */}
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
                                                    className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer hover:border-gray-500"
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

                                            {/* 4. Additional Notes */}
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
                                                    className="w-full px-4 py-3.5 bg-white/50 border-2 border-slate-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
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
                                                            assignment. Any future price updates will not
                                                            affect this booking, ensuring billing accuracy.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 Navigation Buttons */}
                                <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                                    <div className="flex justify-between items-center gap-6">
                                        <Button
                                            type="button"
                                            onClick={() => setCurrentStep(2)}
                                            className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all"
                                        >
                                            ← Back
                                        </Button>

                                        <div className="text-center flex-1">
                                            <div className="text-lg font-bold text-gray-900">
                                                Step 3 of 4
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Select Services
                                            </div>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (pendingServices.length > 0) {
                                                    setCurrentStep(4);
                                                } else {
                                                    alert("Please select at least one service");
                                                }
                                            }}
                                            disabled={pendingServices.length === 0}
                                            className={`px-8 py-3 text-white rounded-lg font-bold shadow-md transition-all whitespace-nowrap ${pendingServices.length > 0
                                                ? "bg-blue-600 hover:bg-blue-700"
                                                : "bg-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            Next ({pendingServices.length}) →
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Service Confirmation Screen */}
                        {currentStep === 4 && (
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex-1 overflow-y-auto p-8 modal-scrollbar min-h-0">
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            Confirm Services
                                        </h3>
                                        <p className="text-gray-600 ml-13">
                                            Review your selection before submitting
                                        </p>
                                    </div>

                                    {/* Customer/Billing Information */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                                        <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-600" />
                                            Billing Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <p className="text-xs text-gray-600 mb-2 font-medium">
                                                    Billing Mode
                                                </p>
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${billingMode === "Cash"
                                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                        : billingMode === "Room"
                                                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                                                            : "bg-orange-100 text-orange-700 border border-orange-200"
                                                        }`}
                                                >
                                                    {billingMode}
                                                </span>
                                            </div>
                                            {billingMode === "Cash" && (
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        Customer Name
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {customerName}
                                                    </p>
                                                </div>
                                            )}
                                            {billingMode === "Room" && selectedReservationData && (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            Room Number
                                                        </p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {roomNumber}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">
                                                            Guest Name
                                                        </p>
                                                        <p className="text-sm font-semibold text-white">
                                                            {customers.find(
                                                                (c) =>
                                                                    c.id === selectedReservationData.customerId
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
                                    <div className="space-y-4 mb-8">
                                        <h4 className="text-base font-bold text-gray-900 mb-4">
                                            Services to be Added ({pendingServices.length})
                                        </h4>
                                        {pendingServices.map((service, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-50 border border-gray-200 rounded-xl p-5"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex-1">
                                                        <h5 className="text-base font-bold text-gray-900 mb-1">
                                                            {service.serviceName}
                                                        </h5>
                                                        {service.serviceDescription && (
                                                            <p className="text-xs text-gray-600 mb-3">
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
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            Quantity
                                                        </p>
                                                        <p className="text-gray-900 font-semibold">
                                                            {service.quantity} {service.unitType}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">
                                                            Unit Price
                                                        </p>
                                                        <p className="text-gray-900 font-semibold">
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
                                                        <p className="text-xs text-gray-600 mb-1">Status</p>
                                                        <span
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${service.status === "Completed"
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

                                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            Service Date
                                                        </p>
                                                        <p className="text-gray-900 text-sm">
                                                            {service.serviceDate}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Service Time
                                                        </p>
                                                        <p className="text-gray-900 text-sm">
                                                            {service.serviceTime}
                                                        </p>
                                                    </div>
                                                </div>

                                                {service.notes && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-gray-600 mb-1">Notes</p>
                                                        <p className="text-gray-900 text-sm">
                                                            {service.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total Summary */}
                                    <div className="bg-gradient-to-r from-green-50 to-green-50 border-2 border-green-300 rounded-xl p-8 mb-8">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-2 font-medium">
                                                    Grand Total
                                                </p>
                                                <p className="text-4xl font-bold text-green-600">
                                                    LKR{" "}
                                                    {pendingServices
                                                        .reduce(
                                                            (sum, s) =>
                                                                sum + parseFloat(s.quantity) * s.unitPrice,
                                                            0
                                                        )
                                                        .toLocaleString()}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-2">
                                                    {pendingServices.length} service
                                                    {pendingServices.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <DollarSign className="w-12 h-12 text-green-300/50" />
                                        </div>
                                    </div>

                                    {/* Action Buttons for Step 4 */}
                                    <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-6 shadow-lg">
                                        <div className="flex justify-between items-center gap-6">
                                            <Button
                                                type="button"
                                                onClick={handleBackToConfiguration}
                                                className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md transition-all"
                                            >
                                                ← Back
                                            </Button>

                                            <div className="text-center flex-1">
                                                <div className="text-lg font-bold text-gray-900">
                                                    Step 4 of 4
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Final Verification
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={handleSubmitAll}
                                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md transition-all whitespace-nowrap"
                                            >
                                                ✓ SUBMIT
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Service *
                                    </label>

                                    {/* Service Category Tabs */}
                                    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedServiceTab("all")}
                                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedServiceTab === "all"
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                }`}
                                        >
                                            All Services
                                        </button>
                                        {serviceCategories.map((category) => (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setSelectedServiceTab(category)}
                                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedServiceTab === category
                                                    ? "bg-blue-600 text-white shadow-md"
                                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                    }`}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Service Grid */}
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                        {filteredServicesByTab.map((service) => (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        serviceId: service.id,
                                                    })
                                                }
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${formData.serviceId === service.id
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-300 bg-white hover:border-blue-400"
                                                    }`}
                                            >
                                                <div className="font-semibold text-gray-900">
                                                    {service.serviceName}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    LKR {service.price.toLocaleString()} /{" "}
                                                    {service.unitType}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {filteredServicesByTab.length === 0 && (
                                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                            No services available in this category
                                        </div>
                                    )}
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
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-4 py-2 bg-gray-100 border border-slate-300 rounded-lg text-gray-900"
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
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${formData.billingMethod === "Cash"
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
                                                    className={`text-xs font-semibold ${formData.billingMethod === "Cash"
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
                                            className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${formData.billingMethod === "Room"
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
                                                    className={`text-xs font-semibold ${formData.billingMethod === "Room"
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
                                            className={`relative px-3 py-3 rounded-lg border-2 transition-all duration-200 ${formData.billingMethod === "Reference No."
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
                                                    className={`text-xs font-semibold ${formData.billingMethod === "Reference No."
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
                                            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Customer Registration Modal */}
            {showCustomerRegistrationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-3xl h-[90vh] shadow-2xl flex flex-col overflow-hidden rounded-lg bg-white">
                        {/* Fixed Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 border-b border-blue-700 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Register New Customer
                                    </h3>
                                    <p className="text-sm text-blue-100 mt-1">
                                        Customer not found. Please register to proceed.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCustomerRegistrationModal(false)}
                                className="text-white hover:text-blue-100 transition-colors flex-shrink-0"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleRegisterCustomer();
                            }}
                            className="flex-1 overflow-y-scroll customer-registration-form scrollbar-hide"
                        >
                            <div className="p-8 space-y-6">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-blue-200">
                                            Fill in the customer details below. All required fields
                                            marked with * must be completed.
                                        </p>
                                    </div>
                                </div>

                                {/* Full Name Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            First Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerRegistrationForm.firstName}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    firstName: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., John"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={customerRegistrationForm.lastName}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    lastName: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Smith"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Email Address <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={customerRegistrationForm.email}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    email: e.target.value,
                                                })
                                            }
                                            placeholder="john.smith@email.com"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Phone Number <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={customerRegistrationForm.phone}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    phone: e.target.value,
                                                })
                                            }
                                            placeholder="+1 234 567 8900"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Identification */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            NIC/Passport Number{" "}
                                            <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={customerRegistrationForm.identificationNumber}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    identificationNumber: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., 123456789V"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={customerRegistrationForm.nationality}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    nationality: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Sri Lankan"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Date of Birth & Country */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={customerRegistrationForm.dob}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    dob: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            value={customerRegistrationForm.country}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    country: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Sri Lanka"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* City & Address */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            value={customerRegistrationForm.city}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    city: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Colombo"
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-black mb-2">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            value={customerRegistrationForm.addressLine2}
                                            onChange={(e) =>
                                                setCustomerRegistrationForm({
                                                    ...customerRegistrationForm,
                                                    addressLine2: e.target.value,
                                                })
                                            }
                                            placeholder="Apt, suite, building, etc."
                                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Full Width Address Line 1 */}
                                <div>
                                    <label className="block text-sm font-bold text-black mb-2">
                                        Address Line 1
                                    </label>
                                    <input
                                        type="text"
                                        value={customerRegistrationForm.addressLine1}
                                        onChange={(e) =>
                                            setCustomerRegistrationForm({
                                                ...customerRegistrationForm,
                                                addressLine1: e.target.value,
                                            })
                                        }
                                        placeholder="Street address or building name"
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Sticky Form Actions */}
                        <div className="bg-white border-t border-gray-200 px-8 py-6 flex justify-end gap-3 flex-shrink-0">
                            <Button
                                type="button"
                                onClick={() => setShowCustomerRegistrationModal(false)}
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                onClick={() => {
                                    const form = document.querySelector(
                                        ".customer-registration-form"
                                    );
                                    if (form)
                                        form.dispatchEvent(new Event("submit", { bubbles: true }));
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Register Customer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationAddonService;
