import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventInvoice } from "../../context/EventInvoiceContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  Printer,
  Download,
  Receipt as ReceiptIcon,
  CheckCircle,
} from "lucide-react";

export const ViewEventInvoice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventInvoiceById } = useEventInvoice();

  const invoice = getEventInvoiceById(id || "");

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Invoice Not Found
        </h2>
        <p className="text-gray-500 mb-4">
          The event invoice you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/invoicing/event-invoices")}>
          Back to Event Invoices
        </Button>
      </div>
    );
  }

  const handlePrint = () => window.print();
  const handleDownloadPDF = () =>
    alert(`PDF download for ${invoice.invoiceNumber} will be implemented`);
  const handleGenerateReceipt = () =>
    navigate(`/invoicing/receipts/create?eventInvoiceId=${invoice.id}`);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const remainingBalance = invoice.totalAmount - (invoice.paidAmount || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice: ${invoice.invoiceNumber}`}
        description="View event invoice details"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleGenerateReceipt}>
              <ReceiptIcon className="w-4 h-4 mr-2" />
              Generate Receipt
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      <div
        className={`border rounded-lg p-4 ${
          invoice.status === "Paid"
            ? "bg-green-50 border-green-200"
            : invoice.status === "Partially Paid"
            ? "bg-yellow-50 border-yellow-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <div className="flex items-center gap-3">
          {invoice.status === "Paid" && (
            <CheckCircle className="w-6 h-6 text-green-600" />
          )}
          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${
                invoice.status === "Paid"
                  ? "text-green-900"
                  : invoice.status === "Partially Paid"
                  ? "text-yellow-900"
                  : "text-orange-900"
              }`}
            >
              {invoice.status === "Paid"
                ? "Invoice Fully Paid"
                : invoice.status === "Partially Paid"
                ? "Invoice Partially Paid"
                : "Payment Pending"}
            </h3>
            <p
              className={`text-sm ${
                invoice.status === "Paid"
                  ? "text-green-700"
                  : invoice.status === "Partially Paid"
                  ? "text-yellow-700"
                  : "text-orange-700"
              }`}
            >
              {invoice.status === "Paid"
                ? `Total: LKR ${invoice.totalAmount.toLocaleString()}`
                : `Paid: LKR ${(
                    invoice.paidAmount || 0
                  ).toLocaleString()} | Remaining: LKR ${remainingBalance.toLocaleString()}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Event Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Event Reference No</p>
                <p className="text-base font-semibold text-blue-600">
                  {invoice.eventReferenceNo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Event Name</p>
                <p className="text-base font-medium text-gray-900">
                  {invoice.eventName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Event Type</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                  {invoice.eventType}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Venue</p>
                <p className="text-base font-medium text-gray-900">
                  {invoice.hallName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Event Start</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDateTime(invoice.eventStartDateTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Event End</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDateTime(invoice.eventEndDateTime)}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Customer / Organizer Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                <p className="text-base font-medium text-gray-900">
                  {invoice.customerName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Organizer</p>
                <p className="text-base font-medium text-gray-900">
                  {invoice.organizerName}
                </p>
              </div>
              {invoice.customerNIC && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">NIC</p>
                  <p className="text-base font-medium text-gray-900">
                    {invoice.customerNIC}
                  </p>
                </div>
              )}
              {invoice.customerPassport && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Passport No</p>
                  <p className="text-base font-medium text-gray-900">
                    {invoice.customerPassport}
                  </p>
                </div>
              )}
              {invoice.customerCompanyRegNo && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Company Reg No</p>
                  <p className="text-base font-medium text-gray-900">
                    {invoice.customerCompanyRegNo}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Attendees</p>
                <p className="text-base font-medium text-gray-900 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {invoice.attendees}
                </p>
              </div>
            </div>
          </Card>

          {/* Package Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Package Details
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">
                    {invoice.packageName}
                  </p>
                  <p className="text-sm text-gray-600">Base Package</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  LKR {invoice.packageBasePrice.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Included Services:
                </p>
                <ul className="space-y-1">
                  {invoice.includedServices.map((service, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-600 flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              {invoice.addOnServices && invoice.addOnServices.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Add-on Services:
                  </p>
                  <div className="space-y-2">
                    {invoice.addOnServices.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex justify-between text-sm bg-blue-50 p-3 rounded"
                      >
                        <span className="text-gray-900">
                          {addon.name} (x{addon.quantity})
                        </span>
                        <span className="font-semibold text-gray-900">
                          LKR {addon.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Duration & Overtime */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Duration & Overtime
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Standard Hours</p>
                <p className="text-lg font-bold text-gray-900">
                  {invoice.standardHours}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                <p className="text-lg font-bold text-gray-900">
                  {invoice.totalHours}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Extra Hours</p>
                <p className="text-lg font-bold text-orange-600">
                  {invoice.extraHours}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Overtime Charges</p>
                <p className="text-lg font-bold text-orange-600">
                  LKR {invoice.overtimeCharges.toLocaleString()}
                </p>
              </div>
            </div>

            {invoice.extraHours > 0 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Overtime Policy:</strong> {invoice.extraHours} extra
                  hours @ LKR {invoice.overtimeRate}/hour (150% of standard
                  rate)
                </p>
              </div>
            )}
          </Card>

          {/* Custom Requirements */}
          {(invoice.decorationType ||
            invoice.cateringRequirements ||
            invoice.customRequirements) && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Custom Requirements
                </h3>
              </div>

              <div className="space-y-3">
                {invoice.decorationType && (
                  <div>
                    <p className="text-sm text-gray-500">Decoration Type</p>
                    <p className="text-base font-medium text-gray-900">
                      {invoice.decorationType}
                    </p>
                  </div>
                )}
                {invoice.cateringRequirements && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Catering Requirements
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {invoice.cateringRequirements}
                    </p>
                  </div>
                )}
                {invoice.customRequirements && (
                  <div>
                    <p className="text-sm text-gray-500">Other Requirements</p>
                    <p className="text-base font-medium text-gray-900">
                      {invoice.customRequirements}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-semibold text-gray-900">
                  LKR {invoice.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">
                  Tax ({invoice.packageTaxRate}%):
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  LKR {invoice.taxAmount.toLocaleString()}
                </span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm font-semibold text-red-600">
                    - LKR {invoice.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-gray-50 px-3 rounded-lg">
                <span className="text-base font-bold text-gray-900">
                  Total Amount:
                </span>
                <span className="text-base font-bold text-gray-900">
                  LKR {invoice.totalAmount.toLocaleString()}
                </span>
              </div>
              {invoice.paidAmount && invoice.paidAmount > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Paid Amount:</span>
                    <span className="text-sm font-semibold text-green-600">
                      LKR {invoice.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 bg-orange-50 px-3 rounded-lg">
                    <span className="text-base font-bold text-orange-800">
                      Remaining Balance:
                    </span>
                    <span className="text-base font-bold text-orange-800">
                      LKR {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Invoice Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Details
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusBadgeClass(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Staff Responsible</p>
                <p className="text-base font-medium text-gray-900">
                  {invoice.staffResponsible}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Issued</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(invoice.dateIssued).toLocaleDateString()}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <p className="text-sm text-gray-500">Paid Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(invoice.paidDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full justify-start"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Invoice
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={handleGenerateReceipt}
                className="w-full justify-start"
              >
                <ReceiptIcon className="w-4 h-4 mr-2" />
                Generate Receipt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
