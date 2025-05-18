// src/components/RoutesTable.tsx
import React, { useRef } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row as TableRowType, // Renamed to avoid conflict with shadcn TableRow
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Your shadcn table components
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
            padding: "3px 8px",
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
          }}
          className="hover:opacity-80 transition-opacity"
        >
          {route.route_long_name || route.route_short_name || "N/A"}
        </a>
      );
    },
    size: 250, // Example fixed size
  },
  {
    accessorKey: "route_id",
    header: "Route ID",
    size: 100,
  },
  {
    accessorKey: "route_desc",
    header: "Description",
    size: 400,
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
];

interface RoutesTableProps {
  data: Route[];
  height?: string; // Allow dynamic height for the scroll container
}

export function RoutesTable({ data, height = "600px" }: RoutesTableProps) {
  console.log(data);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52, // Estimate row height (in px). Adjust based on your cell padding and content.
    overscan: 10, // Number of items to render outside the visible area
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  return (
    <div
      ref={tableContainerRef}
      className="rounded-md border" // shadcn classes for border and rounded corners
      style={{
        overflow: "auto", // Enable scrolling
        height: height, // Set the container height
      }}
    >
      <Table style={{ width: "100%" }}>
        {" "}
        {/* Ensure table takes full width of container */}
        <TableHeader
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            backgroundColor: "hsl(var(--background))", // Use shadcn background variable
          }}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.getSize(), // Use column defined size
                    minWidth: header.getSize(), // Ensure minWidth
                    maxWidth: header.getSize(), // Prevent exceeding size for fixed layout
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          style={{
            height: `${totalSize}px`, // Set height for virtualizer
            position: "relative", // Needed for absolute positioning of rows
            width: "100%",
          }}
        >
          {paddingTop > 0 && (
            <TableRow style={{ height: `${paddingTop}px` }}>
              <TableCell colSpan={columns.length} />
            </TableRow>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index] as TableRowType<Route>;
            return (
              <TableRow
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => rowVirtualizer.measureElement(node)}
                style={{
                  display: "flex", // Use flex for row layout
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(), // Use column defined size
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                      display: "flex",
                      alignItems: "center", // Vertically align content in cell
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <TableRow style={{ height: `${paddingBottom}px` }}>
              <TableCell colSpan={columns.length} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
