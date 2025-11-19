import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Search, FileText, Eye, Printer, Download } from "lucide-react";
import { CreditNote } from "../../types/entities";

export const CreditNotesList: React.FC = () => {
  const navigate = useNavigate();
  const { creditNotes, invoices } = useInvoice();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get invoice details helper
  const getInvoiceDetails = (invoiceId: string) => {
    return invoices.find((inv) => inv.id === invoiceId);
  };

  // Filter and search credit notes
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      const invoice = getInvoiceDetails(cn.invoiceId);
      if (!invoice) return false;

      const searchLower = searchTerm.toLowerCase();

      // Search by credit note number, customer name, reference no, NIC, passport
      const matchesSearch =
        !searchTerm ||
        cn.creditNoteNumber.toLowerCase().includes(searchLower) ||
        cn.customerName.toLowerCase().includes(searchLower) ||
        invoice.guest.reference.refNo.toLowerCase().includes(searchLower) ||
        (invoice.guest.nic &&
          invoice.guest.nic.toLowerCase().includes(searchLower)) ||
        (invoice.guest.passportNo &&
          invoice.guest.passportNo.toLowerCase().includes(searchLower));

      // Filter by status
      const matchesStatus = !statusFilter || cn.status === statusFilter;

      // Filter by reference type
      const matchesReferenceType =
        !referenceTypeFilter || invoice.referenceType === referenceTypeFilter;

      return matchesSearch && matchesStatus && matchesReferenceType;
    });
  }, [creditNotes, invoices, searchTerm, statusFilter, referenceTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage);
  const paginatedCreditNotes = filteredCreditNotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateCreditNote = () => {
    navigate("/invoicing/credit-notes/create");
  };

  const handleViewCreditNote = (creditNoteId: string) => {
    navigate(`/invoicing/credit-notes/${creditNoteId}`);
  };

  const handlePrintCreditNote = (creditNote: CreditNote) => {
    console.log("Print credit note:", creditNote.creditNoteNumber);
    // Implement print functionality
    window.print();
  };

  const handleDownloadPDF = (creditNote: CreditNote) => {
    console.log("Download PDF for credit note:", creditNote.creditNoteNumber);
    // Implement PDF download functionality
    alert(
      `PDF download for ${creditNote.creditNoteNumber} will be implemented`
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReasonCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      service_issue: "Service Issue",
      billing_error: "Billing Error",
      cancellation: "Cancellation",
      goodwill: "Goodwill",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        description="Manage and track all credit notes"
        actions={
          <Button onClick={handleCreateCreditNote}>
            <Plus className="w-4 h-4 mr-2" />
            Create Credit Note
          </Button>
        }
      />

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by credit note no, customer, reference no, NIC, passport..."
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
              <option value="issued">Issued</option>
              <option value="pending">Pending</option>
              <option value="applied">Applied</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={referenceTypeFilter}
              onChange={(e) => setReferenceTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Reference Types</option>
              <option value="Reservation">Reservation</option>
              <option value="Event">Event</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Credit Notes Table */}
      <Card>
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Note ID
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Invoice
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCreditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="text-sm">No credit notes found</p>
                        <p className="text-xs mt-1">
                          {searchTerm || statusFilter || referenceTypeFilter
                            ? "Try adjusting your filters"
                            : "Create your first credit note to get started"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCreditNotes.map((creditNote) => {
                    const invoice = getInvoiceDetails(creditNote.invoiceId);
                    if (!invoice) return null;

                    return (
                      <tr
                        key={creditNote.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">
                            {creditNote.creditNoteNumber}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {creditNote.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium max-w-max ${
                                invoice.referenceType === "Reservation"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {invoice.referenceType}
                            </span>
                            <span className="text-xs text-gray-600 mt-1">
                              {invoice.guest.reference.refNo}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col max-w-[150px]">
                            <span
                              className="text-sm text-gray-900 truncate"
                              title={creditNote.customerName}
                            >
                              {creditNote.customerName}
                            </span>
                            {invoice.guest.nic && (
                              <span className="text-xs text-gray-500 truncate">
                                NIC: {invoice.guest.nic}
                              </span>
                            )}
                            {invoice.guest.passportNo && (
                              <span className="text-xs text-gray-500 truncate">
                                Passport: {invoice.guest.passportNo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            LKR {creditNote.originalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            LKR {creditNote.creditAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col max-w-[200px]">
                            <span className="text-xs font-medium text-gray-700">
                              {getReasonCategoryLabel(
                                creditNote.reasonCategory
                              )}
                            </span>
                            <span
                              className="text-xs text-gray-600 truncate"
                              title={creditNote.reason}
                            >
                              {creditNote.reason}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                              creditNote.status
                            )}`}
                          >
                            {creditNote.status.charAt(0).toUpperCase() +
                              creditNote.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {new Date(
                              creditNote.issuedDate
                            ).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleViewCreditNote(creditNote.id)
                              }
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrintCreditNote(creditNote)}
                              className="text-gray-600 hover:text-gray-800"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(creditNote)}
                              className="text-green-600 hover:text-green-800"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredCreditNotes.length
                )}{" "}
                of {filteredCreditNotes.length} credit notes
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
