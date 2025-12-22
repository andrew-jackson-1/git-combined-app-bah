"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table2, Database, FolderOpen, FileText } from "lucide-react";

// Mock data structure
interface Column {
  name: string;
  type: string;
}

interface Table {
  name: string;
  type: "table" | "view";
  owner: string;
  storage: string;
  columns: Column[];
}

interface Schema {
  name: string;
  tables: Table[];
}

interface Catalog {
  name: string;
  schemas: Schema[];
}

const mockData: Catalog[] = [
  {
    name: "main",
    schemas: [
      {
        name: "gold_sales",
        tables: [
          {
            name: "fact_sales transactions",
            type: "table",
            owner: "data_team",
            storage: "ss://data-lake/main/gold_sales/fact_sales_transactions",
            columns: [
              { name: "transaction_id", type: "INT" },
              { name: "customer", type: "STRING" },
              { name: "quantity", type: "INT" },
              { name: "price", type: "DECIMAL(10,2)" },
              { name: "transaction_date", type: "DATE" },
            ],
          },
        ],
      },
      {
        name: "silver_inventory",
        tables: [
          {
            name: "inventory_items",
            type: "table",
            owner: "data_team",
            storage: "ss://data-lake/main/silver_inventory/inventory_items",
            columns: [
              { name: "item_id", type: "INT" },
              { name: "item_name", type: "STRING" },
              { name: "stock_quantity", type: "INT" },
            ],
          },
          {
            name: "inventory_history",
            type: "view",
            owner: "data_team",
            storage: "ss://data-lake/main/silver_inventory/inventory_history",
            columns: [
              { name: "history_id", type: "INT" },
              { name: "item_id", type: "INT" },
              { name: "change_date", type: "DATE" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "analytics",
    schemas: [
      {
        name: "reports",
        tables: [
          {
            name: "daily_summary",
            type: "table",
            owner: "analytics_team",
            storage: "ss://data-lake/analytics/reports/daily_summary",
            columns: [
              { name: "date", type: "DATE" },
              { name: "total_revenue", type: "DECIMAL(12,2)" },
              { name: "total_transactions", type: "INT" },
            ],
          },
        ],
      },
    ],
  },
];

interface DataExplorerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataExplorer({ open, onOpenChange }: DataExplorerProps) {
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [schemaFilter, setSchemaFilter] = useState("");

  // Get selected catalog data
  const selectedCatalogData = useMemo(
    () => mockData.find((catalog) => catalog.name === selectedCatalog),
    [selectedCatalog]
  );

  // Get filtered schemas
  const filteredSchemas = useMemo(() => {
    if (!selectedCatalogData) return [];
    if (!schemaFilter.trim()) return selectedCatalogData.schemas;
    return selectedCatalogData.schemas.filter((schema) =>
      schema.name.toLowerCase().includes(schemaFilter.toLowerCase())
    );
  }, [selectedCatalogData, schemaFilter]);

  // Get selected schema data
  const selectedSchemaData = useMemo(
    () =>
      selectedCatalogData?.schemas.find(
        (schema) => schema.name === selectedSchema
      ),
    [selectedCatalogData, selectedSchema]
  );

  // Get selected table data
  const selectedTableData = useMemo(
    () =>
      selectedSchemaData?.tables.find((table) => table.name === selectedTable),
    [selectedSchemaData, selectedTable]
  );

  // Handle catalog selection
  const handleCatalogSelect = (catalogName: string) => {
    setSelectedCatalog(catalogName);
    setSelectedSchema(null);
    setSelectedTable(null);
  };

  // Handle schema selection
  const handleSchemaSelect = (schemaName: string) => {
    setSelectedSchema(schemaName);
    setSelectedTable(null);
  };

  // Handle table selection
  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-full h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Explorer</DialogTitle>
        </DialogHeader>

        <div className="flex flex-row flex-1 overflow-hidden divide-x divide-border">
          {/* Column 1: Catalogs */}
          <div className="w-[250px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Database className="h-4 w-4" />
                Catalogs
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {mockData.map((catalog) => (
                  <div
                    key={catalog.name}
                    onClick={() => handleCatalogSelect(catalog.name)}
                    className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                      selectedCatalog === catalog.name
                        ? "bg-blue-100/50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span className="text-sm">{catalog.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Column 2: Schemas */}
          <div className="w-[250px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <FolderOpen className="h-4 w-4" />
                Schemas
              </div>
              <Input
                placeholder="Filter schemas..."
                value={schemaFilter}
                onChange={(e) => setSchemaFilter(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredSchemas.length > 0 ? (
                  filteredSchemas.map((schema) => (
                    <div
                      key={schema.name}
                      onClick={() => handleSchemaSelect(schema.name)}
                      className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        selectedSchema === schema.name
                          ? "bg-blue-100/50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm">{schema.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No schemas found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 3: Tables */}
          <div className="w-[280px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Table2 className="h-4 w-4" />
                Tables & Views
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {selectedSchemaData?.tables.length ? (
                  selectedSchemaData.tables.map((table) => (
                    <div
                      key={table.name}
                      onClick={() => handleTableSelect(table.name)}
                      className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        selectedTable === table.name
                          ? "bg-blue-100/50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {table.type === "view" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Table2 className="h-4 w-4" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm">{table.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {table.type === "view" ? "View" : "Table"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No tables available
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Column 4: Inspector/Columns */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedTableData ? (
              <>
                <div className="px-6 py-4 border-b bg-muted/30">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {selectedTableData.name}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div>Owner: {selectedTableData.owner}</div>
                      <div className="truncate">
                        Storage: {selectedTableData.storage}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-b">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sample Data
                  </Button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="px-6 py-4 border-b bg-muted/30">
                    <h4 className="text-sm font-medium">Columns</h4>
                  </div>
                  <ScrollArea className="h-full">
                    <div className="px-6 py-4 space-y-3">
                      {selectedTableData.columns.map((column, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm font-medium min-w-[200px]">
                            {column.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          >
                            {column.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">Select a table to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

