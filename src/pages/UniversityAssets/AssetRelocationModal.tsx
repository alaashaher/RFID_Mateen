// ============================================================
// AssetRelocationModal.tsx
// Modal إعادة تسكين الأصل — اختيار المبنى → الدور → الجناح → الغرفة
// ============================================================

import React, { useEffect, useState } from "react";
import { Modal, Select, Button, Input, Divider, Descriptions, Tag, Spin } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { getFromApi, postToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";

const { Option } = Select;
const { TextArea } = Input;

// ── Types ──
interface RelocationTarget {
  buildingId?: number;
  buildingName?: string;
  floorId?: number;
  floorName?: string;
  suiteId?: number;
  suiteName?: string;
  roomId?: number;
  roomName?: string;
}

interface AssetRelocationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: {
    UniversityAssetId: number;
    UniversityAssetName: string;
    BuildingName?: string;
    FloorName?: string;
    SuiteName?: string;
    RoomName?: string;
    BuildingId?: number;
    UniversityFloorId?: number;
    SuiteId?: number;
    RoomId?: number;
  } | null;
}

const AssetRelocationModal: React.FC<AssetRelocationModalProps> = ({
  open,
  onClose,
  onSuccess,
  asset,
}) => {
  // ── بيانات الـ dropdowns ──
  const [buildings, setBuildings]   = useState<any[]>([]);
  const [floors, setFloors]         = useState<any[]>([]);
  const [suites, setSuites]         = useState<any[]>([]);
  const [rooms, setRooms]           = useState<any[]>([]);

  // ── الاختيارات الجديدة ──
  const [target, setTarget] = useState<RelocationTarget>({});
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);

  // ── helper ──
  const toArray = (res: any): any[] => (Array.isArray(res) ? res : []);

  // reset عند فتح الـ modal
  useEffect(() => {
    if (open) {
      setTarget({});
      setNotes("");
      setFloors([]);
      setSuites([]);
      setRooms([]);
      fetchBuildings();
    }
  }, [open]);

  // ── جلب المباني (الإدارية فقط — buildingTypeId != 1) ──
  const fetchBuildings = async () => {
    try {
      // نجيب كل المباني ونفلتر غير المستودع في الـ UI
      // أو لو عندك endpoint بـ buildingTypeId مررها هنا
      const res = await getFromApi("Building/get-building-ddl");
      setBuildings(toArray(res).filter((b) => b.BuildingTypeId !== 1));
    } catch { setBuildings([]); }
  };

  // ── جلب الأدوار عند تغيير المبنى ──
  useEffect(() => {
    setFloors([]); setSuites([]); setRooms([]);
    setTarget((prev) => ({ ...prev, floorId: undefined, floorName: undefined,
                                    suiteId: undefined, suiteName: undefined,
                                    roomId: undefined,  roomName: undefined }));
    if (!target.buildingId) return;
    const fetch = async () => {
      try {
        const res = await getFromApi(
          `UniversityFloor/get-universityFloor-ddl?buildingId=${target.buildingId}`
        );
        const data = res?.Data ?? res;
        setFloors(toArray(data));
      } catch { setFloors([]); }
    };
    fetch();
  }, [target.buildingId]);

  // ── جلب الأجنحة عند تغيير الدور ──
  useEffect(() => {
    setSuites([]); setRooms([]);
    setTarget((prev) => ({ ...prev, suiteId: undefined, suiteName: undefined,
                                    roomId: undefined,  roomName: undefined }));
    if (!target.floorId) return;
    const fetch = async () => {
      try {
        const res = await getFromApi(
          `Suite/get-suite-ddl?floorId=${target.floorId}`
        );
        const data = res?.Data ?? res;
        setSuites(toArray(data));
      } catch { setSuites([]); }
    };
    fetch();
  }, [target.floorId]);

  // ── جلب الغرف عند تغيير الجناح ──
  useEffect(() => {
    setRooms([]);
    setTarget((prev) => ({ ...prev, roomId: undefined, roomName: undefined }));
    if (!target.suiteId) return;
    const fetch = async () => {
      try {
        const res = await getFromApi(
          `Room/get-room-ddl-withSuiteId?suiteId=${target.suiteId}`
        );
        const data = res?.Data ?? res;
        setRooms(toArray(data));
      } catch { setRooms([]); }
    };
    fetch();
  }, [target.suiteId]);

  // ── تنفيذ النقل ──
  const handleRelocate = async () => {
    if (!target.buildingId) {
      Store.addNotification({
        title: "", message: "يرجى اختيار المبنى على الأقل",
        type: "warning", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2500, onScreen: true },
      });
      return;
    }

    setSaving(true);
    try {
      const res = await postToApi("UniversityAsset/relocate-asset", {
        UniversityAssetId: asset?.UniversityAssetId,
        NewBuildingId: target.buildingId ?? null,
        NewFloorId:    target.floorId    ?? null,
        NewSuiteId:    target.suiteId    ?? null,
        NewRoomId:     target.roomId     ?? null,
        Notes:         notes || null,
      });

      if (res?.Item1 === true) {
        Store.addNotification({
          title: "", message: res.Item2 || "تم نقل الأصل بنجاح",
          type: "success", insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
        onSuccess();
        onClose();
      } else {
        Store.addNotification({
          title: "", message: res?.Item2 || "فشل نقل الأصل",
          type: "danger", insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2500, onScreen: true },
        });
      }
    } catch {
      Store.addNotification({
        title: "", message: "حدث خطأ أثناء نقل الأصل",
        type: "danger", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2500, onScreen: true },
      });
    } finally {
      setSaving(false);
    }
  };

  if (!asset) return null;

  // هل اختار غرفة؟ (الحد الأدنى هو مبنى)
  const canSave = !!target.buildingId;

  return (
    <Modal
      open={open}
      title={
        <span>
          <SwapOutlined style={{ marginLeft: 8, color: "#1890ff" }} />
          إعادة تسكين الأصل
        </span>
      }
      onCancel={onClose}
      width={600}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          إلغاء
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={handleRelocate}
          loading={saving}
          disabled={!canSave}
          icon={<SwapOutlined />}
        >
          تأكيد النقل
        </Button>,
      ]}
    >
      {/* ── الموقع الحالي ── */}
      {/* <Descriptions
        title="الموقع الحالي"
        size="small"
        bordered
        column={2}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="المبنى">
          <Tag color="default">{asset.BuildingName || "—"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="الدور">
          <Tag color="default">{asset.FloorName || "—"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="الجناح">
          <Tag color="default">{asset.SuiteName || "—"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="الغرفة">
          <Tag color="default">{asset.RoomName || "—"}</Tag>
        </Descriptions.Item>
      </Descriptions> */}

      <Divider style={{ margin: "12px 0" }}>
        <SwapOutlined /> الموقع الجديد
      </Divider>

      {/* ── اختيار الموقع الجديد ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* المبنى */}
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>
            المبنى <span style={{ color: "red" }}>*</span>
          </div>
          <Select
            allowClear
            showSearch
            placeholder="اختر المبنى"
            style={{ width: "100%" }}
            value={target.buildingId || undefined}
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            onChange={(val, option: any) =>
              setTarget((prev) => ({
                ...prev,
                buildingId:   val ?? undefined,
                buildingName: option?.label ?? undefined,
              }))
            }
            options={buildings.map((b) => ({
              value: b.BuildingId,
              label: `${b.BuildingName} - ${b.BuildingCode}`,
            }))}
          />
        </div>

        {/* الدور */}
        {target.buildingId && (
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>الدور</div>
            <Select
              allowClear
              placeholder="اختر الدور"
              style={{ width: "100%" }}
              value={target.floorId || undefined}
              onChange={(val, option: any) =>
                setTarget((prev) => ({
                  ...prev,
                  floorId:   val ?? undefined,
                  floorName: option?.children ?? undefined,
                }))
              }
            >
              {floors.map((f) => (
                <Option key={f.UniversityFloorId} value={f.UniversityFloorId}>
                  {f.UniversityFloorName}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* الجناح */}
        {target.floorId && (
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>الجناح</div>
            <Select
              allowClear
              placeholder="اختر الجناح"
              style={{ width: "100%" }}
              value={target.suiteId || undefined}
              onChange={(val, option: any) =>
                setTarget((prev) => ({
                  ...prev,
                  suiteId:   val ?? undefined,
                  suiteName: option?.children ?? undefined,
                }))
              }
            >
              {suites.map((s) => (
                <Option key={s.SuiteId} value={s.SuiteId}>
                  {s.SuiteNameAr}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* الغرفة */}
        {target.suiteId && (
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>الغرفة</div>
            <Select
              allowClear
              placeholder="اختر الغرفة"
              style={{ width: "100%" }}
              value={target.roomId || undefined}
              onChange={(val, option: any) =>
                setTarget((prev) => ({
                  ...prev,
                  roomId:   val ?? undefined,
                  roomName: option?.children ?? undefined,
                }))
              }
            >
              {rooms.map((r) => (
                <Option key={r.RoomId} value={r.RoomId}>
                  {r.RoomName}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* ملاحظات */}
        <div>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>ملاحظات (اختياري)</div>
          <TextArea
            rows={2}
            placeholder="سبب النقل أو أي ملاحظات..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            showCount
          />
        </div>

        {/* ملخص الاختيار */}
        {target.buildingId && (
          <Descriptions
            size="small"
            bordered
            column={2}
            style={{ background: "#f6ffed", borderColor: "#b7eb8f" }}
          >
            <Descriptions.Item label="المبنى">
              <Tag color="green">{target.buildingName || "—"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="الدور">
              <Tag color="green">{target.floorName || "—"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="الجناح">
              <Tag color="green">{target.suiteName || "—"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="الغرفة">
              <Tag color="green">{target.roomName || "—"}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </div>
    </Modal>
  );
};

export default AssetRelocationModal;