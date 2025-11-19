import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  Invoice,
  PaymentReceipt,
  CreditNote,
  AdditionalBillingItem,
  Refund,
  InvoiceStatus,
  ReferenceType,
} from "../types/entities";

interface InvoiceFilters {
  referenceNo: string;
  nic: string;
  passport: string;
  status: InvoiceStatus | "";
  referenceType: ReferenceType | "";
  dateFrom: string;
  dateTo: string;
}

interface InvoiceContextType {
  invoices: Invoice[];
  paymentReceipts: PaymentReceipt[];
  creditNotes: CreditNote[];
  additionalBillingItems: AdditionalBillingItem[];
  refunds: Refund[];
  filters: InvoiceFilters;
  selectedInvoice: Invoice | null;

  // Invoice actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  markAsPaid: (id: string, paymentMethod: string) => void;

  // Receipt actions
  addReceipt: (receipt: PaymentReceipt) => void;
  getReceiptsByInvoiceId: (invoiceId: string) => PaymentReceipt[];

  // Credit Note actions
  addCreditNote: (creditNote: CreditNote) => void;
  applyCreditNote: (creditNoteId: string, invoiceId: string) => void;

  // Additional Billing actions
  addAdditionalBilling: (item: AdditionalBillingItem) => void;
  updateAdditionalBilling: (
    id: string,
    updates: Partial<AdditionalBillingItem>
  ) => void;

  // Refund actions
  addRefund: (refund: Refund) => void;
  updateRefundStatus: (id: string, status: Refund["status"]) => void;

  // Filter and selection
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  getFilteredInvoices: () => Invoice[];
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV1001",
    referenceType: "Reservation",
    reservationId: "RES20241",
    guest: {
      id: "CUS110",
      name: "Arun Kumar",
      phone: "0778945621",
      email: "arun@example.com",
      nic: "987654321V",
      passportNo: "N1234567",
      reference: {
        type: "Reservation",
        refNo: "RES20241",
      },
    },
    reservation: {
      roomNo: "A102",
      type: "Deluxe Room",
      rate: 5500,
      checkIn: "2025-11-10",
      checkOut: "2025-11-13",
      nights: 3,
      mealPlan: {
        type: "Full Board",
        pricePerDay: 1200,
        totalPrice: 3600,
      },
    },
    services: [
      { id: "s1", name: "Breakfast Buffet", amount: 1500 },
      { id: "s2", name: "Laundry Service", amount: 600 },
    ],
    additionalCharges: [{ id: "ac1", name: "Mini Bar", amount: 1200 }],
    chargeBreakdown: {
      roomCharges: 16500,
      mealPlanTotal: 3600,
      serviceTotal: 2100,
      extraCharges: 1200,
      subTotal: 23400,
      taxRate: 12,
      taxAmount: 2808,
      discount: 500,
      grandTotal: 25708,
    },
    status: "Unpaid",
    generatedDate: "2025-11-13",
    dueDate: "2025-11-14",
    createdBy: "user1",
  },
  {
    id: "2",
    invoiceId: "INV1002",
    referenceType: "Event",
    eventId: "EVT5001",
    guest: {
      id: "CUS111",
      name: "Priya Sharma",
      phone: "0771234567",
      email: "priya@example.com",
      nic: "923456789V",
      reference: {
        type: "Event",
        refNo: "EVT5001",
      },
    },
    event: {
      hallName: "Grand Ballroom",
      eventType: "Wedding",
      startDateTime: "2025-11-20 18:00",
      endDateTime: "2025-11-20 23:00",
      duration: 5,
      hallRate: 25000,
      packageName: "Premium Wedding Package",
      packageRate: 150000,
      attendees: 200,
    },
    services: [
      {
        id: "s3",
        name: "Catering - 200 persons",
        amount: 80000,
        quantity: 200,
        unitPrice: 400,
      },
      { id: "s4", name: "Decoration Premium", amount: 35000 },
      { id: "s5", name: "Sound & Lighting", amount: 20000 },
    ],
    additionalCharges: [
      { id: "ac2", name: "Extra Staff (5 persons)", amount: 10000 },
      { id: "ac3", name: "Valet Parking", amount: 15000 },
    ],
    chargeBreakdown: {
      eventCharges: 25000,
      serviceTotal: 135000,
      extraCharges: 25000,
      subTotal: 185000,
      taxRate: 15,
      taxAmount: 27750,
      discount: 5000,
      grandTotal: 207750,
    },
    status: "Partially Paid",
    generatedDate: "2025-11-15",
    dueDate: "2025-11-19",
    createdBy: "user1",
  },
  {
    id: "3",
    invoiceId: "INV1003",
    referenceType: "Reservation",
    reservationId: "RES20242",
    guest: {
      id: "CUS112",
      name: "John Smith",
      phone: "0769876543",
      email: "john@example.com",
      passportNo: "P9876543",
      reference: {
        type: "Reservation",
        refNo: "RES20242",
      },
    },
    reservation: {
      roomNo: "B205",
      type: "Executive Suite",
      rate: 12000,
      checkIn: "2025-11-08",
      checkOut: "2025-11-11",
      nights: 3,
      mealPlan: {
        type: "Bed & Breakfast",
        pricePerDay: 800,
        totalPrice: 2400,
      },
    },
    services: [
      { id: "s6", name: "Airport Transfer", amount: 3000 },
      { id: "s7", name: "City Tour", amount: 5000 },
    ],
    additionalCharges: [],
    chargeBreakdown: {
      roomCharges: 36000,
      mealPlanTotal: 2400,
      serviceTotal: 8000,
      extraCharges: 0,
      subTotal: 46400,
      taxRate: 12,
      taxAmount: 5568,
      discount: 1000,
      grandTotal: 50968,
    },
    status: "Paid",
    generatedDate: "2025-11-11",
    dueDate: "2025-11-11",
    paidDate: "2025-11-11",
    paymentMethod: "card",
    createdBy: "user1",
  },
];

const mockReceipts: PaymentReceipt[] = [
  {
    id: "r1",
    receiptNumber: "RCP1001",
    invoiceId: "3",
    invoiceNumber: "INV1003",
    customerId: "CUS112",
    customerName: "John Smith",
    customerEmail: "john@example.com",
    customerPhone: "0769876543",
    amount: 50968,
    currency: "USD",
    currencyRate: 330,
    paymentDate: "2025-11-11",
    issuedBy: "user1",
    createdAt: "2025-11-11T10:30:00",
  },
];

const mockCreditNotes: CreditNote[] = [
  {
    id: "cn1",
    creditNoteNumber: "CN1001",
    invoiceId: "1",
    invoiceNumber: "INV1001",
    customerId: "CUS110",
    customerName: "Arun Kumar",
    reason: "Room AC malfunction – compensation for inconvenience",
    reasonCategory: "service_issue",
    originalAmount: 25708,
    creditAmount: 3000,
    status: "issued",
    issuedDate: "2025-11-14",
    issuedBy: "Receptionist - Maya",
    notes: "Customer satisfaction adjustment",
  },
  {
    id: "cn2",
    creditNoteNumber: "CN1002",
    invoiceId: "2",
    invoiceNumber: "INV1002",
    customerId: "CUS111",
    customerName: "Priya Sharma",
    reason: "Overcharge on minibar items – billing correction",
    reasonCategory: "billing_error",
    originalAmount: 43750,
    creditAmount: 2500,
    status: "issued",
    issuedDate: "2025-11-15",
    issuedBy: "Manager - Rajesh",
  },
  {
    id: "cn3",
    creditNoteNumber: "CN1003",
    invoiceId: "3",
    invoiceNumber: "INV1003",
    customerId: "CUS112",
    customerName: "John Smith",
    reason: "Event cancellation – partial refund as per policy",
    reasonCategory: "cancellation",
    originalAmount: 50968,
    creditAmount: 15000,
    status: "applied",
    issuedDate: "2025-11-16",
    issuedBy: "Manager - Rajesh",
    appliedToInvoiceId: "3",
    appliedDate: "2025-11-16T15:30:00",
  },
];
const mockAdditionalBillingItems: AdditionalBillingItem[] = [];
const mockRefunds: Refund[] = [
  {
    id: "rf1",
    refundNumber: "RF1001",
    reservationId: "RES20241",
    invoiceId: "1",
    customerId: "CUS110",
    customerName: "Arun Kumar",
    amount: 3000,
    currency: "LKR",
    currencyRate: 1,
    reason: "Room AC malfunction - partial refund as compensation",
    status: "completed",
    createdAt: "2025-11-14T09:00:00",
    processedAt: "2025-11-14T10:30:00",
    processedBy: "Receptionist - Maya",
    notes: "Partial refund processed",
  },
  {
    id: "rf2",
    refundNumber: "RF1002",
    eventId: "EVT5001",
    invoiceId: "2",
    customerId: "CUS111",
    customerName: "Priya Sharma",
    amount: 15000,
    currency: "EUR",
    currencyRate: 360,
    reason: "Cancellation due to personal emergency",
    status: "pending",
    createdAt: "2025-11-16T14:20:00",
    processedBy: "Manager - Rajesh",
    notes: "Awaiting processing confirmation",
  },
];

export const InvoiceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [paymentReceipts, setPaymentReceipts] =
    useState<PaymentReceipt[]>(mockReceipts);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(mockCreditNotes);
  const [additionalBillingItems, setAdditionalBillingItems] = useState<
    AdditionalBillingItem[]
  >(mockAdditionalBillingItems);
  const [refunds, setRefunds] = useState<Refund[]>(mockRefunds);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filters, setFiltersState] = useState<InvoiceFilters>({
    referenceNo: "",
    nic: "",
    passport: "",
    status: "",
    referenceType: "",
    dateFrom: "",
    dateTo: "",
  });

  const addInvoice = (invoice: Invoice) => {
    setInvoices([...invoices, invoice]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(
      invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
  };

  const getInvoiceById = (id: string) => {
    return invoices.find((inv) => inv.id === id);
  };

  const markAsPaid = (id: string, paymentMethod: string) => {
    const now = new Date().toISOString().split("T")[0];
    updateInvoice(id, {
      status: "Paid",
      paidDate: now,
      paymentMethod,
    });
  };

  const addReceipt = (receipt: PaymentReceipt) => {
    setPaymentReceipts([...paymentReceipts, receipt]);
  };

  const getReceiptsByInvoiceId = (invoiceId: string) => {
    return paymentReceipts.filter((r) => r.invoiceId === invoiceId);
  };

  const addCreditNote = (creditNote: CreditNote) => {
    setCreditNotes([...creditNotes, creditNote]);
  };

  const applyCreditNote = (creditNoteId: string, invoiceId: string) => {
    const now = new Date().toISOString();
    setCreditNotes(
      creditNotes.map((cn) =>
        cn.id === creditNoteId
          ? {
              ...cn,
              status: "applied",
              appliedToInvoiceId: invoiceId,
              appliedDate: now,
            }
          : cn
      )
    );
  };

  const addAdditionalBilling = (item: AdditionalBillingItem) => {
    setAdditionalBillingItems([...additionalBillingItems, item]);
  };

  const updateAdditionalBilling = (
    id: string,
    updates: Partial<AdditionalBillingItem>
  ) => {
    setAdditionalBillingItems(
      additionalBillingItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const addRefund = (refund: Refund) => {
    setRefunds([...refunds, refund]);
  };

  const updateRefundStatus = (id: string, status: Refund["status"]) => {
    const now = new Date().toISOString();
    setRefunds(
      refunds.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              processedAt: status === "completed" ? now : r.processedAt,
            }
          : r
      )
    );
  };

  const setFilters = (newFilters: Partial<InvoiceFilters>) => {
    setFiltersState({ ...filters, ...newFilters });
  };

  const getFilteredInvoices = () => {
    return invoices.filter((invoice) => {
      const matchesReferenceNo =
        !filters.referenceNo ||
        invoice.guest.reference.refNo
          .toLowerCase()
          .includes(filters.referenceNo.toLowerCase());

      const matchesNIC =
        !filters.nic ||
        (invoice.guest.nic &&
          invoice.guest.nic.toLowerCase().includes(filters.nic.toLowerCase()));

      const matchesPassport =
        !filters.passport ||
        (invoice.guest.passportNo &&
          invoice.guest.passportNo
            .toLowerCase()
            .includes(filters.passport.toLowerCase()));

      const matchesStatus =
        !filters.status || invoice.status === filters.status;

      const matchesReferenceType =
        !filters.referenceType ||
        invoice.referenceType === filters.referenceType;

      const matchesDateFrom =
        !filters.dateFrom ||
        new Date(invoice.generatedDate) >= new Date(filters.dateFrom);

      const matchesDateTo =
        !filters.dateTo ||
        new Date(invoice.generatedDate) <= new Date(filters.dateTo);

      return (
        matchesReferenceNo &&
        matchesNIC &&
        matchesPassport &&
        matchesStatus &&
        matchesReferenceType &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  };

  const value: InvoiceContextType = {
    invoices,
    paymentReceipts,
    creditNotes,
    additionalBillingItems,
    refunds,
    filters,
    selectedInvoice,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById,
    markAsPaid,
    addReceipt,
    getReceiptsByInvoiceId,
    addCreditNote,
    applyCreditNote,
    addAdditionalBilling,
    updateAdditionalBilling,
    addRefund,
    updateRefundStatus,
    setFilters,
    setSelectedInvoice,
    getFilteredInvoices,
  };

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoice must be used within InvoiceProvider");
  }
  return context;
};
