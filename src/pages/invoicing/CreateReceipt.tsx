import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { useHotel } from "../../context/HotelContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { PaymentReceipt, Invoice } from "../../types/entities";

type LinkedType = "invoice" | "refund" | "creditNote";

export const CreateReceipt: React.FC = () => {
  const navigate = useNavigate();
  const { invoices, addReceipt } = useInvoice();
  const { state } = useHotel();

  const [linkedType, setLinkedType] = useState<LinkedType>("invoice");
  const [linkedId, setLinkedId] = useState("");
  const [amountReceived, setAmountReceived] = useState(0);
  const [staffResponsible, setStaffResponsible] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("LKR");
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get linked entity details
  const getLinkedEntity = () => {
    if (linkedType === "invoice") {
      return invoices.find((inv) => inv.id === linkedId);
    }
    // For future: handle refunds and credit notes
    return null;
  };

  const linkedEntity = getLinkedEntity() as Invoice | null;
  const customerInfo = linkedEntity?.guest;

  // Calculate amount due
  const getAmountDue = () => {
    if (linkedType === "invoice" && linkedEntity) {
      const invoice = linkedEntity as Invoice;
      if (invoice.status === "Paid") return 0;
      if (invoice.status === "Partially Paid") {
        // Calculate based on paid amount (simplified)
        return invoice.chargeBreakdown.grandTotal * 0.5;
      }
      return invoice.chargeBreakdown.grandTotal;
    }
    return 0;
  };

  const amountDue = getAmountDue();

  // Auto-fill amount when invoice is selected
  useEffect(() => {
    if (linkedId && amountDue > 0) {
      setAmountReceived(amountDue);
    }
  }, [linkedId, amountDue]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!linkedType) {
      newErrors.linkedType = "Please select a linked type";
    }

    if (!linkedId) {
      newErrors.linkedId = "Please select a linked invoice/refund/credit note";
    }

    if (!amountReceived || amountReceived <= 0) {
      newErrors.amountReceived = "Amount must be greater than 0";
    }

    if (amountReceived > amountDue) {
      newErrors.amountReceived = `Amount cannot exceed due amount of LKR ${amountDue.toLocaleString()}`;
    }

    if (!staffResponsible.trim()) {
      newErrors.staffResponsible = "Staff name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowConfirmModal(true);
  };

  const confirmReceipt = () => {
    if (!linkedEntity || !customerInfo) return;

    const selectedCurrencyRate = state.currencyRates.find(
      (cr) => cr.code === selectedCurrency
    );

    if (!selectedCurrencyRate) {
      alert("Invalid currency selected");
      return;
    }

    const receipt: PaymentReceipt = {
      id: `rcpt${Date.now()}`,
      receiptNumber: `RCP${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: linkedEntity.id,
      invoiceNumber: linkedEntity.invoiceId,
      customerId: customerInfo.id,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      amount: amountReceived,
      currency: selectedCurrency,
      currencyRate: selectedCurrencyRate.rate,
      paymentDate: new Date().toISOString().split("T")[0],
      notes,
      issuedBy: staffResponsible,
      createdAt: new Date().toISOString(),
    };

    addReceipt(receipt);
    setShowConfirmModal(false);
    alert("Receipt created successfully!");
    navigate("/invoicing/receipts");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/invoicing/receipts")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Receipt</h1>
          <p className="text-gray-500 mt-1">Issue a payment receipt</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Linked Type Selection */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Link to Document
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type *
                  </label>
                  <select
                    value={linkedType}
                    onChange={(e) => {
                      setLinkedType(e.target.value as LinkedType);
                      setLinkedId("");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="invoice">Invoice</option>
                    <option value="refund">Refund</option>
                    <option value="creditNote">Credit Note</option>
                  </select>
                  {errors.linkedType && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.linkedType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select{" "}
                    {linkedType === "invoice"
                      ? "Invoice"
                      : linkedType === "refund"
                      ? "Refund"
                      : "Credit Note"}{" "}
                    *
                  </label>
                  <select
                    value={linkedId}
                    onChange={(e) => setLinkedId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {linkedType === "invoice" &&
                      invoices
                        .filter(
                          (inv) =>
                            inv.status !== "Paid" && inv.status !== "cancelled"
                        )
                        .map((invoice) => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceId} - {invoice.guest.name} (LKR{" "}
                            {invoice.chargeBreakdown.grandTotal.toLocaleString()}
                            )
                          </option>
                        ))}
                  </select>
                  {errors.linkedId && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.linkedId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          {customerInfo && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Customer Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold text-gray-900">
                      {customerInfo.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900">
                      {customerInfo.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900">
                      {customerInfo.email}
                    </p>
                  </div>
                  {customerInfo.nic && (
                    <div>
                      <p className="text-sm text-gray-500">NIC</p>
                      <p className="font-semibold text-gray-900">
                        {customerInfo.nic}
                      </p>
                    </div>
                  )}
                  {customerInfo.passportNo && (
                    <div>
                      <p className="text-sm text-gray-500">Passport</p>
                      <p className="font-semibold text-gray-900">
                        {customerInfo.passportNo}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Reference Type</p>
                    <p className="font-semibold text-gray-900">
                      {customerInfo.reference.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reference No</p>
                    <p className="font-semibold text-gray-900">
                      {customerInfo.reference.refNo}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-6">
          {/* Amount Information */}
          {linkedEntity && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Amount Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      LKR{" "}
                      {(
                        linkedEntity as Invoice
                      ).chargeBreakdown.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Amount Due:
                    </span>
                    <span className="text-lg font-bold text-yellow-600">
                      LKR {amountDue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {(linkedEntity as Invoice).status}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Receipt Details */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Receipt Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Received *
                  </label>
                  <Input
                    type="number"
                    value={amountReceived}
                    onChange={(e) =>
                      setAmountReceived(parseFloat(e.target.value) || 0)
                    }
                    placeholder="Enter amount received"
                    min="0"
                    step="0.01"
                  />
                  {errors.amountReceived && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.amountReceived}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {state.currencyRates.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.currency} ({currency.code}) - Rate:{" "}
                        {currency.rate}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    💵 Cash payment only - Select currency for conversion
                  </p>
                  {selectedCurrency !== "LKR" &&
                    amountReceived > 0 &&
                    (() => {
                      const rate =
                        state.currencyRates.find(
                          (cr) => cr.code === selectedCurrency
                        )?.rate || 1;
                      const convertedAmount = amountReceived / rate;
                      return (
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          ≈ {selectedCurrency} {convertedAmount.toFixed(2)}
                        </p>
                      );
                    })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Staff Responsible *
                  </label>
                  <Input
                    type="text"
                    value={staffResponsible}
                    onChange={(e) => setStaffResponsible(e.target.value)}
                    placeholder="Enter staff name"
                  />
                  {errors.staffResponsible && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.staffResponsible}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!linkedId || amountDue === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Receipt
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/invoicing/receipts")}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Receipt Creation"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <p className="text-sm text-gray-700">
              Please review the receipt details before confirming
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="border-b pb-3">
              <h3 className="font-semibold text-gray-900 mb-2">
                Receipt Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Type:</strong>{" "}
                  {linkedType === "invoice" ? "Invoice" : linkedType}
                </p>
                <p>
                  <strong>Document:</strong> {linkedEntity?.invoiceId}
                </p>
                <p>
                  <strong>Customer:</strong> {customerInfo?.name}
                </p>
                <p>
                  <strong>Amount Received:</strong> LKR{" "}
                  {amountReceived.toLocaleString()}
                </p>
                <p>
                  <strong>Currency:</strong> {selectedCurrency}
                  {selectedCurrency !== "LKR" &&
                    (() => {
                      const rate =
                        state.currencyRates.find(
                          (cr) => cr.code === selectedCurrency
                        )?.rate || 1;
                      const convertedAmount = amountReceived / rate;
                      return (
                        <span className="text-green-600 ml-2">
                          (≈ {selectedCurrency} {convertedAmount.toFixed(2)})
                        </span>
                      );
                    })()}
                </p>
                <p>
                  <strong>Staff:</strong> {staffResponsible}
                </p>
                {notes && (
                  <p>
                    <strong>Notes:</strong> {notes}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={confirmReceipt} className="flex-1">
              Confirm & Create
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
