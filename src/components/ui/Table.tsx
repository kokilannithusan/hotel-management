import React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index?: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: TableProps<T>) {
  // For mobile view - card layout
  const renderCardView = () => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="text-5xl">📭</div>
          <p className="font-medium text-slate-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 md:hidden">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => onRowClick?.(item)}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 ${
              onRowClick
                ? "cursor-pointer hover:border-blue-400 hover:shadow-lg hover:scale-102"
                : ""
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {column.header}
                  </span>
                  <span className="text-sm text-slate-900">
                    {column.render
                      ? column.render(item, index)
                      : item[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // For desktop view - enhanced table
  const renderTableView = () => {
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="text-5xl">📭</div>
              <p className="font-medium text-slate-500">{emptyMessage}</p>
            </div>
          </td>
        </tr>
      );
    }

    return data.map((item, index) => (
      <tr
        key={index}
        onClick={() => onRowClick?.(item)}
        className={`transition-all duration-300 border-b border-slate-100 group ${
          onRowClick
            ? "cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-cyan-50/40 hover:shadow-md hover:border-blue-200"
            : "hover:bg-slate-50/50"
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {columns.map((column) => (
          <td
            key={column.key}
            className={`px-6 py-5 align-top text-sm text-slate-700 transition-colors duration-200 group-hover:text-slate-900 ${
              column.cellClassName ?? "whitespace-nowrap"
            }`}
          >
            {column.render ? column.render(item, index) : item[column.key]}
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <>
      {/* Mobile Card View */}
      {renderCardView()}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-50 border-b-2 border-slate-300 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-widest transition-colors duration-200 ${
                    column.headerClassName ?? ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {renderTableView()}
          </tbody>
        </table>
      </div>
    </>
  );
}
