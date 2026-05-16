import { useState, useEffect, useCallback, useContext } from "react";
import "./OutOrder.scss";
import { getFromApi, postToApi, putToApi, deleteFromApi } from "../../apis/apis";
import UserContext from "../../contexts/user-context/UserProvider";
import { Select as AntSelect } from "antd";
import SearchModelDistributionModal from "../shared/SearchModelDistributionModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────
const api = {
  // ── Dispatch Orders ──────────────────────────
  getDispatchOrders: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return getFromApi(`DispatchOrder/get-all-dispatchOrders?${params}`);
  },
  getDispatchOrder: (id) =>
    getFromApi(`DispatchOrder/get-dispatchOrder-byId?id=${id}`),
  createDispatchOrder: (body) =>
    postToApi(`DispatchOrder/add-dispatchOrder`, body),
  updateDispatchOrder: (id, body) =>
    putToApi(`DispatchOrder/update-dispatchOrder`, { ...body, DispatchOrderId: id }),
  updateDispatchOrderModels: (body) =>
  putToApi(`DispatchOrder/update-dispatchOrder-models`, body),
  deleteDispatchOrder: (id) =>
    deleteFromApi(`DispatchOrder/delete-dispatchOrder?id=${id}`),
  approveDispatchOrder: (DispatchOrderId, approverId) =>
    postToApi(`DispatchOrder/set-approve`, { DispatchOrderId, approverId }),
  confirmScan: (orderId, phase, scannedAssetIds, notes = "") =>
    postToApi(`DispatchOrder/scan-dispatchOrder`, { DispatchOrderId: orderId, phase, scannedAssetIds, notes }),
  confirmLoading: (dispatchOrderId, itemIds) =>
    postToApi(`DispatchOrder/confirm-loading`, { dispatchOrderId, itemIds }),
  confirmReceiving: (dispatchOrderId, items) =>
    postToApi(`DispatchOrder/confirm-receiving`, { dispatchOrderId, items }),
  setInTransit: (dispatchOrderId) =>
    postToApi(`DispatchOrder/set-in-transit`, { dispatchOrderId }),
  // ── Lookups ──────────────────────────────────
  getAssetTypes: () =>
    getFromApi(`DispatchOrder/get-asset-types`),
  getAssetModels: (AssetTypeId) =>
    getFromApi(`DispatchOrder/get-asset-models?AssetTypeId=${AssetTypeId}`),
  getModelStockQuantity: (assetModelId) =>
  getFromApi(`AssetModel/get-model-stockQuantity?assetModelId=${assetModelId}`),
  getCamps: () =>
    getFromApi(`DispatchOrder/get-camps`),
  getCampManagers: () =>
    getFromApi(`DispatchOrder/get-camp-managers`),
  getModelDistribution: (assetTypeId, assetModelId, destination) => {
  const params = new URLSearchParams();
  params.append("assetTypeId", assetTypeId);
  if (assetModelId) params.append("assetModelId", assetModelId);
  if (destination) params.append("destination", destination);
  return getFromApi(`DispatchOrder/get-model-distribution?${params.toString()}`);
},
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  Draft: { label: "مسودة", color: "#95A5A6", bg: "#F4F6F6" },
  Approved: { label: "معتمد", color: "#2E86C1", bg: "#EBF5FB" },
  Loaded: { label: "تم التحميل", color: "#E67E22", bg: "#FEF9E7" },
  InTransit: { label: "في الطريق", color: "#D4AC0D", bg: "#FDFEFE" },
  Received: { label: "تم الاستلام", color: "#27AE60", bg: "#EAFAF1" },
  PartialReceived: { label: "استلام جزئي", color: "#E74C3C", bg: "#FDEDEC" },
};
const DestinationS = ["منى", "عرفة", "مزدلفة"];

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const Loader = ({ text = "جارٍ التحميل..." }) => (
  <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div><div>{text}</div>
  </div>
);

const ErrorMsg = ({ msg, onRetry }) => (
  <div style={{ textAlign: "center", padding: 30, color: "#E74C3C" }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
    <div style={{ marginBottom: 12 }}>{msg || "حدث خطأ"}</div>
    {onRetry && <Btn variant="outline" onClick={onRetry} small>إعادة المحاولة</Btn>}
  </div>
);

const StatusBadge = ({ Status }) => {
  const cfg = STATUS_CONFIG[Status] || { label: Status, color: "#666", bg: "#eee" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`, whiteSpace: "nowrap" }}>{cfg.label}</span>
  );
};

const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, small }) => {
  const base = { padding: small ? "5px 12px" : "8px 20px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 14, fontWeight: 600, transition: "all .15s", opacity: disabled ? .5 : 1, ...style };
  const variants = { primary: { background: "#1a56db", color: "#fff" }, success: { background: "#27AE60", color: "#fff" }, danger: { background: "#E74C3C", color: "#fff" }, outline: { background: "#fff", color: "#1a56db", border: "1.5px solid #1a56db" }, ghost: { background: "transparent", color: "#555", border: "1px solid #ddd" }, warning: { background: "#E67E22", color: "#fff" } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, value, onChange, type = "text", required, readOnly, placeholder, style = {} }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <input type={type} value={value || ""} onChange={e => onChange && onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, background: readOnly ? "#f5f5f5" : "#fff", outline: "none", boxSizing: "border-box", direction: "rtl", ...style }} />
  </div>
);

const Select = ({ label, value, onChange, options = [], required, placeholder = "اختر...", disabled }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <select value={value || ""} onChange={e => onChange && onChange(e.target.value)} disabled={disabled}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, background: "#fff", direction: "rtl", boxSizing: "border-box" }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TableComp = ({ cols, rows, onRowClick }) => (
  <div className="outOrders-tableWrapper">
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, direction: "rtl" }}>
      <thead><tr style={{ background: "#F7F8FA" }}>
        {cols.map(c => <th key={c.key} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#555", borderBottom: "2px solid #e8e8e8", whiteSpace: "nowrap" }}>{c.label}</th>)}
      </tr></thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>لا توجد بيانات</td></tr>
        ) : rows.map((row, i) => (
          <tr key={i} onClick={() => onRowClick && onRowClick(row)}
            style={{ borderBottom: "1px solid #f0f0f0", cursor: onRowClick ? "pointer" : "default", background: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background .1s" }}
            onMouseEnter={e => onRowClick && (e.currentTarget.style.background = "#EBF5FB")}
            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}>
            {/* {cols.map(c => <td key={c.key} style={{ padding: "10px 14px", verticalAlign: "middle" }}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}</td>)} */}
            {cols.map(c => <td key={c.key} style={{ padding: "10px 14px", verticalAlign: "middle" }}>{c.render ? c.render(row[c.key], row, i) : (row[c.key] ?? "—")}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────
// ORDER FORM (Create / Edit) — DYNAMIC API
// ─────────────────────────────────────────────
const emptyItem = () => ({ _id: Math.random(), AssetTypeId: "", AssetModelId: "", RequestedQuantity: 1, notes: "" });
const emptyForm = () => ({ DispatchDate: new Date().toISOString().slice(0, 10), Destination: "", campIds: [], CampManagerId: "", VehiclePlateNumber: "", DriverName: "", Notes: "", Items: [emptyItem()], ForAllCamps: false, IsGeneralServices: false });
const OrderForm = ({ initial, assetTypes, camps = [], campManagers = [], onSave, onCancel }) => {
  // const [form, setForm] = useState(initial ? { ...initial, campIds: initial.campIds || [], CampManagerId: initial.CampManagerId || "", Items: (initial.Items || []).map(it => ({ _id: Math.random(), AssetTypeId: it.AssetTypeId || "", AssetModelId: it.AssetModelId || "", RequestedQuantity: it.RequestedQuantity || 1, notes: it.notes || "" })) } : emptyForm());
  const [form, setForm] = useState(initial ? {
  ...initial,
  DispatchDate: (initial.DispatchDate || "").slice(0, 10),
  campIds: initial.campIds || initial.Camps?.map(c => c.CampId) || [],
  ForAllCamps: initial.ForAllCamps || false,
  IsGeneralServices: initial.IsGeneralServices || false,
  CampManagerId: initial.CampManagerId || "",
  Items: (initial.Items || []).map(it => ({
    _id: Math.random(),
    AssetTypeId: it.AssetTypeId || "",
    AssetModelId: it.AssetModelId || "",
    RequestedQuantity: it.RequestedQuantity || 1,
    notes: it.notes || it.Notes || ""
  }))
} : emptyForm());
  const [modelMap, setModelMap] = useState({});
    const [stockMap, setStockMap] = useState({});  // { assetModelId: quantity }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fetchModels = useCallback(async (typeId) => {
    if (!typeId || modelMap[typeId]) return;
    try { const m = await api.getAssetModels(typeId); setModelMap(prev => ({ ...prev, [typeId]: m || [] })); }
    catch { setModelMap(prev => ({ ...prev, [typeId]: [] })); }
  }, [modelMap]);
  const fetchStock = useCallback(async (modelId) => {
  // if (!modelId || stockMap[modelId] !== undefined) return;
     if (!modelId) return;  //remove this later, update with before it

  try {
    const result = await api.getModelStockQuantity(modelId);
    setStockMap(prev => ({ ...prev, [modelId]: result?.stockQuantity ?? result?.StockQuantity ?? result ?? 0 }));
  } catch {
    setStockMap(prev => ({ ...prev, [modelId]: 0 }));
  }
  }, []); //remove this later, update with after it
// }, [stockMap]);   

  // useEffect(() => { if (initial?.Items) initial.Items.forEach(it => { if (it.AssetTypeId) fetchModels(it.AssetTypeId); }); }, []); // eslint-disable-line
  useEffect(() => { if (initial?.Items) initial.Items.forEach(it => { if (it.AssetTypeId) fetchModels(it.AssetTypeId); if (it.AssetModelId) fetchStock(it.AssetModelId); }); }, []); // eslint-disable-line
  // const updateItem = (idx, k, v) => { setForm(f => { const Items = [...f.Items]; Items[idx] = { ...Items[idx], [k]: v }; if (k === "AssetTypeId") { Items[idx].AssetModelId = ""; if (v) fetchModels(v); } return { ...f, Items }; }); };
  const updateItem = (idx, k, v) => { setForm(f => { const Items = [...f.Items]; Items[idx] = { ...Items[idx], [k]: v }; if (k === "AssetTypeId") { Items[idx].AssetModelId = ""; if (v) fetchModels(v); } if (k === "AssetModelId" && v) { fetchStock(v); } return { ...f, Items }; }); };
  const addItem = () => setForm(f => ({ ...f, Items: [...f.Items, emptyItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, Items: f.Items.filter((_, i) => i !== idx) }));

  const validate = () => {
    if (!form.Destination) return "الوجهة مطلوبة";
    // if (!form.receiverName) return "اسم المستلم مطلوب";
    if (form.campIds.length === 0 && !form.IsGeneralServices) return "اختر مخيم واحد على الأقل أو خدمات عامة";
    if (!form.CampManagerId) return "المسئول مطلوب";
    // for (let i = 0; i < form.Items.length; i++) { const it = form.Items[i]; if (!it.AssetTypeId) return `السطر ${i + 1}: نوع الأصل مطلوب`; if (!it.RequestedQuantity || it.RequestedQuantity < 1) return `السطر ${i + 1}: الكمية مطلوبة`; const t = assetTypes.find(x => String(x.AssetTypeId) === String(it.AssetTypeId)); }
    for (let i = 0; i < form.Items.length; i++) { const it = form.Items[i]; if (!it.AssetTypeId) return `السطر ${i + 1}: نوع الأصل مطلوب`; if (!it.AssetModelId) return `السطر ${i + 1}: الموديل مطلوب`; if (!it.RequestedQuantity || it.RequestedQuantity < 1) return `السطر ${i + 1}: الكمية مطلوبة`; const stock = stockMap[it.AssetModelId]; if (stock !== undefined && it.RequestedQuantity > stock) return `السطر ${i + 1}: الكمية المطلوبة (${it.RequestedQuantity}) أكبر من المتوفر (${stock})`; }
    return null;
  };

  const handleSave = async (Status) => {
    const err = validate(); if (err) { setError(err); return; }
    setError(null); setSaving(true);
    try {
      const payload = { DispatchDate: form.DispatchDate, Destination: form.Destination, campIds: form.IsGeneralServices ? [] : form.campIds, ForAllCamps: form.ForAllCamps, IsGeneralServices: form.IsGeneralServices, Destination: form.Destination, campIds: form.campIds, CampManagerId: Number(form.CampManagerId), VehiclePlateNumber: form.VehiclePlateNumber || null, DriverName: form.DriverName || null, Notes: form.Notes || null, Items: form.Items.map(it => ({ AssetTypeId: Number(it.AssetTypeId), AssetModelId: it.AssetModelId ? Number(it.AssetModelId) : null, RequestedQuantity: Number(it.RequestedQuantity), notes: it.notes || null })) };
      let result;
      if (initial?.DispatchOrderId) { result = await api.updateDispatchOrder(initial.DispatchOrderId, payload); }
      else { result = await api.createDispatchOrder(payload); }
      if (result.success) { if (Status === "Approved" && result.dispatchOrderId) await api.approveDispatchOrder(result.dispatchOrderId, 1); onSave(result); }
      else setError(result.message || "فشل الحفظ");
    } catch (e) { setError(e.message || "فشل الاتصال"); } finally { setSaving(false); }
  };

  const typeOpts = assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }));

  return (
    <div>
      {error && <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, direction: "rtl" }}>⚠️ {error}</div>}
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📋 معلومات الأمر</h4>
        <div className="outOrders-formGrid">
          <Input label="تاريخ الخروج" value={form.DispatchDate} onChange={v => setField("DispatchDate", v)} type="date" required />
          <Select label="الوجهة" value={form.Destination} onChange={v => setField("Destination", v)} options={DestinationS.map(d => ({ value: d, label: d }))} required />
          <div style={{ marginBottom: 14, gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>
              المخيمات <span style={{ color: "#E74C3C" }}>*</span>
            </label>
            <div style={{
              border: "1.5px solid #dde1e7", borderRadius: 8, padding: 8,
              minHeight: 42, display: "flex", flexWrap: "wrap", gap: 6,
              background: "#fff", direction: "rtl",
            }}>
              {form.campIds.map(id => {
                const camp = camps.find(c => c.CampId === id);
                if (!camp) return null;
                return (
                  <span key={id} style={{
                    background: "#EBF5FB", color: "#1a56db", padding: "3px 10px",
                    borderRadius: 20, fontSize: 12, fontWeight: 600,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    {camp.CampName}
                    <button onClick={() => setField("campIds", form.campIds.filter(x => x !== id))}
                      style={{
                        background: "none", border: "none", color: "#E74C3C",
                        cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0
                      }}>×</button>
                  </span>
                );
              })}
              <button
                onClick={() => {
                  if (form.campIds.length === camps.length) {
                    setField("campIds", []);
                    setField("ForAllCamps", false);
                  } else {
                    setField("campIds", camps.map(c => c.CampId));
                    setField("ForAllCamps", true);
                  }
                }}
                style={{
                  background: form.campIds.length === camps.length ? "#E74C3C" : "#27AE60",
                  color: "#fff", border: "none", borderRadius: 16,
                  padding: "3px 12px", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {form.campIds.length === camps.length ? "✕ إلغاء الكل" : "✓ الكل"}
              </button>
              <button
                onClick={() => {
                  setField("campIds", []);
                  setField("ForAllCamps", false);
                  setField("IsGeneralServices", !form.IsGeneralServices);
                }}
                style={{
                  background: form.IsGeneralServices ? "#8E44AD" : "#f0f0f0",
                  color: form.IsGeneralServices ? "#fff" : "#555",
                  border: form.IsGeneralServices ? "none" : "1px solid #ccc",
                  borderRadius: 16, padding: "3px 12px", fontSize: 11,
                  fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {form.IsGeneralServices ? "✕ خدمات عامة" : "🏗 خدمات عامة للمخيمات"}
              </button>
              {!form.IsGeneralServices && form.campIds.length !== camps.length && <select
                value=""
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val && !form.campIds.includes(val)) {
                    const newIds = [...form.campIds, val];
                    setField("campIds", newIds);
                    setField("ForAllCamps", false);
                    setField("IsGeneralServices", false);
                    // Auto-fill manager from first camp that has one
                    if (!form.CampManagerId) {
                      const campWithMgr = camps.find(c => newIds.includes(c.CampId) && c.CampManagerId);
                      if (campWithMgr) setField("CampManagerId", campWithMgr.CampManagerId);
                    }
                  }
                }}
                style={{
                  border: "none", outline: "none", fontSize: 13, direction: "rtl",
                  flex: 1, minWidth: 140, background: "transparent"
                }}>
                <option value="">+ إضافة مخيم...</option>
                {camps
                  .filter(c => !form.campIds.includes(c.CampId))
                  .map(c => (
                    <option key={c.CampId} value={c.CampId}>
                      {c.CampName} — {c.Destination}
                    </option>
                  ))}
              </select>}
            </div>
          </div>
          {form.IsGeneralServices && (
            <div style={{ background: "#F5EEF8", border: "1px solid #D2B4DE", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: "#6C3483", direction: "rtl" }}>
              🏗 أمر خروج لخدمات عامة — غير مرتبط بمخيم محدد (كهربا, سباكة, إلخ)
            </div>
          )}
          {/* المسئول — Single select */}
          <Select
            label="المسئول (المستلم)"
            value={form.CampManagerId}
            onChange={v => setField("CampManagerId", v)}
            options={campManagers.map(m => ({
              value: m.CampManagerId,
              label: `${m.ManagerName} — ${m.ManagerPhone || ""}`,
            }))}
            required
          />
          <Input label="رقم لوحة السيارة" value={form.VehiclePlateNumber} onChange={v => setField("VehiclePlateNumber", v)} />
          <Input label="اسم السائق" value={form.DriverName} onChange={v => setField("DriverName", v)} />
        </div>
        <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>ملاحظات</label>
          <textarea value={form.Notes} onChange={e => setField("Notes", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, direction: "rtl", boxSizing: "border-box", resize: "vertical", minHeight: 60 }} /></div>
      </div>
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📦 بيان الأصناف</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, direction: "rtl" }}>
            <thead><tr style={{ background: "#e8edf3" }}>{["نوع الأصل *", "الموديل *", "الكمية المتوفرة", "الكمية *", "ملاحظات", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#555" }}>{h}</th>)}</tr></thead>
            <tbody>{form.Items.map((item, idx) => {
              const typeObj = assetTypes.find(t => String(t.AssetTypeId) === String(item.AssetTypeId)); const hasModels = typeObj?.hasModels; const models = modelMap[item.AssetTypeId] || [];
              return (<tr key={item._id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                {/* <td style={{ padding: "6px 8px", minWidth: 140 }}><select value={item.AssetTypeId} onChange={e => updateItem(idx, "AssetTypeId", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13 }}><option value="">اختر...</option>{typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td> */}
                <td style={{ padding: "6px 8px", minWidth: 180 }}>
  <AntSelect
    showSearch
    value={item.AssetTypeId || undefined}
    onChange={v => updateItem(idx, "AssetTypeId", v)}
    placeholder="اختر نوع الأصل..."
    optionFilterProp="label"
    style={{ width: "100%", direction: "rtl" }}
    options={typeOpts.map(o => ({ value: o.value, label: o.label }))}
    allowClear
    onClear={() => updateItem(idx, "AssetTypeId", "")}
  />
</td>
                {/* <td style={{ padding: "6px 8px", minWidth: 130 }}><select value={item.AssetModelId} onChange={e => updateItem(idx, "AssetModelId", e.target.value)} disabled={!item.AssetTypeId || models.length === 0} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13, opacity: (!item.AssetTypeId || models.length === 0) ? 0.5 : 1 }}><option value="">بدون موديل</option>{models.map(m => <option key={m.AssetModelId} value={m.AssetModelId}>{m.ModelName} - {m.Brand} - {m.ModelNumber}</option>)}</select></td> */}
                <td style={{ padding: "6px 8px", minWidth: 180 }}>
  <AntSelect
    showSearch
    value={item.AssetModelId || undefined}
    onChange={v => updateItem(idx, "AssetModelId", v)}
    placeholder="اختر الموديل..."
    optionFilterProp="label"
    style={{ width: "100%", direction: "rtl" }}
    disabled={!item.AssetTypeId || models.length === 0}
    options={models.map(m => ({ value: m.AssetModelId, label: `${m.ModelName} - ${m.Brand} - ${m.ModelNumber}` }))}
    allowClear
    onClear={() => updateItem(idx, "AssetModelId", "")}
  />
</td>
                <td style={{ padding: "6px 8px", minWidth: 100, textAlign: "center" }}>
  {item.AssetModelId ? (
    stockMap[item.AssetModelId] !== undefined ? (
      <span style={{
        fontWeight: 700,
        fontSize: 14,
        color: stockMap[item.AssetModelId] > 0 ? "#27AE60" : "#E74C3C",
        background: stockMap[item.AssetModelId] > 0 ? "#EAFAF1" : "#FDEDEC",
        padding: "4px 12px",
        borderRadius: 6,
        display: "inline-block"
      }}>
        {stockMap[item.AssetModelId]}
      </span>
    ) : <span style={{ color: "#aaa", fontSize: 12 }}>جارٍ التحميل...</span>
  ) : <span style={{ color: "#ccc" }}>—</span>}
</td>
                <td style={{ padding: "6px 8px", minWidth: 100 }}><input type="number" min={1} value={item.RequestedQuantity} onChange={e => updateItem(idx, "RequestedQuantity", Number(e.target.value))} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, textAlign: "center" }} /></td>
                <td style={{ padding: "6px 8px", minWidth: 130 }}><input value={item.Notes || ""} onChange={e => updateItem(idx, "Notes", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }} /></td>
                <td style={{ padding: "6px 8px" }}><button onClick={() => removeItem(idx)} disabled={form.Items.length === 1} style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", fontSize: 18 }}>🗑</button></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{ marginTop: 10 }}><Btn variant="ghost" onClick={addItem} small>+ إضافة سطر</Btn></div>
      </div>
      <div className="outOrders-btnGroup">
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="outline" onClick={() => handleSave("Draft")} disabled={saving}>{saving ? "جارٍ الحفظ..." : "💾 حفظ كمسودة"}</Btn>
        <Btn variant="success" onClick={() => handleSave("Approved")} disabled={saving}>✅ حفظ واعتماد</Btn>
      </div>
    </div>
  );
};
const OrderDetail = ({ orderId, onBack, onEdit, onRefresh, onUpdateModels  }) => {
  const {user} = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockMap, setStockMap] = useState({});  // { assetModelId: quantity }
  const [checkedItems, setCheckedItems] = useState([]);
  const [receivedQty, setReceivedQty] = useState({});  // { itemId: qty }
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const loadOrder = useCallback(async () => { setLoading(true); setError(null); try { const data = await api.getDispatchOrder(orderId); setOrder(data); setCheckedItems([]); setReceivedQty({}); } catch (e) { setError(e.message); } finally { setLoading(false); } }, [orderId]);
  useEffect(() => { loadOrder(); }, [loadOrder]);

  if (loading) return <Loader text="جارٍ تحميل تفاصيل الأمر..." />;
  if (error) return <ErrorMsg msg={error} onRetry={loadOrder} />;
  if (!order) return <ErrorMsg msg="أمر الخروج غير موجود" />;

  const { Status, Items = [], ScannedAssets = [] } = order;
  const isApproved = Status === "Approved";
  const isReceiving = Status === "InTransit";
  const showCheckbox = isApproved || isReceiving;

  const allChecked = Items.length > 0 && checkedItems.length === Items.length;
  const toggleItem = (itemId) => {
    setCheckedItems(prev => {
      if (prev.includes(itemId)) return prev.filter(id => id !== itemId);
      // عند التحديد في الاستلام: ضع الكمية الافتراضية = LoadedQuantity
      if (isReceiving && !receivedQty[itemId]) {
        const item = Items.find(i => i.DispatchOrderItemId === itemId);
        setReceivedQty(q => ({ ...q, [itemId]: item?.LoadedQuantity || item?.RequestedQuantity || 0 }));
      }
      return [...prev, itemId];
    });
  };
  const toggleAll = () => {
    if (allChecked) { setCheckedItems([]); }
    else {
      const allIds = Items.map(i => i.DispatchOrderItemId);
      setCheckedItems(allIds);
      if (isReceiving) {
        const qtyMap = {};
        Items.forEach(i => { qtyMap[i.DispatchOrderItemId] = i.LoadedQuantity || i.RequestedQuantity || 0; });
        setReceivedQty(q => ({ ...q, ...qtyMap }));
      }
    }
  };

  const updateReceivedQty = (itemId, value) => {
    const item = Items.find(i => i.DispatchOrderItemId === itemId);
    const max = item?.LoadedQuantity || item?.RequestedQuantity || 0;
    const qty = Math.max(0, Math.min(Number(value) || 0, max));
    setReceivedQty(q => ({ ...q, [itemId]: qty }));
  };

  // تحميل
  const handleConfirmLoading = async () => {
    if (checkedItems.length === 0) { alert("اختر بند واحد على الأقل"); return; }
    if (!window.confirm(`سيتم تحميل ${checkedItems.length} من ${Items.length} بنود. متأكد؟`)) return;
    setLoadingConfirm(true);
    try {
      const r = await api.confirmLoading(order.DispatchOrderId, checkedItems);
      if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل التحميل");
    } catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };

  // استلام
  const handleConfirmReceiving = async () => {
    if (checkedItems.length === 0) { alert("اختر بند واحد على الأقل"); return; }
    const items = checkedItems.map(itemId => ({
      dispatchOrderItemId: itemId,
      receivedQuantity: receivedQty[itemId] ?? Items.find(i => i.DispatchOrderItemId === itemId)?.LoadedQuantity ?? 0
    }));
    const totalReq = items.reduce((s, i) => s + (Items.find(x => x.DispatchOrderItemId === i.dispatchOrderItemId)?.LoadedQuantity || 0), 0);
    const totalRec = items.reduce((s, i) => s + i.receivedQuantity, 0);
    const msg = totalRec < totalReq
      ? `سيتم استلام ${totalRec} من ${totalReq} (نقص ${totalReq - totalRec}). متأكد؟`
      : `سيتم تأكيد استلام ${checkedItems.length} بنود. متأكد؟`;
    if (!window.confirm(msg)) return;
    setLoadingConfirm(true);
    try {
      const r = await api.confirmReceiving(order.DispatchOrderId, items);
      if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل الاستلام");
    } catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };
const handleSharePDF = async () => {
  const element = document.getElementById("print-area");
  if (!element) return;

  // 1. خزّن الأنماط الأصلية للعناصر اللي هنعدلها
  const printHeader = element.querySelector(".print-header");
  const printSigs = element.querySelector(".print-signatures");
  
  const originalStyles = {
    header: printHeader?.style.display,
    sigs: printSigs?.style.display,
    elementWidth: element.style.width,
    elementMaxWidth: element.style.maxWidth,
  };

  // 2. اعمل قائمة بكل الـ scrollable containers و رجّعها لـ overflow visible
  const scrollables = element.querySelectorAll('[class*="tableWrapper"], div');
  const scrollableOriginals = [];
  
  scrollables.forEach(el => {
    const computed = window.getComputedStyle(el);
    if (computed.overflowX === "auto" || computed.overflowX === "scroll" ||
        computed.overflowY === "auto" || computed.overflowY === "scroll" ||
        computed.overflow === "auto" || computed.overflow === "scroll") {
      scrollableOriginals.push({
        el,
        overflow: el.style.overflow,
        overflowX: el.style.overflowX,
        overflowY: el.style.overflowY,
        maxHeight: el.style.maxHeight,
        height: el.style.height,
      });
      el.style.overflow = "visible";
      el.style.overflowX = "visible";
      el.style.overflowY = "visible";
      el.style.maxHeight = "none";
      el.style.height = "auto";
    }
  });

  // 3. أظهر عناصر الطباعة المخفية
  if (printHeader) printHeader.style.display = "block";
  if (printSigs) printSigs.style.display = "block";

  // 4. وسّع الـ element ليأخذ عرضه الفعلي
  element.style.width = "auto";
  element.style.maxWidth = "none";

  // 5. انتظر شوية عشان الـ DOM يحدّث نفسه
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // 6. خد scrollWidth و scrollHeight (المقاسات الحقيقية بالـ scroll)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    const imgData = canvas.toDataURL("image/png");
    
    // 7. PDF بحجم يتناسب مع المحتوى (لو طويل، يتقسم على صفحات)
    // const pdf = new jsPDF("p", "mm", "a4");
    const pdf = new jsPDF({
  orientation: canvas.width > canvas.height ? "l" : "p",
  unit: "mm",
  format: "a4",
});
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // الصفحة الأولى
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // باقي الصفحات لو المحتوى طويل
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `إذن_خروج_${order.DispatchOrderNumber}.pdf`;

    // 8. مشاركة أو تحميل
    if (navigator.share && navigator.canShare) {
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `إذن خروج ${order.DispatchOrderNumber}`,
          text: `إذن خروج رقم ${order.DispatchOrderNumber} — ${order.Destination}`,
          files: [file],
        });
        return;
      }
    }

    pdf.save(fileName);
  } catch (e) {
    console.error(e);
    alert("فشلت المشاركة: " + e.message);
  } finally {
    // 9. رجّع كل الأنماط الأصلية
    if (printHeader) printHeader.style.display = originalStyles.header || "none";
    if (printSigs) printSigs.style.display = originalStyles.sigs || "none";
    element.style.width = originalStyles.elementWidth || "";
    element.style.maxWidth = originalStyles.elementMaxWidth || "";
    
    scrollableOriginals.forEach(({ el, overflow, overflowX, overflowY, maxHeight, height }) => {
      el.style.overflow = overflow || "";
      el.style.overflowX = overflowX || "";
      el.style.overflowY = overflowY || "";
      el.style.maxHeight = maxHeight || "";
      el.style.height = height || "";
    });
  }
};

  // const infoRows = [["رقم الأمر", order.DispatchOrderNumber], ["التاريخ", order.DispatchDate?.slice(0, 10)], ["الوجهة", order.Destination],
  // ["المخيمات", order.Camps?.map(c => c.CampName).join(" ، ") || "—"], ["المستلم", order.ManagerName],
  // ["هاتف المستلم", order.ManagerPhone], ["لوحة السيارة", order.VehiclePlateNumber], ["السائق", order.DriverName], ["ملاحظات", order.Notes]];
  const infoRows = [["رقم الأمر", order.DispatchOrderNumber], ["التاريخ", order.DispatchDate?.slice(0, 10)], ["الوجهة", order.Destination],
  ["المستلم", order.ManagerName], ["هاتف المستلم", order.ManagerPhone], ["لوحة السيارة", order.VehiclePlateNumber],
  ["السائق", order.DriverName], ["ملاحظات", order.Notes], ["المخيمات", order.Camps?.map(c => c.CampName).join(" ، ") || "—"]];
  const handleApprove = async () => { try { const r = await api.approveDispatchOrder(order.DispatchOrderId, 1); if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message); } catch (e) { alert(e.message); } };
  const handleDelete = async () => { if (!window.confirm("هل أنت متأكد من حذف هذا الأمر؟")) return; try { const r = await api.deleteDispatchOrder(order.DispatchOrderId); if (r.success) { onRefresh?.(); onBack(); } else alert(r.message); } catch (e) { alert(e.message); } };
  const handleSetInTransit = async () => {
    if (!window.confirm("هل تم خروج السيارة فعلاً؟")) return;
    setLoadingConfirm(true);
    try {
      const r = await api.setInTransit(order.DispatchOrderId);
      if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل التحديث");
    } catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };
  return (
    <div className="outOrders-container">
      <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          left: 0 !important;
          padding: 20px 40px !important;
          background: #fff !important;
        }
        .no-print { display: none !important; }
        table { border-collapse: collapse !important; width: 100% !important; }
        th, td { border: 1px solid #333 !important; padding: 8px 12px !important; font-size: 12px !important; }
        th { background: #e8e8e8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        input[type="checkbox"] { display: none !important; }
        nav, header, [class*="navbar"], [class*="sidebar"], [class*="Navbar"] { display: none !important; }
        .print-header { display: block !important; }
        .print-header > div { display: block !important; }
        .print-signatures { display: block !important; }
        .print-signatures > div { display: grid !important; }
       #print-area .row-data {
  display: grid !important;
  grid-template-columns: 1fr 1fr 1fr !important;
  gap: 4px 40px !important;
  padding: 10px 30px !important;
}
#print-area .row-data > div {
  padding: 2px 0 !important;
}
#print-area .row-data > div > span:first-child {
  min-width: unset !important;
  margin-left: 8px !important;
}
        @page { size: A4 portrait; margin: 15mm; }
      }
    `}</style>

      {/* ===== عنوان الصفحة + زرار الرجوع — يختفي عند الطباعة ===== */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1a56db" }}>← رجوع</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>تفاصيل أمر الخروج — {order.DispatchOrderNumber}</h2>
        <StatusBadge status={Status} />
      </div>

      {/* ===== بداية منطقة الطباعة ===== */}
      <div id="print-area">

        {/* رأس الطباعة — مخفي على الشاشة، يظهر فقط عند الطباعة */}
        <div style={{ display: "none" }} className="print-header">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>أوقاف أبناء عبد العزيز الراجحي</h2>
            <p style={{ margin: "4px 0", fontSize: 14, color: "#555" }}>إذن خروج أصول من المستودع</p>
            <hr style={{ border: "1px solid #333", margin: "10px 0" }} />
          </div>
        </div>

        {/* معلومات الأمر */}
        <div className="row-data" style={{ gap: "4px 0", background: "#F7F8FA", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          {infoRows.map(([k, v]) => v ?
            <div key={k} style={{ padding: "4px 0", display: "flex", gap: 8 }}><span style={{ fontWeight: 600, color: "#555", minWidth: 110, fontSize: 13 }}>{k}:</span><span style={{ fontSize: 13 }}>{v}</span></div> : null)}
        </div>

        {/* عنوان الجدول */}
        <h4 style={{ marginBottom: 10 }}>
          {isApproved ? "📦 تحديد البنود للتحميل" : isReceiving ? "📋 تحديد البنود للاستلام" : "بيان الأصناف"}
        </h4>

        {/* جدول البنود — نفس TableComp الموجود عندك بالضبط */}
        <TableComp
          cols={[
            ...(showCheckbox ? [{
              key: "_check",
              label: <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 18, height: 18, cursor: "pointer" }} />,
              render: (_, row) => <input type="checkbox" checked={checkedItems.includes(row.DispatchOrderItemId)} onChange={() => toggleItem(row.DispatchOrderItemId)} style={{ width: 18, height: 18, cursor: "pointer" }} />
            }] : []),
            { key: "AssetTypeName", label: "نوع الأصل" },
            { key: "ModelName", label: "الموديل" },
            { key: "RequestedQuantity", label: "المطلوب" },
            { key: "LoadedQuantity", label: "المحمّل" },
            ...(isReceiving ? [{
              key: "_receivedInput", label: "الكمية المستلمة",
              render: (_, row) => checkedItems.includes(row.DispatchOrderItemId) ? (
                <input type="number" min={0} max={row.LoadedQuantity || row.RequestedQuantity}
                  value={receivedQty[row.DispatchOrderItemId] ?? row.LoadedQuantity ?? 0}
                  onChange={e => updateReceivedQty(row.DispatchOrderItemId, e.target.value)}
                  style={{ width: 70, padding: "4px 6px", borderRadius: 6, border: "1.5px solid #2E86C1", fontSize: 14, textAlign: "center", fontWeight: 700 }} />
              ) : <span style={{ color: "#aaa" }}>—</span>
            }] : [
              { key: "ReceivedQuantity", label: "المستلَم" }
            ]),
            {
              key: "_diff", label: "الفرق", render: (_, row) => {
                if (Status !== "Received" && Status !== "PartialReceived") return <span style={{ color: "#aaa" }}>—</span>;
                const d = (row.RequestedQuantity || 0) - (row.ReceivedQuantity || 0);
                return <span style={{ color: d > 0 ? "#E74C3C" : d < 0 ? "#E67E22" : "#27AE60", fontWeight: 700 }}>{d > 0 ? `-${d}` : d < 0 ? `+${Math.abs(d)}` : "✓"}</span>;
              }
            },
          ]}
          rows={Items}
        />

        {/* الأصول المقروءة بالـ RFID */}
        {ScannedAssets?.length > 0 && (
          <>
            <h4 style={{ marginTop: 20, marginBottom: 10 }}>الأصول الفعلية (RFID)</h4>
            <TableComp cols={[{ key: "AssetBarcode", label: "الباركود" }, { key: "RfidCode", label: "RFID" }, { key: "AssetName", label: "الأصل" }, { key: "ScanPhase", label: "المرحلة", render: v => v === "Loaded" ? "🚚 تحميل" : "📦 استلام" }, { key: "ScannedDate", label: "التاريخ", render: v => v?.slice(0, 16).replace("T", " ") }]} rows={ScannedAssets} />
          </>
        )}

        {/* توقيعات — مخفية على الشاشة، تظهر فقط عند الطباعة */}
        <div style={{ display: "none" }} className="print-signatures">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginTop: 40, textAlign: "center", direction: "rtl" }}>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 30 }}>أمين المستودع</p>
              <p>الاسم: ........................</p>
              <p>التوقيع: ........................</p>
            </div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 30 }}>مشرف المستودع</p>
              <p>الاسم: ........................</p>
              <p>التوقيع: ........................</p>
            </div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 30 }}>المستلم</p>
              <p>الاسم: {order.ManagerName || "........................"}</p>
              <p>التوقيع: ........................</p>
            </div>
          </div>
        </div>

      </div>
      {/* ===== نهاية منطقة الطباعة ===== */}

      {/* ===== الأزرار — تختفي عند الطباعة ===== */}
      <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
         {user?.user?.Permissions?.includes("UpdateModelsDispatchOrders") &&<Btn variant="primary" onClick={() => onUpdateModels(order)} style={{ background: "#8E44AD" }}>
    📋 تحديث الموديلات
  </Btn>}
  {user?.user?.Permissions?.includes("EditDispatchOrders") && <Btn variant="outline" onClick={() => onEdit(order)}>✏️ تعديل</Btn>}
        {Status === "Draft" && (<>
            {/* {user?.user?.Permissions?.includes("EditDispatchOrders") && <Btn variant="outline" onClick={() => onEdit(order)}>✏️ تعديل</Btn>} */}
  {user?.user?.Permissions?.includes("ApproveDispatchOrders") && <Btn variant="success" onClick={handleApprove}>✅ اعتماد</Btn>}
  {user?.user?.Permissions?.includes("DeleteDispatchOrders") && <Btn variant="danger" onClick={handleDelete}>🗑 حذف</Btn>}
</>)}
        {isApproved && (
  <>
    {/* {user?.user?.Permissions?.includes("EditDispatchOrders") && <Btn variant="outline" onClick={() => onEdit(order)}>✏️ تعديل</Btn>} */}
    {user?.user?.Permissions?.includes("LoadDispatchOrders") && <Btn variant="warning" onClick={handleConfirmLoading} disabled={checkedItems.length !== Items.length || loadingConfirm}>
      {loadingConfirm ? "جارٍ التحميل..." : checkedItems.length === Items.length ? `🚚 تحميل فى السيارة ✓` : `🚚 حدد كل البنود أولاً (${checkedItems.length}/${Items.length})`}
    </Btn>}
    {user?.user?.Permissions?.includes("PrintDispatchOrders") && 
    <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة إذن الخروج</Btn>
    }
  </>
)}
        {Status === "Loaded" && user?.user?.Permissions?.includes("LoadDispatchOrders") && (
          <>
            <Btn variant="primary" onClick={handleSetInTransit} disabled={loadingConfirm}>
              {loadingConfirm ? "جارٍ التحديث..." : "🚛 تم خروج السيارة — فى الطريق"}
            </Btn>
            <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة إذن الخروج</Btn>
          </>
        )}
        {/* زرار نسخ الأمر — يظهر دائماً ما عدا Draft */}
        {Status !== "Draft" && user?.user?.Permissions?.includes("CopyDispatchOrders") && (
          <Btn variant="outline" onClick={() =>
            onEdit({
              ...order,
              DispatchOrderId: undefined,
              DispatchOrderNumber: undefined,
              Status: undefined,
              DispatchDate: order.DispatchDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
              campIds: order.Camps?.map(c => c.CampId) || [],
              Items: order.Items?.map(it => ({
                AssetTypeId: it.AssetTypeId,
                AssetModelId: it.AssetModelId || "",
                RequestedQuantity: it.RequestedQuantity,
                Notes: it.Notes || "",
              })) || [],
              _isCopy: true,
            })
          }>📋 نسخ أمر خروج مشابه</Btn>
        )}
        {isReceiving && user?.user?.Permissions?.includes("ReceiveDispatchOrders") && (
          <Btn variant="success" onClick={handleConfirmReceiving} disabled={checkedItems.length === 0 || loadingConfirm}>
            {loadingConfirm ? "جارٍ الحفظ..." : `📦 تأكيد الاستلام (${checkedItems.length}/${Items.length})`}
          </Btn>
        )}
        {(Status === "Received" || Status === "PartialReceived") && <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة تقرير الاستلام</Btn>}
        {user?.user?.Permissions?.includes("PrintDispatchOrders") && <Btn variant="primary" onClick={handleSharePDF} style={{ background: "#27AE60" }}>  📤 مشاركة PDF</Btn>}

      </div>
    </div>
  );
};
// ─────────────────────────────────────────────
// ITEMS MODAL — عرض بيان الأصناف
// ─────────────────────────────────────────────
const ItemsModal = ({ open, onClose, order }) => {
  if (!open || !order) return null;
  const Items = order.Items || [];
  const Status = order.Status;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 40, paddingBottom: 40, overflow: "auto"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24,
        width: "90%", maxWidth: 900, direction: "rtl",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #f0f0f0", paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>📦 بيان الأصناف — {order.DispatchOrderNumber}</h3>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              <StatusBadge Status={Status} /> &nbsp; | &nbsp;
              <b>الوجهة:</b> {order.Destination} &nbsp; | &nbsp;
              <b>التاريخ:</b> {order.DispatchDate?.slice(0, 10)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        {/* جدول الأصناف */}
        <TableComp
          cols={[
            { key: "_seq", label: "#", render: (_, __, idx) => idx + 1 },
            { key: "AssetTypeName", label: "نوع الأصل" },
            { key: "ModelName", label: "الموديل", render: v => v || "—" },
            { key: "RequestedQuantity", label: "المطلوب" },
            { key: "LoadedQuantity", label: "المحمّل", render: v => v ?? "—" },
            { key: "ReceivedQuantity", label: "المستلَم", render: v => v ?? "—" },
            {
              key: "_diff", label: "الفرق", render: (_, row) => {
                if (Status !== "Received" && Status !== "PartialReceived") return <span style={{ color: "#aaa" }}>—</span>;
                const d = (row.RequestedQuantity || 0) - (row.ReceivedQuantity || 0);
                return <span style={{ color: d > 0 ? "#E74C3C" : d < 0 ? "#E67E22" : "#27AE60", fontWeight: 700 }}>{d > 0 ? `-${d}` : d < 0 ? `+${Math.abs(d)}` : "✓"}</span>;
              }
            },
          ]}
          rows={Items}
        />

        {/* ملخص الإجماليات */}
        <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
          <div><b>عدد الأصناف:</b> <span style={{ color: "#2E86C1", fontWeight: 700 }}>{Items.length}</span></div>
          <div><b>إجمالي المطلوب:</b> <span style={{ color: "#1a56db", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.RequestedQuantity || 0), 0)}</span></div>
          <div><b>إجمالي المحمّل:</b> <span style={{ color: "#E67E22", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.LoadedQuantity || 0), 0)}</span></div>
          <div><b>إجمالي المستلَم:</b> <span style={{ color: "#27AE60", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.ReceivedQuantity || 0), 0)}</span></div>
        </div>

        <div style={{ marginTop: 20, textAlign: "left" }}>
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </div>
      </div>
    </div>
  );
};
const OrdersList = ({ onSelect, onCreate, refreshKey, onRefresh, assetTypes = [] }) => {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ Status: "", Destination: "", Keyword: "", AssetTypeId: "", AssetModelId: "" });
  const [statusCounts, setStatusCounts] = useState({});
  const [modelOptions, setModelOptions] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [itemsModalOrder, setItemsModalOrder] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  // عند تغيير نوع الأصل → جيب الموديلات (cascade)
  useEffect(() => {
    if (!filters.AssetTypeId) {
      setModelOptions([]);
      setFilters(f => ({ ...f, AssetModelId: "" }));
      return;
    }
    (async () => {
      setLoadingModels(true);
      try {
        const m = await api.getAssetModels(filters.AssetTypeId);
        setModelOptions(m || []);
      } catch {
        setModelOptions([]);
      } finally {
        setLoadingModels(false);
      }
    })();
  }, [filters.AssetTypeId]);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const clean = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) clean[k] = v; });
      clean.PageSize = 250;
      clean.CurrentPage = 1;
      const d = await api.getDispatchOrders(clean);
      setOrders(d.results || d.Results || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [filters]);

  const loadCounts = useCallback(async () => {
    try {
      const d = await api.getDispatchOrders({ PageSize: 1000, CurrentPage: 1 });
      const all = d.results || d.Results || [];
      const c = {};
      all.forEach(o => { c[o.Status] = (c[o.Status] || 0) + 1; });
      setStatusCounts(c);
    } catch { }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders, refreshKey]);
  useEffect(() => { loadCounts(); }, [loadCounts, refreshKey]);

  // فتح مودال الأصناف — يجيب تفاصيل الأمر
  const handleShowItems = async (order) => {
    setLoadingItems(true);
    try {
      const fullOrder = await api.getDispatchOrder(order.DispatchOrderId);
      setItemsModalOrder(fullOrder);
    } catch (e) {
      alert(e.message || "فشل تحميل الأصناف");
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <div>
      {/* الفلاتر */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", background: "#F7F8FA", borderRadius: 12, padding: 16, marginBottom: 20, direction: "rtl" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>الحالة</label>
          <select value={filters.Status} onChange={e => setF("Status", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div style={{ flex: "1 1 130px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>الوجهة</label>
          <select value={filters.Destination} onChange={e => setF("Destination", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>
            {DestinationS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* ✅ فلتر نوع الأصل */}
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>نوع الأصل</label>
          <AntSelect
            showSearch
            value={filters.AssetTypeId || undefined}
            onChange={v => { setF("AssetTypeId", v || ""); setF("AssetModelId", ""); }}
            placeholder="كل الأنواع"
            optionFilterProp="label"
            style={{ width: "100%", direction: "rtl" }}
            options={assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }))}
            allowClear
          />
        </div>

        {/* ✅ فلتر الموديل — cascade (يظهر بعد اختيار النوع) */}
        {filters.AssetTypeId && (
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>
              الموديل {loadingModels && <span style={{ color: "#aaa", fontSize: 11 }}>(جارٍ التحميل...)</span>}
            </label>
            <AntSelect
              showSearch
              value={filters.AssetModelId || undefined}
              onChange={v => setF("AssetModelId", v || "")}
              placeholder="كل الموديلات"
              optionFilterProp="label"
              style={{ width: "100%", direction: "rtl" }}
              options={modelOptions.map(m => ({
                value: m.AssetModelId,
                label: `${m.ModelName}${m.Brand ? ` - ${m.Brand}` : ""}${m.ModelNumber ? ` - ${m.ModelNumber}` : ""}`
              }))}
              disabled={loadingModels || modelOptions.length === 0}
              allowClear
            />
          </div>
        )}

        <div style={{ flex: "2 1 200px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>بحث</label>
          <input placeholder="رقم الأمر، المستلم، المخيم..." value={filters.Keyword} onChange={e => setF("Keyword", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }} />
        </div>

        <Btn variant="ghost" onClick={() => setFilters({ Status: "", Destination: "", Keyword: "", AssetTypeId: "", AssetModelId: "" })} small>مسح الفلاتر</Btn>
        {user?.user?.Permissions?.includes("AddDispatchOrders") && <Btn variant="primary" onClick={onCreate}>+ إنشاء أمر جديد</Btn>}
      </div>

      {/* شارات الحالة */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([Status, cfg]) => (
          <div key={Status} onClick={() => setF("Status", filters.Status === Status ? "" : Status)}
            style={{ padding: "8px 16px", borderRadius: 30, background: cfg.bg, border: `2px solid ${filters.Status === Status ? cfg.color : "transparent"}`, cursor: "pointer", fontSize: 13, color: cfg.color, fontWeight: 600 }}>
            {cfg.label} ({statusCounts[Status] || 0})
          </div>
        ))}
      </div>

      {loading ? <Loader /> : error ? <ErrorMsg msg={error} onRetry={loadOrders} /> : (
        <>
          <TableComp
            cols={[
              { key: "_seq", label: "#", render: (_, row, idx) => idx + 1 },
              { key: "DispatchOrderNumber", label: "رقم الأمر" },
              { key: "DispatchDate", label: "التاريخ", render: v => v?.slice(0, 10) },
              { key: "Destination", label: "الوجهة" },
              { key: "CampNames", label: "المخيمات", render: (v, row) => row.IsGeneralServices ? <span style={{ color: "#8E44AD", fontWeight: 700 }}>🏗 خدمات عامة للمخيمات</span> : row.ForAllCamps ? <span style={{ color: "#27AE60", fontWeight: 700 }}>✓ كل المخيمات</span> : (v || "—") },
              { key: "ManagerName", label: "المستلم" },
              { key: "Status", label: "الحالة", render: v => <StatusBadge Status={v} /> },
              // ✅ عمود الأصناف — clickable
              {
                key: "ItemCount",
                label: "الأصناف",
                render: (v, row) => (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShowItems(row); }}
                    disabled={loadingItems}
                    title="عرض بيان الأصناف"
                    style={{
                      background: "#EBF5FB",
                      color: "#1a56db",
                      border: "1.5px solid #1a56db",
                      borderRadius: 20,
                      padding: "3px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#1a56db"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#EBF5FB"; e.currentTarget.style.color = "#1a56db"; }}
                  >
                    📦 {v || 0}
                  </button>
                )
              },
              { key: "TotalRequested", label: "المطلوب" },
              { key: "Notes", label: "ملاحظات" },
              {
                key: "_actions", label: "الإجراءات", render: (_, row) =>
                  (row.Status === "Loaded" && user?.user?.Permissions?.includes("ReceiveDispatchOrders")) ? (
                    <Btn variant="warning" small onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`تأكيد خروج السيارة للأمر ${row.DispatchOrderNumber}؟`)) return;
                      try {
                        const r = await api.setInTransit(row.DispatchOrderId);
                        if (r.success) onRefresh();
                        else alert(r.message);
                      } catch (err) { alert(err.message); }
                    }}>🚛 فى الطريق</Btn>
                  ) : null
              },
            ]}
            rows={orders}
            onRowClick={onSelect}
          />
          <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>إجمالي: {orders.length} أمر</div>
        </>
      )}

      {/* ✅ مودال بيان الأصناف */}
      <ItemsModal
        open={!!itemsModalOrder}
        onClose={() => setItemsModalOrder(null)}
        order={itemsModalOrder}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// SCAN SCREEN — DYNAMIC API
// ─────────────────────────────────────────────
const ScanScreen = ({ phase }) => {
  const {user} = useContext(UserContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedAssets, setScannedAssets] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const validStatuses = phase === "Loaded" ? ["Approved"] : ["Loaded", "InTransit"];

  useEffect(() => { (async () => { setLoadingOrders(true); try { const d = await api.getDispatchOrders({ PageSize: 250, CurrentPage: 1 }); setPendingOrders((d.results || d.Results || []).filter(o => validStatuses.includes(o.Status))); } catch { } finally { setLoadingOrders(false); } })(); }, [confirmed]); // eslint-disable-line
  useEffect(() => { if (!selectedOrderId) { setOrder(null); return; } (async () => { try { setOrder(await api.getDispatchOrder(Number(selectedOrderId))); } catch { } })(); }, [selectedOrderId]);

  // Mock RFID scan (replace with real reader)
  useEffect(() => { if (!scanning || !order) return; const iv = setInterval(() => { const m = { UniversityAssetId: Math.floor(Math.random() * 9000 + 1000), rfidCode: `RFID-${Math.floor(Math.random() * 9000 + 1000)}`, assetBarcode: `BC-${Math.floor(Math.random() * 9000 + 1000)}`, AssetTypeId: order.Items[Math.floor(Math.random() * order.Items.length)]?.AssetTypeId, AssetTypeName: order.Items[Math.floor(Math.random() * order.Items.length)]?.AssetTypeName, scannedAt: new Date().toISOString() }; setScannedAssets(p => { const tot = order.Items.reduce((s, i) => s + i.RequestedQuantity, 0); if (p.length >= tot) { clearInterval(iv); setScanning(false); return p; } if (p.find(a => a.UniversityAssetId === m.UniversityAssetId)) return p; return [m, ...p]; }); }, 800); return () => clearInterval(iv); }, [scanning, order]);

  const handleConfirm = async () => {
    const tot = order.Items.reduce((s, i) => s + i.RequestedQuantity, 0);
    if (scannedAssets.length < tot && !window.confirm(`تم مسح ${scannedAssets.length} من ${tot}. تأكيد رغم النقص؟`)) return;
    setConfirming(true);
    try { const r = await api.confirmScan(order.DispatchOrderId, phase, scannedAssets.map(a => a.UniversityAssetId), ""); setScanResult(r); if (r.success) setConfirmed(true); else alert(r.message); }
    catch (e) { alert(e.message); } finally { setConfirming(false); }
  };

  const reset = () => { setSelectedOrderId(""); setOrder(null); setScannedAssets([]); setScanning(false); setConfirmed(false); setScanResult(null); };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", direction: "rtl" }}>
      <div style={{ background: phase === "Loaded" ? "#E67E22" : "#27AE60", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>{phase === "Loaded" ? "🚚" : "📦"}</div>
        <h3 style={{ margin: 0, fontSize: 20 }}>{phase === "Loaded" ? "سكان التحميل 🚚" : "سكان الاستلام 📦"}</h3>
      </div>
      {confirmed ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "#27AE60" }}>تم {phase === "Loaded" ? "التحميل" : "الاستلام"} بنجاح!</h3>
          {scanResult?.comparison && <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, textAlign: "right" }}><div><b>المقروء:</b> {scanResult.totalScanned} | <b>المطابق:</b> {scanResult.totalMatched}</div>{scanResult.comparison.map((c, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee" }}><span>{c.AssetTypeName}</span><span style={{ fontWeight: 700, color: c.Status === "مكتمل" ? "#27AE60" : "#E74C3C" }}>{c.Status} ({c.scanned}/{c.requested})</span></div>)}</div>}
          <Btn variant="primary" onClick={reset}>أمر جديد</Btn>
        </div>
      ) : (<>
        {loadingOrders ? <Loader text="تحميل الأوامر..." /> : <Select label="اختر أمر الخروج" value={selectedOrderId} onChange={v => { setSelectedOrderId(v); setScannedAssets([]); setScanning(false); }} options={pendingOrders.map(o => ({ value: o.DispatchOrderId, label: `${o.DispatchOrderNumber} — ${o.Destination} (${o.campNumber || "—"})` }))} required />}
        {order && (<>
          <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}><div><b>الوجهة:</b> {order.Destination} | <b>المستلم:</b> {order.receiverName}</div><div style={{ marginTop: 6 }}>{order.Items.map((it, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee" }}><span>{it.AssetTypeName}{it.ModelName ? ` - ${it.ModelName}` : ""}</span><span style={{ fontWeight: 700 }}>{it.RequestedQuantity}</span></div>)}</div></div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px" }}><span style={{ fontWeight: 700 }}>نتائج السكان</span><span style={{ fontSize: 18, fontWeight: 800, color: scannedAssets.length >= order.Items.reduce((s, i) => s + i.RequestedQuantity, 0) ? "#27AE60" : "#F1C40F" }}>{scannedAssets.length} / {order.Items.reduce((s, i) => s + i.RequestedQuantity, 0)}</span></div>
            {order.Items.map((it, i) => { const sc = scannedAssets.filter(a => a.AssetTypeId === it.AssetTypeId).length; return <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "#fff", borderBottom: "1px solid #eee", fontSize: 13 }}><span>{it.AssetTypeName}</span><span>{sc >= it.RequestedQuantity ? "✅" : "⚠️"} {sc} / {it.RequestedQuantity}</span></div>; })}
          </div>
          {scannedAssets.length > 0 && <div style={{ maxHeight: 150, overflow: "auto", background: "#1a1a2e", borderRadius: 10, padding: 10, marginBottom: 14, fontFamily: "monospace", fontSize: 11, color: "#7effa0" }}>{scannedAssets.slice(0, 20).map(a => <div key={a.UniversityAssetId}>▶ {a.rfidCode} — {a.AssetTypeName} — {a.scannedAt?.slice(11, 19)}</div>)}</div>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!scanning ? <Btn variant={phase === "Loaded" ? "warning" : "success"} onClick={() => setScanning(true)}>📡 بدء القراءة</Btn> : <Btn variant="danger" onClick={() => setScanning(false)}>⏹ إيقاف</Btn>}
            {user?.user?.Permissions?.includes("ReceiveDispatchOrders") &&
              <Btn variant="primary" onClick={handleConfirm} disabled={scannedAssets.length === 0 || confirming}>{confirming ? "جارٍ الحفظ..." : `✅ ${phase === "Loaded" ? "تأكيد التحميل" : "تأكيد الاستلام"}`}</Btn>
            }
            <Btn variant="ghost" onClick={reset} small>إعادة تعيين</Btn>
          </div>
        </>)}
      </>)}
    </div>
  );
};

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
const ModelUpdateForm = ({ order, assetTypes, onSave, onCancel }) => {
  const [items, setItems] = useState(
    (order.Items || []).map(it => ({
      DispatchOrderItemId: it.DispatchOrderItemId,
      AssetTypeId: it.AssetTypeId,
      AssetTypeName: it.AssetTypeName,
      AssetModelId: it.AssetModelId || "",
      RequestedQuantity: it.RequestedQuantity,
    }))
  );
  const [modelMap, setModelMap] = useState({});
  const [stockMap, setStockMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchModels = useCallback(async (typeId) => {
    if (!typeId || modelMap[typeId]) return;
    try {
      const m = await api.getAssetModels(typeId);
      setModelMap(prev => ({ ...prev, [typeId]: m || [] }));
    } catch {
      setModelMap(prev => ({ ...prev, [typeId]: [] }));
    }
  }, [modelMap]);

  const fetchStock = useCallback(async (modelId) => {
    if (!modelId) return;
    try {
      const result = await api.getModelStockQuantity(modelId);
      setStockMap(prev => ({ ...prev, [modelId]: result?.stockQuantity ?? result?.StockQuantity ?? result ?? 0 }));
    } catch {
      setStockMap(prev => ({ ...prev, [modelId]: 0 }));
    }
  }, []);

  useEffect(() => {
    items.forEach(it => {
      if (it.AssetTypeId) fetchModels(it.AssetTypeId);
      if (it.AssetModelId) fetchStock(it.AssetModelId);
    });
  }, []); // eslint-disable-line

  const updateModel = (idx, modelId) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], AssetModelId: modelId };
      return updated;
    });
    if (modelId) fetchStock(modelId);
  };

  const handleSave = async () => {
    // validate — كل بند لازم يكون له موديل
    for (let i = 0; i < items.length; i++) {
      if (!items[i].AssetModelId) {
        setError(`السطر ${i + 1}: الموديل مطلوب`);
        return;
      }
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        DispatchOrderId: order.DispatchOrderId,
        Items: items.map(it => ({
          DispatchOrderItemId: it.DispatchOrderItemId,
          AssetModelId: Number(it.AssetModelId),
        })),
      };
      const result = await api.updateDispatchOrderModels(payload);
      if (result.success) {
        onSave(result);
      } else {
        setError(result.message || "فشل التحديث");
      }
    } catch (e) {
      setError(e.message || "فشل الاتصال");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, direction: "rtl" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, fontSize: 13, direction: "rtl", marginBottom: 14, color: "#555" }}>
          <span><b>رقم الأمر:</b> {order.DispatchOrderNumber}</span>
          <span><b>الوجهة:</b> {order.Destination}</span>
          <span><b>التاريخ:</b> {order.DispatchDate?.slice(0, 10)}</span>
        </div>
      </div>

      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e", direction: "rtl" }}>📋 تحديث الموديلات</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, direction: "rtl" }}>
            <thead>
              <tr style={{ background: "#e8edf3" }}>
                {["#", "نوع الأصل", "الموديل *", "الكمية المتوفرة", "الكمية المطلوبة"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#555" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const models = modelMap[item.AssetTypeId] || [];
                return (
                  <tr key={item.DispatchOrderItemId} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 600, color: "#888" }}>{idx + 1}</td>
                    <td style={{ padding: "6px 8px", minWidth: 140 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{item.AssetTypeName}</span>
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 180 }}>
                      <select
                        value={item.AssetModelId}
                        onChange={e => updateModel(idx, e.target.value)}
                        style={{
                          width: "100%", padding: "6px 8px", borderRadius: 6,
                          border: item.AssetModelId ? "1.5px solid #27AE60" : "1.5px solid #E74C3C",
                          direction: "rtl", fontSize: 13,
                          background: item.AssetModelId ? "#EAFAF1" : "#FFF"
                        }}
                      >
                        <option value="">اختر الموديل...</option>
                        {models.map(m => (
                          <option key={m.AssetModelId} value={m.AssetModelId}>
                            {m.ModelName} - {m.Brand} - {m.ModelNumber}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 100, textAlign: "center" }}>
                      {item.AssetModelId ? (
                        stockMap[item.AssetModelId] !== undefined ? (
                          <span style={{
                            fontWeight: 700, fontSize: 14,
                            color: stockMap[item.AssetModelId] > 0 ? "#27AE60" : "#E74C3C",
                            background: stockMap[item.AssetModelId] > 0 ? "#EAFAF1" : "#FDEDEC",
                            padding: "4px 12px", borderRadius: 6, display: "inline-block"
                          }}>
                            {stockMap[item.AssetModelId]}
                          </span>
                        ) : <span style={{ color: "#aaa", fontSize: 12 }}>جارٍ التحميل...</span>
                      ) : <span style={{ color: "#ccc" }}>—</span>}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>
                      {item.RequestedQuantity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="outOrders-btnGroup">
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "💾 حفظ الموديلات"}
        </Btn>
      </div>
    </div>
  );
};
// const SearchModelModal = ({ open, onClose, assetTypes }) => {
//   const [assetTypeId, setAssetTypeId] = useState(null);
//   const [assetModelId, setAssetModelId] = useState(null);
//   const [destination, setDestination] = useState(null);
//   const [models, setModels] = useState([]);
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // جلب الموديلات عند اختيار نوع الأصل
//   useEffect(() => {
//     if (!assetTypeId) { setModels([]); setAssetModelId(null); return; }
//     (async () => {
//       try {
//         const m = await api.getAssetModels(assetTypeId);
//         setModels(m || []);
//       } catch { setModels([]); }
//     })();
//   }, [assetTypeId]);

//   const handleSearch = async () => {
//     if (!assetTypeId) { setError("اختر نوع الأصل"); return; }
//     setError(null);
//     setLoading(true);
//     setResult(null);
//     try {
//       const r = await api.getModelDistribution(assetTypeId, assetModelId, destination);
//       setResult(r);
//     } catch (e) { setError(e.message || "فشل البحث"); }
//     finally { setLoading(false); }
//   };

//   const handleReset = () => {
//     setAssetTypeId(null);
//     setAssetModelId(null);
//     setDestination(null);
//     setModels([]);
//     setResult(null);
//     setError(null);
//   };

//   if (!open) return null;

//   return (
//     <div style={{
//       position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
//       zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center",
//       paddingTop: 40, paddingBottom: 40, overflow: "auto"
//     }}>
//       <div style={{
//         background: "#fff", borderRadius: 16, padding: 24,
//         width: "90%", maxWidth: 800, direction: "rtl",
//         boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
//       }}>
//         {/* Header */}
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "2px solid #f0f0f0", paddingBottom: 12 }}>
//           <h3 style={{ margin: 0, fontSize: 18 }}>🔍 بحث بالموديل — التوزيع على المخيمات (المستلَمة)</h3>
//           <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888" }}>×</button>
//         </div>

//         {/* Filters */}
//         <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 16 }}>
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
//             <div>
//               <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
//                 نوع الأصل <span style={{ color: "#E74C3C" }}>*</span>
//               </label>
//               <AntSelect
//                 showSearch
//                 value={assetTypeId || undefined}
//                 onChange={v => { setAssetTypeId(v); setAssetModelId(null); }}
//                 placeholder="اختر نوع الأصل..."
//                 optionFilterProp="label"
//                 style={{ width: "100%", direction: "rtl" }}
//                 options={assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }))}
//                 allowClear
//               />
//             </div>

//             <div>
//               <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
//                 الموديل (اختياري)
//               </label>
//               <AntSelect
//                 showSearch
//                 value={assetModelId || undefined}
//                 onChange={setAssetModelId}
//                 placeholder="كل الموديلات"
//                 optionFilterProp="label"
//                 style={{ width: "100%", direction: "rtl" }}
//                 options={models.map(m => ({ value: m.AssetModelId, label: `${m.ModelName} - ${m.Brand || ""} - ${m.ModelNumber || ""}` }))}
//                 disabled={!assetTypeId}
//                 allowClear
//               />
//             </div>

//             <div>
//               <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#444" }}>
//                 الوجهة (اختياري)
//               </label>
//               <AntSelect
//                 value={destination || undefined}
//                 onChange={setDestination}
//                 placeholder="كل الوجهات"
//                 style={{ width: "100%", direction: "rtl" }}
//                 options={DestinationS.map(d => ({ value: d, label: d }))}
//                 allowClear
//               />
//             </div>
//           </div>

//           <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
//             <Btn variant="primary" onClick={handleSearch} disabled={loading || !assetTypeId}>
//               {loading ? "جارٍ البحث..." : "🔍 بحث"}
//             </Btn>
//             <Btn variant="ghost" onClick={handleReset} small>🔄 إعادة تعيين</Btn>
//           </div>
//         </div>

//         {error && (
//           <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
//             ⚠️ {error}
//           </div>
//         )}

//         {/* Results */}
//         {loading ? <Loader text="جارٍ البحث..." /> : result && (
//           <>
//             {/* Summary */}
//             <div style={{ background: "linear-gradient(135deg, #EBF5FB 0%, #EAFAF1 100%)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
//               <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
//                 <b>نوع الأصل:</b> {result.AssetTypeName}
//                 {result.ModelName && <> — <b>الموديل:</b> {result.ModelName} {result.Brand && `(${result.Brand})`} {result.ModelNumber && `- ${result.ModelNumber}`}</>}
//                 {result.Destination && <> — <b>الوجهة:</b> {result.Destination}</>}
//               </div>
//               <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
//                 <div style={{ background: "#fff", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 150 }}>
//                   <div style={{ fontSize: 11, color: "#888" }}>إجمالي الكمية المستلَمة</div>
//                   <div style={{ fontSize: 24, fontWeight: 800, color: "#27AE60" }}>{result.GrandTotal || 0}</div>
//                 </div>
//                 <div style={{ background: "#fff", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 150 }}>
//                   <div style={{ fontSize: 11, color: "#888" }}>عدد الأوامر</div>
//                   <div style={{ fontSize: 24, fontWeight: 800, color: "#2E86C1" }}>{result.TotalOrders || 0}</div>
//                 </div>
//                 <div style={{ background: "#fff", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 150 }}>
//                   <div style={{ fontSize: 11, color: "#888" }}>عدد المخيمات</div>
//                   <div style={{ fontSize: 24, fontWeight: 800, color: "#8E44AD" }}>{result.Distribution?.length || 0}</div>
//                 </div>
//               </div>
//             </div>

//             {/* Distribution Table */}
//             {result.Distribution && result.Distribution.length > 0 ? (
//               <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
//                 <div style={{ background: "#F7F8FA", padding: "10px 16px", fontWeight: 700, fontSize: 14, borderBottom: "2px solid #e8e8e8" }}>
//                   📊 التوزيع على المخيمات
//                 </div>
//                 <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
//                   <thead>
//                     <tr style={{ background: "#fafafa" }}>
//                       <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#555" }}>#</th>
//                       <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#555" }}>المخيم</th>
//                       <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#555" }}>الوجهة</th>
//                       <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#555" }}>عدد الأوامر</th>
//                       <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#555" }}>الكمية المستلَمة</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {result.Distribution.map((d, i) => (
//                       <tr key={d.CampId} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
//                         <td style={{ padding: "10px 14px", fontWeight: 600, color: "#888" }}>{i + 1}</td>
//                         <td style={{ padding: "10px 14px", fontWeight: 600 }}>{d.CampName}</td>
//                         <td style={{ padding: "10px 14px", color: "#555" }}>{d.Destination || "—"}</td>
//                         <td style={{ padding: "10px 14px", textAlign: "center", color: "#2E86C1", fontWeight: 700 }}>{d.OrdersCount}</td>
//                         <td style={{ padding: "10px 14px", textAlign: "center" }}>
//                           <span style={{
//                             background: "#EAFAF1", color: "#27AE60",
//                             padding: "4px 14px", borderRadius: 6,
//                             fontWeight: 800, fontSize: 15, display: "inline-block", minWidth: 50
//                           }}>
//                             {d.TotalReceived}
//                           </span>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                   <tfoot>
//                     <tr style={{ background: "#1a1a2e", color: "#fff" }}>
//                       <td colSpan={3} style={{ padding: "10px 14px", fontWeight: 700 }}>الإجمالي</td>
//                       <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700 }}>{result.TotalOrders}</td>
//                       <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, fontSize: 16 }}>{result.GrandTotal}</td>
//                     </tr>
//                   </tfoot>
//                 </table>
//               </div>
//             ) : (
//               <div style={{ textAlign: "center", padding: 40, color: "#888", background: "#F7F8FA", borderRadius: 10 }}>
//                 <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
//                 <div>لا توجد نتائج مطابقة — لم يتم استلام هذا الموديل في أي مخيم</div>
//               </div>
//             )}
//           </>
//         )}

//         {/* Footer */}
//         <div style={{ marginTop: 20, textAlign: "left" }}>
//           <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
//         </div>
//       </div>
//     </div>
//   );
// };
export default function OutOrders() {
  const [tab, setTab] = useState("orders");
  const [assetTypes, setAssetTypes] = useState([]);
  const [view, setView] = useState("list");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [modelUpdateOrder, setModelUpdateOrder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [camps, setCamps] = useState([]);
  const [campManagers, setCampManagers] = useState([]);
  const [showSearchModel, setShowSearchModel] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setAssetTypes(await api.getAssetTypes() || []);
        setCamps(await api.getCamps() || []);
        setCampManagers(await api.getCampManagers() || []);
      } catch (e) { console.error(e); }
    })();
  }, []);
  const triggerRefresh = () => setRefreshKey(k => k + 1);
  const handleSaveOrder = () => { setShowForm(false); setEditOrder(null); setView("list"); setSelectedOrderId(null); triggerRefresh(); };
  // const handleEdit = (order) => { setEditOrder(order); setShowForm(true); };
  const handleEdit = (order) => {
    if (order._isCopy) {
      // نسخ: يفتح كإنشاء جديد مع نفس البيانات
      setEditOrder({ ...order, DispatchOrderId: undefined });
    } else {
      setEditOrder(order);
    }
    setShowForm(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ margin: "0 auto", padding: "" }}>
        {tab === "orders" && (<>
  {modelUpdateOrder ? (
    <div className={"outOrders-card"}>
      <h3 style={{ direction: "rtl", marginTop: 0 }}>📋 تحديث الموديلات — {modelUpdateOrder.DispatchOrderNumber}</h3>
      <ModelUpdateForm
        order={modelUpdateOrder}
        assetTypes={assetTypes}
        onSave={() => { setModelUpdateOrder(null); triggerRefresh(); }}
        onCancel={() => setModelUpdateOrder(null)}
      />
    </div>
  ) : (showForm || editOrder) ? (
            <div className={"outOrders-card"}>
              {/* <h3 style={{ direction: "rtl", marginTop: 0 }}>{editOrder ? "تعديل أمر الخروج" : "إنشاء أمر خروج جديد"}</h3> */}
              <h3 style={{ direction: "rtl", marginTop: 0 }}>
                {editOrder?.DispatchOrderId ? "تعديل أمر الخروج" : editOrder?._isCopy ? "نسخ أمر خروج مشابه" : "إنشاء أمر خروج جديد"}
              </h3>
              <OrderForm initial={editOrder} assetTypes={assetTypes} camps={camps} campManagers={campManagers} onSave={handleSaveOrder} onCancel={() => { setShowForm(false); setEditOrder(null); setView(selectedOrderId ? "detail" : "list"); }} />

            </div>
          ) : view === "detail" && selectedOrderId ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
              <OrderDetail orderId={selectedOrderId} onBack={() => { setView("list"); setSelectedOrderId(null); }} onEdit={handleEdit} onRefresh={triggerRefresh} onUpdateModels={(order) => { setModelUpdateOrder(order); setView("list"); }}/>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, direction: "rtl" }}>
  <h2 style={{ margin: 0, fontSize: 22 }}>أوامر الخروج</h2>
  <Btn variant="outline" onClick={() => setShowSearchModel(true)} style={{ background: "#8E44AD", color: "#fff", border: "none" }}>
    🔍 بحث بالموديل (المستلَم)
  </Btn>
</div>              <OrdersList refreshKey={refreshKey}   assetTypes={assetTypes}  onSelect={o => { setSelectedOrderId(o.DispatchOrderId); setView("detail"); }} onCreate={() => { setEditOrder(null); setShowForm(true); setView("create"); }} onRefresh={triggerRefresh} />
            </div>
          )}
        </>)}
        {tab === "scanLoad" && <div style={{ background: "#171616", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}><ScanScreen phase="Loaded" /></div>}
        {tab === "scanReceive" && <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}><ScanScreen phase="Received" /></div>}
      </div>
      {/* <SearchModelModal
  open={showSearchModel}
  onClose={() => setShowSearchModel(false)}
  assetTypes={assetTypes}
/> */}
<SearchModelDistributionModal
  open={showSearchModel}
  onClose={() => setShowSearchModel(false)}
  assetTypes={assetTypes}
/>
    </div>
  );
}
