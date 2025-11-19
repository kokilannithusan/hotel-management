import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { useHotel } from "../../context/HotelContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Invoice, ReferenceType, ServiceItem } from "../../types/entities";

export const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { addInvoice } = useInvoice();
  const { state } = useHotel();
  const {
    customers,
    reservations,
    events,
    rooms,
    roomTypes,
    halls,
    mealPlans,
  } = state;

  const [referenceType, setReferenceType] =
    useState<ReferenceType>("Reservation");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<ServiceItem[]>([]);
  const [taxRate, setTaxRate] = useState(12);
  const [discount, setDiscount] = useState(0);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedReservation = reservations.find(
    (r) => r.id === selectedReferenceId
  );
  const selectedEvent = events.find((e) => e.id === selectedReferenceId);

  const room = selectedReservation
    ? rooms.find((r) => r.id === selectedReservation.roomId)
    : null;
  const roomType = room
    ? roomTypes.find((rt) => rt.id === room.roomTypeId)
    : null;

  const hall =
    selectedEvent && selectedEvent.hallIds.length > 0
      ? halls.find((h) => h.id === selectedEvent.hallIds[0])
      : null;

  const mealPlan = selectedReservation?.mealPlanId
    ? mealPlans.find((mp) => mp.id === selectedReservation.mealPlanId)
    : null;

  const addService = () => {
    setServices([
      ...services,
      { id: `s${Date.now()}`, name: "", amount: 0, quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateService = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      updated[index].amount =
        updated[index].quantity! * updated[index].unitPrice!;
    }
    setServices(updated);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      { id: `ac${Date.now()}`, name: "", amount: 0 },
    ]);
  };

  const updateCharge = (index: number, field: string, value: any) => {
    const updated = [...additionalCharges];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalCharges(updated);
  };

  const removeCharge = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const calculateCharges = () => {
    let roomCharges = 0;
    let eventCharges = 0;
    let mealPlanTotal = 0;

    if (referenceType === "Reservation" && selectedReservation && roomType) {
      const checkIn = new Date(selectedReservation.checkIn);
      const checkOut = new Date(selectedReservation.checkOut);
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)
      );
      roomCharges = nights * roomType.basePrice;

      if (mealPlan) {
        mealPlanTotal =
          nights *
          mealPlan.perPersonRate *
          (selectedReservation.adults + selectedReservation.children);
      }
    }

    if (referenceType === "Event" && selectedEvent && hall) {
      eventCharges = hall.pricePerDay;
    }

    const serviceTotal = services.reduce((sum, s) => sum + s.amount, 0);
    const extraCharges = additionalCharges.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const subTotal =
      roomCharges + eventCharges + mealPlanTotal + serviceTotal + extraCharges;
    const taxAmount = subTotal * (taxRate / 100);
    const grandTotal = subTotal + taxAmount - discount;

    return {
      roomCharges: roomCharges || undefined,
      eventCharges: eventCharges || undefined,
      mealPlanTotal: mealPlanTotal || undefined,
      serviceTotal,
      extraCharges,
      subTotal,
      taxRate,
      taxAmount,
      discount,
      grandTotal,
    };
  };

  const chargeBreakdown = calculateCharges();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer || !selectedReferenceId) {
      alert("Please select customer and reference");
      return;
    }

    const invoice: Invoice = {
      id: `inv${Date.now()}`,
      invoiceId: `INV${1000 + Math.floor(Math.random() * 9000)}`,
      referenceType,
      reservationId:
        referenceType === "Reservation" ? selectedReferenceId : undefined,
      eventId: referenceType === "Event" ? selectedReferenceId : undefined,
      guest: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        email: selectedCustomer.email,
        nic: selectedCustomer.identificationNumber,
        reference: {
          type: referenceType,
          refNo:
            referenceType === "Reservation"
              ? selectedReservation?.id || ""
              : selectedEvent?.id || "",
        },
      },
      reservation:
        referenceType === "Reservation" &&
        selectedReservation &&
        roomType &&
        room
          ? {
              roomNo: room.roomNumber,
              type: roomType.name,
              rate: roomType.basePrice,
              checkIn: selectedReservation.checkIn,
              checkOut: selectedReservation.checkOut,
              nights: Math.ceil(
                (new Date(selectedReservation.checkOut).getTime() -
                  new Date(selectedReservation.checkIn).getTime()) /
                  (1000 * 3600 * 24)
              ),
              mealPlan: mealPlan
                ? {
                    type: mealPlan.name,
                    pricePerDay: mealPlan.perPersonRate,
                    totalPrice:
                      mealPlan.perPersonRate *
                      (selectedReservation.adults +
                        selectedReservation.children) *
                      Math.ceil(
                        (new Date(selectedReservation.checkOut).getTime() -
                          new Date(selectedReservation.checkIn).getTime()) /
                          (1000 * 3600 * 24)
                      ),
                  }
                : { type: "None", pricePerDay: 0, totalPrice: 0 },
            }
          : undefined,
      event:
        referenceType === "Event" && selectedEvent && hall
          ? {
              hallName: hall.name,
              eventType: selectedEvent.type,
              startDateTime: selectedEvent.startDateTime,
              endDateTime: selectedEvent.endDateTime,
              duration: Math.ceil(
                (new Date(selectedEvent.endDateTime).getTime() -
                  new Date(selectedEvent.startDateTime).getTime()) /
                  (1000 * 3600)
              ),
              hallRate: hall.pricePerDay,
              attendees: selectedEvent.expectedAttendees,
            }
          : undefined,
      services,
      additionalCharges,
      chargeBreakdown,
      status: "Unpaid",
      generatedDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000)
        .toISOString()
        .split("T")[0],
      createdBy: "current-user",
    };

    addInvoice(invoice);
    alert("Invoice created successfully!");
    navigate("/invoicing/invoices");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/invoicing/invoices")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Reference Type Selection */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Invoice Type
              </h2>
              <Select
                label="Reference Type"
                value={referenceType}
                onChange={(e) =>
                  setReferenceType(e.target.value as ReferenceType)
                }
                options={[
                  { value: "Reservation", label: "Reservation" },
                  { value: "Event", label: "Event" },
                ]}
              />
            </div>
          </Card>

          {/* Customer Selection */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customer Information
              </h2>
              <Select
                label="Select Customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={[
                  { value: "", label: "Select a customer" },
                  ...customers.map((c) => ({
                    value: c.id,
                    label: `${c.name} - ${c.phone}`,
                  })),
                ]}
              />
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Reference Selection */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {referenceType === "Reservation" ? "Reservation" : "Event"}{" "}
                Details
              </h2>
              {referenceType === "Reservation" ? (
                <>
                  <Select
                    label="Select Reservation"
                    value={selectedReferenceId}
                    onChange={(e) => setSelectedReferenceId(e.target.value)}
                    options={[
                      { value: "", label: "Select a reservation" },
                      ...reservations.map((r) => ({
                        value: r.id,
                        label: `${r.id} - ${new Date(
                          r.checkIn
                        ).toLocaleDateString()} to ${new Date(
                          r.checkOut
                        ).toLocaleDateString()}`,
                      })),
                    ]}
                  />
                  {selectedReservation && room && roomType && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Room Number</p>
                          <p className="font-medium">{room.roomNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Room Type</p>
                          <p className="font-medium">{roomType.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Check-in</p>
                          <p className="font-medium">
                            {new Date(
                              selectedReservation.checkIn
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Check-out</p>
                          <p className="font-medium">
                            {new Date(
                              selectedReservation.checkOut
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Select
                    label="Select Event"
                    value={selectedReferenceId}
                    onChange={(e) => setSelectedReferenceId(e.target.value)}
                    options={[
                      { value: "", label: "Select an event" },
                      ...events.map((e) => ({
                        value: e.id,
                        label: `${e.name} - ${new Date(
                          e.startDateTime
                        ).toLocaleDateString()}`,
                      })),
                    ]}
                  />
                  {selectedEvent && hall && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Event Name</p>
                          <p className="font-medium">{selectedEvent.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Event Type</p>
                          <p className="font-medium">{selectedEvent.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hall</p>
                          <p className="font-medium">{hall.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Attendees</p>
                          <p className="font-medium">
                            {selectedEvent.expectedAttendees}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Start Date & Time
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedEvent.startDateTime
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            End Date & Time
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedEvent.endDateTime
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Services */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Services</h2>
                <Button type="button" onClick={addService}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={service.id} className="flex gap-4 items-start">
                    <Input
                      placeholder="Service name"
                      value={service.name}
                      onChange={(e) =>
                        updateService(index, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={service.quantity || 1}
                      onChange={(e) =>
                        updateService(index, "quantity", Number(e.target.value))
                      }
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={service.unitPrice || 0}
                      onChange={(e) =>
                        updateService(
                          index,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                      className="w-32"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={service.amount}
                      readOnly
                      className="w-32 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Additional Charges */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Additional Charges
                </h2>
                <Button type="button" onClick={addCharge}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Charge
                </Button>
              </div>
              <div className="space-y-4">
                {additionalCharges.map((charge, index) => (
                  <div key={charge.id} className="flex gap-4 items-start">
                    <Input
                      placeholder="Charge name"
                      value={charge.name}
                      onChange={(e) =>
                        updateCharge(index, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={charge.amount}
                      onChange={(e) =>
                        updateCharge(index, "amount", Number(e.target.value))
                      }
                      className="w-40"
                    />
                    <button
                      type="button"
                      onClick={() => removeCharge(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tax and Discount */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tax & Discount
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Tax Rate (%)"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
                <Input
                  type="number"
                  label="Discount (LKR)"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Invoice Summary
              </h2>
              <div className="space-y-2">
                {chargeBreakdown.roomCharges !== undefined && (
                  <div className="flex justify-between">
                    <span>Room Charges:</span>
                    <span className="font-semibold">
                      LKR {chargeBreakdown.roomCharges.toLocaleString()}
                    </span>
                  </div>
                )}
                {chargeBreakdown.eventCharges !== undefined && (
                  <div className="flex justify-between">
                    <span>Event Charges:</span>
                    <span className="font-semibold">
                      LKR {chargeBreakdown.eventCharges.toLocaleString()}
                    </span>
                  </div>
                )}
                {chargeBreakdown.mealPlanTotal !== undefined &&
                  chargeBreakdown.mealPlanTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Meal Plan:</span>
                      <span className="font-semibold">
                        LKR {chargeBreakdown.mealPlanTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between">
                  <span>Services:</span>
                  <span className="font-semibold">
                    LKR {chargeBreakdown.serviceTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Charges:</span>
                  <span className="font-semibold">
                    LKR {chargeBreakdown.extraCharges.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    LKR {chargeBreakdown.subTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-semibold">
                    LKR {chargeBreakdown.taxAmount.toLocaleString()}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-semibold">
                      - LKR {discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t text-lg font-bold text-blue-600">
                  <span>Grand Total:</span>
                  <span>LKR {chargeBreakdown.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/invoicing/invoices")}
            >
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
