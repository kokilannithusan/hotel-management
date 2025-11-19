import React, { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/layout/PageHeader";
import { Search, Printer, Download } from "lucide-react";

export const ReceiptsNew: React.FC = () => {
  const { paymentReceipts } = useInvoice();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReceipts = paymentReceipts.filter(
    (receipt) =>
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (receiptId: string) => {
    console.log("Print receipt:", receiptId);
    window.print();
  };

  const handleDownload = (receiptId: string) => {
    console.log("Download receipt:", receiptId);
    alert("Receipt PDF download will be implemented");
  };

  const totalReceiptAmount = paymentReceipts.reduce(
    (sum, r) => sum + r.amount,
    0
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Payment Receipts"
        description="View and manage payment receipts"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total Receipts</p>
            <p className="text-3xl font-bold text-gray-900">
              {paymentReceipts.length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Total Amount Collected</p>
            <p className="text-3xl font-bold text-green-600">
              LKR {totalReceiptAmount.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-1">Average Receipt Amount</p>
            <p className="text-3xl font-bold text-blue-600">
              LKR{" "}
              {paymentReceipts.length > 0
                ? Math.round(
                    totalReceiptAmount / paymentReceipts.length
                  ).toLocaleString()
                : 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by receipt number, customer name, or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Receipt No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No receipts found
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {receipt.customerName}
                        </div>
                        {receipt.customerEmail && (
                          <div className="text-sm text-gray-500">
                            {receipt.customerEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      LKR {receipt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💵 {receipt.currency || "LKR"}
                        </span>
                        {receipt.currency && receipt.currency !== "LKR" && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {receipt.currency} {(receipt.amount / (receipt.currencyRate || 1)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(receipt.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
