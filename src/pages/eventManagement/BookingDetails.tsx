import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { useEventManagement } from "../../context/EventManagementContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBookingById } = useEventManagement();

  const booking = getBookingById(id || "");

  if (!booking) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The booking you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/events/bookings")}>
              Back to Bookings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string): string => {
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

  const getPaymentStatusColor = (status: string): string => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/events/bookings")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Details
            </h1>
            <p className="text-gray-600">{booking.bookingReferenceNumber}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              booking.bookingStatus
            )}`}
          >
            {booking.bookingStatus}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
              booking.paymentStatus
            )}`}
          >
            {booking.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Event Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Event Type</p>
                    <p className="text-base font-medium text-gray-900">
                      {booking.eventTypeName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Event Date</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {booking.eventStartTime && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.eventStartTime}
                      </p>
                    </div>
                  </div>
                )}
                {booking.eventEndTime && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.eventEndTime}
                      </p>
                    </div>
                  </div>
                )}
                {booking.packageName && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="text-base font-medium text-gray-900">
                        {booking.packageName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {booking.specialRequests && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Special Requests</p>
                  <p className="text-base text-gray-900">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Financial Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Financial Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-lg font-medium text-gray-900">
                    {booking.currency} {booking.basePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Additional Services</span>
                  <span className="text-lg font-medium text-gray-900">
                    {booking.currency}{" "}
                    {booking.additionalServicesCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">
                    Service Charge ({booking.serviceChargePercentage}%)
                  </span>
                  <span className="text-lg font-medium text-gray-900">
                    {booking.currency}{" "}
                    {booking.serviceChargeAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">
                    Tax ({booking.taxPercentage}%)
                  </span>
                  <span className="text-lg font-medium text-gray-900">
                    {booking.currency} {booking.taxAmount.toLocaleString()}
                  </span>
                </div>
                {booking.discountAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-lg font-medium text-green-600">
                      - {booking.currency}{" "}
                      {booking.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 pt-3">
                  <span className="text-gray-900 font-semibold">
                    Total Payable
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {booking.currency}{" "}
                    {booking.totalPayableAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Services */}
          {booking.selectedServices && booking.selectedServices.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Services
                </h2>
                <div className="space-y-2">
                  {booking.selectedServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {service.serviceName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {service.quantity} × {booking.currency}{" "}
                          {service.price.toLocaleString()}
                        </p>
                      </div>
                      <span className="font-medium text-gray-900">
                        {booking.currency} {service.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {booking.customerName}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-base font-medium text-gray-900">
                      {booking.customerEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {booking.customerPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">NIC/Passport</p>
                    <p className="text-base font-medium text-gray-900">
                      {booking.customerNicOrPassport}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Timeline
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created On</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                {booking.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-base font-medium text-gray-900">
                      {new Date(booking.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
