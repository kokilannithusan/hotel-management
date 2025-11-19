import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Select";
import { PageHeader } from "../../components/layout/PageHeader";
import { Search, Plus, Eye, Printer, Download } from "lucide-react";
export const ReceiptsList: React.FC = () => {
  const navigate = useNavigate();
  const { paymentReceipts, invoices } = useInvoice();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enhanced filtering
  const filteredReceipts = paymentReceipts.filter((receipt) => {
    const invoice = invoices.find((inv) => inv.id === receipt.invoiceId);
    const refNo = invoice?.guest.reference.refNo || receipt.invoiceId || "";
    const nic = invoice?.guest.nic || "";
    const passport = invoice?.guest.passportNo || "";

    const matchesSearch =
      !searchTerm ||
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport.toLowerCase().includes(searchTerm.toLowerCase());

    // For now, all receipts are "Completed" since they're generated on payment
    const matchesStatus = !statusFilter || statusFilter === "Completed";

    const matchesRefType =
      !referenceTypeFilter ||
      (invoice &&
        invoice.guest.reference.type.toLowerCase() ===
          referenceTypeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesRefType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrint = (receiptId: string) => {
    console.log("Print receipt:", receiptId);
    window.print();
  };

  const handleDownload = (receiptId: string) => {
    console.log("Download receipt PDF:", receiptId);
    alert("PDF download will be implemented");
  };

  const getStatusBadge = (_status: string) => {
    return "bg-green-100 text-green-800"; // All receipts are completed
  };

  return (
    <div className="p-6 max-w-full">
      <PageHeader
        title="Payment Receipts"
        description="View and manage all payment receipts"
        actions={
          <Button onClick={() => navigate("/invoicing/receipts/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Receipt
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
              placeholder="Search by receipt no, customer, reference no, NIC, passport..."
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
              { value: "Completed", label: "Completed" },
              { value: "Pending", label: "Pending" },
            ]}
          />

          <Select
            value={referenceTypeFilter}
            onChange={(e) => setReferenceTypeFilter(e.target.value)}
            options={[
              { value: "", label: "All Reference Types" },
              { value: "Reservation", label: "Reservation" },
              { value: "Event", label: "Event" },
            ]}
          />
        </div>
      </div>

      {/* Receipts Table */}
      <Card>
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Receipt ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Linked Invoice
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    Reference
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
                {paginatedReceipts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No receipts found
                    </td>
                  </tr>
                ) : (
                  paginatedReceipts.map((receipt) => {
                    const invoice = invoices.find(
                      (inv) => inv.id === receipt.invoiceId
                    );
                    const referenceType = invoice?.guest.reference.type || "-";
                    const referenceNo = invoice?.guest.reference.refNo || "-";

                    return (
                      <tr
                        key={receipt.id}
                        className="hover:bg-gray-50 border-b border-gray-100"
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {receipt.receiptNumber}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-blue-600">
                          {receipt.invoiceNumber}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                              {referenceType}
                            </span>
                            <p className="text-gray-900 text-xs">
                              {referenceNo}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {receipt.customerName}
                            </span>
                            {receipt.customerEmail && (
                              <span className="text-xs text-gray-500">
                                {receipt.customerEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                          {receipt.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 w-fit">
                              💵 {receipt.currency || "LKR"}
                            </span>
                            {receipt.currency && receipt.currency !== "LKR" && (
                              <p className="text-xs text-gray-500">
                                ≈{" "}
                                {(
                                  receipt.amount / (receipt.currencyRate || 1)
                                ).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              "Completed"
                            )}`}
                          >
                            Completed
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(receipt.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                navigate(`/invoicing/receipts/${receipt.id}`)
                              }
                              className="p-1 hover:bg-gray-100 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handlePrint(receipt.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Print"
                            >
                              <Printer className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDownload(receipt.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredReceipts.length)} of{" "}
            {filteredReceipts.length} receipts
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
