import React from 'react';
import { StatusBadge } from './StatusBadge';
import { ChevronRight } from 'lucide-react';

export const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No records found.' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-500">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className="py-3 px-4">
                  {col.header}
                </th>
              ))}
              {onRowClick && <th className="py-3 px-4 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 hover:bg-slate-50/80 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="py-3.5 px-4 font-medium text-slate-800">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                {onRowClick && (
                  <td className="py-3.5 px-4 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
