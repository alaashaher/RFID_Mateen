import React, { useState } from "react";
import { Alert, Button, Collapse, Tag } from "antd";
import { WarningOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { IntegrityIssue } from "./inventoryReport.types";

interface Props {
  issues: IntegrityIssue[];
}

const ISSUE_TYPE_LABELS: Record<string, string> = {
  BalanceMismatch: "عدم تطابق المعادلة",
  RemainingBreakdownInvalid: "خطأ فى تفكيك المتبقى",
  LotHasAssets: "موديل Lot له أصول",
  RfidAssetCountMissing: "أصول ناقصة فى UniversityAssets",
  NegativeValues: "قيم سالبة",
};

const IntegrityAlerts: React.FC<Props> = ({ issues }) => {
  const [collapsed, setCollapsed] = useState(true);

  if (!issues || issues.length === 0) {
    return (
      <Alert
        type="success"
        showIcon
        message="✅ لا توجد مشاكل فى البيانات"
        description="كل الموديلات متوازنة والمعادلات الذهبية محققة."
        style={{ marginBottom: 24 }}
      />
    );
  }

  const errors = issues.filter((i) => i.Severity === "Error");
  const warnings = issues.filter((i) => i.Severity === "Warning");

  // تجميع المشاكل حسب النوع
  const groupedByType: Record<string, IntegrityIssue[]> = {};
  issues.forEach((i) => {
    if (!groupedByType[i.IssueType]) groupedByType[i.IssueType] = [];
    groupedByType[i.IssueType].push(i);
  });

  return (
    <Alert
      type={errors.length > 0 ? "error" : "warning"}
      showIcon
      icon={errors.length > 0 ? <CloseCircleOutlined /> : <WarningOutlined />}
      style={{ marginBottom: 24 }}
      message={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            ⚠️ تم اكتشاف <strong>{issues.length}</strong> مشكلة فى البيانات
            {errors.length > 0 && <Tag color="red" style={{ marginRight: 8 }}>{errors.length} خطأ</Tag>}
            {warnings.length > 0 && <Tag color="orange" style={{ marginRight: 8 }}>{warnings.length} تحذير</Tag>}
          </span>
          <Button size="small" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "عرض التفاصيل" : "إخفاء التفاصيل"}
          </Button>
        </div>
      }
      description={
        !collapsed && (
          <Collapse
            ghost
            size="small"
            style={{ marginTop: 12 }}
            items={Object.entries(groupedByType).map(([type, list]) => ({
              key: type,
              label: (
                <span>
                  <Tag color={list[0].Severity === "Error" ? "red" : "orange"}>
                    {list.length}
                  </Tag>
                  <strong>{ISSUE_TYPE_LABELS[type] || type}</strong>
                </span>
              ),
              children: (
                <ul style={{ paddingRight: 20, margin: 0 }}>
                  {list.map((issue, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>
                      <strong>{issue.ModelName}</strong> (ID: {issue.AssetModelId}) — {issue.Description}
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        )
      }
    />
  );
};

export default IntegrityAlerts;
