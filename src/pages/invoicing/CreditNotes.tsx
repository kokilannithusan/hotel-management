import React, { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/layout/PageHeader";
import { Plus, FileText } from "lucide-react";
import { CreditNote } from "../../types/entities";

export const CreditNotes: React.FC = () => {
  const { creditNotes, invoices, addCreditNote } = useInvoice();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: "",
    reason: "",
    reasonCategory: "billing_error",
    creditAmount: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedInvoice = invoices.find(
      (inv) => inv.id === formData.invoiceId
    );
    if (!selectedInvoice) {
      alert("Please select an invoice");
      return;
    }

    const creditNote: CreditNote = {
      id: `cn${Date.now()}`,
      creditNoteNumber: `CN${1000 + Math.floor(Math.random() * 9000)}`,
      invoiceId: formData.invoiceId,
      invoiceNumber: selectedInvoice.invoiceId,
      customerId: selectedInvoice.guest.id,
      customerName: selectedInvoice.guest.name,
      reason: formData.reason,
      reasonCategory: formData.reasonCategory as any,
      originalAmount: selectedInvoice.chargeBreakdown.grandTotal,
      creditAmount: formData.creditAmount,
      status: "issued",
      issuedDate: new Date().toISOString().split("T")[0],
      issuedBy: "current-user",
      notes: formData.notes,
    };

    addCreditNote(creditNote);
    setShowModal(false);
    setFormData({
      invoiceId: "",
      reason: "",
      reasonCategory: "billing_error",
      creditAmount: 0,
      notes: "",
    });
    alert("Credit note created successfully!");
  };

  const getStatusColor = (status: CreditNote["status"]) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      issued: "bg-blue-100 text-blue-800",
      applied: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      void: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const totalCreditAmount = creditNotes.reduce(
    (sum, cn) => sum + cn.creditAmount,
    0
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Credit Notes"
        description="Manage credit notes for refunds and adjustments"
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Credit Note
          </Button>
        }
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total Credit Notes</p>
            <p className="text-3xl font-bold text-gray-900">
              {creditNotes.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total Credit Amount</p>
            <p className="text-3xl font-bold text-red-600">
              LKR {totalCreditAmount.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Issued</p>
            <p className="text-3xl font-bold text-blue-600">
              {creditNotes.filter((cn) => cn.status === "issued").length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Applied</p>
            <p className="text-3xl font-bold text-green-600">
              {creditNotes.filter((cn) => cn.status === "applied").length}
            </p>
          </div>
        </Card>
      </div>

      {/* Credit Notes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credit Note No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credit Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Issued Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditNotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No credit notes found</p>
                  </td>
                </tr>
              ) : (
                creditNotes.map((creditNote) => (
                  <tr key={creditNote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {creditNote.creditNoteNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditNote.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {creditNote.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      <div>
                        <p className="font-medium">{creditNote.reason}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {creditNote.reasonCategory.replace("_", " ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      LKR {creditNote.creditAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          creditNote.status
                        )}`}
                      >
                        {creditNote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(creditNote.issuedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Credit Note Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Credit Note"
        >
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Select Invoice"
                value={formData.invoiceId}
                onChange={(e) => {
                  setFormData({ ...formData, invoiceId: e.target.value });
                  const invoice = invoices.find(
                    (inv) => inv.id === e.target.value
                  );
                  if (invoice) {
                    setFormData((prev) => ({
                      ...prev,
                      invoiceId: e.target.value,
                      creditAmount: invoice.chargeBreakdown.grandTotal,
                    }));
                  }
                }}
                options={[
                  { value: "", label: "Select an invoice" },
                  ...invoices.map((inv) => ({
                    value: inv.id,
                    label: `${inv.invoiceId} - ${
                      inv.guest.name
                    } - LKR ${inv.chargeBreakdown.grandTotal.toLocaleString()}`,
                  })),
                ]}
              />

              <Select
                label="Reason Category"
                value={formData.reasonCategory}
                onChange={(e) =>
                  setFormData({ ...formData, reasonCategory: e.target.value })
                }
                options={[
                  { value: "billing_error", label: "Billing Error" },
                  { value: "service_issue", label: "Service Issue" },
                  { value: "cancellation", label: "Cancellation" },
                  { value: "goodwill", label: "Goodwill" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Input
                label="Reason"
                type="text"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Enter reason for credit note"
                required
              />

              <Input
                label="Credit Amount (LKR)"
                type="number"
                value={formData.creditAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditAmount: Number(e.target.value),
                  })
                }
                required
              />

              <Input
                label="Notes"
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes (optional)"
              />

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Create Credit Note
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
