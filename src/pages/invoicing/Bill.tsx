import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import {
  formatDate,
  formatCurrency,
  generateBillNumber,
  generateId,
} from "../../utils/formatters";
import { Bill } from "../../types/entities";

export const BillPage: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState("");
  const [extraCharges, setExtraCharges] = useState([
    { description: "", amount: 0 },
  ]);

  const handleGenerateBill = () => {
    if (!selectedReservation) return;

    const reservation = state.reservations.find(
      (r) => r.id === selectedReservation
    );
    if (!reservation) return;

    const room = state.rooms.find((r) => r.id === reservation.roomId);
    const baseAmount = reservation.totalAmount;
    const extraAmount = extraCharges.reduce(
      (sum, charge) => sum + charge.amount,
      0
    );
    const totalAmount = baseAmount + extraAmount;

    const activeTaxes = state.taxes.filter((t) => t.isActive);
    const taxAmount = activeTaxes.reduce((sum, tax) => {
      if (tax.type === "percentage") {
        return sum + (totalAmount * tax.rate) / 100;
      }
      return sum + tax.rate;
    }, 0);

    const bill: Bill = {
      id: generateId(),
      billNumber: generateBillNumber(),
      reservationId: reservation.id,
      amount: totalAmount,
      taxAmount,
      totalAmount: totalAmount + taxAmount,
      status: "unpaid",
      createdAt: new Date().toISOString(),
      lineItems: [
        {
          id: generateId(),
          description: `Room charges - ${room?.roomNumber || "Unknown"}`,
          quantity: 1,
          unitPrice: baseAmount,
          total: baseAmount,
        },
        ...extraCharges
          .filter((c) => c.description && c.amount > 0)
          .map((c) => ({
            id: generateId(),
            description: c.description,
            quantity: 1,
            unitPrice: c.amount,
            total: c.amount,
          })),
      ],
    };

    dispatch({ type: "ADD_BILL", payload: bill });
    setShowGenerateModal(false);
    setSelectedReservation("");
    setExtraCharges([{ description: "", amount: 0 }]);
  };

  const columns = [
    { key: "billNumber", header: "Bill No." },
    {
      key: "reservation",
      header: "Reservation",
      render: (bill: Bill) => {
        const reservation = state.reservations.find(
          (r) => r.id === bill.reservationId
        );
        return reservation
          ? `Reservation ${bill.reservationId.slice(0, 8)}`
          : "Unknown";
      },
    },
    {
      key: "amount",
      header: "Amount",
      render: (bill: Bill) => formatCurrency(bill.amount),
    },
    {
      key: "taxAmount",
      header: "Tax",
      render: (bill: Bill) => formatCurrency(bill.taxAmount),
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (bill: Bill) => formatCurrency(bill.totalAmount),
    },
    {
      key: "status",
      header: "Status",
      render: (bill: Bill) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            bill.status === "paid"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (bill: Bill) => formatDate(bill.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Bills
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage and generate bills for reservations
          </p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          Generate Bill
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.bills} />
      </Card>

      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Bill"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateBill}>Generate</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Reservation"
            value={selectedReservation}
            onChange={(e) => setSelectedReservation(e.target.value)}
            options={state.reservations
              .filter((r) => !state.bills.some((b) => b.reservationId === r.id))
              .map((r) => {
                const customer = state.customers.find(
                  (c) => c.id === r.customerId
                );
                return {
                  value: r.id,
                  label: `${customer?.name || "Unknown"} - ${r.id.slice(0, 8)}`,
                };
              })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Extra Charges
            </label>
            {extraCharges.map((charge, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Description"
                  value={charge.description}
                  onChange={(e) => {
                    const newCharges = [...extraCharges];
                    newCharges[index].description = e.target.value;
                    setExtraCharges(newCharges);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={charge.amount}
                  onChange={(e) => {
                    const newCharges = [...extraCharges];
                    newCharges[index].amount = parseFloat(e.target.value) || 0;
                    setExtraCharges(newCharges);
                  }}
                />
                {extraCharges.length > 1 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      setExtraCharges(
                        extraCharges.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setExtraCharges([
                  ...extraCharges,
                  { description: "", amount: 0 },
                ])
              }
            >
              Add Charge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { BillPage as Bill };
