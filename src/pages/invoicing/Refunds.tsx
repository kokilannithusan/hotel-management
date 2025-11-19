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
  generateRefundNumber,
  generateId,
} from "../../utils/formatters";
import { Refund } from "../../types/entities";

export const Refunds: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    reservationId: "",
    amount: 0,
    reason: "",
  });

  const handleAddRefund = () => {
    const reservation = state.reservations.find(
      (r) => r.id === formData.reservationId
    );
    if (!reservation) return;

    const customer = state.customers.find(
      (c) => c.id === reservation.customerId
    );

    const refund: Refund = {
      id: generateId(),
      refundNumber: generateRefundNumber(),
      reservationId: reservation.id,
      customerId: reservation.customerId,
      customerName: customer?.name || "Unknown",
      amount: formData.amount,
      currency: "LKR",
      currencyRate: 1,
      reason: formData.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_REFUND", payload: refund });
    setShowModal(false);
    setFormData({ reservationId: "", amount: 0, reason: "" });
  };

  const handleProcessRefund = (refund: Refund) => {
    dispatch({
      type: "UPDATE_REFUND",
      payload: {
        ...refund,
        status: "completed",
        processedAt: new Date().toISOString(),
      },
    });
  };

  const columns = [
    { key: "refundNumber", header: "Refund No." },
    {
      key: "customer",
      header: "Customer",
      render: (refund: Refund) => {
        const customer = state.customers.find(
          (c) => c.id === refund.customerId
        );
        return customer?.name || "Unknown";
      },
    },
    {
      key: "reservation",
      header: "Reservation",
      render: (refund: Refund) => refund.reservationId?.slice(0, 8) || "N/A",
    },
    {
      key: "amount",
      header: "Amount",
      render: (refund: Refund) => formatCurrency(refund.amount),
    },
    { key: "reason", header: "Reason" },
    {
      key: "status",
      header: "Status",
      render: (refund: Refund) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            refund.status === "completed"
              ? "bg-green-100 text-green-800"
              : refund.status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (refund: Refund) => formatDate(refund.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (refund: Refund) =>
        refund.status === "pending" ? (
          <Button size="sm" onClick={() => handleProcessRefund(refund)}>
            Mark Completed
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Refunds
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage refund transactions and requests
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Refund</Button>
      </div>
      <div className="w-full overflow-hidden">
        <Card>
          <Table columns={columns} data={state.refunds} />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Refund"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRefund}>Add Refund</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Reservation"
            value={formData.reservationId}
            onChange={(e) => {
              const reservation = state.reservations.find(
                (r) => r.id === e.target.value
              );
              setFormData({
                ...formData,
                reservationId: e.target.value,
                amount: reservation ? reservation.totalAmount : 0,
              });
            }}
            options={state.reservations.map((r) => {
              const customer = state.customers.find(
                (c) => c.id === r.customerId
              );
              return {
                value: r.id,
                label: `${customer?.name || "Unknown"} - ${r.id.slice(0, 8)}`,
              };
            })}
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
          <Input
            label="Reason"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            required
          />
        </div>
      </Modal>
    </div>
  );
};
