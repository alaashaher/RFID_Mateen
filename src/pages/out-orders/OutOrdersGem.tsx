import { useState, useEffect, useCallback } from "react";
import "./OutOrdersGem.module.scss";

// ─────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────
const BASE_URL = "http://localhost:7228/api";

const api = {
  getDispatchOrders: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${BASE_URL}/dispatch-orders?${params}`);
    if (!res.ok) throw new Error("فشل جلب أوامر الخروج");
    return res.json();
  },
  getDispatchOrder: async (id) => {
    const res = await fetch(`${BASE_URL}/dispatch-orders/${id}`);
    if (!res.ok) throw new Error("فشل جلب تفاصيل الأمر");
    return res.json();
  },
  createDispatchOrder: async (body) => {
    const res = await fetch(`${BASE_URL}/dispatch-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("فشل إنشاء الأمر");
    return res.json();
  },
  updateDispatchOrder: async (id, body) => {
    const res = await fetch(`${BASE_URL}/dispatch-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("فشل تعديل الأمر");
    return res.json();
  },
  approveDispatchOrder: async (id, approverId = 1) => { // افتراضي 1 للتجربة
    const res = await fetch(`${BASE_URL}/dispatch-orders/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approverId }),
    });
    if (!res.ok) throw new Error("فشل اعتماد الأمر");
    return res.json();
  },
  deleteDispatchOrder: async (id) => {
    const res = await fetch(`${BASE_URL}/dispatch-orders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("فشل حذف الأمر");
    return res.json();
  },
  confirmScan: async (orderId, phase, scannedAssetIds, notes = "") => {
    const res = await fetch(`${BASE_URL}/dispatch-orders/${orderId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, scannedAssetIds, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "فشل عملية السكان");
    return data;
  },
  getAssetTypes: async () => {
    const res = await fetch(`${BASE_URL}/asset-types`);
    if (!res.ok) throw new Error("فشل جلب أنواع الأصول");
    return res.json();
  },
  getAssetModels: async (assetTypeId) => {
    const res = await fetch(`${BASE_URL}/asset-models?assetTypeId=${assetTypeId}`);
    if (!res.ok) throw new Error("فشل جلب الموديلات");
    return res.json();
  },
};

// ─────────────────────────────────────────────
// CONSTANTS & SHARED COMPONENTS
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  Draft: { label: "مسودة", color: "#95A5A6", bg: "#F4F6F6" },
  Approved: { label: "معتمد", color: "#2E86C1", bg: "#EBF5FB" },
  Loaded: { label: "تم التحميل", color: "#E67E22", bg: "#FEF9E7" },
  InTransit: { label: "في الطريق", color: "#D4AC0D", bg: "#FDFEFE" },
  Received: { label: "تم الاستلام", color: "#27AE60", bg: "#EAFAF1" },
  PartialReceived: { label: "استلام جزئي", color: "#E74C3C", bg: "#FDEDEC" },
};
const DESTINATIONS = ["منى", "عرفة", "مزدلفة"];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#666", bg: "#eee" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`, whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
};

const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, small }) => {
  const base = {
    padding: small ? "5px 12px" : "8px 20px", borderRadius: 8, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 14,
    fontWeight: 600, transition: "all .15s", opacity: disabled ? .5 : 1, ...style,
  };
  const variants = {
    primary: { background: "#1a56db", color: "#fff" },
    success: { background: "#27AE60", color: "#fff" },
    danger: { background: "#E74C3C", color: "#fff" },
    outline: { background: "#fff", color: "#1a56db", border: "1.5px solid #1a56db" },
    ghost: { background: "transparent", color: "#555", border: "1px solid #ddd" },
    warning: { background: "#E67E22", color: "#fff" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", required, readOnly, placeholder, style = {} }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <input
      type={type} value={value || ""} onChange={e => onChange && onChange(e.target.value)}
      readOnly={readOnly} placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7",
        fontSize: 14, background: readOnly ? "#f5f5f5" : "#fff", outline: "none",
        boxSizing: "border-box", direction: "rtl", ...style,
      }}
    />
  </div>
);

const Select = ({ label, value, onChange, options = [], required, placeholder = "اختر...", disabled }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <select
      value={value || ""} onChange={e => onChange && onChange(e.target.value)} disabled={disabled}
      style={{
        width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7",
        fontSize: 14, background: "#fff", direction: "rtl", boxSizing: "border-box",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Table = ({ cols, rows, onRowClick }) => (
  <div className={"outOrdersGem-tableWrapper"}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, direction: "rtl" }}>
      <thead>
        <tr style={{ background: "#F7F8FA" }}>
          {cols.map(c => (
            <th key={c.key} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#555", borderBottom: "2px solid #e8e8e8", whiteSpace: "nowrap" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>لا توجد بيانات</td></tr>
        ) : rows.map((row, i) => (
          <tr
            key={i} onClick={() => onRowClick && onRowClick(row)}
            style={{ borderBottom: "1px solid #f0f0f0", cursor: onRowClick ? "pointer" : "default", background: i % 2 === 0 ? "#fff" : "#fafafa", transition: "background .1s" }}
            onMouseEnter={e => onRowClick && (e.currentTarget.style.background = "#EBF5FB")}
            onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafafa")}
          >
            {cols.map(c => (
              <td key={c.key} style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────
// ORDER FORM (Create / Edit)
// ─────────────────────────────────────────────
const emptyItem = () => ({ _id: Math.random(), assetTypeId: "", assetModelId: "", requestedQuantity: 1, notes: "" });
const emptyForm = () => ({
  dispatchDate: new Date().toISOString().slice(0, 10),
  destination: "", campNumber: "", campName: "",
  receiverName: "", receiverPhone: "", vehiclePlateNumber: "",
  driverName: "", notes: "", items: [emptyItem()],
});

const OrderForm = ({ initial, assetTypes, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || emptyForm());
  const [modelMap, setModelMap] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchModels = async (typeId) => {
    if (!typeId || modelMap[typeId]) return;
    try {
      const data = await api.getAssetModels(typeId);
      setModelMap(m => ({ ...m, [typeId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  // Load models for editing an existing order
  useEffect(() => {
    if (initial?.items) {
      initial.items.forEach(item => {
        if (item.assetTypeId) fetchModels(item.assetTypeId);
      });
    }
  }, [initial]);

  const updateItem = (idx, k, v) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [k]: v };
      if (k === "assetTypeId") {
        items[idx].assetModelId = "";
        fetchModels(v);
      }
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSave = async (status) => {
    setSaving(true);
    // API expects requestedQuantity as integer and ModelId as integer/null
    const payload = {
      ...form,
      status, // Optional, depending on API. API sets draft by default on creation.
      items: form.items.map(i => ({
        assetTypeId: Number(i.assetTypeId),
        assetModelId: i.assetModelId ? Number(i.assetModelId) : null,
        requestedQuantity: Number(i.requestedQuantity),
        notes: i.notes
      }))
    };
    await onSave(payload, status);
    setSaving(false);
  };

  const typeOpts = assetTypes.map(t => ({ value: t.assetTypeId, label: t.assetTypeName }));

  return (
    <div>
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📋 معلومات الأمر</h4>
        <div className={"outOrdersGem-formGrid"}>
          <Input label="رقم الأمر" value={form.dispatchOrderNumber || "(تلقائي)"} readOnly />
          <Input label="تاريخ الخروج" value={form.dispatchDate?.slice(0, 10)} onChange={v => setField("dispatchDate", v)} type="date" required />
          <Select label="الوجهة" value={form.destination} onChange={v => setField("destination", v)} options={DESTINATIONS.map(d => ({ value: d, label: d }))} required />
          <Input label="رقم المخيم" value={form.campNumber} onChange={v => setField("campNumber", v)} />
          <Input label="اسم المخيم" value={form.campName} onChange={v => setField("campName", v)} />
          <Input label="اسم المستلم" value={form.receiverName} onChange={v => setField("receiverName", v)} required />
          <Input label="هاتف المستلم" value={form.receiverPhone} onChange={v => setField("receiverPhone", v)} />
          <Input label="رقم لوحة السيارة" value={form.vehiclePlateNumber} onChange={v => setField("vehiclePlateNumber", v)} />
          <Input label="اسم السائق" value={form.driverName} onChange={v => setField("driverName", v)} />
        </div>
        <div style={{ marginBottom: 0 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>ملاحظات</label>
          <textarea value={form.notes} onChange={e => setField("notes", e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, direction: "rtl", boxSizing: "border-box", resize: "vertical", minHeight: 60 }} />
        </div>
      </div>

      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📦 بنود الأصناف</h4>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, direction: "rtl" }}>
            <thead>
              <tr style={{ background: "#e8edf3" }}>
                {["نوع الأصل *", "الموديل", "الكمية المطلوبة *", "ملاحظات", ""].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#555" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => {
                const typeObj = assetTypes.find(t => String(t.assetTypeId) === String(item.assetTypeId));
                const hasModels = typeObj?.hasModels;
                const models = modelMap[item.assetTypeId] || [];
                return (
                  <tr key={item._id || idx} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "6px 8px", minWidth: 140 }}>
                      <select value={item.assetTypeId} onChange={e => updateItem(idx, "assetTypeId", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13 }}>
                        <option value="">اختر...</option>
                        {typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 130 }}>
                      {hasModels ? (
                        <select value={item.assetModelId || ""} onChange={e => updateItem(idx, "assetModelId", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13 }}>
                          <option value="">اختر موديل...</option>
                          {models.map(m => <option key={m.assetModelId} value={m.assetModelId}>{m.modelName}</option>)}
                        </select>
                      ) : <span style={{ color: "#aaa", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 100 }}>
                      <input type="number" min={1} value={item.requestedQuantity}
                        onChange={e => updateItem(idx, "requestedQuantity", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 130 }}>
                      <input value={item.notes || ""} onChange={e => updateItem(idx, "notes", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <button onClick={() => removeItem(idx)} disabled={form.items.length === 1}
                        style={{ background: "none", border: "none", color: "#E74C3C", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn variant="ghost" onClick={addItem} small>+ إضافة سطر</Btn>
        </div>
      </div>

      <div className={"outOrdersGem-btnGroup"}>
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="outline" onClick={() => handleSave("Draft")} disabled={saving}>💾 حفظ كمسودة</Btn>
        {/* If user clicks approve directly from new form, we might need a 2-step process in backend, handled in onSave */}
        <Btn variant="success" onClick={() => handleSave("Approved")} disabled={saving}>✅ حفظ واعتماد</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ORDER DETAIL VIEW
// ─────────────────────────────────────────────
const OrderDetail = ({ orderId, onBack, onEdit, onApprove, onDelete }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getDispatchOrder(orderId);
      setOrder(data);
    } catch (err) {
      alert("خطأ في جلب التفاصيل");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>جارٍ التحميل...</div>;
  if (!order) return null;

  const { status, items = [], scannedAssets = [] } = order;

  const infoRows = [
    ["رقم الأمر", order.dispatchOrderNumber],
    ["التاريخ", order.dispatchDate?.slice(0, 10)],
    ["الوجهة", order.destination],
    ["رقم المخيم", order.campNumber],
    ["اسم المخيم", order.campName],
    ["المستلم", order.receiverName],
    ["هاتف المستلم", order.receiverPhone],
    ["لوحة السيارة", order.vehiclePlateNumber],
    ["السائق", order.driverName],
    ["ملاحظات", order.notes],
  ];

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1a56db" }}>← رجوع</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>تفاصيل أمر الخروج — {order.dispatchOrderNumber}</h2>
        <StatusBadge status={status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 0", background: "#F7F8FA", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
        {infoRows.map(([k, v]) => v ? (
          <div key={k} style={{ padding: "4px 0", display: "flex", gap: 8 }}>
            <span style={{ fontWeight: 600, color: "#555", minWidth: 110, fontSize: 13 }}>{k}:</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ) : null)}
      </div>

      <h4 style={{ marginBottom: 10 }}>مقارنة الكميات</h4>
      <Table
        cols={[
          { key: "assetTypeName", label: "نوع الأصل" },
          { key: "modelName", label: "الموديل" },
          { key: "requestedQuantity", label: "المطلوب" },
          { key: "loadedQuantity", label: "المحمّل" },
          { key: "receivedQuantity", label: "المستلَم" },
          {
            key: "shortage", label: "الفرق",
            render: (shortage) => {
              return <span style={{ color: shortage > 0 ? "#E74C3C" : shortage < 0 ? "#E67E22" : "#27AE60", fontWeight: 700 }}>
                {shortage > 0 ? `-${shortage} (ناقص)` : shortage < 0 ? `+${Math.abs(shortage)} (زيادة)` : "✓ مكتمل"}
              </span>;
            }
          },
        ]}
        rows={items}
      />

      {scannedAssets.length > 0 && (
        <>
          <h4 style={{ marginTop: 20, marginBottom: 10 }}>الأصول الفعلية المقروءة (RFID)</h4>
          <Table
            cols={[
              { key: "assetBarcode", label: "الباركود" },
              { key: "rfidCode", label: "RFID" },
              { key: "assetName", label: "اسم الأصل" },
              { key: "scanPhase", label: "مرحلة السكان", render: v => v === "Loaded" ? "🚚 تحميل" : "📦 استلام" },
              { key: "scannedDate", label: "التاريخ", render: v => v?.slice(0, 16).replace("T", " ") },
            ]}
            rows={scannedAssets}
          />
        </>
      )}

      <div className={"outOrdersGem-btnGroup"} style={{ marginTop: 24 }}>
        {status === "Draft" && (
          <>
            <Btn variant="outline" onClick={() => onEdit(order)}>✏️ تعديل</Btn>
            <Btn variant="success" onClick={() => onApprove(order.dispatchOrderId).then(fetchDetails)}>✅ اعتماد</Btn>
            <Btn variant="danger" onClick={() => onDelete(order.dispatchOrderId)}>🗑 حذف</Btn>
          </>
        )}
        {status === "Approved" && <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة إذن الخروج</Btn>}
        {status === "Received" && <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة تقرير الاستلام</Btn>}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ORDERS LIST PAGE
// ─────────────────────────────────────────────
const OrdersList = ({ orders, onSelect, onCreate, onFilterChange }) => {
  const [filters, setFilters] = useState({ status: "", destination: "", keyword: "" });
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  // Call API filtering when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  return (
    <div>
      <div style={{
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
        background: "#F7F8FA", borderRadius: 12, padding: 16, marginBottom: 20, direction: "rtl",
      }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>الحالة</label>
          <select value={filters.status} onChange={e => setF("status", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>الوجهة</label>
          <select value={filters.destination} onChange={e => setF("destination", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl" }}>
            <option value="">الكل</option>
            {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: "2 1 220px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#555" }}>بحث</label>
          <input placeholder="رقم الأمر، المستلم، المخيم..." value={filters.keyword} onChange={e => setF("keyword", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }} />
        </div>
        <Btn variant="ghost" onClick={() => setFilters({ status: "", destination: "", keyword: "" })} small>مسح الفلاتر</Btn>
        <Btn variant="primary" onClick={onCreate}>+ إنشاء أمر جديد</Btn>
      </div>

      <Table
        cols={[
          { key: "dispatchOrderNumber", label: "رقم الأمر" },
          { key: "dispatchDate", label: "التاريخ", render: v => v?.slice(0, 10) },
          { key: "destination", label: "الوجهة" },
          { key: "campNumber", label: "رقم المخيم" },
          { key: "receiverName", label: "المستلم" },
          { key: "status", label: "الحالة", render: v => <StatusBadge status={v} /> },
          { key: "itemCount", label: "الأصناف" },
          { key: "totalRequested", label: "إجمالي المطلوب" },
        ]}
        rows={orders}
        onRowClick={onSelect}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// MOBILE RFID SCAN SCREEN
// ─────────────────────────────────────────────
const ScanScreen = ({ phase, orders, onComplete }) => {
  const validStatuses = phase === "Loaded" ? ["Approved"] : ["Loaded", "InTransit"];
  const validOrders = orders.filter(o => validStatuses.includes(o.status));

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderDetail, setOrderDetail] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedAssetIds, setScannedAssetIds] = useState([]); // In real life, coming from RFID reader
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch full details when an order is selected
  useEffect(() => {
    if (selectedOrderId) {
      api.getDispatchOrder(selectedOrderId).then(setOrderDetail).catch(console.error);
    } else {
      setOrderDetail(null);
    }
  }, [selectedOrderId]);

  // محاكاة قراءة RFID لأغراض الاختبار (يحتاج ربط بجهاز الـ RFID الحقيقي لاحقاً)
  useEffect(() => {
    if (!scanning || !orderDetail) return;
    const interval = setInterval(() => {
      // هنا نفترض أن القارئ يعطينا UniversityAssetId، سنقوم بمحاكاتها
      const mockAssetId = Math.floor(Math.random() * 1000) + 1;
      setScannedAssetIds(prev => {
        if (prev.includes(mockAssetId)) return prev;
        return [mockAssetId, ...prev];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [scanning, orderDetail]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const result = await api.confirmScan(selectedOrderId, phase, scannedAssetIds);
      if (result.success) {
        setConfirmed(true);
        onComplete(); // refresh main list
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => { setSelectedOrderId(""); setScannedAssetIds([]); setScanning(false); setConfirmed(false); };

  const phaseLabel = phase === "Loaded" ? "سكان التحميل 🚚" : "سكان الاستلام 📦";
  const confirmBtnLabel = phase === "Loaded" ? "تأكيد التحميل" : "تأكيد الاستلام";

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", direction: "rtl" }}>
      <div style={{ background: phase === "Loaded" ? "#E67E22" : "#27AE60", color: "#fff", borderRadius: 16, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 28 }}>{phase === "Loaded" ? "🚚" : "📦"}</div>
        <h3 style={{ margin: 0, fontSize: 20 }}>{phaseLabel}</h3>
      </div>

      {confirmed ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <h3 style={{ color: "#27AE60" }}>تم {phase === "Loaded" ? "التحميل" : "الاستلام"} بنجاح!</h3>
          <Btn variant="primary" onClick={reset}>أمر جديد</Btn>
        </div>
      ) : (
        <>
          <Select
            label="اختر أمر الخروج" value={selectedOrderId} onChange={setSelectedOrderId}
            options={validOrders.map(o => ({ value: o.dispatchOrderId, label: `${o.dispatchOrderNumber} — ${o.destination}` }))}
            required
          />

          {orderDetail && (
            <>
              <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
                <div><b>الوجهة:</b> {orderDetail.destination} | <b>المستلم:</b> {orderDetail.receiverName}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px" }}>
                  <span style={{ fontWeight: 700 }}>إجمالي القراءات الحالية</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#F1C40F" }}>
                    {scannedAssetIds.length}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!scanning ? (
                  <Btn variant={phase === "Loaded" ? "warning" : "success"} onClick={() => setScanning(true)}>
                    📡 بدء القراءة الجماعية
                  </Btn>
                ) : (
                  <Btn variant="danger" onClick={() => setScanning(false)}>⏹ إيقاف القراءة</Btn>
                )}
                <Btn variant="primary" onClick={handleConfirm} disabled={scannedAssetIds.length === 0 || confirming}>
                  {confirming ? "جارٍ الحفظ..." : `✅ ${confirmBtnLabel}`}
                </Btn>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function OutOrdersGem() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [view, setView] = useState("list");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrderData, setEditOrderData] = useState(null);

  const loadOrders = async (filters = {}) => {
    try {
      const data = await api.getDispatchOrders(filters);
      setOrders(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssetTypes = async () => {
    try {
      const data = await api.getAssetTypes();
      setAssetTypes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOrders();
    loadAssetTypes();
  }, []);

  const handleSaveOrder = async (formData, expectedStatus) => {
    try {
      let createdId = null;
      if (editOrderData) {
        await api.updateDispatchOrder(editOrderData.dispatchOrderId, formData);
        createdId = editOrderData.dispatchOrderId;
      } else {
        const res = await api.createDispatchOrder(formData);
        createdId = res.dispatchOrderId;
      }

      // إذا اختار المستخدم "حفظ واعتماد" مباشرة (2 steps)
      if (expectedStatus === "Approved" && createdId) {
        await api.approveDispatchOrder(createdId);
      }

      loadOrders();
      setShowForm(false);
      setEditOrderData(null);
      setSelectedOrderId(null);
      setView("list");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveDispatchOrder(id);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأمر؟")) return;
    try {
      await api.deleteDispatchOrder(id);
      loadOrders();
      setView("list");
      setSelectedOrderId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={"outOrdersGem-container"}>
      {/* يمكن تفعيل القائمة العلوية هنا للتنقل بين التابات */}
      <div className={"outOrdersGem-content"}>

        {/* أزرار التنقل السريعة (مؤقتة للتجربة) */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, direction: "rtl" }}>
          <Btn variant={tab === "orders" ? "primary" : "outline"} onClick={() => { setTab("orders"); setView("list"); }}>أوامر الخروج 📋</Btn>
          <Btn variant={tab === "scanLoad" ? "primary" : "outline"} onClick={() => setTab("scanLoad")}>سكان التحميل 🚚</Btn>
          <Btn variant={tab === "scanReceive" ? "primary" : "outline"} onClick={() => setTab("scanReceive")}>سكان الاستلام 📦</Btn>
        </div>

        {tab === "orders" && (
          <>
            {(showForm || editOrderData) ? (
              <div className={"outOrdersGem-card"}>
                <h3 style={{ direction: "rtl", marginTop: 0 }}>{editOrderData ? "تعديل أمر الخروج" : "إنشاء أمر خروج جديد"}</h3>
                <OrderForm
                  initial={editOrderData}
                  assetTypes={assetTypes}
                  onSave={handleSaveOrder}
                  onCancel={() => { setShowForm(false); setEditOrderData(null); setView(selectedOrderId ? "detail" : "list"); }}
                />
              </div>
            ) : view === "detail" && selectedOrderId ? (
              <div className={"outOrdersGem-card"}>
                <OrderDetail
                  orderId={selectedOrderId}
                  onBack={() => { setView("list"); setSelectedOrderId(null); }}
                  onEdit={(fullOrder) => { setEditOrderData(fullOrder); setShowForm(true); }}
                  onApprove={handleApprove}
                  onDelete={handleDelete}
                />
              </div>
            ) : (
              <div className={"outOrdersGem-card"}>
                <h2 style={{ margin: "0 0 20px", fontSize: 22, direction: "rtl" }}>أوامر الخروج</h2>
                <OrdersList
                  orders={orders}
                  onFilterChange={loadOrders}
                  onSelect={o => { setSelectedOrderId(o.dispatchOrderId); setView("detail"); }}
                  onCreate={() => { setEditOrderData(null); setShowForm(true); setView("create"); }}
                />
              </div>
            )}
          </>
        )}

        {tab === "scanLoad" && (
          <div className={"outOrdersGem-card"}>
            <ScanScreen phase="Loaded" orders={orders} onComplete={loadOrders} />
          </div>
        )}

        {tab === "scanReceive" && (
          <div className={"outOrdersGem-card"}>
            <ScanScreen phase="Received" orders={orders} onComplete={loadOrders} />
          </div>
        )}
      </div>
    </div>
  );
}