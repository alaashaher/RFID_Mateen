import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Space, Typography } from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { Store } from "react-notifications-component";
import { getFromApi, postToApi } from "../../apis/apis";
import KPICards from "./KPICards";
import FiltersBar from "./FiltersBar";
import ChartsSection from "./ChartsSection";
import IntegrityAlerts from "./IntegrityAlerts";
import MasterTable from "./MasterTable";
import {
  ChartsData,
  IntegrityIssue,
  InventoryReportFilter,
  InventoryReportSummary,
  ModelInventoryRow,
} from "./inventoryReport.types";
import "./InventoryReport.scss";

const { Title } = Typography;

const DEFAULT_FILTER: InventoryReportFilter = {
  ModelType: "All",
  StockStatus: "All",
};

const InventoryReport: React.FC = () => {
  const [filter, setFilter] = useState<InventoryReportFilter>(DEFAULT_FILTER);
  const [summary, setSummary] = useState<InventoryReportSummary | null>(null);
  const [models, setModels] = useState<ModelInventoryRow[]>([]);
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ─── جلب كل البيانات ───
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, i, c] = await Promise.all([
        postToApi("InventoryReport/get-summary", filter),
        postToApi("InventoryReport/get-models", filter),
        getFromApi("InventoryReport/get-integrity-issues"),
        postToApi("InventoryReport/get-charts-data", filter),
      ]);
      setSummary(s);
      setModels(m || []);
      setIssues(i || []);
      setCharts(c);
    } catch (error: any) {
      Store.addNotification({
        title: "",
        message: "حدث خطأ أثناء تحميل التقرير",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000, onScreen: true },
      });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─── إعادة ضبط الفلاتر ───
  const handleResetFilters = () => {
    setFilter({ ...DEFAULT_FILTER });
  };

  // ─── تصدير Excel ───
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const baseUrl =
        // (window as any)?.BASE_URL ?? "http://localhost:7228/api";
        (window as any)?.BASE_URL ?? "https://rfidrajhiapi.sirumaps.net/api";
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/InventoryReport/export-excel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filter),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InventoryReport_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Store.addNotification({
        title: "",
        message: "تم التصدير بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } catch {
      Store.addNotification({
        title: "",
        message: "فشل التصدير",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000, onScreen: true },
      });
    } finally {
      setExportLoading(false);
    }
  };

  // ─── الطباعة ───
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="inventory-report-page">
      {/* الترويسة */}
      <Card
        className="page-header no-print-buttons"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>
            📊 تقرير المخزون والتوزيع
          </Title>
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchAll}
              loading={loading}
            >
              تحديث
            </Button>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              loading={exportLoading}
              type="primary"
              style={{ background: "#1d6f42", borderColor: "#1d6f42" }}
            >
              تصدير Excel
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              طباعة
            </Button>
          </Space>
        </div>
      </Card>

      {/* KPIs */}
      <KPICards summary={summary} loading={loading} />

      {/* الفلاتر */}
      <div className="no-print-buttons">
        <FiltersBar
          filter={filter}
          onFilterChange={setFilter}
          onReset={handleResetFilters}
        />
      </div>

      {/* المشاكل المكتشفة */}
      <IntegrityAlerts issues={issues} />

      {/* Charts */}
      <ChartsSection data={charts} loading={loading} />

      {/* Master Table */}
      <Card title={`📋 الموديلات (${models.length})`} size="small">
        <MasterTable data={models} loading={loading} />
      </Card>
    </div>
  );
};

export default InventoryReport;
