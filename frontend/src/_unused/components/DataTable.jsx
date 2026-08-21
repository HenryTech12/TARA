import { useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

export function DataTable({ data, columns, onRowClick, rowClassName }) {
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-lg border border-[#2D3748]">
      <table className="w-full text-sm">
        <thead className="bg-[#1C2333]">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#4B5563] font-medium cursor-pointer select-none hover:text-[#F7F9FC] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ChevronUpIcon className="w-3 h-3" />}
                    {header.column.getIsSorted() === 'desc' && <ChevronDownIcon className="w-3 h-3" />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[#2D3748]">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={cn(
                'bg-[#111827] transition-colors',
                onRowClick && 'cursor-pointer hover:bg-[#1C2333]',
                rowClassName?.(row.original)
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-[#94A3B8]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <div className="py-12 text-center text-[#4B5563] text-sm">No records found</div>
      )}
    </div>
  )
}
