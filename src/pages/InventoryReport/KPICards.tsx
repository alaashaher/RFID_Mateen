import React from "react";
import { Card, Col, Row, Tooltip } from "antd";
import {
  AppstoreOutlined,
  DatabaseOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  StarOutlined,
  WarningOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { InventoryReportSummary } from "./inventoryReport.types";

interface Props {
  summary: InventoryReportSummary | null;
  loading?: boolean;
}

const KPICards: React.FC<Props> = ({ summary, loading }) => {
  const cards = [
    {
      title: "إجمالى الموديلات",
      value: summary?.TotalModels ?? 0,
      icon: <AppstoreOutlined />,
      color: "#1890ff",
      bgGradient: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
      tooltip: `Lot: ${summary?.LotModels ?? 0} | RFID: ${summary?.RfidModels ?? 0}`,
    },
    {
      title: "إجمالى الأصول",
      value: summary?.TotalAssets ?? 0,
      icon: <DatabaseOutlined />,
      color: "#13c2c2",
      bgGradient: "linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)",
      tooltip: "إجمالى الكمية المسجّلة لجميع الموديلات",
    },
    {
      title: "فى المستودع",
      value: summary?.InWarehouse ?? 0,
      icon: <HomeOutlined />,
      color: "#52c41a",
      bgGradient: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
      tooltip: "إجمالى المتبقى فى المستودع (جديد + مستعمل + تالف)",
    },
    {
      title: "فى المخيمات",
      value: summary?.InCamps ?? 0,
      icon: <EnvironmentOutlined />,
      color: "#722ed1",
      bgGradient: "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
      tooltip: "الإجمالى - المتبقى فى المستودع",
    },
    {
      title: "جديد",
      value: summary?.NewInWarehouse ?? 0,
      icon: <StarOutlined />,
      color: "#faad14",
      bgGradient: "linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)",
      tooltip: "الكميات الجديدة غير المستخدمة فى المستودع",
    },
    {
      title: "مستعمل",
      value: summary?.UsedInWarehouse ?? 0,
      icon: <ToolOutlined />,
      color: "#2f54eb",
      bgGradient: "linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)",
      tooltip: "المستعمل المرتجع من المخيمات (المتبقى - الجديد - التالف)",
    },
    {
      title: "تالف",
      value: summary?.DamagedInWarehouse ?? 0,
      icon: <WarningOutlined />,
      color: "#fa8c16",
      bgGradient: "linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)",
      tooltip: "التالف فى المستودع",
    },
    {
      title: "مشاكل البيانات",
      value: summary?.IntegrityIssuesCount ?? 0,
      icon: <ExclamationCircleOutlined />,
      color: (summary?.IntegrityIssuesCount ?? 0) > 0 ? "#ff4d4f" : "#8c8c8c",
      bgGradient:
        (summary?.IntegrityIssuesCount ?? 0) > 0
          ? "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)"
          : "linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)",
      tooltip: "عدد الموديلات التى بها مشاكل فى البيانات",
    },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {cards.map((c, idx) => (
        <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6} key={idx}>
          <Tooltip title={c.tooltip}>
            <Card
              loading={loading}
              hoverable
              bordered={false}
              className="kpi-card"
              styles={{
                body: {
                  padding: "20px 24px",
                  background: c.bgGradient,
                  borderRadius: 8,
                  position: "relative",
                  overflow: "hidden",
                },
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#595959",
                      marginBottom: 12,
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: c.color,
                      lineHeight: 1,
                    }}
                  >
                    {c.value.toLocaleString("en-US")}
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.color,
                    fontSize: 28,
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </div>
              </div>
            </Card>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};

export default KPICards;