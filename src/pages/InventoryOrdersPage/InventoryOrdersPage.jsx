import { useState, useEffect, useCallback, useRef, useContext } from "react";
import { getFromApi, postToApi, deleteFromApi } from "../../apis/apis";
import UesrContext from "../../contexts/user-context/UserProvider";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";
import { Col, Select } from "antd";
import urls from "../../urls";

// const BASE_URL = "https://rfidrajhiapi.sirumaps.net";
const BASE_URL = urls.basicUrl;
const api = {
  getCampOrders: (status, createdBy) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (createdBy) params.append("createdBy", createdBy);
    return getFromApi(`DispatchOrder/get-camp-orders?${params.toString()}`);
  },
  addCampOrder: (formData) => {
    const token = localStorage.getItem("token");
    return fetch(`${BASE_URL}/api/DispatchOrder/add-camp-order`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // FormData — no Content-Type header
    }).then(r => r.json());
  },
  setDone: (campOrderId, doneNotes) =>
    postToApi(`DispatchOrder/set-done-camp-order`, { campOrderId, doneNotes }),
  deleteCampOrder: (id) =>
    deleteFromApi(`DispatchOrder/delete-camp-order?id=${id}`),
  getCamps: () => getFromApi(`DispatchOrder/get-camps`),
};

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, small, style = {} }) => {
  const base = { padding: small ? "4px 10px" : "8px 18px", borderRadius: 8, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontSize: small ? 11 : 13, fontWeight: 600, opacity: disabled ? .5 : 1, ...style };
  const v = { primary: { background: "#1a56db", color: "#fff" }, success: { background: "#27AE60", color: "#fff" }, danger: { background: "#E74C3C", color: "#fff" }, ghost: { background: "transparent", color: "#555", border: "1px solid #ddd" }, outline: { background: "#fff", color: "#1a56db", border: "1.5px solid #1a56db" } };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...v[variant] }}>{children}</button>;
};

// ─────────────────────────────────────────────
// ORDER CARD (Chat-like bubble)
// ─────────────────────────────────────────────
const OrderCard = ({ order, onDone, onDelete, imagesBaseUrl }) => {
  const [doneNotes, setDoneNotes] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPending = order.Status === "Pending";
  const { user } = useContext(UesrContext);

  const handleDone = async () => {
    setLoading(true);
    await onDone(order.CampOrderId, doneNotes);
    setLoading(false);
    setShowDone(false);
  };

  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return "الآن";
    if (diff < 60) return `منذ ${diff} دقيقة`;
    if (diff < 1440) return `منذ ${Math.floor(diff / 60)} ساعة`;
    return `منذ ${Math.floor(diff / 1440)} يوم`;
  };

  return (
    <div style={{
      background: isPending ? "#fff" : "#F0FAF0",
      border: `1.5px solid ${isPending ? "#E8E8E8" : "#27AE60"}`,
      borderRadius: 16, padding: 16, marginBottom: 12,
      borderRight: `4px solid ${isPending ? "#E67E22" : "#27AE60"}`,
      direction: "rtl",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            background: isPending ? "#FEF9E7" : "#EAFAF1",
            color: isPending ? "#E67E22" : "#27AE60",
            padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
          }}>
            {isPending ? "⏳ قيد الانتظار" : "✅ تم التعامل"}
          </span>
          {order.CampName && (
            <span style={{ fontSize: 11, color: "#888", background: "#f5f5f5", padding: "2px 8px", borderRadius: 10 }}>
              🏕 {order.CampName}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#999" }}>{timeAgo(order.CreationDate)}</span>
      </div>

      {/* Content */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Image */}
        {order.ImagePath && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={`${imagesBaseUrl}/${order.ImagePath}`}
              alt={order.ItemName}
              onClick={() => window.open(`${imagesBaseUrl}/${order.ImagePath}`, "_blank")}
              style={{
                width: 80, height: 80, objectFit: "cover", borderRadius: 10,
                border: "1px solid #eee", cursor: "pointer",
              }}
            />
          </div>
        )}

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
            {order.ItemName}
            {order.Quantity > 1 && <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}> × {order.Quantity}</span>}
          </div>
          {order.Description && (
            <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>{order.Description}</div>
          )}
          {order.DoneNotes && (
            <div style={{ fontSize: 12, color: "#27AE60", marginTop: 4, background: "#EAFAF1", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
              💬 {order.DoneNotes}
            </div>
          )}
          {order.DoneDate && (
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
              تم التعامل: {order.DoneDate?.slice(0, 16).replace("T", " ")}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {showDone ? (
            <>
              <input
                value={doneNotes}
                onChange={e => setDoneNotes(e.target.value)}
                placeholder="ملاحظة (اختياري)..."
                style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", fontSize: 13, direction: "rtl", minWidth: 150 }}
              />
              <Btn variant="success" small onClick={handleDone} disabled={loading}>
                {loading ? "..." : "✅ تأكيد"}
              </Btn>
              <Btn variant="ghost" small onClick={() => setShowDone(false)}>إلغاء</Btn>
            </>
          ) : (
            <>
              {user?.user?.Permissions?.includes("DoneCampOrders") && <Btn variant="success" small onClick={() => setShowDone(true)}>✅ تم التعامل</Btn>}
              {user?.user?.Permissions?.includes("DeleteCampOrders") &&
                <Btn variant="danger" small onClick={() => {
                  if (window.confirm("حذف هذا الطلب؟")) onDelete(order.CampOrderId);
                }}>🗑</Btn>
              }
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// NEW ORDER FORM (Bottom bar — like chat input)
// ─────────────────────────────────────────────
const NewOrderForm = ({ camps, onSubmit }) => {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [campId, setCampId] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [AssetTypeId, setAssetTypeId] = useState(null);
  const [Models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const fileRef = useRef(null);
  const { Option } = Select;
  useEffect(() => {
    // setModelFilter(null);
    const fetchModels = async () => {
      try {
        const res = await getFromApi(
          `AssetModel/get-assetModel-by-assetTypeId?assetTypeId=${AssetTypeId || ""}`
        );
        setModels(res);
      } catch (error) { setModels([]); }
    };
    fetchModels();
  }, [AssetTypeId]);

  useEffect(() => {

    const fetchLanguages = async () => {
      try {
        const hasmode = false;
        const res = await getFromApi(

          `AssetType/get-assetType-ddl`
        );
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
  }, [])
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => { setImage(null); setPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handleSubmit = async () => {
    if (!itemName.trim()) return;
    setSending(true);
    await onSubmit({
      itemName,
      description,
      quantity,
      campId: campId || null,
      image,
      AssetTypeId: AssetTypeId || null,
      AssetModelId: modelId
    });
    setItemName(""); setDescription(""); setQuantity(1); setCampId(""); removeImage(); setExpanded(false);
    setSending(false);
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 16,
      border: "2px solid #1a56db22", boxShadow: "0 -2px 12px rgba(0,0,0,.05)",
      direction: "rtl",
    }}>
      {/* Main input row */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ flex: "2 1 200px" }}>

          <label style={{ fontSize: 11, fontWeight: 600, color: "#8880" }}>ddd</label>

          <input
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="اكتب اسم الصنف المطلوب..."
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 24, border: "1.5px solid #dde1e7",
              fontSize: 14, direction: "rtl", outline: "none",
            }}
          />
        </div>
        <div style={{ flex: "2 1 200px" }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>نوع صنف الأصل</label>

          <select value={AssetTypeId} onChange={e => setAssetTypeId(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }}>
            <option value="">اختر نوع صنف الأصل</option>
            {buildings.map(c => <option key={c.AssetTypeId} value={c.AssetTypeId}>{c.AssetTypeName}</option>)}
          </select>
        </div>
        <div style={{ flex: "2 1 200px" }}>

          <label style={{ fontSize: 11, fontWeight: 600, color: "#8880" }}>dd</label>

          <Select
            allowClear
            showSearch
            placeholder="اختر موديل الاصل"
            value={modelId || undefined}
            onChange={(val) => setModelId(val ?? "")}
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            // style={{ width: isMobile ? "100%" : 380 }}
            options={Models.map((m) => ({
              value: m.AssetModelId,
              label: `${m.Brand ?? ""} - ${m.ModelName ?? ""} - ${m.ModelNumber ?? ""} - عدد ${m.AssetTotalCount ?? 0} قطعه`,
            }))}
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "1.5px solid #ddd",
            background: image ? "#EBF5FB" : "#fff", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          title="إرفاق صورة"
        >📷</button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
        <Btn variant="primary" onClick={handleSubmit} disabled={!itemName.trim() || sending}
          style={{ borderRadius: 24, padding: "10px 20px" }}>
          {sending ? "..." : "إرسال ➤"}
        </Btn>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>وصف إضافي</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="تفاصيل اختيارية..."
              style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: "0 0 80px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>الكمية</label>
            <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, textAlign: "center", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>المخيم</label>
            <select value={campId} onChange={e => setCampId(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, direction: "rtl", boxSizing: "border-box" }}>
              <option value="">عام</option>
              {camps.map(c => <option key={c.CampId} value={c.CampId}>{c.CampName}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "flex-start", gap: 4 }}>
          <img src={preview} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
          <button onClick={removeImage} style={{ background: "#E74C3C", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function InventoryOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | Pending | Done
  const imagesBaseUrl = BASE_URL;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, campsData] = await Promise.all([
        api.getCampOrders(filter === "all" ? null : filter),
        api.getCamps(),
      ]);
      setOrders(ordersData || []);
      setCamps(campsData || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async ({ itemName, description, quantity, campId, image }) => {
    const formData = new FormData();
    formData.append("itemName", itemName);
    if (description) formData.append("description", description);
    if (quantity) formData.append("quantity", String(quantity));
    if (campId) formData.append("campId", String(campId));
    if (image) formData.append("image", image);

    try {
      const r = await api.addCampOrder(formData);
      if (r.success !== false) loadData();
      else alert(r.message || "فشل الإرسال");
    } catch (e) { alert(e.message); }
  };

  const handleDone = async (campOrderId, doneNotes) => {
    try {
      const r = await api.setDone(campOrderId, doneNotes);
      if (r.success) loadData();
      else alert(r.message);
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (campOrderId) => {
    try {
      const r = await api.deleteCampOrder(campOrderId);
      if (r.success !== false) loadData();
      else alert(r.message);
    } catch (e) { alert(e.message); }
  };

  const pendingCount = orders.filter(o => o.Status === "Pending").length;
  const doneCount = orders.filter(o => o.Status === "Done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f7", fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
          <h2 style={{ margin: 0, fontSize: 22, color: "#1a1a2e" }}>📋 طلبات المخيمات</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>طلبات الأصناف من مشرفي المخيمات</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          {[
            { id: "all", label: `الكل (${orders.length})`, color: "#555" },
            { id: "Pending", label: `⏳ قيد الانتظار (${pendingCount})`, color: "#E67E22" },
            { id: "Done", label: `✅ تم التعامل (${doneCount})`, color: "#27AE60" },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: filter === t.id ? `2px solid ${t.color}` : "2px solid transparent",
                background: filter === t.id ? `${t.color}15` : "#fff",
                color: t.color, cursor: "pointer",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* New Order Form */}
        <div style={{ marginBottom: 20 }}>
          <NewOrderForm camps={camps} onSubmit={handleSubmit} />
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>⏳ جارٍ التحميل...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#aaa", direction: "rtl" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
            <div>لا توجد طلبات {filter === "Pending" ? "قيد الانتظار" : filter === "Done" ? "تم التعامل معها" : ""}</div>
          </div>
        ) : (
          orders.map(o => (
            <OrderCard
              key={o.CampOrderId}
              order={o}
              onDone={handleDone}
              onDelete={handleDelete}
              imagesBaseUrl={imagesBaseUrl}
            />
          ))
        )}

        {/* Footer count */}
        {orders.length > 0 && (
          <div style={{ textAlign: "center", fontSize: 12, color: "#999", marginTop: 16, direction: "rtl" }}>
            إجمالي: {orders.length} طلب
          </div>
        )}
      </div>
    </div>
  );
}
