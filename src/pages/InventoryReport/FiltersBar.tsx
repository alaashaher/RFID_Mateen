import React, { useEffect, useState } from "react";
import { Button, Card, Col, Input, Row, Select, Switch } from "antd";
import { SearchOutlined, ReloadOutlined, FilterOutlined } from "@ant-design/icons";
import { getFromApi } from "../../apis/apis";
import { InventoryReportFilter } from "./inventoryReport.types";

interface Props {
  filter: InventoryReportFilter;
  onFilterChange: (f: InventoryReportFilter) => void;
  onReset: () => void;
}

const FiltersBar: React.FC<Props> = ({ filter, onFilterChange, onReset }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  // ─── جلب التصنيفات ───
  useEffect(() => {
    (async () => {
      try {
        const res = await getFromApi(`Category/get-category-ddl?BuildingTypeId=1`);
        setCategories(res || []);
      } catch {}
    })();
  }, []);

  // ─── جلب أنواع الأصول حسب التصنيف ───
  useEffect(() => {
    (async () => {
      if (!filter.CategoryId) {
        setAssetTypes([]);
        return;
      }
      try {
        const res = await getFromApi(
          `AssetType/get-assetType-ddl-byCategoryId?CategoryId=${filter.CategoryId}&hasModels=false`
        );
        setAssetTypes(res || []);
      } catch {}
    })();
  }, [filter.CategoryId]);

  // ─── جلب الموديلات حسب نوع الأصل ───
  useEffect(() => {
    (async () => {
      if (!filter.AssetTypeId) {
        setModels([]);
        return;
      }
      try {
        const res = await getFromApi(
          `AssetModel/get-assetModel-by-assetTypeId?assetTypeId=${filter.AssetTypeId}`
        );
        setModels(res || []);
      } catch {}
    })();
  }, [filter.AssetTypeId]);

  const update = (patch: Partial<InventoryReportFilter>) => {
    onFilterChange({ ...filter, ...patch });
  };

  // ────── Field wrapper for consistent label styling ──────
  const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#595959",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <Card
      size="small"
      bordered={false}
      style={{ marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      styles={{
        header: {
          background: "linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)",
          borderBottom: "1px solid #d9d9d9",
        },
      }}
      title={
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          <FilterOutlined style={{ marginLeft: 8, color: "#1890ff" }} />
          الفلاتر
        </span>
      }
      extra={
        <Button icon={<ReloadOutlined />} onClick={onReset} size="small">
          مسح الفلاتر
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        {/* الصف الأول */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="🔎 بحث">
            <Input
              placeholder="اسم الموديل / Brand / رقم الموديل"
              prefix={<SearchOutlined />}
              allowClear
              value={filter.SearchTerm}
              onChange={(e) => update({ SearchTerm: e.target.value })}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="التصنيف">
            <Select
              placeholder="كل التصنيفات"
              allowClear
              value={filter.CategoryId ?? undefined}
              onChange={(v) =>
                update({
                  CategoryId: v ?? null,
                  AssetTypeId: null,
                  AssetModelId: null,
                })
              }
              style={{ width: "100%" }}
              options={categories.map((c: any) => ({
                label: c.CategoryName,
                value: c.CategoryId,
              }))}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="نوع الأصل">
            <Select
              placeholder="كل الأنواع"
              allowClear
              disabled={!filter.CategoryId}
              value={filter.AssetTypeId ?? undefined}
              onChange={(v) => update({ AssetTypeId: v ?? null, AssetModelId: null })}
              style={{ width: "100%" }}
              options={assetTypes.map((a: any) => ({
                label: a.AssetTypeName,
                value: a.AssetTypeId,
              }))}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="الموديل">
            <Select
              placeholder="كل الموديلات"
              allowClear
              disabled={!filter.AssetTypeId}
              value={filter.AssetModelId ?? undefined}
              onChange={(v) => update({ AssetModelId: v ?? null })}
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              options={models.map((m: any) => ({
                label: `${m.ModelName} ${m.Brand ? `- ${m.Brand}` : ""}`,
                value: m.AssetModelId,
              }))}
            />
          </Field>
        </Col>

        {/* الصف الثانى */}
        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="العلامة التجارية">
            <Input
              placeholder="Samsung, LG, ..."
              allowClear
              value={filter.Brand}
              onChange={(e) => update({ Brand: e.target.value })}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="نوع الموديل">
            <Select
              value={filter.ModelType ?? "All"}
              onChange={(v) => update({ ModelType: v })}
              style={{ width: "100%" }}
              options={[
                { label: "الكل", value: "All" },
                { label: "RFID فقط", value: "RFID" },
                { label: "Lot فقط", value: "Lot" },
              ]}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="حالة المخزون">
            <Select
              value={filter.StockStatus ?? "All"}
              onChange={(v) => update({ StockStatus: v })}
              style={{ width: "100%" }}
              options={[
                { label: "الكل", value: "All" },
                { label: "متوفر", value: "Available" },
                { label: "منخفض (≤10%)", value: "Low" },
                { label: "منتهى", value: "OutOfStock" },
              ]}
            />
          </Field>
        </Col>

        <Col xs={24} sm={12} md={12} lg={6} xl={6}>
          <Field label="⚠️ الموديلات بها مشاكل فقط">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 32,
                padding: "0 12px",
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                background: "#fff",
              }}
            >
              <Switch
                checked={!!filter.OnlyWithIssues}
                onChange={(v) => update({ OnlyWithIssues: v })}
                checkedChildren="نعم"
                unCheckedChildren="لا"
              />
              <span style={{ marginRight: 12, fontSize: 12, color: "#888" }}>
                {filter.OnlyWithIssues ? "عرض الموديلات بها مشاكل فقط" : "عرض كل الموديلات"}
              </span>
            </div>
          </Field>
        </Col>
      </Row>
    </Card>
  );
};

export default FiltersBar;