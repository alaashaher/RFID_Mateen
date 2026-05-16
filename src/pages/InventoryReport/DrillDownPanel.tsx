import React, { useEffect, useState } from "react";
import { Alert, Card, Col, Empty, Row, Spin, Statistic, Table, Tabs, Tag } from "antd";
import { getFromApi } from  "../../apis/apis";
import { ModelMovements, MovementRecord } from "./inventoryReport.types";

interface Props {
  assetModelId: number;
}

const statusColor = (status: string): string => {
  switch (status) {
    case "Received": return "green";
    case "PartialReceived": return "lime";
    case "InTransit": return "blue";
    case "Loaded": return "cyan";
    case "Approved": return "geekblue";
    case "Draft": return "default";
    default: return "default";
  }
};

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    Draft: "مسودة",
    Approved: "معتمد",
    Loaded: "تم التحميل",
    InTransit: "فى الطريق",
    Received: "تم الاستلام",
    PartialReceived: "استلام جزئي",
  };
  return map[status] ?? status;
};

const DrillDownPanel: React.FC<Props> = ({ assetModelId }) => {
  const [data, setData] = useState<ModelMovements | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getFromApi(
          `InventoryReport/get-model-movements?assetModelId=${assetModelId}`
        );
        setData(res);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, [assetModelId]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <Empty description="لا توجد بيانات" />;
  }

  const dispatchColumns = [
    {
      title: "رقم الأمر",
      dataIndex: "OrderNumber",
      key: "OrderNumber",
      width: 120,
    },
    {
      title: "تاريخ الأمر",
      dataIndex: "OrderDate",
      key: "OrderDate",
      width: 120,
      render: (d: string) => (d ? new Date(d).toLocaleDateString("ar-SA") : "-"),
    },
    {
      title: "تاريخ الاستلام",
      dataIndex: "ReceivedDate",
      key: "ReceivedDate",
      width: 130,
      render: (d: string) => (d ? new Date(d).toLocaleDateString("ar-SA") : "-"),
    },
    {
      title: "الحالة",
      dataIndex: "Status",
      key: "Status",
      width: 110,
      render: (s: string) => <Tag color={statusColor(s)}>{statusLabel(s)}</Tag>,
    },
    {
      title: "مطلوب",
      dataIndex: "RequestedQuantity",
      key: "RequestedQuantity",
      width: 80,
      align: "center" as const,
    },
    {
      title: "مُستلَم",
      dataIndex: "ReceivedQuantity",
      key: "ReceivedQuantity",
      width: 80,
      align: "center" as const,
      render: (v: number) => <strong style={{ color: "#52c41a" }}>{v}</strong>,
    },
    {
      title: "المخيمات",
      dataIndex: "Camps",
      key: "Camps",
      ellipsis: true,
    },
    {
      title: "ملاحظات",
      dataIndex: "Notes",
      key: "Notes",
      ellipsis: true,
    },
  ];

  const returnColumns = [
    ...dispatchColumns.slice(0, 6),
    {
      title: "سليم",
      dataIndex: "ReceivedGood",
      key: "ReceivedGood",
      width: 70,
      align: "center" as const,
      render: (v: number) => <Tag color="green">{v ?? 0}</Tag>,
    },
    {
      title: "تالف",
      dataIndex: "ReceivedDamaged",
      key: "ReceivedDamaged",
      width: 70,
      align: "center" as const,
      render: (v: number) => <Tag color="orange">{v ?? 0}</Tag>,
    },
    {
      title: "السبب",
      dataIndex: "ReturnReason",
      key: "ReturnReason",
      width: 100,
    },
    {
      title: "المخيمات",
      dataIndex: "Camps",
      key: "Camps",
      ellipsis: true,
    },
  ];

  const s = data.Summary;

  return (
    <div style={{ padding: 16, backgroundColor: "#fafafa", borderRadius: 6 }}>
      {/* المعادلة الذهبية */}
      <Alert
        type={s.IsBalanced ? "success" : "error"}
        showIcon
        message={s.IsBalanced ? "✅ المعادلة محققة" : "❌ المعادلة غير محققة"}
        description={s.BalanceFormula}
        style={{ marginBottom: 16 }}
      />

      {/* الإحصائيات */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="الإجمالى" value={s.TotalCount} valueStyle={{ color: "#1890ff" }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="فى المستودع"
              value={s.InWarehouse}
              valueStyle={{ color: "#52c41a" }}
              suffix={
                <span style={{ fontSize: 11, color: "#999" }}>
                  (جديد: {s.InWarehouseNew} | مستعمل: {s.InWarehouseUsed} | تالف: {s.InWarehouseDamaged})
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="فى المخيمات حالياً"
              value={s.CurrentlyInCamps}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="حركة"
              value={`خرج: ${s.TotalDispatchedReceived} | رُجع: ${s.TotalReturnedReceived}`}
              valueStyle={{ fontSize: 14, color: "#fa8c16" }}
            />
            <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
              مرتجع سليم: {s.TotalReturnedGood} | مرتجع تالف: {s.TotalReturnedDamaged}
            </div>
          </Card>
        </Col>
      </Row>

      {/* جداول الحركات */}
      <Tabs
        defaultActiveKey="dispatches"
        items={[
          {
            key: "dispatches",
            label: `🚚 أوامر الخروج (${data.Dispatches.length})`,
            children: (
              <Table
                dataSource={data.Dispatches}
                columns={dispatchColumns}
                rowKey="OrderId"
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 900 }}
              />
            ),
          },
          {
            key: "returns",
            label: `🔄 أوامر الاسترجاع (${data.Returns.length})`,
            children: (
              <Table
                dataSource={data.Returns}
                columns={returnColumns}
                rowKey="OrderId"
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 1100 }}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default DrillDownPanel;
