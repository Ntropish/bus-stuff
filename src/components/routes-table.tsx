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

// Helper function to get human-readable route type names
const getRouteTypeName = (routeType: number): string => {
  const types: Record<number, string> = {
    0: "Tram/Streetcar/Light Rail",
    1: "Subway/Metro",
    2: "Rail",
    3: "Bus",
    4: "Ferry",
    5: "Cable Tram",
    6: "Aerial Lift",
    7: "Funicular",
    11: "Trolleybus",
    12: "Monorail",
  };
  return types[routeType] || `Unknown (${routeType})`;
};

// Define columns for the table
// Ensure 'size' is defined for each column for proper width calculation
export const columns: ColumnDef<Route>[] = [
  {
    accessorKey: "route_long_name",
    header: "Route Name",
    cell: ({ row }) => {
      const route = row.original;
      return (
        <a
          href={route.route_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: `#${route.route_color}`,
            color: `#${route.route_text_color}`,
            padding: "4px 8px",
            borderRadius: "4px",
            textDecoration: "none",
            display: "inline-block",
            border: `1px solid #${
              route.route_text_color === "FFFFFF"
                ? route.route_color
                : route.route_text_color === "000000"
                ? "rgba(0,0,0,0.2)"
                : route.route_text_color
            }`,
            lineHeight: "normal",
          }}
          className="hover:opacity-80 transition-opacity text-sm"
        >
          {route.route_long_name || route.route_short_name || "N/A"}
        </a>
      );
    },
    size: 280,
  },
  {
    accessorKey: "route_id",
    header: "Route ID",
    size: 100,
  },
  {
    accessorKey: "route_desc",
    header: "Description",
    size: 380,
  },
  {
    accessorKey: "route_type",
    header: "Type",
    cell: ({ row }) => getRouteTypeName(row.original.route_type),
    size: 200,
  },
  {
    accessorKey: "agency_id",
    header: "Agency ID",
    size: 100,
  },
  {
    accessorKey: "route_sort_order",
    header: "Sort Order",
    size: 100,
  },
];

interface RoutesTableProps {
  data: Route[];
  height?: string; // e.g., "600px", "70vh"
}

export function RoutesTable({ data, height = "600px" }: RoutesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true,
  });

  // This ref is for the single scrollable container that holds the entire table
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 52, // Crucial: Average height of a row in px.
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  const totalColumnWidth = useMemo(() => {
    return table.getCenterTotalSize();
  }, [table]);

  return (
    <div
      ref={scrollContainerRef} // The main scrolling container
      className="rounded-md border bg-card text-card-foreground shadow-sm overflow-auto" // Handles both vertical and horizontal scroll
      style={{
        height: height, // Fixed height for the scrollable area
        position: "relative", // Needed for sticky header to work within this container
      }}
    >
      {/* This inner div establishes the total virtual height and width for content */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${totalColumnWidth}px`,
          position: "relative",
        }}
      >
        <Table
          style={{
            width: "100%", // Takes full width of the height-setting div (i.e., totalColumnWidth)
            tableLayout: "fixed",
          }}
          className="border-collapse"
        >
          <TableHeader
            // Sticky header: stays at the top of the scrollContainerRef
            // Needs a background color to not be transparent when rows scroll underneath
            className="bg-card sticky top-0 z-10 border-b" // Using bg-card for theme consistency
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-0">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={cn(
                      "px-3 py-2.5 text-sm font-medium",
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualRows.map((virtualRow, virtualItemIndex) => {
              const row = rows[virtualRow.index];
              return (
                <TableRow
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                  className="hover:bg-muted/50 transition-colors data-[state=selected]:bg-muted"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${
                      virtualRow.start - virtualItemIndex * virtualRow.size
                    }px)`,
                    display: "flex",
                    width: "100%",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                      className="px-3 py-2.5 text-sm flex items-center"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
