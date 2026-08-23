import React, { useContext, useEffect, useState, useRef } from "react";
import { Store } from "react-notifications-component";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SettingFilled,
  CameraOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined as DeleteIcon,
  WarningOutlined,
  SwapOutlined,
  PictureOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Select as AntSelect, Form } from "antd";

import AssetRelocationModal from "./AssetRelocationModal";
import { deleteFromApi, getFromApi, postToApi, putToApi } from "../../apis/apis";
import {
  Button,
  Pagination,
  Table,
  Tooltip,
  Popconfirm,
  Modal,
  Input,
  Select,
  Upload,
  message,
  Image,
} from "antd";
import UniversityAssetsForm from "./UniversityAssetsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import UniversityAssetsScannedContext from "../../contexts/pages-context/UniversityAssetsProviderScanned";
import UniversityAssetsContext from "../../contexts/pages-context/UniversityAssetsProvider";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import UniversityModelForm from "./UniversityModelForm";
import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import "./UniversityAssets.css";
import urls from "../../urls";

// ============================
// Responsive helper
// ============================
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);
  return isMobile;
};

// ============================
// دالة ضغط الصور (Client-Side)
// ============================
const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.75
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("فشل إنشاء Canvas")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("فشل ضغط الصورة")); return; }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("فشل تحميل الصورة"));
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
  });
};

// ============================
// مكون رفع صور الأصول
// ============================
interface AssetImageUploadProps {
  assetId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AssetImageUploadModal: React.FC<AssetImageUploadProps> = ({
  assetId,
  open,
  onClose,
  onSuccess,
}) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  useEffect(() => {
    if (!open) {
      setFileList([]);
      setUploading(false);
    }
  }, [open]);

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("يرجى رفع صور فقط (JPG, PNG, WEBP)");
      return Upload.LIST_IGNORE;
    }
    const isLt20M = file.size / 1024 / 1024 < 20;
    if (!isLt20M) {
      message.error("حجم الصورة يجب أن يكون أقل من 20 ميجابايت");
      return Upload.LIST_IGNORE;
    }
    if (fileList.length >= 2) {
      message.warning("الحد الأقصى صورتين فقط");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList.slice(0, 2));
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning("يرجى اختيار صورة واحدة على الأقل");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("UniversityAssetId", assetId.toString());
      for (let i = 0; i < fileList.length; i++) {
        const originalFile = fileList[i].originFileObj as File;
        const compressedFile = await compressImage(originalFile);
        formData.append("Images", compressedFile);
      }
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${urls.baseUrl}/UniversityAsset/upload-asset-images`,
        // "https://rfidrajhiapi.sirumaps.net/api/UniversityAsset/upload-asset-images",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      // const response = await fetch(
      //   "https://mosandarajihirfidapi.sirumaps.net/api/UniversityAsset/upload-asset-images",
      //   {
      //     method: "POST",
      //     headers: { Authorization: `Bearer ${token}` },
      //     body: formData,
      //   }
      // );
      const result = await response.json();
      if (response.ok && result?.Item1 !== false) {
        Store.addNotification({
          title: "", message: result?.Item2 || "تم رفع الصور بنجاح",
          type: "success", insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
        onSuccess();
        onClose();
      } else {
        Store.addNotification({
          title: "", message: result?.Item2 || "فشل رفع الصور",
          type: "danger", insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
      }
    } catch (error) {
      Store.addNotification({
        title: "", message: "حدث خطأ أثناء رفع الصور",
        type: "danger", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        title="رفع صور لواصق الأصل"
        onCancel={onClose}
        footer={[
          <Button key="cancel" onClick={onClose} disabled={uploading}>إلغاء</Button>,
          <Button
            key="upload" type="primary" onClick={handleUpload}
            loading={uploading} disabled={fileList.length === 0}
            icon={<UploadOutlined />}
          >
            {uploading ? "جاري الرفع..." : "رفع الصور"}
          </Button>,
        ]}
        width="90%"
        style={{ maxWidth: 520, top: 20 }}
      >
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ marginBottom: 16, color: "#666", fontSize: 14 }}>
            قم برفع صورة أو صورتين بحد أقصى للواصق الموجودة على الأصل
            <br />
            <span style={{ fontSize: 12, color: "#999" }}>
              (سيتم ضغط الصور تلقائياً مع الحفاظ على الجودة)
            </span>
          </p>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onPreview={handlePreview}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            accept="image/*"
            multiple
            maxCount={2}
          >
            {fileList.length >= 2 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>
                  {fileList.length === 0 ? "اختر صورة" : "أضف صورة ثانية"}
                </div>
              </div>
            )}
          </Upload>
          {fileList.length > 0 && (
            <p style={{ marginTop: 12, color: "#1890ff", fontSize: 13 }}>
              تم اختيار {fileList.length} من 2 صور
            </p>
          )}
        </div>
      </Modal>
      <Modal
        open={previewOpen}
        title="معاينة الصورة"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width="90%"
        style={{ maxWidth: 600, top: 20 }}
      >
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </>
  );
};

// ============================
// الصفحة الرئيسية
// ============================

// المبنى رقم 1 (BuildingTypeId = 1) هو "مستودع" — يظهر فلاتر التصنيف/النوع/الموديل
// أي buildingTypeId آخر يظهر فلاتر الدور/الجناح/الغرفة
const WAREHOUSE_BUILDING_TYPE_ID = 1;

const UniversityAssetsPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const {
    rowData, setRowData, pageSize, setPageSize,
    pageNumber, setPageNumber, keyword, setkeyword,
    loading, setLoading, toEdit, setToEdit,
    detectChanges, setdetectChanges,
    openFormModel, setOpenFormModel,
    openFormModelAddingModel, setOpenFormModelAddingModel,
    isActive,
  } = useContext(UniversityAssetsContext);
  const { setModelFilter, modelFilter } = useContext(CategoryContext);
  const { user } = useContext(UserContext);
  const isMobile = useIsMobile();

  const { Option } = Select;

  // ── فلاتر مشتركة ──
  const [buildingTypes, setBuildingTypes] = useState<any[]>([]);
  const [selectedBuildingTypeId, setSelectedBuildingTypeId] = useState<any>("");

  const [buildings, setBuildings] = useState<any[]>([]);
  const [buildingId, setBuildingId] = useState<any>("");

  // ── فلاتر المستودع (buildingTypeId == 1) ──
  const [cats, setCats] = useState<any[]>([]);
  const [CategoryId, setCategoryId] = useState<any>("");
  const [AssetType, setAssetType] = useState<any[]>([]);
  const [AssetTypeId, setAssetTypeId] = useState<any>("");
  const [Models, setModels] = useState<any[]>([]);
  const [modelId, setModelId] = useState<any>("");

  // ── فلاتر غير المستودع ──
  const [floors, setFloors] = useState<any[]>([]);
  const [floorId, setFloorId] = useState<any>("");
  const [suites, setSuites] = useState<any[]>([]);
  const [suiteId, setSuiteId] = useState<any>("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<any>("");

  // ── فلتر حالة الأصل (مستقل) ──
  const [statuses, setStatuses] = useState<any[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<any>("");

  // ── رفع الصور ──
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [imageUploadAssetId, setImageUploadAssetId] = useState<number | null>(null);

  // ── إعادة التسكين ──
  const [relocationOpen, setRelocationOpen] = useState(false);
  const [relocationAsset, setRelocationAsset] = useState<any | null>(null);

  // هل الـ building type المختار هو مستودع؟
  const isWarehouseType = selectedBuildingTypeId === WAREHOUSE_BUILDING_TYPE_ID;

  // ── تحديد الـ API query parameters بناءً على نوع المبنى ──
  const buildApiParams = () => {
    const base = `isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}`;
    if (isWarehouseType) {
      return `${base}&buildingId=${buildingId || 0}&CategoryId=${CategoryId || 0}&AssetTypeId=${AssetTypeId || 0}&ModelId=${modelId || 0}&StatusId=${selectedStatusId || 0}`;
    } else {
      return `${base}&buildingId=${buildingId || 0}&universityFloorId=${floorId || 0}&suiteId=${suiteId || 0}&roomId=${roomId || 0}&StatusId=${selectedStatusId || 0}`;
    }
  };


  const [mosandaList, setMosandaList] = useState<any[]>([]);
  const [correctionLoading, setCorrectionLoading] = useState(false);



  const [correctionModelName, setCorrectionModelName] = useState<string>("");
  const [correctionMosandaId, setCorrectionMosandaId] = useState<number | undefined>(undefined);




  const [openModelOdoo, setOpenModelOdoo] = useState(false);
  const [assetsId, setassetsId] = useState<number | any>(undefined);

  useEffect(() => {
    fetchAllModels()
  }, [])
  const fetchAllModels = async () => {
    const [mosandaResp] = await Promise.all([
      getFromApi(`AssetModel/get-odooAssets-ddl`),
    ]);

    setMosandaList(mosandaResp || []);

  };
  const onCloseModelOdoo = () => {
    setOpenModelOdoo(false)
    setassetsId(undefined)

  }
  const handleUpdateRow = (roomAssets: any) => {
    console.log("🚀 ~ handleUpdateRow ~ roomAssets:", roomAssets)
    setassetsId(roomAssets)
    setOpenModelOdoo(true)
    // setCorrectionMosandaId(roomAssets?.)
  }
  const handleSaveCorrection = async () => {
    if (!correctionMosandaId) {
      Store.addNotification({
        title: "تنبيه",
        message: "برجاء اختيار موديل اودو",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    try {
      setCorrectionLoading(true);
      console.log("🚀 ~ handleSaveCorrection ~ correctionMosandaId:", correctionMosandaId, selectedRowKeys.map((item: any) => item))
      if (selectedRowKeys.length === 0) {
        const value = {
          AssetId: [assetsId?.UniversityAssetId],
          odooId: correctionMosandaId
        }
        await putToApi(`UniversityAsset/update-Asset-odooId`, value);
        setSelectedRowKeys([])
      }
      if (selectedRowKeys.length > 0) {
        const value = {
          AssetId: selectedRowKeys.map((item: any) => item),
          odooId: correctionMosandaId
        }
        await putToApi(`UniversityAsset/update-Asset-odooId`, value);
        setSelectedRowKeys([])
      }


      Store.addNotification({
        title: "تم بنجاح",
        message: "تم أضافه الأصل لموديل اودو بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      getAllData()
      // fetchRoomAssets(room?.RoomId || 0);
      onCloseModelOdoo();
      setCorrectionMosandaId(undefined);
    } catch (error) {
      Store.addNotification({
        title: "خطأ",
        message: "حدث خطأ أثناء حفظ التصحيح",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } finally {
      setCorrectionLoading(false);
    }
  }
  // helper — يضمن إن الـ response دايماً array
  const toArray = (res: any): any[] => (Array.isArray(res) ? res : []);

  // ── جلب أنواع المباني عند التحميل ──
  useEffect(() => {
    setkeyword("");
    const fetchBuildingTypes = async () => {
      try {
        const res = await getFromApi("BuildingType/get-buildingType-ddl");
        setBuildingTypes(toArray(res));
      } catch (error) { setBuildingTypes([]); }
    };
    fetchBuildingTypes();
  }, []);


  // ── جلب حالات الأصل عند التحميل (مستقل) ──
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await getFromApi("Status/get-statuses-ddl");
        setStatuses(toArray(res));
      } catch (error) { setStatuses([]); }
    };
    fetchStatuses();
  }, []);

  // ── جلب المباني عند تغيير نوع المبنى ──
  useEffect(() => {
    setModelFilter(null);
    setBuildingId("");
    setCategoryId(""); setAssetTypeId(""); setModelId("");
    setFloorId(""); setSuiteId(""); setRoomId("");
    setFloors([]); setSuites([]); setRooms([]);

    if (!selectedBuildingTypeId) {
      setBuildings([]);
      return;
    }
    const fetchBuildings = async () => {
      try {
        const res = await getFromApi(
          `Building/get-building-ddl?buildingTypeId=${selectedBuildingTypeId}`
        );
        setBuildings(toArray(res));
      } catch (error) { setBuildings([]); }
    };
    fetchBuildings();
  }, [selectedBuildingTypeId]);

  // ── جلب التصنيفات (مستودع فقط) عند تغيير المبنى ──
  useEffect(() => {
    setModelFilter(null);
    if (!isWarehouseType || !buildingId) {
      setCats([]);
      setCategoryId(""); setAssetTypeId(""); setModelId("");
      return;
    }
    const fetchCats = async () => {
      try {
        const res = await getFromApi(
          `Category/get-category-ddl?BuildingTypeId=${selectedBuildingTypeId}`
        );
        setCats(toArray(res));
      } catch (error) { setCats([]); }
    };
    fetchCats();
  }, [buildingId, isWarehouseType]);

  // ── جلب أنواع الأصول (مستودع فقط) عند تغيير التصنيف ──
  useEffect(() => {
    setModelFilter(null);
    if (!CategoryId) {
      setAssetType([]); setAssetTypeId(""); setModelId("");
      return;
    }
    const fetchAssetTypes = async () => {
      try {
        const res = await getFromApi(
          `AssetType/get-assetType-ddl-byCategoryId?CategoryId=${CategoryId}&hasModels=true`
        );
        setAssetType(toArray(res));
      } catch (error) { setAssetType([]); }
    };
    fetchAssetTypes();
  }, [CategoryId]);

  // ── جلب الموديلات (مستودع فقط) عند تغيير نوع الأصل ──
  useEffect(() => {
    setModelFilter(null);
    const fetchModels = async () => {
      try {
        const res = await getFromApi(
          `AssetModel/get-assetModel-by-assetTypeId?assetTypeId=${AssetTypeId || ""}`
        );
        setModels(toArray(res));
      } catch (error) { setModels([]); }
    };
    fetchModels();
  }, [AssetTypeId]);

  // ── جلب الأدوار (غير مستودع) عند تغيير المبنى ──
  useEffect(() => {
    setModelFilter(null);
    if (isWarehouseType || !buildingId) {
      setFloors([]); setFloorId(""); setSuites([]); setSuiteId(""); setRooms([]); setRoomId("");
      return;
    }
    const fetchFloors = async () => {
      try {
        const res = await getFromApi(
          `UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId}`
        );
        const floorData = res?.Data ?? res;
        setFloors(toArray(floorData));
      } catch (error) { setFloors([]); }
    };
    fetchFloors();
  }, [buildingId, isWarehouseType]);

  // ── جلب الأجنحة عند تغيير الدور ──
  useEffect(() => {
    setModelFilter(null);
    setSuiteId(""); setRooms([]); setRoomId("");
    if (!floorId) { setSuites([]); return; }
    const fetchSuites = async () => {
      try {
        const res = await getFromApi(
          `Suite/get-suite-ddl?floorId=${floorId}`
        );
        const suiteData = res?.Data ?? res;
        setSuites(toArray(suiteData));
      } catch (error) { setSuites([]); }
    };
    fetchSuites();
  }, [floorId]);

  // ── جلب الغرف عند تغيير الجناح ──
  useEffect(() => {
    setModelFilter(null);
    setRoomId("");
    if (!suiteId) { setRooms([]); return; }
    const fetchRooms = async () => {
      try {
        const res = await getFromApi(
          `Room/get-room-ddl-by-SuiteId?suiteId=${suiteId}`
        );
        const roomData = res?.Data ?? res;
        setRooms(toArray(roomData));
      } catch (error) { setRooms([]); }
    };
    fetchRooms();
  }, [suiteId]);

  // ── modelFilter من صفحات أخرى ──
  useEffect(() => {
    if (modelFilter != null) {
      setAssetTypeId(modelFilter.AssetTypeId);
      setCategoryId(modelFilter.CategoryId);
      setBuildingId(1);
      setModelId(modelFilter.AssetModelId);
    }
    return () => { setModelFilter(null); };
  }, [modelFilter]);

  // ── جلب البيانات الرئيسية ──
  const getAllData = async () => {
    try {
      const resp = await getFromApi(
        `UniversityAsset/get-all-universityAsset-pager?${buildApiParams()}`
      );
      setRowData(resp);
    } catch (error) { }
  };
  useEffect(() => {
    getAllData();
  }, [
    pageNumber, pageSize, keyword, detectChanges,
    buildingId, CategoryId, AssetTypeId, modelId,
    floorId, suiteId, roomId, selectedStatusId,
    selectedBuildingTypeId,
  ]);

  // ── Handlers ──
  const handleEditMod = async (TableId) => {
    try {
      const response = await getFromApi(
        `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
      );
      if (response) { setToEdit(response); setOpenFormModel(true); }
    } catch (error) { }
  };

  const handleDamaged = async (assetId: number) => {
    try {
      setLoading(true);
      const response = await putToApi(
        `UniversityAsset/damaged-universityAsset?universityAssetId=${assetId}`,
        {}
      );
      if (response) {
        setdetectChanges((prev) => prev + 1);
        Store.addNotification({
          title: "", message: "تم تحديد الأصل كتالف",
          type: "success", insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
      }
    } catch (error) {
      Store.addNotification({
        title: "", message: "حدث خطأ، حاول مرة أخرى",
        type: "danger", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModelPopUp = async (TableId) => {
    try {
      const response = await getFromApi(
        `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
      );
      if (response) { setToEdit(response); setOpenFormModelAddingModel(true); }
    } catch (error) { }
  };

  const handleDelete = async (TableId) => {
    try {
      setLoading(true);
      await deleteFromApi(`UniversityAsset/delete-universityAsset?universityAssetId=${TableId}`);
      setdetectChanges((prevState) => prevState + 1);
      Store.addNotification({
        title: "", message: "تم الحذف بنجاح", type: "success",
        insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      setLoading(false);
    } catch (error) {
      Store.addNotification({
        title: "", message: "Try again", type: "danger",
        insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      setLoading(false);
    }
  };

  const handlePrintMod = async (TableId) => {
    try {
      setLoading(true);
      const response = await postToApi(`RFID/print-rfid`, { AssetId: TableId });
      if (response != null) {
        setdetectChanges((prevState) => prevState + 1);
        Store.addNotification({
          title: "", message: response.Item2,
          type: !response.Item1 ? "danger" : "success",
          insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
        setLoading(false);
      } else {
        Store.addNotification({
          title: "", message: "Try again", type: "danger",
          insert: "top", container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      Store.addNotification({
        title: "", message: "Try again", type: "danger",
        insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    }
  };

  const handleOpenImageUpload = (assetId: number) => {
    setImageUploadAssetId(assetId);
    setImageUploadOpen(true);
  };

  const handleCloseImageUpload = () => {
    setImageUploadOpen(false);
    setImageUploadAssetId(null);
  };

  const handleOpenRelocation = (record: any) => {
    setRelocationAsset(record);
    setRelocationOpen(true);
  };

  const handleCloseRelocation = () => {
    setRelocationOpen(false);
    setRelocationAsset(null);
  };

  const handleCloseFormModel = () => {
    setOpenFormModel(false);
    setToEdit(null);
  };

  const handleSearch = (e: any) => { setkeyword(e.target.value); };
  const handleshowPage = (e: any) => { setPageSize(e); };

  const exportToExcel = () => {
    const selectedColumns = columns.slice(1, -1);
    const newResult: any[] = [];
    rowData?.Results.forEach((element) => {
      let newObject: any = {};
      selectedColumns.forEach((col: any) => { newObject[col.title] = element[col.dataIndex]; });
      newResult.push(newObject);
    });
    const worksheet = XLSX.utils.json_to_sheet(newResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), "Assets.xlsx");
  };

  const exportToCSV = () => {
    const selectedColumns = columns.slice(1, -1);
    const csvHeader = selectedColumns.map((col: any) => `"${col.title.replace(/"/g, '""')}"`).join(",") + "\n";
    const csvRows = rowData?.Results.map((row: any) =>
      selectedColumns.map((col: any) => {
        const cell = row[col.dataIndex];
        const cellStr = typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
        return `"${cellStr}"`;
      }).join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Assets.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── أعمدة الجدول ──
  const columns = [
    {
      title: "#",
      key: "index",
      render: (item, record, index) => <>{index + 1}</>,
      width: 40,
    },
    { title: "الأصل", dataIndex: "UniversityAssetName", key: "UniversityAssetName", ellipsis: true, width: isMobile ? 140 : 140 },
    { title: "موديل الأصل", dataIndex: "ModelName", key: "ModelName", ellipsis: true, width: 100 },
    { title: "رقم الموديل", dataIndex: "ModelNumber", key: "ModelNumber", width: 100 },
    { title: "البراند", dataIndex: "Brand", key: "Brand", width: 100 },
    { title: "نوع مبنى الأصول", dataIndex: "BuildingTypeName", key: "BuildingTypeName", width: 100 },
    { title: "المبنى", dataIndex: "BuildingName", key: "BuildingName", width: 100, responsive: ["lg"] as any },
    { title: "تصنيف الاصل", dataIndex: "CategoryName", key: "CategoryName", width: 100, responsive: ["lg"] as any },
    {
      title: "صورة الموديل",
      dataIndex: "ModelImagePath",
      key: "ModelImagePath",
      width: 100,
      render: (imagePath: string) => {
        if (!imagePath || imagePath.trim() === "") {
          return <span style={{ color: "#bbb" }}>—</span>;
        }
        return (
          <Image
            src={imagePath}
            alt="model"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: "6px", border: "1px solid #eee", cursor: "pointer" }}
            preview={{ mask: <PictureOutlined style={{ fontSize: 18 }} /> }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXMzMyWqznOAAAAC0lEQVR4nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII="
          />
        );
      },
    },
    { title: "باركود الأصل", dataIndex: "AssetBarcode", key: "AssetBarcode", ellipsis: true, width: isMobile ? 160 : 160 },
    { title: "Serial Number", dataIndex: "AssetSerialNo", key: "AssetSerialNo", ellipsis: true, width: 160 },
    { title: "حالة الاصل", dataIndex: "AssetStatus", key: "AssetStatus", ellipsis: true, width: 160 },
    { title: "طباعه", dataIndex: "PrintedNumber", key: "PrintedNumber", width: 60, responsive: ["sm"] as any },
    {
      title: "موديل",
      dataIndex: "AssetTypeId",
      key: "AssetTypeId",
      width: 60,
      render: (_, value) => value.AssetModelId != null
        ? <CheckCircleFilled style={{ color: "#52c41a" }} />
        : <CloseCircleFilled style={{ color: "red" }} />,
    },

    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      width: isMobile ? 100 : 160,
      fixed: "right" as const,
      render: (_, record) => (
        <div className="act-btns">
          {/* {user.user.Permissions.includes("EditUniversityAssets") && (
            <Tooltip title="تعديل">
              <Button onClick={() => handleEditMod(record.UniversityAssetId)} icon={<EditOutlined />} shape="circle" size={isMobile ? "small" : "middle"} />
            </Tooltip>
          )}
          
          user.user.Permissions.includes("SetOdooIdUniversityAssets") &&
          */}
          {
            (record?.OdooId === null || record?.OdooId === undefined || record?.OdooId === 0) &&
            <div>
              <Tooltip title="ربط الاصل بموديل Odoo">
                <Button
                  shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={() => handleUpdateRow(record)}
                />
              </Tooltip>
            </div>
          }
          {user.user.Permissions.includes("EditUniversityAssets") &&
            record.BuildingId !== 1 && (
              <Tooltip title="إعادة تسكين">
                <Button
                  onClick={() => handleOpenRelocation(record)}
                  icon={<SwapOutlined />}
                  shape="circle"
                  size={isMobile ? "small" : "middle"}
                  style={{ color: "#722ed1" }}
                />
              </Tooltip>
            )}
          {user.user.Permissions.includes("EditUniversityAssets") && record.AssetModelId == null && (
            <Tooltip title="أضافه موديل">
              <Button onClick={() => handleModelPopUp(record.UniversityAssetId)} icon={<SettingFilled />} shape="circle" size={isMobile ? "small" : "middle"} />
            </Tooltip>
          )}
          {user.user.Permissions.includes("PrintRFIDUniversityAssets") && (
            <Tooltip title="طباعه الباركود">
              <Button onClick={() => handlePrintMod(record.UniversityAssetId)} icon={<PrinterOutlined />} shape="circle" size={isMobile ? "small" : "middle"} />
            </Tooltip>
          )}
          {user.user.Permissions.includes("EditUniversityAssets") && (
            <Tooltip title="رفع صور اللواصق">
              <Button onClick={() => handleOpenImageUpload(record.UniversityAssetId)} icon={<CameraOutlined />} shape="circle" size={isMobile ? "small" : "middle"} style={{ color: "#1890ff" }} />
            </Tooltip>
          )}
          {user.user.Permissions.includes("EditUniversityAssets") && (
            <Tooltip title="تالف">
              <Popconfirm title="هل أنت متأكد من تحديد هذا الأصل كتالف؟" onConfirm={() => handleDamaged(record.UniversityAssetId)} okText="نعم" cancelText="لا">
                <Button icon={<WarningOutlined />} shape="circle" size={isMobile ? "small" : "middle"} danger />
              </Popconfirm>
            </Tooltip>
          )}

        </div>
      ),
    },
  ];

  return (
    <div className="custom-container">
      <h5 style={{ textAlign: "center", marginBottom: "16px" }}>اصول المستودع</h5>

      {/* ── شريط الأزرار العلوي ── */}
      <div className="assets-top-bar">
        {user.user.Permissions.includes("AddUniversityAssets") && (
          <Button type="primary" onClick={() => setOpenFormModel(true)} icon={<PlusOutlined />}>
            إضافة جديد
          </Button>
        )}
        <div className="assets-export-btns">
          <Button onClick={exportToExcel}>Export Excel</Button>
          <Button onClick={exportToCSV}>Export CSV</Button>
        </div>
      </div>

      {/* ── الفلاتر ── */}
      <div className="assets-filters-wrapper">

        {/* بحث */}
        <Input
          placeholder="ابحث بالاسم او الباركود"
          onChange={handleSearch}
          allowClear
          style={{ flex: isMobile ? "unset" : "1 1 160px", width: isMobile ? "100%" : undefined }}
        />

        {/* نوع المبنى — أول dropdown */}
        <Select
          allowClear
          placeholder="نوع المبنى"
          value={selectedBuildingTypeId || undefined}
          onChange={(val) => {
            setSelectedBuildingTypeId(val ?? "");
          }}
          style={{ width: isMobile ? "100%" : 180 }}
        >
          {buildingTypes.map((bt) => (
            <Option key={bt.BuildingTypeId} value={bt.BuildingTypeId}>
              {bt.BuildingTypeName}
            </Option>
          ))}
        </Select>

        {/* المبنى — يظهر بعد اختيار نوع المبنى */}
        {selectedBuildingTypeId !== "" && (
          <Select
            allowClear
            placeholder="اختر المبني"
            value={buildingId || undefined}
            onChange={(val) => {
              setBuildingId(val ?? "");
              setCategoryId(""); setAssetTypeId(""); setModelId("");
              setFloorId(""); setSuiteId(""); setRoomId("");
            }}
            style={{ width: isMobile ? "100%" : 400 }}
          >
            {buildings.map((b) => (
              <Option key={b.BuildingId} value={b.BuildingId}>
                {b.BuildingName} - {b.BuildingCode}
              </Option>
            ))}
          </Select>
        )}

        {/* ── فلاتر المستودع (buildingTypeId == 1) ── */}
        {isWarehouseType && buildingId && (
          <>
            <Select
              allowClear
              placeholder="اختر نوع الاصل"
              onChange={(val) => { setCategoryId(val ?? ""); setAssetTypeId(""); setModelId(""); }}
              value={CategoryId || undefined}
              style={{ width: isMobile ? "100%" : 200 }}
            >
              {cats.map((c) => (
                <Option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</Option>
              ))}
            </Select>

            <Select
              allowClear
              placeholder="اختر تصنيف الاصل"
              value={AssetTypeId || undefined}
              onChange={(val) => { setAssetTypeId(val ?? ""); setModelId(""); }}
              style={{ width: isMobile ? "100%" : 200 }}
            >
              {AssetType.map((at) => (
                <Option key={at.AssetTypeId} value={at.AssetTypeId}>{at.AssetTypeName}</Option>
              ))}
            </Select>

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
              style={{ width: isMobile ? "100%" : 380 }}
              options={Models.map((m) => ({
                value: m.AssetModelId,
                label: `${m.Brand ?? ""} - ${m.ModelName ?? ""} - ${m.ModelNumber ?? ""} - عدد ${m.AssetTotalCount ?? 0} قطعه`,
              }))}
            />
          </>
        )}

        {/* ── فلاتر غير المستودع ── */}
        {!isWarehouseType && selectedBuildingTypeId !== "" && buildingId && (
          <>
            <Select
              allowClear
              placeholder="اختر الدور"
              value={floorId || undefined}
              onChange={(val) => { setFloorId(val ?? ""); setSuiteId(""); setRoomId(""); }}
              style={{ width: isMobile ? "100%" : 180 }}
            >
              {floors.map((f) => (
                <Option key={f.UniversityFloorId} value={f.UniversityFloorId}>
                  {f.UniversityFloorName}
                </Option>
              ))}
            </Select>

            {floorId && (
              <Select
                allowClear
                placeholder="اختر الجناح"
                value={suiteId || undefined}
                onChange={(val) => { setSuiteId(val ?? ""); setRoomId(""); }}
                style={{ width: isMobile ? "100%" : 180 }}
              >
                {suites.map((s) => (
                  <Option key={s.SuiteId} value={s.SuiteId}>
                    {s.SuiteNameAr}
                  </Option>
                ))}
              </Select>
            )}

            {suiteId && (
              <Select
                allowClear
                placeholder="اختر الغرفة"
                value={roomId || undefined}
                onChange={(val) => setRoomId(val ?? "")}
                style={{ width: isMobile ? "100%" : 180 }}
              >
                {rooms.map((r) => (
                  <Option key={r.RoomId} value={r.RoomId}>
                    {r.RoomName}
                  </Option>
                ))}
              </Select>
            )}
          </>
        )}

        {/* ── حالة الأصل — فلتر مستقل ── */}
        <Select
          allowClear
          placeholder="حالة الأصل"
          value={selectedStatusId || undefined}
          onChange={(val) => setSelectedStatusId(val ?? "")}
          style={{ width: isMobile ? "100%" : 180 }}
        >
          {statuses.map((s) => (
            <Option key={s.StatusId} value={s.StatusId}>
              {s.StatusNameAr}
            </Option>
          ))}
        </Select>

        {/* عدد السجلات */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <div className="assets-page-size">
            <span>عرض</span>
            <Select
              defaultValue={"50"}
              onChange={handleshowPage}
              style={{ width: isMobile ? 80 : 80 }}
            >
              <Option value="10">10</Option>
              <Option value="20">20</Option>
              <Option value="50">50</Option>
              <Option value="100">100</Option>
              <Option value="200">200</Option>
            </Select>
          </div>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <div >

              عدد الأصول: {rowData?.RowCount}
            </div>
            <div>
              {selectedRowKeys.length > 0 && (
                <Button
                  // shape="circle"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setOpenModelOdoo(true);
                  }}
                >
                  ربط الاصول ب Odoo
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── الجدول ── */}
      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={rowData?.Results}
          pagination={false}
          loading={loading}
          scroll={{ x: isMobile ? 500 : 1200 }}
          size={isMobile ? "small" : "middle"}
          rowKey="UniversityAssetId"
          rowClassName={(record) => {
          console.log("🚀 ~ UniversityAssetsPage ~ record:", record.OdooId)

            return (record.OdooId > 0 ? 'hide-row-selection' : '')
          }}

          rowSelection={
            true
              ? {
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                // الـ checkbox يبقى ثابت لما نـ scroll
                fixed: true,
              }
              : undefined
          }
        />
      </div>

      <Pagination
        pageSize={pageSize}
        style={{ justifyContent: "center", display: "flex", marginTop: "16px", flexWrap: "wrap" }}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        onChange={(page, ps) => { setPageNumber(page); setPageSize(ps); }}
        total={rowData?.PageCount ? rowData.PageCount * rowData.PageSize : 1}
        current={pageNumber}
        size={isMobile ? "small" : "default"}
        simple={isMobile}
      />

      <Modal
        open={openModelOdoo}
        onCancel={onCloseModelOdoo}
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
        footer={[
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>

            <Button key="cancel" onClick={onCloseModelOdoo} disabled={correctionLoading}>
              إلغاء
            </Button>,
            <Button
              key="save"
              type="primary"
              loading={correctionLoading}
              onClick={handleSaveCorrection}
            >
              أضافه الاصل لموديل اودو
            </Button>
          </div>,
        ]}
        title={
          <div>
            <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
              أضافه الاصل لموديل Odoo
            </span>

          </div>
        }
        destroyOnClose
        centered={!isMobile}
      >
        <Form.Item
          label={
            <span style={{ fontWeight: 600 }}>
              الموديل المرجعي (Odoo Models)
              {/* <span style={{ color: "#888", fontSize: "12px", marginRight: "6px" }}>(اختياري)</span> */}
            </span>
          }
          extra={
            <span style={{ color: "#888", fontSize: "12px" }}>
              ابحث في القائمة واختر الموديل المطابق إن وجد
            </span>
          }
        >
          <AntSelect
            showSearch
            allowClear
            placeholder="ابحث واختر الموديل المرجعي..."
            value={correctionMosandaId}
            onChange={(value) => {
              setCorrectionMosandaId(value);
              // ============ NEW: تحديث اسم الموديل تلقائياً ============
              if (value) {
                const selected = mosandaList.find(
                  (item: any) => item.MosandaOdooAssetId === value
                );
                if (selected) {
                  setCorrectionModelName(selected.MosandaOdooAssetModelName);
                }
              }
              // =========================================================
            }}
            loading={correctionLoading}
            filterOption={(input, option) => {
              const text = (option?.label as string) || "";
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            optionFilterProp="label"
            optionLabelProp="label"   // ← مهم: عشان لما يتختار يظهر الـ label فقط
            style={{ width: "100%" }}
          >
            {mosandaList?.map((item: any) => (
              <Option
                key={item.MosandaOdooAssetId}
                value={item.MosandaOdooAssetId}
                label={item.MosandaOdooAssetModelName}  // ← يظهر ده فقط بعد الاختيار
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 500 }}>{item.MosandaOdooAssetModelName}</span>
                  <span style={{ fontSize: "11px", color: "#888" }}>
                    {item.MosandaOdooAssetCategoryName}
                  </span>
                </div>
              </Option>
            ))}
          </AntSelect>
        </Form.Item>
      </Modal>

      {/* ── Modal الإضافة/التعديل ── */}
      {openFormModel && (
        <Modal
          width={isMobile ? "95%" : "52%"}
          style={{ top: isMobile ? 10 : undefined, maxWidth: 800 }}
          open={openFormModel}
          title={toEdit ? "تعديل اصل موجود" : "اضافة أصل جديد"}
          footer={false}
          onCancel={handleCloseFormModel}
        >
          <UniversityAssetsForm />
        </Modal>
      )}

      {/* ── Modal إضافة موديل ── */}
      {openFormModelAddingModel && (
        <Modal
          width={isMobile ? "95%" : "52%"}
          style={{ top: isMobile ? 10 : undefined, maxWidth: 800 }}
          open={openFormModelAddingModel}
          title="اضافه موديل للاصل"
          footer={false}
          onCancel={() => { setOpenFormModelAddingModel(false); setToEdit(null); }}
        >
          <UniversityModelForm />
        </Modal>
      )}

      {/* ── Modal رفع الصور ── */}
      {imageUploadAssetId && (
        <AssetImageUploadModal
          assetId={imageUploadAssetId}
          open={imageUploadOpen}
          onClose={handleCloseImageUpload}
          onSuccess={() => setdetectChanges((prev) => prev + 1)}
        />
      )}

      {/* ── Modal إعادة التسكين ── */}
      <AssetRelocationModal
        open={relocationOpen}
        onClose={handleCloseRelocation}
        onSuccess={() => setdetectChanges((prev) => prev + 1)}
        asset={relocationAsset}
      />
    </div>
  );
};

export default UniversityAssetsPage;