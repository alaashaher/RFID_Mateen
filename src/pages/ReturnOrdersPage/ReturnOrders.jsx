import { useState, useEffect, useCallback, useContext } from "react";
import "./ReturnOrder.scss";
import { getFromApi, postToApi, putToApi, deleteFromApi } from "../../apis/apis";
import UserContext from "../../contexts/user-context/UserProvider";
import { Select as AntSelect } from "antd";
import SearchModelDistributionModal from "../shared/SearchModelDistributionModal";

// ─────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────
const api = {
  getReturnOrders: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return getFromApi(`ReturnOrder/get-all-returnOrders?${params}`);
  },
  getReturnOrder: (id) =>
    getFromApi(`ReturnOrder/get-returnOrder-byId?id=${id}`),
  createReturnOrder: (body) =>
    postToApi(`ReturnOrder/add-returnOrder`, body),
  updateReturnOrder: (id, body) =>
    putToApi(`ReturnOrder/update-returnOrder`, { ...body, ReturnOrderId: id }),
  updateReturnOrderModels: (body) =>
    putToApi(`ReturnOrder/update-returnOrder-models`, body),
  deleteReturnOrder: (id) =>
    deleteFromApi(`ReturnOrder/delete-returnOrder?id=${id}`),
  approveReturnOrder: (ReturnOrderId, approverId) =>
    postToApi(`ReturnOrder/set-approve`, { ReturnOrderId, ApproverId: approverId }),
  confirmLoading: (returnOrderId, itemIds) =>
    postToApi(`ReturnOrder/confirm-loading`, { ReturnOrderId: returnOrderId, ItemIds: itemIds }),
  confirmReceiving: (returnOrderId, receivedBy, items) =>
    postToApi(`ReturnOrder/confirm-receiving`, { ReturnOrderId: returnOrderId, ReceivedBy: receivedBy, Items: items }),
  setInTransit: (returnOrderId) =>
    postToApi(`ReturnOrder/set-in-transit`, { ReturnOrderId: returnOrderId }),
  getReturnReasons: () =>
    getFromApi(`ReturnOrder/get-return-reasons`),
  // Lookups (same as DispatchOrder)
  getAssetTypes: () => getFromApi(`DispatchOrder/get-asset-types`),
  getAssetModels: (AssetTypeId) => getFromApi(`DispatchOrder/get-asset-models?AssetTypeId=${AssetTypeId}`),
  getModelStockQuantity: (assetModelId) => getFromApi(`AssetModel/get-model-stockQuantity?assetModelId=${assetModelId}`),
  getCamps: () => getFromApi(`DispatchOrder/get-camps`),
  getCampManagers: () => getFromApi(`DispatchOrder/get-camp-managers`),
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

const RETURN_REASONS = [
  { value: "EndOfSeason", label: "انتهاء الموسم" },
  { value: "Surplus", label: "زيادة" },
  { value: "Damaged", label: "تالف" },
  { value: "Maintenance", label: "صيانة" },
  { value: "Replacement", label: "استبدال" },
  { value: "Other", label: "أخرى" },
];

const getReasonLabel = (v) => RETURN_REASONS.find(r => r.value === v)?.label || v;

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

const ReasonBadge = ({ reason }) => {
  const colors = {
    EndOfSeason: { color: "#2E86C1", bg: "#EBF5FB" },
    Surplus: { color: "#27AE60", bg: "#EAFAF1" },
    Damaged: { color: "#E74C3C", bg: "#FDEDEC" },
    Maintenance: { color: "#E67E22", bg: "#FEF9E7" },
    Replacement: { color: "#8E44AD", bg: "#F5EEF8" },
    Other: { color: "#95A5A6", bg: "#F4F6F6" },
  };
  const cfg = colors[reason] || colors.Other;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, whiteSpace: "nowrap" }}>
      {getReasonLabel(reason)}
    </span>
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
  <div className="returnOrders-tableWrapper">
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
            {cols.map(c => <td key={c.key} style={{ padding: "10px 14px", verticalAlign: "middle" }}>{c.render ? c.render(row[c.key], row, i) : (row[c.key] ?? "—")}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────
// RETURN ORDER FORM (Create / Edit)
// ─────────────────────────────────────────────
const emptyItem = () => ({ _id: Math.random(), AssetTypeId: "", AssetModelId: "", RequestedQuantity: 1, ReturnReason: "EndOfSeason", ReportedDamaged: 0, Notes: "" });
const emptyForm = () => ({ ReturnDate: new Date().toISOString().slice(0, 10), Destination: "", campIds: [], CampManagerId: "", VehiclePlateNumber: "", DriverName: "", Notes: "", Items: [emptyItem()], ForAllCamps: false, IsGeneralReturn: false });

const ReturnOrderForm = ({ initial, assetTypes, camps = [], campManagers = [], onSave, onCancel }) => {
  const [form, setForm] = useState(initial ? {
    ...initial,
    ReturnDate: (initial.ReturnDate || "").slice(0, 10),
    campIds: initial.campIds || initial.Camps?.map(c => c.CampId) || [],
    ForAllCamps: initial.ForAllCamps || false,
    IsGeneralReturn: initial.IsGeneralReturn || false,
    CampManagerId: initial.CampManagerId || "",
    Items: (initial.Items || []).map(it => ({
      _id: Math.random(),
      AssetTypeId: it.AssetTypeId || "",
      AssetModelId: it.AssetModelId || "",
      RequestedQuantity: it.RequestedQuantity || 1,
      ReturnReason: it.ReturnReason || "EndOfSeason",
      ReportedDamaged: it.ReportedDamaged || 0,
      Notes: it.Notes || it.notes || ""
    }))
  } : emptyForm());
  const [modelMap, setModelMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchModels = useCallback(async (typeId) => {
    if (!typeId || modelMap[typeId]) return;
    try { const m = await api.getAssetModels(typeId); setModelMap(prev => ({ ...prev, [typeId]: m || [] })); }
    catch { setModelMap(prev => ({ ...prev, [typeId]: [] })); }
  }, [modelMap]);

  useEffect(() => { if (initial?.Items) initial.Items.forEach(it => { if (it.AssetTypeId) fetchModels(it.AssetTypeId); }); }, []); // eslint-disable-line

  const updateItem = (idx, k, v) => {
    setForm(f => {
      const Items = [...f.Items];
      Items[idx] = { ...Items[idx], [k]: v };
      if (k === "AssetTypeId") { Items[idx].AssetModelId = ""; if (v) fetchModels(v); }
      return { ...f, Items };
    });
  };
  const addItem = () => setForm(f => ({ ...f, Items: [...f.Items, emptyItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, Items: f.Items.filter((_, i) => i !== idx) }));

  const validate = () => {
    if (!form.Destination) return "الوجهة (المصدر) مطلوبة";
    for (let i = 0; i < form.Items.length; i++) {
      const it = form.Items[i];
      if (!it.AssetTypeId) return `السطر ${i + 1}: نوع الأصل مطلوب`;
      if (!it.RequestedQuantity || it.RequestedQuantity < 1) return `السطر ${i + 1}: الكمية مطلوبة`;
      if (!it.ReturnReason) return `السطر ${i + 1}: سبب الاسترجاع مطلوب`;
      if (it.ReportedDamaged < 0 || it.ReportedDamaged > it.RequestedQuantity) return `السطر ${i + 1}: عدد التالف غير صحيح`;
    }
    return null;
  };

  const handleSave = async (Status) => {
    const err = validate(); if (err) { setError(err); return; }
    setError(null); setSaving(true);
    try {
      const payload = {
        ReturnDate: form.ReturnDate,
        Destination: form.Destination,
        CampIds: form.IsGeneralReturn ? [] : form.campIds,
        ForAllCamps: form.ForAllCamps,
        IsGeneralReturn: form.IsGeneralReturn,
        CampManagerId: form.CampManagerId ? Number(form.CampManagerId) : null,
        VehiclePlateNumber: form.VehiclePlateNumber || null,
        DriverName: form.DriverName || null,
        Notes: form.Notes || null,
        Items: form.Items.map(it => ({
          AssetTypeId: Number(it.AssetTypeId),
          AssetModelId: it.AssetModelId ? Number(it.AssetModelId) : null,
          RequestedQuantity: Number(it.RequestedQuantity),
          ReturnReason: it.ReturnReason,
          ReportedDamaged: Number(it.ReportedDamaged) || 0,
          Notes: it.Notes || null
        }))
      };
      let result;
      if (initial?.ReturnOrderId) { result = await api.updateReturnOrder(initial.ReturnOrderId, payload); }
      else { result = await api.createReturnOrder(payload); }
      if (result.success) {
        if (Status === "Approved" && result.returnOrderId) await api.approveReturnOrder(result.returnOrderId, 1);
        onSave(result);
      } else setError(result.message || "فشل الحفظ");
    } catch (e) { setError(e.message || "فشل الاتصال"); } finally { setSaving(false); }
  };

  const typeOpts = assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }));

  return (
    <div>
      {error && <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, direction: "rtl" }}>⚠️ {error}</div>}
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📋 معلومات أمر الاسترجاع</h4>
        <div className="returnOrders-formGrid">
          <Input label="تاريخ الاسترجاع" value={form.ReturnDate} onChange={v => setField("ReturnDate", v)} type="date" required />
          <Select label="الوجهة (المصدر)" value={form.Destination} onChange={v => setField("Destination", v)} options={DestinationS.map(d => ({ value: d, label: d }))} required />

          {/* المخيمات — اختياري */}
          <div style={{ marginBottom: 14, gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>
              المخيمات (اختياري)
            </label>
            <div style={{ border: "1.5px solid #dde1e7", borderRadius: 8, padding: 8, minHeight: 42, display: "flex", flexWrap: "wrap", gap: 6, background: "#fff", direction: "rtl" }}>
              {form.campIds.map(id => {
                const camp = camps.find(c => c.CampId === id);
                if (!camp) return null;
                return (
                  <span key={id} style={{ background: "#EBF5FB", color: "#1a56db", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {camp.CampName}
                    <button onClick={() => setField("campIds", form.campIds.filter(x => x !== id))} style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </span>
                );
              })}
              <button onClick={() => { if (form.campIds.length === camps.length) { setField("campIds", []); setField("ForAllCamps", false); } else { setField("campIds", camps.map(c => c.CampId)); setField("ForAllCamps", true); } }}
                style={{ background: form.campIds.length === camps.length ? "#E74C3C" : "#27AE60", color: "#fff", border: "none", borderRadius: 16, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {form.campIds.length === camps.length ? "✕ إلغاء الكل" : "✓ الكل"}
              </button>
              <button onClick={() => { setField("campIds", []); setField("ForAllCamps", false); setField("IsGeneralReturn", !form.IsGeneralReturn); }}
                style={{ background: form.IsGeneralReturn ? "#8E44AD" : "#f0f0f0", color: form.IsGeneralReturn ? "#fff" : "#555", border: form.IsGeneralReturn ? "none" : "1px solid #ccc", borderRadius: 16, padding: "3px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {form.IsGeneralReturn ? "✕ استرجاع عام" : "🔄 استرجاع عام"}
              </button>
              {!form.IsGeneralReturn && form.campIds.length !== camps.length && <select value="" onChange={e => { const val = Number(e.target.value); if (val && !form.campIds.includes(val)) { setField("campIds", [...form.campIds, val]); setField("ForAllCamps", false); } }}
                style={{ border: "none", outline: "none", fontSize: 13, direction: "rtl", flex: 1, minWidth: 140, background: "transparent" }}>
                <option value="">+ إضافة مخيم...</option>
                {camps.filter(c => !form.campIds.includes(c.CampId)).map(c => (<option key={c.CampId} value={c.CampId}>{c.CampName}</option>))}
              </select>}
            </div>
          </div>

          {form.IsGeneralReturn && (
            <div style={{ background: "#F5EEF8", border: "1px solid #D2B4DE", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: "#6C3483", direction: "rtl", gridColumn: "1 / -1" }}>
              🔄 أمر استرجاع عام — غير مرتبط بمخيم محدد
            </div>
          )}

          <Select label="المسئول عن الإرسال" value={form.CampManagerId} onChange={v => setField("CampManagerId", v)}
            options={campManagers.map(m => ({ value: m.CampManagerId, label: `${m.ManagerName} — ${m.ManagerPhone || ""}` }))} />
          <Input label="رقم لوحة السيارة" value={form.VehiclePlateNumber} onChange={v => setField("VehiclePlateNumber", v)} />
          <Input label="اسم السائق" value={form.DriverName} onChange={v => setField("DriverName", v)} />
        </div>
        <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>ملاحظات</label>
          <textarea value={form.Notes} onChange={e => setField("Notes", e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, direction: "rtl", boxSizing: "border-box", resize: "vertical", minHeight: 60 }} /></div>
      </div>

      {/* بيان الأصناف */}
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📦 بيان الأصناف المرتجعة</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, direction: "rtl" }}>
            <thead><tr style={{ background: "#e8edf3" }}>
              {["نوع الأصل *", "الموديل", "الكمية *", "السبب *", "التالف (تقرير)", "ملاحظات", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#555" }}>{h}</th>)}
            </tr></thead>
            <tbody>{form.Items.map((item, idx) => {
              const models = modelMap[item.AssetTypeId] || [];
              return (<tr key={item._id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={{ padding: "6px 8px", minWidth: 180 }}>
                  <AntSelect showSearch value={item.AssetTypeId || undefined} onChange={v => updateItem(idx, "AssetTypeId", v)}
                    placeholder="اختر نوع الأصل..." optionFilterProp="label" style={{ width: "100%", direction: "rtl" }}
                    options={typeOpts.map(o => ({ value: o.value, label: o.label }))} allowClear onClear={() => updateItem(idx, "AssetTypeId", "")} />
                </td>
                <td style={{ padding: "6px 8px", minWidth: 180 }}>
                  <AntSelect showSearch value={item.AssetModelId || undefined} onChange={v => updateItem(idx, "AssetModelId", v)}
                    placeholder="اختر الموديل..." optionFilterProp="label" style={{ width: "100%", direction: "rtl" }}
                    disabled={!item.AssetTypeId || models.length === 0}
                    options={models.map(m => ({ value: m.AssetModelId, label: `${m.ModelName} - ${m.Brand} - ${m.ModelNumber}` }))}
                    allowClear onClear={() => updateItem(idx, "AssetModelId", "")} />
                </td>
                <td style={{ padding: "6px 8px", minWidth: 80 }}>
                  <input type="number" min={1} value={item.RequestedQuantity} onChange={e => updateItem(idx, "RequestedQuantity", Number(e.target.value))}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, textAlign: "center" }} />
                </td>
                <td style={{ padding: "6px 8px", minWidth: 120 }}>
                  <select value={item.ReturnReason} onChange={e => updateItem(idx, "ReturnReason", e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 12 }}>
                    {RETURN_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: "6px 8px", minWidth: 80 }}>
                  <input type="number" min={0} max={item.RequestedQuantity} value={item.ReportedDamaged || 0}
                    onChange={e => updateItem(idx, "ReportedDamaged", Math.min(Number(e.target.value), item.RequestedQuantity))}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, textAlign: "center", color: (item.ReportedDamaged || 0) > 0 ? "#E74C3C" : "#333" }} />
                </td>
                <td style={{ padding: "6px 8px", minWidth: 120 }}>
                  <input value={item.Notes || ""} onChange={e => updateItem(idx, "Notes", e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }} />
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <button onClick={() => removeItem(idx)} disabled={form.Items.length === 1}
                    style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", fontSize: 18 }}>🗑</button>
                </td>
              </tr>);
            })}</tbody>
          </table>
        </div>
        <div style={{ marginTop: 10 }}><Btn variant="ghost" onClick={addItem} small>+ إضافة سطر</Btn></div>
      </div>

      <div className="returnOrders-btnGroup">
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="outline" onClick={() => handleSave("Draft")} disabled={saving}>{saving ? "جارٍ الحفظ..." : "💾 حفظ كمسودة"}</Btn>
        <Btn variant="success" onClick={() => handleSave("Approved")} disabled={saving}>✅ حفظ واعتماد</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// RETURN ORDER DETAIL
// ─────────────────────────────────────────────
const ReturnOrderDetail = ({ orderId, onBack, onEdit, onRefresh }) => {
  const { user } = useContext(UserContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState([]);
  const [receivingData, setReceivingData] = useState({}); // { itemId: { good, damaged } }
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await api.getReturnOrder(orderId); setOrder(data); setCheckedItems([]); setReceivingData({}); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [orderId]);
  useEffect(() => { loadOrder(); }, [loadOrder]);

  if (loading) return <Loader text="جارٍ تحميل تفاصيل الأمر..." />;
  if (error) return <ErrorMsg msg={error} onRetry={loadOrder} />;
  if (!order) return <ErrorMsg msg="أمر الاسترجاع غير موجود" />;

  const { Status, Items = [] } = order;
  const isApproved = Status === "Approved";
  const isReceiving = Status === "InTransit";
  const showCheckbox = isApproved || isReceiving;

  const allChecked = Items.length > 0 && checkedItems.length === Items.length;
  const toggleItem = (itemId) => {
    setCheckedItems(prev => {
      if (prev.includes(itemId)) return prev.filter(id => id !== itemId);
      if (isReceiving && !receivingData[itemId]) {
        const item = Items.find(i => i.ReturnOrderItemId === itemId);
        setReceivingData(q => ({ ...q, [itemId]: { good: (item?.LoadedQuantity || item?.RequestedQuantity || 0) - (item?.ReportedDamaged || 0), damaged: item?.ReportedDamaged || 0 } }));
      }
      return [...prev, itemId];
    });
  };
  const toggleAll = () => {
    if (allChecked) { setCheckedItems([]); }
    else {
      const allIds = Items.map(i => i.ReturnOrderItemId);
      setCheckedItems(allIds);
      if (isReceiving) {
        const qtyMap = {};
        Items.forEach(i => { qtyMap[i.ReturnOrderItemId] = { good: (i.LoadedQuantity || i.RequestedQuantity || 0) - (i.ReportedDamaged || 0), damaged: i.ReportedDamaged || 0 }; });
        setReceivingData(q => ({ ...q, ...qtyMap }));
      }
    }
  };

  const updateReceiving = (itemId, field, value) => {
    const item = Items.find(i => i.ReturnOrderItemId === itemId);
    const max = item?.LoadedQuantity || item?.RequestedQuantity || 0;
    const current = receivingData[itemId] || { good: 0, damaged: 0 };
    const updated = { ...current, [field]: Math.max(0, Number(value) || 0) };
    if (updated.good + updated.damaged > max) {
      if (field === "good") updated.good = max - updated.damaged;
      else updated.damaged = max - updated.good;
    }
    setReceivingData(q => ({ ...q, [itemId]: updated }));
  };

  // تحميل
  const handleConfirmLoading = async () => {
    if (checkedItems.length === 0) { alert("اختر بند واحد على الأقل"); return; }
    if (!window.confirm(`سيتم تحميل ${checkedItems.length} من ${Items.length} بنود. متأكد؟`)) return;
    setLoadingConfirm(true);
    try {
      const r = await api.confirmLoading(order.ReturnOrderId, checkedItems);
      if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل التحميل");
    } catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };

  // استلام في المستودع
  const handleConfirmReceiving = async () => {
    if (checkedItems.length === 0) { alert("اختر بند واحد على الأقل"); return; }
    const items = checkedItems.map(itemId => {
      const rd = receivingData[itemId] || { good: 0, damaged: 0 };
      return { ReturnOrderItemId: itemId, ReceivedGood: rd.good, ReceivedDamaged: rd.damaged };
    });
    const totalAll = items.reduce((s, i) => s + i.ReceivedGood + i.ReceivedDamaged, 0);
    const totalDamaged = items.reduce((s, i) => s + i.ReceivedDamaged, 0);
    const msg = totalDamaged > 0
      ? `سيتم استلام ${totalAll} قطعة (${totalDamaged} تالف). متأكد؟`
      : `سيتم استلام ${totalAll} قطعة. متأكد؟`;
    if (!window.confirm(msg)) return;
    setLoadingConfirm(true);
    try {
      const r = await api.confirmReceiving(order.ReturnOrderId, 1, items);
      if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل الاستلام");
    } catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };

  const handleApprove = async () => { try { const r = await api.approveReturnOrder(order.ReturnOrderId, 1); if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message); } catch (e) { alert(e.message); } };
  const handleDelete = async () => { if (!window.confirm("هل أنت متأكد من حذف هذا الأمر؟")) return; try { const r = await api.deleteReturnOrder(order.ReturnOrderId); if (r.success) { onRefresh?.(); onBack(); } else alert(r.message); } catch (e) { alert(e.message); } };
  const handleSetInTransit = async () => {
    if (!window.confirm("هل وصلت السيارة من المخيم؟")) return;
    setLoadingConfirm(true);
    try { const r = await api.setInTransit(order.ReturnOrderId); if (r.success) { loadOrder(); onRefresh?.(); } else alert(r.message || "فشل التحديث"); }
    catch (e) { alert(e.message); } finally { setLoadingConfirm(false); }
  };

  const infoRows = [
    ["رقم الأمر", order.ReturnOrderNumber], ["التاريخ", order.ReturnDate?.slice(0, 10)], ["الوجهة (المصدر)", order.Destination],
    ["المسئول عن الإرسال", order.ManagerName], ["هاتف المسئول", order.ManagerPhone],
    ["لوحة السيارة", order.VehiclePlateNumber], ["السائق", order.DriverName],
    ["ملاحظات", order.Notes], ["المخيمات", order.Camps?.map(c => c.CampName).join(" ، ") || "—"]
  ];

  return (
    <div className="returnOrders-container">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1a56db" }}>← رجوع</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>تفاصيل أمر الاسترجاع — {order.ReturnOrderNumber}</h2>
        <StatusBadge Status={Status} />
      </div>

      <div style={{ gap: "4px 0", background: "#F7F8FA", borderRadius: 10, padding: "12px 16px", marginBottom: 20, direction: "rtl" }}>
        {infoRows.map(([k, v]) => v ?
          <div key={k} style={{ padding: "4px 0", display: "flex", gap: 8 }}>
            <span style={{ fontWeight: 600, color: "#555", minWidth: 140, fontSize: 13 }}>{k}:</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div> : null)}
      </div>

      <h4 style={{ marginBottom: 10, direction: "rtl" }}>
        {isApproved ? "📦 تحديد البنود للتحميل" : isReceiving ? "📋 استلام في المستودع" : "بيان الأصناف المرتجعة"}
      </h4>

      <TableComp
        cols={[
          ...(showCheckbox ? [{
            key: "_check",
            label: <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 18, height: 18, cursor: "pointer" }} />,
            render: (_, row) => <input type="checkbox" checked={checkedItems.includes(row.ReturnOrderItemId)} onChange={() => toggleItem(row.ReturnOrderItemId)} style={{ width: 18, height: 18, cursor: "pointer" }} />
          }] : []),
          { key: "AssetTypeName", label: "نوع الأصل" },
          { key: "ModelName", label: "الموديل" },
          { key: "ReturnReasonAr", label: "السبب", render: (v, row) => <ReasonBadge reason={row.ReturnReason} /> },
          { key: "RequestedQuantity", label: "المطلوب" },
          { key: "ReportedDamaged", label: "تالف (تقرير)", render: v => v > 0 ? <span style={{ color: "#E74C3C", fontWeight: 700 }}>{v}</span> : "—" },
          { key: "LoadedQuantity", label: "المحمّل" },
          ...(isReceiving ? [
            {
              key: "_goodInput", label: "سليم",
              render: (_, row) => checkedItems.includes(row.ReturnOrderItemId) ? (
                <input type="number" min={0} value={receivingData[row.ReturnOrderItemId]?.good ?? 0}
                  onChange={e => updateReceiving(row.ReturnOrderItemId, "good", e.target.value)}
                  style={{ width: 60, padding: "4px 6px", borderRadius: 6, border: "1.5px solid #27AE60", fontSize: 14, textAlign: "center", fontWeight: 700, color: "#27AE60" }} />
              ) : <span style={{ color: "#aaa" }}>—</span>
            },
            {
              key: "_damagedInput", label: "تالف",
              render: (_, row) => checkedItems.includes(row.ReturnOrderItemId) ? (
                <input type="number" min={0} value={receivingData[row.ReturnOrderItemId]?.damaged ?? 0}
                  onChange={e => updateReceiving(row.ReturnOrderItemId, "damaged", e.target.value)}
                  style={{ width: 60, padding: "4px 6px", borderRadius: 6, border: "1.5px solid #E74C3C", fontSize: 14, textAlign: "center", fontWeight: 700, color: "#E74C3C" }} />
              ) : <span style={{ color: "#aaa" }}>—</span>
            },
          ] : [
            { key: "ReceivedGood", label: "سليم (مستلَم)", render: v => v != null ? <span style={{ color: "#27AE60", fontWeight: 700 }}>{v}</span> : "—" },
            { key: "ReceivedDamaged", label: "تالف (مستلَم)", render: v => v != null && v > 0 ? <span style={{ color: "#E74C3C", fontWeight: 700 }}>{v}</span> : "—" },
          ]),
        ]}
        rows={Items}
      />

      {/* أزرار */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        {user?.user?.Permissions?.includes("EditReturnOrders") && (Status === "Draft" || Status === "Approved") &&
          <Btn variant="outline" onClick={() => onEdit(order)}>✏️ تعديل</Btn>}
        {Status === "Draft" && (<>
          {user?.user?.Permissions?.includes("ApproveReturnOrders") && <Btn variant="success" onClick={handleApprove}>✅ اعتماد</Btn>}
          {user?.user?.Permissions?.includes("DeleteReturnOrders") && <Btn variant="danger" onClick={handleDelete}>🗑 حذف</Btn>}
        </>)}
        {isApproved && (<>
          {user?.user?.Permissions?.includes("LoadReturnOrders") &&
            <Btn variant="warning" onClick={handleConfirmLoading} disabled={checkedItems.length !== Items.length || loadingConfirm}>
              {loadingConfirm ? "جارٍ التحميل..." : checkedItems.length === Items.length ? `🚚 تحميل من المخيم ✓` : `🚚 حدد كل البنود أولاً (${checkedItems.length}/${Items.length})`}
            </Btn>}
          {user?.user?.Permissions?.includes("PrintReturnOrders") && <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة</Btn>}
        </>)}
        {Status === "Loaded" && user?.user?.Permissions?.includes("LoadReturnOrders") && (
          <Btn variant="primary" onClick={handleSetInTransit} disabled={loadingConfirm}>
            {loadingConfirm ? "جارٍ التحديث..." : "🚛 وصلت السيارة — في الطريق للمستودع"}
          </Btn>
        )}
        {isReceiving && user?.user?.Permissions?.includes("ReceiveReturnOrders") && (
          <Btn variant="success" onClick={handleConfirmReceiving} disabled={checkedItems.length === 0 || loadingConfirm}>
            {loadingConfirm ? "جارٍ الحفظ..." : `📦 تأكيد الاستلام في المستودع (${checkedItems.length}/${Items.length})`}
          </Btn>
        )}
        {(Status === "Received" || Status === "PartialReceived") &&
          <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة تقرير الاستلام</Btn>}
      </div>
    </div>
  );
};
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2px solid #f0f0f0", paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>📦 بيان الأصناف — {order.ReturnOrderNumber}</h3>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              <StatusBadge Status={Status} /> &nbsp; | &nbsp;
              <b>المصدر:</b> {order.Destination} &nbsp; | &nbsp;
              <b>التاريخ:</b> {order.ReturnDate?.slice(0, 10)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#888" }}>×</button>
        </div>

        <TableComp
          cols={[
            { key: "_seq", label: "#", render: (_, __, idx) => idx + 1 },
            { key: "AssetTypeName", label: "نوع الأصل" },
            { key: "ModelName", label: "الموديل", render: v => v || "—" },
            { key: "ReturnReasonAr", label: "السبب", render: (v, row) => <ReasonBadge reason={row.ReturnReason} /> },
            { key: "RequestedQuantity", label: "المطلوب" },
            { key: "ReportedDamaged", label: "تالف (تقرير)", render: v => v > 0 ? <span style={{ color: "#E74C3C", fontWeight: 700 }}>{v}</span> : "—" },
            { key: "LoadedQuantity", label: "المحمّل", render: v => v ?? "—" },
            { key: "ReceivedGood", label: "سليم", render: v => v != null ? <span style={{ color: "#27AE60", fontWeight: 700 }}>{v}</span> : "—" },
            { key: "ReceivedDamaged", label: "تالف", render: v => v != null && v > 0 ? <span style={{ color: "#E74C3C", fontWeight: 700 }}>{v}</span> : "—" },
          ]}
          rows={Items}
        />

        <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
          <div><b>عدد الأصناف:</b> <span style={{ color: "#2E86C1", fontWeight: 700 }}>{Items.length}</span></div>
          <div><b>إجمالي المطلوب:</b> <span style={{ color: "#1a56db", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.RequestedQuantity || 0), 0)}</span></div>
          <div><b>إجمالي المحمّل:</b> <span style={{ color: "#E67E22", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.LoadedQuantity || 0), 0)}</span></div>
          <div><b>إجمالي السليم:</b> <span style={{ color: "#27AE60", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.ReceivedGood || 0), 0)}</span></div>
          <div><b>إجمالي التالف:</b> <span style={{ color: "#E74C3C", fontWeight: 700 }}>{Items.reduce((s, i) => s + (i.ReceivedDamaged || 0), 0)}</span></div>
        </div>

        <div style={{ marginTop: 20, textAlign: "left" }}>
          <Btn variant="ghost" onClick={onClose}>إغلاق</Btn>
        </div>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────
// RETURN ORDERS LIST
// ─────────────────────────────────────────────
const ReturnOrdersList = ({ onSelect, onCreate, refreshKey, onRefresh, assetTypes = [] }) => {
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

  // عند تغيير نوع الأصل → جيب الموديلات
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
      } catch { setModelOptions([]); }
      finally { setLoadingModels(false); }
    })();
  }, [filters.AssetTypeId]);

  const loadOrders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const clean = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) clean[k] = v; });
      clean.PageSize = 250; clean.CurrentPage = 1;
      const d = await api.getReturnOrders(clean);
      setOrders(d.results || d.Results || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [filters]);

  const loadCounts = useCallback(async () => {
    try {
      const d = await api.getReturnOrders({ PageSize: 1000, CurrentPage: 1 });
      const all = d.results || d.Results || [];
      const c = {};
      all.forEach(o => { c[o.Status] = (c[o.Status] || 0) + 1; });
      setStatusCounts(c);
    } catch { }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders, refreshKey]);
  useEffect(() => { loadCounts(); }, [loadCounts, refreshKey]);

  const handleShowItems = async (order) => {
    setLoadingItems(true);
    try {
      const fullOrder = await api.getReturnOrder(order.ReturnOrderId);
      setItemsModalOrder(fullOrder);
    } catch (e) { alert(e.message || "فشل تحميل الأصناف"); }
    finally { setLoadingItems(false); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", background: "#F7F8FA", borderRadius: 12, padding: 16, marginBottom: 20, direction: "rtl" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>الحالة</label>
          <select value={filters.Status} onChange={e => setF("Status", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>{Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 130px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>المصدر</label>
          <select value={filters.Destination} onChange={e => setF("Destination", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>{DestinationS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>نوع الأصل</label>
          <AntSelect showSearch value={filters.AssetTypeId || undefined}
            onChange={v => { setF("AssetTypeId", v || ""); setF("AssetModelId", ""); }}
            placeholder="كل الأنواع" optionFilterProp="label" style={{ width: "100%", direction: "rtl" }}
            options={assetTypes.map(t => ({ value: t.AssetTypeId, label: t.AssetTypeName || t.name }))} allowClear />
        </div>
        {filters.AssetTypeId && (
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>
              الموديل {loadingModels && <span style={{ color: "#aaa", fontSize: 11 }}>(جارٍ التحميل...)</span>}
            </label>
            <AntSelect showSearch value={filters.AssetModelId || undefined}
              onChange={v => setF("AssetModelId", v || "")}
              placeholder="كل الموديلات" optionFilterProp="label" style={{ width: "100%", direction: "rtl" }}
              options={modelOptions.map(m => ({ value: m.AssetModelId, label: `${m.ModelName}${m.Brand ? ` - ${m.Brand}` : ""}${m.ModelNumber ? ` - ${m.ModelNumber}` : ""}` }))}
              disabled={loadingModels || modelOptions.length === 0} allowClear />
          </div>
        )}
        <div style={{ flex: "2 1 200px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>بحث</label>
          <input placeholder="رقم الأمر، المخيم، السائق..." value={filters.Keyword} onChange={e => setF("Keyword", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }} />
        </div>
        <Btn variant="ghost" onClick={() => setFilters({ Status: "", Destination: "", Keyword: "", AssetTypeId: "", AssetModelId: "" })} small>مسح الفلاتر</Btn>
        {user?.user?.Permissions?.includes("AddReturnOrders") && <Btn variant="primary" onClick={onCreate}>+ إنشاء أمر استرجاع</Btn>}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([st, cfg]) => (
          <div key={st} onClick={() => setF("Status", filters.Status === st ? "" : st)}
            style={{ padding: "8px 16px", borderRadius: 30, background: cfg.bg, border: `2px solid ${filters.Status === st ? cfg.color : "transparent"}`, cursor: "pointer", fontSize: 13, color: cfg.color, fontWeight: 600 }}>
            {cfg.label} ({statusCounts[st] || 0})
          </div>
        ))}
      </div>

      {loading ? <Loader /> : error ? <ErrorMsg msg={error} onRetry={loadOrders} /> : (<>
        <TableComp
          cols={[
            { key: "_seq", label: "#", render: (_, row, idx) => idx + 1 },
            { key: "ReturnOrderNumber", label: "رقم الأمر" },
            { key: "ReturnDate", label: "التاريخ", render: v => v?.slice(0, 10) },
            { key: "Destination", label: "المصدر" },
            { key: "CampNames", label: "المخيمات", render: (v, row) => row.IsGeneralReturn ? <span style={{ color: "#8E44AD", fontWeight: 700 }}>🔄 استرجاع عام</span> : row.ForAllCamps ? <span style={{ color: "#27AE60", fontWeight: 700 }}>✓ كل المخيمات</span> : (v || "—") },
            { key: "ManagerName", label: "المسئول" },
            { key: "Status", label: "الحالة", render: v => <StatusBadge Status={v} /> },
            {
              key: "ItemCount", label: "الأصناف",
              render: (v, row) => (
                <button onClick={(e) => { e.stopPropagation(); handleShowItems(row); }}
                  disabled={loadingItems} title="عرض بيان الأصناف"
                  style={{
                    background: "#EBF5FB", color: "#1a56db", border: "1.5px solid #1a56db",
                    borderRadius: 20, padding: "3px 14px", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, transition: "all .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1a56db"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#EBF5FB"; e.currentTarget.style.color = "#1a56db"; }}>
                  📦 {v || 0}
                </button>
              )
            },
            { key: "TotalRequested", label: "المطلوب" },
            { key: "TotalDamaged", label: "التالف", render: v => v > 0 ? <span style={{ color: "#E74C3C", fontWeight: 700 }}>{v}</span> : "—" },
            { key: "Notes", label: "ملاحظات" },
          ]}
          rows={orders}
          onRowClick={onSelect}
        />
        <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>إجمالي: {orders.length} أمر</div>
      </>)}

      <ItemsModal open={!!itemsModalOrder} onClose={() => setItemsModalOrder(null)} order={itemsModalOrder} />
    </div>
  );
};

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function ReturnOrders() {
  const [assetTypes, setAssetTypes] = useState([]);
  const [view, setView] = useState("list");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [showSearchModel, setShowSearchModel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [camps, setCamps] = useState([]);
  const [campManagers, setCampManagers] = useState([]);

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
  const handleEdit = (order) => { setEditOrder(order); setShowForm(true); };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ margin: "0 auto", padding: "" }}>
        {(showForm || editOrder) ? (
          <div className={"returnOrders-card"}>
            <h3 style={{ direction: "rtl", marginTop: 0 }}>
              {editOrder?.ReturnOrderId ? "تعديل أمر الاسترجاع" : "إنشاء أمر استرجاع جديد"}
            </h3>
            <ReturnOrderForm initial={editOrder} assetTypes={assetTypes} camps={camps} campManagers={campManagers}
              onSave={handleSaveOrder}
              onCancel={() => { setShowForm(false); setEditOrder(null); setView(selectedOrderId ? "detail" : "list"); }} />
          </div>
        ) : view === "detail" && selectedOrderId ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
            <ReturnOrderDetail orderId={selectedOrderId}
              onBack={() => { setView("list"); setSelectedOrderId(null); }}
              onEdit={handleEdit} onRefresh={triggerRefresh} />
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, direction: "rtl" }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>🔄 أوامر الاسترجاع</h2>
              <Btn variant="outline" onClick={() => setShowSearchModel(true)} style={{ background: "#8E44AD", color: "#fff", border: "none" }}>
                🔍 بحث بالموديل
              </Btn>
            </div>
           <ReturnOrdersList refreshKey={refreshKey} assetTypes={assetTypes}
  onSelect={o => { setSelectedOrderId(o.ReturnOrderId); setView("detail"); }}
  onCreate={() => { setEditOrder(null); setShowForm(true); setView("create"); }}
  onRefresh={triggerRefresh} />
          </div>
        )}
      </div>

      <SearchModelDistributionModal
        open={showSearchModel}
        onClose={() => setShowSearchModel(false)}
        assetTypes={assetTypes}
      />
    </div>
  );
}
