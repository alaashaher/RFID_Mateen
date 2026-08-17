// ═══════════════════════════════════════════════════════════════════════════
// roomLabelPrinter.ts
// ───────────────────────────────────────────────────────────────────────────
// مكتبه طباعة لاصق الغرفة على Zebra GK420t عبر BrowserPrint
//
// الاعدادات:
//   - مقاس اللاصق: 6cm x 4cm
//   - الطابعه: Zebra GK420t (203 dpi)
//   - 1 mm = 8 dots عند 203 dpi
//   - 6cm = 480 dots عرض
//   - 4cm = 320 dots ارتفاع
// ═══════════════════════════════════════════════════════════════════════════

export interface RoomPrintData {
  RoomId: number;
  RoomName: string;
  RoomCode: string;
  UniversityFloorId?: number | null;
  UniversityFloorName?: string | null;
  UniversityFloorCode?: string | null;
  BuildingId?: number | null;
  BuildingName?: string | null;
  BuildingCode?: string | null;
  SuiteId?: number | null;
  SuiteName?: string | null;
  SuiteCode?: string | null;
}

// ─── BrowserPrint endpoint (defaults) ───
// ملاحظة: BrowserPrint بيشغّل local web service على بورت 9101 (HTTPS)
// مش 9100 (ده بورت TCP الخاص بالطابعة نفسها)
const BROWSER_PRINT_URL = "https://localhost:9101";

// ═══════════════════════════════════════════════════════════════════════════
// [1] بناء محتوى الـ QR Code (JSON قصير محصّن)
// ═══════════════════════════════════════════════════════════════════════════
export function buildQrPayload(room: RoomPrintData): string {
  // {"t":"R","id":5,"c":"05"}
  const payload = {
    t: "R",                  // Type = Room
    id: room.RoomId,
    c: room.RoomCode || "",
  };
  return JSON.stringify(payload);
}
const Mosanda_LOGO_SRC = "assets/imgs/mosanda-logo.png"; 
const WAKF_LOGO_SRC = "assets/imgs/wakf-logo.png"; 

// ═══════════════════════════════════════════════════════════════════════════
// [2] بناء الـ ZPL للاصق الغرفة
// ───────────────────────────────────────────────────────────────────────────
// ملاحظات:
//   - ^XA / ^XZ = بداية ونهاية اللاصق
//   - ^PW480 = عرض اللاصق 480 dots (6cm)
//   - ^LL320 = ارتفاع اللاصق 320 dots (4cm)
//   - ^FO x,y = موضع البدء (left, top)
//   - ^A0N,h,w = خط (h=ارتفاع، w=عرض) — لازم نقدر ندعم العربى
//   - ^BQN,2,M = QR code (M = magnification factor 1-10)
//   - ^FH = enable hex escape (للنصوص العربيه)
//
// العربى:
//   - الـ GK420t ما بيدعمش العربى اصلاً بدون خط مرفوع
//   - الحل: نرسل النص العربى كصوره (raster) مع الـ ZPL
//   - او نرفع خط عربى للطابعه (مرة واحده)
//
// قرار: نولّد الـ label كصورة (PNG) من الـ canvas ثم نرسلها كـ raster
//        بهذا نضمن دعم العربى 100% بدون اى تثبيتات اضافيه
// ═══════════════════════════════════════════════════════════════════════════

// نستخدم QRCode.toDataURL لتوليد الـ QR، ثم canvas لرسم اللاصق كامل، ثم نحول لـ ZPL raster
import QRCode from "qrcode";

// ─── ابعاد اللاصق بالـ dots (203 dpi) ───
// 1mm @ 203dpi ≈ 8 dots
//
// قياسات شائعه (203 DPI):
//   6x4 cm  → 480 x 320
//   10x6 cm → 800 x 480
//   8x5 cm  → 640 x 400
//   10x4 cm → 800 x 320
//   7.5x5 cm → 600 x 400
//
// ⚠️ ملاحظه: بعض الطابعات (خصوصا GK420t القديمه) عندها مشكله فى تفسير ^LL
//   - الطابعه بتطبع المحتوى فى نصف المساحه فقط
//   - الحل: نضاعف الارتفاع، فالطابعه تطبع نصف المضاعف = الارتفاع الصحيح
//   - استخدم HEIGHT_MULTIPLIER = 2 لو الطباعه تطلع فى نصف اللاصق
let LABEL_WIDTH_DOTS = 480; // 6 cm  (يمكن تغييرها فى runtime)
let LABEL_HEIGHT_DOTS = 320; // 4 cm
let HEIGHT_MULTIPLIER = 1; // ← غيّرها لـ 2 لو الطباعه تطلع فى نصف اللاصق

/**
 * تحديث ابعاد اللاصق - استخدمها لو ابعاد اللاصق الفعلى مختلفة
 * @param widthCm العرض بالسم (مثلا 6)
 * @param heightCm الارتفاع بالسم (مثلا 4)
 * @param dpi دقه الطابعه - GK420t = 203
 */
export function setLabelDimensions(
  widthCm: number,
  heightCm: number,
  dpi: number = 203
): void {
  // 1 inch = 2.54 cm
  const dotsPerCm = dpi / 2.54;
  LABEL_WIDTH_DOTS = Math.round(widthCm * dotsPerCm);
  LABEL_HEIGHT_DOTS = Math.round(heightCm * dotsPerCm);
  console.log(
    `[LabelPrinter] الابعاد الجديده: ${widthCm}x${heightCm}cm = ${LABEL_WIDTH_DOTS}x${LABEL_HEIGHT_DOTS} dots`
  );
}

/**
 * تعديل multiplier الارتفاع - لمعالجه مشكلة الطابعات اللى بتطبع فى نص اللاصق
 * @param multiplier 1 = طبيعى, 2 = ضعف الارتفاع
 */
export function setHeightMultiplier(multiplier: number): void {
  HEIGHT_MULTIPLIER = multiplier;
  console.log(`[LabelPrinter] Height multiplier: ${multiplier}`);
}

/**
 * جلب الابعاد الحاليه (للعرض/التشخيص)
 */
export function getLabelDimensions(): {
  widthDots: number;
  heightDots: number;
  widthCm: number;
  heightCm: number;
} {
  return {
    widthDots: LABEL_WIDTH_DOTS,
    heightDots: LABEL_HEIGHT_DOTS,
    widthCm: +(LABEL_WIDTH_DOTS / 80).toFixed(1),
    heightCm: +(LABEL_HEIGHT_DOTS / 80).toFixed(1),
  };
}

/**
 * يولّد صورة اللاصق كاملة على Canvas (عربى + إنجليزى + QR)
 *
 * التصميم الجديد:
 *   ┌────────────────────────────────────────────┐
 *   │      اسم المبنى (centered, full width)      │  ← شريط علوى
 *   ├────────────────────────────────────────────┤
 *   │ ┌──────┐                                    │
 *   │ │ QR   │   الغرفة: Room 1                   │
 *   │ │ 140  │   Code: 01                         │
 *   │ │ x140 │   الدور: الدور الأول — 01           │
 *   │ └──────┘   الجناح: 101 — 01                  │
 *   └────────────────────────────────────────────┘
 */
async function renderLabelToCanvas(
  room: RoomPrintData
): Promise<HTMLCanvasElement> {
  // ✅ [مهم جداً] التأكد من تحميل خطوط الويب (مثل Cairo) قبل بدء الرسم
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = LABEL_WIDTH_DOTS;
  canvas.height = LABEL_HEIGHT_DOTS;
  const ctx = canvas.getContext("2d")!;

  // خلفيه بيضاء
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const verticalOffset = 0;

  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  // ═══════════════════════════════════════════════
  // [0] الاطار الخارجى - يحدد منطقة الطباعه
  // ═══════════════════════════════════════════════
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  
  // ✅ فصلنا الإزاحة: 28 من اليمين/اليسار للداخل (لتجنب البهتان)، و 20 من الأعلى/الأسفل
  const borderInsetX = 28; 
  const borderInsetY = 20;
  
  ctx.strokeRect(
    borderInsetX,
    verticalOffset + borderInsetY,
    LABEL_WIDTH_DOTS - borderInsetX * 2,
    LABEL_HEIGHT_DOTS - borderInsetY * 2
  );

  // ═══════════════════════════════════════════════
  // [1] الشريط العلوى - اسم المبنى 
  // ═══════════════════════════════════════════════
  const HEADER_HEIGHT = 70; 
  const HEADER_PADDING_TOP = 32; 

  // رسم النصوص العلوية
  if (room.BuildingName) {
    ctx.direction = "rtl" as any;
    ctx.textAlign = "center";

    const parts = room.BuildingName.split(/[,،]/).map((p) => p.trim());

    if (parts.length > 1) {
      // السطر الأول: نستخدم خط Cairo بوزن 900 (عريض ونظيف بدون stroke)
      ctx.font = "800 20px 'Cairo', sans-serif";
      const part1 = fitTextToWidth(ctx, parts[0], LABEL_WIDTH_DOTS - (borderInsetX * 2) - 10);
      ctx.fillText(part1, LABEL_WIDTH_DOTS / 2, verticalOffset + HEADER_PADDING_TOP);

      // السطر الثاني: وزن 700 ليكون أقل سماكة من الأول
      ctx.font = "600 18px 'Cairo', sans-serif"; 
      const restOfText = parts.slice(1).join(" ");
      const part2 = fitTextToWidth(ctx, restOfText, LABEL_WIDTH_DOTS - (borderInsetX * 2) - 10);
      ctx.fillText(part2, LABEL_WIDTH_DOTS / 2, verticalOffset + HEADER_PADDING_TOP + 38); 
    } else {
      ctx.font = "800 20px 'Cairo', sans-serif";
      const buildingName = fitTextToWidth(ctx, room.BuildingName, LABEL_WIDTH_DOTS - (borderInsetX * 2) - 10);
      ctx.fillText(buildingName, LABEL_WIDTH_DOTS / 2, verticalOffset + HEADER_PADDING_TOP + 15);
    }
  }

  // ═══════════════════════════════════════════════
  // [2] توليد الـ QR Code - مكبّر للوضوح
  // ═══════════════════════════════════════════════
  const qrPayload = buildQrPayload(room);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "H", 
    margin: 1,
    scale: 10, 
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImg = await loadImage(qrDataUrl);
// ═══════════════════════════════════════════════
  // [3] إعدادات المساحات للـ QR واللوجو والنصوص
  // ═══════════════════════════════════════════════
  // صغرنا الحجم قليلاً لتوفير مساحة أفقية تكفي للنصوص بعد تكبير اللوجو
  const QR_SIZE =  140; 
  const LOGO_SIZE = 110;
  const LOGO_HEIGHT = room.BuildingId == 7 ? QR_SIZE : 120; // ✅ اللوجو سيأخذ نفس ارتفاع الـ QR بالضبط
  
  const contentTop = verticalOffset + HEADER_HEIGHT + 10;
  const contentHeight = LABEL_HEIGHT_DOTS - HEADER_HEIGHT - 25;

  // 1. رسم الـ QR في أقصى اليسار
  const qrX = borderInsetX + 10; 
  const qrY = contentTop + (contentHeight - QR_SIZE) / 2;
  ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);

  // 2. رسم اللوجو في المنتصف تماماً (وبنفس محاذاة الـ QR)
  let logoWidth = LOGO_HEIGHT; // قيمة افتراضية
  try {
    const logoImg = await loadImage(room.BuildingId == 7 ? Mosanda_LOGO_SRC : WAKF_LOGO_SRC);
    
    // ✅ حساب العرض بناءً على نسبة أبعاد الصورة حتى لا تتمطط
    const aspectRatio = logoImg.width / logoImg.height;
    logoWidth = LOGO_HEIGHT * aspectRatio;

    // توسيط اللوجو أفقياً
    const logoX = (LABEL_WIDTH_DOTS / 2) - (logoWidth / 2);
    // ✅ توحيد الإحداثي الصادي (Y) ليكون متطابقاً مع الـ QR من الأعلى والأسفل
    const logoY = room.BuildingId == 7 ?  qrY : contentTop + (contentHeight - LOGO_SIZE) / 2; 
    
    ctx.drawImage(logoImg, logoX, logoY, logoWidth, LOGO_HEIGHT);
  } catch (e) {
    console.warn("Logo not found");
  }

   const textRightEdge = LABEL_WIDTH_DOTS - borderInsetX - 10; 
  // // بداية النصوص من اليسار ستكون بعد اللوجو بمسافة بسيطة
   const textLeftEdge = (LABEL_WIDTH_DOTS / 2) + (logoWidth / 2) + 10;
   const textWidth = textRightEdge - textLeftEdge;

  const lines: { text: string; size: number; isLtr: boolean; weight: string }[] = [];
  // الغرفة 
  lines.push({
    text: `${room.RoomName}`,
    size: room.BuildingId == 7 ? 24 : 20, 
    isLtr: false,
    weight: room.BuildingId == 7 ? "900" : "750", // أوزان Cairo (700, 900) ممتازة
  });

  // الدور
  if (room.UniversityFloorName) {
    console.log("rpppppppppppms", room)
    lines.push({
      text: `${room.UniversityFloorName}`,
      size: room.BuildingId == 7 ? 24 : 22, 
      isLtr: false,
      weight: room.BuildingId == 7 ? "900" : "800",
    });
  }

  // الجناح
  if (room.SuiteName) {
    lines.push({
      text: `${room.SuiteName}`,
      size: room.BuildingId == 7 ? 24 : 17, 
      isLtr: false,
      weight: room.BuildingId == 7 ? "900" : "800", // جعلنا الجناح أقل سماكة بقليل لتمييزه
    });
  }

  // حساب الارتفاع الإجمالي للتوسيط
  const LINE_GAP = 16; // ✅ زدنا المسافة بين الأسطر ليتنفس الخط
  const totalTextHeight = lines.reduce(
    (sum, l, i) => sum + l.size * 1.2 + (i < lines.length - 1 ? LINE_GAP : 0),
    0
  );

  let y = contentTop + (contentHeight - totalTextHeight) / 2;

  // رسم النصوص (بدون strokeText)
  for (const line of lines) {
    // استخدام خط Cairo لجميع النصوص السفلية
    ctx.font = `${line.weight} ${line.size}px 'Cairo', sans-serif`;
    ctx.direction = "rtl" as any;
    ctx.textAlign = "right";
    
    const fittedText = fitTextToWidth(ctx, line.text, textWidth);
    ctx.fillText(fittedText, textRightEdge, y);
    
    y += line.size * 1.25 + LINE_GAP;
  }

  return canvas;
}

// ─── helper: قص النص لو اطول من العرض المتاح ───
function fitTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  // نقص حرف حرف من الاخر مع اضافة "..."
  const ellipsis = "…";
  let truncated = text;
  while (
    truncated.length > 0 &&
    ctx.measureText(truncated + ellipsis).width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

// ─── helper: تحميل صوره من dataURL ───
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── helper: كتابة نص مع line wrap ───
function drawTextWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

// ═══════════════════════════════════════════════════════════════════════════
// [3] تحويل Canvas الى ZPL raster (^GFA)
// ───────────────────────────────────────────────────────────────────────────
// خوارزميه:
//   - نقرا كل pixel من الـ canvas
//   - threshold: لو RGB متوسطه < 128 → اسود (1), غيره ابيض (0)
//   - نحول كل 8 bits لـ byte → hex
//   - نبنى ZPL command ^GFA,bytes,bytes,rowBytes,DATA
// ═══════════════════════════════════════════════════════════════════════════
function canvasToZpl(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const width = canvas.width;
  const height = canvas.height;
  const rowBytes = Math.ceil(width / 8);
  const totalBytes = rowBytes * height;

  let hexData = "";

  for (let y = 0; y < height; y++) {
    let rowHex = "";
    let byteVal = 0;
    let bitCount = 0;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const avg = (r + g + b) / 3;
      const bit = avg < 180 ? 1 : 0; // اسود = 1
      byteVal = (byteVal << 1) | bit;
      bitCount++;

      if (bitCount === 8) {
        rowHex += byteVal.toString(16).padStart(2, "0").toUpperCase();
        byteVal = 0;
        bitCount = 0;
      }
    }
    // padding للـ byte الاخيره لو مش مكتمله
    if (bitCount > 0) {
      byteVal = byteVal << (8 - bitCount);
      rowHex += byteVal.toString(16).padStart(2, "0").toUpperCase();
    }

    hexData += rowHex;
  }

  // ⚠️ نستخدم الـ LABEL_HEIGHT_DOTS الفعلى بدلاً من الـ canvas height
  // لان canvas height قد يكون مضاعف للتعويض عن مشاكل الطابعه
  // بناء ZPL مع اوامر معايرة كاملة
  const zpl = `^XA
^CI28
^MMT
^MNW
^PW${LABEL_WIDTH_DOTS}
^LL${LABEL_HEIGHT_DOTS}
^LH0,0
^LS0
^LT0
^PON
^FO0,0
^GFA,${totalBytes},${totalBytes},${rowBytes},${hexData}
^XZ`;

  return zpl;
}

// ═══════════════════════════════════════════════════════════════════════════
// [4] الاتصال بـ Zebra BrowserPrint وارسال الـ ZPL
// ═══════════════════════════════════════════════════════════════════════════

interface ZebraPrinter {
  uid: string;
  name: string;
  connection: string;
  deviceType: string;
  manufacturer: string;
}

interface ZebraDefaultPrinterResponse {
  printer?: ZebraPrinter;
}

/**
 * تحقق من ان BrowserPrint مثبّت ومتاح
 * @returns object فيه تفاصيل اكتر عن نوع المشكلة
 */
export async function checkBrowserPrintAvailable(): Promise<{
  available: boolean;
  reason?: "not_installed" | "cert_not_accepted" | "service_down";
  details?: string;
}> {
  try {
    const res = await fetch(`${BROWSER_PRINT_URL}/available`, {
      method: "GET",
      mode: "cors",
    });
    if (res.ok) {
      return { available: true };
    }
    return {
      available: false,
      reason: "service_down",
      details: `HTTP ${res.status}`,
    };
  } catch (e: any) {
    // الـ fetch بيرمى TypeError لو certificate غير مقبول او الـ service مش شغال
    const msg = e?.message || "";
    if (
      msg.includes("certificate") ||
      msg.includes("SSL") ||
      msg.includes("Failed to fetch")
    ) {
      return {
        available: false,
        reason: "cert_not_accepted",
        details:
          "افتح https://localhost:9101/available فى نافذة جديدة واقبل شهادة الأمان مرة واحدة، ثم ارجع وأعد الفحص.",
      };
    }
    return {
      available: false,
      reason: "not_installed",
      details: "تأكد من تثبيت Zebra BrowserPrint وتشغيله.",
    };
  }
}

/**
 * جلب أفضل طابعة Zebra متاحة
 * منطق الاختيار:
 *   1) أى طابعة USB (الأولوية - GK420t موصّلة بكابل)
 *   2) أى طابعة لها اسم غير فاضى
 *   3) أول طابعة فى القائمة
 */
export async function getDefaultPrinter(): Promise<ZebraPrinter | null> {
  try {
    // /available بترجع كل الطابعات المتاحه
    const res = await fetch(`${BROWSER_PRINT_URL}/available`, {
      method: "GET",
      mode: "cors",
    });
    if (!res.ok) return null;

    const data = await res.json();
    const printers: ZebraPrinter[] = Array.isArray(data?.printer)
      ? data.printer
      : data?.printer
      ? [data.printer]
      : [];

    if (printers.length === 0) return null;

    // الاولويه 1: USB
    const usbPrinter = printers.find(
      (p) => p.connection?.toLowerCase() === "usb"
    );
    if (usbPrinter) return usbPrinter;

    // الاولويه 2: طابعه ليها اسم
    const namedPrinter = printers.find(
      (p) => p.name && p.name.trim().length > 0
    );
    if (namedPrinter) return namedPrinter;

    // fallback: اول طابعه
    return printers[0];
  } catch {
    return null;
  }
}

/**
 * ارسال ZPL للطابعة
 */
async function sendZplToPrinter(
  printer: ZebraPrinter,
  zpl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BROWSER_PRINT_URL}/write`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device: printer,
        data: zpl,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "فشل الاتصال بالطابعة" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// [HELPER] معايرة الطابعة على مقاس اللاصق (مرة واحدة)
// ───────────────────────────────────────────────────────────────────────────
// الاوامر:
//   ~JC      = اعمل Sensor Calibration (تتعرف على الـ gap بين اللواصق)
//   ^MMT     = Media Mode Tear-off
//   ^MNW     = Web sensor (gap detection)
//   ^MTT     = Thermal Transfer (او ^MTD لو direct thermal)
//   ^PW/^LL  = ابعاد اللاصق
//   ^JUS     = Save settings to flash (مهم!)
// ═══════════════════════════════════════════════════════════════════════════
export async function calibratePrinter(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const printer = await getDefaultPrinter();
  if (!printer) {
    return { ok: false, error: "لم يتم العثور على طابعة" };
  }

  // اوامر معايرة كاملة + حفظ الاعدادات للذاكرة
  const calibrationZpl = `^XA
^MMT
^MNW
^PW${LABEL_WIDTH_DOTS}
^LL${LABEL_HEIGHT_DOTS}
^LH0,0
^LS0
^LT0
^JUS
^XZ
~JC`;

  return sendZplToPrinter(printer, calibrationZpl);
}

// ═══════════════════════════════════════════════════════════════════════════
// [HELPER] reset إعدادات الطابعة للقيم المصنعية ثم اعادة التطبيق
// ───────────────────────────────────────────────────────────────────────────
// لو فيه حد قبل كده غيّر الـ Print Width فى الطابعه نفسها (من زر Feed مثلا)
// او عبر ZPL سابق، نعمل reset كامل ونعيد ضبط الابعاد
// ═══════════════════════════════════════════════════════════════════════════
export async function resetPrinterToDefaults(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const printer = await getDefaultPrinter();
  if (!printer) {
    return { ok: false, error: "لم يتم العثور على طابعة" };
  }

  // ^JUF = Use Factory Defaults
  // ثم نطبق ابعادنا الصحيحة
  const resetZpl = `^XA
^JUF
^XZ
^XA
^MMT
^MNW
^PW${LABEL_WIDTH_DOTS}
^LL${LABEL_HEIGHT_DOTS}
^LH0,0
^LS0
^LT0
^JUS
^XZ
~JC`;

  return sendZplToPrinter(printer, resetZpl);
}

// ═══════════════════════════════════════════════════════════════════════════
// [HELPER] طباعة لاصق اختبار - مسطرة + علامات الزوايا الاربعه
// ───────────────────────────────────────────────────────────────────────────
// التصميم:
//   - اطار خارجى يحدد كامل اللاصق
//   - علامات + فى الزوايا الاربعه
//   - مسطره علويه فيها قياسات بالـ dots
//   - مسطره يساريه فيها قياسات بالـ dots
//   - نص فى المنتصف يوضح الابعاد المتوقعه
// لو الاطار طلع كامل = الابعاد صح
// لو ناقص جزء = نعرف بالظبط من اين القص
// ═══════════════════════════════════════════════════════════════════════════
export async function printTestLabel(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const printer = await getDefaultPrinter();
  if (!printer) {
    return { ok: false, error: "لم يتم العثور على طابعة" };
  }

  const w = LABEL_WIDTH_DOTS;
  const h = LABEL_HEIGHT_DOTS;
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  // علامات على المسطرة الافقية كل 50 dot
  let topRuler = "";
  for (let x = 0; x <= w; x += 50) {
    topRuler += `^FO${x},5^GB2,15,2^FS\n`;
    if (x % 100 === 0) {
      topRuler += `^FO${x + 3},22^A0N,16,16^FD${x}^FS\n`;
    }
  }

  // علامات على المسطرة الشاقولية كل 50 dot
  let leftRuler = "";
  for (let y = 0; y <= h; y += 50) {
    leftRuler += `^FO5,${y}^GB15,2,2^FS\n`;
    if (y % 100 === 0) {
      leftRuler += `^FO22,${y + 3}^A0N,16,16^FD${y}^FS\n`;
    }
  }

  const testZpl = `^XA
^CI28
^MMT
^MNW
^PW${w}
^LL${h}
^LH0,0
^LS0
^LT0
^PON
^PMN

^FX === الاطار الخارجى - رسم 4 خطوط منفصلة بدل GB ===
^FO0,0^GB${w - 1},2,2^FS
^FO0,${h - 2}^GB${w - 1},2,2^FS
^FO0,0^GB2,${h - 1},2^FS
^FO${w - 2},0^GB2,${h - 1},2^FS

${topRuler}
${leftRuler}

^FX === خط افقى فى المنتصف ===
^FO0,${cy}^GB${w},2,2^FS

^FX === خط راسى فى المنتصف ===
^FO${cx},0^GB2,${h},2^FS

^FX === النصوص فى الزوايا الاربعه ===
^FO50,40^A0N,28,28^FDTL ${w}x${h}^FS
^FO${w - 80},40^A0N,28,28^FDTR^FS
^FO50,${h - 40}^A0N,28,28^FDBL^FS
^FO${w - 80},${h - 40}^A0N,28,28^FDBR^FS

^FX === نص فى المنتصف ===
^FO${cx - 100},${cy - 20}^A0N,30,30^FDCENTER^FS
^FO${cx - 130},${cy + 15}^A0N,20,20^FD${w}x${h} dots^FS

^XZ`;

  return sendZplToPrinter(printer, testZpl);
}

// ═══════════════════════════════════════════════════════════════════════════
// [5] الـ API العام — هو اللى الـ React component هينادى عليه
// ═══════════════════════════════════════════════════════════════════════════

export interface PrintResult {
  success: boolean;
  printedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * طباعة لاصق غرفة (او اكثر) عبر Zebra BrowserPrint
 */
export async function printRoomLabels(
  rooms: RoomPrintData[]
): Promise<PrintResult> {
  const result: PrintResult = {
    success: false,
    printedCount: 0,
    failedCount: 0,
    errors: [],
  };

  if (!rooms || rooms.length === 0) {
    result.errors.push("لا توجد غرف للطباعة");
    return result;
  }

  // 1) تحقق من BrowserPrint
  const checkResult = await checkBrowserPrintAvailable();
  if (!checkResult.available) {
    result.errors.push(
      checkResult.details ||
        "Zebra BrowserPrint غير متصل. تأكد من تثبيته وتشغيله على هذا الجهاز."
    );
    return result;
  }

  // 2) جلب الطابعة الافتراضية
  const printer = await getDefaultPrinter();
  if (!printer) {
    result.errors.push(
      "لم يتم العثور على طابعة Zebra افتراضية. تحقق من توصيل الطابعة."
    );
    return result;
  }

  // 3) لكل غرفة، نولّد اللاصق ونطبع
  for (const room of rooms) {
    try {
      const canvas = await renderLabelToCanvas(room);
      const zpl = canvasToZpl(canvas);
      const sendRes = await sendZplToPrinter(printer, zpl);

      if (sendRes.ok) {
        result.printedCount++;
      } else {
        result.failedCount++;
        result.errors.push(
          `فشل طباعة غرفة ${room.RoomName}: ${sendRes.error || "خطأ غير معروف"}`
        );
      }
    } catch (e: any) {
      result.failedCount++;
      result.errors.push(
        `خطأ فى تجهيز غرفة ${room.RoomName}: ${e?.message || ""}`
      );
    }
  }

  result.success = result.printedCount > 0;
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// [6] معاينة اللاصق (returns Canvas DataURL — للعرض قبل الطباعة)
// ═══════════════════════════════════════════════════════════════════════════
export async function previewRoomLabel(
  room: RoomPrintData
): Promise<string> {
  const canvas = await renderLabelToCanvas(room);
  return canvas.toDataURL("image/png");
}