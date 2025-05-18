// src/components/RoutesTable.tsx
import React, { useRef, useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row as TableRowType, // Renamed to avoid conflict
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

// Assuming your shadcn Table components are correctly imported
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path if needed
import { cn } from "@/lib/utils"; // For shadcn class utility
import type { Route } from "@/data/routes";

const routeTypeMap: { [key: number]: string } = {
  0: "Light Rail",
  1: "Subway",
  2: "Rail",
  3: "Bus",
  4: "Ferry",
  5: "Cable Car",
  6: "Gondola",
  7: "Funicular",
};

interface RoutesTableProps {
  data: Route[];
}

function RoutesTable({ data }: RoutesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns = React.useMemo<Array<ColumnDef<Route>>>(
    () => [
      {
        accessorKey: "route_id",
        header: "ID",
        size: 80,
      },
      //   {
      //     accessorKey: "agency_id",
      //     header: "Agency ID",
      //     size: 100,
      //   },
      {
        accessorKey: "route_long_name",
        header: "Route Name",
        cell: (info) => (
          <div
            className="rounded-md p-1 px-2"
            style={{
              backgroundColor: `#${info.row.original.route_color}`,
              color: `#${info.row.original.route_text_color}`,
            }}
          >
            {info.getValue<string>()}
          </div>
        ),
        size: 260,
      },

      {
        accessorKey: "route_desc",
        header: "Description",
        cell: (info) => (
          <div className="text-ellipsis overflow-hidden">
            {info.getValue<string>()}
          </div>
        ),
        size: 350,
      },
      {
        accessorKey: "route_type",
        header: "Type",
        cell: (info) => routeTypeMap[info.getValue<number>()] || "Unknown",
        size: 120,
      },

      //   {
      //     accessorKey: "route_sort_order",
      //     header: "Sort Order",
      //     size: 100,
      //   },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true, // Optional: for development debugging
  });

  const { rows } = table.getRowModel();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Adjust based on your row height
    overscan: 20, // Render more items around the visible area
  });

  return (
    <div ref={parentRef} className="overflow-auto h-[400px]">
      {" "}
      {/* Ensure 'container' class provides necessary styles like overflow: auto and height */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        <table>
          <thead className="">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="sticky top-0 bg-background z-100"
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow, index) => {
              const row = rows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - index * virtualRow.size
                    }px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RoutesTable;
