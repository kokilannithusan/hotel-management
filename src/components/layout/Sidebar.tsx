import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Calendar,
  Users,
  FileText,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Building,
  ClipboardList,
  Globe,
  Receipt,
  Shield,
  FileCheck,
  Coins,
  PartyPopper,
  Plus,
  Package,
  Sparkles,
  Mail,
  Eye,
  Grid3x3,
  MapPin,
  Star,
  Bed,
  UtensilsCrossed,
  Layers,
  Clock,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    path: "/dashboard",
    label: "Welcome",
    icon: <Home className="w-5 h-5" />,
    children: [
      {
        path: "/dashboard",
        label: "Dashboard Overview",
        icon: <Home className="w-4 h-4" />,
      },
      {
        path: "/dashboard/room-calendar",
        label: "Room Calendar",
        icon: <Calendar className="w-4 h-4" />,
      },
    ],
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
    label: "Event Management",
    icon: <PartyPopper className="w-5 h-5" />,
    children: [
      {
        path: "/events/management",
        label: "Events",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/events/packages",
        label: "Packages",
        icon: <Package className="w-4 h-4" />,
      },
      {
        path: "/events/bookings",
        label: "Bookings",
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        path: "/events/create-booking",
        label: "Create Booking",
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/invoicing",
    label: "Invoicing",
    icon: <DollarSign className="w-5 h-5" />,
    children: [
      {
        path: "/invoicing/invoices",
        label: "Invoices",
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
        path: "/invoicing/credit-notes",
        label: "Credit Notes",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/invoicing/event-invoices",
        label: "Event Invoices",
        icon: <PartyPopper className="w-4 h-4" />,
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
        path: "/rooms/overview",
        label: "Overview",
        icon: <Eye className="w-4 h-4" />,
      },
      {
        path: "/rooms/view-type",
        label: "View Type",
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        path: "/rooms/areas",
        label: "Room Areas",
        icon: <Grid3x3 className="w-4 h-4" />,
      },
      {
        path: "/rooms/amenities",
        label: "Amenities",
        icon: <Star className="w-4 h-4" />,
      },
      {
        path: "/rooms/types",
        label: "Room Types",
        icon: <Layers className="w-4 h-4" />,
      },
      {
        path: "/rooms/meal-plan",
        label: "Meal Plan",
        icon: <UtensilsCrossed className="w-4 h-4" />,
      },
      {
        path: "/rooms/all",
        label: "All Rooms",
        icon: <Bed className="w-4 h-4" />,
      },
      {
        path: "/rooms/stay-types",
        label: "Stay Types",
        icon: <Clock className="w-4 h-4" />,
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
        path: "/channels/registration",
        label: "Reservation Type",
        icon: <Plus className="w-4 h-4" />,
      },
      {
        path: "/channels/channels",
        label: "Channels",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        path: "/channels/seasonal",
        label: "Seasonal",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/channels/seasonal-type",
        label: "Seasonal Price",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/channels/price-grid",
        label: "Channel Price",
        icon: <DollarSign className="w-4 h-4" />,
      },
    ],
  },
  {
    path: "/additional-service",
    label: "Additional Service",
    icon: <Package className="w-5 h-5" />,
    children: [
      {
        path: "/additional-service/manage-items",
        label: "Manage Service Items",
        icon: <Package className="w-4 h-4" />,
      },
      {
        path: "/additional-service/reservation-addon",
        label: "Reservation Add-on Service",
        icon: <Calendar className="w-4 h-4" />,
      },
      {
        path: "/additional-service/event-addon",
        label: "Event Add-on Service",
        icon: <Sparkles className="w-4 h-4" />,
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
        icon: <FileCheck className="w-4 h-4" />,
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
    icon: <Settings className="w-5 h-5" />,
    children: [
      {
        path: "/settings/hotel",
        label: "Hotel",
        icon: <Building className="w-4 h-4" />,
      },
      {
        path: "/settings/role",
        label: "Role Management",
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
      {
        path: "/settings/emailConfig",
        label: "Email Configuration",
        icon: <Mail className="w-4 h-4" />,
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const location = useLocation();

  // keep a CSS variable in sync so layout can react to sidebar width
  React.useEffect(() => {
    const width = isCollapsed ? "4rem" : "16rem"; // w-16 vs w-64
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [isCollapsed]);

  const isActive = (path: string) => {
    // Exact match for paths to avoid confusion between /dashboard and /dashboard/room-calendar
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openSections[item.path] ?? active;

    if (hasChildren) {
      return (
        <div key={item.path} className="mb-1">
          <div
            onClick={() =>
              setOpenSections((prev) => ({ ...prev, [item.path]: !isOpen }))
            }
            className={`flex items-center ${
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            } py-2.5 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
              active
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : isOpen
                ? "bg-gray-700/50 text-white border-l-4 border-blue-500"
                : "text-gray-300 hover:bg-gray-700/70 hover:text-white hover:translate-x-1"
            }`}
          >
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center w-full" : ""
              }`}
            >
              <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span
                className={`transition-transform duration-300 ${
                  isOpen ? "rotate-90 text-blue-400" : "text-gray-500"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
          {!isCollapsed && isOpen && item.children && (
            <div className="ml-2 mt-1 space-y-1 pl-2 border-l-2 border-gray-700/50 animate-fade-in">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    isActive(child.path)
                      ? "bg-blue-600/30 text-blue-300 border-l-2 border-blue-500 font-medium"
                      : "text-gray-400 hover:bg-gray-700/50 hover:text-white hover:translate-x-1"
                  }`}
                >
                  <span className="mr-2">{child.icon}</span>
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center ${
          isCollapsed ? "justify-center px-2" : "px-4"
        } py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
          active
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            : "text-gray-300 hover:bg-gray-700/70 hover:text-white hover:translate-x-1"
        }`}
      >
        <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div
      className={`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 h-screen fixed left-0 top-0 transition-all duration-300 shadow-xl z-40 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } p-4 border-b border-gray-700/50`}
        >
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white animate-fade-in">
              Hotel Management
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navItems.map((item) => renderNavItem(item))}
          </div>
        </nav>
      </div>
    </div>
  );
};
