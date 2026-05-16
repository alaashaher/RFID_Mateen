import { useState, useEffect } from "react";
import { getFromApi } from "../../apis/apis";
import { Select as AntSelect, Tag } from "antd";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const DestinationS = ["منى", "عرفة", "مزدلفة"];
const LOCATIONS = [{ value: 1, label: "منى" }, { value: 2, label: "عرفة" }];
const getLocationLabel = (t) => LOCATIONS.find((l) => l.value === t)?.label || "";

// ─────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, small }) => {
  const base = { padding: small ? "5px 12px" : "8px 20px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 14, fontWeight: 600, transition: "all .15s", opacity: disabled ? .5 : 1, ...style };
  const variants = {
    primary: { background: "#1a56db", color: "#fff" },
    success: { background: "#27AE60", color: "#fff" },
    ghost: { background: "transparent", color: "#555", border: "1px solid #ddd" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const Loader = ({ text = "جارٍ التحميل..." }) => (
  <div style={{ textAlign: "center", padding: 30, color: "#888" }}>
    <div style={{ fontSize: 24, marginBottom: 6 }}>⏳</div><div>{text}</div>
  </div>
);

// ─────────────────────────────────────────────
// APIs
// ─────────────────────────────────────────────
const api = {
  getAssetTypes: () => getFromApi(`DispatchOrder/get-asset-types`),
  getAssetModels: (AssetTypeId) => getFromApi(`DispatchOrder/get-asset-models?AssetTypeId=${AssetTypeId}`),
  // أوامر الخروج
  getDispatchDistribution: (assetTypeId, assetModelId, destination) => {
    const params = new URLSearchParams();
    params.append("assetTypeId", assetTypeId);
    if (assetModelId) params.append("assetModelId", assetModelId);
    if (destination) params.append("destination", destination);
    return getFromApi(`DispatchOrder/get-model-distribution?${params.toString()}`);
  },
  // الجرد اليدوي
  getCampAdjustmentDistribution: (assetTypeId, assetModelId, locationType) => {
    const params = [];
    if (assetTypeId) params.push(`assetTypeId=${assetTypeId}`);
    if (assetModelId) params.push(`assetModelId=${assetModelId}`);
    if (locationType) params.push(`locationType=${locationType}`);
    return getFromApi(`CampAdjustment/get-model-distribution?${params.join("&")}`);
  },
};

// تحويل الوجهة (string) إلى locationType (int) للجرد
const destinationToLocationType = (destination) => {
  if (destination === "منى") return 1;
  if (destination === "عرفة") return 2;
  return null;
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const SearchModelDistributionModal = ({ open, onClose, assetTypes: assetTypesProp }) => {
  const [assetTypes, setAssetTypes] = useState(assetTypesProp || []);
  const [assetTypeId, setAssetTypeId] = useState(null);
  const [assetModelId, setAssetModelId] = useState(null);
  const [destination, setDestination] = useState(null);
  const [models, setModels] = useState([]);

  // Dispatch results
  const [dispatchResult, setDispatchResult] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  // Camp Adjustment results
  const [campResult, setCampResult] = useState([]);
  const [campLoading, setCampLoading] = useState(false);

  const [error, setError] = useState(null);

  // لو assetTypes لم يتم تمريرها من المستدعي، نحضرها بأنفسنا
  useEffect(() => {
    if (open && (!assetTypesProp || assetTypesProp.length === 0)) {
      api.getAssetTypes().then(r => setAssetTypes(r || [])).catch(() => { });
    } else if (assetTypesProp) {
      setAssetTypes(assetTypesProp);
    }
  }, [open, assetTypesProp]);

  // جلب الموديلات عند اختيار نوع الأصل
  useEffect(() => {
    if (!assetTypeId) { setModels([]); setAssetModelId(null); return; }
    (async () => {
      try {
        const m = await api.getAssetModels(assetTypeId);
        setModels(m || []);
      } catch { setModels([]); }
    })();
  }, [assetTypeId]);

  const handleSearch = async () => {
    if (!assetTypeId) { setError("اختر نوع الأصل"); return; }
    setError(null);
    setDispatchResult(null);
    setCampResult([]);
    setDispatchLoading(true);
    setCampLoading(true);

    const locationType = destinationToLocationType(destination);

    // نستدعي الـ API-تين بالتوازي
    const dispatchPromise = api.getDispatchDistribution(assetTypeId, assetModelId, destination)
      .then(r => { setDispatchResult(r); })
      .catch(e => console.error("Dispatch error:", e))
      .finally(() => setDispatchLoading(false));

    const campPromise = api.getCampAdjustmentDistribution(assetTypeId, assetModelId, locationType)
      .then(r => { setCampResult(r || []); })
      .catch(e => console.error("Camp error:", e))
      .finally(() => setCampLoading(false));

    await Promise.all([dispatchPromise, campPromise]);
  };

  const handleReset = () => {
    setAssetTypeId(null);
    setAssetModelId(null);
    setDestination(null);
    setModels([]);
    setDispatchResult(null);
    setCampResult([]);
    setError(null);
  };

  if (!open) return null;

  // حسابات إجمالي الجرد اليدوي
  const campTotal = campResult.reduce((sum, r) => sum + (r.ActualQty || 0), 0);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 40, paddingBottom: 40, overflow: "auto"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24,
        width: "95%", maxWidth: 900, direction: "rtl",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2px solid #f0f0f0", paddingBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>🔍 بحث شامل — أوامر الخروج والجرد اليدوي</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* Filters */}
        <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
                نوع الأصل <span style={{ color: "#E74C3C" }}>*</span>
              </label>
              <AntSelect
                showSearch
                value={assetTypeId || undefined}
                onChange={v => { setAssetTypeId(v); setAssetModelId(null); }}
                placeholder="اختر نوع الأصل..."
                optionFilterProp="label"
                style={{ width: "100%", direction: "rtl" }}
                options={assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }))}
                allowClear
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
                الموديل (اختياري)
              </label>
              <AntSelect
                showSearch
                value={assetModelId || undefined}
                onChange={setAssetModelId}
                placeholder="كل الموديلات"
                optionFilterProp="label"
                style={{ width: "100%", direction: "rtl" }}
                options={models.map(m => ({ value: m.AssetModelId, label: `${m.ModelName} - ${m.Brand || ""} - ${m.ModelNumber || ""}` }))}
                disabled={!assetTypeId}
                allowClear
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
                الوجهة / المكان (اختياري)
              </label>
              <AntSelect
                value={destination || undefined}
                onChange={setDestination}
                placeholder="كل الوجهات"
                style={{ width: "100%", direction: "rtl" }}
                options={DestinationS.map(d => ({ value: d, label: d }))}
                allowClear
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn variant="primary" onClick={handleSearch} disabled={(dispatchLoading || campLoading) || !assetTypeId}>
              {(dispatchLoading || campLoading) ? "جارٍ البحث..." : "🔍 بحث"}
            </Btn>
            <Btn variant="ghost" onClick={handleReset} small>🔄 إعادة تعيين</Btn>
          </div>
        </div>

        {error && (
          <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ═══════════════ SECTION 1: أوامر الخروج (المستلَم) ═══════════════ */}
        {(dispatchLoading || dispatchResult) && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ background: "#1a56db", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 16px", fontWeight: 700, fontSize: 14 }}>
              🚚 التوزيع من أوامر الخروج (المستلَم)
            </div>

            {dispatchLoading ? <Loader text="جارٍ تحميل أوامر الخروج..." /> : dispatchResult && (
              <div style={{ border: "1px solid #e8e8e8", borderTop: "none", borderRadius: "0 0 10px 10px", padding: 14 }}>
                {/* Summary */}
                <div style={{ background: "linear-gradient(135deg, #EBF5FB 0%, #EAFAF1 100%)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
                    <b>نوع الأصل:</b> {dispatchResult.AssetTypeName}
                    {dispatchResult.ModelName && <> — <b>الموديل:</b> {dispatchResult.ModelName} {dispatchResult.Brand && `(${dispatchResult.Brand})`} {dispatchResult.ModelNumber && `- ${dispatchResult.ModelNumber}`}</>}
                    {dispatchResult.Destination && <> — <b>الوجهة:</b> {dispatchResult.Destination}</>}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: "#888" }}>الكمية المستلَمة</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#27AE60" }}>{dispatchResult.GrandTotal || 0}</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: "#888" }}>عدد الأوامر</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#2E86C1" }}>{dispatchResult.TotalOrders || 0}</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: "#888" }}>عدد المخيمات</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#8E44AD" }}>{dispatchResult.Distribution?.length || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {dispatchResult.Distribution && dispatchResult.Distribution.length > 0 ? (
                  <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#fafafa" }}>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>#</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>المخيم</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>الوجهة</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#555" }}>عدد الأوامر</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#555" }}>الكمية المستلَمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatchResult.Distribution.map((d, i) => (
                          <tr key={d.CampId} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "8px 12px", color: "#888" }}>{i + 1}</td>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{d.CampName}</td>
                            <td style={{ padding: "8px 12px", color: "#555" }}>{d.Destination || "—"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#2E86C1", fontWeight: 700 }}>{d.OrdersCount}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <span style={{ background: "#EAFAF1", color: "#27AE60", padding: "3px 12px", borderRadius: 6, fontWeight: 800, fontSize: 14, display: "inline-block", minWidth: 40 }}>
                                {d.TotalReceived}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                          <td colSpan={3} style={{ padding: "8px 12px", fontWeight: 700 }}>الإجمالي</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700 }}>{dispatchResult.TotalOrders}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 800, fontSize: 15 }}>{dispatchResult.GrandTotal}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 24, color: "#888", background: "#fafafa", borderRadius: 8 }}>
                    📭 لا توجد أوامر خروج مستلَمة لهذا الموديل
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ SECTION 2: الجرد اليدوي ═══════════════ */}
        {(campLoading || campResult.length >= 0) && (dispatchResult || campResult.length > 0 || campLoading) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: "#8E44AD", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 16px", fontWeight: 700, fontSize: 14 }}>
              🏕 التوزيع من الجرد اليدوي للمخيمات
            </div>

            {campLoading ? <Loader text="جارٍ تحميل الجرد اليدوي..." /> : (
              <div style={{ border: "1px solid #e8e8e8", borderTop: "none", borderRadius: "0 0 10px 10px", padding: 14 }}>
                {/* Summary */}
                <div style={{ background: "linear-gradient(135deg, #F5EEF8 0%, #FDEBD0 100%)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: "#888" }}>إجمالي الكمية الفعلية</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#8E44AD" }}>{campTotal}</div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, minWidth: 130 }}>
                      <div style={{ fontSize: 11, color: "#888" }}>عدد السجلات</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#E67E22" }}>{campResult.length}</div>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {campResult.length > 0 ? (
                  <div style={{ overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#fafafa" }}>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>#</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>المخيم</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>المكان</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#555" }}>الموديل</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#555" }}>الكمية</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "#555" }}>حالة الجرد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campResult.map((r, i) => (
                          <tr key={`${r.CampAdjustmentId}-${r.CampName}-${r.LocationType}-${i}`} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "8px 12px", color: "#888" }}>{i + 1}</td>
                            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{r.CampName}</td>
                            <td style={{ padding: "8px 12px", color: "#555" }}>{getLocationLabel(r.LocationType)}</td>
                            <td style={{ padding: "8px 12px", color: "#555" }}>
                              {r.ModelName || <Tag>غير محدد</Tag>}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              {r.ActualQty != null ? (
                                <span style={{ background: "#F5EEF8", color: "#8E44AD", padding: "3px 12px", borderRadius: 6, fontWeight: 800, fontSize: 14, display: "inline-block", minWidth: 40 }}>
                                  {r.ActualQty}
                                </span>
                              ) : <Tag color="orange">لم يُحدد</Tag>}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              {r.Status === 2 ? <Tag color="green">مكتمل</Tag> : <Tag color="blue">قيد التنفيذ</Tag>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                          <td colSpan={4} style={{ padding: "8px 12px", fontWeight: 700 }}>الإجمالي</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 800, fontSize: 15 }}>{campTotal}</td>
                          <td style={{ padding: "8px 12px" }}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 24, color: "#888", background: "#fafafa", borderRadius: 8 }}>
                    📭 لا توجد بيانات جرد لهذا الموديل
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 20, textAlign: "left", borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </div>
      </div>
    </div>
  );
};

export default SearchModelDistributionModal;