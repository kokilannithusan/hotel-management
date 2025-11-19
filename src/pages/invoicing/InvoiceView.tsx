import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { useHotel } from "../../context/HotelContext";
import { InvoiceSummaryCard } from "../../components/invoicing/InvoiceSummaryCard";
import { ServiceList } from "../../components/invoicing/ServiceList";
import { MealPlanCard } from "../../components/invoicing/MealPlanCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { ArrowLeft, Printer, Download, Check, Plus } from "lucide-react";

export const InvoiceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, markAsPaid, addReceipt } = useInvoice();
  const { state } = useHotel();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("LKR");

  const invoice = id ? getInvoiceById(id) : null;

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Invoice not found</p>
          <Button
            onClick={() => navigate("/invoicing/invoices")}
            className="mt-4"
          >
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkAsPaid = () => {
    const selectedCurrencyRate = state.currencyRates.find(
      (cr) => cr.code === selectedCurrency
    );

    if (!selectedCurrencyRate) {
      alert("Please select a valid currency");
      return;
    }

    markAsPaid(invoice.id, "cash");

    // Generate receipt
    const receipt = {
      id: `r${Date.now()}`,
      receiptNumber: `RCP${Math.floor(Math.random() * 10000)}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceId,
      customerId: invoice.guest.id,
      customerName: invoice.guest.name,
      customerEmail: invoice.guest.email,
      customerPhone: invoice.guest.phone,
      amount: invoice.chargeBreakdown.grandTotal,
      currency: selectedCurrency,
      currencyRate: selectedCurrencyRate.rate,
      paymentDate: new Date().toISOString().split("T")[0],
      issuedBy: "current-user",
      createdAt: new Date().toISOString(),
    };

    addReceipt(receipt);
    setShowPaymentModal(false);
    alert(`Invoice marked as paid! Payment received in ${selectedCurrency}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert("PDF download functionality will be implemented");
  };

  const handleAddBilling = () => {
    navigate(`/invoicing/additional?invoiceId=${invoice.id}`);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      Paid: "bg-green-100 text-green-800",
      Unpaid: "bg-red-100 text-red-800",
      "Partially Paid": "bg-yellow-100 text-yellow-800",
      Cancelled: "bg-gray-100 text-gray-800",
      Overdue: "bg-orange-100 text-orange-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/invoicing/invoices")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice #{invoice.invoiceId}
            </h1>
            <p className="text-gray-500 mt-1">
              Generated on{" "}
              {new Date(invoice.generatedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <Button onClick={() => setShowPaymentModal(true)}>
              <Check className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={handleAddBilling}>
            <Plus className="w-4 h-4 mr-2" />
            Add Billing
          </Button>
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

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(
            invoice.status
          )}`}
        >
          Status: {invoice.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Guest Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold text-gray-900">
                    {invoice.guest.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {invoice.guest.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900">
                    {invoice.guest.email}
                  </p>
                </div>
                {invoice.guest.nic && (
                  <div>
                    <p className="text-sm text-gray-500">NIC</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.guest.nic}
                    </p>
                  </div>
                )}
                {invoice.guest.passportNo && (
                  <div>
                    <p className="text-sm text-gray-500">Passport No</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.guest.passportNo}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Reference Type</p>
                  <p className="font-semibold text-gray-900">
                    {invoice.guest.reference.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference No</p>
                  <p className="font-semibold text-gray-900">
                    {invoice.guest.reference.refNo}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Reservation/Event Information */}
          {invoice.referenceType === "Reservation" && invoice.reservation && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Reservation Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Room Number</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.reservation.roomNo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Room Type</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.reservation.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rate per Night</p>
                    <p className="font-semibold text-gray-900">
                      LKR {invoice.reservation.rate.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nights</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.reservation.nights}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        invoice.reservation.checkIn
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        invoice.reservation.checkOut
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {invoice.reservation.mealPlan && (
                  <div className="mt-4">
                    <MealPlanCard
                      mealPlanType={invoice.reservation.mealPlan.type}
                      pricePerDay={invoice.reservation.mealPlan.pricePerDay}
                      totalPrice={invoice.reservation.mealPlan.totalPrice}
                      nights={invoice.reservation.nights}
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {invoice.referenceType === "Event" && invoice.event && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Event Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Hall Name</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.hallName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Event Type</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.eventType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hall Rate</p>
                    <p className="font-semibold text-gray-900">
                      LKR {invoice.event.hallRate.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.duration} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.startDateTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date & Time</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.endDateTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Attendees</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.event.attendees}
                    </p>
                  </div>
                  {invoice.event.packageName && (
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-semibold text-gray-900">
                        {invoice.event.packageName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Services and Charges */}
          <ServiceList
            services={invoice.services}
            additionalCharges={invoice.additionalCharges}
          />
        </div>

        {/* Right Column - Summary */}
        <div>
          <InvoiceSummaryCard chargeBreakdown={invoice.chargeBreakdown} />

          {invoice.paidDate && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Paid Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(invoice.paidDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      💵 CASH PAYMENT
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title="Mark as Paid - Cash Payment"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Record Cash Payment
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Currency
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
            </div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <span className="font-semibold">Invoice Total (Base):</span>{" "}
                <span className="text-lg font-bold text-blue-600">
                  LKR {invoice.chargeBreakdown.grandTotal.toLocaleString()}
                </span>
              </p>
              {selectedCurrency !== "LKR" &&
                (() => {
                  const rate =
                    state.currencyRates.find(
                      (cr) => cr.code === selectedCurrency
                    )?.rate || 1;
                  const convertedAmount =
                    invoice.chargeBreakdown.grandTotal / rate;
                  return (
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">
                        Amount in {selectedCurrency}:
                      </span>{" "}
                      <span className="text-lg font-bold text-green-600">
                        {selectedCurrency} {convertedAmount.toFixed(2)}
                      </span>
                    </p>
                  );
                })()}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-2">
                💵 <strong>Cash Payment Only:</strong> All payments are
                processed as cash transactions.
              </p>
              <p className="text-xs text-gray-500">
                Multi-currency support enabled. Exchange rates from Currency
                Rate settings.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleMarkAsPaid} className="flex-1">
                Confirm Cash Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
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
