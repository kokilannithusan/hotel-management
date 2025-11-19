import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEventInvoice } from "../../context/EventInvoiceContext";
import { useHotel } from "../../context/HotelContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { EventInvoice } from "../../types/entities";

export const CreateEventInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { addEventInvoice } = useEventInvoice();
  const { state } = useHotel();

  const [selectedEventId, setSelectedEventId] = useState("");
  const [standardHours, setStandardHours] = useState(8);
  const [overtimeRate, setOvertimeRate] = useState(150); // 150% rate
  const [taxRate, setTaxRate] = useState(15);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [addOnServices, setAddOnServices] = useState<
    Array<{
      id: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>
  >([]);
  const [decorationType, setDecorationType] = useState("");
  const [cateringRequirements, setCateringRequirements] = useState("");
  const [customRequirements, setCustomRequirements] = useState("");
  const [notes, setNotes] = useState("");

  const selectedEvent = state.events.find((e) => e.id === selectedEventId);

  // Calculate hours and charges
  const calculateHours = () => {
    if (!selectedEvent)
      return { totalHours: 0, extraHours: 0, overtimeCharges: 0 };

    const start = new Date(selectedEvent.startDateTime);
    const end = new Date(selectedEvent.endDateTime);
    const totalHours = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );
    const extraHours = Math.max(0, totalHours - standardHours);

    // Get hall rate per hour (assuming pricePerHour exists in hall)
    const hall = state.halls.find((h) => selectedEvent.hallIds.includes(h.id));
    const hourlyRate = hall?.pricePerHour || 0;
    const overtimeCharges = extraHours * hourlyRate * (overtimeRate / 100);

    return { totalHours, extraHours, overtimeCharges };
  };

  const calculateTotals = () => {
    if (!selectedEvent) return { subtotal: 0, taxAmount: 0, totalAmount: 0 };

    const eventPackage = state.eventPackages.find(
      (p) => p.id === selectedEvent.packageId
    );
    const packageRate = eventPackage?.basePrice || 0;

    const addOnTotal = addOnServices.reduce((sum, s) => sum + s.totalPrice, 0);
    const { overtimeCharges } = calculateHours();

    const subtotal = packageRate + addOnTotal + overtimeCharges;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, totalAmount, packageRate, overtimeCharges };
  };

  const handleAddService = () => {
    const newService = {
      id: `addon-${Date.now()}`,
      name: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setAddOnServices([...addOnServices, newService]);
  };

  const handleRemoveService = (index: number) => {
    setAddOnServices(addOnServices.filter((_, i) => i !== index));
  };

  const handleServiceChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...addOnServices];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      updated[index].totalPrice =
        updated[index].quantity * updated[index].unitPrice;
    }

    setAddOnServices(updated);
  };

  const handleSubmit = () => {
    if (!selectedEvent) {
      alert("Please select an event");
      return;
    }

    const hall = state.halls.find((h) => selectedEvent.hallIds.includes(h.id));
    const eventPackage = state.eventPackages.find(
      (p) => p.id === selectedEvent.packageId
    );
    const { totalHours, extraHours, overtimeCharges } = calculateHours();
    const { subtotal, taxAmount, totalAmount, packageRate } = calculateTotals();

    const newInvoice: EventInvoice = {
      id: `evt-inv-${Date.now()}`,
      invoiceNumber: `EVTINV${Math.floor(1000 + Math.random() * 9000)}`,
      eventId: selectedEvent.id,
      eventReferenceNo: `EVT-${selectedEvent.id}`,
      eventName: selectedEvent.name,
      eventType: selectedEvent.type,
      organizerName: selectedEvent.organizerName,
      customerId: `CUS${Math.floor(100 + Math.random() * 900)}`,
      customerName: selectedEvent.organizerName,
      customerNIC: selectedEvent.identificationNumber,
      eventStartDateTime: selectedEvent.startDateTime,
      eventEndDateTime: selectedEvent.endDateTime,
      hallName: hall?.name || "N/A",
      attendees: selectedEvent.expectedAttendees,
      packageName: eventPackage?.name || "Custom Package",
      packageBasePrice: packageRate || 0,
      packageTaxRate: taxRate,
      includedServices: eventPackage?.includedServices || [],
      addOnServices: addOnServices,
      decorationType: decorationType,
      cateringRequirements: cateringRequirements,
      customRequirements: customRequirements,
      standardHours: standardHours,
      totalHours: totalHours,
      extraHours: extraHours,
      overtimeRate: overtimeRate,
      overtimeCharges: overtimeCharges,
      subtotal: subtotal,
      taxAmount: taxAmount,
      discountAmount: discountAmount,
      totalAmount: totalAmount,
      status: "Pending",
      staffResponsible: "current-user",
      dateIssued: new Date().toISOString().split("T")[0],
      dueDate: selectedEvent.startDateTime.split("T")[0],
      notes: notes,
      createdAt: new Date().toISOString(),
    };

    addEventInvoice(newInvoice);
    alert("Event invoice created successfully!");
    navigate("/invoicing/event-invoices");
  };

  const { subtotal, taxAmount, totalAmount, packageRate, overtimeCharges } =
    calculateTotals();
  const { totalHours, extraHours } = calculateHours();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Create Event Invoice"
        description="Generate invoice for event bookings"
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      {/* Event Selection */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Event</h2>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Event --</option>
            {state.events
              .filter((e) => e.status !== "cancelled")
              .map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {event.type} -{" "}
                  {new Date(event.startDateTime).toLocaleDateString()}
                </option>
              ))}
          </select>

          {selectedEvent && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Organizer:</span>{" "}
                  {selectedEvent.organizerName}
                </div>
                <div>
                  <span className="font-semibold">Attendees:</span>{" "}
                  {selectedEvent.expectedAttendees}
                </div>
                <div>
                  <span className="font-semibold">Start:</span>{" "}
                  {new Date(selectedEvent.startDateTime).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold">End:</span>{" "}
                  {new Date(selectedEvent.endDateTime).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {selectedEvent && (
        <>
          {/* Package & Hours */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Package & Hours Configuration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Standard Hours
                  </label>
                  <Input
                    type="number"
                    value={standardHours}
                    onChange={(e) => setStandardHours(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overtime Rate (%)
                  </label>
                  <Input
                    type="number"
                    value={overtimeRate}
                    onChange={(e) => setOvertimeRate(Number(e.target.value))}
                    min="100"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Hours:</span>
                    <p className="font-bold text-lg">{totalHours}h</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Extra Hours:</span>
                    <p className="font-bold text-lg text-orange-600">
                      {extraHours}h
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Overtime Charges:</span>
                    <p className="font-bold text-lg text-red-600">
                      LKR {(overtimeCharges || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Add-on Services */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Add-on Services
                </h2>
                <Button onClick={handleAddService} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>

              {addOnServices.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No add-on services. Click "Add Service" to include additional
                  services.
                </p>
              ) : (
                <div className="space-y-3">
                  {addOnServices.map((service, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Service Name
                        </label>
                        <Input
                          value={service.name}
                          onChange={(e) =>
                            handleServiceChange(index, "name", e.target.value)
                          }
                          placeholder="Service name"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qty
                        </label>
                        <Input
                          type="number"
                          value={service.quantity}
                          onChange={(e) =>
                            handleServiceChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                          min="1"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit Price
                        </label>
                        <Input
                          type="number"
                          value={service.unitPrice}
                          onChange={(e) =>
                            handleServiceChange(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                          min="0"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total
                        </label>
                        <Input
                          type="number"
                          value={service.totalPrice}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveService(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Custom Requirements */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Custom Requirements
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Decoration Type
                  </label>
                  <Input
                    value={decorationType}
                    onChange={(e) => setDecorationType(e.target.value)}
                    placeholder="e.g., Traditional, Modern, Minimalist"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catering Requirements
                  </label>
                  <textarea
                    value={cateringRequirements}
                    onChange={(e) => setCateringRequirements(e.target.value)}
                    placeholder="Describe catering requirements..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Custom Requirements
                  </label>
                  <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="Any other special requirements..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing Summary */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pricing Summary
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount
                    </label>
                    <Input
                      type="number"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(Number(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Package Base Price:</span>
                    <span className="font-semibold">
                      LKR {(packageRate || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Add-on Services:</span>
                    <span className="font-semibold">
                      LKR{" "}
                      {addOnServices
                        .reduce((sum, s) => sum + s.totalPrice, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-orange-700">
                    <span>Overtime Charges:</span>
                    <span className="font-semibold">
                      LKR {(overtimeCharges || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700 pt-2 border-t">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      LKR {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax ({taxRate}%):</span>
                    <span className="font-semibold">
                      LKR {taxAmount.toLocaleString()}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        - LKR {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-blue-600 pt-3 border-t">
                    <span>Total Amount:</span>
                    <span>LKR {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Event Invoice</Button>
          </div>
        </>
      )}
    </div>
  );
};
