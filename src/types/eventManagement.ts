// Event Management Module Types

export type EventTimeOfDay = "Morning" | "Afternoon" | "Evening" | "Full Day";
export type EventStatus = "Active" | "Inactive";
export type ResidencyStatus = "Resident" | "Non-Resident";
export type ChargeType = "Hour" | "Day";
export type BookingStatus =
  | "Confirmed"
  | "Tentative"
  | "Cancelled"
  | "Completed";
export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Deposit Received"
  | "Refunded";

// Event Type Definition
export interface EventMaster {
  id: string;
  eventName: string;
  eventType: string;
  timeOfDay: EventTimeOfDay;
  taxIds?: string[]; // Links to multiple Taxes from HotelContext
  eventDuration?: string; // e.g., "2 hours", "4-6 hours"
  description?: string;
  status: EventStatus;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Service Item for Additional Services
export interface EventServiceItem {
  id: string;
  serviceName: string;
  description?: string;
  price: number;
  currency: string;
  unitType: string; // e.g., "per person", "per item", "per hour"
  status: "Active" | "Inactive";
  category?: string;
}

// Package Definition
export interface EventPackageMaster {
  id: string;
  packageName: string;
  residencyStatus: ResidencyStatus;
  eventType: string; // Links to EventMaster
  attendeesCount: number;
  chargeType: ChargeType;

  // Dynamic pricing fields
  hoursRequired?: number; // If chargeType = Hour
  pricePerHour?: number; // If chargeType = Hour
  currency?: string; // If Non-Resident
  pricePerDay?: number; // If chargeType = Day

  // Venue
  venueHallId?: string;
  capacityLimit?: number;

  // Additional Services
  additionalServiceIds: string[]; // Multi-select service IDs

  // Charges and Tax
  serviceChargePercentage: number;
  taxPercentage: number; // VAT/GST/SVAT
  discountType?: "percentage" | "flat";
  discountValue?: number;

  // Calculated fields
  basePrice: number;
  additionalServicesTotal: number;
  serviceChargeAmount: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;

  status: EventStatus;
  description?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Customer for Booking
export interface EventCustomer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nicOrPassport: string;
  country: string;
  addressLine1?: string;
  addressLine2?: string;
  documentUrl?: string; // NIC/Passport upload
  createdAt: string;
}

// Booking Definition
export interface EventBooking {
  id: string;
  bookingReferenceNumber: string;

  // Event and Package
  eventTypeId: string;
  eventTypeName: string;
  packageId: string;
  packageName: string;

  // Customer
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNicOrPassport: string;

  // Selected Additional Services
  selectedServices: {
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
    total: number;
  }[];

  // Date and Time
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;

  // Pricing Breakdown
  basePrice: number;
  additionalServicesCost: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  taxPercentage: number;
  taxAmount: number;
  discountAmount: number;
  totalPayableAmount: number;

  // Currency
  currency: string;

  // Status
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;

  // Additional Info
  specialRequests?: string;
  internalNotes?: string;

  // Audit
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

// Venue/Hall Definition
export interface EventVenue {
  id: string;
  venueName: string;
  capacity: number;
  location: string;
  facilities: string[];
  pricePerHour: number;
  pricePerDay: number;
  status: "Available" | "Occupied" | "Maintenance";
  description?: string;
}

// Form State Types for Multi-Step Wizards
export interface PackageFormStep1 {
  packageName: string;
  residencyStatus: ResidencyStatus;
  eventType: string;
  attendeesCount: number;
  chargeType: ChargeType;
  venueHallId?: string;
  capacityLimit?: number;
  description?: string;
}

export interface PackageFormStep2 {
  hoursRequired?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  currency?: string;
  serviceChargePercentage: number;
  taxPercentage: number;
  discountType?: "percentage" | "flat";
  discountValue?: number;
}

export interface PackageFormStep3 {
  additionalServiceIds: string[];
}

export interface BookingFormData {
  eventTypeId: string;
  packageId: string;
  customerId?: string;
  customerData?: Partial<EventCustomer>;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  selectedServiceQuantities: Record<string, number>;
  specialRequests?: string;
}

// Filter Types
export interface EventFilters {
  search: string;
  eventType: string;
  timeOfDay: EventTimeOfDay | "";
  status: EventStatus | "";
}

export interface PackageFilters {
  search: string;
  eventType: string;
  residencyStatus: ResidencyStatus | "";
  chargeType: ChargeType | "";
  status: EventStatus | "";
}

export interface BookingFilters {
  search: string;
  eventType: string;
  bookingStatus: BookingStatus | "";
  paymentStatus: PaymentStatus | "";
  dateFrom: string;
  dateTo: string;
}
