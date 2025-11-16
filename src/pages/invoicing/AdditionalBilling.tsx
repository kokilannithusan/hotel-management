import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { formatCurrency, generateId } from "../../utils/formatters";

export const AdditionalBilling: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [selectedReservation, setSelectedReservation] = useState("");
  const [lineItems, setLineItems] = useState([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const selectedBill = state.bills.find(
    (b) => b.reservationId === selectedReservation
  );

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedBill) return;

    const newLineItems = lineItems
      .filter((item) => item.description && item.unitPrice > 0)
      .map((item) => ({
        id: generateId(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

    const additionalAmount = newLineItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const newAmount = selectedBill.amount + additionalAmount;

    const activeTaxes = state.taxes.filter((t) => t.isActive);
    const taxAmount = activeTaxes.reduce((sum, tax) => {
      if (tax.type === "percentage") {
        return sum + (newAmount * tax.rate) / 100;
      }
      return sum + tax.rate;
    }, 0);

    dispatch({
      type: "UPDATE_BILL",
      payload: {
        ...selectedBill,
        amount: newAmount,
        taxAmount,
        totalAmount: newAmount + taxAmount,
        lineItems: [...selectedBill.lineItems, ...newLineItems],
      },
    });

    alert("Additional charges added successfully!");
    setLineItems([{ description: "", quantity: 1, unitPrice: 0 }]);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Additional Billing
        </h1>
        <p className="text-slate-600 mt-1 font-medium">
          Add extra charges and services to existing bills
        </p>
      </div>
      <Card>
        <div className="space-y-4">
          <Select
            label="Select Reservation"
            value={selectedReservation}
            onChange={(e) => setSelectedReservation(e.target.value)}
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

          {selectedBill && (
            <>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">
                  Current Bill: {selectedBill.billNumber}
                </h3>
                <p className="text-sm text-slate-600">
                  Total Amount: {formatCurrency(selectedBill.totalAmount)}
                </p>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Add Line Items</h3>
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...lineItems];
                        newItems[index].description = e.target.value;
                        setLineItems(newItems);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...lineItems];
                        newItems[index].quantity =
                          parseInt(e.target.value) || 1;
                        setLineItems(newItems);
                      }}
                      min={1}
                    />
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...lineItems];
                        newItems[index].unitPrice =
                          parseFloat(e.target.value) || 0;
                        setLineItems(newItems);
                      }}
                      min={0}
                      step="0.01"
                    />
                    <div className="flex items-center">
                      <span className="font-semibold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      {lineItems.length > 1 && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="ml-2"
                          onClick={() => handleRemoveLineItem(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={handleAddLineItem}>
                  Add Line Item
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-lg font-semibold">
                  Additional Total:{" "}
                  {formatCurrency(
                    lineItems.reduce(
                      (sum, item) => sum + item.quantity * item.unitPrice,
                      0
                    )
                  )}
                </p>
              </div>

              <div className="mt-4">
                <Button onClick={handleSave}>Save Additional Charges</Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
