import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  ArrowLeft,
  FileText,
  User,
  DollarSign,
  Calendar,
  CheckCircle,
  Printer,
  Download,
  ExternalLink,
} from "lucide-react";

export const ViewCreditNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { creditNotes, invoices } = useInvoice();

  const creditNote = creditNotes.find((cn) => cn.id === id);
  const linkedInvoice = creditNote
    ? invoices.find((inv) => inv.id === creditNote.invoiceId)
    : undefined;

  if (!creditNote) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Credit Note Not Found
        </h2>
        <p className="text-gray-500 mb-4">
          The credit note you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/invoicing/credit-notes")}>
          Back to Credit Notes
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert(
      `PDF download for ${creditNote.creditNoteNumber} will be implemented`
    );
  };

  const handleViewInvoice = () => {
    if (linkedInvoice) {
      navigate(`/invoicing/invoices/${linkedInvoice.id}`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      service_issue: "Service Issue / Compensation",
      billing_error: "Billing Error / Correction",
      cancellation: "Cancellation / Refund",
      goodwill: "Goodwill / Customer Satisfaction",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Credit Note: ${creditNote.creditNoteNumber}`}
        description="View credit note details and information"
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
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      {creditNote.status === "issued" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Credit Note Issued
              </h3>
              <p className="text-sm text-green-700">
                Credit amount: LKR {creditNote.creditAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credit Note Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Note Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Credit Note Number</p>
                <p className="text-base font-semibold text-blue-600">
                  {creditNote.creditNoteNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Linked Invoice</p>
                <button
                  onClick={handleViewInvoice}
                  className="text-base font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {creditNote.invoiceNumber}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              {linkedInvoice && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reference Type</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        linkedInvoice.referenceType === "Reservation"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {linkedInvoice.referenceType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Reference Number
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {linkedInvoice.guest.reference.refNo}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Information
              </h3>
            </div>

            {linkedInvoice && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                  <p className="text-base font-medium text-gray-900">
                    {creditNote.customerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {creditNote.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900">
                    {linkedInvoice.guest.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900">
                    {linkedInvoice.guest.phone}
                  </p>
                </div>
                {linkedInvoice.guest.nic && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">NIC</p>
                    <p className="text-base font-medium text-gray-900">
                      {linkedInvoice.guest.nic}
                    </p>
                  </div>
                )}
                {linkedInvoice.guest.passportNo && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Passport Number
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {linkedInvoice.guest.passportNo}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Credit Details */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Credit Details
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Original Invoice Amount
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    LKR {creditNote.originalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Credit Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    LKR {creditNote.creditAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason Category</p>
                <p className="text-base font-semibold text-gray-900">
                  {getReasonCategoryLabel(creditNote.reasonCategory)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason for Credit</p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900">{creditNote.reason}</p>
                </div>
              </div>

              {creditNote.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">{creditNote.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Processing Information */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Processing Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Issued By</p>
                <p className="text-base font-medium text-gray-900">
                  {creditNote.issuedBy}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Issued Date</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(creditNote.issuedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                    creditNote.status
                  )}`}
                >
                  {creditNote.status.charAt(0).toUpperCase() +
                    creditNote.status.slice(1)}
                </span>
              </div>
              {creditNote.appliedDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Applied Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(creditNote.appliedDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Linked Invoice Summary */}
          {linkedInvoice && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Linked Invoice Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Invoice Total:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    LKR{" "}
                    {linkedInvoice.chargeBreakdown.grandTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Invoice Status:</span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      linkedInvoice.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : linkedInvoice.status === "Partially Paid"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {linkedInvoice.status}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(linkedInvoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                {linkedInvoice.paidDate && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">Paid Date:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(linkedInvoice.paidDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                onClick={handleViewInvoice}
                className="w-full mt-4"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Invoice
              </Button>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  {creditNote.appliedDate && (
                    <div className="w-0.5 h-8 bg-gray-300 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Credit Note Issued
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(creditNote.issuedDate).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Issued by {creditNote.issuedBy}
                  </p>
                </div>
              </div>

              {creditNote.appliedDate && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Credit Applied
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(creditNote.appliedDate).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Applied to invoice {creditNote.appliedToInvoiceId}
                    </p>
                  </div>
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
                Print Credit Note
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              {linkedInvoice && (
                <Button
                  variant="outline"
                  onClick={handleViewInvoice}
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Linked Invoice
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
