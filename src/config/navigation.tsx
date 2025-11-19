import React from "react";
import {
  Calendar,
  Users,
  FileText,
  Home,
  Settings as SettingsIcon,
  DollarSign,
  Building,
  ClipboardList,
  Globe,
  TrendingUp,
  Receipt,
  Shield,
  FileCheck,
  Coins,
  Clock,
  PartyPopper,
  Plus,
} from "lucide-react";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    path: "/dashboard",
    label: "Welcome",
    icon: <Home className="w-5 h-5" />,
  },
  {
    path: "/reservations",
    label: "Reservations",
    icon: <Calendar className="w-5 h-5" />,
    children: [
      {
        path: "/reservations/reserve",
        label: "Reserve Room",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/reservations/history",
        label: "History",
        icon: <FileText className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/customers",
    label: "Manage Customer",
    icon: <Users className="w-5 h-5" />,
  },
  {
    path: "/events",
    label: "Events",
    icon: <PartyPopper className="w-5 h-5" />,
    children: [
      {
        path: "/events/overview",
        label: "Bookings Overview",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        path: "/events/booking",
        label: "Book Event",
        icon: <Plus className="w-4 h-4" />,
      },
      {
        path: "/events/create",
        label: "Create Event",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/events/hall-management",
        label: "Hall Management",
        icon: <Building className="w-4 h-4" />,
      },
      {
        path: "/events/packages",
        label: "Event Packages",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/events/reporting",
        label: "Reports & Analytics",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/invoicing",
    label: "Invoicing",
    icon: <DollarSign className="w-5 h-5" />,
    children: [
      {
        path: "/invoicing/bill",
        label: "Bill",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/invoicing/receipts",
        label: "Receipts",
        icon: <Receipt className="w-4 h-4" />,
      },
      {
        path: "/invoicing/refunds",
        label: "Refunds",
        icon: <FileCheck className="w-4 h-4" />,
      },
      {
        path: "/invoicing/additional",
        label: "Additional Billing",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/rooms",
    label: "Rooms",
    icon: <Building className="w-5 h-5" />,
    children: [
      {
        path: "/rooms/all",
        label: "All Rooms",
        icon: <Building className="w-4 h-4" />,
      },
      {
        path: "/rooms/view-type",
        label: "View Type",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/rooms/amenities",
        label: "Amenities",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/rooms/areas",
        label: "Room Areas",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/rooms/types",
        label: "Room Types",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/rooms/price",
        label: "Price",
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        path: "/rooms/stay-types",
        label: "Stay Types",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/rooms/meal-plan",
        label: "Meal Plan",
        icon: <Home className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/housekeeping",
    label: "Housekeeping",
    icon: <ClipboardList className="w-5 h-5" />,
    children: [
      {
        path: "/housekeeping/manager",
        label: "Manager",
        icon: <Users className="w-4 h-4" />,
      },
      {
        path: "/housekeeping/housekeeper",
        label: "Housekeeper",
        icon: <ClipboardList className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/channels",
    label: "Channels",
    icon: <Globe className="w-5 h-5" />,
    children: [
      {
        path: "/channels/reservation-type",
        label: "Reservation Type",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/channels/seasonal",
        label: "Seasonal",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/channels/stay-type",
        label: "Stay Type",
        icon: <Clock className="w-4 h-4" />,
      },
      {
        path: "/channels/price-grid",
        label: "Channel Price",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/pricing",
    label: "Pricing",
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      {
        path: "/pricing/channel",
        label: "Channel Pricing",
        icon: <DollarSign className="w-4 h-4" />,
      },
      {
        path: "/pricing/seasonal",
        label: "Seasonal Pricing",
        icon: <Calendar className="w-4 h-4" />,
      },
    ],
  },
  { path: "/tax", label: "Tax", icon: <Receipt className="w-5 h-5" /> },
  {
    path: "/policies",
    label: "Policies",
    icon: <Shield className="w-5 h-5" />,
    children: [
      {
        path: "/policies/child",
        label: "Child Policies",
        icon: <Users className="w-4 h-4" />,
      },
      {
        path: "/policies/cancellation",
        label: "Cancellation Policies",
        icon: <ClipboardList className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/currency",
    label: "Currency Rate",
    icon: <Coins className="w-5 h-5" />,
  },
  {
    path: "/settings",
    label: "Settings",
    icon: <SettingsIcon className="w-5 h-5" />,
    children: [
      {
        path: "/settings/hotel",
        label: "Hotel",
        icon: <Building className="w-4 h-4" />,
      },
      {
        path: "/settings/role",
        label: "Role",
        icon: <Users className="w-4 h-4" />,
      },
      {
        path: "/settings/hotelAssignRole",
        label: "Hotel Assign Role",
        icon: <Users className="w-4 h-4" />,
      },
      {
        path: "/settings/hotelPrivileges",
        label: "Hotel Privileges",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        path: "/settings/hotelRolePrivileges",
        label: "Hotel Role Privileges",
        icon: <Shield className="w-4 h-4" />,
      },
      {
        path: "/settings/user",
        label: "User",
        icon: <Users className="w-4 h-4" />,
      },
      {
        path: "/settings/userPrivileges",
        label: "User Privileges",
        icon: <Shield className="w-4 h-4" />,
      },
    ],
  },
];
