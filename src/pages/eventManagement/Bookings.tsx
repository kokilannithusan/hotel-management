import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Trash2, Download } from "lucide-react";
import { useEventManagement } from "../../context/EventManagementContext";
import {
  BookingFilters,
  BookingStatus,
  PaymentStatus,
} from "../../types/eventManagement";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, events, deleteBooking } = useEventManagement();
  const [filters, setFilters] = useState<BookingFilters>({
    search: "",
    eventType: "",
    bookingStatus: "",
    paymentStatus: "",
    dateFrom: "",
    dateTo: "",
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      deleteBooking(id);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingReferenceNumber
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      booking.customerName
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      booking.customerEmail
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const matchesEventType =
      !filters.eventType || booking.eventTypeName.includes(filters.eventType);
    const matchesBookingStatus =
      !filters.bookingStatus || booking.bookingStatus === filters.bookingStatus;
    const matchesPaymentStatus =
      !filters.paymentStatus || booking.paymentStatus === filters.paymentStatus;

    const bookingDate = new Date(booking.eventDate);
    const matchesDateFrom =
      !filters.dateFrom || bookingDate >= new Date(filters.dateFrom);
    const matchesDateTo =
      !filters.dateTo || bookingDate <= new Date(filters.dateTo);

    return (
      matchesSearch &&
      matchesEventType &&
      matchesBookingStatus &&
      matchesPaymentStatus &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Tentative":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Deposit Received":
        return "bg-blue-100 text-blue-800";
      case "Refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage all event bookings and reservations
          </p>
        </div>
        <Button
          onClick={() => navigate("/events/create-booking")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
          <select
            value={filters.eventType}
            onChange={(e) =>
              setFilters({ ...filters, eventType: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Event Types</option>
            {events.map((event) => (
              <option key={event.id} value={event.eventType}>
                {event.eventType}
              </option>
            ))}
          </select>
          <select
            value={filters.bookingStatus}
            onChange={(e) =>
              setFilters({
                ...filters,
                bookingStatus: e.target.value as BookingStatus | "",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Booking Status</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Tentative">Tentative</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) =>
              setFilters({
                ...filters,
                paymentStatus: e.target.value as PaymentStatus | "",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Payment Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Deposit Received">Deposit Received</option>
            <option value="Refunded">Refunded</option>
          </select>
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
            />
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No bookings found. Create your first booking to get started.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {booking.bookingReferenceNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customerName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.customerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.eventTypeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.packageName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.currency}{" "}
                      {booking.totalPayableAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          booking.bookingStatus
                        )}`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() =>
                          navigate(`/events/bookings/${booking.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
