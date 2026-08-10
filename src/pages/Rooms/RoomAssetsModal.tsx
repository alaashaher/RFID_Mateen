import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Select,
  Button,
  InputNumber,
  Table,
  Tooltip,
  Popconfirm,
  Empty,
  Spin,
  Tag,
  Image,
  Grid,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Store } from "react-notifications-component";
import { getFromApi, postToApi } from "../../apis/apis";

const { Option } = Select;
const { useBreakpoint } = Grid;

interface RoomAssetsModalProps {
  open: boolean;
  onClose: () => void;
  room: {
    RoomId: number;
    RoomName: string;
    RoomCode: string;
    UniversityFloorName?: string;
    SuiteName?: string;
    BuildingName?: string;
  } | null;
  onSaved?: () => void;
}

interface AssetModel {
  AssetModelId: number;
  ModelName: string;
  AssetTypeId: number;
  CompanyId: number;
  ModelImagePath: string | null;
}

interface RoomAssetRow {
  AssetModelId: number;
  ModelName: string;
  ModelImagePath: string | null;
  CompanyId: number;
  ExistingCount: number;
  AddCount: number;
  IsNew: boolean;
}

const IMAGES_BASE_URL = "https://rfidrajhiapi.sirumaps.net/";
//const IMAGES_BASE_URL = "https://mosandarajihirfidapi.sirumaps.net/";

const buildImgSrc = (path?: string | null, CompanyId?: number | 1) => {
  console.log("companyId____", CompanyId);
  const IMG_BASE_URL = IMAGES_BASE_URL;
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const sss =  `${IMG_BASE_URL}${path.replace(/^\/+/, "")}`;
  console.log("path path path", sss);
  return `${IMG_BASE_URL}${path.replace(/^\/+/, "")}`;
};

const RoomAssetsModal: React.FC<RoomAssetsModalProps> = ({
  open,
  onClose,
  room,
  onSaved,
}) => {
  // ✅ كشف حجم الشاشه
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allModels, setAllModels] = useState<AssetModel[]>([]);
  const [rows, setRows] = useState<RoomAssetRow[]>([]);

  const [newModelId, setNewModelId] = useState<number | undefined>(undefined);
  const [newCount, setNewCount] = useState<number>(1);

  const fetchAllModels = async () => {
    try {
      const res = await getFromApi(`AssetModel/get-buildingAssetModel-ddl`);
      const data: AssetModel[] = Array.isArray(res) ? res : res?.Data || [];
      setAllModels(data);
    } catch (e) {
      setAllModels([]);
    }
  };

  const fetchRoomAssets = async (roomId: number) => {
    try {
      const res = await getFromApi(
        `UniversityAsset/get-room-assets-grouped?roomId=${roomId}`
      );
      const data = Array.isArray(res) ? res : res?.Data || [];
      return data.map((d: any) => ({
        AssetModelId: d.AssetModelId,
        ModelName: d.ModelName,
        ModelImagePath: d.ModelImagePath,
        CompanyId: d.CompanyId,
        ExistingCount: d.ExistingCount ?? d.Count ?? 0,
        AddCount: 0,
        IsNew: false,
      })) as RoomAssetRow[];
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (open && room?.RoomId) {
      (async () => {
        setLoading(true);
        await fetchAllModels();
        const existing = await fetchRoomAssets(room.RoomId);
        setRows(existing);
        setNewModelId(undefined);
        setNewCount(1);
        setLoading(false);
      })();
    }
    if (!open) {
      setRows([]);
      setNewModelId(undefined);
      setNewCount(1);
    }
  }, [open, room?.RoomId]);

  const availableModels = useMemo(() => {
    const usedIds = new Set(rows.map((r) => r.AssetModelId));
    return allModels.filter((m) => !usedIds.has(m.AssetModelId));
  }, [allModels, rows]);

  const selectedModel = useMemo(
    () => allModels.find((m) => m.AssetModelId === newModelId),
    [newModelId, allModels]
  );

  const handleAddModel = () => {
    if (!newModelId) {
      Store.addNotification({
        title: "",
        message: "اختر موديل أولاً",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    if (!newCount || newCount < 1) {
      Store.addNotification({
        title: "",
        message: "العدد يجب أن يكون 1 أو أكثر",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }

    const model = allModels.find((m) => m.AssetModelId === newModelId);
    if (!model) return;

    setRows((prev) => [
      ...prev,
      {
        AssetModelId: model.AssetModelId,
        ModelName: model.ModelName,
        ModelImagePath: model.ModelImagePath,
        CompanyId: model.CompanyId,
        ExistingCount: 0,
        AddCount: newCount,
        IsNew: true,
      },
    ]);

    setNewModelId(undefined);
    setNewCount(1);
  };

  const handleChangeAddCount = (modelId: number, value: number | null) => {
    setRows((prev) =>
      prev.map((r) =>
        r.AssetModelId === modelId
          ? { ...r, AddCount: value && value > 0 ? value : 0 }
          : r
      )
    );
  };

  const handleRemoveRow = (modelId: number) => {
    setRows((prev) => prev.filter((r) => r.AssetModelId !== modelId));
  };

  const handleSave = async () => {
    if (!room?.RoomId) return;

    const itemsToSave = rows
      .filter((r) => r.AddCount && r.AddCount > 0)
      .map((r) => ({
        AssetModelId: r.AssetModelId,
        Count: r.AddCount,
      }));

    if (itemsToSave.length === 0) {
      Store.addNotification({
        title: "",
        message: "لا توجد أصول جديدة للإضافة",
        type: "info",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }

    try {
      setSaving(true);
      const body = {
        RoomId: room.RoomId,
        Items: itemsToSave,
      };
      const res = await postToApi(
        `UniversityAsset/create-room-assets-bulk`,
        body
      );

      const ok = res?.Success ?? res?.success ?? !!res;
      if (!ok) {
        throw new Error(res?.Message || "فشل حفظ الأصول");
      }

      Store.addNotification({
        title: "",
        message: `تم إنشاء الأصول بنجاح (${itemsToSave.reduce(
          (s, i) => s + i.Count,
          0
        )} أصل)`,
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2500, onScreen: true },
      });

      const refreshed = await fetchRoomAssets(room.RoomId);
      setRows(refreshed);

      if (onSaved) onSaved();
    } catch (e: any) {
      Store.addNotification({
        title: "خطأ",
        message: e?.message || "حدث خطأ أثناء الحفظ",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000, onScreen: true },
      });
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // اعمدة الجدول (للديسكتوب)
  // ─────────────────────────────────────────────
  const columns = [
    {
      title: "#",
      key: "idx",
      width: 50,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: "صورة",
      dataIndex: "ModelImagePath",
      key: "img",
      width: 80,
      render: (path: string | null, rec: RoomAssetRow) => {
        const src = buildImgSrc(path, rec.CompanyId);
        return src ? (
          <Image
            src={src}
            alt="model"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: 6 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              border: "1px dashed #d9d9d9",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#bbb",
            }}
          >
            <PictureOutlined />
          </div>
        );
      },
    },
    {
      title: "اسم الموديل",
      dataIndex: "ModelName",
      key: "ModelName",
      render: (txt: string, rec: RoomAssetRow) => (
        <span>
          {txt}{" "}
          {rec.IsNew && (
            <Tag color="blue" style={{ marginInlineStart: 6 }}>
              جديد
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "الموجود حالياً",
      dataIndex: "ExistingCount",
      key: "ExistingCount",
      width: 130,
      render: (n: number) => (
        <Tag color={n > 0 ? "green" : "default"}>{n}</Tag>
      ),
    },
    {
      title: "العدد المُضاف",
      dataIndex: "AddCount",
      key: "AddCount",
      width: 160,
      render: (val: number, rec: RoomAssetRow) => (
        <InputNumber
          min={0}
          value={val}
          onChange={(v) => handleChangeAddCount(rec.AssetModelId, v as any)}
          style={{ width: 110 }}
        />
      ),
    },
    {
      title: "الإجمالي بعد الحفظ",
      key: "Total",
      width: 150,
      render: (_: any, rec: RoomAssetRow) => (
        <strong>{(rec.ExistingCount || 0) + (rec.AddCount || 0)}</strong>
      ),
    },
    {
      title: "إجراءات",
      key: "act",
      width: 100,
      render: (_: any, rec: RoomAssetRow) =>
        rec.IsNew ? (
          <Popconfirm
            title="إزالة الموديل من القائمة؟"
            onConfirm={() => handleRemoveRow(rec.AssetModelId)}
            okText="نعم"
            cancelText="لا"
          >
            <Tooltip title="إزالة">
              <Button shape="circle" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        ) : (
          <Tag color="default">موجود</Tag>
        ),
    },
  ];

  // ─────────────────────────────────────────────
  // عرض كارت موبايل لكل موديل (بدل الجدول)
  // ─────────────────────────────────────────────
  const MobileCard: React.FC<{ rec: RoomAssetRow; idx: number }> = ({
    rec,
    idx,
  }) => {
    const src = buildImgSrc(rec.ModelImagePath, rec.CompanyId);
    return (
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 8,
          padding: 12,
          marginBottom: 10,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* صوره */}
          <div style={{ flexShrink: 0 }}>
            {src ? (
              <Image
                src={src}
                alt="model"
                width={64}
                height={64}
                style={{ objectFit: "cover", borderRadius: 6 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#bbb",
                }}
              >
                <PictureOutlined />
              </div>
            )}
          </div>

          {/* بيانات */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {idx + 1}. {rec.ModelName}{" "}
              {rec.IsNew && (
                <Tag color="blue" style={{ fontSize: 10 }}>
                  جديد
                </Tag>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              الموجود:{" "}
              <Tag color={rec.ExistingCount > 0 ? "green" : "default"}>
                {rec.ExistingCount}
              </Tag>{" "}
              | الإجمالى بعد:{" "}
              <strong>{rec.ExistingCount + rec.AddCount}</strong>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 12 }}>المُضاف:</span>
              <InputNumber
                min={0}
                value={rec.AddCount}
                onChange={(v) =>
                  handleChangeAddCount(rec.AssetModelId, v as any)
                }
                style={{ width: 90 }}
                size="small"
              />
              {rec.IsNew && (
                <Popconfirm
                  title="إزالة الموديل من القائمة؟"
                  onConfirm={() => handleRemoveRow(rec.AssetModelId)}
                  okText="نعم"
                  cancelText="لا"
                >
                  <Button
                    size="small"
                    shape="circle"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const totalToAdd = rows.reduce((s, r) => s + (r.AddCount || 0), 0);

  return (
    <>
      {/* ✅ CSS لتحسين scrolling الـ dropdown على الموبايل */}
      <style>{`
        .rajhi-asset-model-dropdown .rc-virtual-list-holder,
        .rajhi-asset-model-dropdown .ant-select-item-option-active,
        .rajhi-asset-model-dropdown .ant-select-dropdown {
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior: contain;
        }
        .rajhi-asset-model-dropdown .ant-select-item {
          min-height: 44px;
          padding: 10px 12px;
          font-size: 14px;
          line-height: 1.5;
        }
        .rajhi-asset-model-dropdown {
          max-height: 70vh !important;
        }
        @media (max-width: 768px) {
          .rajhi-asset-model-dropdown {
            position: fixed !important;
            left: 8px !important;
            right: 8px !important;
            width: calc(100vw - 16px) !important;
            max-width: calc(100vw - 16px) !important;
          }
          .rajhi-asset-model-dropdown .rc-virtual-list-holder {
            max-height: 50vh !important;
            touch-action: pan-y;
          }
          /* لما الكيبورد يطلع، نقلل الارتفاع تلقائيا */
          .rajhi-asset-model-dropdown .ant-select-item {
            min-height: 48px;
            padding: 12px;
          }
        }
      `}</style>

      <Modal
      open={open}
      onCancel={onClose}
      // ✅ responsive width
      width={isMobile ? "100%" : "85%"}
      style={
        isMobile
          ? { top: 0, paddingBottom: 0, maxWidth: "100vw", margin: 0 }
          : { top: 20 }
      }
      // ✅ على الموبايل ياخد كل الشاشه
      styles={{
        body: {
          padding: isMobile ? 12 : 24,
          maxHeight: isMobile ? "calc(100vh - 110px)" : "75vh",
          overflowY: "auto",
        },
      }}
      footer={null}
      title={
        <div>
          <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
            جرد / إنشاء أصول الغرفة
          </span>
          {room && (
            <div
              style={{
                color: "#666",
                fontSize: isMobile ? 11 : 13,
                marginTop: 2,
              }}
            >
              {room.BuildingName ? `${room.BuildingName} — ` : ""}
              {room.UniversityFloorName ? `${room.UniversityFloorName} — ` : ""}
              {room.SuiteName ? `جناح ${room.SuiteName} — ` : ""}
              {room.RoomName} ({room.RoomCode})
            </div>
          )}
        </div>
      }
      destroyOnClose
      centered={!isMobile}
    >
      <Spin spinning={loading}>
        {/* ────────── Section 1: اضافة موديل جديد ────────── */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            padding: isMobile ? 10 : 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              marginBottom: 10,
              fontWeight: 600,
              fontSize: isMobile ? 13 : 14,
            }}
          >
            إضافة موديل جديد للغرفة
          </div>

          {/* ✅ على الموبايل: عمود واحد. على الديسكتوب: row */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 10,
              alignItems: isMobile ? "stretch" : "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* اختيار الموديل */}
            <div
              style={{
                flex: isMobile ? "unset" : "1 1 280px",
                minWidth: isMobile ? "100%" : 240,
                width: isMobile ? "100%" : undefined,
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                }}
              >
                الموديل
              </label>
              <Select
                showSearch
                allowClear
                placeholder="ابحث واختر موديل..."
                value={newModelId}
                onChange={(v) => setNewModelId(v)}
                style={{ width: "100%" }}
                optionFilterProp="label"
                // ✅ فيكس scrolling على الموبايل
                virtual={false}
                listHeight={isMobile ? 320 : 280}
                popupMatchSelectWidth={isMobile ? false : true}
                popupClassName="rajhi-asset-model-dropdown"
                getPopupContainer={() => document.body}
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={availableModels.map((m) => ({
                  label: m.ModelName,
                  value: m.AssetModelId,
                }))}
              />
            </div>

            {/* صف فيه: العدد + الصوره + الزرار - على الموبايل سطر واحد */}
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-end",
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
              }}
            >
              {/* العدد */}
              <div style={{ width: isMobile ? 90 : 110 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  العدد
                </label>
                <InputNumber
                  min={1}
                  value={newCount}
                  onChange={(v) => setNewCount((v as number) || 1)}
                  style={{ width: "100%" }}
                />
              </div>

              {/* صورة الموديل المختار */}
              <div
                style={{
                  width: isMobile ? 70 : 90,
                  height: isMobile ? 70 : 90,
                  border: "1px dashed #d9d9d9",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
                {selectedModel?.ModelImagePath ? (
                  <Image
                    src={buildImgSrc(selectedModel.ModelImagePath, selectedModel.CompanyId) as string}
                    alt={selectedModel.ModelName}
                    width={isMobile ? 68 : 88}
                    height={isMobile ? 68 : 88}
                    style={{ objectFit: "cover" }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  />
                ) : (
                  <div
                    style={{
                      color: "#bbb",
                      textAlign: "center",
                      fontSize: 10,
                    }}
                  >
                    <PictureOutlined style={{ fontSize: 18 }} />
                    <div>لا صورة</div>
                  </div>
                )}
              </div>

              {/* زر اضافه */}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddModel}
                disabled={!newModelId}
                style={{ flex: isMobile ? 1 : "unset" }}
              >
                {isMobile ? "إضافة" : "إضافة للقائمة"}
              </Button>
            </div>
          </div>
        </div>

        {/* ────────── Section 2: عرض الموديلات ────────── */}
        {/* على الموبايل: كروت. على الديسكتوب: جدول */}
        {isMobile ? (
          <div>
            {rows.length === 0 ? (
              <Empty description="لا توجد موديلات في هذه الغرفة بعد" />
            ) : (
              rows.map((r, i) => (
                <MobileCard key={r.AssetModelId} rec={r} idx={i} />
              ))
            )}
          </div>
        ) : (
          <Table
            rowKey={(r) => r.AssetModelId}
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            locale={{
              emptyText: (
                <Empty description="لا توجد موديلات في هذه الغرفة بعد. أضف موديلاً من الأعلى." />
              ),
            }}
            scroll={{ x: "max-content", y: 380 }}
          />
        )}

        {/* ────────── Footer ────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: 10,
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid #f0f0f0",
            position: isMobile ? "sticky" : undefined,
            bottom: isMobile ? 0 : undefined,
            background: "#fff",
          }}
        >
          <div
            style={{
              color: "#555",
              fontSize: isMobile ? 13 : 14,
              textAlign: isMobile ? "center" : "right",
            }}
          >
            إجمالى الأصول الجديدة:{" "}
            <strong style={{ color: "#1a56db", fontSize: 16 }}>
              {totalToAdd}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <Button
              onClick={onClose}
              disabled={saving}
              style={{ flex: isMobile ? 1 : "unset" }}
            >
              إلغاء
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              disabled={totalToAdd === 0}
              style={{ flex: isMobile ? 2 : "unset" }}
            >
              حفظ وإنشاء
            </Button>
          </div>
        </div>
      </Spin>
    </Modal>
    </>
  );
};

export default RoomAssetsModal;