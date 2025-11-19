import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "../../context/InvoiceContext";
import { InvoiceTable } from "../../components/invoicing/InvoiceTable";
import { InvoiceSearchBar } from "../../components/invoicing/InvoiceSearchBar";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/layout/PageHeader";
import { Download } from "lucide-react";
import { Invoice } from "../../types/entities";

export const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters, getFilteredInvoices } = useInvoice();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters({ [filterName]: value });
    setCurrentPage(1);
  };

  const handleView = (invoice: Invoice) => {
    navigate(`/invoicing/invoices/${invoice.id}`);
  };

  const handlePrint = (invoice: Invoice) => {
    window.print();
    console.log("Print invoice:", invoice.invoiceId);
  };

  const handleDownload = (invoice: Invoice) => {
    console.log("Download PDF:", invoice.invoiceId);
    alert("PDF download functionality will be implemented");
  };

  const handleExportAll = () => {
    console.log("Export all invoices");
    alert("Export functionality will be implemented");
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Invoices"
        description="Manage room and event invoices"
        actions={
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        }
      />

      {/* Search and Filter */}
      <InvoiceSearchBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Invoice Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <InvoiceTable
          invoices={paginatedInvoices}
          onView={handleView}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of{" "}
              {filteredInvoices.length} invoices
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
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
        )}
      </div>
    </div>
  );
};
