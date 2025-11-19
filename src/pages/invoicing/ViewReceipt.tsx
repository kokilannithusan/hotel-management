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
  Receipt as ReceiptIcon,
  Calendar,
  User,
  DollarSign,
  FileText,
} from "lucide-react";

export const ViewReceipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { paymentReceipts, getInvoiceById } = useInvoice();

  const receipt = paymentReceipts.find((r) => r.id === id);
  const linkedInvoice = receipt ? getInvoiceById(receipt.invoiceId) : null;

  if (!receipt) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Receipt not found</p>
          <Button
            onClick={() => navigate("/invoicing/receipts")}
            className="mt-4"
          >
            Back to Receipts
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

  const referenceType = linkedInvoice?.guest.reference.type || "N/A";
  const referenceNo = linkedInvoice?.guest.reference.refNo || "N/A";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/invoicing/receipts")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Receipt #{receipt.receiptNumber}
            </h1>
            <p className="text-gray-500 mt-1">
              Issued on {new Date(receipt.paymentDate).toLocaleDateString()}
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
            PDF
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="mb-6 p-6 rounded-lg border-2 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-green-800">
                Payment Completed
              </h2>
              <p className="text-sm mt-1 text-green-700">
                Receipt successfully issued on{" "}
                {new Date(receipt.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Amount Received</p>
            <p className="text-3xl font-bold text-green-600">
              LKR {receipt.amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Receipt Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <ReceiptIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Receipt Information
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Receipt Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {receipt.receiptNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Linked Invoice</p>
                  <button
                    onClick={() =>
                      navigate(`/invoicing/view/${receipt.invoiceId}`)
                    }
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    {receipt.invoiceNumber}
                  </button>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Type</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {referenceType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference Number</p>
                  <p className="font-semibold text-gray-900">{referenceNo}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Customer Information
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="font-semibold text-gray-900">
                    {receipt.customerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">
                    {receipt.customerName}
                  </p>
                </div>
                {receipt.customerEmail && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {receipt.customerEmail}
                    </p>
                  </div>
                )}
                {receipt.customerPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">
                      {receipt.customerPhone}
                    </p>
                  </div>
                )}
                {linkedInvoice?.guest.nic && (
                  <div>
                    <p className="text-sm text-gray-500">NIC</p>
                    <p className="font-semibold text-gray-900">
                      {linkedInvoice.guest.nic}
                    </p>
                  </div>
                )}
                {linkedInvoice?.guest.passportNo && (
                  <div>
                    <p className="text-sm text-gray-500">Passport No</p>
                    <p className="font-semibold text-gray-900">
                      {linkedInvoice.guest.passportNo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Details
                </h2>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Amount Received</p>
                  <p className="text-3xl font-bold text-green-600">
                    LKR {receipt.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold text-gray-900">💵 CASH PAYMENT</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p className="font-semibold text-gray-900">
                    {receipt.currency || "LKR"} (Rate:{" "}
                    {receipt.currencyRate || 1})
                  </p>
                  {receipt.currency && receipt.currency !== "LKR" && (
                    <p className="text-sm text-gray-600 mt-1">
                      ≈ {receipt.currency}{" "}
                      {(receipt.amount / (receipt.currencyRate || 1)).toFixed(
                        2
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(receipt.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                {receipt.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="font-medium text-gray-700">{receipt.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Processing Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Processing Information
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Issued By</p>
                  <p className="font-semibold text-gray-900">
                    {receipt.issuedBy}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Linked Invoice Summary */}
          {linkedInvoice && (
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Invoice Summary
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Invoice Total:
                    </span>
                    <span className="font-semibold text-gray-900">
                      LKR{" "}
                      {linkedInvoice.chargeBreakdown.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Invoice Status:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {linkedInvoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Due Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(linkedInvoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/invoicing/invoices/${receipt.invoiceId}`)
                    }
                    className="w-full mt-4"
                  >
                    View Full Invoice
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Timeline */}
      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Receipt Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Receipt Created</p>
                <p className="text-sm text-gray-500">
                  {new Date(receipt.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Receipt #{receipt.receiptNumber} was issued by{" "}
                  {receipt.issuedBy}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Payment Received</p>
                <p className="text-sm text-gray-500">
                  {new Date(receipt.paymentDate).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Amount of LKR {receipt.amount.toLocaleString()} received in{" "}
                  {receipt.currency || "LKR"} cash
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
