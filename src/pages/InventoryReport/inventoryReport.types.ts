// =====================================================================
// 📦 Types - تقرير المخزون والتوزيع
// =====================================================================

export interface InventoryReportFilter {
  CategoryId?: number | null;
  AssetTypeId?: number | null;
  AssetModelId?: number | null;
  Brand?: string;
  ModelType?: "All" | "Lot" | "RFID";
  StockStatus?: "All" | "Available" | "Low" | "OutOfStock";
  OnlyWithIssues?: boolean | null;
  SearchTerm?: string;
}

export interface InventoryReportSummary {
  TotalModels: number;
  LotModels: number;
  RfidModels: number;
  TotalAssets: number;
  InWarehouse: number;
  InCamps: number;
  NewInWarehouse: number;
  DamagedInWarehouse: number;
  UsedInWarehouse: number;
  IntegrityIssuesCount: number;
}

export interface ModelInventoryRow {
  AssetModelId: number;
  ModelName: string;
  ModelNumber: string;
  Brand: string;
  ModelCode: string;
  TagType: string;
  IsLot: boolean;
  ModelType: "Lot" | "RFID";

  AssetTypeId: number;
  AssetTypeName: string;
  CategoryId: number;
  CategoryName: string;

  TotalCount: number;
  RemainingInWarehouse: number;
  NewCount: number;
  DamagedCount: number;
  UsedCount: number;

  TotalDispatchedReceived: number;
  TotalReturnedReceived: number;
  TotalReturnedGood: number;
  TotalReturnedDamaged: number;
  PendingDispatch: number;
  PendingReturn: number;

  CurrentlyInCamps: number;
  ActualAssetsCount: number;

  StockStatus: "Available" | "Low" | "OutOfStock";
  HasIntegrityIssue: boolean;
  IntegrityIssues: string[];

  LastMovementDate?: string | null;
  LastMovementType?: "Dispatch" | "Return" | null;
  LastMovementOrderNo?: string | null;
}

export interface MovementRecord {
  OrderId: number;
  OrderNumber: string;
  OrderDate?: string | null;
  ReceivedDate?: string | null;
  Status: string;
  RequestedQuantity: number;
  ReceivedQuantity: number;
  ReceivedGood?: number | null;
  ReceivedDamaged?: number | null;
  ReturnReason?: string | null;
  Camps: string;
  Notes?: string | null;
}

export interface ModelMovementSummary {
  TotalCount: number;
  InWarehouse: number;
  InWarehouseNew: number;
  InWarehouseUsed: number;
  InWarehouseDamaged: number;
  TotalDispatchedReceived: number;
  TotalReturnedReceived: number;
  TotalReturnedGood: number;
  TotalReturnedDamaged: number;
  CurrentlyInCamps: number;
  IsBalanced: boolean;
  BalanceFormula: string;
}

export interface ModelMovements {
  AssetModelId: number;
  ModelName: string;
  Summary: ModelMovementSummary;
  Dispatches: MovementRecord[];
  Returns: MovementRecord[];
}

export interface IntegrityIssue {
  AssetModelId: number;
  ModelName: string;
  IssueType: string;
  Severity: "Error" | "Warning";
  Description: string;
  Details: Record<string, any>;
}

export interface PieSlice {
  Label: string;
  Value: number;
  Color: string;
}

export interface BarData {
  Label: string;
  Value: number;
}

export interface ChartsData {
  StockDistribution: PieSlice[];
  TopModelsByCount: BarData[];
  DispatchByCategory: BarData[];
}
