import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// API LAYER  (swap BASE_URL for your real backend)
// ─────────────────────────────────────────────
const BASE_URL = "/api";

const api = {
  // ── Dispatch Orders ──────────────────────────
  getDispatchOrders: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE_URL}/dispatch-orders?${params}`).then((r) => r.json());
  },
  getDispatchOrder: (id) =>
    fetch(`${BASE_URL}/dispatch-orders/${id}`).then((r) => r.json()),
  createDispatchOrder: (body) =>
    fetch(`${BASE_URL}/dispatch-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  updateDispatchOrder: (id, body) =>
    fetch(`${BASE_URL}/dispatch-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()),
  approveDispatchOrder: (id, approverId) =>
    fetch(`${BASE_URL}/dispatch-orders/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approverId }),
    }).then((r) => r.json()),
  deleteDispatchOrder: (id) =>
    fetch(`${BASE_URL}/dispatch-orders/${id}`, { method: "DELETE" }).then((r) =>
      r.json()
    ),

  // ── Scan / RFID ──────────────────────────────
  /** phase: "Loaded" | "Received" */
  confirmScan: (orderId, phase, scannedAssetIds, notes = "") =>
    fetch(`${BASE_URL}/dispatch-orders/${orderId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, scannedAssetIds, notes }),
    }).then((r) => r.json()),

  // ── Lookup tables ────────────────────────────
  getAssetTypes: () =>
    fetch(`${BASE_URL}/asset-types`).then((r) => r.json()),
  getAssetModels: (assetTypeId) =>
    fetch(`${BASE_URL}/asset-models?assetTypeId=${assetTypeId}`).then((r) =>
      r.json()
    ),
};

/* ── Mock data (remove once backend is ready) ── */
const MOCK_ORDERS = [
  {
    dispatchOrderId: 1,
    dispatchOrderNumber: "DO-2024-001",
    dispatchDate: "2024-06-15",
    destination: "منى",
    campNumber: "A-12",
    campName: "مخيم النور",
    receiverName: "أحمد السالم",
    receiverPhone: "0501234567",
    status: "Approved",
    vehiclePlateNumber: "ABC 1234",
    driverName: "محمد الغامدي",
    notes: "",
    items: [
      { dispatchOrderItemId: 1, assetTypeId: 1, assetTypeName: "مكيف", assetModelId: 1, assetModelName: "سامسونج 24000", requestedQuantity: 10, loadedQuantity: 0, receivedQuantity: 0 },
      { dispatchOrderItemId: 2, assetTypeId: 2, assetTypeName: "سرير", assetModelId: null, assetModelName: null, requestedQuantity: 50, loadedQuantity: 0, receivedQuantity: 0 },
    ],
    assets: [],
  },
  {
    dispatchOrderId: 2,
    dispatchOrderNumber: "DO-2024-002",
    dispatchDate: "2024-06-14",
    destination: "عرفة",
    campNumber: "B-7",
    campName: "مخيم الرحمة",
    receiverName: "خالد العتيبي",
    receiverPhone: "0557654321",
    status: "InTransit",
    vehiclePlateNumber: "XYZ 9876",
    driverName: "فيصل الدوسري",
    notes: "شحنة ثقيلة",
    items: [
      { dispatchOrderItemId: 3, assetTypeId: 1, assetTypeName: "مكيف", assetModelId: 2, assetModelName: "LG 18000", requestedQuantity: 5, loadedQuantity: 5, receivedQuantity: 0 },
    ],
    assets: [
      { dispatchOrderAssetId: 1, assetBarcode: "AC-10021", rfidCode: "RFID-0021", assetName: "مكيف LG 18000", scanPhase: "Loaded", scannedDate: "2024-06-14T10:00:00" },
    ],
  },
  {
    dispatchOrderId: 3,
    dispatchOrderNumber: "DO-2024-003",
    dispatchDate: "2024-06-13",
    destination: "مزدلفة",
    campNumber: "C-3",
    campName: "مخيم الفردوس",
    receiverName: "سعد القحطاني",
    receiverPhone: "",
    status: "Draft",
    vehiclePlateNumber: "",
    driverName: "",
    notes: "",
    items: [
      { dispatchOrderItemId: 4, assetTypeId: 3, assetTypeName: "طاولة", assetModelId: null, assetModelName: null, requestedQuantity: 20, loadedQuantity: 0, receivedQuantity: 0 },
    ],
    assets: [],
  },
];

const MOCK_ASSET_TYPES = [
  { assetTypeId: 1, name: "مكيف", hasModels: true },
  { assetTypeId: 2, name: "سرير", hasModels: false },
  { assetTypeId: 3, name: "طاولة", hasModels: false },
  { assetTypeId: 4, name: "كرسي", hasModels: false },
];
const MOCK_ASSET_MODELS = {
  1: [
    { assetModelId: 1, name: "سامسونج 24000" },
    { assetModelId: 2, name: "LG 18000" },
    { assetModelId: 3, name: "يورك 30000" },
  ],
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  Draft:           { label: "مسودة",       color: "#95A5A6", bg: "#F4F6F6" },
  Approved:        { label: "معتمد",       color: "#2E86C1", bg: "#EBF5FB" },
  Loaded:          { label: "تم التحميل", color: "#E67E22", bg: "#FEF9E7" },
  InTransit:       { label: "في الطريق",  color: "#D4AC0D", bg: "#FDFEFE" },
  Received:        { label: "تم الاستلام",color: "#27AE60", bg: "#EAFAF1" },
  PartialReceived: { label: "استلام جزئي",color: "#E74C3C", bg: "#FDEDEC" },
};
const DESTINATIONS = ["منى", "عرفة", "مزدلفة"];

// ─────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#666", bg: "#eee" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
      whiteSpace: "nowrap",
    }}>{cfg.label}</span>
  );
};

const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, small }) => {
  const base = {
    padding: small ? "5px 12px" : "8px 20px",
    borderRadius: 8,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 14,
    fontWeight: 600,
    transition: "all .15s",
    opacity: disabled ? .5 : 1,
    ...style,
  };
  const variants = {
    primary:  { background: "#1a56db", color: "#fff" },
    success:  { background: "#27AE60", color: "#fff" },
    danger:   { background: "#E74C3C", color: "#fff" },
    outline:  { background: "#fff", color: "#1a56db", border: "1.5px solid #1a56db" },
    ghost:    { background: "transparent", color: "#555", border: "1px solid #ddd" },
    warning:  { background: "#E67E22", color: "#fff" },
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
      type={type}
      value={value || ""}
      onChange={e => onChange && onChange(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1.5px solid #dde1e7",
        fontSize: 14,
        background: readOnly ? "#f5f5f5" : "#fff",
        outline: "none",
        boxSizing: "border-box",
        direction: "rtl",
        ...style,
      }}
    />
  </div>
);

const Select = ({ label, value, onChange, options = [], required, placeholder = "اختر...", disabled }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <select
      value={value || ""}
      onChange={e => onChange && onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "8px 12px",
        borderRadius: 8,
        border: "1.5px solid #dde1e7",
        fontSize: 14,
        background: "#fff",
        direction: "rtl",
        boxSizing: "border-box",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({ open, onClose, title, children, width = 700 }) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.45)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#fff", borderRadius: 16,
        width: Math.min(width, window.innerWidth - 32),
        maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        direction: "rtl",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #eee",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const Table = ({ cols, rows, onRowClick }) => (
  <div style={{ overflowX: "auto" }}>
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
            key={i}
            onClick={() => onRowClick && onRowClick(row)}
            style={{
              borderBottom: "1px solid #f0f0f0",
              cursor: onRowClick ? "pointer" : "default",
              background: i % 2 === 0 ? "#fff" : "#fafafa",
              transition: "background .1s",
            }}
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
  destination: "",
  campNumber: "",
  campName: "",
  receiverName: "",
  receiverPhone: "",
  vehiclePlateNumber: "",
  driverName: "",
  notes: "",
  items: [emptyItem()],
});

const OrderForm = ({ initial, assetTypes, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || emptyForm());
  const [modelMap, setModelMap] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fetchModels = async (typeId) => {
    if (!typeId || modelMap[typeId]) return;
    const models = MOCK_ASSET_MODELS[typeId] || [];
    setModelMap(m => ({ ...m, [typeId]: models }));
  };

  const updateItem = (idx, k, v) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [k]: v };
      if (k === "assetTypeId") { items[idx].assetModelId = ""; fetchModels(v); }
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const handleSave = async (status) => {
    setSaving(true);
    await onSave({ ...form, status });
    setSaving(false);
  };

  const typeOpts = assetTypes.map(t => ({ value: t.assetTypeId, label: t.name }));

  return (
    <div>
      {/* Section 1: Order Info */}
      <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 15, color: "#1a1a2e" }}>📋 معلومات الأمر</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="رقم الأمر" value={form.dispatchOrderNumber || "(تلقائي)"} readOnly />
          <Input label="تاريخ الخروج" value={form.dispatchDate} onChange={v => setField("dispatchDate", v)} type="date" required />
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

      {/* Section 2: Items */}
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
                  <tr key={item._id} style={{ borderBottom: "1px solid #e0e0e0" }}>
                    <td style={{ padding: "6px 8px", minWidth: 140 }}>
                      <select value={item.assetTypeId} onChange={e => updateItem(idx, "assetTypeId", e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13 }}>
                        <option value="">اختر...</option>
                        {typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 130 }}>
                      {hasModels ? (
                        <select value={item.assetModelId} onChange={e => updateItem(idx, "assetModelId", e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", direction: "rtl", fontSize: 13 }}>
                          <option value="">اختر موديل...</option>
                          {models.map(m => <option key={m.assetModelId} value={m.assetModelId}>{m.name}</option>)}
                        </select>
                      ) : <span style={{ color: "#aaa", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 100 }}>
                      <input type="number" min={1} value={item.requestedQuantity}
                        onChange={e => updateItem(idx, "requestedQuantity", Number(e.target.value))}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, textAlign: "center" }} />
                    </td>
                    <td style={{ padding: "6px 8px", minWidth: 130 }}>
                      <input value={item.notes} onChange={e => updateItem(idx, "notes", e.target.value)}
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

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="outline" onClick={() => handleSave("Draft")} disabled={saving}>💾 حفظ كمسودة</Btn>
        <Btn variant="success" onClick={() => handleSave("Approved")} disabled={saving}>✅ حفظ واعتماد</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ORDER DETAIL VIEW
// ─────────────────────────────────────────────
const OrderDetail = ({ order, onBack, onEdit, onApprove, onDelete }) => {
  if (!order) return null;
  const { status, items = [], assets = [] } = order;

  const infoRows = [
    ["رقم الأمر", order.dispatchOrderNumber],
    ["التاريخ", order.dispatchDate],
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#1a56db" }}>← رجوع</button>
        <h2 style={{ margin: 0, fontSize: 20 }}>تفاصيل أمر الخروج — {order.dispatchOrderNumber}</h2>
        <StatusBadge status={status} />
      </div>

      {/* Info card */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 0", background: "#F7F8FA", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
        {infoRows.map(([k, v]) => v ? (
          <div key={k} style={{ padding: "4px 0", display: "flex", gap: 8 }}>
            <span style={{ fontWeight: 600, color: "#555", minWidth: 110, fontSize: 13 }}>{k}:</span>
            <span style={{ fontSize: 13 }}>{v}</span>
          </div>
        ) : null)}
      </div>

      {/* Comparison table */}
      <h4 style={{ marginBottom: 10 }}>مقارنة الكميات</h4>
      <Table
        cols={[
          { key: "assetTypeName", label: "نوع الأصل" },
          { key: "assetModelName", label: "الموديل" },
          { key: "requestedQuantity", label: "المطلوب" },
          { key: "loadedQuantity", label: "المحمّل" },
          { key: "receivedQuantity", label: "المستلَم" },
          {
            key: "_diff", label: "الفرق",
            render: (_, row) => {
              const diff = row.requestedQuantity - row.receivedQuantity;
              return <span style={{ color: diff > 0 ? "#E74C3C" : diff < 0 ? "#E67E22" : "#27AE60", fontWeight: 700 }}>{diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : "✓"}</span>;
            }
          },
        ]}
        rows={items}
      />

      {/* Scanned assets */}
      {assets.length > 0 && (
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
            rows={assets}
          />
        </>
      )}

      {/* Action buttons by status */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        {status === "Draft" && (
          <>
            <Btn variant="outline" onClick={onEdit}>✏️ تعديل</Btn>
            <Btn variant="success" onClick={onApprove}>✅ اعتماد</Btn>
            <Btn variant="danger" onClick={onDelete}>🗑 حذف</Btn>
          </>
        )}
        {status === "Approved" && (
          <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة إذن الخروج</Btn>
        )}
        {status === "Received" && (
          <Btn variant="primary" onClick={() => window.print()}>🖨 طباعة تقرير الاستلام</Btn>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ORDERS LIST PAGE
// ─────────────────────────────────────────────
const OrdersList = ({ orders, onSelect, onCreate }) => {
  const [filters, setFilters] = useState({ status: "", destination: "", search: "", dateFrom: "", dateTo: "" });
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const filtered = orders.filter(o => {
    if (filters.status && o.status !== filters.status) return false;
    if (filters.destination && o.destination !== filters.destination) return false;
    if (filters.search && !JSON.stringify(o).includes(filters.search)) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
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
          <input placeholder="رقم الأمر، المستلم، المخيم..." value={filters.search} onChange={e => setF("search", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }} />
        </div>
        <Btn variant="ghost" onClick={() => setFilters({ status: "", destination: "", search: "", dateFrom: "", dateTo: "" })} small>مسح الفلاتر</Btn>
        <Btn variant="primary" onClick={onCreate}>+ إنشاء أمر جديد</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <div key={status} onClick={() => setF("status", filters.status === status ? "" : status)}
              style={{
                padding: "8px 16px", borderRadius: 30, background: cfg.bg,
                border: `2px solid ${filters.status === status ? cfg.color : "transparent"}`,
                cursor: "pointer", fontSize: 13, color: cfg.color, fontWeight: 600,
              }}>
              {cfg.label} ({count})
            </div>
          );
        })}
      </div>

      <Table
        cols={[
          { key: "dispatchOrderNumber", label: "رقم الأمر" },
          { key: "dispatchDate", label: "التاريخ" },
          { key: "destination", label: "الوجهة" },
          { key: "campNumber", label: "رقم المخيم" },
          { key: "receiverName", label: "المستلم" },
          { key: "status", label: "الحالة", render: v => <StatusBadge status={v} /> },
          { key: "_items", label: "الأصناف", render: (_, r) => r.items?.length || 0 },
          { key: "_qty", label: "إجمالي المطلوب", render: (_, r) => r.items?.reduce((s, i) => s + i.requestedQuantity, 0) || 0 },
        ]}
        rows={filtered}
        onRowClick={onSelect}
      />
      <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>إجمالي: {filtered.length} أمر</div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MOBILE RFID SCAN SCREEN
// ─────────────────────────────────────────────
const ScanScreen = ({ phase, orders }) => {
  // phase: "Loaded" | "Received"
  const validStatuses = phase === "Loaded" ? ["Approved"] : ["Loaded", "InTransit"];
  const validOrders = orders.filter(o => validStatuses.includes(o.status));

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannedAssets, setScannedAssets] = useState([]); // mock RFID reads
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const order = validOrders.find(o => o.dispatchOrderId === Number(selectedOrderId));

  // Simulate RFID scan tick
  useEffect(() => {
    if (!scanning || !order) return;
    const interval = setInterval(() => {
      // Randomly "scan" a new asset (demo only)
      const mockAsset = {
        rfidCode: `RFID-${Math.floor(Math.random() * 9000 + 1000)}`,
        assetBarcode: `BC-${Math.floor(Math.random() * 9000 + 1000)}`,
        assetTypeId: order.items[Math.floor(Math.random() * order.items.length)]?.assetTypeId,
        assetTypeName: order.items[Math.floor(Math.random() * order.items.length)]?.assetTypeName,
        scannedAt: new Date().toISOString(),
      };
      setScannedAssets(prev => {
        if (prev.length >= order.items.reduce((s, i) => s + i.requestedQuantity, 0)) {
          clearInterval(interval);
          setScanning(false);
          return prev;
        }
        if (prev.find(a => a.rfidCode === mockAsset.rfidCode)) return prev;
        return [mockAsset, ...prev];
      });
    }, 800);
    return () => clearInterval(interval);
  }, [scanning, order]);

  const handleConfirm = async () => {
    const totalRequested = order.items.reduce((s, i) => s + i.requestedQuantity, 0);
    if (scannedAssets.length < totalRequested) {
      if (!window.confirm(`تم مسح ${scannedAssets.length} من ${totalRequested}. هل تريد التأكيد رغم النقص؟`)) return;
    }
    setConfirming(true);
    // api.confirmScan(order.dispatchOrderId, phase, scannedAssets.map(a => a.rfidCode))
    await new Promise(r => setTimeout(r, 1000));
    setConfirming(false);
    setConfirmed(true);
  };

  const reset = () => { setSelectedOrderId(""); setScannedAssets([]); setScanning(false); setConfirmed(false); };

  const phaseLabel = phase === "Loaded" ? "سكان التحميل 🚚" : "سكان الاستلام 📦";
  const confirmBtnLabel = phase === "Loaded" ? "تأكيد التحميل" : "تأكيد الاستلام";
  const confirmStatus = phase === "Loaded" ? "Loaded" : "Received";

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
            label="اختر أمر الخروج"
            value={selectedOrderId}
            onChange={setSelectedOrderId}
            options={validOrders.map(o => ({ value: o.dispatchOrderId, label: `${o.dispatchOrderNumber} — ${o.destination} (${o.campNumber || "—"})` }))}
            required
          />

          {order && (
            <>
              {/* Order summary */}
              <div style={{ background: "#F7F8FA", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13 }}>
                <div><b>الوجهة:</b> {order.destination} | <b>المستلم:</b> {order.receiverName}</div>
                <div style={{ marginTop: 6 }}>
                  {order.items.map(item => (
                    <div key={item.dispatchOrderItemId} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #eee" }}>
                      <span>{item.assetTypeName}{item.assetModelName ? ` - ${item.assetModelName}` : ""}</span>
                      <span style={{ fontWeight: 700 }}>{item.requestedQuantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time scan table */}
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: "#1a1a2e", color: "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px"
                }}>
                  <span style={{ fontWeight: 700 }}>نتائج السكان</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: scannedAssets.length >= order.items.reduce((s, i) => s + i.requestedQuantity, 0) ? "#27AE60" : "#F1C40F" }}>
                    {scannedAssets.length} / {order.items.reduce((s, i) => s + i.requestedQuantity, 0)}
                  </span>
                </div>
                {order.items.map(item => {
                  const scanned = scannedAssets.filter(a => a.assetTypeId === item.assetTypeId).length;
                  const status = scanned >= item.requestedQuantity ? "✅" : scanned > item.requestedQuantity ? "❌" : "⚠️";
                  return (
                    <div key={item.dispatchOrderItemId} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "8px 14px", background: "#fff", borderBottom: "1px solid #eee", fontSize: 13
                    }}>
                      <span>{item.assetTypeName}</span>
                      <span>{status} {scanned} / {item.requestedQuantity}</span>
                    </div>
                  );
                })}
              </div>

              {/* Last scanned */}
              {scannedAssets.length > 0 && (
                <div style={{ maxHeight: 150, overflow: "auto", background: "#1a1a2e", borderRadius: 10, padding: 10, marginBottom: 14, fontFamily: "monospace", fontSize: 11, color: "#7effa0" }}>
                  {scannedAssets.slice(0, 20).map(a => (
                    <div key={a.rfidCode}>▶ {a.rfidCode} — {a.assetTypeName} — {a.scannedAt?.slice(11, 19)}</div>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!scanning ? (
                  <Btn variant={phase === "Loaded" ? "warning" : "success"} onClick={() => setScanning(true)}>
                    📡 بدء القراءة الجماعية
                  </Btn>
                ) : (
                  <Btn variant="danger" onClick={() => setScanning(false)}>⏹ إيقاف القراءة</Btn>
                )}
                <Btn variant="primary" onClick={handleConfirm} disabled={scannedAssets.length === 0 || confirming}>
                  {confirming ? "جارٍ الحفظ..." : `✅ ${confirmBtnLabel}`}
                </Btn>
                <Btn variant="ghost" onClick={reset} small>إعادة تعيين</Btn>
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
export default function OutOrders() {
  const [tab, setTab] = useState("orders");           // orders | scanLoad | scanReceive
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [assetTypes] = useState(MOCK_ASSET_TYPES);
  const [view, setView] = useState("list");            // list | detail | create | edit
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);

  const saveOrder = async (formData) => {
    if (editOrder) {
      // await api.updateDispatchOrder(editOrder.dispatchOrderId, formData);
      setOrders(prev => prev.map(o => o.dispatchOrderId === editOrder.dispatchOrderId ? { ...o, ...formData } : o));
    } else {
      const newOrder = {
        ...formData,
        dispatchOrderId: Date.now(),
        dispatchOrderNumber: `DO-2024-${String(orders.length + 1).padStart(3, "0")}`,
        assets: [],
      };
      setOrders(prev => [newOrder, ...prev]);
    }
    setShowForm(false);
    setEditOrder(null);
    setSelectedOrder(null);
    setView("list");
  };

  const approveOrder = () => {
    setOrders(prev => prev.map(o => o.dispatchOrderId === selectedOrder.dispatchOrderId ? { ...o, status: "Approved" } : o));
    setSelectedOrder(o => ({ ...o, status: "Approved" }));
  };

  const deleteOrder = () => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأمر؟")) return;
    setOrders(prev => prev.filter(o => o.dispatchOrderId !== selectedOrder.dispatchOrderId));
    setView("list");
    setSelectedOrder(null);
  };

  const TABS = [
    { id: "orders", label: "أوامر الخروج 📋" },
    { id: "scanLoad", label: "سكان التحميل 🚚" },
    { id: "scanReceive", label: "سكان الاستلام 📦" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Top Nav */}
      {/* <div style={{
        background: "#1a1a2e", color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56, direction: "rtl",
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setView("list"); setSelectedOrder(null); setShowForm(false); }}
              style={{
                background: tab === t.id ? "rgba(255,255,255,.15)" : "transparent",
                border: "none", color: "#fff", padding: "6px 16px", borderRadius: 8,
                cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                borderBottom: tab === t.id ? "2px solid #1a56db" : "2px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>🏢 نظام إدارة الأصول — الراجحي</div>
      </div> */}

      {/* Content */}
      <div style={{  margin: "0 auto", padding: "28px 20px" }}>

        {/* Orders Tab */}
        {tab === "orders" && (
          <>
            {(showForm || editOrder) ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
                <h3 style={{ direction: "rtl", marginTop: 0 }}>{editOrder ? "تعديل أمر الخروج" : "إنشاء أمر خروج جديد"}</h3>
                <OrderForm
                  initial={editOrder}
                  assetTypes={assetTypes}
                  onSave={saveOrder}
                  onCancel={() => { setShowForm(false); setEditOrder(null); setView(selectedOrder ? "detail" : "list"); }}
                />
              </div>
            ) : view === "detail" && selectedOrder ? (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
                <OrderDetail
                  order={orders.find(o => o.dispatchOrderId === selectedOrder.dispatchOrderId) || selectedOrder}
                  onBack={() => { setView("list"); setSelectedOrder(null); }}
                  onEdit={() => { setEditOrder(orders.find(o => o.dispatchOrderId === selectedOrder.dispatchOrderId)); setShowForm(true); }}
                  onApprove={approveOrder}
                  onDelete={deleteOrder}
                />
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, direction: "rtl" }}>
                  <h2 style={{ margin: 0, fontSize: 22 }}>أوامر الخروج</h2>
                </div>
                <OrdersList
                  orders={orders}
                  onSelect={o => { setSelectedOrder(o); setView("detail"); }}
                  onCreate={() => { setEditOrder(null); setShowForm(true); setView("create"); }}
                />
              </div>
            )}
          </>
        )}

        {/* Scan Load Tab */}
        {tab === "scanLoad" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
            <ScanScreen phase="Loaded" orders={orders} />
          </div>
        )}

        {/* Scan Receive Tab */}
        {tab === "scanReceive" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>
            <ScanScreen phase="Received" orders={orders} />
          </div>
        )}
      </div>
    </div>
  );
}