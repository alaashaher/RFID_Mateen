import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Spin,
  Alert,
  Image,
  Tag,
  Space,
  Empty,
  Divider,
  InputNumber,
  Collapse,
} from "antd";
import {
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Store } from "react-notifications-component";
import { getFromApi } from "../../apis/apis";
import {
  RoomPrintData,
  printRoomLabels,
  previewRoomLabel,
  checkBrowserPrintAvailable,
  getDefaultPrinter,
  calibratePrinter,
  printTestLabel,
  setLabelDimensions,
  getLabelDimensions,
  resetPrinterToDefaults,
  setHeightMultiplier,
} from "./roomLabelPrinter";

interface RoomPrintModalProps {
  open: boolean;
  onClose: () => void;
  // إما RoomId واحد (طباعة فردية) أو قائمة (Bulk)
  roomId?: number | null;
  roomIds?: number[];
}

const RoomPrintModal: React.FC<RoomPrintModalProps> = ({
  open,
  onClose,
  roomId,
  roomIds,
}) => {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [rooms, setRooms] = useState<RoomPrintData[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // حالة الطابعة
  const [printerStatus, setPrinterStatus] = useState<{
    available: boolean;
    printerName?: string;
    printerConnection?: string;
    error?: string;
    reason?: "not_installed" | "cert_not_accepted" | "service_down";
  }>({ available: false });

  // ابعاد اللاصق (قابلة للتعديل من الـ UI)
  const [labelW, setLabelW] = useState<number>(getLabelDimensions().widthCm);
  const [labelH, setLabelH] = useState<number>(getLabelDimensions().heightCm);
  const [heightMul, setHeightMul] = useState<number>(1);

  // ─────────────────────────────────────────────
  // [1] فحص الطابعة عند فتح المودل
  // ─────────────────────────────────────────────
  const checkPrinter = async () => {
    const checkResult = await checkBrowserPrintAvailable();
    if (!checkResult.available) {
      setPrinterStatus({
        available: false,
        error: checkResult.details || "Zebra BrowserPrint غير متصل",
        reason: checkResult.reason,
      });
      return;
    }

    const printer = await getDefaultPrinter();
    if (!printer) {
      setPrinterStatus({
        available: false,
        error: "لم يتم العثور على طابعة Zebra. تحقق من توصيل الطابعة.",
      });
      return;
    }

    setPrinterStatus({
      available: true,
      printerName: printer.name || printer.uid,
      printerConnection: printer.connection,
    });
  };

  // ─────────────────────────────────────────────
  // [2] جلب بيانات الغرف من الباك اند
  // ─────────────────────────────────────────────
  const fetchRoomData = async () => {
    setLoading(true);
    try {
      let data: RoomPrintData[] = [];

      if (roomId && roomId > 0) {
        const res = await getFromApi(
          `Room/get-room-print-data?roomId=${roomId}`
        );
        if (res) data = [res];
      } else if (roomIds && roomIds.length > 0) {
        const idsParam = roomIds.join(",");
        const res = await getFromApi(
          `Room/get-rooms-print-data?roomIds=${idsParam}`
        );
        data = Array.isArray(res) ? res : [];
      }

      setRooms(data);

      // معاينة اول غرفة
      if (data.length > 0) {
        const preview = await previewRoomLabel(data[0]);
        setPreviewUrl(preview);
      } else {
        setPreviewUrl(null);
      }
    } catch (e) {
      setRooms([]);
      setPreviewUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      checkPrinter();
      fetchRoomData();
    } else {
      setRooms([]);
      setPreviewUrl(null);
      setPrinterStatus({ available: false });
    }
  }, [open, roomId, JSON.stringify(roomIds)]);

  // ─────────────────────────────────────────────
  // [3] الطباعة
  // ─────────────────────────────────────────────
  const handlePrint = async () => {
    if (!rooms.length) return;
    setPrinting(true);

    try {
      const result = await printRoomLabels(rooms);

      if (result.success && result.failedCount === 0) {
        Store.addNotification({
          title: "تمت الطباعة",
          message: `تم طباعة ${result.printedCount} لاصق بنجاح`,
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2500, onScreen: true },
        });
        onClose();
      } else if (result.success && result.failedCount > 0) {
        Store.addNotification({
          title: "طباعة جزئية",
          message: `نجح ${result.printedCount} وفشل ${result.failedCount}`,
          type: "warning",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 4000, onScreen: true },
        });
      } else {
        Store.addNotification({
          title: "فشل الطباعة",
          message: result.errors[0] || "حدث خطأ أثناء الطباعة",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 4000, onScreen: true },
        });
      }
    } finally {
      setPrinting(false);
    }
  };

  // ─────────────────────────────────────────────
  // تطبيق ابعاد جديدة على اللاصق + تحديث المعاينه
  // ─────────────────────────────────────────────
  const handleApplyDimensions = async () => {
    if (!labelW || !labelH || labelW <= 0 || labelH <= 0) {
      Store.addNotification({
        title: "",
        message: "أدخل أبعاد صحيحة",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    setLabelDimensions(labelW, labelH);
    // تحديث المعاينه
    if (rooms.length > 0) {
      const preview = await previewRoomLabel(rooms[0]);
      setPreviewUrl(preview);
    }
    Store.addNotification({
      title: "",
      message: `تم ضبط الأبعاد على ${labelW}×${labelH} سم`,
      type: "success",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: { duration: 2000, onScreen: true },
    });
  };

  const applyPreset = async (w: number, h: number) => {
    setLabelW(w);
    setLabelH(h);
    setLabelDimensions(w, h);
    if (rooms.length > 0) {
      const preview = await previewRoomLabel(rooms[0]);
      setPreviewUrl(preview);
    }
  };
  const handleCalibrate = async () => {
    const res = await calibratePrinter();
    Store.addNotification({
      title: res.ok ? "تمت المعايرة" : "فشل",
      message: res.ok
        ? "أُرسل أمر المعايرة. الطابعة ستطبع لاصقاً أو اثنين فاضيين، هذا طبيعى."
        : res.error || "فشل المعايرة",
      type: res.ok ? "success" : "danger",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: { duration: 3500, onScreen: true },
    });
  };

  // ─────────────────────────────────────────────
  // طباعة لاصق اختبار (إطار + علامات الزوايا)
  // ─────────────────────────────────────────────
  const handlePrintTest = async () => {
    const res = await printTestLabel();
    Store.addNotification({
      title: res.ok ? "تمت الطباعة" : "فشل",
      message: res.ok
        ? "اطبع لاصق اختبار. لو الإطار يظهر كاملاً = الإعدادات صحيحة"
        : res.error || "فشل الطباعة",
      type: res.ok ? "success" : "danger",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: { duration: 3500, onScreen: true },
    });
  };

  // ─────────────────────────────────────────────
  // Reset الطابعه للقيم المصنعيه (لو فيه عرض طباعه قديم محفوظ)
  // ─────────────────────────────────────────────
  const handleResetPrinter = async () => {
    const res = await resetPrinterToDefaults();
    Store.addNotification({
      title: res.ok ? "تم Reset" : "فشل",
      message: res.ok
        ? "تم إعادة تعيين الطابعة للقيم المصنعية. الطابعة هتطبع لاصق فاضى أو اتنين."
        : res.error || "فشل",
      type: res.ok ? "success" : "danger",
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: { duration: 4000, onScreen: true },
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  const isBulk = rooms.length > 1;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      footer={null}
      title={
        <span>
          <PrinterOutlined style={{ marginInlineEnd: 8 }} />
          {isBulk
            ? `طباعة لواصق ${rooms.length} غرفة`
            : "طباعة لاصق الغرفة"}
        </span>
      }
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* ─── حالة الطابعة ─── */}
        <div style={{ marginBottom: 16 }}>
          {printerStatus.available ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message={
                <span>
                  الطابعة متصلة:{" "}
                  <strong>{printerStatus.printerName}</strong>
                  {printerStatus.printerConnection && (
                    <Tag
                      color={
                        printerStatus.printerConnection.toLowerCase() === "usb"
                          ? "green"
                          : "blue"
                      }
                      style={{ marginInlineStart: 8 }}
                    >
                      {printerStatus.printerConnection.toUpperCase()}
                    </Tag>
                  )}
                </span>
              }
              action={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={checkPrinter}
                >
                  تحديث
                </Button>
              }
            />
          ) : (
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              message="الطابعة غير متاحة"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>{printerStatus.error}</div>

                  {/* لو المشكلة certificate، نظهر زرار مباشر */}
                  {printerStatus.reason === "cert_not_accepted" && (
                    <div
                      style={{
                        background: "#fff7e6",
                        border: "1px solid #ffd591",
                        borderRadius: 6,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>
                        ⚠️ مطلوب مرة واحدة فقط:
                      </div>
                      <ol style={{ margin: 0, paddingInlineStart: 18 }}>
                        <li>
                          اضغط الزر بالأسفل لفتح رابط BrowserPrint
                        </li>
                        <li>اضغط "Advanced" ثم "Proceed to localhost"</li>
                        <li>تأكد من ظهور <code>{`{"available":true}`}</code></li>
                        <li>ارجع هنا واضغط "إعادة الفحص"</li>
                      </ol>
                      <Button
                        type="primary"
                        size="small"
                        style={{ marginTop: 10 }}
                        onClick={() =>
                          window.open(
                            "https://localhost:9101/available",
                            "_blank"
                          )
                        }
                      >
                        فتح صفحة قبول الشهادة 🔓
                      </Button>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: "#666" }}>
                    تأكد من:
                    <ul style={{ margin: "4px 0", paddingInlineStart: 20 }}>
                      <li>تثبيت Zebra BrowserPrint على الجهاز</li>
                      <li>تشغيل البرنامج فى الـ background</li>
                      <li>توصيل الطابعة بالـ USB وتشغيلها</li>
                      <li>
                        إضافة عنوان الموقع فى{" "}
                        <strong>Accepted Hosts</strong> داخل BrowserPrint
                        Settings
                      </li>
                    </ul>
                  </div>
                </div>
              }
              action={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={checkPrinter}
                >
                  إعادة الفحص
                </Button>
              }
            />
          )}
        </div>

        {/* ─── المعاينة ─── */}
        {rooms.length === 0 ? (
          <Empty description="لا توجد بيانات للطباعة" />
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <strong>معاينة اللاصق:</strong>
              {isBulk && (
                <Tag color="blue" style={{ marginInlineStart: 8 }}>
                  معاينة الغرفة الأولى — سيتم طباعة الكل
                </Tag>
              )}
            </div>

            <div
              style={{
                background: "#f5f5f5",
                border: "1px solid #ddd",
                padding: 16,
                borderRadius: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 240,
              }}
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Label Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 280,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: 4,
                    background: "#fff",
                  }}
                  preview={{ mask: "تكبير" }}
                />
              ) : (
                <Spin />
              )}
            </div>

            {/* قائمه الغرف للطباعه فى Bulk */}
            {isBulk && (
              <>
                <Divider style={{ margin: "16px 0 8px" }} />
                <div style={{ fontSize: 13, color: "#666" }}>
                  <strong>الغرف المحدّدة ({rooms.length}):</strong>
                  <div
                    style={{
                      maxHeight: 100,
                      overflowY: "auto",
                      marginTop: 8,
                      padding: 8,
                      background: "#fafafa",
                      borderRadius: 4,
                    }}
                  >
                    <Space wrap size={[6, 6]}>
                      {rooms.map((r) => (
                        <Tag key={r.RoomId}>
                          {r.RoomName} ({r.RoomCode})
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── قسم الإعدادات المتقدمة (تشخيص ومعايرة) ─── */}
        <Collapse
          ghost
          style={{ marginTop: 12 }}
          items={[
            {
              key: "1",
              label: (
                <span style={{ fontSize: 13, color: "#1a56db" }}>
                  🔧 إعدادات متقدمة (لو الطباعة مش مظبوطة)
                </span>
              ),
              children: (
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: 12,
                  }}
                >
                  <div style={{ marginBottom: 10, fontSize: 13 }}>
                    <strong>أبعاد اللاصق الفعلية:</strong>
                    <span style={{ color: "#666", marginInlineStart: 8 }}>
                      قس اللاصق بمسطرة وأدخل الأبعاد الصحيحة
                    </span>
                  </div>

                  {/* Inputs للابعاد */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 12, marginInlineEnd: 6 }}>
                        العرض (سم):
                      </label>
                      <InputNumber
                        size="small"
                        min={2}
                        max={20}
                        step={0.5}
                        value={labelW}
                        onChange={(v) => setLabelW(Number(v) || 0)}
                        style={{ width: 80 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, marginInlineEnd: 6 }}>
                        الارتفاع (سم):
                      </label>
                      <InputNumber
                        size="small"
                        min={2}
                        max={20}
                        step={0.5}
                        value={labelH}
                        onChange={(v) => setLabelH(Number(v) || 0)}
                        style={{ width: 80 }}
                      />
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleApplyDimensions}
                    >
                      تطبيق وتحديث المعاينة
                    </Button>
                  </div>

                  {/* Presets شائعة */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>قياسات شائعة:</strong>
                    </div>
                    <Space wrap size={[6, 6]}>
                      <Button size="small" onClick={() => applyPreset(6, 4)}>
                        6×4 سم
                      </Button>
                      <Button size="small" onClick={() => applyPreset(10, 4)}>
                        10×4 سم
                      </Button>
                      <Button size="small" onClick={() => applyPreset(10, 6)}>
                        10×6 سم
                      </Button>
                      <Button size="small" onClick={() => applyPreset(8, 5)}>
                        8×5 سم
                      </Button>
                      <Button size="small" onClick={() => applyPreset(7.5, 5)}>
                        7.5×5 سم
                      </Button>
                      <Button size="small" onClick={() => applyPreset(10, 7.5)}>
                        10×7.5 سم
                      </Button>
                    </Space>
                  </div>

                  {/* Height multiplier - حل لو الطباعه فى نص اللاصق */}
                  <div
                    style={{
                      background: "#fef3c7",
                      border: "1px solid #fcd34d",
                      borderRadius: 6,
                      padding: 10,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontSize: 12, marginBottom: 6 }}>
                      <strong>🔥 لو الطباعه طلعت فى نص اللاصق فقط:</strong>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#666",
                        marginBottom: 8,
                      }}
                    >
                      بعض الطابعات بتفسر الـ Label Length غلط، الحل ضرب
                      الارتفاع × 2
                    </div>
                    <Space wrap>
                      <Button
                        size="small"
                        type={heightMul === 1 ? "primary" : "default"}
                        onClick={async () => {
                          setHeightMul(1);
                          setHeightMultiplier(1);
                          if (rooms.length > 0) {
                            const preview = await previewRoomLabel(rooms[0]);
                            setPreviewUrl(preview);
                          }
                        }}
                      >
                        × 1 (طبيعى)
                      </Button>
                      <Button
                        size="small"
                        type={heightMul === 2 ? "primary" : "default"}
                        onClick={async () => {
                          setHeightMul(2);
                          setHeightMultiplier(2);
                          if (rooms.length > 0) {
                            const preview = await previewRoomLabel(rooms[0]);
                            setPreviewUrl(preview);
                          }
                        }}
                      >
                        × 2 (حل المشكلة)
                      </Button>
                      <Button
                        size="small"
                        type={heightMul === 1.5 ? "primary" : "default"}
                        onClick={async () => {
                          setHeightMul(1.5);
                          setHeightMultiplier(1.5);
                          if (rooms.length > 0) {
                            const preview = await previewRoomLabel(rooms[0]);
                            setPreviewUrl(preview);
                          }
                        }}
                      >
                        × 1.5
                      </Button>
                    </Space>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 6,
                        color: "#666",
                      }}
                    >
                      المضاعف الحالى: <strong>×{heightMul}</strong>
                    </div>
                  </div>

                  {/* خطوات التشخيص */}
                  <div
                    style={{
                      background: "#fff7e6",
                      border: "1px solid #ffd591",
                      borderRadius: 6,
                      padding: 10,
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    <strong>خطوات التشخيص:</strong>
                    <ol
                      style={{
                        margin: "6px 0 0 0",
                        paddingInlineStart: 18,
                      }}
                    >
                      <li>
                        قس اللاصق الفعلى <strong>بمسطرة</strong> (العرض ×
                        الارتفاع)
                      </li>
                      <li>
                        أدخل المقاس وضغط <strong>تطبيق</strong>
                      </li>
                      <li>
                        اضغط <strong>🔧 معايرة</strong> (الطابعة هتطلع 1-2
                        لاصق فاضى)
                      </li>
                      <li>
                        اضغط <strong>🧪 لاصق اختبار</strong>
                      </li>
                      <li>
                        لو ظهر إطار كامل + الزوايا الأربع (TL/TR/BL/BR) =
                        المقاس صحيح
                      </li>
                      <li>لو لا، جرب مقاس مختلف من الـ presets</li>
                    </ol>
                  </div>
                </div>
              ),
            },
          ]}
        />

        {/* ─── ازرار الـ Footer ─── */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "#666", fontSize: 13 }}>
            مقاس اللاصق: <strong>6×4 سم</strong>
          </div>

          <Space wrap>
            {/* ازرار التشخيص - تظهر فقط لو الطابعه متصله */}
            {printerStatus.available && (
              <>
                <Button
                  size="small"
                  onClick={handlePrintTest}
                  title="يطبع إطار اختبار للتأكد من المقاسات"
                >
                  🧪 لاصق اختبار
                </Button>
                <Button
                  size="small"
                  onClick={handleCalibrate}
                  title="معايرة الطابعة على مقاس اللاصق - مرة واحدة"
                >
                  🔧 معايرة
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={handleResetPrinter}
                  title="إعادة تعيين الطابعة للإعدادات المصنعية"
                >
                  ⚠️ Reset
                </Button>
              </>
            )}

            <Button onClick={onClose} disabled={printing}>
              إلغاء
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              loading={printing}
              onClick={handlePrint}
              disabled={!printerStatus.available || rooms.length === 0}
            >
              {isBulk ? `طباعة ${rooms.length} لاصق` : "طباعة الآن"}
            </Button>
          </Space>
        </div>
      </Spin>
    </Modal>
  );
};

export default RoomPrintModal;