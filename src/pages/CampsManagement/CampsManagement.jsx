import { useState, useEffect, useCallback } from "react";
import { getFromApi, postToApi, putToApi, deleteFromApi } from "../../apis/apis";

// ─────────────────────────────────────────────
// API LAYER
// ─────────────────────────────────────────────
const api = {
  getCamps: () => getFromApi(`DispatchOrder/get-camps`),
  getCampManagers: () => getFromApi(`DispatchOrder/get-camp-managers`),
  addCamp: (body) => postToApi(`DispatchOrder/add-camp`, body),
  updateCamp: (body) => putToApi(`DispatchOrder/update-camp`, body),
  deleteCamp: (id) => deleteFromApi(`DispatchOrder/delete-camp?id=${id}`),
  addCampManager: (body) => postToApi(`DispatchOrder/add-camp-manager`, body),
  updateCampManager: (body) => putToApi(`DispatchOrder/update-camp-manager`, body),
  deleteCampManager: (id) => deleteFromApi(`DispatchOrder/delete-camp-manager?id=${id}`),
};

const DESTINATIONS = ["منى", "عرفة", "مزدلفة"];

// ─────────────────────────────────────────────
// SHARED COMPONENTS (same style as OutOrders)
// ─────────────────────────────────────────────
const Loader = ({ text = "جارٍ التحميل..." }) => (
  <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div><div>{text}</div>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style = {}, small }) => {
  const base = { padding: small ? "5px 12px" : "8px 20px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 12 : 14, fontWeight: 600, transition: "all .15s", opacity: disabled ? .5 : 1, ...style };
  const variants = { primary: { background: "#1a56db", color: "#fff" }, success: { background: "#27AE60", color: "#fff" }, danger: { background: "#E74C3C", color: "#fff" }, outline: { background: "#fff", color: "#1a56db", border: "1.5px solid #1a56db" }, ghost: { background: "transparent", color: "#555", border: "1px solid #ddd" }, warning: { background: "#E67E22", color: "#fff" } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
};

const Input = ({ label, value, onChange, type = "text", required, readOnly, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4 }}>{label}{required && <span style={{ color: "#E74C3C" }}> *</span>}</label>}
    <input type={type} value={value || ""} onChange={e => onChange && onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder}
      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #dde1e7", fontSize: 14, background: readOnly ? "#f5f5f5" : "#fff", outline: "none", boxSizing: "border-box", direction: "rtl" }} />
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

const Modal = ({ open, onClose, title, children, width = 550 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: Math.min(width, window.innerWidth - 32), maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)", direction: "rtl" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
};

const TableComp = ({ cols, rows, onRowClick }) => (
  <div style={{ overflowX: "auto" }}>
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
// CAMP MANAGER FORM (Modal)
// ─────────────────────────────────────────────
const CampManagerForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { ManagerName: "", ManagerPhone: "", ManagerTitle: "مسئول استلام" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.ManagerName) { setError("اسم المسئول مطلوب"); return; }
    setError(null); setSaving(true);
    try {
      let result;
      if (initial?.CampManagerId) {
        result = await api.updateCampManager({ ...form, CampManagerId: initial.CampManagerId });
      } else {
        result = await api.addCampManager(form);
      }
      if (result.success !== false) onSave();
      else setError(result.message || "فشل الحفظ");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div>
      {error && <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
      <Input label="اسم المسئول" value={form.ManagerName} onChange={v => setField("ManagerName", v)} required />
      <Input label="رقم الجوال" value={form.ManagerPhone} onChange={v => setField("ManagerPhone", v)} />
      <Input label="المسمى الوظيفي" value={form.ManagerTitle} onChange={v => setField("ManagerTitle", v)} placeholder="مسئول استلام" />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "جارٍ الحفظ..." : initial?.CampManagerId ? "💾 حفظ التعديل" : "➕ إضافة"}</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CAMP FORM (Modal)
// ─────────────────────────────────────────────
const CampForm = ({ initial, campManagers, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || { CampNumber: "", CampName: "", Destination: "", Zone: "", Capacity: "", CampManagerId: "", Notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.CampName) { setError("اسم المخيم مطلوب"); return; }
    if (!form.CampNumber) { setError("رقم المخيم مطلوب"); return; }
    // if (!form.Destination) { setError("الوجهة مطلوبة"); return; }
    setError(null); setSaving(true);
    try {
      const payload = {
        ...form,
        CampManagerId: form.CampManagerId ? Number(form.CampManagerId) : null,
        Capacity: form.Capacity ? Number(form.Capacity) : null,
      };
      let result;
      if (initial?.CampId) {
        result = await api.updateCamp({ ...payload, CampId: initial.CampId });
      } else {
        result = await api.addCamp(payload);
      }
      if (result.success !== false) onSave();
      else setError(result.message || "فشل الحفظ");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div>
      {error && <div style={{ background: "#FDEDEC", color: "#E74C3C", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>⚠️ {error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Input label="رقم المخيم" value={form.CampNumber} onChange={v => setField("CampNumber", v)} required placeholder="مثال: 01" />
        <Input label="اسم المخيم" value={form.CampName} onChange={v => setField("CampName", v)} required />
        {/* <Select label="الوجهة" value={form.Destination} onChange={v => setField("Destination", v)} options={DESTINATIONS.map(d => ({ value: d, label: d }))} required /> */}
        <Select label="الوجهة (اختياري)" value={form.Destination} onChange={v => setField("Destination", v)} options={DESTINATIONS.map(d => ({ value: d, label: d }))} placeholder="كل الوجهات" />
        <Input label="المنطقة / القطاع" value={form.Zone} onChange={v => setField("Zone", v)} />
        <Input label="السعة (عدد الحجاج)" value={form.Capacity} onChange={v => setField("Capacity", v)} type="number" />
        <Select label="المسئول" value={form.CampManagerId} onChange={v => setField("CampManagerId", v)}
          options={campManagers.map(m => ({ value: m.CampManagerId, label: `${m.ManagerName} — ${m.ManagerPhone || ""}` }))}
          placeholder="بدون مسئول" />
      </div>
      <Input label="ملاحظات" value={form.Notes} onChange={v => setField("Notes", v)} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <Btn variant="ghost" onClick={onCancel}>إلغاء</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "جارٍ الحفظ..." : initial?.CampId ? "💾 حفظ التعديل" : "➕ إضافة"}</Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function CampsManagement() {
  const [tab, setTab] = useState("camps"); // camps | managers
  const [camps, setCamps] = useState([]);
  const [campManagers, setCampManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // Modals
  const [showCampModal, setShowCampModal] = useState(false);
  const [editCamp, setEditCamp] = useState(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editManager, setEditManager] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([api.getCamps(), api.getCampManagers()]);
      setCamps(c || []);
      setCampManagers(m || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Camps handlers ──
  const handleDeleteCamp = async (camp, e) => {
    e.stopPropagation();
    if (!window.confirm(`هل أنت متأكد من حذف "${camp.CampName}"؟`)) return;
    try {
      const r = await api.deleteCamp(camp.CampId);
      if (r.success !== false) loadData();
      else alert(r.message || "فشل الحذف");
    } catch (err) { alert(err.message); }
  };

  const handleEditCamp = (camp, e) => {
    e.stopPropagation();
    setEditCamp(camp);
    setShowCampModal(true);
  };

  // ── Manager handlers ──
  const handleDeleteManager = async (mgr, e) => {
    e.stopPropagation();
    if (!window.confirm(`هل أنت متأكد من حذف "${mgr.ManagerName}"؟`)) return;
    try {
      const r = await api.deleteCampManager(mgr.CampManagerId);
      if (r.success !== false) loadData();
      else alert(r.message || "فشل الحذف");
    } catch (err) { alert(err.message); }
  };

  const handleEditManager = (mgr, e) => {
    e.stopPropagation();
    setEditManager(mgr);
    setShowManagerModal(true);
  };

  // ── Filter ──
  const filteredCamps = camps.filter(c =>
    !filter || c.CampName?.includes(filter) || c.CampNumber?.includes(filter) || c.Destination?.includes(filter) || c.ManagerName?.includes(filter)
  );

  const filteredManagers = campManagers.filter(m =>
    !filter || m.ManagerName?.includes(filter) || m.ManagerPhone?.includes(filter)
  );

  const TABS = [
    { id: "camps", label: `🏕 المخيمات (${camps.length})` },
    { id: "managers", label: `👤 المسئولين (${campManagers.length})` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,.07)" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, direction: "rtl" }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>إدارة المخيمات والمسئولين</h2>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, direction: "rtl" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setFilter(""); }}
                style={{
                  background: tab === t.id ? "#1a56db" : "#F7F8FA",
                  color: tab === t.id ? "#fff" : "#555",
                  border: "none", padding: "8px 20px", borderRadius: 8,
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                  transition: "all .15s",
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter + Add button */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, direction: "rtl" }}>
            <input
              placeholder="بحث..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, direction: "rtl", boxSizing: "border-box" }}
            />
            {tab === "camps" && (
              <Btn variant="primary" onClick={() => { setEditCamp(null); setShowCampModal(true); }}>+ إضافة مخيم</Btn>
            )}
            {tab === "managers" && (
              <Btn variant="primary" onClick={() => { setEditManager(null); setShowManagerModal(true); }}>+ إضافة مسئول</Btn>
            )}
          </div>

          {/* Content */}
          {loading ? <Loader /> : (
            <>
              {/* ── Camps Tab ── */}
              {tab === "camps" && (
                <TableComp
                  cols={[
                    { key: "_seq", label: "#", render: (_, r, i) => i + 1 },
                    { key: "CampNumber", label: "رقم المخيم" },
                    { key: "CampName", label: "اسم المخيم" },
                    { key: "Destination", label: "الوجهة" },
                    { key: "Zone", label: "القطاع" },
                    { key: "Capacity", label: "السعة" },
                    { key: "ManagerName", label: "المسئول" },
                    { key: "ManagerPhone", label: "هاتف المسئول" },
                    {
                      key: "_actions", label: "الإجراءات",
                      render: (_, row) => (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn variant="outline" small onClick={(e) => handleEditCamp(row, e)}>✏️</Btn>
                          <Btn variant="danger" small onClick={(e) => handleDeleteCamp(row, e)}>🗑</Btn>
                        </div>
                      )
                    },
                  ]}
                  rows={filteredCamps}
                />
              )}

              {/* ── Managers Tab ── */}
              {tab === "managers" && (
                <TableComp
                  cols={[
                    { key: "_seq", label: "#", render: (_, r, i) => i + 1 },
                    { key: "ManagerName", label: "اسم المسئول" },
                    { key: "ManagerPhone", label: "رقم الجوال" },
                    { key: "ManagerTitle", label: "المسمى الوظيفي" },
                    {
                      key: "_camps", label: "المخيمات المسئول عنها",
                      render: (_, row) => {
                        const mgrCamps = camps.filter(c => c.CampManagerId === row.CampManagerId);
                        return mgrCamps.length > 0
                          ? mgrCamps.map(c => c.CampName).join(" ، ")
                          : <span style={{ color: "#aaa" }}>لا يوجد</span>;
                      }
                    },
                    {
                      key: "_actions", label: "الإجراءات",
                      render: (_, row) => (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn variant="outline" small onClick={(e) => handleEditManager(row, e)}>✏️</Btn>
                          <Btn variant="danger" small onClick={(e) => handleDeleteManager(row, e)}>🗑</Btn>
                        </div>
                      )
                    },
                  ]}
                  rows={filteredManagers}
                />
              )}

              <div style={{ fontSize: 12, color: "#888", marginTop: 8, direction: "rtl" }}>
                إجمالي: {tab === "camps" ? filteredCamps.length : filteredManagers.length}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Camp Modal ── */}
      <Modal open={showCampModal} onClose={() => { setShowCampModal(false); setEditCamp(null); }}
        title={editCamp ? "تعديل المخيم" : "إضافة مخيم جديد"}>
        <CampForm
          initial={editCamp}
          campManagers={campManagers}
          onSave={() => { setShowCampModal(false); setEditCamp(null); loadData(); }}
          onCancel={() => { setShowCampModal(false); setEditCamp(null); }}
        />
      </Modal>

      {/* ── Manager Modal ── */}
      <Modal open={showManagerModal} onClose={() => { setShowManagerModal(false); setEditManager(null); }}
        title={editManager ? "تعديل المسئول" : "إضافة مسئول جديد"}>
        <CampManagerForm
          initial={editManager}
          onSave={() => { setShowManagerModal(false); setEditManager(null); loadData(); }}
          onCancel={() => { setShowManagerModal(false); setEditManager(null); }}
        />
      </Modal>
    </div>
  );
}
