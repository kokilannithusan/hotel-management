import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Input } from "../../components/ui/Input";
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

interface CustomerMetrics {
  visitCount: number;
  upcomingCount: number;
  lastVisit: string | null;
  totalSpent: number;
  firstSeen: string | null;
}

interface EnhancedCustomer extends Customer {
  visitCount: number;
  upcomingCount: number;
  lastVisit: string | null;
  totalSpent: number;
  firstSeen: string | null;
  calculatedStatus: CustomerStatus;
}

const STATUS_BADGE_CLASS: Record<CustomerStatus, string> = {
  VIP: "bg-amber-100 text-amber-700",
  "regular customer": "bg-blue-100 text-blue-800",
  "new customer": "bg-emerald-100 text-emerald-700",
};

const ITEMS_PER_PAGE = 10;

const createEmptyCustomerForm = () => ({
  firstName: "",
  lastName: "",
  identificationNumber: "",
  email: "",
  phone: "",
  dob: "",
  nationality: "",
  country: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
});

type CustomerFormState = ReturnType<typeof createEmptyCustomerForm>;

const formatStatusLabel = (status: CustomerStatus) => {
  switch (status) {
    case "VIP":
      return "VIP guest";
    case "new customer":
      return "New customer";
    default:
      return "Regular customer";
  }
};

export const ManageCustomer: React.FC = () => {
  const { state, dispatch } = useHotel();
  const currencyCode = state.settings?.currency ?? "USD";

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<CustomerFormState>(
    createEmptyCustomerForm()
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const customerMetrics = useMemo(() => {
    const metricsMap = new Map<string, CustomerMetrics>();

    state.customers.forEach((customer) => {
      metricsMap.set(customer.id, {
        visitCount: 0,
        upcomingCount: 0,
        lastVisit: null,
        totalSpent: 0,
        firstSeen: customer.createdAt ?? null,
      });
    });

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
        firstSeen: customer.createdAt ?? null,
      };

      const calculatedStatus: CustomerStatus = "regular customer";

      return {
        ...customer,
        calculatedStatus,
        visitCount: metrics.visitCount,
        upcomingCount: metrics.upcomingCount,
        lastVisit: metrics.lastVisit,
        totalSpent: metrics.totalSpent,
        firstSeen: metrics.firstSeen,
      };
    });
  }, [state.customers, customerMetrics]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = customersWithStatus.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        (customer.firstName?.toLowerCase().includes(normalizedSearch) ??
          false) ||
        (customer.lastName?.toLowerCase().includes(normalizedSearch) ??
          false) ||
        (customer.identificationNumber
          ?.toLowerCase()
          .includes(normalizedSearch) ??
          false) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.phone.toLowerCase().includes(normalizedSearch) ||
        (customer.country?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (customer.city?.toLowerCase().includes(normalizedSearch) ?? false) ||
        (customer.addressLine1?.toLowerCase().includes(normalizedSearch) ??
          false);

      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [customersWithStatus, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tableStartIndex =
    filteredCustomers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const tableEndIndex = Math.min(
    filteredCustomers.length,
    currentPage * ITEMS_PER_PAGE
  );

  const filtersActive = searchTerm.trim().length > 0;

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
    setCurrentPage(1);
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
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      identificationNumber: customer.identificationNumber ?? "",
      email: customer.email,
      phone: customer.phone,
      dob: customer.dob ?? "",
      nationality: customer.nationality,
      country: customer.country ?? "",
      city: customer.city ?? "",
      addressLine1: customer.addressLine1 ?? "",
      addressLine2: customer.addressLine2 ?? "",
    });
    setShowModal(true);
    setIsDetailsOpen(false);
  };

  const handleSave = () => {
    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedIdNumber = formData.identificationNumber.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedNationality = formData.nationality.trim();
    const trimmedCountry = formData.country.trim();
    const trimmedCity = formData.city.trim();
    const trimmedAddressLine1 = formData.addressLine1.trim();
    const trimmedAddressLine2 = formData.addressLine2.trim();
    const dobValue = formData.dob.trim();

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedIdNumber ||
      !trimmedEmail ||
      !trimmedPhone ||
      !dobValue ||
      !trimmedNationality ||
      !trimmedCountry ||
      !trimmedCity ||
      !trimmedAddressLine1
    ) {
      window.alert("Please fill in all required fields before saving.");
      return;
    }

    const normalizedName = `${trimmedFirstName} ${trimmedLastName}`;
    const preparedPayload = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      identificationNumber: trimmedIdNumber,
      name: normalizedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      dob: dobValue,
      nationality: trimmedNationality,
      country: trimmedCountry,
      city: trimmedCity,
      addressLine1: trimmedAddressLine1,
      addressLine2: trimmedAddressLine2,
    };

    if (editingCustomer) {
      dispatch({
        type: "UPDATE_CUSTOMER",
        payload: {
          ...editingCustomer,
          ...preparedPayload,
        },
      });
    } else {
      dispatch({
        type: "ADD_CUSTOMER",
        payload: {
          id: generateId(),
          createdAt: new Date().toISOString(),
          ...preparedPayload,
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

  const handleDocumentUpload = (
    customer: EnhancedCustomer,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const targetCustomer = state.customers.find(
      (existing) => existing.id === customer.id
    );

    if (!targetCustomer) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      dispatch({
        type: "UPDATE_CUSTOMER",
        payload: {
          ...targetCustomer,
          identificationDocumentName: file.name,
          identificationDocumentUrl: reader.result as string,
        },
      });
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
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
      key: "firstName",
      header: "First name",
      cellClassName: "whitespace-normal max-w-[140px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-sm font-semibold text-slate-900">
          {customer.firstName}
        </span>
      ),
    },
    {
      key: "lastName",
      header: "Last name",
      cellClassName: "whitespace-normal max-w-[140px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-sm text-slate-900">{customer.lastName}</span>
      ),
    },
    {
      key: "identificationNumber",
      header: "ID (NIC/Passport)",
      cellClassName: "whitespace-normal max-w-[160px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-xs text-slate-600">
          {customer.identificationNumber ?? "Not provided"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cellClassName: "whitespace-normal max-w-[180px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-xs text-slate-600 break-words">
          {customer.email}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cellClassName: "whitespace-normal max-w-[140px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-xs text-slate-600">
          {formatPhoneNumber(customer.phone)}
        </span>
      ),
    },
    {
      key: "country",
      header: "Country",
      cellClassName: "whitespace-normal max-w-[140px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-xs text-slate-600">
          {customer.country ?? "Not set"}
        </span>
      ),
    },
    {
      key: "addressLine2",
      header: "Add. 2",
      cellClassName: "whitespace-normal max-w-[220px]",
      render: (customer: EnhancedCustomer) => (
        <span className="text-xs text-slate-600">
          {customer.addressLine2 ?? "—"}
        </span>
      ),
    },
    {
      key: "document",
      header: "NIC/Passport doc",
      cellClassName: "whitespace-normal max-w-[180px]",
      render: (customer: EnhancedCustomer) => (
        <div className="flex flex-col gap-1 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">
            {customer.identificationDocumentName ?? "No file uploaded"}
          </p>
          <label
            className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-500 hover:shadow-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(event) => handleDocumentUpload(customer, event)}
            />
            Upload
          </label>
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
          <Button
            aria-label="Add customer"
            title="Add customer"
            onClick={handleAdd}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
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

        <div className="mb-6">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <Table
          columns={columns}
          data={pagedCustomers}
          onRowClick={handleView}
          emptyMessage="No customers match the current filters."
        />
        {filteredCustomers.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {tableStartIndex}–{tableEndIndex} of{" "}
              {filteredCustomers.length} guests
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="First name"
              value={formData.firstName}
              onChange={(event) =>
                setFormData({ ...formData, firstName: event.target.value })
              }
              required
            />
            <Input
              label="Last name"
              value={formData.lastName}
              onChange={(event) =>
                setFormData({ ...formData, lastName: event.target.value })
              }
              required
            />
            <Input
              label="NIC / Passport number"
              value={formData.identificationNumber}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  identificationNumber: event.target.value,
                })
              }
              required
            />
            <Input
              label="Date of birth"
              type="date"
              value={formData.dob}
              onChange={(event) =>
                setFormData({ ...formData, dob: event.target.value })
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
            <Input
              label="Country"
              value={formData.country}
              onChange={(event) =>
                setFormData({ ...formData, country: event.target.value })
              }
              required
            />
            <Input
              label="City"
              value={formData.city}
              onChange={(event) =>
                setFormData({ ...formData, city: event.target.value })
              }
              required
            />
            <Input
              label="Address line 1"
              value={formData.addressLine1}
              onChange={(event) =>
                setFormData({ ...formData, addressLine1: event.target.value })
              }
              required
            />
            <Input
              label="Address line 2"
              value={formData.addressLine2}
              onChange={(event) =>
                setFormData({ ...formData, addressLine2: event.target.value })
              }
            />
          </div>
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
                <p className="text-xs font-medium text-slate-500">
                  Nationality
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.nationality || "Not provided"}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">
                  Total spend
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(selectedCustomer.totalSpent, currencyCode)}
                </p>
              </Card>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <p className="text-xs font-medium text-slate-500">
                  NIC / Passport
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.identificationNumber || "Not recorded"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.identificationDocumentName
                    ? "Document uploaded"
                    : "No document uploaded"}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">
                  Date of birth
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.dob
                    ? formatDate(selectedCustomer.dob)
                    : "Not recorded"}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">Location</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.country || "Country not set"}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedCustomer.city || "City not set"}
                </p>
              </Card>
              <Card>
                <p className="text-xs font-medium text-slate-500">Address</p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedCustomer.addressLine1 || "Address line 1 missing"}
                </p>
                {selectedCustomer.addressLine2 && (
                  <p className="text-xs text-slate-500">
                    {selectedCustomer.addressLine2}
                  </p>
                )}
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
                  <p className="text-xs font-medium text-slate-500">
                    Last stay
                  </p>
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
