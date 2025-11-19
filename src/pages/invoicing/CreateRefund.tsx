import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { useHotel } from "../../context/HotelContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Refund, ReferenceType, Invoice } from "../../types/entities";

export const CreateRefund: React.FC = () => {
  const navigate = useNavigate();
  const { addRefund, invoices, addCreditNote } = useInvoice();
  const { state } = useHotel();

  const [referenceType, setReferenceType] =
    useState<ReferenceType>("Reservation");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refundType, setRefundType] = useState<"Full" | "Partial">("Partial");
  const [refundAmount, setRefundAmount] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState("LKR");
  const [reason, setReason] = useState("");
  const [processedBy, setProcessedBy] = useState("");
  const [autoGenerateCreditNote, setAutoGenerateCreditNote] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available invoices based on reference
  const availableInvoices = invoices.filter((inv) => {
    if (referenceType === "Reservation") {
      return inv.reservationId === referenceNo;
    } else {
      return inv.eventId === referenceNo;
    }
  });

  // Get customer info from selected invoice
  const customerInfo = selectedInvoice?.guest;

  // Calculate remaining balance
  const getRemainingBalance = () => {
    if (!selectedInvoice) return 0;
    // In a real app, you'd track payments made. For now, assume full amount if unpaid
    if (selectedInvoice.status === "Paid") return 0;
    if (selectedInvoice.status === "Partially Paid") {
      // Assume 50% paid for demo
      return selectedInvoice.chargeBreakdown.grandTotal * 0.5;
    }
    return selectedInvoice.chargeBreakdown.grandTotal;
  };

  const remainingBalance = getRemainingBalance();

  // Auto-set refund amount for full refund
  useEffect(() => {
    if (refundType === "Full") {
      setRefundAmount(remainingBalance);
    }
  }, [refundType, remainingBalance]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!referenceNo) {
      newErrors.referenceNo = "Reference number is required";
    }

    if (!selectedInvoice) {
      newErrors.invoice = "Please select an invoice";
    }

    if (refundAmount <= 0) {
      newErrors.refundAmount = "Refund amount must be greater than 0";
    }

    if (refundAmount > remainingBalance) {
      newErrors.refundAmount = `Refund cannot exceed remaining balance of LKR ${remainingBalance.toLocaleString()}`;
    }

    if (!reason.trim()) {
      newErrors.reason = "Refund reason is required";
    }

    if (!processedBy.trim()) {
      newErrors.processedBy = "Staff name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmRefund = () => {
    if (!selectedInvoice || !customerInfo) return;

    const selectedCurrencyRate = state.currencyRates.find(
      (cr) => cr.code === selectedCurrency
    );

    if (!selectedCurrencyRate) {
      alert("Invalid currency selected");
      return;
    }

    const refund: Refund = {
      id: `rf${Date.now()}`,
      refundNumber: `RF${1000 + Math.floor(Math.random() * 9000)}`,
      reservationId: referenceType === "Reservation" ? referenceNo : undefined,
      eventId: referenceType === "Event" ? referenceNo : undefined,
      invoiceId: selectedInvoice.id,
      customerId: customerInfo.id,
      customerName: customerInfo.name,
      amount: refundAmount,
      currency: selectedCurrency,
      currencyRate: selectedCurrencyRate.rate,
      reason,
      status: "completed",
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      processedBy,
      notes: `${refundType} refund processed`,
    };

    addRefund(refund);

    // Auto-generate credit note if enabled
    if (autoGenerateCreditNote) {
      const creditNote = {
        id: `cn${Date.now()}`,
        creditNoteNumber: `CN${1000 + Math.floor(Math.random() * 9000)}`,
        invoiceId: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceId,
        customerId: customerInfo.id,
        customerName: customerInfo.name,
        reason: `Refund: ${reason}`,
        reasonCategory: "other" as const,
        originalAmount: selectedInvoice.chargeBreakdown.grandTotal,
        creditAmount: refundAmount,
        status: "issued" as const,
        issuedDate: new Date().toISOString().split("T")[0],
        issuedBy: processedBy,
        notes: `Auto-generated from refund ${refund.refundNumber}`,
      };
      addCreditNote(creditNote);
    }

    setShowConfirmModal(false);
    alert("Refund created successfully!");
    navigate("/invoicing/refunds");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/invoicing/refunds")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Refund</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Reference Selection */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Reference Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Reference Type"
                  value={referenceType}
                  onChange={(e) => {
                    setReferenceType(e.target.value as ReferenceType);
                    setReferenceNo("");
                    setSelectedInvoice(null);
                  }}
                  options={[
                    { value: "Reservation", label: "Reservation" },
                    { value: "Event", label: "Event" },
                  ]}
                />

                <div>
                  <Input
                    label="Reference Number"
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder={`Enter ${referenceType} ID`}
                    error={errors.referenceNo}
                  />
                </div>
              </div>

              {availableInvoices.length > 0 && (
                <div className="mt-4">
                  <Select
                    label="Select Invoice"
                    value={selectedInvoice?.id || ""}
                    onChange={(e) => {
                      const invoice = availableInvoices.find(
                        (inv) => inv.id === e.target.value
                      );
                      setSelectedInvoice(invoice || null);
                    }}
                    options={[
                      { value: "", label: "Select an invoice" },
                      ...availableInvoices.map((inv) => ({
                        value: inv.id,
                        label: `${
                          inv.invoiceId
                        } - LKR ${inv.chargeBreakdown.grandTotal.toLocaleString()} - ${
                          inv.status
                        }`,
                      })),
                    ]}
                    error={errors.invoice}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Customer Information */}
          {customerInfo && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Customer Information
                </h2>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
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
                      <p className="text-sm text-gray-500">Passport No</p>
                      <p className="font-semibold text-gray-900">
                        {customerInfo.passportNo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Invoice Balance Information */}
          {selectedInvoice && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Invoice Balance
                </h2>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Invoice Total:</span>
                    <span className="font-bold text-gray-900">
                      LKR{" "}
                      {selectedInvoice.chargeBreakdown.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Invoice Status:</span>
                    <span className="font-semibold text-blue-600">
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-gray-700 font-semibold">
                      Remaining Balance:
                    </span>
                    <span className="font-bold text-green-600 text-lg">
                      LKR {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Refund Details */}
          {selectedInvoice && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Refund Details
                </h2>

                <div className="space-y-4">
                  <Select
                    label="Refund Type"
                    value={refundType}
                    onChange={(e) =>
                      setRefundType(e.target.value as "Full" | "Partial")
                    }
                    options={[
                      { value: "Partial", label: "Partial Refund" },
                      { value: "Full", label: "Full Refund" },
                    ]}
                  />

                  <Input
                    label="Refund Amount (LKR)"
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    disabled={refundType === "Full"}
                    error={errors.refundAmount}
                    placeholder="Enter refund amount"
                  />

                  {errors.refundAmount && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.refundAmount}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Currency *
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
                      💵 Cash refund only - Select currency for conversion
                    </p>
                    {selectedCurrency !== "LKR" &&
                      refundAmount > 0 &&
                      (() => {
                        const rate =
                          state.currencyRates.find(
                            (cr) => cr.code === selectedCurrency
                          )?.rate || 1;
                        const convertedAmount = refundAmount / rate;
                        return (
                          <p className="text-sm text-green-600 mt-2 font-semibold">
                            ≈ {selectedCurrency} {convertedAmount.toFixed(2)}
                          </p>
                        );
                      })()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Reason *
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Explain the reason for this refund..."
                    />
                    {errors.reason && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.reason}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Processed By (Staff Name)"
                    type="text"
                    value={processedBy}
                    onChange={(e) => setProcessedBy(e.target.value)}
                    error={errors.processedBy}
                    placeholder="Enter staff name"
                  />

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoCredit"
                      checked={autoGenerateCreditNote}
                      onChange={(e) =>
                        setAutoGenerateCreditNote(e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="autoCredit"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Auto-generate credit note for this refund
                    </label>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Buttons */}
          {selectedInvoice && (
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/invoicing/refunds")}
              >
                Cancel
              </Button>
              <Button type="submit">Create Refund</Button>
            </div>
          )}
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Refund"
        >
          <div className="p-6">
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Please confirm this refund
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Customer:</strong> {customerInfo?.name}
                    </p>
                    <p>
                      <strong>Reference:</strong> {referenceType} -{" "}
                      {referenceNo}
                    </p>
                    <p>
                      <strong>Invoice:</strong> {selectedInvoice?.invoiceId}
                    </p>
                    <p>
                      <strong>Amount:</strong> LKR{" "}
                      {refundAmount.toLocaleString()}
                    </p>
                    <p>
                      <strong>Method:</strong> CASH
                    </p>
                    <p>
                      <strong>Currency:</strong> {selectedCurrency}
                      {selectedCurrency !== "LKR" &&
                        (() => {
                          const rate =
                            state.currencyRates.find(
                              (cr) => cr.code === selectedCurrency
                            )?.rate || 1;
                          const convertedAmount = refundAmount / rate;
                          return (
                            <span className="text-green-600 ml-2">
                              (≈ {selectedCurrency} {convertedAmount.toFixed(2)}
                              )
                            </span>
                          );
                        })()}
                    </p>
                    <p>
                      <strong>Reason:</strong> {reason}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={confirmRefund} className="flex-1">
                Confirm & Process Refund
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
      )}
    </div>
  );
};
