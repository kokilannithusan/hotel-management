import React, { useState, useMemo } from "react";
import { useAdditionalService } from "../../context/AdditionalServiceContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  DollarSign,
  FileText,
  Printer,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  Building2,
  User,
  Calendar,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";

type InvoiceStatus = "Pending" | "Paid" | "Posted" | "Voided";
type BillingModeType = "Cash" | "Room" | "Reference No.";

interface AdditionalServiceInvoice {
  id: string;
  invoiceNumber: string;
  serviceId: string;
  serviceName: string;
  guestName: string;
  customerName?: string; // For Cash mode
  roomNo?: string;
  referenceNumber?: string;
  billingMode: BillingModeType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  paymentStatus: "Pending" | "Paid" | "Voided";
  linkedReservationId?: string;
  linkedEventId?: string;
  serviceDate: string;
  serviceTime: string;
  invoiceDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  auditLog: Array<{
    action: string;
    by: string;
    at: string;
    details: string;
  }>;
}

export const AdditionalBilling: React.FC = () => {
  const { reservationAddons } = useAdditionalService();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>(
    "All"
  );
  const [billingModeFilter, setBillingModeFilter] = useState<
    "All" | BillingModeType
  >("All");
  const [selectedInvoice, setSelectedInvoice] =
    useState<AdditionalServiceInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Convert reservation addons to invoices
  const invoices: AdditionalServiceInvoice[] = useMemo(() => {
    return reservationAddons
      .filter((addon: any) => !addon.deletedAt)
      .map((addon: any) => {
        const taxRate = 0.12; // 12% tax - should come from tax configuration
        const taxAmount = addon.totalPrice * taxRate;
        const totalWithTax = addon.totalPrice + taxAmount;

        // Determine invoice status based on billing mode and service status
        let invoiceStatus: InvoiceStatus = "Pending";
        let paymentStatus: "Pending" | "Paid" | "Voided" = "Pending";

        if (addon.billingMethod === "Cash" && addon.status === "Completed") {
          invoiceStatus = "Paid";
          paymentStatus = "Paid";
        } else if (addon.billingMethod === "Room" && addon.isInvoiced) {
          invoiceStatus = "Posted";
          paymentStatus = "Paid";
        } else if (addon.status === "Cancelled") {
          invoiceStatus = "Voided";
          paymentStatus = "Voided";
        }

        return {
          id: addon.id,
          invoiceNumber: `INV-${addon.reservationNo}-${addon.id.slice(-6)}`,
          serviceId: addon.serviceId,
          serviceName: addon.serviceName,
          guestName: addon.guestName,
          customerName:
            addon.billingMethod === "Cash" ? addon.guestName : undefined,
          roomNo: addon.billingMethod === "Room" ? addon.roomNo : undefined,
          referenceNumber:
            addon.billingMethod === "Reference No."
              ? addon.referenceNo
              : undefined,
          billingMode: addon.billingMethod,
          quantity: addon.quantity,
          unitPrice: addon.unitPrice,
          subtotal: addon.totalPrice,
          taxAmount: taxAmount,
          totalAmount: totalWithTax,
          status: invoiceStatus,
          paymentStatus: paymentStatus,
          linkedReservationId:
            addon.billingMethod === "Room" ? addon.reservationId : undefined,
          serviceDate: addon.serviceDate,
          serviceTime: addon.serviceTime || "",
          invoiceDate: addon.createdAt,
          notes: addon.notes,
          createdBy: addon.createdBy || "system",
          createdAt: addon.createdAt,
          paidAt: addon.status === "Completed" ? addon.updatedAt : undefined,
          voidedAt: addon.status === "Cancelled" ? addon.deletedAt : undefined,
          voidReason:
            addon.status === "Cancelled" ? "Service cancelled" : undefined,
          auditLog: [
            {
              action: "Created",
              by: addon.createdBy || "system",
              at: addon.createdAt,
              details: `Invoice created for ${addon.serviceName}`,
            },
            ...(addon.updatedAt && addon.updatedBy
              ? [
                  {
                    action: "Updated",
                    by: addon.updatedBy,
                    at: addon.updatedAt,
                    details: "Invoice updated",
                  },
                ]
              : []),
          ],
        };
      });
  }, [reservationAddons]);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || invoice.status === statusFilter;

      const matchesBillingMode =
        billingModeFilter === "All" ||
        invoice.billingMode === billingModeFilter;

      return matchesSearch && matchesStatus && matchesBillingMode;
    });
  }, [invoices, searchTerm, statusFilter, billingModeFilter]);

  const handleViewInvoice = (invoice: AdditionalServiceInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = (invoice: AdditionalServiceInvoice) => {
    // Generate printable invoice
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-details { margin: 20px 0; }
            .line-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .line-items th, .line-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .line-items th { background-color: #f2f2f2; }
            .totals { text-align: right; margin: 20px 0; }
            .status { display: inline-block; padding: 5px 10px; border-radius: 5px; }
            .status-paid { background: #10b981; color: white; }
            .status-pending { background: #f59e0b; color: white; }
            .status-posted { background: #3b82f6; color: white; }
            .status-voided { background: #ef4444; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Additional Service Invoice</h1>
            <p>Invoice No: ${invoice.invoiceNumber}</p>
            <p>Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
          
          <div class="invoice-details">
            <p><strong>Guest:</strong> ${invoice.guestName}</p>
            ${
              invoice.roomNo
                ? `<p><strong>Room:</strong> ${invoice.roomNo}</p>`
                : ""
            }
            ${
              invoice.referenceNumber
                ? `<p><strong>Reference:</strong> ${invoice.referenceNumber}</p>`
                : ""
            }
            <p><strong>Billing Mode:</strong> ${invoice.billingMode}</p>
            <p><strong>Status:</strong> <span class="status status-${invoice.status.toLowerCase()}">${
      invoice.status
    }</span></p>
          </div>
          
          <table class="line-items">
            <thead>
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.serviceName}</td>
                <td>${invoice.serviceDate} ${invoice.serviceTime}</td>
                <td>${invoice.quantity}</td>
                <td>LKR ${invoice.unitPrice.toLocaleString()}</td>
                <td>LKR ${invoice.subtotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="totals">
            <p><strong>Subtotal:</strong> LKR ${invoice.subtotal.toLocaleString()}</p>
            <p><strong>Tax:</strong> LKR ${invoice.taxAmount.toLocaleString()}</p>
            <p style="font-size: 1.2em;"><strong>Total Amount:</strong> LKR ${invoice.totalAmount.toLocaleString()}</p>
          </div>
          
          ${
            invoice.notes
              ? `<div><p><strong>Notes:</strong> ${invoice.notes}</p></div>`
              : ""
          }
          
          <div style="margin-top: 40px; text-align: center; font-size: 0.9em; color: #666;">
            <p>Thank you for your business!</p>
            <p>Created by: ${invoice.createdBy} on ${new Date(
      invoice.createdAt
    ).toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "Posted":
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case "Voided":
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "Paid":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Posted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Voided":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const getBillingModeIcon = (mode: BillingModeType) => {
    switch (mode) {
      case "Cash":
        return <DollarSign className="w-4 h-4" />;
      case "Room":
        return <Building2 className="w-4 h-4" />;
      case "Reference No.":
        return <Receipt className="w-4 h-4" />;
    }
  };

  const getBillingModeColor = (mode: BillingModeType) => {
    switch (mode) {
      case "Cash":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Room":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "Reference No.":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Additional Service Invoices"
        description="Manage invoicing and billing for additional services"
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by invoice no, guest name, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "All" | InvoiceStatus)
            }
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Posted">Posted</option>
            <option value="Voided">Voided</option>
          </select>
          <select
            value={billingModeFilter}
            onChange={(e) =>
              setBillingModeFilter(e.target.value as "All" | BillingModeType)
            }
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Billing Modes</option>
            <option value="Cash">Cash</option>
            <option value="Room">Room</option>
            <option value="Reference No.">Reference No.</option>
          </select>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-gray-700/30 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Service Invoices</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filteredInvoices.length} invoice
            {filteredInvoices.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Guest / Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Billing Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date / Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider text-right">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-700/20 transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {invoice.guestName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {invoice.serviceName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {invoice.roomNo && (
                        <p className="text-sm text-white">
                          Room: {invoice.roomNo}
                        </p>
                      )}
                      {invoice.referenceNumber && (
                        <p className="text-sm text-white">
                          Ref: {invoice.referenceNumber}
                        </p>
                      )}
                      {invoice.billingMode === "Cash" && (
                        <p className="text-sm text-blue-400">Cash Payment</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Qty: {invoice.quantity} × LKR{" "}
                        {invoice.unitPrice.toLocaleString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-white">
                          {invoice.serviceDate}
                        </p>
                        <p className="text-xs text-gray-400">
                          {invoice.serviceTime}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div>
                      <p className="text-sm text-gray-400">
                        Sub: {invoice.subtotal.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        Tax: {invoice.taxAmount.toLocaleString()}
                      </p>
                      <p className="text-base font-bold text-green-400">
                        {invoice.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getBillingModeColor(
                        invoice.billingMode
                      )}`}
                    >
                      {getBillingModeIcon(invoice.billingMode)}
                      {invoice.billingMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(invoice)}
                        className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-all"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700/50 mb-4">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-base font-medium">
                No invoices found
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Additional service invoices will appear here
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-6 py-5 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Invoice Details
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {selectedInvoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Guest Name</p>
                  <p className="text-base font-semibold text-white">
                    {selectedInvoice.guestName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Invoice Date</p>
                  <p className="text-base font-semibold text-white">
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Billing Mode</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getBillingModeColor(
                      selectedInvoice.billingMode
                    )}`}
                  >
                    {getBillingModeIcon(selectedInvoice.billingMode)}
                    {selectedInvoice.billingMode}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                      selectedInvoice.status
                    )}`}
                  >
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-gray-700/30 rounded-lg p-5 border border-gray-600">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Service Details
                </h3>
                <table className="w-full">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left text-xs text-gray-400 pb-2">
                        Service
                      </th>
                      <th className="text-left text-xs text-gray-400 pb-2">
                        Date/Time
                      </th>
                      <th className="text-right text-xs text-gray-400 pb-2">
                        Qty
                      </th>
                      <th className="text-right text-xs text-gray-400 pb-2">
                        Unit Price
                      </th>
                      <th className="text-right text-xs text-gray-400 pb-2">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-sm text-white py-3">
                        {selectedInvoice.serviceName}
                      </td>
                      <td className="text-sm text-gray-300 py-3">
                        {selectedInvoice.serviceDate}{" "}
                        {selectedInvoice.serviceTime}
                      </td>
                      <td className="text-sm text-white py-3 text-right">
                        {selectedInvoice.quantity}
                      </td>
                      <td className="text-sm text-white py-3 text-right">
                        LKR {selectedInvoice.unitPrice.toLocaleString()}
                      </td>
                      <td className="text-sm font-semibold text-white py-3 text-right">
                        LKR {selectedInvoice.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal:</span>
                    <span className="font-semibold text-white">
                      LKR {selectedInvoice.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Tax (12%):</span>
                    <span className="font-semibold text-white">
                      LKR {selectedInvoice.taxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-white">
                        Total Amount:
                      </span>
                      <span className="font-bold text-green-400">
                        LKR {selectedInvoice.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Notes:</p>
                  <p className="text-sm text-white">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Audit Log */}
              <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Audit Trail
                </h4>
                <div className="space-y-2">
                  {selectedInvoice.auditLog.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-xs text-gray-400"
                    >
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-white">
                          {log.action}
                        </span>{" "}
                        by {log.by} on {new Date(log.at).toLocaleString()}
                        {log.details && (
                          <p className="text-gray-500 mt-0.5">{log.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <Button
                  onClick={() => setShowInvoiceModal(false)}
                  className="bg-gray-600 hover:bg-gray-500"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
