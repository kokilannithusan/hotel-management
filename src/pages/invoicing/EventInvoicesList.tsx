import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEventInvoice } from "../../context/EventInvoiceContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Search, Eye, Printer, Receipt, FileText } from "lucide-react";

export const EventInvoicesList: React.FC = () => {
  const navigate = useNavigate();
  const { eventInvoices } = useEventInvoice();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter event invoices
  const filteredInvoices = useMemo(() => {
    return eventInvoices.filter((invoice: any) => {
      const searchLower = searchTerm.toLowerCase();

      // Search by invoice number, event ref, customer, NIC, passport, company reg
      const matchesSearch =
        !searchTerm ||
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.eventReferenceNo.toLowerCase().includes(searchLower) ||
        invoice.eventName.toLowerCase().includes(searchLower) ||
        invoice.customerName.toLowerCase().includes(searchLower) ||
        (invoice.customerNIC &&
          invoice.customerNIC.toLowerCase().includes(searchLower)) ||
        (invoice.customerPassport &&
          invoice.customerPassport.toLowerCase().includes(searchLower)) ||
        (invoice.customerCompanyRegNo &&
          invoice.customerCompanyRegNo.toLowerCase().includes(searchLower));

      // Filter by status
      const matchesStatus = !statusFilter || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [eventInvoices, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateInvoice = () => {
    navigate("/invoicing/event-invoices/create");
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoicing/event-invoices/${invoiceId}`);
  };

  const handlePrintInvoice = (invoiceNumber: string) => {
    console.log("Print invoice:", invoiceNumber);
    window.print();
  };

  const handleGenerateReceipt = (invoiceId: string) => {
    console.log("Generate receipt for invoice:", invoiceId);
    navigate(`/invoicing/receipts/create?eventInvoiceId=${invoiceId}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Invoices"
        description="Manage and track all event-related invoices"
        actions={
          <Button onClick={handleCreateInvoice}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event Invoice
          </Button>
        }
      />

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by invoice no, event ref, customer, NIC, passport, company ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Event Invoices Table */}
      <Card>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Ref No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Package
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="text-sm">No event invoices found</p>
                        <p className="text-xs mt-1">
                          {searchTerm || statusFilter
                            ? "Try adjusting your filters"
                            : "Create your first event invoice to get started"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedInvoices.map((invoice: any) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {invoice.eventReferenceNo}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[200px]">
                          <span
                            className="text-sm text-gray-900 truncate block"
                            title={invoice.eventName}
                          >
                            {invoice.eventName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {invoice.hallName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                          {invoice.eventType}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[150px]">
                          <span
                            className="text-sm text-gray-900 truncate block"
                            title={invoice.customerName}
                          >
                            {invoice.customerName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {invoice.attendees} attendees
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs">
                          <div className="text-gray-900">
                            {formatDateTime(invoice.eventStartDateTime)}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            LKR {invoice.packageBasePrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.packageName}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            LKR {invoice.totalAmount.toLocaleString()}
                          </div>
                          {invoice.overtimeCharges > 0 && (
                            <div className="text-xs text-orange-600">
                              +{invoice.extraHours}h overtime
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handlePrintInvoice(invoice.invoiceNumber)
                            }
                            className="text-gray-600 hover:text-gray-800"
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleGenerateReceipt(invoice.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Generate Receipt"
                          >
                            <Receipt className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}{" "}
                of {filteredInvoices.length} invoices
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
