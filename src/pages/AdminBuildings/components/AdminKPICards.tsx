import React from "react";
import { BankOutlined, AppstoreOutlined, HomeOutlined, TagsOutlined, WarningOutlined, SwapOutlined } from "@ant-design/icons";
import { AdminBuildingsSummaryDTO } from "../types/adminBuildings.types";

interface Props {
  summary: AdminBuildingsSummaryDTO;
  onUnassignedClick: () => void;
  onMovementsClick: () => void;
}

const AdminKPICards: React.FC<Props> = ({ summary, onUnassignedClick, onMovementsClick }) => {
  const cards = [
    {
      label: "المباني الإدارية",
      value: summary.TotalBuildings,
      icon: <BankOutlined />,
      color: "#1a3c5e",
      bg: "#e8f0fe",
      clickable: false,
    },
    {
      label: "الأدوار",
      value: summary.TotalFloors,
      icon: <AppstoreOutlined />,
      color: "#2c6fad",
      bg: "#e3f2fd",
      clickable: false,
    },
    {
      label: "الغرف",
      value: summary.TotalRooms,
      icon: <HomeOutlined />,
      color: "#1b7a4a",
      bg: "#e8f5e9",
      clickable: false,
    },
    {
      label: "إجمالي الأصول",
      value: summary.TotalAssets,
      icon: <TagsOutlined />,
      color: "#5c3d99",
      bg: "#ede7f6",
      clickable: false,
    },
    {
      label: "أصول غير مسكّنة",
      value: summary.UnassignedAssets,
      icon: <WarningOutlined />,
      color: summary.UnassignedAssets > 0 ? "#c0392b" : "#1b7a4a",
      bg: summary.UnassignedAssets > 0 ? "#fdecea" : "#e8f5e9",
      clickable: true,
      onClick: onUnassignedClick,
      badge: summary.UnassignedAssets > 0,
    },
    {
      label: "حركات النقل — هذا الشهر",
      value: summary.MovementsThisMonth,
      icon: <SwapOutlined />,
      color: "#e67e22",
      bg: "#fff3e0",
      clickable: true,
      onClick: onMovementsClick,
    },
  ];

  return (
    <div className="admin-kpi-grid">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`admin-kpi-card ${card.clickable ? "clickable" : ""} ${card.badge ? "has-badge" : ""}`}
          style={{ "--card-color": card.color, "--card-bg": card.bg } as React.CSSProperties}
          onClick={card.clickable ? card.onClick : undefined}
          title={card.clickable ? "انقر للتفاصيل" : undefined}
        >
          <div className="kpi-icon">{card.icon}</div>
          <div className="kpi-body">
            <div className="kpi-value">{card?.value?.toLocaleString("ar-SA")}</div>
            <div className="kpi-label">{card.label}</div>
          </div>
          {card.clickable && (
            <div className="kpi-arrow">←</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminKPICards;