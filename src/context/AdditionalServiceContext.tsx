import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  ServiceItemMaster,
  ReservationServiceAddon,
  EventServiceAddon,
  ServiceCategory,
  ServiceItemStatus,
} from "../types/entities";

// ============================================
// CONTEXT TYPE DEFINITION
// ============================================

interface AdditionalServiceContextType {
  // ===== SERVICE ITEMS MASTER (Global CRUD) =====
  serviceItems: ServiceItemMaster[];

  // Create new service item
  addServiceItem: (
    item: Omit<ServiceItemMaster, "id" | "createdAt">
  ) => ServiceItemMaster;

  // Update service item (with price history tracking)
  updateServiceItem: (
    id: string,
    updates: Partial<ServiceItemMaster>,
    updatedBy?: string
  ) => ServiceItemMaster | null;

  // Soft delete service item
  deleteServiceItem: (id: string, deletedBy?: string) => boolean;

  // Restore soft-deleted service item
  restoreServiceItem: (id: string) => boolean;

  // Get single service item
  getServiceItemById: (id: string) => ServiceItemMaster | undefined;

  // Filter by category
  getServiceItemsByCategory: (category: ServiceCategory) => ServiceItemMaster[];

  // Get only active items
  getActiveServiceItems: (category?: ServiceCategory) => ServiceItemMaster[];

  // Get inactive items
  getInactiveServiceItems: () => ServiceItemMaster[];

  // Validate if service can be deleted
  canDeleteServiceItem: (id: string) => { canDelete: boolean; reason?: string };

  // ===== RESERVATION ADD-ON SERVICES =====
  reservationAddons: ReservationServiceAddon[];

  // Add service to reservation
  addReservationAddon: (
    addon: Omit<
      ReservationServiceAddon,
      "id" | "createdAt" | "totalPrice" | "isInvoiced"
    >
  ) => ReservationServiceAddon;

  // Update addon (validates invoice lock)
  updateReservationAddon: (
    id: string,
    updates: Partial<ReservationServiceAddon>,
    updatedBy?: string
  ) => ReservationServiceAddon | null;

  // Soft delete addon (validates invoice lock)
  deleteReservationAddon: (id: string, deletedBy?: string) => boolean;

  // Get addons for specific reservation
  getReservationAddonsByReservationId: (
    reservationId: string
  ) => ReservationServiceAddon[];

  // Calculate total for reservation
  getReservationAddonTotal: (reservationId: string) => number;

  // Mark as invoiced (locks editing)
  markReservationAddonsAsInvoiced: (
    reservationId: string,
    invoiceId: string,
    invoiceNo: string
  ) => void;

  // ===== EVENT ADD-ON SERVICES =====
  eventAddons: EventServiceAddon[];

  // Add service to event
  addEventAddon: (
    addon: Omit<
      EventServiceAddon,
      "id" | "createdAt" | "totalPrice" | "isInvoiced"
    >
  ) => EventServiceAddon;

  // Update addon (validates invoice lock)
  updateEventAddon: (
    id: string,
    updates: Partial<EventServiceAddon>,
    updatedBy?: string
  ) => EventServiceAddon | null;

  // Soft delete addon (validates invoice lock)
  deleteEventAddon: (id: string, deletedBy?: string) => boolean;

  // Get addons for specific event
  getEventAddonsByEventBookingId: (
    eventBookingId: string
  ) => EventServiceAddon[];

  // Calculate total for event
  getEventAddonTotal: (eventBookingId: string) => number;

  // Mark as invoiced (locks editing)
  markEventAddonsAsInvoiced: (
    eventBookingId: string,
    invoiceId: string,
    invoiceNo: string
  ) => void;
}

// ============================================
// CONTEXT CREATION
// ============================================

const AdditionalServiceContext = createContext<
  AdditionalServiceContextType | undefined
>(undefined);

export const useAdditionalService = () => {
  const context = useContext(AdditionalServiceContext);
  if (!context) {
    throw new Error(
      "useAdditionalService must be used within AdditionalServiceProvider"
    );
  }
  return context;
};

// ============================================
// MOCK DATA (Hotel Industry Standards)
// ============================================

const mockServiceItems: ServiceItemMaster[] = [
  // Reservation Services
  {
    id: "SVC001",
    serviceName: "Airport Transfer",
    category: "Reservation",
    description: "One-way airport pickup or drop-off service",
    price: 2500,
    unitType: "one-time",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC002",
    serviceName: "Extra Bed",
    category: "Reservation",
    description: "Additional bed setup in guest room",
    price: 1500,
    unitType: "per day",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC003",
    serviceName: "Laundry Service",
    category: "Reservation",
    description: "Professional laundry and pressing",
    price: 500,
    unitType: "per item",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC004",
    serviceName: "Spa Treatment",
    category: "Reservation",
    description: "Full body massage and spa package",
    price: 5000,
    unitType: "per session",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC005",
    serviceName: "Room Service",
    category: "Reservation",
    description: "24/7 in-room dining service",
    price: 300,
    unitType: "per hour",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC006",
    serviceName: "Minibar Restocking",
    category: "Reservation",
    description: "Premium minibar items restocking",
    price: 2000,
    unitType: "one-time",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  // Event Services
  {
    id: "SVC007",
    serviceName: "Extra Lighting Setup",
    category: "Event",
    description: "Professional stage and ambient lighting",
    price: 5000,
    unitType: "one-time",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC008",
    serviceName: "Video Recording",
    category: "Event",
    description: "Professional event videography",
    price: 15000,
    unitType: "per hour",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC009",
    serviceName: "Photography Services",
    category: "Event",
    description: "Professional event photography",
    price: 12000,
    unitType: "per hour",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC010",
    serviceName: "DJ Services",
    category: "Event",
    description: "Professional DJ with sound system",
    price: 8000,
    unitType: "per session",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC011",
    serviceName: "Decoration Services",
    category: "Event",
    description: "Event hall decoration and setup",
    price: 10000,
    unitType: "one-time",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC012",
    serviceName: "Extra Catering Staff",
    category: "Event",
    description: "Additional catering and service staff",
    price: 2000,
    unitType: "per person",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  // Both Categories
  {
    id: "SVC013",
    serviceName: "Car Parking",
    category: "Both",
    description: "Secure covered parking space",
    price: 500,
    unitType: "per day",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC014",
    serviceName: "Premium Wi-Fi Access",
    category: "Both",
    description: "High-speed internet access",
    price: 200,
    unitType: "per day",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
  {
    id: "SVC015",
    serviceName: "Baby Cot",
    category: "Both",
    description: "Baby cot with bedding",
    price: 1000,
    unitType: "per day",
    status: "Active",
    createdAt: "2025-01-01T10:00:00",
    createdBy: "admin",
  },
];

const mockReservationAddons: ReservationServiceAddon[] = [
  {
    id: "RADDON001",
    reservationId: "RES001",
    reservationNo: "RES-2025-001",
    guestName: "John Smith",
    roomNo: "101",
    checkIn: "2025-11-18",
    checkOut: "2025-11-22",
    serviceId: "SVC001",
    serviceName: "Airport Transfer",
    quantity: 1,
    unitType: "one-time",
    unitPrice: 2500,
    totalPrice: 2500,
    serviceDate: "2025-11-18",
    serviceTime: "14:00",
    billingMethod: "Room",
    status: "Completed",
    isInvoiced: false,
    createdAt: "2025-11-18T10:00:00",
    createdBy: "reception",
  },
  {
    id: "RADDON002",
    reservationId: "RES001",
    reservationNo: "RES-2025-001",
    guestName: "John Smith",
    roomNo: "101",
    checkIn: "2025-11-18",
    checkOut: "2025-11-22",
    serviceId: "SVC002",
    serviceName: "Extra Bed",
    quantity: 4,
    unitType: "per day",
    unitPrice: 1500,
    totalPrice: 6000,
    serviceDate: "2025-11-18",
    serviceTime: "15:00",
    billingMethod: "Room",
    notes: "For child",
    status: "Pending",
    isInvoiced: false,
    createdAt: "2025-11-18T11:00:00",
    createdBy: "reception",
  },
];

const mockEventAddons: EventServiceAddon[] = [
  {
    id: "EADDON001",
    eventBookingId: "EVT001",
    eventBookingNo: "EVT-2025-001",
    eventName: "Corporate Gala",
    eventType: "Corporate",
    organizerName: "Tech Corp",
    venue: "Grand Ballroom",
    eventDate: "2025-11-25",
    eventTime: "18:00",
    serviceId: "SVC007",
    serviceName: "Extra Lighting Setup",
    quantity: 1,
    unitType: "one-time",
    unitPrice: 5000,
    totalPrice: 5000,
    serviceDate: "2025-11-25",
    serviceTime: "16:00",
    billingMethod: "Event Invoice" as
      | "Cash"
      | "Event Invoice"
      | "Reference No.",
    notes: "Setup before event starts",
    status: "Pending",
    isInvoiced: false,
    createdAt: "2025-11-15T10:00:00",
    createdBy: "events",
  },
  {
    id: "EADDON002",
    eventBookingId: "EVT001",
    eventBookingNo: "EVT-2025-001",
    eventName: "Corporate Gala",
    eventType: "Corporate",
    organizerName: "Tech Corp",
    venue: "Grand Ballroom",
    eventDate: "2025-11-25",
    eventTime: "18:00",
    serviceId: "SVC008",
    serviceName: "Video Recording",
    quantity: 4,
    unitType: "per hour",
    unitPrice: 15000,
    totalPrice: 60000,
    serviceDate: "2025-11-25",
    serviceTime: "18:00",
    billingMethod: "Event Invoice" as
      | "Cash"
      | "Event Invoice"
      | "Reference No.",
    status: "Pending",
    isInvoiced: false,
    createdAt: "2025-11-15T11:00:00",
    createdBy: "events",
  },
];

// ============================================
// PROVIDER COMPONENT
// ============================================

export const AdditionalServiceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [serviceItems, setServiceItems] =
    useState<ServiceItemMaster[]>(mockServiceItems);
  const [reservationAddons, setReservationAddons] = useState<
    ReservationServiceAddon[]
  >(mockReservationAddons);
  const [eventAddons, setEventAddons] =
    useState<EventServiceAddon[]>(mockEventAddons);

  // ===== SERVICE ITEMS MASTER CRUD =====

  const addServiceItem = (
    item: Omit<ServiceItemMaster, "id" | "createdAt">
  ): ServiceItemMaster => {
    const newItem: ServiceItemMaster = {
      ...item,
      id: `SVC${String(serviceItems.length + 1).padStart(3, "0")}`,
      createdAt: new Date().toISOString(),
    };
    setServiceItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateServiceItem = (
    id: string,
    updates: Partial<ServiceItemMaster>,
    updatedBy?: string
  ): ServiceItemMaster | null => {
    const item = serviceItems.find((s) => s.id === id);
    if (!item) return null;

    const updatedItem: ServiceItemMaster = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    // Track price history if price changed
    if (updates.price && updates.price !== item.price) {
      updatedItem.priceHistory = [
        ...(item.priceHistory || []),
        {
          price: item.price,
          effectiveDate: new Date().toISOString(),
          changedBy: updatedBy || "system",
        },
      ];
    }

    setServiceItems((prev) => prev.map((s) => (s.id === id ? updatedItem : s)));
    return updatedItem;
  };

  const deleteServiceItem = (id: string, deletedBy?: string): boolean => {
    const validation = canDeleteServiceItem(id);
    if (!validation.canDelete) {
      alert(validation.reason);
      return false;
    }

    setServiceItems((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Inactive" as ServiceItemStatus,
              deletedAt: new Date().toISOString(),
              deletedBy,
            }
          : s
      )
    );
    return true;
  };

  const restoreServiceItem = (id: string): boolean => {
    setServiceItems((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Active" as ServiceItemStatus,
              deletedAt: undefined,
              deletedBy: undefined,
            }
          : s
      )
    );
    return true;
  };

  const getServiceItemById = (id: string): ServiceItemMaster | undefined => {
    return serviceItems.find((s) => s.id === id);
  };

  const getServiceItemsByCategory = (
    category: ServiceCategory
  ): ServiceItemMaster[] => {
    return serviceItems.filter(
      (s) => s.category === category || s.category === "Both"
    );
  };

  const getActiveServiceItems = (
    category?: ServiceCategory
  ): ServiceItemMaster[] => {
    let items = serviceItems.filter((s) => s.status === "Active");
    if (category) {
      items = items.filter(
        (s) => s.category === category || s.category === "Both"
      );
    }
    return items;
  };

  const getInactiveServiceItems = (): ServiceItemMaster[] => {
    return serviceItems.filter((s) => s.status === "Inactive");
  };

  const canDeleteServiceItem = (
    id: string
  ): { canDelete: boolean; reason?: string } => {
    // Check if service is used in any non-deleted addons
    const usedInReservations = reservationAddons.some(
      (a) => a.serviceId === id && !a.deletedAt
    );
    const usedInEvents = eventAddons.some(
      (a) => a.serviceId === id && !a.deletedAt
    );

    if (usedInReservations || usedInEvents) {
      return {
        canDelete: false,
        reason:
          "Cannot delete service item that is assigned to reservations or events. Please soft-delete instead.",
      };
    }

    return { canDelete: true };
  };

  // ===== RESERVATION ADD-ON SERVICES =====

  const addReservationAddon = (
    addon: Omit<
      ReservationServiceAddon,
      "id" | "createdAt" | "totalPrice" | "isInvoiced"
    >
  ): ReservationServiceAddon => {
    const totalPrice = addon.unitPrice * addon.quantity;
    const newAddon: ReservationServiceAddon = {
      ...addon,
      id: `RADDON${String(reservationAddons.length + 1).padStart(3, "0")}`,
      totalPrice,
      isInvoiced: false,
      createdAt: new Date().toISOString(),
    };
    setReservationAddons((prev) => [...prev, newAddon]);
    return newAddon;
  };

  const updateReservationAddon = (
    id: string,
    updates: Partial<ReservationServiceAddon>,
    updatedBy?: string
  ): ReservationServiceAddon | null => {
    const addon = reservationAddons.find((a) => a.id === id);
    if (!addon) return null;

    // Validate invoice lock
    if (addon.isInvoiced) {
      alert("Cannot modify add-on service that has been invoiced");
      return null;
    }

    // Recalculate total if quantity or price changed
    const quantity = updates.quantity ?? addon.quantity;
    const unitPrice = updates.unitPrice ?? addon.unitPrice;
    const totalPrice = quantity * unitPrice;

    const updatedAddon: ReservationServiceAddon = {
      ...addon,
      ...updates,
      totalPrice,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    setReservationAddons((prev) =>
      prev.map((a) => (a.id === id ? updatedAddon : a))
    );
    return updatedAddon;
  };

  const deleteReservationAddon = (id: string, deletedBy?: string): boolean => {
    const addon = reservationAddons.find((a) => a.id === id);
    if (!addon) return false;

    // Validate invoice lock
    if (addon.isInvoiced) {
      alert("Cannot delete add-on service that has been invoiced");
      return false;
    }

    // Soft delete only
    setReservationAddons((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              deletedAt: new Date().toISOString(),
              deletedBy,
            }
          : a
      )
    );
    return true;
  };

  const getReservationAddonsByReservationId = (
    reservationId: string
  ): ReservationServiceAddon[] => {
    return reservationAddons.filter(
      (a) => a.reservationId === reservationId && !a.deletedAt
    );
  };

  const getReservationAddonTotal = (reservationId: string): number => {
    return reservationAddons
      .filter((a) => a.reservationId === reservationId && !a.deletedAt)
      .reduce((sum, a) => sum + a.totalPrice, 0);
  };

  const markReservationAddonsAsInvoiced = (
    reservationId: string,
    invoiceId: string,
    invoiceNo: string
  ): void => {
    setReservationAddons((prev) =>
      prev.map((a) =>
        a.reservationId === reservationId && !a.deletedAt
          ? {
              ...a,
              isInvoiced: true,
              invoiceId,
              invoiceNo,
            }
          : a
      )
    );
  };

  // ===== EVENT ADD-ON SERVICES =====

  const addEventAddon = (
    addon: Omit<
      EventServiceAddon,
      "id" | "createdAt" | "totalPrice" | "isInvoiced"
    >
  ): EventServiceAddon => {
    const totalPrice = addon.unitPrice * addon.quantity;
    const newAddon: EventServiceAddon = {
      ...addon,
      id: `EADDON${String(eventAddons.length + 1).padStart(3, "0")}`,
      totalPrice,
      isInvoiced: false,
      createdAt: new Date().toISOString(),
    };
    setEventAddons((prev) => [...prev, newAddon]);
    return newAddon;
  };

  const updateEventAddon = (
    id: string,
    updates: Partial<EventServiceAddon>,
    updatedBy?: string
  ): EventServiceAddon | null => {
    const addon = eventAddons.find((a) => a.id === id);
    if (!addon) return null;

    // Validate invoice lock
    if (addon.isInvoiced) {
      alert("Cannot modify add-on service that has been invoiced");
      return null;
    }

    // Recalculate total
    const quantity = updates.quantity ?? addon.quantity;
    const unitPrice = updates.unitPrice ?? addon.unitPrice;
    const totalPrice = quantity * unitPrice;

    const updatedAddon: EventServiceAddon = {
      ...addon,
      ...updates,
      totalPrice,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    setEventAddons((prev) => prev.map((a) => (a.id === id ? updatedAddon : a)));
    return updatedAddon;
  };

  const deleteEventAddon = (id: string, deletedBy?: string): boolean => {
    const addon = eventAddons.find((a) => a.id === id);
    if (!addon) return false;

    // Validate invoice lock
    if (addon.isInvoiced) {
      alert("Cannot delete add-on service that has been invoiced");
      return false;
    }

    // Soft delete only
    setEventAddons((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              deletedAt: new Date().toISOString(),
              deletedBy,
            }
          : a
      )
    );
    return true;
  };

  const getEventAddonsByEventBookingId = (
    eventBookingId: string
  ): EventServiceAddon[] => {
    return eventAddons.filter(
      (a) => a.eventBookingId === eventBookingId && !a.deletedAt
    );
  };

  const getEventAddonTotal = (eventBookingId: string): number => {
    return eventAddons
      .filter((a) => a.eventBookingId === eventBookingId && !a.deletedAt)
      .reduce((sum, a) => sum + a.totalPrice, 0);
  };

  const markEventAddonsAsInvoiced = (
    eventBookingId: string,
    invoiceId: string,
    invoiceNo: string
  ): void => {
    setEventAddons((prev) =>
      prev.map((a) =>
        a.eventBookingId === eventBookingId && !a.deletedAt
          ? {
              ...a,
              isInvoiced: true,
              invoiceId,
              invoiceNo,
            }
          : a
      )
    );
  };

  // ===== CONTEXT VALUE =====

  const value: AdditionalServiceContextType = {
    serviceItems,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    restoreServiceItem,
    getServiceItemById,
    getServiceItemsByCategory,
    getActiveServiceItems,
    getInactiveServiceItems,
    canDeleteServiceItem,
    reservationAddons,
    addReservationAddon,
    updateReservationAddon,
    deleteReservationAddon,
    getReservationAddonsByReservationId,
    getReservationAddonTotal,
    markReservationAddonsAsInvoiced,
    eventAddons,
    addEventAddon,
    updateEventAddon,
    deleteEventAddon,
    getEventAddonsByEventBookingId,
    getEventAddonTotal,
    markEventAddonsAsInvoiced,
  };

  return (
    <AdditionalServiceContext.Provider value={value}>
      {children}
    </AdditionalServiceContext.Provider>
  );
};
