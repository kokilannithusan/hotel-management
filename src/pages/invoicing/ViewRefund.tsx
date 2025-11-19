import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export const ViewRefund: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refunds, invoices } = useInvoice();

  const refund = id ? refunds.find((r) => r.id === id) : null;
  const linkedInvoice = refund?.invoiceId
    ? invoices.find((inv) => inv.id === refund.invoiceId)
    : null;

  if (!refund) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Refund not found</p>
          <Button
            onClick={() => navigate("/invoicing/refunds")}
            className="mt-4"
          >
            Back to Refunds
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("PDF download functionality will be implemented");
  };

  const getStatusIcon = () => {
    switch (refund.status) {
      case "completed":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "pending":
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (refund.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/invoicing/refunds")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Refund #{refund.refundNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              Created on {new Date(refund.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-6 p-6 rounded-lg border-2 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold capitalize">{refund.status}</h2>
              <p className="text-sm mt-1">
                {refund.status === "completed" && refund.processedAt
                  ? `Processed on ${new Date(
                      refund.processedAt
                    ).toLocaleString()}`
                  : refund.status === "pending"
                  ? "Awaiting processing"
                  : "Refund rejected"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Refund Amount</p>
            <p className="text-3xl font-bold">
              LKR {refund.amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Reference Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Reference Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Reference Type</p>
                  <p className="font-semibold text-gray-900">
                    {refund.reservationId ? "Reservation" : "Event"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-semibold text-gray-900">
                    {refund.reservationId || refund.eventId}
                  </p>
                </div>
                {linkedInvoice && (
                  <div>
                    <p className="text-sm text-gray-500">Linked Invoice</p>
                    <button
                      onClick={() =>
                        navigate(`/invoicing/invoices/${linkedInvoice.id}`)
                      }
                      className="font-semibold text-blue-600 hover:text-blue-800 underline"
                    >
                      {linkedInvoice.invoiceId}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customer Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="font-semibold text-gray-900">
                    {refund.customerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">
                    {refund.customerName}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Refund Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Refund Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Refund Method</p>
                  <p className="font-semibold text-gray-900">💵 CASH ONLY</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-semibold text-gray-900">
                    {refund.currency || "LKR"} (Rate: {refund.currencyRate || 1}
                    )
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    LKR {refund.amount.toLocaleString()}
                  </p>
                  {refund.currency && refund.currency !== "LKR" && (
                    <p className="text-sm text-gray-600 mt-1">
                      ≈ {refund.currency}{" "}
                      {(refund.amount / (refund.currencyRate || 1)).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p className="font-medium text-gray-900">{refund.reason}</p>
                </div>
                {refund.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium text-gray-700">{refund.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Processing Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Processing Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Created Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(refund.createdAt).toLocaleString()}
                  </p>
                </div>
                {refund.processedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Processed Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(refund.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {refund.processedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Processed By</p>
                    <p className="font-semibold text-gray-900">
                      {refund.processedBy}
                    </p>
                  </div>
                )}
                {refund.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <p className="font-semibold text-gray-900">
                      {refund.approvedBy}
                    </p>
                  </div>
                )}
                {refund.approvedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Approved Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(refund.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Linked Invoice Information */}
          {linkedInvoice && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Linked Invoice Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-semibold text-gray-900">
                      {linkedInvoice.invoiceId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Total</p>
                    <p className="font-semibold text-gray-900">
                      LKR{" "}
                      {linkedInvoice.chargeBreakdown.grandTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        linkedInvoice.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : linkedInvoice.status === "Unpaid"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {linkedInvoice.status}
                    </span>
                  </div>
                  <div className="pt-3 border-t">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/invoicing/invoices/${linkedInvoice.id}`)
                      }
                      className="w-full"
                    >
                      View Full Invoice
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Refund Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Refund Created
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(refund.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {refund.processedAt && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Refund Processed
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(refund.processedAt).toLocaleString()}
                      </p>
                      {refund.processedBy && (
                        <p className="text-sm text-gray-500">
                          By: {refund.processedBy}
                        </p>
                      )}
                    </div>
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
