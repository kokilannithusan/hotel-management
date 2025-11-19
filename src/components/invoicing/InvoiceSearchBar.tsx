import React from "react";
import { Input } from "../ui/Input";
import { Search } from "lucide-react";

interface InvoiceSearchBarProps {
  filters: {
    referenceNo: string;
    nic: string;
    passport: string;
    status: string;
    referenceType: string;
    dateFrom: string;
    dateTo: string;
  };
  onFilterChange: (filterName: string, value: string) => void;
}

export const InvoiceSearchBar: React.FC<InvoiceSearchBarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reference Number Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference No.
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by reference..."
              value={filters.referenceNo}
              onChange={(e) => onFilterChange("referenceNo", e.target.value)}
              className="pl-10"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* NIC Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIC
          </label>
          <Input
            type="text"
            placeholder="Search by NIC..."
            value={filters.nic}
            onChange={(e) => onFilterChange("nic", e.target.value)}
          />
        </div>

        {/* Passport Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport
          </label>
          <Input
            type="text"
            placeholder="Search by passport..."
            value={filters.passport}
            onChange={(e) => onFilterChange("passport", e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange("status", e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Reference Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.referenceType}
            onChange={(e) => onFilterChange("referenceType", e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Reservation">Reservation</option>
            <option value="Event">Event</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
          />
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              onFilterChange("referenceNo", "");
              onFilterChange("nic", "");
              onFilterChange("passport", "");
              onFilterChange("status", "");
              onFilterChange("referenceType", "");
              onFilterChange("dateFrom", "");
              onFilterChange("dateTo", "");
            }}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
