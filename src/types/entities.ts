export type ReservationStatus =
  | "confirmed"
  | "checked-in"
  | "checked-out"
  | "canceled";
export type RoomStatus =
  | "available"
  | "occupied"
  | "maintenance"
  | "cleaned"
  | "to-clean";
export type HousekeepingStatus =
  | "cleaned"
  | "to-clean"
  | "cleaning-in-progress"
  | "maintenance";
export type PaymentStatus = "paid" | "unpaid" | "partial";
export type RefundStatus = "pending" | "completed" | "rejected";
export type CustomerStatus = "VIP" | "regular customer" | "new customer";
export type ChannelStatus = "active" | "inactive";
export type ServiceCategory = "Reservation" | "Event" | "Both";
export type ServiceItemStatus = "Active" | "Inactive";
export type AddonServiceStatus = "Pending" | "Completed" | "Cancelled";

export interface ServiceItem {
  id: string;
  name: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

export interface Customer {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  nationality: string;
  identificationNumber?: string; // ID/Passport number
  identificationDocumentName?: string; // Uploaded document file name
  identificationDocumentUrl?: string; // Uploaded document URL/data
  dob?: string; // Date of birth
  country?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  status?: CustomerStatus; // Optional, calculated dynamically
  createdAt: string;
  hasPremiumCard?: boolean; // Track if customer has premium card
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  viewTypeId?: string;
  amenities?: string[];
}

export interface ViewType {
  id: string;
  name: string;
  priceDifference?: number;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  price?: number;
}

export interface RoomArea {
  id: string;
  name: string;
  description?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomName?: string;
  roomTypeId: string;
  viewTypeId?: string;
  areaId?: string;
  status: RoomStatus;
  amenities: string[];
  floor?: number;
  size?: number;
  image?: string;
  roomTelephone?: string;
  maxAdults?: number;
  maxChildren?: number;
  pricing?: Array<{ currency: string; price: number }>;
}

export interface Reservation {
  id: string;
  customerId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  channelId: string;
  status: ReservationStatus;
  totalAmount: number;
  createdAt: string;
  notes?: string;
  mealPlanId?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: string;
  apiKey?: string;
  contactPerson?: string;
  status: ChannelStatus;
  priceModifierPercent?: number; // Percentage modifier for this channel
  reservationType?: "DIRECT" | "WEB" | "OTA" | "TA"; // Parent reservation type for main channels
  parentChannelId?: string; // Parent channel ID for sub-channels
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priceModifierPercent?: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  reservationId: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: PaymentStatus;
  createdAt: string;
  dueDate?: string;
  lineItems: BillLineItem[];
}

export interface BillLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  billId: string;
  reservationId: string;
  customerId: string;
  amount: number;
  paymentType: string;
  paymentDate: string;
  notes?: string;
}

export interface Refund {
  id: string;
  refundNumber: string;
  reservationId?: string;
  eventId?: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  currencyRate: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export type ReferenceType = "Reservation" | "Event";

export interface Invoice {
  id: string;
  invoiceId: string;
  referenceType: ReferenceType;
  reservationId?: string;
  eventId?: string;
  guest: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    nic?: string;
    passportNo?: string;
    reference: {
      type: ReferenceType;
      refNo: string;
    };
  };
  reservation?: {
    roomNo: string;
    type: string;
    rate: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    mealPlan?: {
      type: string;
      pricePerDay: number;
      totalPrice: number;
    };
  };
  event?: {
    hallName: string;
    eventType: string;
    startDateTime: string;
    endDateTime: string;
    duration: number;
    hallRate: number;
    packageName?: string;
    packageRate?: number;
    attendees: number;
  };
  services?: Array<{
    id: string;
    name: string;
    amount: number;
    quantity?: number;
    unitPrice?: number;
  }>;
  additionalCharges?: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  chargeBreakdown: {
    roomCharges?: number;
    eventCharges?: number;
    mealPlanTotal?: number;
    serviceTotal: number;
    extraCharges: number;
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    grandTotal: number;
  };
  status: InvoiceStatus;
  generatedDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  createdBy: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  currencyRate: number;
  paymentDate: string;
  issuedBy: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  reason: string;
  reasonCategory:
    | "billing_error"
    | "service_issue"
    | "cancellation"
    | "discount"
    | "other";
  originalAmount: number;
  creditAmount: number;
  status: "issued" | "applied" | "void";
  issuedDate: string;
  issuedBy: string;
  appliedToInvoiceId?: string;
  appliedDate?: string;
  notes?: string;
}

export interface AdditionalBillingItem {
  id: string;
  reservationId?: string;
  eventId?: string;
  customerId: string;
  customerName: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  billingDate: string;
  status: "pending" | "billed" | "cancelled";
  createdBy: string;
  createdAt: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
  appliesTo: "room" | "invoice" | "both";
  isActive: boolean;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
}

export interface CurrencyRate {
  id: string;
  currency: string;
  code: string;
  rate: number;
  lastUpdated: string;
}

export interface ChannelPricing {
  id: string;
  channelId: string;
  roomTypeId: string;
  modifierType: "percentage" | "fixed";
  modifierValue: number;
}

export interface SeasonalPricing {
  id: string;
  seasonId: string;
  roomTypeId: string;
  modifierType: "percentage" | "fixed";
  modifierValue: number;
}

export interface StayType {
  id: string;
  name: string;
  hours?: number;
  rateMultiplier: number;
  description?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  code: string; // BB, HB, FB, AI
  description: string;
  perPersonRate: number;
  perRoomRate?: number;
  isActive: boolean;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  task: string;
  completed: boolean;
  assignedTo?: string;
  completedAt?: string;
}

export interface MaintenanceIssue {
  id: string;
  description: string;
  reportedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface HousekeepingRoom {
  roomId: string;
  roomNumber: string;
  status: HousekeepingStatus;
  tasks: HousekeepingTask[];
  lastCleaned?: string;
  issues?: MaintenanceIssue[];
}

export interface HotelSettings {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  currency: string;
  timezone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

// Event Management types
export type EventStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled";
export type EventType =
  | "conference"
  | "wedding"
  | "seminar"
  | "corporate"
  | "birthday"
  | "anniversary"
  | "meeting"
  | "workshop"
  | "gala"
  | "other";

export type HallStatus = "available" | "reserved" | "maintenance";
export type InvoiceType = "proforma" | "final" | "refund";
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "cancelled"
  | "Pending"
  | "Paid"
  | "Partially Paid"
  | "Unpaid";
export type AdditionalServiceCategory =
  | "catering"
  | "decoration"
  | "technical"
  | "staff"
  | "equipment"
  | "transport"
  | "security"
  | "other";
export type IdentificationType =
  | "nic"
  | "passport"
  | "driving_license"
  | "other";

export interface AdditionalService {
  id: string;
  name: string;
  description: string;
  category: AdditionalServiceCategory;
  unitPrice: number;
  unit: string; // e.g., "per hour", "per piece", "per person"
  isActive: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Hall {
  id: string;
  name: string;
  capacity: number;
  location: string;
  facilities: string[]; // Array of facility names
  availableFacilities: {
    airConditioning: boolean;
    projector: boolean;
    soundSystem: boolean;
    wifi: boolean;
    parking: boolean;
    catering: boolean;
    stage: boolean;
    danceFloor: boolean;
    bar: boolean;
    kitchen: boolean;
  };
  pricePerHour: number;
  pricePerDay: number;
  status: HallStatus;
  description?: string;
  images?: string[];
  squareFootage?: number;
  floorPlan?: string; // URL to floor plan image
  setupTime: number; // Hours needed for setup
  cleanupTime: number; // Hours needed for cleanup
  createdAt: string;
  updatedAt?: string;
}

export interface EventPackage {
  id: string;
  name: string;
  description: string;
  includedServices: string[];
  basePrice: number;
  taxRate: number;
  duration: "half-day" | "full-day" | "hourly";
  includedHours?: number; // Number of hours included in the package
  applicableEventTypes: EventType[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  organizerName: string;
  organizerEmail?: string;
  organizerPhone?: string;
  // Customer identification
  identificationType: IdentificationType;
  identificationNumber: string; // NIC, Passport, etc.
  organizerAddress?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  startDateTime: string;
  endDateTime: string;
  expectedAttendees: number;
  actualAttendees?: number;
  // Multiple halls support
  hallIds: string[]; // Array of hall IDs
  packageId?: string;
  additionalServices?: {
    serviceId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  customPricing?: number;
  totalRevenue: number;
  status: EventStatus;
  notes?: string;
  requirements?: string;
  decorationType?: string;
  cateringRequirements?: string;
  equipmentNeeds?: string[];
  specialRequests?: string;
  paymentStatus: "pending" | "partial" | "paid" | "overdue";
  advancePayment?: number;
  balanceAmount?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy: string; // User ID
}

export interface EventInvoice {
  id: string;
  invoiceNumber: string;
  eventId: string;
  eventReferenceNo: string;
  eventName: string;
  eventType: string;
  organizerName: string;
  customerId: string;
  customerName: string;
  customerNIC?: string;
  customerPassport?: string;
  customerCompanyRegNo?: string;
  eventStartDateTime: string;
  eventEndDateTime: string;
  hallName: string;
  attendees: number;
  packageName: string;
  packageBasePrice: number;
  packageTaxRate: number;
  includedServices: string[];
  addOnServices: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  decorationType?: string;
  cateringRequirements?: string;
  customRequirements?: string;
  standardHours: number;
  totalHours: number;
  extraHours: number;
  overtimeRate: number;
  overtimeCharges: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paidAmount?: number;
  staffResponsible: string;
  dateIssued: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface EventBooking {
  id: string;
  eventId: string;
  customerId?: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  bookingDate: string;
  confirmationNumber: string;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  depositAmount: number;
  totalAmount: number;
  specialRequests?: string;
  termsAccepted: boolean;
  bookingStage?:
    | "initiated"
    | "validated"
    | "quoted"
    | "confirmed"
    | "completed";
  quotationId?: string;
  invoiceId?: string;
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface HallAvailability {
  hallId: string;
  startDateTime: string;
  endDateTime: string;
  isAvailable: boolean;
  eventId?: string;
}

export interface HotelState {
  customers: Customer[];
  rooms: Room[];
  roomTypes: RoomType[];
  viewTypes: ViewType[];
  amenities: Amenity[];
  roomAreas: RoomArea[];
  reservations: Reservation[];
  channels: Channel[];
  seasons: Season[];
  bills: Bill[];
  receipts: Receipt[];
  refunds: Refund[];
  taxes: Tax[];
  policies: Policy[];
  currencyRates: CurrencyRate[];
  channelPricing: ChannelPricing[];
  seasonalPricing: SeasonalPricing[];
  stayTypes: StayType[];
  mealPlans: MealPlan[];
  housekeeping: HousekeepingRoom[];
  settings: HotelSettings | null;
  users: User[];
  events: Event[];
  eventPackages: EventPackage[];
  additionalServices: AdditionalService[];
  halls: Hall[];
  eventInvoices: EventInvoice[];
  eventBookings: EventBooking[];
}

export interface ServiceItemMaster {
  id: string;
  serviceName: string;
  category: ServiceCategory;
  description?: string;
  price: number;
  unitType: string;
  status: ServiceItemStatus;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  priceHistory?: Array<{
    price: number;
    effectiveDate: string;
    changedBy: string;
  }>;
}

export interface ReservationServiceAddon {
  id: string;
  reservationId: string;
  reservationNo: string;
  guestName: string;
  roomNo: string;
  checkIn: string;
  checkOut: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
  serviceDate: string;
  serviceTime?: string;
  billingMethod: "Cash" | "Room" | "Reference No.";
  referenceNo?: string;
  notes?: string;
  status: AddonServiceStatus;
  isInvoiced: boolean;
  invoiceId?: string;
  invoiceNo?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface EventServiceAddon {
  id: string;
  eventBookingId: string;
  eventBookingNo: string;
  eventName: string;
  eventType: string;
  organizerName: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
  serviceDate: string;
  serviceTime?: string;
  billingMethod: "Cash" | "Event Invoice" | "Reference No.";
  referenceNo?: string;
  notes?: string;
  status: AddonServiceStatus;
  isInvoiced: boolean;
  invoiceId?: string;
  invoiceNo?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
}
