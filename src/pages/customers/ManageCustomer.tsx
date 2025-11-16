import React, { useMemo, useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import {
  formatCurrency,
  formatDate,
  formatPhoneNumber,
  generateId,
} from "../../utils/formatters";
import { Customer, CustomerStatus } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check, Eye } from "lucide-react";

type StatusFilter = CustomerStatus | "all";
type PremiumFilter = "all" | "with-card" | "without-card";
type SortOption =
  | "recent"
  | "name-az"
  | "name-za"
  | "visits-high"
  | "visits-low"
  | "spend-high"
  | "spend-low";

interface CustomerMetrics {
  visitCount: number;
  upcomingCount: number;
  lastVisit: string | null;
  totalSpent: number;
  hasPremiumEvidence: boolean;
  firstSeen: string | null;
}

interface EnhancedCustomer extends Customer {
  calculatedStatus: CustomerStatus;
  visitCount: number;
  upcomingCount: number;
  lastVisit: string | null;
  totalSpent: number;
  hasPremium: boolean;
  firstSeen: string | null;
}

interface SummarySnapshot {
  total: number;
  vip: number;
  premiumHolders: number;
  avgVisits: number;
  upcoming: number;
  topGuest: { name: string; visits: number } | null;
}

const STATUS_BADGE_CLASS: Record<CustomerStatus, string> = {
  VIP: "bg-purple-100 text-purple-800",
  "regular customer": "bg-blue-100 text-blue-800",
  "new customer": "bg-green-100 text-green-800",
};

const STATUS_FILTERS: Array<{
  value: StatusFilter;
  label: string;
  description: string;
}> = [
  {
    value: "all",
    label: "All customers",
    description: "Show every guest in your directory",
  },
  {
    value: "VIP",
    label: "VIP",
    description: "Premium guests with special privileges",
  },
  {
    value: "regular customer",
    label: "Regular",
    description: "Returning guests with multiple visits",
  },
  {
    value: "new customer",
    label: "New",
    description: "First-time or infrequent guests",
  },
];

const PREMIUM_FILTERS: Array<{ value: PremiumFilter; label: string }> = [
  { value: "all", label: "Any card status" },
  { value: "with-card", label: "Has premium card" },
  { value: "without-card", label: "No premium card" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "name-az", label: "Name A → Z" },
  { value: "name-za", label: "Name Z → A" },
  { value: "visits-high", label: "Most visits" },
  { value: "visits-low", label: "Fewest visits" },
  { value: "spend-high", label: "Highest spend" },
  { value: "spend-low", label: "Lowest spend" },
];

const createEmptyCustomerForm = () => ({
  name: "",
  email: "",
  phone: "",
  nationality: "",
  hasPremiumCard: false,
});

type CustomerFormState = ReturnType<typeof createEmptyCustomerForm>;

const formatStatusLabel = (status: CustomerStatus) => {
  if (status === "regular customer") {
    return "Regular customer";
  }
  if (status === "new customer") {
    return "New customer";
  }
  return status;
};

export const ManageCustomer: React.FC = () => {
  const { state, dispatch } = useHotel();
  const currencyCode = state.settings?.currency ?? "USD";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [premiumFilter, setPremiumFilter] = useState<PremiumFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormState>(
    createEmptyCustomerForm()
  );

  const customerMetrics = useMemo(() => {
    const metricsMap = new Map<string, CustomerMetrics>();

    state.customers.forEach((customer) => {
      metricsMap.set(customer.id, {
        visitCount: 0,
        upcomingCount: 0,
        lastVisit: null,
        totalSpent: 0,
        hasPremiumEvidence: false,
        firstSeen: customer.createdAt ?? null,
      });
    });

    const reservationById = new Map(
      state.reservations.map((reservation) => [reservation.id, reservation])
    );
    const now = new Date();

    state.reservations.forEach((reservation) => {
      const metrics = metricsMap.get(reservation.customerId);
      if (!metrics) {
        return;
      }

      const checkInDate = reservation.checkIn
        ? new Date(reservation.checkIn)
        : null;
      if (reservation.status !== "canceled") {
        metrics.visitCount += 1;

        if (reservation.checkIn) {
          if (
            !metrics.firstSeen ||
            new Date(metrics.firstSeen).getTime() >
              new Date(reservation.checkIn).getTime()
          ) {
            metrics.firstSeen = reservation.checkIn;
          }
        }

        if (reservation.checkOut) {
          if (
            !metrics.lastVisit ||
            new Date(metrics.lastVisit).getTime() <
              new Date(reservation.checkOut).getTime()
          ) {
            metrics.lastVisit = reservation.checkOut;
          }
        }
      }

      if (
        reservation.status !== "canceled" &&
        checkInDate &&
        checkInDate.getTime() > now.getTime()
      ) {
        metrics.upcomingCount += 1;
      }
    });

    state.receipts.forEach((receipt) => {
      const metrics = metricsMap.get(receipt.customerId);
      if (!metrics) {
        return;
      }
      metrics.totalSpent += receipt.amount;
      const notes = receipt.notes?.toLowerCase() ?? "";
      const paymentType = receipt.paymentType?.toLowerCase() ?? "";
      if (notes.includes("premium") || paymentType.includes("premium")) {
        metrics.hasPremiumEvidence = true;
      }
    });

    state.bills.forEach((bill) => {
      const reservation = reservationById.get(bill.reservationId);
      if (!reservation) {
        return;
      }
      const metrics = metricsMap.get(reservation.customerId);
      if (!metrics) {
        return;
      }
      bill.lineItems.forEach((item) => {
        if (item.description.toLowerCase().includes("premium")) {
          metrics.hasPremiumEvidence = true;
        }
      });
    });

    return metricsMap;
  }, [state.customers, state.reservations, state.receipts, state.bills]);

  const customersWithStatus: EnhancedCustomer[] = useMemo(() => {
    return state.customers.map((customer) => {
      const metrics = customerMetrics.get(customer.id) ?? {
        visitCount: 0,
        upcomingCount: 0,
        lastVisit: null,
        totalSpent: 0,
        hasPremiumEvidence: false,
        firstSeen: customer.createdAt ?? null,
      };

      const hasPremium = customer.hasPremiumCard || metrics.hasPremiumEvidence;
      const calculatedStatus: CustomerStatus = hasPremium
        ? "VIP"
        : metrics.visitCount > 2
        ? "regular customer"
        : "new customer";

      return {
        ...customer,
        calculatedStatus,
        visitCount: metrics.visitCount,
        upcomingCount: metrics.upcomingCount,
        lastVisit: metrics.lastVisit,
        totalSpent: metrics.totalSpent,
        hasPremium,
        firstSeen: metrics.firstSeen,
      };
    });
  }, [state.customers, customerMetrics]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: customersWithStatus.length,
      VIP: 0,
      "regular customer": 0,
      "new customer": 0,
    };

    customersWithStatus.forEach((customer) => {
      counts[customer.calculatedStatus] += 1;
    });

    return counts;
  }, [customersWithStatus]);

  const summarySnapshot: SummarySnapshot = useMemo(() => {
    const summary: SummarySnapshot = {
      total: customersWithStatus.length,
      vip: statusCounts["VIP"],
      premiumHolders: 0,
      avgVisits: 0,
      upcoming: 0,
      topGuest: null,
    };

    if (customersWithStatus.length === 0) {
      return summary;
    }

    let totalVisits = 0;

    customersWithStatus.forEach((customer) => {
      totalVisits += customer.visitCount;
      summary.upcoming += customer.upcomingCount;
      if (customer.hasPremium) {
        summary.premiumHolders += 1;
      }
      if (!summary.topGuest || customer.visitCount > summary.topGuest.visits) {
        summary.topGuest = {
          name: customer.name,
          visits: customer.visitCount,
        };
      }
    });

    summary.avgVisits = totalVisits / customersWithStatus.length;

    return summary;
  }, [customersWithStatus, statusCounts]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = customersWithStatus.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.phone.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || customer.calculatedStatus === statusFilter;

      const matchesPremium =
        premiumFilter === "all" ||
        (premiumFilter === "with-card"
          ? customer.hasPremium
          : !customer.hasPremium);

      return matchesSearch && matchesStatus && matchesPremium;
    });

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-az":
          return a.name.localeCompare(b.name);
        case "name-za":
          return b.name.localeCompare(a.name);
        case "visits-high":
          return b.visitCount - a.visitCount;
        case "visits-low":
          return a.visitCount - b.visitCount;
        case "spend-high":
          return b.totalSpent - a.totalSpent;
        case "spend-low":
          return a.totalSpent - b.totalSpent;
        case "recent":
        default: {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        }
      }
    });
  }, [
    customersWithStatus,
    searchTerm,
    statusFilter,
    premiumFilter,
    sortOption,
  ]);

  const filtersActive =
    searchTerm.trim().length > 0 ||
    statusFilter !== "all" ||
    premiumFilter !== "all" ||
    sortOption !== "recent";

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) {
      return null;
    }
    return (
      customersWithStatus.find(
        (customer) => customer.id === selectedCustomerId
      ) ?? null
    );
  }, [selectedCustomerId, customersWithStatus]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPremiumFilter("all");
    setSortOption("recent");
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData(createEmptyCustomerForm());
    setShowModal(true);
    setIsDetailsOpen(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      nationality: customer.nationality,
      hasPremiumCard: customer.hasPremiumCard ?? false,
    });
    setShowModal(true);
    setIsDetailsOpen(false);
  };

  const handleSave = () => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedNationality = formData.nationality.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedNationality) {
      window.alert("Please fill in all required fields before saving.");
      return;
    }

    if (editingCustomer) {
      dispatch({
        type: "UPDATE_CUSTOMER",
        payload: {
          ...editingCustomer,
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          nationality: trimmedNationality,
          hasPremiumCard: formData.hasPremiumCard,
        },
      });
    } else {
      dispatch({
        type: "ADD_CUSTOMER",
        payload: {
          id: generateId(),
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          nationality: trimmedNationality,
          hasPremiumCard: formData.hasPremiumCard,
          createdAt: new Date().toISOString(),
        },
      });
    }

    setShowModal(false);
    setEditingCustomer(null);
    setFormData(createEmptyCustomerForm());
  };

  const handleDelete = (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name}?`)) {
      return;
    }
    dispatch({ type: "DELETE_CUSTOMER", payload: customer.id });
    if (selectedCustomerId === customer.id) {
      setSelectedCustomerId(null);
      setIsDetailsOpen(false);
    }
  };

  const handleView = (customer: EnhancedCustomer) => {
    setSelectedCustomerId(customer.id);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCustomerId(null);
  };

  const columns = [
    {
      key: "customer",
      header: "Customer",
      cellClassName: "whitespace-normal max-w-xs",
      render: (customer: EnhancedCustomer) => (
        <div className="space-y-1">
          <span className="text-sm font-semibold text-slate-900">
            {customer.name}
          </span>
          <span className="text-xs text-slate-500 break-words">
            {customer.email}
          </span>
          <span className="text-xs text-slate-500">
            {formatPhoneNumber(customer.phone)}
          </span>
        </div>
      ),
    },
    {
      key: "loyalty",
      header: "Loyalty",
      cellClassName: "whitespace-normal",
      render: (customer: EnhancedCustomer) => (
        <div className="space-y-1">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              STATUS_BADGE_CLASS[customer.calculatedStatus]
            }`}
          >
            {formatStatusLabel(customer.calculatedStatus)}
          </span>
          <span className="text-xs text-slate-500">
            {customer.hasPremium ? "Premium card on file" : "Standard guest"}
          </span>
        </div>
      ),
    },
    {
      key: "activity",
      header: "Activity",
      cellClassName: "whitespace-normal",
      render: (customer: EnhancedCustomer) => (
        <div className="space-y-1 text-xs text-slate-600">
          <span>
            {customer.visitCount} visit
            {customer.visitCount !== 1 ? "s" : ""}
          </span>
          {customer.upcomingCount > 0 && (
            <span>
              {customer.upcomingCount} upcoming stay
              {customer.upcomingCount !== 1 ? "s" : ""}
            </span>
          )}
          <span>
            Last stay:{" "}
            {customer.lastVisit
              ? formatDate(customer.lastVisit)
              : "No stay yet"}
          </span>
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right",
      render: (customer: EnhancedCustomer) => (
        <div className="space-y-1">
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(customer.totalSpent, currencyCode)}
          </span>
          <span className="text-xs text-slate-500">Lifetime spend</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "whitespace-nowrap text-right",
      render: (customer: EnhancedCustomer) => (
        <div className="flex justify-end gap-2">
          <Button
            aria-label="View customer details"
            title="View customer details"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleView(customer);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Edit customer"
            title="Edit customer"
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleEdit(customer);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Delete customer"
            title="Delete customer"
            variant="danger"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(customer);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Manage Customers
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Understand guest value, loyalty, and upcoming stays at a glance.
          </p>
        </div>
        <Button
          aria-label="Add customer"
          title="Add customer"
          onClick={handleAdd}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Total customers</p>
            <p className="text-2xl font-bold text-slate-900">
              {summarySnapshot.total}
            </p>
            <p className="text-xs text-slate-500">
              {summarySnapshot.vip} VIP guests in total
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Premium cards</p>
            <p className="text-2xl font-bold text-slate-900">
              {summarySnapshot.premiumHolders}
            </p>
            <p className="text-xs text-slate-500">
              {summarySnapshot.premiumHolders > 0
                ? "Guests with premium card or spend history"
                : "No premium cards on file"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">Average visits</p>
            <p className="text-2xl font-bold text-slate-900">
              {summarySnapshot.avgVisits.toFixed(1)}
            </p>
            <p className="text-xs text-slate-500">
              {summarySnapshot.topGuest
                ? `${summarySnapshot.topGuest.name} leads with ${summarySnapshot.topGuest.visits} visits`
                : "No repeat visit data yet"}
            </p>
          </div>
        </Card>
        <Card>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">
              Upcoming reservations
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {summarySnapshot.upcoming}
            </p>
            <p className="text-xs text-slate-500">
              Includes all confirmed future stays
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Customer directory
            </h2>
            <p className="text-sm text-slate-500">
              Showing {filteredCustomers.length} of {customersWithStatus.length}{" "}
              guests
            </p>
          </div>
          {filtersActive && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleResetFilters}
            >
              Reset filters
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <div className="md:col-span-2 xl:col-span-2">
            <Input
              placeholder="Search by name, email, or phone…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Select
            label="Premium card"
            value={premiumFilter}
            onChange={(event) =>
              setPremiumFilter(event.target.value as PremiumFilter)
            }
            options={PREMIUM_FILTERS}
          />
          <Select
            label="Sort by"
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value as SortOption)
            }
            options={SORT_OPTIONS}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "primary" : "outline"}
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setStatusFilter(filter.value)}
            >
              <div>
                <p className="text-sm font-semibold">{filter.label}</p>
                <p className="text-xs font-medium text-slate-500">
                  {filter.description}
                </p>
              </div>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {statusCounts[filter.value]}
              </span>
            </Button>
          ))}
        </div>

        <Table
          columns={columns}
          data={filteredCustomers}
          onRowClick={handleView}
          emptyMessage="No customers match the current filters."
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? "Edit customer" : "Add customer"}
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              aria-label="Cancel"
              title="Cancel"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingCustomer(null);
              }}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              aria-label="Save customer"
              title="Save customer"
              onClick={handleSave}
            >
              <Check className="h-4 w-4" />
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(event) =>
              setFormData({ ...formData, name: event.target.value })
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(event) =>
              setFormData({ ...formData, email: event.target.value })
            }
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(event) =>
              setFormData({ ...formData, phone: event.target.value })
            }
            required
          />
          <Input
            label="Nationality"
            value={formData.nationality}
            onChange={(event) =>
              setFormData({ ...formData, nationality: event.target.value })
            }
            required
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
            <input
              type="checkbox"
              checked={formData.hasPremiumCard}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  hasPremiumCard: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Premium card holder
              </p>
              <p className="text-xs text-slate-500">
                Enables VIP benefits and loyalty perks.
              </p>
            </div>
          </label>
          <p className="text-xs text-slate-500">
            Status is automatically calculated from visits and premium card
            activity.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsOpen && !!selectedCustomer}
        onClose={handleCloseDetails}
        title={selectedCustomer ? selectedCustomer.name : "Customer details"}
        footer={
          selectedCustomer && (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDetails}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEdit(selectedCustomer)}
              >
                <Edit className="h-4 w-4" />
                Edit customer
              </Button>
            </div>
          )
        }
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <p className="text-xs font-medium text-slate-500">Email</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.email}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">Phone</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatPhoneNumber(selectedCustomer.phone)}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">Nationality</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.nationality || "Not provided"}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">Total spend</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(selectedCustomer.totalSpent, currencyCode)}
                </p>
              </Card>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_BADGE_CLASS[selectedCustomer.calculatedStatus]
                  }`}
                >
                  {formatStatusLabel(selectedCustomer.calculatedStatus)}
                </span>
                {selectedCustomer.hasPremium && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    Premium card holder
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Visits recorded
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCustomer.visitCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Upcoming stays
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCustomer.upcomingCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    First seen
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCustomer.firstSeen
                      ? formatDate(selectedCustomer.firstSeen)
                      : "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Last stay</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCustomer.lastVisit
                      ? formatDate(selectedCustomer.lastVisit)
                      : "No stay yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
