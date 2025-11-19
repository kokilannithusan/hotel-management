import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/layout/PageHeader";
import { Search, Plus, Eye, Printer, Download } from "lucide-react";
import { Refund } from "../../types/entities";

export const RefundsNew: React.FC = () => {
  const navigate = useNavigate();
  const { refunds } = useInvoice();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState("");

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch =
      !searchTerm ||
      refund.refundNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (refund.reservationId &&
        refund.reservationId
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (refund.eventId &&
        refund.eventId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || refund.status === statusFilter;

    const matchesType =
      !referenceTypeFilter ||
      (referenceTypeFilter === "Reservation" && refund.reservationId) ||
      (referenceTypeFilter === "Event" && refund.eventId);

    return matchesSearch && matchesStatus && matchesType;
  });

  const handlePrint = (refundId: string) => {
    console.log("Print refund:", refundId);
    window.print();
  };

  const handleDownload = (refundId: string) => {
    console.log("Download refund PDF:", refundId);
    alert("PDF download will be implemented");
  };

  const getStatusColor = (status: Refund["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Refunds Management"
        description="Manage refunds for reservations and events"
        actions={
          <Button onClick={() => navigate("/invoicing/refunds/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Refund
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by refund no, customer, reference no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Status" },
              { value: "completed", label: "Processed" },
              { value: "pending", label: "Pending" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          <Select
            value={referenceTypeFilter}
            onChange={(e) => setReferenceTypeFilter(e.target.value)}
            options={[
              { value: "", label: "All Types" },
              { value: "Reservation", label: "Reservation" },
              { value: "Event", label: "Event" },
            ]}
          />
        </div>
      </div>

      {/* Refunds Table */}
      <Card>
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Refund ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Reference
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Invoice
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Currency
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase max-w-xs">
                    Reason
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No refunds found
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((refund) => (
                    <tr
                      key={refund.id}
                      className="hover:bg-gray-50 border-b border-gray-100"
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {refund.refundNumber}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                            {refund.reservationId ? "Reservation" : "Event"}
                          </span>
                          <p
                            className="text-gray-900 text-xs truncate max-w-[120px]"
                            title={refund.reservationId || refund.eventId}
                          >
                            {refund.reservationId || refund.eventId}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {refund.invoiceId || "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className="text-sm font-medium text-gray-900 max-w-[150px] truncate"
                          title={refund.customerName}
                        >
                          {refund.customerName}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
                        {refund.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 w-fit">
                            {refund.currency || "LKR"}
                          </span>
                          {refund.currency && refund.currency !== "LKR" && (
                            <p className="text-xs text-gray-500">
                              ≈
                              {(
                                refund.amount / (refund.currencyRate || 1)
                              ).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600">
                        <div
                          className="max-w-[200px] truncate"
                          title={refund.reason}
                        >
                          {refund.reason}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            refund.status
                          )}`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              navigate(`/invoicing/refunds/${refund.id}`)
                            }
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handlePrint(refund.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Print"
                          >
                            <Printer className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDownload(refund.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};
