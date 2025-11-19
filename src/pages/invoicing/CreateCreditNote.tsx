import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import {
  ArrowLeft,
  FileText,
  User,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { CreditNote } from "../../types/entities";

export const CreateCreditNote: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, creditNotes, addCreditNote } = useInvoice();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [reasonCategory, setReasonCategory] =
    useState<CreditNote["reasonCategory"]>("billing_error");
  const [reason, setReason] = useState("");
  const [staffResponsible, setStaffResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  // Auto-fill staff on mount (simulating logged-in user)
  useEffect(() => {
    setStaffResponsible("Manager - Current User");
  }, []);

  // Calculate remaining balance (invoice grand total - any existing credit notes)
  const getRemainingBalance = () => {
    if (!selectedInvoice) return 0;
    return selectedInvoice.chargeBreakdown.grandTotal;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedInvoiceId) {
      newErrors.invoice = "Please select an invoice";
    }

    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      newErrors.creditAmount = "Credit amount must be greater than 0";
    } else if (parseFloat(creditAmount) > getRemainingBalance()) {
      newErrors.creditAmount = `Credit amount cannot exceed remaining balance (LKR ${getRemainingBalance().toLocaleString()})`;
    }

    if (!reason.trim()) {
      newErrors.reason = "Please provide a reason for the credit note";
    }

    if (!staffResponsible.trim()) {
      newErrors.staffResponsible = "Staff responsible is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCreate = () => {
    if (!selectedInvoice) return;

    const newCreditNote: CreditNote = {
      id: `cn${Date.now()}`,
      creditNoteNumber: `CN${1000 + creditNotes.length + 1}`,
      invoiceId: selectedInvoiceId,
      invoiceNumber: selectedInvoice.invoiceId,
      customerId: selectedInvoice.guest.id,
      customerName: selectedInvoice.guest.name,
      reason: reason.trim(),
      reasonCategory,
      originalAmount: selectedInvoice.chargeBreakdown.grandTotal,
      creditAmount: parseFloat(creditAmount),
      status: "issued",
      issuedDate: new Date().toISOString().split("T")[0],
      issuedBy: staffResponsible,
      notes: notes.trim() || undefined,
    };

    addCreditNote(newCreditNote);
    setShowConfirmModal(false);
    navigate(`/invoicing/credit-notes/view/${newCreditNote.id}`);
  };

  const reasonCategoryOptions = [
    { value: "billing_error", label: "Billing Error / Correction" },
    { value: "service_issue", label: "Service Issue / Compensation" },
    { value: "cancellation", label: "Cancellation / Refund" },
    { value: "goodwill", label: "Goodwill / Customer Satisfaction" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Credit Note"
        description="Issue a credit note to adjust invoice amounts"
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Selection */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Select Linked Invoice
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  setErrors({ ...errors, invoice: "" });
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.invoice ? "border-red-500" : "border-slate-300"
                }`}
              >
                <option value="">Select an invoice...</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceId} - {invoice.guest.name} - LKR{" "}
                    {invoice.chargeBreakdown.grandTotal.toLocaleString()} (
                    {invoice.status})
                  </option>
                ))}
              </select>
              {errors.invoice && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.invoice}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Customer Information (Auto-populated) */}
        {selectedInvoice && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Customer Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer ID</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.phone}
                </p>
              </div>
              {selectedInvoice.guest.nic && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">NIC</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedInvoice.guest.nic}
                  </p>
                </div>
              )}
              {selectedInvoice.guest.passportNo && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Passport No</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedInvoice.guest.passportNo}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Reference Type</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedInvoice.referenceType === "Reservation"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                >
                  {selectedInvoice.referenceType}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Reference Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.reference.refNo}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Invoice Amount Information */}
        {selectedInvoice && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Amount Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">
                  Original Invoice Amount
                </p>
                <p className="text-xl font-bold text-gray-900">
                  LKR{" "}
                  {selectedInvoice.chargeBreakdown.grandTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Remaining Balance</p>
                <p className="text-xl font-bold text-blue-600">
                  LKR {getRemainingBalance().toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Invoice Status</p>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                    selectedInvoice.status === "Paid"
                      ? "bg-green-100 text-green-800"
                      : selectedInvoice.status === "Partially Paid"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Credit Note Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Credit Note Details
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Amount (LKR) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditAmount}
                  onChange={(e) => {
                    setCreditAmount(e.target.value);
                    setErrors({ ...errors, creditAmount: "" });
                  }}
                  placeholder={
                    selectedInvoice
                      ? `Max: ${getRemainingBalance().toLocaleString()}`
                      : "Enter credit amount"
                  }
                  disabled={!selectedInvoice}
                  className={errors.creditAmount ? "border-red-500" : ""}
                />
                {errors.creditAmount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.creditAmount}
                  </p>
                )}
                {creditAmount &&
                  selectedInvoice &&
                  parseFloat(creditAmount) > 0 &&
                  parseFloat(creditAmount) <= getRemainingBalance() && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Valid credit amount
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) =>
                    setReasonCategory(
                      e.target.value as CreditNote["reasonCategory"]
                    )
                  }
                  disabled={!selectedInvoice}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reasonCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Credit <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setErrors({ ...errors, reason: "" });
                }}
                rows={3}
                placeholder="Provide detailed reason for issuing this credit note..."
                disabled={!selectedInvoice}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.reason}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Responsible <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={staffResponsible}
                onChange={(e) => {
                  setStaffResponsible(e.target.value);
                  setErrors({ ...errors, staffResponsible: "" });
                }}
                placeholder="Enter staff name"
                className={errors.staffResponsible ? "border-red-500" : ""}
              />
              {errors.staffResponsible && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.staffResponsible}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional information..."
                disabled={!selectedInvoice}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedInvoice}>
            Create Credit Note
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Credit Note Creation"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please review the credit note details before confirming.
            </p>
          </div>

          {selectedInvoice && (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Invoice Number:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedInvoice.invoiceId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedInvoice.guest.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Credit Amount:</span>
                <span className="text-sm font-bold text-green-600">
                  LKR {parseFloat(creditAmount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Reason Category:</span>
                <span className="text-sm font-medium text-gray-900">
                  {
                    reasonCategoryOptions.find(
                      (opt) => opt.value === reasonCategory
                    )?.label
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Reason:</span>
                <span className="text-sm font-medium text-gray-900 max-w-xs text-right">
                  {reason}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Issued By:</span>
                <span className="text-sm font-medium text-gray-900">
                  {staffResponsible}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmCreate}>Confirm & Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
