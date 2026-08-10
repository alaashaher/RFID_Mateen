import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Alert } from "antd";
import { getFromApi } from "../../apis/apis";
import { routerLinks } from "../../routes/routerLinks";
import AdminKPICards from "./components/AdminKPICards";
import BuildingTree from "./components/BuildingTree";
import FloorCards from "./components/FloorCards";
import {
  AdminBuildingsSummaryDTO,
  BuildingNodeDTO,
  SelectionState,
} from "./types/adminBuildings.types";
import "./AdminBuildingsDashboard.scss";

const AdminBuildingsDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<AdminBuildingsSummaryDTO | null>(null);
  const [buildings, setBuildings] = useState<BuildingNodeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selection, setSelection] = useState<SelectionState>({
    buildingId: null,
    floorId: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, buildingsData] = await Promise.all([
        getFromApi("AdminBuildings/summary"),
        getFromApi("AdminBuildings/buildings-tree"),
      ]);
      setSummary(summaryData);
      setBuildings(buildingsData);
      // Auto-select first building
      if (buildingsData.length > 0) {
        setSelection({ buildingId: buildingsData[0].buildingId, floorId: null });
      }
    } catch {
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelect = (buildingId: number, floorId: number | null) => {
    setSelection({ buildingId, floorId });
  };

  const selectedBuilding = buildings.find(b => b.buildingId === selection.buildingId) ?? null;

  if (loading) {
    return (
      <div className="admin-buildings-loading">
        <Spin size="large" tip="جارٍ تحميل بيانات المباني الإدارية..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message={error}
        action={<button onClick={loadData}>إعادة المحاولة</button>}
        style={{ margin: 24 }}
      />
    );
  }

  return (
    <div className="admin-buildings-page" dir="rtl">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>لوحة المباني الإدارية</h1>
          <p>إدارة ومتابعة أصول المباني الإدارية — أوقاف الراجحي</p>
        </div>
        <button className="btn-refresh" onClick={loadData}>
          🔄 تحديث
        </button>
      </div>

      {/* ─── KPI Cards ─── */}
      {summary && (
        <AdminKPICards
          summary={summary}
          onUnassignedClick={() => navigate(routerLinks.UnassignedAssets)}
          onMovementsClick={() => navigate(routerLinks.AssetMovements)}
        />
      )}

      {/* ─── Main Content: Tree + Cards ─── */}
      <div className="admin-buildings-main">
        {/* Left: Tree */}
        <div className="admin-tree-panel">
          <BuildingTree
            buildings={buildings}
            selection={selection}
            onSelect={handleSelect}
          />
        </div>

        {/* Right: Floor Cards */}
        <div className="admin-cards-panel">
          <FloorCards
            building={selectedBuilding}
            selectedFloorId={selection.floorId}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminBuildingsDashboard;