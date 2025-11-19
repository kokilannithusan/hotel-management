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
  generateReceiptNumber,
  generateId,
} from "../../utils/formatters";
import { Receipt } from "../../types/entities";

export const Receipts: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    billId: "",
    amount: 0,
    paymentType: "Credit Card",
    notes: "",
  });

  const handleAddReceipt = () => {
    const bill = state.bills.find((b) => b.id === formData.billId);
    if (!bill) return;

    const reservation = state.reservations.find(
      (r) => r.id === bill.reservationId
    );
    if (!reservation) return;

    const receipt: Receipt = {
      id: generateId(),
      receiptNumber: generateReceiptNumber(),
      billId: bill.id,
      reservationId: reservation.id,
      customerId: reservation.customerId,
      amount: formData.amount,
      paymentType: formData.paymentType,
      paymentDate: new Date().toISOString(),
      notes: formData.notes,
    };

    dispatch({ type: "ADD_RECEIPT", payload: receipt });

    const paidAmount = state.receipts
      .filter((r) => r.billId === bill.id)
      .reduce((sum, r) => sum + r.amount, 0);
    const newPaidAmount = paidAmount + formData.amount;

    if (newPaidAmount >= bill.totalAmount) {
      dispatch({
        type: "UPDATE_BILL",
        payload: { ...bill, status: "paid" },
      });
    } else if (newPaidAmount > 0) {
      dispatch({
        type: "UPDATE_BILL",
        payload: { ...bill, status: "partial" },
      });
    }

    setShowModal(false);
    setFormData({
      billId: "",
      amount: 0,
      paymentType: "Credit Card",
      notes: "",
    });
  };

  const unpaidBills = state.bills.filter((b) => b.status !== "paid");

  const columns = [
    { key: "receiptNumber", header: "Receipt No." },
    {
      key: "customer",
      header: "Customer",
      render: (receipt: Receipt) => {
        const customer = state.customers.find(
          (c) => c.id === receipt.customerId
        );
        return customer?.name || "Unknown";
      },
    },
    {
      key: "reservation",
      header: "Reservation",
      render: (receipt: Receipt) => receipt.reservationId.slice(0, 8),
    },
    {
      key: "amount",
      header: "Amount",
      render: (receipt: Receipt) => formatCurrency(receipt.amount),
    },
    { key: "paymentType", header: "Payment Type" },
    {
      key: "paymentDate",
      header: "Date",
      render: (receipt: Receipt) => formatDate(receipt.paymentDate),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Receipts
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Record and track payment receipts
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Receipt</Button>
      </div>
      <Card>
        <Table columns={columns} data={state.receipts} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Receipt"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReceipt}>Add Receipt</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Bill"
            value={formData.billId}
            onChange={(e) => {
              const bill = state.bills.find((b) => b.id === e.target.value);
              setFormData({
                ...formData,
                billId: e.target.value,
                amount: bill ? bill.totalAmount : 0,
              });
            }}
            options={unpaidBills.map((b) => ({
              value: b.id,
              label: `${b.billNumber} - ${formatCurrency(b.totalAmount)}`,
            }))}
          />
          <Input
            type="number"
            label="Amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({
                ...formData,
                amount: parseFloat(e.target.value) || 0,
              })
            }
            required
          />
          <Select
            label="Payment Type"
            value={formData.paymentType}
            onChange={(e) =>
              setFormData({ ...formData, paymentType: e.target.value })
            }
            options={[
              { value: "Credit Card", label: "Credit Card" },
              { value: "Debit Card", label: "Debit Card" },
              { value: "Cash", label: "Cash" },
              { value: "Bank Transfer", label: "Bank Transfer" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>
      </Modal>
    </div>
  );
};
