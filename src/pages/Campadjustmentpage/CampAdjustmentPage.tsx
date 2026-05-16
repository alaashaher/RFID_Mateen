import React, { useEffect, useState, useContext } from "react";
import {
    Button, Table, Modal, Select, Input, InputNumber, Popconfirm,
    Tooltip, Tag, Row, Col, Empty, Badge, Space, Drawer,
} from "antd";
import {
    PlusOutlined, DeleteOutlined, SaveOutlined, EditOutlined,
    EyeOutlined, CheckCircleOutlined, SearchOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { getFromApi, postToApi, putToApi, deleteFromApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import UserContext from "../../contexts/user-context/UserProvider";
import moment from "moment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import SearchModelDistributionModal from "../shared/SearchModelDistributionModal";

const { Option } = Select;

interface Camp { CampId: number; CampName: string; }
interface AssetModel { AssetModelId: number; ModelName: string; ModelNumber: string; Brand: string; IsLot: boolean; }
interface CampAdjustment {
    CampAdjustmentId: number; LocationType: number; CampId: number;
    CampName: string; AdjustmentYear: number; Status: number;
    CreatedAt: string; CompletedAt: string | null; Notes: string | null; ItemsCount: number;
}
interface CampAdjustmentItem {
    ItemId: number; CampAdjustmentId: number; AssetTypeId: number;
    AssetTypeName: string; AssetModelId: number | null; ModelName: string | null;
    IsLot: boolean | null; ActualQty: number | null; Notes: string | null;
    isEditing?: boolean; isDeleted?: boolean;
    tempAssetModelId?: number | null; tempActualQty?: number | null;
}

const LOCATIONS = [{ value: 1, label: "منى" }, { value: 2, label: "عرفة" }];
const getLocationLabel = (t: number) => LOCATIONS.find((l) => l.value === t)?.label || "";
const getStatusTag = (s: number) => s === 2 ? <Tag color="green">مكتمل</Tag> : <Tag color="blue">قيد التنفيذ</Tag>;

const useIsMobile = () => {
    const [m, setM] = useState(window.innerWidth < 768);
    useEffect(() => { const h = () => setM(window.innerWidth < 768); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
    return m;
};

const notify = (message: string, type: "success" | "danger" | "warning") => {
    Store.addNotification({
        title: "", message, type, insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
    });
};

const CampAdjustmentPage = () => {
    const { user } = useContext(UserContext);
    const isMobile = useIsMobile();

    const [adjustments, setAdjustments] = useState<CampAdjustment[]>([]);
    const [loading, setLoading] = useState(false);
    const [detectChanges, setDetectChanges] = useState(0);
    const [filterYear, setFilterYear] = useState(moment().year());
    const [filterLocation, setFilterLocation] = useState<number | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newLocationType, setNewLocationType] = useState<number | null>(null);
    const [newCampId, setNewCampId] = useState<number | null>(null);
    const [newNotes, setNewNotes] = useState("");
    const [camps, setCamps] = useState<Camp[]>([]);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = useState<CampAdjustment | null>(null);
    const [items, setItems] = useState<CampAdjustmentItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [savingItems, setSavingItems] = useState(false);
    const [assetModelsMap, setAssetModelsMap] = useState<Record<number, AssetModel[]>>({});
    const [searchText, setSearchText] = useState("");

    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItemAssetTypeId, setNewItemAssetTypeId] = useState<number | null>(null);
    const [newItemModelId, setNewItemModelId] = useState<number | null>(null);
    const [newItemQty, setNewItemQty] = useState<number | null>(null);
    const [newItemNotes, setNewItemNotes] = useState("");
    const [assetTypesList, setAssetTypesList] = useState<{AssetTypeId: number; AssetTypeName: string}[]>([]);

    const [showSearchModal, setShowSearchModal] = useState(false);

    // const [showSearchModelModal, setShowSearchModelModal] = useState(false);
    // const [searchModelId, setSearchModelId] = useState<number | null>(null);
    // const [searchAssetTypeId, setSearchAssetTypeId] = useState<number | null>(null);
    // const [modelDistribution, setModelDistribution] = useState<any[]>([]);
    // const [modelDistLoading, setModelDistLoading] = useState(false);
    // const [searchLocationType, setSearchLocationType] = useState<number | null>(null);

    // ===== Fetch =====
    useEffect(() => { getFromApi("DispatchOrder/get-camps").then(setCamps).catch(() => { }); }, []);
    useEffect(() => { getFromApi("DispatchOrder/get-asset-types").then(setAssetTypesList).catch(() => {}); }, []);
//     useEffect(() => {
//     if (searchAssetTypeId) fetchModels(searchAssetTypeId);
// }, [searchAssetTypeId]);
    useEffect(() => {
        setLoading(true);
        let ep = `CampAdjustment/get-all?year=${filterYear}`;
        if (filterLocation) ep += `&locationType=${filterLocation}`;
        getFromApi(ep).then((r) => setAdjustments(r || [])).catch(() => { }).finally(() => setLoading(false));
    }, [detectChanges, filterYear, filterLocation]);
    useEffect(() => {
    if (newItemAssetTypeId) fetchModels(newItemAssetTypeId);
}, [newItemAssetTypeId]);
    const fetchModels = async (atId: number) => {
    if (assetModelsMap[atId]) return;
    try {
        const r = await getFromApi(`DispatchOrder/get-asset-models?AssetTypeId=${atId}`);
        //console.log("Models response:", r);  // شوف البيانات إيش راجع بالظبط
        setAssetModelsMap((p) => ({ ...p, [atId]: r || [] }));
    } catch { }
};
// const handleSearchModel = async () => {
//     if (!searchAssetTypeId && !searchModelId) { notify("اختر نوع الأصل أو الموديل", "warning"); return; }
//     setModelDistLoading(true);
//     try {
//         let ep = `CampAdjustment/get-model-distribution?`;
//         const params = [];
//         if (searchAssetTypeId) params.push(`assetTypeId=${searchAssetTypeId}`);
//         if (searchModelId) params.push(`assetModelId=${searchModelId}`);
//         if (searchLocationType) params.push(`locationType=${searchLocationType}`);
//         ep += params.join("&");
//         const res = await getFromApi(ep);
//         setModelDistribution(res || []);
//     } catch { notify("حدث خطأ", "danger"); }
//     setModelDistLoading(false);
// };
    // ===== Create =====
    const handleCreate = async () => {
        if (!newLocationType || !newCampId) { notify("يرجى اختيار المكان والمخيم", "warning"); return; }
        setCreateLoading(true);
        try {
            const res = await postToApi("CampAdjustment/create", { LocationType: newLocationType, CampId: newCampId, AdjustmentYear: moment().year(), Notes: newNotes || null });
            if (res) { notify("تم إنشاء الجرد بنجاح", "success"); setDetectChanges((p) => p + 1); setShowCreateModal(false); resetCreate(); if (res.CampAdjustmentId) openDetail(res); }
        } catch { notify("حدث خطأ أثناء إنشاء الجرد", "danger"); }
        setCreateLoading(false);
    };
    const resetCreate = () => { setNewLocationType(null); setNewCampId(null); setNewNotes(""); };

    // ===== Detail =====
    const openDetail = async (adj: CampAdjustment) => {
        setSelectedAdjustment(adj); setShowDetailModal(true); setSearchText("");
        setItemsLoading(true);
        try {
            const res = await getFromApi(`CampAdjustment/get-items?campAdjustmentId=${adj.CampAdjustmentId}`);
            setItems((res || []).map((i: CampAdjustmentItem) => ({ ...i, isEditing: false, isDeleted: false, tempAssetModelId: i.AssetModelId, tempActualQty: i.ActualQty })));
            const ids = [...new Set((res || []).map((i: any) => i.AssetTypeId))];
            for (const id of ids) fetchModels(id as number);
        } catch { }
        setItemsLoading(false);
    };
    const closeDetail = () => { setShowDetailModal(false); setSelectedAdjustment(null); setItems([]); };

    // ===== Item edits =====
    const setItemField = (itemId: number, fields: Partial<CampAdjustmentItem>) =>
        setItems((p) => p.map((i) => i.ItemId === itemId ? { ...i, ...fields, isEditing: true } : i));

    // ===== Save =====
    const handleSave = async () => {
    if (!selectedAdjustment) return;
    setSavingItems(true);
    try {
        const activeItems = items.filter((i) => !i.isDeleted);
        const payload = {
            CampAdjustmentId: selectedAdjustment.CampAdjustmentId,
            Items: activeItems.filter(i => i.ItemId > 0).map((i) => ({ 
                ItemId: i.ItemId, 
                AssetModelId: i.tempAssetModelId || i.AssetModelId, 
                ActualQty: i.tempActualQty ?? i.ActualQty, 
                Notes: i.Notes 
            })),
            NewItems: activeItems.filter(i => i.ItemId < 0).map((i) => ({
                AssetTypeId: i.AssetTypeId,
                AssetModelId: i.tempAssetModelId || i.AssetModelId,
                ActualQty: i.tempActualQty ?? i.ActualQty,
                Notes: i.Notes,
            })),
            DeletedItemIds: items.filter((i) => i.isDeleted && i.ItemId > 0).map((i) => i.ItemId),
        };
        const res = await putToApi("CampAdjustment/save-items", payload);
        if (res) { notify("تم حفظ البيانات بنجاح", "success"); setDetectChanges((p) => p + 1); await openDetail(selectedAdjustment); }
    } catch { notify("حدث خطأ أثناء الحفظ", "danger"); }
    setSavingItems(false);
};
const handleAddNewItem = () => {
    if (!newItemAssetTypeId || !newItemModelId) { notify("اختر نوع الأصل والموديل", "warning"); return; }
    const assetType = assetTypesList.find(a => a.AssetTypeId === newItemAssetTypeId);
    const models = assetModelsMap[newItemAssetTypeId] || [];
    const model = models.find(m => m.AssetModelId === newItemModelId);
    
    const newItem: CampAdjustmentItem = {
        ItemId: -(Date.now()), // ID سالب مؤقت للتمييز
        CampAdjustmentId: selectedAdjustment?.CampAdjustmentId || 0,
        AssetTypeId: newItemAssetTypeId,
        AssetTypeName: assetType?.AssetTypeName || "",
        AssetModelId: newItemModelId,
        ModelName: model ? `${model.ModelName} - ${model.ModelNumber} - ${model.Brand}` : null,
        IsLot: model?.IsLot || null,
        ActualQty: newItemQty,
        Notes: newItemNotes || null,
        isEditing: true,
        isDeleted: false,
        tempAssetModelId: newItemModelId,
        tempActualQty: newItemQty,
    };
    
    setItems(prev => [...prev, newItem]);
    setShowAddItemModal(false);
    setNewItemAssetTypeId(null);
    setNewItemModelId(null);
    setNewItemQty(null);
    setNewItemNotes("");
};
    // ===== Complete =====
    const handleComplete = async () => {
        if (!selectedAdjustment) return;
        const missing = items.filter((i) => !i.isDeleted && (i.tempActualQty ?? i.ActualQty) === null).length;
        if (missing > 0) { notify(`يوجد ${missing} بند بدون كمية`, "warning"); return; }
        try {
            const res = await putToApi("CampAdjustment/complete", { CampAdjustmentId: selectedAdjustment.CampAdjustmentId });
            if (res) { notify("تم إكمال الجرد بنجاح", "success"); setDetectChanges((p) => p + 1); setSelectedAdjustment({ ...selectedAdjustment, Status: 2 }); }
        } catch { notify("حدث خطأ", "danger"); }
    };

    // ===== Delete =====
    const handleDeleteAdj = async (id: number) => {
        setLoading(true);
        try { await deleteFromApi(`CampAdjustment/delete?id=${id}`); notify("تم الحذف بنجاح", "success"); setDetectChanges((p) => p + 1); } catch { notify("حدث خطأ", "danger"); }
        setLoading(false);
    };

    // ===== Export =====
    const handleExport = () => {
        if (!selectedAdjustment || !items.length) return;
        const data = items.filter((i) => !i.isDeleted).map((i, idx) => ({ "#": idx + 1, "نوع الأصل": i.AssetTypeName, الموديل: i.ModelName || "غير محدد", "الكمية الفعلية": i.tempActualQty ?? i.ActualQty ?? "", ملاحظات: i.Notes || "" }));
        const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "جرد");
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([buf], { type: "application/octet-stream" }), `جرد_${selectedAdjustment.CampName}_${getLocationLabel(selectedAdjustment.LocationType)}_${selectedAdjustment.AdjustmentYear}.xlsx`);
    };

    // ===== Computed =====
    const filteredItems = items.filter((i) => { if (i.isDeleted) return false; if (!searchText) return true; const s = searchText.toLowerCase(); return i.AssetTypeName?.toLowerCase().includes(s) || i.ModelName?.toLowerCase().includes(s); });
    const deletedCount = items.filter((i) => i.isDeleted).length;
    const filledCount = items.filter((i) => !i.isDeleted && (i.tempActualQty ?? i.ActualQty) !== null).length;
    const totalActive = items.filter((i) => !i.isDeleted).length;
    const isCompleted = selectedAdjustment?.Status === 2;

    // ===== Main Table Columns =====
    const mainCols = isMobile ? [
        { title: "#", key: "i", render: (_: any, __: any, i: number) => i + 1, width: 35 },
        {
            title: "المخيم", key: "c", render: (_: any, r: CampAdjustment) => (
                <div><div style={{ fontWeight: 600 }}>{r.CampName}</div><div style={{ fontSize: 11, color: "#888" }}>{getLocationLabel(r.LocationType)} — {r.ItemsCount} صنف</div></div>
            )
        },
        { title: "الحالة", key: "s", width: 80, render: (_: any, r: CampAdjustment) => getStatusTag(r.Status) },
        {
            title: "", key: "a", width: 80, render: (_: any, r: CampAdjustment) => (
                <Space size={4}>
                    <Button size="small" onClick={() => openDetail(r)} icon={r.Status === 2 ? <EyeOutlined /> : <EditOutlined />} />
                    {r.Status !== 2 && <Popconfirm title="حذف؟" onConfirm={() => handleDeleteAdj(r.CampAdjustmentId)} okText="نعم" cancelText="لا"><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>}
                </Space>
            )
        },
    ] : [
        { title: "#", key: "i", render: (_: any, __: any, i: number) => i + 1, width: 50 },
        { title: "المكان", dataIndex: "LocationType", key: "l", render: (v: number) => getLocationLabel(v), width: 90 },
        { title: "المخيم", dataIndex: "CampName", key: "c" },
        { title: "السنة", dataIndex: "AdjustmentYear", key: "y", width: 70 },
        { title: "الحالة", dataIndex: "Status", key: "s", render: (v: number) => getStatusTag(v), width: 110 },
        { title: "الأصناف", dataIndex: "ItemsCount", key: "ic", width: 80 },
        { title: "التاريخ", dataIndex: "CreatedAt", key: "d", render: (v: string) => v ? moment(v).format("MM/DD HH:mm") : "", width: 120 },
        { title: "ملاحظات", dataIndex: "Notes", key: "n", ellipsis: true },
        {
            title: "إجراءات", key: "a", width: 100, render: (_: any, r: CampAdjustment) => (
                <Space>
                    <Button onClick={() => openDetail(r)} icon={r.Status === 2 ? <EyeOutlined /> : <EditOutlined />} shape="circle" size="small" />
                    {r.Status !== 2 && <Popconfirm title="حذف؟" onConfirm={() => handleDeleteAdj(r.CampAdjustmentId)} okText="نعم" cancelText="لا"><Button danger icon={<DeleteOutlined />} shape="circle" size="small" /></Popconfirm>}
                </Space>
            )
        },
    ];

    // ===== Detail Table Columns =====
    const detailCols = isMobile ? [
        { title: "#", key: "i", render: (_: any, __: any, i: number) => i + 1, width: 30 },
        {
            title: "الصنف", key: "info", render: (_: any, r: CampAdjustmentItem) => {
                const models = assetModelsMap[r.AssetTypeId] || [];
                return (
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "4px 0" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.AssetTypeName}</div>
                        {isCompleted ? (
                            <div style={{ fontSize: 12, color: "#666" }}>{r.ModelName || "—"} | الكمية: {r.ActualQty ?? "-"}</div>
                        ) : (<>
                            <Select
                                size="small"
                                style={{ width: "100%" }}
                                placeholder="الموديل"
                                value={r.tempAssetModelId || undefined}
                                onChange={(v) => setItemField(r.ItemId, { tempAssetModelId: v })}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                options={models.map((m) => ({
                                    value: m.AssetModelId,
                                    label: `${m.ModelName} - ${m.ModelNumber} - ${m.Brand}`
                                }))}
                            />
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <InputNumber size="small" min={0} style={{ flex: 1 }} placeholder="الكمية" value={r.tempActualQty}
                                    onChange={(v) => setItemField(r.ItemId, { tempActualQty: v })} />
                                <Popconfirm title="حذف؟" onConfirm={() => setItemField(r.ItemId, { isDeleted: true, isEditing: false })} okText="نعم" cancelText="لا">
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                        </>)}
                    </div>
                );
            }
        },
    ] : [
        { title: "#", key: "i", render: (_: any, __: any, i: number) => i + 1, width: 50, fixed: "left" as const },
        { title: "نوع الأصل", dataIndex: "AssetTypeName", key: "at", width: 180 },
        {
            title: "الموديل", key: "m", width: 280, render: (_: any, r: CampAdjustmentItem) => {
                if (isCompleted) return r.ModelName || "غير محدد";
                const models = assetModelsMap[r.AssetTypeId] || [];
                return <Select
                    style={{ width: "100%" }}
                    placeholder="اختر الموديل"
                    value={r.tempAssetModelId || undefined}
                    onChange={(v) => setItemField(r.ItemId, { tempAssetModelId: v })}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={models.map((m) => ({
                        value: m.AssetModelId,
                        label: `${m.ModelName} - ${m.ModelNumber} - ${m.Brand}`
                    }))}
                />;
            }
        },
        {
            title: "الكمية", key: "q", width: 130, render: (_: any, r: CampAdjustmentItem) => {
                if (isCompleted) return r.ActualQty ?? "-";
                return <InputNumber min={0} style={{ width: "100%" }} placeholder="الكمية" value={r.tempActualQty}
                    onChange={(v) => setItemField(r.ItemId, { tempActualQty: v })} />;
            }
        },
        {
            title: "ملاحظات", key: "n", width: 170, render: (_: any, r: CampAdjustmentItem) => {
                if (isCompleted) return r.Notes || "";
                return <Input placeholder="ملاحظات" value={r.Notes || ""} onChange={(e) => setItemField(r.ItemId, { Notes: e.target.value })} />;
            }
        },
        ...(!isCompleted ? [{
            title: "", key: "del", width: 60, fixed: "right" as const,
            render: (_: any, r: CampAdjustmentItem) => <Popconfirm title="حذف؟" onConfirm={() => setItemField(r.ItemId, { isDeleted: true, isEditing: false })} okText="نعم" cancelText="لا"><Button danger size="small" icon={<DeleteOutlined />} /></Popconfirm>
        }] : []),
    ];

    // ===== Detail Content =====
    const detailBody = (<>
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <Badge count={totalActive} style={{ backgroundColor: "#1890ff" }} overflowCount={9999}><Tag style={{ padding: "3px 8px", fontSize: 12 }}>إجمالي</Tag></Badge>
            <Badge count={filledCount} style={{ backgroundColor: "#52c41a" }} overflowCount={9999}><Tag style={{ padding: "3px 8px", fontSize: 12 }}>معبأة</Tag></Badge>
            {deletedCount > 0 && <Badge count={deletedCount} style={{ backgroundColor: "#ff4d4f" }} overflowCount={9999}><Tag style={{ padding: "3px 8px", fontSize: 12 }}>محذوفة</Tag></Badge>}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <Input prefix={<SearchOutlined />} placeholder="بحث..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, minWidth: 150 }} allowClear />
        {!isCompleted && <Button icon={<PlusOutlined />} onClick={() => setShowAddItemModal(true)}>إضافة موديل آخر</Button>}
        </div>
        {deletedCount > 0 && !isCompleted && <div style={{ marginBottom: 8 }}><Button size="small" icon={<ReloadOutlined />} onClick={() => setItems((p) => p.map((i) => ({ ...i, isDeleted: false })))}>استعادة ({deletedCount})</Button></div>}
        <Table columns={detailCols} dataSource={filteredItems} rowKey="ItemId"
            pagination={{ pageSize: isMobile ? 100 : 100, showSizeChanger: !isMobile, pageSizeOptions: ["20", "50", "100", "200"], size: "small" }}
            loading={itemsLoading} scroll={isMobile ? undefined : { x: 850 }} size="small"
            locale={{ emptyText: <Empty description="لا توجد أصناف" /> }}
            rowClassName={(r) => r.isEditing ? "row-edited" : ""} />
    </>);

    const actionBtns = (<div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: isMobile ? "stretch" : "flex-end" }}>
        {!isCompleted ? (<>
            <Button danger onClick={closeDetail} block={isMobile}>إغلاق</Button>
            <Button onClick={handleExport} disabled={!items.length} block={isMobile}>تصدير Excel</Button>
            <Popconfirm title="إكمال الجرد؟ لن تتمكن من التعديل." onConfirm={handleComplete} okText="نعم" cancelText="لا">
                <Button icon={<CheckCircleOutlined />} block={isMobile}>إكمال</Button>
            </Popconfirm>
            <Button type="primary" loading={savingItems} onClick={handleSave} icon={<SaveOutlined />} block={isMobile}>حفظ</Button>
        </>) : (<>
            <Button onClick={handleExport} disabled={!items.length} block={isMobile}>تصدير Excel</Button>
            <Button onClick={closeDetail} block={isMobile}>إغلاق</Button>
        </>)}
    </div>);

    // ===== Create Form Content =====
    const createFormContent = (<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label>المكان <span style={{ color: "red" }}>*</span></label>
            <Select style={{ width: "100%", marginTop: 4 }} placeholder="اختر المكان" value={newLocationType} onChange={setNewLocationType}>
                {LOCATIONS.map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
            </Select></div>
        <div><label>المخيم <span style={{ color: "red" }}>*</span></label>
            <Select style={{ width: "100%", marginTop: 4 }} placeholder="اختر المخيم" value={newCampId} onChange={setNewCampId} showSearch optionFilterProp="children">
                {camps.map((c) => <Option key={c.CampId} value={c.CampId}>{c.CampName}</Option>)}
            </Select></div>
        <div><label>ملاحظات</label>
            <Input.TextArea style={{ marginTop: 4 }} rows={2} placeholder="اختياري" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <Button danger block onClick={() => { setShowCreateModal(false); resetCreate(); }}>إلغاء</Button>
            <Button type="primary" block loading={createLoading} onClick={handleCreate} icon={<SaveOutlined />}>إنشاء</Button>
        </div>
    </div>);

    // ===== RENDER =====
    return (
        <div className="custom-container">
            <h5 style={{ textAlign: "center", marginBottom: 14, fontSize: isMobile ? 15 : 18 }}>جرد المخيمات اليدوي</h5>

            {/* Toolbar */}
<div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", gap: 8, marginBottom: 10 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)} block={isMobile}>+ إضافة جرد جديد</Button>
        {/* <Button icon={<SearchOutlined />} onClick={() => setShowSearchModelModal(true)} block={isMobile}>بحث بالموديل</Button> */}
        <Button icon={<SearchOutlined />} onClick={() => setShowSearchModal(true)} block={isMobile}>بحث بالموديل</Button>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
        <Select allowClear placeholder="المكان" onChange={setFilterLocation} style={{ flex: 1, minWidth: 80 }}>
            {LOCATIONS.map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
        </Select>
        <Select placeholder="السنة" defaultValue={moment().year()} onChange={setFilterYear} style={{ minWidth: 80 }}>
            {[moment().year(), moment().year() - 1].map((y) => <Option key={y} value={y}>{y}</Option>)}
        </Select>
    </div>
</div>

            {/* Main Table */}
            <Table columns={mainCols} dataSource={adjustments} rowKey="CampAdjustmentId" pagination={false} loading={loading}
                scroll={isMobile ? undefined : { x: 900 }} size={isMobile ? "small" : "middle"} />

            {/* Create — Drawer on mobile, Modal on desktop */}
            {isMobile ? (
                <Drawer title="إنشاء جرد جديد" placement="bottom" open={showCreateModal}
                    onClose={() => { setShowCreateModal(false); resetCreate(); }} height="auto"
                    styles={{ body: { paddingBottom: 16 } }}>
                    {createFormContent}
                </Drawer>
            ) : (
                <Modal title="إنشاء جرد مخيم جديد" open={showCreateModal}
                    onCancel={() => { setShowCreateModal(false); resetCreate(); }} footer={null} width={480}>
                    <div style={{ marginTop: 12 }}>{createFormContent}</div>
                </Modal>
            )}

            {/* Detail — Drawer on mobile, Modal on desktop */}
            {isMobile ? (
                <Drawer
                    title={selectedAdjustment ? (<div><div style={{ fontSize: 14, fontWeight: 600 }}>{selectedAdjustment.CampName} — {getLocationLabel(selectedAdjustment.LocationType)}</div><div style={{ marginTop: 4 }}>{getStatusTag(selectedAdjustment.Status)}</div></div>) : "تفاصيل"}
                    placement="bottom" open={showDetailModal} onClose={closeDetail} height="95%"
                    styles={{ body: { padding: "10px 10px 20px", overflow: "auto" } }}>
                    {detailBody}
                    <div style={{ marginTop: 12 }}>{actionBtns}</div>
                </Drawer>
            ) : (
                <Modal
                    title={selectedAdjustment ? (<div style={{ display: "flex", alignItems: "center", gap: 12 }}><span>جرد {selectedAdjustment.CampName} — {getLocationLabel(selectedAdjustment.LocationType)}</span>{getStatusTag(selectedAdjustment.Status)}</div>) : "تفاصيل"}
                    open={showDetailModal} onCancel={closeDetail} footer={actionBtns} width="90%"
                    style={{ top: 20 }} styles={{ body: { maxHeight: "75vh", overflow: "auto" } }}>
                    {detailBody}
                </Modal>
            )}
            {/* Add New Item Modal */}
<Modal
    title="إضافة موديل آخر"
    open={showAddItemModal}
    onCancel={() => { setShowAddItemModal(false); setNewItemAssetTypeId(null); setNewItemModelId(null); setNewItemQty(null); setNewItemNotes(""); }}
    footer={[
        <Button key="c" danger onClick={() => { setShowAddItemModal(false); setNewItemAssetTypeId(null); setNewItemModelId(null); setNewItemQty(null); setNewItemNotes(""); }}>إلغاء</Button>,
        <Button key="s" type="primary" onClick={handleAddNewItem} icon={<PlusOutlined />}>إضافة</Button>,
    ]}
    width={isMobile ? "95%" : 500}
>
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
        <div>
            <label>نوع الأصل <span style={{ color: "red" }}>*</span></label>
            <Select
                style={{ width: "100%", marginTop: 4 }}
                placeholder="اختر نوع الأصل"
                value={newItemAssetTypeId}
                onChange={(v) => { setNewItemAssetTypeId(v); setNewItemModelId(null); }}
                showSearch
                optionFilterProp="label"
                options={assetTypesList.map(a => ({ value: a.AssetTypeId, label: a.AssetTypeName }))}
            />
        </div>
        <div>
            <label>الموديل <span style={{ color: "red" }}>*</span></label>
            <Select
                style={{ width: "100%", marginTop: 4 }}
                placeholder="اختر الموديل"
                value={newItemModelId}
                onChange={setNewItemModelId}
                showSearch
                optionFilterProp="label"
                disabled={!newItemAssetTypeId}
                options={(assetModelsMap[newItemAssetTypeId!] || []).map(m => ({
                    value: m.AssetModelId,
                    label: `${m.ModelName} - ${m.ModelNumber} - ${m.Brand}`
                }))}
            />
        </div>
        <div>
            <label>الكمية</label>
            <InputNumber min={0} style={{ width: "100%", marginTop: 4 }} placeholder="الكمية" value={newItemQty} onChange={setNewItemQty} />
        </div>
        <div>
            <label>ملاحظات</label>
            <Input style={{ marginTop: 4 }} placeholder="اختياري" value={newItemNotes} onChange={(e) => setNewItemNotes(e.target.value)} />
        </div>
    </div>
</Modal>
{/* Search Model Distribution Modal */}
{/* <Modal
    title="بحث بالموديل — التوزيع على المخيمات"
    open={showSearchModelModal}
    onCancel={() => { setShowSearchModelModal(false); setSearchAssetTypeId(null); setSearchModelId(null); setSearchLocationType(null); setModelDistribution([]); }}    footer={<Button onClick={() => { setShowSearchModelModal(false); setSearchAssetTypeId(null); setSearchModelId(null); setModelDistribution([]); }}>إغلاق</Button>}
    width={isMobile ? "95%" : 700}
>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
    <Select
        style={{ minWidth: 100 }}
        placeholder="المكان"
        value={searchLocationType}
        onChange={setSearchLocationType}
        allowClear
    >
        {LOCATIONS.map((l) => <Option key={l.value} value={l.value}>{l.label}</Option>)}
    </Select>
    <Select
        style={{ flex: 1, minWidth: 150 }}
        placeholder="نوع الأصل"
        value={searchAssetTypeId}
        onChange={(v) => { setSearchAssetTypeId(v); setSearchModelId(null); setModelDistribution([]); }}
        showSearch
        optionFilterProp="label"
        allowClear
        options={assetTypesList.map(a => ({ value: a.AssetTypeId, label: a.AssetTypeName }))}
    />
    <Select
        style={{ flex: 2, minWidth: 200 }}
        placeholder="اختر الموديل"
        value={searchModelId}
        onChange={setSearchModelId}
        showSearch
        optionFilterProp="label"
        allowClear
        disabled={!searchAssetTypeId}
        options={(assetModelsMap[searchAssetTypeId!] || []).map(m => ({
            value: m.AssetModelId,
            label: `${m.ModelName} - ${m.ModelNumber} - ${m.Brand}`
        }))}
    />
    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchModel} disabled={!searchAssetTypeId && !searchModelId}>
    بحث
</Button>
</div>

        {modelDistribution.length > 0 && (
            <Table
                dataSource={modelDistribution}
                rowKey={(r) => `${r.CampAdjustmentId}-${r.CampName}-${r.LocationType}`}
                pagination={false}
                loading={modelDistLoading}
                size="small"
                summary={() => {
    const total = modelDistribution.reduce((sum, r) => sum + (r.ActualQty || 0), 0);
    return (
        <Table.Summary.Row style={{ fontWeight: 700, backgroundColor: "#fafafa" }}>
            <Table.Summary.Cell index={0} colSpan={4}>الإجمالي</Table.Summary.Cell>
            <Table.Summary.Cell index={1}>{total}</Table.Summary.Cell>
            <Table.Summary.Cell index={2}></Table.Summary.Cell>
        </Table.Summary.Row>
    );
}}
                columns={[
    { title: "#", key: "i", render: (_: any, __: any, i: number) => i + 1, width: 40 },
    { title: "المخيم", dataIndex: "CampName", key: "c" },
    { title: "المكان", dataIndex: "LocationType", key: "l", width: 80, render: (v: number) => getLocationLabel(v) },
    { title: "الموديل", dataIndex: "ModelName", key: "m", render: (v: string) => v || <Tag>غير محدد</Tag> },
    { title: "الكمية", dataIndex: "ActualQty", key: "q", width: 80, render: (v: number | null) => v ?? <Tag color="orange">لم يُحدد</Tag> },
    { title: "حالة الجرد", dataIndex: "Status", key: "s", width: 100, render: (v: number) => getStatusTag(v) },
]}
            />
        )}

        {modelDistribution.length === 0 && searchModelId && !modelDistLoading && (
            <Empty description="لا توجد بيانات لهذا الموديل" />
        )}
    </div>
</Modal> */}
<SearchModelDistributionModal
  open={showSearchModal}
  onClose={() => setShowSearchModal(false)}
  assetTypes={assetTypesList}
/>
            <style>{`.row-edited,.row-edited td{background-color:#fffbe6 !important}`}</style>
        </div>
    );
};

export default CampAdjustmentPage;