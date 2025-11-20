import React, { useState, useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  DollarSign,
  Building2,
  Receipt,
  Search,
  Plus,
  Minus,
  Calendar,
  Clock,
  User,
  Package,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  MapPin,
  Users,
  Phone,
  Building,
  PartyPopper,
  ShoppingCart,
  History,
  TrendingUp,
  Activity,
  CreditCard,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Settings,
  ArrowLeft,
  ArrowRight,
  Target,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { formatCurrency } from "../../utils/formatters";

type BillingModeType = "Cash" | "Event Invoice" | "Reference No.";
type ServiceStatusType = "Pending" | "Completed" | "Canceled";

interface EventAddon {
  id: string;
  eventId: string;
  eventReferenceNo: string;
  organizerName: string;
  companyName?: string;
  hallName: string;
  eventDate: string;
  eventTime: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  billingMode: BillingModeType;
  customerName?: string; // For Cash mode
  referenceNumber?: string; // For Reference No. mode
  serviceDate: string;
  serviceTime: string;
  status: ServiceStatusType;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
  completedBy?: string;
  completedAt?: string;
  isInvoiced?: boolean;
  invoiceId?: string;
  auditLog: Array<{
    action: string;
    by: string;
    at: string;
    oldValue?: any;
    newValue?: any;
    details: string;
  }>;
}

interface EventInfo {
  id: string;
  referenceNo: string;
  title: string;
  organizerName: string;
  organizerPhone?: string;
  organizerEmail?: string;
  companyName?: string;
  hallName: string;
  eventDate: string;
  eventTime: string;
  endTime?: string;
  isActive: boolean;
  invoiceFinalized: boolean;
  totalGuests?: number;
  eventType?: string;
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  unit: string; // "per item", "per hour", "per day", etc.
  category: string;
  isActive: boolean;
}

const EventAddonService: React.FC = () => {
  // State management
  const [eventAddons, setEventAddons] = useState<EventAddon[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ServiceStatusType>(
    "All"
  );
  const [billingModeFilter, setBillingModeFilter] = useState<
    "All" | BillingModeType
  >("All");
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<EventAddon | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBillingMode, setSelectedBillingMode] =
    useState<BillingModeType | null>(null);
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Multiple services selection
  const [selectedServices, setSelectedServices] = useState<
    Array<{
      serviceId: string;
      quantity: number;
      notes: string;
    }>
  >([]);

  // Common configuration for all services
  const [commonConfig, setCommonConfig] = useState({
    serviceDate: "",
    serviceTime: "",
    customerName: "",
    referenceNumber: "",
    status: "Pending" as ServiceStatusType,
  });

  // Mock data for events (in real app, this would come from EventContext)
  const mockEvents: EventInfo[] = [
    {
      id: "evt001",
      referenceNo: "EVT-2025-001",
      title: "Corporate Annual Gala",
      organizerName: "Sarah Johnson",
      organizerPhone: "+94771234567",
      organizerEmail: "sarah@techcorp.lk",
      companyName: "TechCorp Solutions",
      hallName: "Grand Ballroom",
      eventDate: "2025-11-25",
      eventTime: "18:00",
      endTime: "23:00",
      isActive: true,
      invoiceFinalized: false,
      totalGuests: 150,
      eventType: "Corporate Event",
    },
    {
      id: "evt002",
      referenceNo: "EVT-2025-002",
      title: "Wedding Reception",
      organizerName: "Michael & Emma Silva",
      organizerPhone: "+94772345678",
      companyName: "",
      hallName: "Crystal Hall",
      eventDate: "2025-11-28",
      eventTime: "17:00",
      endTime: "24:00",
      isActive: true,
      invoiceFinalized: false,
      totalGuests: 200,
      eventType: "Wedding",
    },
    {
      id: "evt003",
      referenceNo: "EVT-2025-003",
      title: "Product Launch",
      organizerName: "David Chen",
      organizerPhone: "+94773456789",
      organizerEmail: "david@innovate.lk",
      companyName: "Innovate Ltd",
      hallName: "Conference Center",
      eventDate: "2025-12-01",
      eventTime: "14:00",
      endTime: "18:00",
      isActive: true,
      invoiceFinalized: true,
      totalGuests: 80,
      eventType: "Corporate Event",
    },
  ];

  // Mock service items (in real app, this would come from AdditionalServiceContext)
  const mockServiceItems: ServiceItem[] = [
    {
      id: "svc001",
      name: "Additional Audio System",
      description: "Professional sound system with wireless microphones",
      unitPrice: 25000,
      unit: "per day",
      category: "Equipment",
      isActive: true,
    },
    {
      id: "svc002",
      name: "LED Stage Lighting",
      description: "Professional LED lighting setup with color control",
      unitPrice: 35000,
      unit: "per event",
      category: "Equipment",
      isActive: true,
    },
    {
      id: "svc003",
      name: "Live Band Setup",
      description: "Complete band setup with instruments and amplification",
      unitPrice: 75000,
      unit: "per event",
      category: "Entertainment",
      isActive: true,
    },
    {
      id: "svc004",
      name: "Floral Arrangements",
      description: "Premium floral decorations for tables and stage",
      unitPrice: 15000,
      unit: "per arrangement",
      category: "Decoration",
      isActive: true,
    },
    {
      id: "svc005",
      name: "Photography Service",
      description: "Professional event photography with editing",
      unitPrice: 50000,
      unit: "per event",
      category: "Photography",
      isActive: true,
    },
    {
      id: "svc006",
      name: "Extended Hall Hours",
      description: "Additional hall rental beyond standard package",
      unitPrice: 12000,
      unit: "per hour",
      category: "Venue",
      isActive: true,
    },
    {
      id: "svc007",
      name: "Cocktail Bar Service",
      description: "Professional bartender with premium beverages",
      unitPrice: 40000,
      unit: "per event",
      category: "F&B",
      isActive: true,
    },
    {
      id: "svc008",
      name: "Transportation Service",
      description: "Guest transportation from hotel to venue",
      unitPrice: 8000,
      unit: "per trip",
      category: "Transportation",
      isActive: true,
    },
  ];

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    return mockEvents.filter(
      (event) =>
        event.referenceNo
          .toLowerCase()
          .includes(eventSearchTerm.toLowerCase()) ||
        event.organizerName
          .toLowerCase()
          .includes(eventSearchTerm.toLowerCase()) ||
        event.title.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
        event.companyName
          ?.toLowerCase()
          .includes(eventSearchTerm.toLowerCase()) ||
        event.organizerPhone?.includes(eventSearchTerm)
    );
  }, [eventSearchTerm]);

  // Filter addons
  const filteredAddons = useMemo(() => {
    return eventAddons.filter((addon) => {
      if (addon.deletedAt) return false;

      const matchesSearch =
        addon.eventReferenceNo
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        addon.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addon.hallName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || addon.status === statusFilter;
      const matchesBillingMode =
        billingModeFilter === "All" || addon.billingMode === billingModeFilter;

      return matchesSearch && matchesStatus && matchesBillingMode;
    });
  }, [eventAddons, searchTerm, statusFilter, billingModeFilter]);

  // Handle billing mode selection
  const handleBillingModeSelect = (mode: BillingModeType) => {
    setSelectedBillingMode(mode);
    setCurrentStep(2);
  };

  // Handle event selection
  const handleEventSelect = (event: EventInfo) => {
    // Validation based on billing mode
    if (selectedBillingMode === "Event Invoice" && event.invoiceFinalized) {
      alert("Cannot add services to finalized invoices");
      return;
    }
    if (selectedBillingMode === "Event Invoice" && !event.isActive) {
      alert("Cannot add services to inactive events");
      return;
    }

    setSelectedEvent(event);
    setCommonConfig({
      ...commonConfig,
      serviceDate: event.eventDate,
      serviceTime: event.eventTime,
    });
    setCurrentStep(3);
  };

  // Handle adding service to selection
  const handleAddServiceToSelection = (serviceId: string) => {
    const isAlreadySelected = selectedServices.some(
      (s) => s.serviceId === serviceId
    );
    if (isAlreadySelected) {
      alert("This service is already selected");
      return;
    }

    setSelectedServices([
      ...selectedServices,
      {
        serviceId,
        quantity: 1,
        notes: "",
      },
    ]);
  };

  // Handle removing service from selection
  const handleRemoveServiceFromSelection = (serviceId: string) => {
    setSelectedServices(
      selectedServices.filter((s) => s.serviceId !== serviceId)
    );
  };

  // Handle updating service quantity
  const handleUpdateServiceQuantity = (serviceId: string, quantity: number) => {
    setSelectedServices(
      selectedServices.map((s) =>
        s.serviceId === serviceId
          ? { ...s, quantity: Math.max(1, quantity) }
          : s
      )
    );
  };

  // Handle updating service notes
  const handleUpdateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(
      selectedServices.map((s) =>
        s.serviceId === serviceId ? { ...s, notes } : s
      )
    );
  };

  // Handle service addition (multiple services)
  const handleAddServices = async () => {
    if (!selectedEvent || !selectedBillingMode || selectedServices.length === 0)
      return;

    // Set loading state
    setIsLoading(true);

    try {
      // Validation
      if (selectedBillingMode === "Cash" && !commonConfig.customerName.trim()) {
        alert("Customer name is required for cash billing");
        return;
      }

      if (
        selectedBillingMode === "Reference No." &&
        !commonConfig.referenceNumber.trim()
      ) {
        alert("Reference number is required");
        return;
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newAddons: EventAddon[] = selectedServices.map(
        (selectedService, index) => {
          const serviceItem = mockServiceItems.find(
            (s) => s.id === selectedService.serviceId
          )!;
          const timestamp = new Date().toISOString();
          const uniqueId = `addon-${Date.now()}-${index}`;

          return {
            id: uniqueId,
            eventId: selectedEvent.id,
            eventReferenceNo: selectedEvent.referenceNo,
            organizerName: selectedEvent.organizerName,
            companyName: selectedEvent.companyName,
            hallName: selectedEvent.hallName,
            eventDate: selectedEvent.eventDate,
            eventTime: selectedEvent.eventTime,
            serviceId: serviceItem.id,
            serviceName: serviceItem.name,
            serviceDescription: serviceItem.description,
            quantity: selectedService.quantity,
            unitPrice: serviceItem.unitPrice,
            totalAmount: serviceItem.unitPrice * selectedService.quantity,
            billingMode: selectedBillingMode,
            customerName:
              selectedBillingMode === "Cash"
                ? commonConfig.customerName
                : undefined,
            referenceNumber:
              selectedBillingMode === "Reference No."
                ? commonConfig.referenceNumber
                : undefined,
            serviceDate: commonConfig.serviceDate,
            serviceTime: commonConfig.serviceTime,
            status: commonConfig.status,
            notes: selectedService.notes || "",
            createdBy: "current_user",
            createdAt: timestamp,
            auditLog: [
              {
                action: "Created",
                by: "current_user",
                at: timestamp,
                details: `Service "${serviceItem.name}" added to event ${selectedEvent.referenceNo}`,
              },
            ],
          };
        }
      );

      setEventAddons([...eventAddons, ...newAddons]);

      // Reset form and modal
      setShowAddServiceModal(false);
      setCurrentStep(1);
      setSelectedBillingMode(null);
      setSelectedEvent(null);
      setSelectedServices([]);
      setCommonConfig({
        serviceDate: "",
        serviceTime: "",
        customerName: "",
        referenceNumber: "",
        status: "Pending",
      });
      clearFormErrors();
    } catch (error) {
      console.error("Error adding services:", error);
      alert("Failed to add services. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total for selected services
  const calculateSelectedServicesTotal = () => {
    return selectedServices.reduce((total, selectedService) => {
      const serviceItem = mockServiceItems.find(
        (s) => s.id === selectedService.serviceId
      );
      return (
        total +
        (serviceItem ? serviceItem.unitPrice * selectedService.quantity : 0)
      );
    }, 0);
  };

  // Handle status update
  const handleStatusUpdate = (
    addonId: string,
    newStatus: ServiceStatusType
  ) => {
    setEventAddons((prev) =>
      prev.map((addon) => {
        if (addon.id === addonId) {
          const updatedAddon = {
            ...addon,
            status: newStatus,
            updatedBy: "current_user",
            updatedAt: new Date().toISOString(),
            completedBy:
              newStatus === "Completed" ? "current_user" : addon.completedBy,
            completedAt:
              newStatus === "Completed"
                ? new Date().toISOString()
                : addon.completedAt,
            auditLog: [
              ...addon.auditLog,
              {
                action: "Status Updated",
                by: "current_user",
                at: new Date().toISOString(),
                oldValue: addon.status,
                newValue: newStatus,
                details: `Status changed from ${addon.status} to ${newStatus}`,
              },
            ],
          };
          return updatedAddon;
        }
        return addon;
      })
    );
  };

  // Handle soft delete
  const handleSoftDelete = (addonId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    setEventAddons((prev) =>
      prev.map((addon) => {
        if (addon.id === addonId) {
          return {
            ...addon,
            deletedBy: "current_user",
            deletedAt: new Date().toISOString(),
            auditLog: [
              ...addon.auditLog,
              {
                action: "Soft Deleted",
                by: "current_user",
                at: new Date().toISOString(),
                details: "Service marked as deleted",
              },
            ],
          };
        }
        return addon;
      })
    );
  };

  // Get status icon
  const getStatusIcon = (status: ServiceStatusType) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Canceled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get status color
  const getStatusColor = (status: ServiceStatusType) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get billing mode icon
  const getBillingModeIcon = (mode: BillingModeType) => {
    switch (mode) {
      case "Cash":
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case "Event Invoice":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case "Reference No.":
        return <Receipt className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get billing mode color
  const getBillingModeColor = (mode: BillingModeType) => {
    switch (mode) {
      case "Cash":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Event Invoice":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Reference No.":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Summary calculations
  const summaryStats = useMemo(() => {
    const activeAddons = eventAddons.filter((addon) => !addon.deletedAt);
    const totalAddons = activeAddons.length;
    const totalRevenue = activeAddons.reduce(
      (sum, addon) => sum + addon.totalAmount,
      0
    );
    const pendingCount = activeAddons.filter(
      (addon) => addon.status === "Pending"
    ).length;
    const completedCount = activeAddons.filter(
      (addon) => addon.status === "Completed"
    ).length;
    const canceledCount = activeAddons.filter(
      (addon) => addon.status === "Canceled"
    ).length;

    return {
      totalAddons,
      totalRevenue,
      pendingCount,
      completedCount,
      canceledCount,
      pendingRevenue: activeAddons
        .filter((addon) => addon.status === "Pending")
        .reduce((sum, addon) => sum + addon.totalAmount, 0),
      completedRevenue: activeAddons
        .filter((addon) => addon.status === "Completed")
        .reduce((sum, addon) => sum + addon.totalAmount, 0),
    };
  }, [eventAddons]);

  // Form validation functions
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (currentStep >= 3 && !commonConfig.serviceDate) {
      errors.serviceDate = "Service date is required";
    }

    if (currentStep >= 3 && !commonConfig.serviceTime) {
      errors.serviceTime = "Service time is required";
    }

    if (
      currentStep >= 3 &&
      selectedBillingMode === "Cash" &&
      !commonConfig.customerName.trim()
    ) {
      errors.customerName = "Customer name is required for cash billing";
    }

    if (
      currentStep >= 3 &&
      selectedBillingMode === "Reference No." &&
      !commonConfig.referenceNumber.trim()
    ) {
      errors.referenceNumber = "Reference number is required";
    }

    if (currentStep >= 3 && selectedServices.length === 0) {
      errors.services = "At least one service must be selected";
    }

    // Validate service date is not before event date
    if (
      currentStep >= 3 &&
      selectedEvent &&
      commonConfig.serviceDate &&
      commonConfig.serviceDate < selectedEvent.eventDate
    ) {
      errors.serviceDate = "Service date cannot be before event date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };

  // Check if form is valid for current step
  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 1) return selectedBillingMode !== null;
    if (currentStep === 2) return selectedEvent !== null;
    if (currentStep === 3) return validateForm();
    if (currentStep === 4) return validateForm();
    return false;
  }, [
    currentStep,
    selectedBillingMode,
    selectedEvent,
    commonConfig,
    selectedServices,
  ]);

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      <PageHeader
        title="Event Add-on Services"
        description="Manage additional services for events with comprehensive billing options"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Add-ons
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summaryStats.totalAddons}
                </p>
                <p className="text-xs text-blue-600 mt-1">Active services</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summaryStats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  All services combined
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summaryStats.pendingCount}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {formatCurrency(summaryStats.pendingRevenue)} value
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {summaryStats.completedCount}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {formatCurrency(summaryStats.completedRevenue)} earned
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search events, organizers, services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "All" | ServiceStatusType)
            }
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
          </select>

          <select
            value={billingModeFilter}
            onChange={(e) =>
              setBillingModeFilter(e.target.value as "All" | BillingModeType)
            }
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Billing Modes</option>
            <option value="Cash">Cash</option>
            <option value="Event Invoice">Event Invoice</option>
            <option value="Reference No.">Reference No.</option>
          </select>

          <Button
            onClick={() => setShowAddServiceModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Enhanced Add-on Services Table */}
      <Card className="overflow-hidden border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Event Add-on Services
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {filteredAddons.length} service
                  {filteredAddons.length !== 1 ? "s" : ""} found
                  {summaryStats.totalRevenue > 0 && (
                    <span className="text-green-600 ml-2">
                      • {formatCurrency(summaryStats.totalRevenue)} total value
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title="Toggle Filters"
              >
                <Filter className="w-5 h-5" />
              </button>

              <button
                className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          {filteredAddons.length > 0 && (
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="w-4 h-4" />
                <span>{summaryStats.pendingCount} Pending</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{summaryStats.completedCount} Completed</span>
              </div>
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                <span>{summaryStats.canceledCount} Canceled</span>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <PartyPopper className="w-4 h-4 text-purple-600" />
                    Event Details
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <User className="w-4 h-4 text-blue-600" />
                    Organizer & Venue
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-green-600" />
                    Service Details
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Schedule
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                    <Target className="w-4 h-4 text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors">
                    Unit Price
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                  </div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors">
                    Total Amount
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 text-yellow-600" />
                    Billing
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 transition-colors">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Status
                  </div>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Settings className="w-4 h-4 text-gray-500" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAddons.map((addon) => (
                <tr
                  key={addon.id}
                  className="hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PartyPopper className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {addon.eventReferenceNo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {addon.eventDate}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {addon.organizerName}
                        </p>
                        {addon.companyName && (
                          <p className="text-xs text-blue-600">
                            {addon.companyName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {addon.hallName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {addon.serviceName}
                        </p>
                        {addon.serviceDescription && (
                          <p className="text-xs text-gray-500 max-w-xs">
                            {addon.serviceDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">
                          {addon.serviceDate}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {addon.serviceTime}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {addon.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(addon.unitPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(addon.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getBillingModeColor(
                        addon.billingMode
                      )}`}
                    >
                      {getBillingModeIcon(addon.billingMode)}
                      {addon.billingMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        addon.status
                      )}`}
                    >
                      {getStatusIcon(addon.status)}
                      {addon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {addon.status === "Pending" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(addon.id, "Completed")
                          }
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/20 transition-all"
                          title="Mark Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedAddon(addon);
                          setShowAuditModal(true);
                        }}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all"
                        title="View Audit Log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!addon.isInvoiced && (
                        <button
                          onClick={() => handleSoftDelete(addon.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAddons.length === 0 && (
            <div className="text-center py-20">
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                  <Package className="w-10 h-10 text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Add-on Services Yet
              </h3>
              <p className="text-gray-600 text-base mb-1">
                {eventAddons.length === 0
                  ? "Start by adding your first event service"
                  : "No services match your current filters"}
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
                {eventAddons.length === 0
                  ? "Enhance your events with additional services like catering, entertainment, or technical support"
                  : "Try adjusting your search criteria or filters to find more services"}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowAddServiceModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add First Service
                </Button>
                {eventAddons.length > 0 && (
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("All");
                      setBillingModeFilter("All");
                    }}
                    className="bg-gray-600 hover:bg-gray-500 px-6 py-3 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Service Modal */}
      <Modal
        isOpen={showAddServiceModal}
        onClose={() => {
          setShowAddServiceModal(false);
          setCurrentStep(1);
          setSelectedBillingMode(null);
          setSelectedEvent(null);
          setSelectedServices([]);
          setCommonConfig({
            serviceDate: "",
            serviceTime: "",
            customerName: "",
            referenceNumber: "",
            status: "Pending",
          });
          clearFormErrors();
        }}
        title="Add Event Service"
        size="4xl"
      >
        <div className="space-y-6">
          {/* Enhanced Step Progress */}
          <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-lg p-6 border border-slate-300">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
              {[
                {
                  step: 1,
                  label: "Billing Mode",
                  icon: CreditCard,
                  description: "Choose payment method",
                },
                {
                  step: 2,
                  label: "Select Event",
                  icon: PartyPopper,
                  description: "Pick target event",
                },
                {
                  step: 3,
                  label: "Add Services",
                  icon: Package,
                  description: "Configure services",
                },
                {
                  step: 4,
                  label: "Review & Confirm",
                  icon: CheckCircle,
                  description: "Final verification",
                },
              ].map(({ step, label, icon: Icon, description }, index) => (
                <div
                  key={step}
                  className="flex flex-col md:flex-row items-center"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                          step < currentStep
                            ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25"
                            : step === currentStep
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/20"
                            : "bg-gray-600 text-gray-400"
                        }`}
                      >
                        {step < currentStep ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      {step === currentStep && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur animate-pulse opacity-75 -z-10"></div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p
                        className={`text-sm font-semibold ${
                          step <= currentStep ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {label}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          step <= currentStep
                            ? "text-slate-700"
                            : "text-gray-500"
                        }`}
                      >
                        {description}
                      </p>
                    </div>
                  </div>

                  {index < 3 && (
                    <div
                      className={`hidden md:block w-16 h-0.5 mx-4 transition-all duration-300 ${
                        step < currentStep
                          ? "bg-gradient-to-r from-green-500 to-blue-500"
                          : "bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Current Step Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Step {currentStep} of 4 •
                {currentStep === 1 && " Choose how the service will be billed"}
                {currentStep === 2 && " Select the event for this service"}
                {currentStep === 3 &&
                  " Configure service details and quantities"}
                {currentStep === 4 && " Review all details before confirming"}
              </p>
            </div>
          </div>

          {/* Step 1: Select Billing Mode */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select Billing Mode
                </h3>
                <p className="text-gray-600">
                  Choose how this service will be billed
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    "Cash",
                    "Event Invoice",
                    "Reference No.",
                  ] as BillingModeType[]
                ).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleBillingModeSelect(mode)}
                    className={`p-6 rounded-lg border-2 transition-all duration-200 text-center hover:border-blue-500 hover:bg-blue-500/10 ${
                      selectedBillingMode === mode
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-300 bg-white/30"
                    }`}
                  >
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-blue-500/20">
                        {getBillingModeIcon(mode)}
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {mode}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {mode === "Cash" && "Immediate payment collected"}
                      {mode === "Event Invoice" && "Posted to event invoice"}
                      {mode === "Reference No." &&
                        "Corporate/third-party billing"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Event */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select Event
                </h3>
                <p className="text-gray-600">
                  Choose the event for this service ({selectedBillingMode})
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by event reference, organizer name, or phone..."
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    disabled={
                      selectedBillingMode === "Event Invoice" &&
                      (event.invoiceFinalized || !event.isActive)
                    }
                    className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                      selectedBillingMode === "Event Invoice" &&
                      (event.invoiceFinalized || !event.isActive)
                        ? "border-slate-300 bg-white/20 opacity-50 cursor-not-allowed"
                        : "border-slate-300 bg-white/30 hover:border-blue-500 hover:bg-blue-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <PartyPopper className="w-5 h-5 text-purple-400" />
                          <span className="font-semibold text-gray-900">
                            {event.referenceNo}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              event.isActive
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {event.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {event.title}
                        </h4>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{event.organizerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{event.companyName || "Individual"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.hallName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{event.totalGuests} guests</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.eventTime} - {event.endTime}
                            </span>
                          </div>
                        </div>

                        {event.organizerPhone && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-400">
                            <Phone className="w-4 h-4" />
                            <span>{event.organizerPhone}</span>
                          </div>
                        )}

                        {selectedBillingMode === "Event Invoice" &&
                          event.invoiceFinalized && (
                            <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Invoice is finalized - cannot add services
                            </div>
                          )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <PartyPopper className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No events found</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Add Multiple Services */}
          {currentStep === 3 && selectedEvent && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Add Multiple Services
                </h3>
                <p className="text-gray-600">
                  Select and configure services for {selectedEvent.referenceNo}
                </p>
              </div>

              {/* Event Summary */}
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <PartyPopper className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {selectedEvent.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.organizerName} • {selectedEvent.hallName}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBillingModeColor(
                      selectedBillingMode!
                    )}`}
                  >
                    {getBillingModeIcon(selectedBillingMode!)}
                    {selectedBillingMode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available Services */}
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Available Services
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockServiceItems
                      .filter((service) => service.isActive)
                      .map((service) => (
                        <div
                          key={service.id}
                          className="bg-white border border-gray-300 rounded-lg p-4 hover:border-blue-500/50 transition-colors shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-1">
                                {service.name}
                              </h5>
                              <p className="text-sm text-gray-600 mb-2">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(service.unitPrice)}
                                </span>
                                <span className="text-gray-500">
                                  per {service.unit}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded ${
                                service.category === "Food & Beverage"
                                  ? "bg-orange-500/20 text-orange-300"
                                  : service.category === "Equipment"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : service.category === "Staff"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : "bg-gray-500/20 text-slate-700"
                              }`}
                            >
                              {service.category}
                            </span>
                          </div>

                          {selectedServices.some(
                            (s) => s.serviceId === service.id
                          ) ? (
                            <div className="space-y-3">
                              <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-300 font-medium">
                                    Service Added
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceQuantity(
                                          service.id,
                                          Math.max(
                                            1,
                                            (selectedServices.find(
                                              (s) => s.serviceId === service.id
                                            )?.quantity || 1) - 1
                                          )
                                        )
                                      }
                                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-900 text-sm font-medium min-w-[40px] text-center">
                                      {selectedServices.find(
                                        (s) => s.serviceId === service.id
                                      )?.quantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateServiceQuantity(
                                          service.id,
                                          (selectedServices.find(
                                            (s) => s.serviceId === service.id
                                          )?.quantity || 1) + 1
                                        )
                                      }
                                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={
                                      selectedServices.find(
                                        (s) => s.serviceId === service.id
                                      )?.notes || ""
                                    }
                                    onChange={(e) =>
                                      handleUpdateServiceNotes(
                                        service.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Add notes..."
                                    className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveServiceFromSelection(service.id)
                                }
                                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove Service
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleAddServiceToSelection(service.id)
                              }
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Service
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Selected Services & Configuration */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-400" />
                    Selected Services ({selectedServices.length})
                  </h4>

                  {selectedServices.length > 0 ? (
                    <div className="space-y-4">
                      {/* Service List */}
                      <div className="space-y-3">
                        {selectedServices.map((selectedService) => {
                          const service = mockServiceItems.find(
                            (s) => s.id === selectedService.serviceId
                          );
                          if (!service) return null;

                          return (
                            <div
                              key={selectedService.serviceId}
                              className="bg-white/30 border border-slate-300 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h6 className="font-medium text-white text-sm">
                                    {service.name}
                                  </h6>
                                  <p className="text-xs text-gray-400">
                                    {formatCurrency(service.unitPrice)} ×{" "}
                                    {selectedService.quantity}
                                  </p>
                                </div>
                                <span className="text-sm font-semibold text-green-400">
                                  {formatCurrency(
                                    service.unitPrice * selectedService.quantity
                                  )}
                                </span>
                              </div>
                              {selectedService.notes && (
                                <p className="text-xs text-slate-700 bg-gray-800 rounded p-2">
                                  {selectedService.notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Total */}
                      <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            Total Amount:
                          </span>
                          <span className="text-xl font-bold text-green-400">
                            {formatCurrency(calculateSelectedServicesTotal())}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedServices.length} service(s) selected
                        </p>
                      </div>

                      {/* Enhanced Common Configuration */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Settings className="w-5 h-5 text-blue-400" />
                          </div>
                          <h5 className="font-semibold text-white">
                            Service Configuration
                          </h5>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                              <Calendar className="w-4 h-4 text-orange-400" />
                              Service Date *
                            </label>
                            <input
                              type="date"
                              value={commonConfig.serviceDate}
                              onChange={(e) => {
                                setCommonConfig({
                                  ...commonConfig,
                                  serviceDate: e.target.value,
                                });
                                clearFormErrors();
                              }}
                              min={selectedEvent.eventDate}
                              className={`w-full px-4 py-3 bg-white/50 border rounded-lg text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                                formErrors.serviceDate
                                  ? "border-red-500 focus:ring-red-500/50 bg-red-500/5"
                                  : "border-slate-300 focus:ring-blue-500 hover:border-gray-500"
                              }`}
                              required
                            />
                            {formErrors.serviceDate && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                {formErrors.serviceDate}
                              </div>
                            )}
                            {commonConfig.serviceDate && (
                              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Valid service date
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              Service Time *
                            </label>
                            <input
                              type="time"
                              value={commonConfig.serviceTime}
                              onChange={(e) => {
                                setCommonConfig({
                                  ...commonConfig,
                                  serviceTime: e.target.value,
                                });
                                clearFormErrors();
                              }}
                              className={`w-full px-4 py-3 bg-white/50 border rounded-lg text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                                formErrors.serviceTime
                                  ? "border-red-500 focus:ring-red-500/50 bg-red-500/5"
                                  : "border-slate-300 focus:ring-blue-500 hover:border-gray-500"
                              }`}
                              required
                            />
                            {formErrors.serviceTime && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                                <AlertTriangle className="w-3 h-3" />
                                {formErrors.serviceTime}
                              </div>
                            )}
                            {commonConfig.serviceTime && (
                              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Time set successfully
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Conditional Billing Fields */}
                        {selectedBillingMode === "Cash" && (
                          <div className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign className="w-5 h-5 text-blue-400" />
                              <span className="font-medium text-white">
                                Cash Payment Details
                              </span>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <User className="w-4 h-4 text-green-400" />
                                Customer/Payer Name *
                              </label>
                              <input
                                type="text"
                                value={commonConfig.customerName}
                                onChange={(e) => {
                                  setCommonConfig({
                                    ...commonConfig,
                                    customerName: e.target.value,
                                  });
                                  clearFormErrors();
                                }}
                                placeholder="Enter the name of person paying for this service"
                                className={`w-full px-4 py-3 bg-white/50 border rounded-lg text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                                  formErrors.customerName
                                    ? "border-red-500 focus:ring-red-500/50 bg-red-500/5"
                                    : "border-slate-300 focus:ring-blue-500 hover:border-gray-500"
                                } placeholder-gray-400`}
                                required
                              />
                              {formErrors.customerName && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  {formErrors.customerName}
                                </div>
                              )}
                              {commonConfig.customerName.trim() && (
                                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Customer name entered
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedBillingMode === "Reference No." && (
                          <div className="bg-gradient-to-r from-orange-500/5 to-orange-600/5 border border-orange-500/20 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Receipt className="w-5 h-5 text-orange-400" />
                              <span className="font-medium text-white">
                                Reference Billing Details
                              </span>
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Building2 className="w-4 h-4 text-orange-400" />
                                Reference Number *
                              </label>
                              <input
                                type="text"
                                value={commonConfig.referenceNumber}
                                onChange={(e) => {
                                  setCommonConfig({
                                    ...commonConfig,
                                    referenceNumber: e.target.value,
                                  });
                                  clearFormErrors();
                                }}
                                placeholder="Enter corporate/third-party reference number"
                                className={`w-full px-4 py-3 bg-white/50 border rounded-lg text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                                  formErrors.referenceNumber
                                    ? "border-red-500 focus:ring-red-500/50 bg-red-500/5"
                                    : "border-slate-300 focus:ring-blue-500 hover:border-gray-500"
                                } placeholder-gray-400`}
                                required
                              />
                              {formErrors.referenceNumber && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  {formErrors.referenceNumber}
                                </div>
                              )}
                              {commonConfig.referenceNumber.trim() && (
                                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Reference number set
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Status *
                          </label>
                          <select
                            value={commonConfig.status}
                            onChange={(e) =>
                              setCommonConfig({
                                ...commonConfig,
                                status: e.target.value as ServiceStatusType,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-700 border border-slate-300 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Canceled">Canceled</option>
                          </select>
                        </div>
                      </div>

                      {/* Service Review & Confirmation */}
                      {selectedServices.length > 0 &&
                        commonConfig.serviceDate &&
                        commonConfig.serviceTime &&
                        (selectedBillingMode !== "Cash" ||
                          commonConfig.customerName.trim()) &&
                        (selectedBillingMode !== "Reference No." ||
                          commonConfig.referenceNumber.trim()) && (
                          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-4">
                            <h5 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-400" />
                              Ready to Add Services
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-400">Event:</span>
                                <p className="font-semibold text-white">
                                  {selectedEvent.referenceNo}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Billing Mode:
                                </span>
                                <p className="font-semibold text-white">
                                  {selectedBillingMode}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Service Date:
                                </span>
                                <p className="font-semibold text-white">
                                  {commonConfig.serviceDate}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Service Time:
                                </span>
                                <p className="font-semibold text-white">
                                  {commonConfig.serviceTime}
                                </p>
                              </div>
                              {commonConfig.customerName && (
                                <div>
                                  <span className="text-gray-400">
                                    Customer:
                                  </span>
                                  <p className="font-semibold text-white">
                                    {commonConfig.customerName}
                                  </p>
                                </div>
                              )}
                              {commonConfig.referenceNumber && (
                                <div>
                                  <span className="text-gray-400">
                                    Reference:
                                  </span>
                                  <p className="font-semibold text-white">
                                    {commonConfig.referenceNumber}
                                  </p>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-400">Status:</span>
                                <p className="font-semibold text-white">
                                  {commonConfig.status}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-400">Services:</span>
                                <p className="font-semibold text-green-400">
                                  {selectedServices.length} service(s)
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">
                              All services will be added with the configuration
                              above. Click "Add Services" to confirm.
                            </p>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No services selected</p>
                      <p className="text-xs">Choose from available services</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Detailed Service Review & Confirmation */}
          {currentStep === 4 &&
            selectedEvent &&
            selectedServices.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Confirm Service Booking
                  </h3>
                  <p className="text-gray-400">
                    Please review all details before confirming the service
                    booking
                  </p>
                </div>

                {/* Event Information Card */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <PartyPopper className="w-6 h-6 text-purple-400" />
                    <h4 className="text-lg font-semibold text-white">
                      Event Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Reference Number:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.referenceNo}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Event Title:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.title}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Organizer:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.organizerName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Company:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.companyName || "Individual"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Hall:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.hallName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Event Date:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.eventDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Event Time:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.eventTime} - {selectedEvent.endTime}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Guests:</span>
                      <p className="font-semibold text-white">
                        {selectedEvent.totalGuests}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Information Card */}
                <div
                  className={`border rounded-lg p-6 ${getBillingModeColor(
                    selectedBillingMode!
                  )}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {getBillingModeIcon(selectedBillingMode!)}
                    <h4 className="text-lg font-semibold text-white">
                      Billing Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Billing Mode:</span>
                      <p className="font-semibold text-white">
                        {selectedBillingMode}
                      </p>
                    </div>
                    {commonConfig.customerName && (
                      <div>
                        <span className="text-gray-400">Customer Name:</span>
                        <p className="font-semibold text-white">
                          {commonConfig.customerName}
                        </p>
                      </div>
                    )}
                    {commonConfig.referenceNumber && (
                      <div>
                        <span className="text-gray-400">Reference Number:</span>
                        <p className="font-semibold text-white">
                          {commonConfig.referenceNumber}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Service Date:</span>
                      <p className="font-semibold text-white">
                        {commonConfig.serviceDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Service Time:</span>
                      <p className="font-semibold text-white">
                        {commonConfig.serviceTime}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className="font-semibold text-white">
                        {commonConfig.status}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selected Services Details */}
                <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingCart className="w-6 h-6 text-green-400" />
                    <h4 className="text-lg font-semibold text-white">
                      Selected Services ({selectedServices.length})
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {selectedServices.map((selectedService, index) => {
                      const service = mockServiceItems.find(
                        (s) => s.id === selectedService.serviceId
                      );
                      if (!service) return null;

                      return (
                        <div
                          key={selectedService.serviceId}
                          className="bg-gray-800/30 border border-slate-300 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <h5 className="font-semibold text-white text-lg">
                                  {service.name}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    service.category === "Equipment"
                                      ? "bg-blue-500/20 text-blue-300"
                                      : service.category === "Entertainment"
                                      ? "bg-purple-500/20 text-purple-300"
                                      : service.category === "Decoration"
                                      ? "bg-pink-500/20 text-pink-300"
                                      : service.category === "Photography"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : service.category === "Venue"
                                      ? "bg-indigo-500/20 text-indigo-300"
                                      : service.category === "F&B"
                                      ? "bg-orange-500/20 text-orange-300"
                                      : service.category === "Transportation"
                                      ? "bg-green-500/20 text-green-300"
                                      : "bg-gray-500/20 text-slate-700"
                                  }`}
                                >
                                  {service.category}
                                </span>
                              </div>
                              <p className="text-gray-400 mb-3">
                                {service.description}
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">
                                    Unit Price:
                                  </span>
                                  <p className="font-semibold text-white">
                                    {formatCurrency(service.unitPrice)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Unit:</span>
                                  <p className="font-semibold text-white">
                                    {service.unit}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Quantity:
                                  </span>
                                  <p className="font-semibold text-white">
                                    {selectedService.quantity}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-400">
                                    Subtotal:
                                  </span>
                                  <p className="font-semibold text-green-400">
                                    {formatCurrency(
                                      service.unitPrice *
                                        selectedService.quantity
                                    )}
                                  </p>
                                </div>
                              </div>
                              {selectedService.notes && (
                                <div className="mt-3">
                                  <span className="text-gray-400 text-sm">
                                    Notes:
                                  </span>
                                  <p className="text-white bg-white/50 rounded p-2 mt-1">
                                    {selectedService.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Summary */}
                  <div className="mt-6 pt-4 border-t border-green-500/30">
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-semibold text-white">
                        Total Amount:
                      </span>
                      <span className="text-2xl font-bold text-green-400">
                        {formatCurrency(calculateSelectedServicesTotal())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      Total for {selectedServices.length} service(s) • Billing
                      Mode: {selectedBillingMode}
                    </p>
                  </div>
                </div>

                {/* Terms and Confirmation */}
                <div className="bg-gradient-to-r from-gray-700/30 to-gray-800/30 border border-slate-300 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Important Information
                  </h4>
                  <div className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        All services will be scheduled for{" "}
                        <strong className="text-white">
                          {commonConfig.serviceDate} at{" "}
                          {commonConfig.serviceTime}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Services will be billed using{" "}
                        <strong className="text-white">
                          {selectedBillingMode}
                        </strong>{" "}
                        mode
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Prices are locked at the time of booking and may not be
                        changed later
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>
                        All services will have an initial status of{" "}
                        <strong className="text-white">
                          {commonConfig.status}
                        </strong>
                      </span>
                    </div>
                    {selectedBillingMode === "Cash" && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Payment will be collected immediately from{" "}
                          <strong className="text-white">
                            {commonConfig.customerName}
                          </strong>
                        </span>
                      </div>
                    )}
                    {selectedBillingMode === "Event Invoice" && (
                      <div className="flex items-start gap-2">
                        <Receipt className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Charges will be added to the event invoice and billed
                          accordingly
                        </span>
                      </div>
                    )}
                    {selectedBillingMode === "Reference No." && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Services will be billed to reference{" "}
                          <strong className="text-white">
                            {commonConfig.referenceNumber}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Confirmation */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-white mb-2">
                    Ready to Confirm Booking
                  </h4>
                  <p className="text-gray-400 mb-4">
                    You are about to add {selectedServices.length} service(s) to
                    event {selectedEvent.referenceNo}
                    with a total amount of{" "}
                    <span className="font-semibold text-green-400">
                      {formatCurrency(calculateSelectedServicesTotal())}
                    </span>
                  </p>
                  <p className="text-sm text-yellow-300">
                    ⚠️ This action cannot be undone. Please ensure all
                    information is correct before proceeding.
                  </p>
                </div>
              </div>
            )}

          {/* Enhanced Modal Actions */}
          <div className="bg-gradient-to-r from-gray-700/20 to-gray-800/20 px-6 py-4 border-t border-slate-300/50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => {
                  if (currentStep === 1) {
                    setShowAddServiceModal(false);
                  } else {
                    setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                    clearFormErrors();
                  }
                }}
                className="bg-gray-600 hover:bg-gray-500 px-6 py-3 flex items-center gap-2 transition-all duration-200"
              >
                {currentStep === 1 ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <ArrowLeft className="w-4 h-4" />
                )}
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>

              <div className="flex items-center gap-4">
                {/* Validation Status Indicator */}
                {currentStep >= 3 && (
                  <div className="flex items-center gap-2 text-sm">
                    {isCurrentStepValid ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>Ready to proceed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please complete required fields</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (currentStep === 3) {
                      if (validateForm()) {
                        setCurrentStep(4);
                      }
                    } else if (currentStep === 4) {
                      handleAddServices();
                    } else if (currentStep === 1 && selectedBillingMode) {
                      setCurrentStep(2);
                    } else if (currentStep === 2 && selectedEvent) {
                      setCurrentStep(3);
                    }
                  }}
                  disabled={!isCurrentStepValid || isLoading}
                  className={`px-6 py-3 flex items-center gap-2 transition-all duration-200 ${
                    isCurrentStepValid
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25"
                      : "bg-gray-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : currentStep === 4 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {currentStep === 1
                    ? "Select Event"
                    : currentStep === 2
                    ? "Configure Services"
                    : currentStep === 3
                    ? "Review & Confirm"
                    : currentStep === 4
                    ? isLoading
                      ? "Creating Services..."
                      : "Confirm Booking"
                    : "Next"}
                </Button>
              </div>
            </div>

            {/* Help Text */}
            {currentStep >= 3 && Object.keys(formErrors).length > 0 && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      Please fix the following issues:
                    </p>
                    <ul className="text-xs text-red-300 mt-1 space-y-1">
                      {Object.values(formErrors).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Audit Log Modal */}
      {showAuditModal && selectedAddon && (
        <Modal
          isOpen={showAuditModal}
          onClose={() => {
            setShowAuditModal(false);
            setSelectedAddon(null);
          }}
          title="Service Audit Log"
          size="2xl"
        >
          <div className="space-y-4">
            <div className="bg-white/30 rounded-lg p-4 border border-slate-300">
              <h4 className="font-semibold text-white mb-2">Service Details</h4>
              <p className="text-sm text-gray-400">
                {selectedAddon.serviceName} for {selectedAddon.eventReferenceNo}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                Activity Log
              </h4>
              {selectedAddon.auditLog.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-white/20 rounded-lg border border-slate-300"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-400">
                        by {log.by} on {new Date(log.at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{log.details}</p>
                    {log.oldValue && log.newValue && (
                      <div className="mt-2 text-xs">
                        <span className="text-red-400">
                          Old: {log.oldValue}
                        </span>
                        {" → "}
                        <span className="text-green-400">
                          New: {log.newValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddServiceModal(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-200 transform hover:scale-110 z-50 group"
        title="Add New Service"
      >
        <Plus className="w-6 h-6" />
        <div className="absolute -top-2 -left-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 -z-10"></div>
      </button>
    </div>
  );
};

export default EventAddonService;

