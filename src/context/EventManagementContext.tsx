import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  EventMaster,
  EventPackageMaster,
  EventBooking,
  EventServiceItem,
  EventVenue,
  EventCustomer,
} from "../types/eventManagement";
import { getStorageItem, setStorageItem } from "../utils/storage";

interface EventManagementContextType {
  // Events
  events: EventMaster[];
  addEvent: (event: Omit<EventMaster, "id" | "createdAt">) => EventMaster;
  updateEvent: (id: string, updates: Partial<EventMaster>) => void;
  deleteEvent: (id: string) => void;
  getEventById: (id: string) => EventMaster | undefined;

  // Packages
  packages: EventPackageMaster[];
  addPackage: (
    pkg: Omit<EventPackageMaster, "id" | "createdAt">
  ) => EventPackageMaster;
  updatePackage: (id: string, updates: Partial<EventPackageMaster>) => void;
  deletePackage: (id: string) => void;
  getPackageById: (id: string) => EventPackageMaster | undefined;
  getPackagesByEventType: (eventType: string) => EventPackageMaster[];

  // Bookings
  bookings: EventBooking[];
  addBooking: (
    booking: Omit<EventBooking, "id" | "bookingReferenceNumber" | "createdAt">
  ) => EventBooking;
  updateBooking: (id: string, updates: Partial<EventBooking>) => void;
  deleteBooking: (id: string) => void;
  getBookingById: (id: string) => EventBooking | undefined;

  // Services
  services: EventServiceItem[];
  addService: (service: Omit<EventServiceItem, "id">) => EventServiceItem;
  updateService: (id: string, updates: Partial<EventServiceItem>) => void;
  deleteService: (id: string) => void;

  // Venues
  venues: EventVenue[];
  addVenue: (venue: Omit<EventVenue, "id">) => EventVenue;
  updateVenue: (id: string, updates: Partial<EventVenue>) => void;
  deleteVenue: (id: string) => void;

  // Customers
  customers: EventCustomer[];
  addCustomer: (
    customer: Omit<EventCustomer, "id" | "createdAt">
  ) => EventCustomer;
  getCustomerByNicOrPassport: (
    nicOrPassport: string
  ) => EventCustomer | undefined;
}

const EventManagementContext = createContext<
  EventManagementContextType | undefined
>(undefined);

const STORAGE_KEYS = {
  events: "hms_event_masters",
  packages: "hms_event_packages",
  bookings: "hms_event_bookings",
  services: "hms_event_services",
  venues: "hms_event_venues",
  customers: "hms_event_customers",
};

export const EventManagementProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [events, setEvents] = useState<EventMaster[]>([]);
  const [packages, setPackages] = useState<EventPackageMaster[]>([]);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [services, setServices] = useState<EventServiceItem[]>([]);
  const [venues, setVenues] = useState<EventVenue[]>([]);
  const [customers, setCustomers] = useState<EventCustomer[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    setEvents(getStorageItem(STORAGE_KEYS.events, []));
    setPackages(getStorageItem(STORAGE_KEYS.packages, []));
    setBookings(getStorageItem(STORAGE_KEYS.bookings, []));
    setServices(getStorageItem(STORAGE_KEYS.services, []));
    setVenues(getStorageItem(STORAGE_KEYS.venues, []));
    setCustomers(getStorageItem(STORAGE_KEYS.customers, []));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.events, events);
  }, [events]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.packages, packages);
  }, [packages]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.bookings, bookings);
  }, [bookings]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.services, services);
  }, [services]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.venues, venues);
  }, [venues]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.customers, customers);
  }, [customers]);

  // Event CRUD
  const addEvent = (
    event: Omit<EventMaster, "id" | "createdAt">
  ): EventMaster => {
    const newEvent: EventMaster = {
      ...event,
      id: `EVT-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = (id: string, updates: Partial<EventMaster>) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? { ...event, ...updates, updatedAt: new Date().toISOString() }
          : event
      )
    );
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const getEventById = (id: string) => {
    return events.find((event) => event.id === id);
  };

  // Package CRUD
  const addPackage = (
    pkg: Omit<EventPackageMaster, "id" | "createdAt">
  ): EventPackageMaster => {
    const newPackage: EventPackageMaster = {
      ...pkg,
      id: `PKG-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPackages((prev) => [...prev, newPackage]);
    return newPackage;
  };

  const updatePackage = (id: string, updates: Partial<EventPackageMaster>) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? { ...pkg, ...updates, updatedAt: new Date().toISOString() }
          : pkg
      )
    );
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  };

  const getPackageById = (id: string) => {
    return packages.find((pkg) => pkg.id === id);
  };

  const getPackagesByEventType = (eventType: string) => {
    return packages.filter(
      (pkg) => pkg.eventType === eventType && pkg.status === "Active"
    );
  };

  // Booking CRUD
  const generateBookingReference = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `BKG${year}${month}${day}${random}`;
  };

  const addBooking = (
    booking: Omit<EventBooking, "id" | "bookingReferenceNumber" | "createdAt">
  ): EventBooking => {
    const newBooking: EventBooking = {
      ...booking,
      id: `EBKG-${Date.now()}`,
      bookingReferenceNumber: generateBookingReference(),
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [...prev, newBooking]);
    return newBooking;
  };

  const updateBooking = (id: string, updates: Partial<EventBooking>) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id
          ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
          : booking
      )
    );
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
  };

  const getBookingById = (id: string) => {
    return bookings.find((booking) => booking.id === id);
  };

  // Service CRUD
  const addService = (
    service: Omit<EventServiceItem, "id">
  ): EventServiceItem => {
    const newService: EventServiceItem = {
      ...service,
      id: `SVC-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
    return newService;
  };

  const updateService = (id: string, updates: Partial<EventServiceItem>) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, ...updates } : service
      )
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  // Venue CRUD
  const addVenue = (venue: Omit<EventVenue, "id">): EventVenue => {
    const newVenue: EventVenue = {
      ...venue,
      id: `VEN-${Date.now()}`,
    };
    setVenues((prev) => [...prev, newVenue]);
    return newVenue;
  };

  const updateVenue = (id: string, updates: Partial<EventVenue>) => {
    setVenues((prev) =>
      prev.map((venue) => (venue.id === id ? { ...venue, ...updates } : venue))
    );
  };

  const deleteVenue = (id: string) => {
    setVenues((prev) => prev.filter((venue) => venue.id !== id));
  };

  // Customer CRUD
  const addCustomer = (
    customer: Omit<EventCustomer, "id" | "createdAt">
  ): EventCustomer => {
    const newCustomer: EventCustomer = {
      ...customer,
      id: `CUS-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    return newCustomer;
  };

  const getCustomerByNicOrPassport = (nicOrPassport: string) => {
    return customers.find(
      (customer) => customer.nicOrPassport === nicOrPassport
    );
  };

  return (
    <EventManagementContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventById,
        packages,
        addPackage,
        updatePackage,
        deletePackage,
        getPackageById,
        getPackagesByEventType,
        bookings,
        addBooking,
        updateBooking,
        deleteBooking,
        getBookingById,
        services,
        addService,
        updateService,
        deleteService,
        venues,
        addVenue,
        updateVenue,
        deleteVenue,
        customers,
        addCustomer,
        getCustomerByNicOrPassport,
      }}
    >
      {children}
    </EventManagementContext.Provider>
  );
};

export const useEventManagement = () => {
  const context = useContext(EventManagementContext);
  if (!context) {
    throw new Error(
      "useEventManagement must be used within EventManagementProvider"
    );
  }
  return context;
};
