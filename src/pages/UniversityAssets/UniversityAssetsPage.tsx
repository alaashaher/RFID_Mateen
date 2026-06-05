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
  DeleteOutlined as DeleteIcon,WarningOutlined,
} from "@ant-design/icons";
import { deleteFromApi, getFromApi, postToApi, putToApi } from "../../apis/apis";
import {
  Button,
  Pagination,
  Table,
  Tooltip,
  Popconfirm,
  Modal,
  Tabs,
  Flex,
  Input,
  Select,
  Upload,
  message,
  Spin,
} from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import UniversityAssetsForm from "./UniversityAssetsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import UniversityAssetsScannedContext from "../../contexts/pages-context/UniversityAssetsProviderScanned";
import UniversityAssetsContext from "../../contexts/pages-context/UniversityAssetsProvider";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import UniversityModelForm from "./UniversityModelForm";
import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import { use } from "i18next";
import "./UniversityAssets.css";

// ============================
// Responsive helper — عرض الشاشة
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
  onSuccess: () => void;  // ← أضف هذا
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
        "https://rfidrajhiapi.sirumaps.net/api/UniversityAsset/upload-asset-images",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
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
          <Button key="cancel" onClick={onClose} disabled={uploading}>
            إلغاء
          </Button>,
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
const UniversityAssetsPage = () => {
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
  const [buildings, setBuildings] = useState<any>([]);
  const [buildingId, setBuildingId] = useState<any>("");
  const [floors, setFloor] = useState<any>([]);
  const [floorId, setFloorId] = useState<any>("");
  const [rooms, setRooms] = useState([]);
  const [cats, setCats] = useState([]);
  const [AssetType, setAssetType] = useState([]);
  const [CategoryId, setCategoryId] = useState<any>("");
  const [AssetTypeId, setAssetTypeId] = useState<any>("");
  const [Models, setModels] = useState([]);
  const [modelId, setModelId] = useState<any>("");

  // State لرفع الصور
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [imageUploadAssetId, setImageUploadAssetId] = useState<number | null>(null);

  useEffect(() => {
    if (modelFilter != null) {
      setAssetTypeId(modelFilter.AssetTypeId);
      setCategoryId(modelFilter.CategoryId);
      setBuildingId(1);
      setModelId(modelFilter.AssetModelId);
    }
    return () => { setModelFilter(null); };
  }, [modelFilter]);

  useEffect(() => {
    setModelFilter(null);
    const fetchLanguages = async () => {
      try {
        const res = await getFromApi(
          `AssetModel/get-assetModel-by-assetTypeId?assetTypeId=${AssetTypeId ? AssetTypeId : ""}`
        );
        setModels(res);
      } catch (error) {}
    };
    fetchLanguages();
  }, [AssetTypeId]);

  useEffect(() => {
    setkeyword("");
    const fetchLanguages = async () => {
      try {
        const res = await getFromApi(`Building/get-building-ddl`);
        setBuildings(res);
      } catch (error) {}
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    setModelFilter(null);
    if (floorId != "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(`Room/get-room-ddl?floorId=${floorId ? floorId : ""}`);
          setRooms(resp);
        } catch (error) {}
      };
      getAllData();
    }
  }, [floorId]);

  useEffect(() => {
    setModelFilter(null);
    const fetchLanguages = async () => {
      try {
        const hasmode = true;
        const res = await getFromApi(
          `AssetType/get-assetType-ddl-byCategoryId?CategoryId=${CategoryId ? CategoryId : ""}&hasModels=${hasmode}`
        );
        setAssetType(res);
      } catch (error) {}
    };
    fetchLanguages();
  }, [CategoryId]);

  useEffect(() => {
    setModelFilter(null);
    const fetchCats = async () => {
      try {
        const res = await getFromApi(
          `Category/get-category-ddl?BuildingTypeId=${buildingId ? buildingId : ""}`
        );
        setCats(res);
      } catch (error) {}
    };
    fetchCats();
  }, [buildingId]);

  useEffect(() => {
    setModelFilter(null);
    if (buildingId != "") {
      const fetchLanguages = async () => {
        try {
          const res = await getFromApi(
            `UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId ? buildingId : ""}`
          );
          setFloor(res);
        } catch (error) {}
      };
      fetchLanguages();
    }
  }, [buildingId]);

  useEffect(() => {
    if (modelFilter != null) {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&&buildingId=${modelFilter?.buildingId ? modelFilter.buildingId : 0}&AssetTypeId=${modelFilter?.AssetTypeId ? modelFilter.AssetTypeId : 0}&ModelId=${modelFilter?.AssetModelId ? modelFilter.AssetModelId : 0}&CategoryId=${modelFilter?.CategoryId ? modelFilter.CategoryId : 0}`
          );
          setRowData(resp);
        } catch (error) {}
      };
      getAllData();
    }
  }, [pageNumber, pageSize, keyword, detectChanges]);

  useEffect(() => {
    if (modelFilter == null) {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&&buildingId=${buildingId ? buildingId : 0}&AssetTypeId=${AssetTypeId ? AssetTypeId : 0}&ModelId=${modelId ? modelId : 0}&CategoryId=${CategoryId ? CategoryId : 0}`
          );
          setRowData(resp);
        } catch (error) {}
      };
      getAllData();
    }
  }, [pageNumber, pageSize, keyword, detectChanges, buildingId, AssetTypeId, modelId, CategoryId]);

  const handleEditMod = async (TableId) => {
    try {
      const response = await getFromApi(
        `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
      );
      if (response) { setToEdit(response); setOpenFormModel(true); }
    } catch (error) {}
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
    } catch (error) {}
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

  // === الأعمدة — على الموبايل نخفي بعض الأعمدة الأقل أهمية ===
  const columns = [
    {
      title: "#",
      key: "index",
      render: (item, record, index) => <>{index + 1}</>,
      width: 40,
      fixed: isMobile ? undefined : undefined,
    },
    {
      title: "الأصل",
      dataIndex: "UniversityAssetName",
      key: "UniversityAssetName",
      ellipsis: true,
      width: isMobile ? 140 : 140,
    },
    {
      title: "موديل الأصل",
      dataIndex: "ModelName",
      key: "ModelName",
      ellipsis: true,
      width: isMobile ? 100 : 100,
      //responsive: ["md"] as any,
    },
    {
      title: "رقم الموديل",
      dataIndex: "ModelNumber",
      key: "ModelNumber",
      width: isMobile ? 100 : 100,
      //responsive: ["lg"] as any,
    },
    {
      title: "البراند",
      dataIndex: "Brand",
      key: "Brand",
      width: isMobile ? 100 : 100,
      //responsive: ["md"] as any,
    },
    {
      title: "نوع مبنى الأصول",
      dataIndex: "BuildingTypeName",
      key: "BuildingTypeName",
      responsive: ["xl"] as any,
    },
    {
      title: "المبنى",
      dataIndex: "BuildingName",
      key: "BuildingName",
      responsive: ["lg"] as any,
    },
    {
      title: "تصنيف الاصل",
      dataIndex: "CategoryName",
      key: "CategoryName",
      responsive: ["lg"] as any,
    },
    {
      title: "باركود الأصل",
      dataIndex: "AssetBarcode",
      key: "AssetBarcode",
      ellipsis: true,
      width: isMobile ? 160 : 160,
      //responsive: ["md"] as any,
    },
    {
      title: "Serial Number",
      dataIndex: "AssetSerialNo",
      key: "AssetSerialNo",
      ellipsis: true,
      width: isMobile ? 160 : 160,
      //responsive: ["lg"] as any,
    },
    {
      title: "حالة الاصل",
      dataIndex: "AssetStatus",
      key: "AssetStatus",
      ellipsis: true,
      width: isMobile ? 160 : 160,
      //responsive: ["lg"] as any,
    },
    {
      title: "طباعه",
      dataIndex: "PrintedNumber",
      key: "PrintedNumber",
      width: 60,
      responsive: ["sm"] as any,
    },
    {
      title: "موديل",
      dataIndex: "AssetTypeId",
      key: "AssetTypeId",
      width: 60,
      render: (_, value) => {
        return value.AssetModelId != null ? (
          <CheckCircleFilled style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleFilled style={{ color: "red" }} />
        );
      },
    },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      width: isMobile ? 100 : 160,
      fixed: "right" as const,
      render: (_, record) => {
        return (
          <div className="act-btns">
            {user.user.Permissions.includes("EditUniversityAssets") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => handleEditMod(record.UniversityAssetId)}
                  icon={<EditOutlined />}
                  shape="circle"
                  size={isMobile ? "small" : "middle"}
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("EditUniversityAssets") &&
              record.AssetModelId == null && (
                <Tooltip title="أضافه موديل">
                  <Button
                    onClick={() => handleModelPopUp(record.UniversityAssetId)}
                    icon={<SettingFilled />}
                    shape="circle"
                    size={isMobile ? "small" : "middle"}
                  />
                </Tooltip>
              )}
            {user.user.Permissions.includes("PrintRFIDUniversityAssets") && (
              <Tooltip title="طباعه الباركود">
                <Button
                  onClick={() => handlePrintMod(record.UniversityAssetId)}
                  icon={<PrinterOutlined />}
                  shape="circle"
                  size={isMobile ? "small" : "middle"}
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("EditUniversityAssets") && (
              <Tooltip title="رفع صور اللواصق">
                <Button
                  onClick={() => handleOpenImageUpload(record.UniversityAssetId)}
                  icon={<CameraOutlined />}
                  shape="circle"
                  size={isMobile ? "small" : "middle"}
                  style={{ color: "#1890ff" }}
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("EditUniversityAssets") && (
  <Tooltip title="تالف">
    <Popconfirm
      title="هل أنت متأكد من تحديد هذا الأصل كتالف؟"
      onConfirm={() => handleDamaged(record.UniversityAssetId)}
      okText="نعم"
      cancelText="لا"
    >
      <Button
        icon={<WarningOutlined />}
        shape="circle"
        size={isMobile ? "small" : "middle"}
        danger
      />
    </Popconfirm>
  </Tooltip>
)}
          </div>
        );
      },
    },
  ];

  const handleCloseFormModel = () => {
    setOpenFormModel(false);
    setToEdit(null);
  };

  const handleSearch = (e: any) => {
    setkeyword(e.target.value);
  };

  const handleshowPage = (e: any) => {
    setPageSize(e);
  };

  const exportToExcel = () => {
    const selectedColumns = columns.slice(1, -1);
    const newResult = [];
    rowData?.Results.forEach((element, index) => {
      let newObject = {};
      selectedColumns.forEach((col) => {
        newObject[col.title] = element[col.dataIndex];
      });
      newResult.push(newObject);
    });
    const worksheet = XLSX.utils.json_to_sheet(newResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileName = "Assets.xlsx";
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };

  const exportToCSV = () => {
    const selectedColumns = columns.slice(1, -1);
    const csvHeader =
      selectedColumns.map((col) => `"${col.title.replace(/"/g, '""')}"`).join(",") + "\n";
    const csvRows = rowData?.Results.map((row) =>
      selectedColumns
        .map((col) => {
          const cell = row[col.dataIndex];
          const cellStr = typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
          return `"${cellStr}"`;
        })
        .join(",")
    ).join("\n");
    const BOM = "\uFEFF";
    const csvContent = BOM + csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Assets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="custom-container">
      <h5 style={{ textAlign: "center", marginBottom: "16px" }}>
        اصول المستودع
      </h5>

      {/* === شريط الأزرار العلوي === */}
      <div className="assets-top-bar">
        {user.user.Permissions.includes("AddUniversityAssets") && (
          <Button
            type="primary"
            onClick={() => setOpenFormModel(true)}
            icon={<PlusOutlined />}
          >
            إضافة جديد
          </Button>
        )}
        <div className="assets-export-btns">
          <Button onClick={exportToExcel}>Export Excel</Button>
          <Button onClick={exportToCSV}>Export CSV</Button>
        </div>
      </div>

      {/* === الفلاتر === */}
      <div className="assets-filters-wrapper">
        <Input
          type="text"
          placeholder=" ابحث بالاسم او الباركود"
          onChange={(e) => handleSearch(e)}
          allowClear
          style={{ flex: isMobile ? "unset" : "1 1 160px", width: isMobile ? "100%" : undefined }}
        />
        <Select
          allowClear
          placeholder="اختر المبني"
          value={buildingId || undefined}
          onChange={(e) => {
            setRooms([]);
            setBuildingId(e);
            setCategoryId("");
            setAssetTypeId("");
            setModelId("");
          }}
          style={{ width: isMobile ? "100%" : 200 }}
        >
          {buildings
            .filter((res) => res.BuildingTypeId == 1)
            .map((client) => (
              <Option key={client.BuildingId} value={client.BuildingId}>
                {client.BuildingName} - {client.BuildingCode}
              </Option>
            ))}
        </Select>
        <Select
          allowClear
          placeholder="اختر نوع الاصل"
          onChange={(e) => {
            setCategoryId(e);
            setAssetTypeId("");
            setModelId("");
          }}
          value={CategoryId || undefined}
          style={{ width: isMobile ? "100%" : 200 }}
        >
          {cats.map((client) => (
            <Option key={client.CategoryId} value={client.CategoryId}>
              {client.CategoryName}
            </Option>
          ))}
        </Select>
        <Select
          allowClear
          placeholder="اختر تصنيف الاصل"
          value={AssetTypeId || undefined}
          onChange={(e) => {
            setAssetTypeId(e);
            setModelId("");
          }}
          style={{ width: isMobile ? "100%" : 200 }}
        >
          {AssetType.map((client) => (
            <Option key={client.AssetTypeId} value={client.AssetTypeId}>
              {client.AssetTypeName}
            </Option>
          ))}
        </Select>
        {/* <Select
          allowClear
          showSearch
          placeholder="اختر موديل الاصل"
          value={modelId || undefined}
          onChange={setModelId}
          filterOption={(input, option) =>
    (option?.children as unknown as string)
      ?.toLowerCase()
      .includes(input.toLowerCase())
  }
          style={{ width: isMobile ? "100%" : 320 }}
        >
          {Models.map((client) => (
            <Option key={client.AssetModelId} value={client.AssetModelId}>
              {client.Brand} - {client.ModelName} - {client.ModelNumber} - عدد{" "}
              {client.AssetTotalCount} قطعه
            </Option>
          ))}
        </Select>
         */}
         <Select
  allowClear
  showSearch
  placeholder="اختر موديل الاصل"
  value={modelId || undefined}
  onChange={setModelId}
  optionFilterProp="label"
  filterOption={(input, option) =>
    String(option?.label ?? "")
      .toLowerCase()
      .includes(input.toLowerCase())
  }
  style={{ width: isMobile ? "100%" : 380 }}
  options={Models.map((client) => ({
    value: client.AssetModelId,
    label: `${client.Brand ?? ""} - ${client.ModelName ?? ""} - ${client.ModelNumber ?? ""} - عدد ${client.AssetTotalCount ?? 0} قطعه`,
  }))}
/>
        <div className="assets-page-size">
          <span>عرض</span>
          <Select
            defaultValue={"50"}
            onChange={(e) => handleshowPage(e)}
            style={{ width: isMobile ? 80 : 80 }}
          >
            <Option value="10">10</Option>
            <Option value="20">20</Option>
            <Option value="50">50</Option>
            <Option value="100">100</Option>
            <Option value="200">200</Option>
          </Select>
        </div>
      </div>

      {/* === الجدول === */}
      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={rowData?.Results}
          pagination={false}
          loading={loading}
          scroll={{ x: isMobile ? 500 : 1200 }}
          size={isMobile ? "small" : "middle"}
          rowKey="UniversityAssetId"
        />
      </div>

      <Pagination
        pageSize={pageSize}
        style={{
          justifyContent: "center",
          display: "flex",
          marginTop: "16px",
          flexWrap: "wrap",
        }}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        onChange={(page, pageSize) => {
          setPageNumber(page);
          setPageSize(pageSize);
        }}
        total={
          rowData && rowData?.PageCount
            ? rowData?.PageCount * rowData?.PageSize
            : 1
        }
        current={pageNumber}
        size={isMobile ? "small" : "default"}
        simple={isMobile}
      />

      {/* === Modal الإضافة/التعديل === */}
      {openFormModel && (
        <Modal
          width={isMobile ? "95%" : "52%"}
          style={{ top: isMobile ? 10 : undefined, maxWidth: 800 }}
          open={openFormModel}
          title={toEdit ? "تعديل اصل موجود" : "اضافة أصل جديد"}
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <UniversityAssetsForm />
        </Modal>
      )}

      {/* === Modal إضافة موديل === */}
      {openFormModelAddingModel && (
        <Modal
          width={isMobile ? "95%" : "52%"}
          style={{ top: isMobile ? 10 : undefined, maxWidth: 800 }}
          open={openFormModelAddingModel}
          title={toEdit ? "اضافه موديل للاصل" : "اضافة موديل للاصل"}
          footer={false}
          onCancel={() => { setOpenFormModelAddingModel(false); setToEdit(null); }}
          onOk={() => { setOpenFormModelAddingModel(false); setToEdit(null); }}
        >
          <UniversityModelForm />
        </Modal>
      )}

      {/* === Modal رفع الصور === */}
      {imageUploadAssetId && (
        <AssetImageUploadModal
          assetId={imageUploadAssetId}
          open={imageUploadOpen}
          onClose={handleCloseImageUpload}
          onSuccess={() => setdetectChanges((prev) => prev + 1)}  
        />
      )}
    </div>
  );
};

export default UniversityAssetsPage;