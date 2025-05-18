import { z } from "zod";
import { parse } from 'csv-parse/browser/esm/sync';
import routesFileStringContent from "../gtfs/routes.txt" with { type: "text" };

export const RouteSchema = z.object({
    route_id: z.string().min(1, "route_id is required and cannot be empty"),
    agency_id: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : String(val).trim()),
      z.string().optional()
    ),
    route_short_name: z.string(), // GTFS spec: Required. Allows empty string.
    route_long_name: z.string(),  // GTFS spec: Required. Allows empty string.
    route_desc: z.string(),       // GTFS spec: Optional. Allows empty string.
    route_type: z.coerce.number(), // GTFS spec: Required. Coerce string from CSV to number.
    route_url: z.string().trim().url().or(z.literal('')).optional(),
    route_color: z.string()
      .trim()
      .toUpperCase()
      .refine(val => val === '' || /^[0-9A-F]{6}$/.test(val), {
        message: "route_color must be empty or a 6-digit hex string (e.g., 00FF00) without '#'",
      }).optional(),
    route_text_color: z.string()
      .trim()
      .toUpperCase()
      .refine(val => val === '' || /^[0-9A-F]{6}$/.test(val), {
        message: "route_text_color must be empty or a 6-digit hex string (e.g., FFFFFF) without '#'",
      }).optional(),
    route_sort_order: z.preprocess(
      (val) => {
        const strVal = String(val).trim();
        return (strVal === "" || val === null || val === undefined ? undefined : Number(strVal));
      },
      z.number().int().min(0).optional()
    ),
  });
  
  export type Route = z.infer<typeof RouteSchema>;
  
  // 4. Define a structure for the processed data result
  export interface ProcessedStaticData<T> {
    data: T[];
    errors: { record?: any; rawInput?: string; errorDetails: z.ZodError | string }[];
    success: boolean;
    sourceDescription: string;
  }
  
  // 5. Synchronously parse and validate the data when this module is loaded
  function processEmbeddedRoutesData(): ProcessedStaticData<Route> {
    const loadedRoutes: Route[] = [];
    const processingErrors: ProcessedStaticData<Route>['errors'] = [];
    const sourceDescription = "Embedded routes.txt content";
  
    if (typeof routesFileStringContent !== 'string' || routesFileStringContent.trim() === '') {
      console.error("[data.ts] Embedded routes CSV string is invalid, empty, or not loaded by the bundler.");
      return {
        data: [],
        errors: [{ errorDetails: "Embedded CSV data not found or empty." }],
        success: false,
        sourceDescription,
      };
    }
  
    try {
      // Parse the CSV string
      const records: any[] = parse(routesFileStringContent, {
        columns: true, // Use the first row as header names
        skip_empty_lines: true,
        trim: true,
        delimiter: ',', // Ensure this matches your CSV file's delimiter
      });

  
      // Validate each record with Zod
      for (const record of records) {
        const validationResult = RouteSchema.safeParse(record);
        if (validationResult.success) {
          loadedRoutes.push(validationResult.data);
        } else {
          processingErrors.push({ record, errorDetails: validationResult.error });
        }
      }
  
      if (processingErrors.length > 0) {
        console.warn(`[data.ts] ${processingErrors.length} validation errors while processing embedded routes data. See details in exported 'routesData.errors'.`);
      } else {
        console.log(`[data.ts] Successfully processed ${loadedRoutes.length} routes from embedded data.`);
      }
      return {
        data: loadedRoutes,
        errors: processingErrors,
        success: true,
        sourceDescription,
      };
  
    } catch (e: any) {
      console.error("[data.ts] Critical error parsing embedded CSV string:", e.message);
      return {
        data: [],
        errors: [{ rawInput: routesFileStringContent.substring(0, 500), errorDetails: `CSV parsing failed: ${e.message}` }],
        success: false,
        sourceDescription,
      };
    }
  }
  
  // Process the data immediately when this module is imported by your SPA
  export const routesData: ProcessedStaticData<Route> = processEmbeddedRoutesData();