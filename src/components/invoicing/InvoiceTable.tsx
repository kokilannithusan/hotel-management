import React from "react";
import { Invoice } from "../../types/entities";
import { Button } from "../ui/Button";
import { Eye, Printer, Download } from "lucide-react";

interface InvoiceTableProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onView,
  onPrint,
  onDownload,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Unpaid":
      case "Pending":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold text-gray-700">
              Invoice #
            </th>
            <th className="text-left p-3 font-semibold text-gray-700">
              Reference
            </th>
            <th className="text-left p-3 font-semibold text-gray-700">
              Customer
            </th>
            <th className="text-left p-3 font-semibold text-gray-700">Type</th>
            <th className="text-left p-3 font-semibold text-gray-700">Date</th>
            <th className="text-right p-3 font-semibold text-gray-700">
              Amount
            </th>
            <th className="text-center p-3 font-semibold text-gray-700">
              Status
            </th>
            <th className="text-center p-3 font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-900">
                {invoice.invoiceId}
              </td>
              <td className="p-3 text-gray-700">
                {invoice.guest.reference.refNo}
              </td>
              <td className="p-3 text-gray-700">{invoice.guest.name}</td>
              <td className="p-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {invoice.referenceType}
                </span>
              </td>
              <td className="p-3 text-gray-700">{invoice.generatedDate}</td>
              <td className="p-3 text-right font-medium text-gray-900">
                ${invoice.chargeBreakdown.grandTotal.toFixed(2)}
              </td>
              <td className="p-3 text-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </td>
              <td className="p-3">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(invoice)}
                    title="View Invoice"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPrint(invoice)}
                    title="Print Invoice"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(invoice)}
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
