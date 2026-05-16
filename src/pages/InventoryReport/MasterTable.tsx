import React from "react";
import { Badge, Table, Tag, Tooltip } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { ModelInventoryRow } from "./inventoryReport.types";
import DrillDownPanel from "./DrillDownPanel";

interface Props {
  data: ModelInventoryRow[];
  loading?: boolean;
}

const stockStatusTag = (status: string) => {
  switch (status) {
    case "Available":
      return <Tag color="green">متوفر</Tag>;
    case "Low":
      return <Tag color="orange">منخفض</Tag>;
    case "OutOfStock":
      return <Tag color="red">منتهى</Tag>;
    default:
      return <Tag>{status}</Tag>;
  }
};

const MasterTable: React.FC<Props> = ({ data, loading }) => {
  const columns: any[] = [
    {
      title: "الموديل",
      dataIndex: "ModelName",
      key: "ModelName",
      fixed: "left",
      width: 200,
      sorter: (a: ModelInventoryRow, b: ModelInventoryRow) =>
        a.ModelName.localeCompare(b.ModelName),
      render: (name: string, row: ModelInventoryRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {name}
            {row.HasIntegrityIssue && (
              <Tooltip
                title={
                  <ul style={{ margin: 0, paddingRight: 16 }}>
                    {row.IntegrityIssues.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                }
              >
                <WarningOutlined style={{ color: "#ff4d4f", marginRight: 6 }} />
              </Tooltip>
            )}
          </div>
          {row.Brand && (
            <div style={{ fontSize: 11, color: "#888" }}>{row.Brand}</div>
          )}
        </div>
      ),
    },
    {
      title: "النوع",
      dataIndex: "ModelType",
      key: "ModelType",
      width: 80,
      filters: [
        { text: "RFID", value: "RFID" },
        { text: "Lot", value: "Lot" },
      ],
      onFilter: (v: any, r: ModelInventoryRow) => r.ModelType === v,
      render: (t: string) => (
        <Tag color={t === "Lot" ? "purple" : "blue"}>{t}</Tag>
      ),
    },
    {
      title: "التصنيف",
      dataIndex: "CategoryName",
      key: "CategoryName",
      width: 130,
      ellipsis: true,
    },
    {
      title: "نوع الأصل",
      dataIndex: "AssetTypeName",
      key: "AssetTypeName",
      width: 130,
      ellipsis: true,
    },
    {
      title: "الإجمالى",
      dataIndex: "TotalCount",
      key: "TotalCount",
      width: 90,
      align: "center",
      sorter: (a: ModelInventoryRow, b: ModelInventoryRow) => a.TotalCount - b.TotalCount,
      render: (v: number) => <strong style={{ color: "#1890ff" }}>{v}</strong>,
    },
    {
      title: "المستودع",
      children: [
        {
          title: "الكلى",
          dataIndex: "RemainingInWarehouse",
          key: "RemainingInWarehouse",
          width: 80,
          align: "center",
          sorter: (a: ModelInventoryRow, b: ModelInventoryRow) =>
            a.RemainingInWarehouse - b.RemainingInWarehouse,
          render: (v: number) => <strong style={{ color: "#52c41a" }}>{v}</strong>,
        },
        {
          title: "جديد",
          dataIndex: "NewCount",
          key: "NewCount",
          width: 70,
          align: "center",
          render: (v: number) => v || "-",
        },
        {
          title: "مستعمل",
          dataIndex: "UsedCount",
          key: "UsedCount",
          width: 80,
          align: "center",
          render: (v: number) => v || "-",
        },
        {
          title: "تالف",
          dataIndex: "DamagedCount",
          key: "DamagedCount",
          width: 70,
          align: "center",
          render: (v: number) =>
            v > 0 ? <Tag color="orange">{v}</Tag> : "-",
        },
      ],
    },
    {
      title: "المخيمات",
      children: [
        {
          title: "حالياً",
          dataIndex: "CurrentlyInCamps",
          key: "CurrentlyInCamps",
          width: 90,
          align: "center",
          sorter: (a: ModelInventoryRow, b: ModelInventoryRow) =>
            a.CurrentlyInCamps - b.CurrentlyInCamps,
          render: (v: number) => <strong style={{ color: "#722ed1" }}>{v}</strong>,
        },
        {
          title: "خرج (مُستلَم)",
          dataIndex: "TotalDispatchedReceived",
          key: "TotalDispatchedReceived",
          width: 110,
          align: "center",
        },
        {
          title: "رُجع (مُستلَم)",
          dataIndex: "TotalReturnedReceived",
          key: "TotalReturnedReceived",
          width: 110,
          align: "center",
          render: (v: number, row: ModelInventoryRow) => (
            <Tooltip title={`سليم: ${row.TotalReturnedGood} | تالف: ${row.TotalReturnedDamaged}`}>
              <span>{v}</span>
            </Tooltip>
          ),
        },
      ],
    },
    {
      title: "معلّق",
      children: [
        {
          title: "خرج",
          dataIndex: "PendingDispatch",
          key: "PendingDispatch",
          width: 70,
          align: "center",
          render: (v: number) => (v > 0 ? <Tag color="cyan">{v}</Tag> : "-"),
        },
        {
          title: "رجوع",
          dataIndex: "PendingReturn",
          key: "PendingReturn",
          width: 70,
          align: "center",
          render: (v: number) => (v > 0 ? <Tag color="geekblue">{v}</Tag> : "-"),
        },
      ],
    },
    {
      title: "أصول فعلية",
      dataIndex: "ActualAssetsCount",
      key: "ActualAssetsCount",
      width: 100,
      align: "center",
      render: (v: number, row: ModelInventoryRow) => {
        if (row.IsLot) return <Tag color="default">N/A</Tag>;
        const ok = v >= row.TotalCount;
        return (
          <Tooltip title={`المُسجّل: ${row.TotalCount} | الفعلى: ${v}`}>
            <Badge
              status={ok ? "success" : "error"}
              text={`${v} / ${row.TotalCount}`}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "حالة المخزون",
      dataIndex: "StockStatus",
      key: "StockStatus",
      width: 110,
      align: "center",
      render: (s: string) => stockStatusTag(s),
    },
    {
      title: "آخر حركة",
      dataIndex: "LastMovementDate",
      key: "LastMovementDate",
      width: 130,
      render: (d: string, row: ModelInventoryRow) => {
        if (!d) return "-";
        const date = new Date(d).toLocaleDateString("ar-SA");
        return (
          <Tooltip title={`${row.LastMovementType === "Return" ? "استرجاع" : "خروج"} - ${row.LastMovementOrderNo ?? ""}`}>
            <div style={{ fontSize: 11 }}>
              <Tag color={row.LastMovementType === "Return" ? "geekblue" : "blue"} style={{ marginRight: 4 }}>
                {row.LastMovementType === "Return" ? "🔄" : "🚚"}
              </Tag>
              {date}
            </div>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="AssetModelId"
      loading={loading}
      size="small"
      bordered
      scroll={{ x: 1500 }}
      pagination={{
        defaultPageSize: 50,
        pageSizeOptions: ["20", "50", "100", "200"],
        showSizeChanger: true,
        showTotal: (total) => `الإجمالى: ${total} موديل`,
      }}
      expandable={{
        expandedRowRender: (row) => <DrillDownPanel assetModelId={row.AssetModelId} />,
        rowExpandable: () => true,
      }}
      rowClassName={(row) => (row.HasIntegrityIssue ? "row-with-issue" : "")}
    />
  );
};

export default MasterTable;
