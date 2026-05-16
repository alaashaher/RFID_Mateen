import React from "react";
import { Card, Col, Empty, Row, Tag } from "antd";
import {
  BarChart,
  Bar,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { ChartsData } from "./inventoryReport.types";

interface Props {
  data: ChartsData | null;
  loading?: boolean;
}

// ─── Custom label للـ Pie (داخل القطعة بدلاً من خارجها) ───
const renderPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
  if (!percent || percent < 0.03) return null; // إخفاء التسميات الصغيرة
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 14, fontWeight: 700 }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// ─── Tooltip مخصّص للـ Pie ───
const pieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div
      style={{
        background: "#fff",
        padding: "8px 12px",
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, color: p.payload.Color, marginBottom: 4 }}>
        {p.payload.Label}
      </div>
      <div>
        العدد: <strong>{p.value.toLocaleString("en-US")}</strong>
      </div>
    </div>
  );
};

// ─── تقصير اسم الموديل لو أطول من حد ───
const truncateLabel = (label: string, maxLen = 18) => {
  if (!label) return "";
  return label.length > maxLen ? label.substring(0, maxLen) + "…" : label;
};

const ChartsSection: React.FC<Props> = ({ data, loading }) => {
  const stockData = (data?.StockDistribution ?? []).filter((s) => s.Value > 0);
  const topModels = (data?.TopModelsByCount ?? []).map((m) => ({
    ...m,
    LabelShort: truncateLabel(m.Label, 20),
  }));
  const dispatchByCategory = data?.DispatchByCategory ?? [];

  const totalStock = stockData.reduce((sum, s) => sum + s.Value, 0);

  return (
    <>
      {/* ═══════════════ الصف 1: Pie كبير فى المنتصف ═══════════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }} justify="center">
        <Col xs={24} md={20} lg={16} xl={14}>
          <Card
            title={
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                📊 توزيع المخزون
              </span>
            }
            size="small"
            loading={loading}
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
          >
            {stockData.length === 0 ? (
              <Empty description="لا توجد بيانات" style={{ padding: 60 }} />
            ) : (
              <Row gutter={16} align="middle">
                {/* الـ Pie Chart */}
                <Col xs={24} md={14}>
                  <ResponsiveContainer width="100%" height={360}>
                    <PieChart>
                      <Pie
                        data={stockData}
                        dataKey="Value"
                        nameKey="Label"
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        innerRadius={60}
                        paddingAngle={2}
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        {stockData.map((s, idx) => (
                          <Cell key={idx} fill={s.Color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={pieTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>

                {/* الـ Legend جانبى مع تفاصيل */}
                <Col xs={24} md={10}>
                  <div style={{ padding: "0 12px" }}>
                    <div
                      style={{
                        marginBottom: 16,
                        padding: 12,
                        background: "#fafafa",
                        borderRadius: 6,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#888" }}>الإجمالى</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#1890ff" }}>
                        {totalStock.toLocaleString("en-US")}
                      </div>
                    </div>
                    {stockData.map((s, idx) => {
                      const pct = totalStock > 0 ? ((s.Value / totalStock) * 100).toFixed(1) : "0";
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            marginBottom: 6,
                            background: "#fff",
                            border: "1px solid #f0f0f0",
                            borderRadius: 6,
                            transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                background: s.Color,
                              }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.Label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: 14, color: s.Color }}>
                              {s.Value.toLocaleString("en-US")}
                            </strong>
                            <Tag
                              style={{
                                margin: 0,
                                fontSize: 11,
                                background: s.Color + "20",
                                border: `1px solid ${s.Color}40`,
                                color: s.Color,
                              }}
                            >
                              {pct}%
                            </Tag>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* ═══════════════ الصف 2: BarCharts جنباً إلى جنب ═══════════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                🏆 أعلى 10 موديلات حسب الكمية
              </span>
            }
            size="small"
            loading={loading}
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)", height: 480 }}
          >
            {topModels.length === 0 ? (
              <Empty description="لا توجد بيانات" style={{ padding: 60 }} />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topModels}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" style={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="LabelShort"
                    width={100}
                    style={{ fontSize: 11 }}
                    interval={0}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString("en-US"), "الكمية"]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.Label ?? label;
                    }}
                    contentStyle={{
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="Value" fill="#1890ff" radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey="Value"
                      position="right"
                      style={{ fontSize: 10, fill: "#595959", fontWeight: 600 }}
                      formatter={(v: any) => Number(v).toLocaleString("en-US")}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                📦 الموزّع على المخيمات حسب التصنيف
              </span>
            }
            size="small"
            loading={loading}
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)", height: 480 }}
          >
            {dispatchByCategory.length === 0 ? (
              <Empty description="لا توجد بيانات" style={{ padding: 60 }} />
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={dispatchByCategory}
                  margin={{ top: 20, right: 20, left: 10, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="Label"
                    style={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis style={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString("en-US"), "الكمية"]}
                    contentStyle={{
                      borderRadius: 6,
                      border: "1px solid #d9d9d9",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="Value" fill="#722ed1" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="Value"
                      position="top"
                      style={{ fontSize: 10, fill: "#595959", fontWeight: 600 }}
                      formatter={(v: any) => Number(v).toLocaleString("en-US")}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ChartsSection;