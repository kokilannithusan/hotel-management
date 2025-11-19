import React, { createContext, useContext, useState, ReactNode } from "react";
import { EventInvoice } from "../types/entities";

interface EventInvoiceFilters {
  eventReferenceNo: string;
  nic: string;
  passport: string;
  companyRegNo: string;
  status: EventInvoice["status"] | "";
  dateFrom: string;
  dateTo: string;
}

interface EventInvoiceContextType {
  eventInvoices: EventInvoice[];
  filters: EventInvoiceFilters;
  selectedEventInvoice: EventInvoice | null;

  // Event Invoice actions
  addEventInvoice: (invoice: EventInvoice) => void;
  updateEventInvoice: (id: string, updates: Partial<EventInvoice>) => void;
  deleteEventInvoice: (id: string) => void;
  getEventInvoiceById: (id: string) => EventInvoice | undefined;
  markAsPaid: (id: string, paidAmount: number) => void;

  // Filter and selection
  setFilters: (filters: Partial<EventInvoiceFilters>) => void;
  setSelectedEventInvoice: (invoice: EventInvoice | null) => void;
  getFilteredEventInvoices: () => EventInvoice[];
}

const EventInvoiceContext = createContext<EventInvoiceContextType | undefined>(
  undefined
);

// Mock data - comprehensive event invoices
const mockEventInvoices: EventInvoice[] = [
  {
    id: "evt-inv-1",
    invoiceNumber: "EVTINV2001",
    eventId: "evt-001",
    eventReferenceNo: "EVT2025-001",
    eventName: "Corporate Gala Dinner",
    eventType: "conference",
    organizerName: "ABC Corp",
    customerId: "CUS210",
    customerName: "ABC Corp",
    customerCompanyRegNo: "CRN123456",
    eventStartDateTime: "2025-11-18T17:45:00",
    eventEndDateTime: "2025-11-19T18:45:00",
    hallName: "Conference Room A - Second Floor",
    attendees: 40,
    packageName: "Premium Wedding Package",
    packageBasePrice: 25000,
    packageTaxRate: 12.5,
    includedServices: [
      "Full catering service",
      "Professional DJ and sound system",
      "Floral decorations",
      "Wedding cake",
      "Photography service",
      "Bridal suite accommodation",
      "Dedicated event coordinator",
    ],
    addOnServices: [
      {
        id: "addon-1",
        name: "Extra lighting setup",
        quantity: 1,
        unitPrice: 3000,
        totalPrice: 3000,
      },
      {
        id: "addon-2",
        name: "Video recording service",
        quantity: 1,
        unitPrice: 8000,
        totalPrice: 8000,
      },
    ],
    decorationType: "Vintage",
    cateringRequirements: "Gluten-Free",
    standardHours: 8,
    totalHours: 25,
    extraHours: 17,
    overtimeRate: 300,
    overtimeCharges: 5100,
    subtotal: 41100,
    taxAmount: 5137.5,
    discountAmount: 0,
    totalAmount: 46237.5,
    status: "Partially Paid",
    paidAmount: 20000,
    staffResponsible: "Event Manager - Priya",
    dateIssued: "2025-11-18",
    dueDate: "2025-11-25",
    notes:
      "Client requested vintage theme decorations and gluten-free catering",
    createdAt: "2025-11-18T10:00:00",
  },
  {
    id: "evt-inv-2",
    invoiceNumber: "EVTINV2002",
    eventId: "evt-002",
    eventReferenceNo: "EVT2025-002",
    eventName: "Annual Company Meeting",
    eventType: "corporate",
    organizerName: "Tech Solutions Ltd",
    customerId: "CUS211",
    customerName: "Sarah Johnson",
    customerNIC: "198523456V",
    eventStartDateTime: "2025-11-20T09:00:00",
    eventEndDateTime: "2025-11-20T17:00:00",
    hallName: "Grand Ballroom",
    attendees: 150,
    packageName: "Corporate Meeting Package",
    packageBasePrice: 45000,
    packageTaxRate: 12.5,
    includedServices: [
      "Meeting room setup",
      "Projector and screen",
      "Sound system",
      "Coffee breaks (2x)",
      "Lunch buffet",
      "Stationery kits",
    ],
    addOnServices: [
      {
        id: "addon-3",
        name: "Translation services",
        quantity: 2,
        unitPrice: 5000,
        totalPrice: 10000,
      },
    ],
    standardHours: 8,
    totalHours: 8,
    extraHours: 0,
    overtimeRate: 500,
    overtimeCharges: 0,
    subtotal: 55000,
    taxAmount: 6875,
    discountAmount: 2000,
    totalAmount: 59875,
    status: "Paid",
    paidAmount: 59875,
    staffResponsible: "Event Coordinator - Maya",
    dateIssued: "2025-11-15",
    dueDate: "2025-11-20",
    paidDate: "2025-11-17",
    createdAt: "2025-11-15T14:30:00",
  },
  {
    id: "evt-inv-3",
    invoiceNumber: "EVTINV2003",
    eventId: "evt-003",
    eventReferenceNo: "EVT2025-003",
    eventName: "Luxury Wedding Celebration",
    eventType: "wedding",
    organizerName: "Rajesh & Anita",
    customerId: "CUS212",
    customerName: "Rajesh Kumar",
    customerPassport: "P8765432",
    eventStartDateTime: "2025-12-01T16:00:00",
    eventEndDateTime: "2025-12-02T02:00:00",
    hallName: "Crystal Ballroom",
    attendees: 300,
    packageName: "Luxury Wedding Package",
    packageBasePrice: 180000,
    packageTaxRate: 12.5,
    includedServices: [
      "Full venue decoration",
      "5-course dinner buffet",
      "Open bar service",
      "Live band performance",
      "Professional photography & videography",
      "Wedding cake (5-tier)",
      "Bridal suite (2 nights)",
      "Valet parking service",
    ],
    addOnServices: [
      {
        id: "addon-4",
        name: "Fireworks display",
        quantity: 1,
        unitPrice: 25000,
        totalPrice: 25000,
      },
      {
        id: "addon-5",
        name: "Photo booth rental",
        quantity: 1,
        unitPrice: 15000,
        totalPrice: 15000,
      },
      {
        id: "addon-6",
        name: "Additional guest accommodation",
        quantity: 10,
        unitPrice: 8000,
        totalPrice: 80000,
      },
    ],
    decorationType: "Royal Theme",
    cateringRequirements: "Vegetarian & Non-Vegetarian options",
    customRequirements: "Special stage setup for cultural performances",
    standardHours: 10,
    totalHours: 10,
    extraHours: 0,
    overtimeRate: 800,
    overtimeCharges: 0,
    subtotal: 300000,
    taxAmount: 37500,
    discountAmount: 10000,
    totalAmount: 327500,
    status: "Pending",
    staffResponsible: "Senior Event Manager - Rajesh",
    dateIssued: "2025-11-16",
    dueDate: "2025-11-28",
    notes: "Advance payment of 30% required to confirm booking",
    createdAt: "2025-11-16T11:00:00",
  },
  {
    id: "evt-inv-4",
    invoiceNumber: "EVTINV2004",
    eventId: "evt-004",
    eventReferenceNo: "EVT2025-004",
    eventName: "Product Launch Event",
    eventType: "corporate",
    organizerName: "Innovation Tech Pvt Ltd",
    customerId: "CUS213",
    customerName: "Innovation Tech Pvt Ltd",
    customerCompanyRegNo: "CRN987654",
    eventStartDateTime: "2025-11-22T18:00:00",
    eventEndDateTime: "2025-11-22T22:00:00",
    hallName: "Conference Hall B",
    attendees: 80,
    packageName: "Corporate Event Package",
    packageBasePrice: 35000,
    packageTaxRate: 12.5,
    includedServices: [
      "Stage setup with backdrop",
      "Audio-visual equipment",
      "Welcome drinks",
      "Finger food service",
      "Event coordinator",
    ],
    addOnServices: [
      {
        id: "addon-7",
        name: "LED wall rental",
        quantity: 1,
        unitPrice: 12000,
        totalPrice: 12000,
      },
      {
        id: "addon-8",
        name: "Media coverage team",
        quantity: 1,
        unitPrice: 18000,
        totalPrice: 18000,
      },
    ],
    standardHours: 4,
    totalHours: 6,
    extraHours: 2,
    overtimeRate: 400,
    overtimeCharges: 800,
    subtotal: 65800,
    taxAmount: 8225,
    discountAmount: 1500,
    totalAmount: 72525,
    status: "Partially Paid",
    paidAmount: 30000,
    staffResponsible: "Event Manager - Priya",
    dateIssued: "2025-11-18",
    dueDate: "2025-11-22",
    createdAt: "2025-11-18T16:00:00",
  },
];

export const EventInvoiceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [eventInvoices, setEventInvoices] =
    useState<EventInvoice[]>(mockEventInvoices);
  const [selectedEventInvoice, setSelectedEventInvoice] =
    useState<EventInvoice | null>(null);
  const [filters, setFiltersState] = useState<EventInvoiceFilters>({
    eventReferenceNo: "",
    nic: "",
    passport: "",
    companyRegNo: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  const addEventInvoice = (invoice: EventInvoice) => {
    setEventInvoices([...eventInvoices, invoice]);
  };

  const updateEventInvoice = (id: string, updates: Partial<EventInvoice>) => {
    setEventInvoices(
      eventInvoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const deleteEventInvoice = (id: string) => {
    setEventInvoices(eventInvoices.filter((inv) => inv.id !== id));
  };

  const getEventInvoiceById = (id: string) => {
    return eventInvoices.find((inv) => inv.id === id);
  };

  const markAsPaid = (id: string, paidAmount: number) => {
    const invoice = eventInvoices.find((inv) => inv.id === id);
    if (!invoice) return;

    const totalPaid = (invoice.paidAmount || 0) + paidAmount;
    const status: EventInvoice["status"] =
      totalPaid >= invoice.totalAmount
        ? "Paid"
        : totalPaid > 0
        ? "Partially Paid"
        : "Pending";

    updateEventInvoice(id, {
      status,
      paidAmount: totalPaid,
      paidDate:
        status === "Paid" ? new Date().toISOString().split("T")[0] : undefined,
    });
  };

  const setFilters = (newFilters: Partial<EventInvoiceFilters>) => {
    setFiltersState({ ...filters, ...newFilters });
  };

  const getFilteredEventInvoices = () => {
    return eventInvoices.filter((invoice) => {
      const matchesEventRef =
        !filters.eventReferenceNo ||
        invoice.eventReferenceNo
          .toLowerCase()
          .includes(filters.eventReferenceNo.toLowerCase());

      const matchesNIC =
        !filters.nic ||
        (invoice.customerNIC &&
          invoice.customerNIC
            .toLowerCase()
            .includes(filters.nic.toLowerCase()));

      const matchesPassport =
        !filters.passport ||
        (invoice.customerPassport &&
          invoice.customerPassport
            .toLowerCase()
            .includes(filters.passport.toLowerCase()));

      const matchesCompanyRegNo =
        !filters.companyRegNo ||
        (invoice.customerCompanyRegNo &&
          invoice.customerCompanyRegNo
            .toLowerCase()
            .includes(filters.companyRegNo.toLowerCase()));

      const matchesStatus =
        !filters.status || invoice.status === filters.status;

      const matchesDateFrom =
        !filters.dateFrom ||
        new Date(invoice.dateIssued) >= new Date(filters.dateFrom);

      const matchesDateTo =
        !filters.dateTo ||
        new Date(invoice.dateIssued) <= new Date(filters.dateTo);

      return (
        matchesEventRef &&
        matchesNIC &&
        matchesPassport &&
        matchesCompanyRegNo &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  };

  const value: EventInvoiceContextType = {
    eventInvoices,
    filters,
    selectedEventInvoice,
    addEventInvoice,
    updateEventInvoice,
    deleteEventInvoice,
    getEventInvoiceById,
    markAsPaid,
    setFilters,
    setSelectedEventInvoice,
    getFilteredEventInvoices,
  };

  return (
    <EventInvoiceContext.Provider value={value}>
      {children}
    </EventInvoiceContext.Provider>
  );
};

export const useEventInvoice = () => {
  const context = useContext(EventInvoiceContext);
  if (!context) {
    throw new Error("useEventInvoice must be used within EventInvoiceProvider");
  }
  return context;
};
