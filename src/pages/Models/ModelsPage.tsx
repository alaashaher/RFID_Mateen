import { useContext, useEffect, useState } from "react";

import { deleteFromApi, getFromApi, postToApi } from "../../apis/apis";
import {
  Pagination,
  Table,
  Input,
  Select,
  Button,
  Tooltip,
  Modal,
  Popconfirm,
  Image,
  Tag,
  Form, Upload,Radio,
} from "antd";
import { Select as AntSelect } from "antd";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import UserContext from "../../contexts/user-context/UserProvider";

import BasicInformationContext from "../../contexts/pages-context/BasicInformationProvider";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  EditOutlined,
  EyeFilled,
  FileTextOutlined,
  PictureOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import ModelsForm from "./ModelsForm";
import { Store } from "react-notifications-component";
import { useNavigate } from "react-router-dom";
import RouterLinks from "../../App/RouterLinks";
import urls from "../../urls";
const { Option } = Select;
// const BASE_URL = "https://rfidrajhiapi.sirumaps.net/api";
const BASE_URL = urls.baseUrl;

const ModelsPage = () => {
  const navigate = useNavigate();
  const [categoryType, setcategoryType] = useState([]);
  const [selectedCatType, setSelectedCatTypeId] = useState("");

  const [selectedBuildingTypeId, setSelectedBuildingTypeId] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // --- Notes Modal States ---
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState<string>("");
  const [currentNotesTitle, setCurrentNotesTitle] = useState<string>("");

  // ===================================================================
  // ============ NEW: Correction Modal States ===========================
  // ===================================================================
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [currentEditingModel, setCurrentEditingModel] = useState<any>(null);

  // قوائم الـ dropdowns الخاصة بالـ correction modal
  const [allCategoriesList, setAllCategoriesList] = useState<any[]>([]);
  const [allAssetTypesList, setAllAssetTypesList] = useState<any[]>([]);
  const [filteredAssetTypesList, setFilteredAssetTypesList] = useState<any[]>([]);
  const [mosandaList, setMosandaList] = useState<any[]>([]);

  // قيم الـ form
  const [correctionCategoryId, setCorrectionCategoryId] = useState<number | undefined>(undefined);
  const [correctionAssetTypeId, setCorrectionAssetTypeId] = useState<number | undefined>(undefined);
  const [correctionModelName, setCorrectionModelName] = useState<string>("");
  const [correctionMosandaId, setCorrectionMosandaId] = useState<number | undefined>(undefined);
  const [correctionModelNumber, setCorrectionModelNumber] = useState<string>("");
  const [correctionBrand, setCorrectionBrand] = useState<string>("");
  // ===================================================================
  interface ImageSlot {
    uid: string;
    url?: string;
    originFileObj?: File;
    isExisting: boolean;
  }

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalLoading, setImageModalLoading] = useState(false);
  const [currentImageModel, setCurrentImageModel] = useState<any>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [imageSlots, setImageSlots] = useState<(ImageSlot | null)[]>([null, null]);
  // ===================================================================

  useEffect(() => {
    const fetchCategoryTypes = async () => {
      const resp = await getFromApi(`CategoryType/get-categoryType-ddl`);
      setcategoryType(resp);
    };
    fetchCategoryTypes();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getFromApi(`AssetType/get-assetType-ddl`);
        setCategories(res);
        setSelectedCategoryId("");
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCategories();
  }, []);

  const {
    rowData,
    setRowData,
    setToEdit,
    pageSize,
    setPageSize,
    pageNumber,
    setPageNumber,
    keyword,
    setkeyword,
    setOpenFormModel,
    loading,
    toEdit,
    detectChanges,
    openFormModel,
    setLoading,
    setdetectChanges,
    setModelFilter,
    modelFilter
  } = useContext(CategoryContext);
  const { user } = useContext(UserContext);

  useEffect(() => {
  const getAllData = async () => {
    try {
      const resp = await getFromApi(
        `AssetModel/get-all-assetModel-pager` +
        `?isActive=true` +
        `&pageSize=${pageSize}` +
        `&currentPage=${pageNumber}` +
        `&keyword=${keyword}` +
        `&assetTypeId=${selectedCategoryId ? selectedCategoryId : ""}` +
        `${selectedBuildingTypeId ? `&buildingTypeId=${selectedBuildingTypeId}` : ""}`  // ← جديد
      );
      setRowData(resp);
    } catch (error) {
      //console.log(error);
    }
  };
  getAllData();
}, [pageNumber, pageSize, keyword, detectChanges, selectedCatType, selectedBuildingTypeId, selectedCategoryId]);

  const handleEditMod = async (TableId) => {
    setToEdit(TableId);
    setOpenFormModel(true);
  };

  const handleDelete = async (TableId: number) => {
    try {
      setLoading(true);
      await deleteFromApi(`AssetModel/delete-assetModel?categoryId=${TableId}`);
      setdetectChanges((prevState: number) => prevState + 1);
      Store.addNotification({
        title: "",
        message: "تم الحذف بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      setLoading(false);
    } catch (error) {
      Store.addNotification({
        title: "  ",
        message: "Try again",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, showIcon: true, onScreen: true },
      });
      setLoading(false);
    }
  };

  const handleShowNotes = (notes: string, modelName: string) => {
    setCurrentNotes(notes);
    setCurrentNotesTitle(modelName);
    setNotesModalOpen(true);
  };

  // ===================================================================
  // ============ NEW: Correction Modal Handlers =========================
  // ===================================================================
  const handleOpenCorrectionModal = async (record: any) => {
    setCurrentEditingModel(record);

    setCorrectionCategoryId(record?.CategoryId ?? undefined);
    setCorrectionAssetTypeId(record?.AssetTypeId ?? undefined);
    setCorrectionModelName(record?.ModelName ?? "");
    setCorrectionMosandaId(undefined);
    setCorrectionModelNumber(record?.ModelNumber ?? "");  // ← جديد
    setCorrectionBrand(record?.Brand ?? "");              // ← جديد
    setCorrectionModalOpen(true);
    setCorrectionLoading(true);

    try {
      const [categoriesResp, assetTypesResp, mosandaResp] = await Promise.all([
        getFromApi(`Category/get-category-ddl`),
        getFromApi(`AssetType/get-assetType-ddl`),
        getFromApi(`AssetModel/get-odooAssets-ddl`),
      ]);

      setAllCategoriesList(categoriesResp || []);
      setAllAssetTypesList(assetTypesResp || []);
      setMosandaList(mosandaResp || []);

      if (record?.CategoryId) {
        const filtered = (assetTypesResp || []).filter(
          (at: any) => at.CategoryId === record.CategoryId
        );
        setFilteredAssetTypesList(filtered);
      } else {
        setFilteredAssetTypesList(assetTypesResp || []);
      }
    } catch (error) {
      Store.addNotification({
        title: "خطأ",
        message: "حدث خطأ أثناء جلب البيانات",
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
  };

  const handleCorrectionCategoryChange = (value: number | undefined) => {
    setCorrectionCategoryId(value);
    setCorrectionAssetTypeId(undefined);

    if (value) {
      const filtered = allAssetTypesList.filter((at: any) => at.CategoryId === value);
      setFilteredAssetTypesList(filtered);
    } else {
      setFilteredAssetTypesList(allAssetTypesList);
    }
  };

  const handleCloseCorrectionModal = () => {
    setCorrectionModalOpen(false);
    setCurrentEditingModel(null);
    setCorrectionCategoryId(undefined);
    setCorrectionAssetTypeId(undefined);
    setCorrectionModelName("");
    setCorrectionModelNumber("");
    setCorrectionBrand("");
    setCorrectionMosandaId(undefined);
    setFilteredAssetTypesList([]);
  };

  const handleSaveCorrection = async () => {
    if (!correctionCategoryId) {
      Store.addNotification({
        title: "تنبيه",
        message: "برجاء اختيار التصنيف",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    if (!correctionAssetTypeId) {
      Store.addNotification({
        title: "تنبيه",
        message: "برجاء اختيار نوع الأصل",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    if (!correctionModelName || correctionModelName.trim() === "") {
      Store.addNotification({
        title: "تنبيه",
        message: "برجاء إدخال اسم الموديل",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    // // if (!correctionMosandaId) {
    // //   Store.addNotification({
    // //     title: "تنبيه",
    // //     message: "برجاء اختيار الموديل المرجعي من اودو",
    // //     type: "warning",
    // //     insert: "top",
    // //     container: "top-right",
    // //     animationIn: ["animate__animated", "animate__fadeIn"],
    // //     animationOut: ["animate__animated", "animate__fadeOut"],
    // //     dismiss: { duration: 2000, onScreen: true },
    // //   });
    //   return;
    // }

    try {
      setCorrectionLoading(true);

      const payload = {
        AssetModelId: currentEditingModel?.AssetModelId,
        CategoryId: correctionCategoryId,
        AssetTypeId: correctionAssetTypeId,
        ModelName: correctionModelName.trim(),
        ModelNumber: correctionModelNumber.trim() || null,
        Brand: correctionBrand.trim() || null,
        MosandaOdooAssetId: correctionMosandaId ?? null,
      };

      await postToApi(`AssetModel/correct-assetModel-info`, payload);

      Store.addNotification({
        title: "تم بنجاح",
        message: "تم تصحيح معلومات الأصل بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });

      setdetectChanges((prevState: number) => prevState + 1);
      handleCloseCorrectionModal();
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
  };
  // ===================================================================

  const handleOpenImageModal = (record: any) => {
    setCurrentImageModel(record);

    const slots: (ImageSlot | null)[] = [null, null];

    if (record?.ModelImagePath?.trim()) {
      slots[0] = {
        uid: "-1",
        url: record.ModelImagePath,
        isExisting: true,
      };
    }
    if (record?.AnotherModelImagePath?.trim()) {
      slots[1] = {
        uid: "-2",
        url: record.AnotherModelImagePath,
        isExisting: true,
      };
    }

    setImageSlots(slots);
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setCurrentImageModel(null);
    setImageSlots([null, null]);
  };

  const handleSwap = () => {
    setImageSlots((prev) => [prev[1], prev[0]]);
  };

  const handleDeleteSlot = (index: number) => {
    setImageSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleUploadToSlot = (index: number, file: File) => {
    const newSlot: ImageSlot = {
      uid: Date.now().toString(),
      originFileObj: file,
      url: URL.createObjectURL(file), // للـ preview فقط
      isExisting: false,
    };
    setImageSlots((prev) => {
      const next = [...prev];
      next[index] = newSlot;
      return next;
    });
    return false; // منع الرفع التلقائي
  };

  const handleSaveImages = async () => {
    try {
      setImageModalLoading(true);
      const formData = new FormData();
      formData.append("AssetModelId", currentImageModel?.AssetModelId);

      // Slot 0 — الرئيسية
      const primary = imageSlots[0];
      if (primary?.originFileObj) {
        formData.append("PrimaryImage", primary.originFileObj); // ملف جديد
      } else if (primary?.isExisting && primary?.url) {
        formData.append("PrimaryExistingUrl", primary.url);    // موجودة — نبعت الـ URL
      }
      // لو null → مش بنبعت شيء = Backend يعرف إنها اتحذفت

      // Slot 1 — الثانوية
      const secondary = imageSlots[1];
      if (secondary?.originFileObj) {
        formData.append("SecondaryImage", secondary.originFileObj);
      } else if (secondary?.isExisting && secondary?.url) {
        formData.append("SecondaryExistingUrl", secondary.url);
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}AssetModel/upload-model-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error();

      Store.addNotification({
        title: "تم بنجاح", message: "تم حفظ الصور بنجاح",
        type: "success", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });

      setdetectChanges((prev: number) => prev + 1);
      handleCloseImageModal();
    } catch {
      Store.addNotification({
        title: "خطأ", message: "حدث خطأ أثناء رفع الصور",
        type: "danger", insert: "top", container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } finally {
      setImageModalLoading(false);
    }
  };
  const SlotBox = ({
    slot, index, isPrimary, onDelete, onUpload,
  }: {
    slot: ImageSlot | null;
    index: number;
    isPrimary: boolean;
    onDelete: (i: number) => void;
    onUpload: (i: number, file: File) => void;
  }) => (
    <div
      style={{
        flex: 1,
        border: `2px solid ${isPrimary ? "#faad14" : "#d9d9d9"}`,
        borderRadius: "12px",
        padding: "14px",
        backgroundColor: isPrimary ? "#fffbe6" : "#fafafa",
        textAlign: "center",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        backgroundColor: isPrimary ? "#faad14" : "#8c8c8c",
        color: "#fff", borderRadius: "20px",
        padding: "2px 12px", fontSize: "12px", fontWeight: 700,
      }}>
        {isPrimary ? "⭐ الرئيسية" : "📷 الثانوية"}
      </div>

      {slot ? (
        /* عرض الصورة مع زر الحذف */
        <div style={{ position: "relative", display: "inline-block" }}>
          <Image
            src={slot.url}
            width={110} height={110}
            style={{
              objectFit: "cover", borderRadius: "8px",
              border: `2px solid ${isPrimary ? "#faad14" : "#d9d9d9"}`,
            }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXMzMyWqznOAAAAC0lEQVR4nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII="
          />
          {/* زر الحذف */}
          <Button
            shape="circle"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(index)}
            style={{
              position: "absolute", top: -8, left: -8,
              width: "24px", height: "24px",
              minWidth: "24px", fontSize: "11px",
              backgroundColor: "#ff4d4f", color: "#fff",
              border: "none", boxShadow: "0 2px 6px rgba(255,77,79,0.4)",
            }}
          />
          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
            {slot.isExisting ? "موجودة" : "✓ جديدة"}
          </div>
        </div>
      ) : (
        /* Slot فارغة — Upload */
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={(file) => { onUpload(index, file); return false; }}
        >
          <div style={{
            width: "110px", height: "110px",
            border: `2px dashed ${isPrimary ? "#faad14" : "#d9d9d9"}`,
            borderRadius: "8px", display: "flex",
            flexDirection: "column", alignItems: "center",
            justifyContent: "center", cursor: "pointer",
            color: isPrimary ? "#faad14" : "#8c8c8c",
            backgroundColor: "#fff",
          }}>
            <PictureOutlined style={{ fontSize: "28px" }} />
            <div style={{ fontSize: "11px", marginTop: "6px" }}>اختر صورة</div>
          </div>
        </Upload>
      )}
    </div>
  );

  // const handleUploadImages = async () => {
  //   const newFiles = fileList.filter((f) => f.originFileObj);
  //   if (newFiles.length === 0) {
  //     Store.addNotification({
  //       title: "تنبيه",
  //       message: "برجاء اختيار صورة على الأقل",
  //       type: "warning",
  //       insert: "top",
  //       container: "top-right",
  //       animationIn: ["animate__animated", "animate__fadeIn"],
  //       animationOut: ["animate__animated", "animate__fadeOut"],
  //       dismiss: { duration: 2000, onScreen: true },
  //     });
  //     return;
  //   }

  //   try {
  //     setImageModalLoading(true);
  //     const formData = new FormData();
  //     formData.append("AssetModelId", currentImageModel?.AssetModelId);
  //     newFiles.forEach((file) => {
  //       formData.append("Images", file.originFileObj);
  //     });

  //     const token = localStorage.getItem("token");
  //     const res = await fetch(
  //       `${BASE_URL}/AssetModel/upload-model-images`,
  //       {
  //         method: "POST",
  //         headers: { Authorization: `Bearer ${token}` },
  //         body: formData,
  //       }
  //     );

  //     if (!res.ok) throw new Error();

  //     Store.addNotification({
  //       title: "تم بنجاح",
  //       message: "تم رفع الصور بنجاح",
  //       type: "success",
  //       insert: "top",
  //       container: "top-right",
  //       animationIn: ["animate__animated", "animate__fadeIn"],
  //       animationOut: ["animate__animated", "animate__fadeOut"],
  //       dismiss: { duration: 2000, onScreen: true },
  //     });

  //     setdetectChanges((prev: number) => prev + 1);
  //     handleCloseImageModal();
  //   } catch {
  //     Store.addNotification({
  //       title: "خطأ",
  //       message: "حدث خطأ أثناء رفع الصور",
  //       type: "danger",
  //       insert: "top",
  //       container: "top-right",
  //       animationIn: ["animate__animated", "animate__fadeIn"],
  //       animationOut: ["animate__animated", "animate__fadeOut"],
  //       dismiss: { duration: 2000, onScreen: true },
  //     });
  //   } finally {
  //     setImageModalLoading(false);
  //   }
  // };
  // ============ NEW: Handler لزر "مطابق!" ============
  const handleExactAssetModel = async (assetModelId: number) => {
    try {
      setLoading(true);
      await postToApi(`AssetModel/exact-assetModel?AssetModelId=${assetModelId}`, {});

      Store.addNotification({
        title: "تم بنجاح",
        message: "تم تأكيد مطابقة الموديل بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });

      setdetectChanges((prevState: number) => prevState + 1);
    } catch (error) {
      Store.addNotification({
        title: "خطأ",
        message: "حدث خطأ أثناء تأكيد المطابقة",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
    } finally {
      setLoading(false);
    }
  };
  // =====================================================
  //   const columns = [
  //     {
  //       title: "#",
  //       key: "index",
  //       render: (item, record, index) => <>{index + 1}</>,
  //       width: 30,
  //     },
  //     { title: "رقم الموديل", dataIndex: "AssetModelId", key: "AssetModelId" },
  //     { title: "كود نوع الصنف", dataIndex: "AssetTypeId", key: "AssetTypeId" },
  //     { title: "اسم الموديل", dataIndex: "ModelName", key: "ModelName" },
  //     { title: "رقم الموديل", dataIndex: "ModelNumber", key: "ModelNumber" },
  //     { title: "الماركة", dataIndex: "Brand", key: "Brand" },
  //     { title: "نوع الصنف ", dataIndex: "AssetTypeName", key: "AssetTypeName" },

  //     {
  //       title: "صورة الموديل",
  //       dataIndex: "ModelImagePath",
  //       key: "ModelImagePath",
  //       width: 90,
  //       render: (imagePath: string) => {
  //         if (!imagePath || imagePath.trim() === "") {
  //           return <span style={{ color: "#bbb" }}>—</span>;
  //         }
  //         return (
  //           <Image
  //             src={imagePath}
  //             alt="model"
  //             width={50}
  //             height={50}
  //             style={{
  //               objectFit: "cover",
  //               borderRadius: "6px",
  //               border: "1px solid #eee",
  //               cursor: "pointer",
  //             }}
  //             preview={{ mask: <PictureOutlined style={{ fontSize: 18 }} /> }}
  //             fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXMzMyWqznOAAAAC0lEQVR4nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII="
  //           />
  //         );
  //       },
  //     },

  //     {
  //       title: "متطابق مع أودو",
  //       dataIndex: "MatchConfidence",
  //       key: "MatchConfidence",
  //       width: 130,
  //       render: (value: string) => {
  //         if (!value) return <span style={{ color: "#bbb" }}>—</span>;
  //         if (value === "Exact") {
  //           return (
  //             <Tag
  //               color="green"
  //               style={{
  //                 fontSize: "13px",
  //                 padding: "4px 10px",
  //                 borderRadius: "6px",
  //                 fontWeight: 600,
  //               }}
  //             >
  //               مطابق
  //             </Tag>
  //           );
  //         }
  //         if (value === "Approximate") {
  //           return (
  //             <Tag
  //               style={{
  //                 fontSize: "13px",
  //                 padding: "4px 10px",
  //                 borderRadius: "6px",
  //                 fontWeight: 600,
  //                 backgroundColor: "#fff7e6",
  //                 color: "#d48806",
  //                 border: "1px solid #ffe58f",
  //               }}
  //             >
  //               غير مطابق
  //             </Tag>
  //           );
  //         }
  //         return <span>{value}</span>;
  //       },
  //     },

  //     {
  //       title: "ملاحظات",
  //       dataIndex: "Notes",
  //       key: "Notes",
  //       width: 100,
  //       render: (notes: string, record: any) => {
  //         if (!notes || notes.trim() === "") {
  //           return <span style={{ color: "#bbb" }}>—</span>;
  //         }
  //         return (
  //           <Tooltip title="عرض الملاحظات">
  //             <Button
  //               icon={<FileTextOutlined />}
  //               shape="circle"
  //               type="primary"
  //               ghost
  //               onClick={() => handleShowNotes(notes, record.ModelName)}
  //             />
  //           </Tooltip>
  //         );
  //       },
  //     },

  //     { title: "كمية الموديل ", dataIndex: "AssetTotalCount", key: "AssetTotalCount" },
  //     {
  //       title: "هل له أصول؟", dataIndex: "HasAssets", key: "HasAssets",
  //       render: (_, value) => {
  //         return value.HasAssets ? <CheckCircleFilled /> : <CloseCircleFilled style={{ color: "red" }} />;
  //       }
  //     },
  //     {
  //       title: "نفس عدد الاصول؟", dataIndex: "HasSameCount", key: "HasSameCount",
  //       render: (_, value) => {
  //         return value.HasSameCount ? <CheckCircleFilled /> : <CheckCircleFilled />;
  //       }
  //     },
  //     { title: "نوع اللاصق ", dataIndex: "TagType", key: "TagType" },
  //     { title: "العدد المتبقى فى المستودع", dataIndex: "RemainingCountNow", key: "RemainingCountNow" },
  //     { title: "عدد التالف", dataIndex: "DamagedCountNow", key: "DamagedCountNow" },

  //     {
  //       title: "إجراءات",
  //       dataIndex: "Actions",
  //       key: "Actions",
  //       width: 200,
  //       //fixed: 'right',
  //       fixed: 'left',
  //       render: (_, record) => {
  //         return (
  //           <div className="act-btns">
  //             {user.user.Permissions.includes("EditCategory") && (
  //               <Tooltip title="تعديل">
  //                 <Button
  //                   onClick={() => { handleEditMod(record); }}
  //                   icon={<EditOutlined />}
  //                   shape="circle"
  //                 />
  //               </Tooltip>
  //             )}

  //             <Tooltip title="عرض تفاصيل الاصول">
  //               <Button
  //                 onClick={() => {
  //                   setModelFilter(record);
  //                   navigate(RouterLinks.UniversityAssets);
  //                 }}
  //                 icon={<EyeFilled />}
  //                 shape="circle"
  //               />
  //             </Tooltip>

  //             {/* ============ NEW: زر تصحيح معلومات الأصل (يظهر فقط لو CompanyId === 2) ============ */}
  //             {/* ============ زر تصحيح معلومات الأصل (يظهر فقط لو CompanyId === 2) ============ */}
  // {(record?.CompanyId === 2 || record?.TagType === null) && (
  //   <Tooltip title="تصحيح معلومات الأصل">
  //     <Button
  //       onClick={() => handleOpenCorrectionModal(record)}
  //       icon={<SyncOutlined />}
  //       shape="circle"
  //       style={{
  //         backgroundColor: "#fff7e6",
  //         color: "#d48806",
  //         borderColor: "#ffe58f",
  //       }}
  //     />
  //   </Tooltip>
  // )}

  // {/* ============ NEW: زر "مطابق!" ============ */}
  // {(record?.CompanyId === 2 || record?.TagType === null) && (
  //   <Popconfirm
  //     title="تأكيد المطابقة"
  //     description="هل أنت متأكد من أن هذا الموديل مطابق؟"
  //     onConfirm={() => handleExactAssetModel(record?.AssetModelId)}
  //     okText="نعم"
  //     cancelText="لا"
  //   >
  //     <Tooltip title="مطابق!">
  //       <Button
  //         icon={<CheckCircleFilled />}
  //         shape="circle"
  //         style={{
  //           backgroundColor: "#f6ffed",
  //           color: "#52c41a",
  //           borderColor: "#b7eb8f",
  //         }}
  //       />
  //     </Tooltip>
  //   </Popconfirm>
  // )}
  // {/* ===================================================================== */}
  //             {/* ===================================================================== */}

  //             {user.user.Permissions.includes("DeleteCategory") && (
  //               <Popconfirm
  //                 title="هل أنت متأكد من الحذف؟"
  //                 onConfirm={() => { handleDelete(record?.AssetModelId); }}
  //                 okText="نعم"
  //                 cancelText="لا"
  //               >
  //                 <Tooltip title="حذف">
  //                   <Button icon={<DeleteOutlined />} shape="circle" danger />
  //                 </Tooltip>
  //               </Popconfirm>
  //             )}
  //           </div>
  //         );
  //       },
  //     },
  //   ];
  const columns = [
    {
      title: "#",
      key: "index",
      fixed: "left" as const,
      render: (item, record, index) => <>{index + 1}</>,
      width: 50,
    },
    { title: "رقم الموديل", dataIndex: "AssetModelId", key: "AssetModelId", width: 100 },
    { title: "كود نوع الصنف", dataIndex: "AssetTypeId", key: "AssetTypeId", width: 110 },
    { title: "اسم الموديل", dataIndex: "ModelName", key: "ModelName", width: 160 },
    { title: "كود الموديل", dataIndex: "ModelNumber", key: "ModelNumber", width: 110 },
    { title: "الماركة", dataIndex: "Brand", key: "Brand", width: 90 },
    { title: "نوع الصنف", dataIndex: "AssetTypeName", key: "AssetTypeName", width: 150 },
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
    {
      title: "متطابق مع أودو",
      dataIndex: "MatchConfidence",
      key: "MatchConfidence",
      width: 125,
      render: (value: string) => {
        if (!value) return <span style={{ color: "#bbb" }}>—</span>;
        if (value === "Exact") {
          return (
            <Tag color="green" style={{ fontSize: "13px", padding: "4px 10px", borderRadius: "6px", fontWeight: 600 }}>
              مطابق
            </Tag>
          );
        }
        if (value === "Approximate") {
          return (
            <Tag style={{ fontSize: "13px", padding: "4px 10px", borderRadius: "6px", fontWeight: 600, backgroundColor: "#fff7e6", color: "#d48806", border: "1px solid #ffe58f" }}>
              غير مطابق
            </Tag>
          );
        }
        return <span>{value}</span>;
      },
    },
    {
      title: "ملاحظات",
      dataIndex: "Notes",
      key: "Notes",
      width: 100,
      render: (notes: string, record: any) => {
        if (!notes || notes.trim() === "") {
          return <span style={{ color: "#bbb" }}>—</span>;
        }
        return (
          <Tooltip title="عرض الملاحظات">
            <Button
              icon={<FileTextOutlined />}
              shape="circle"
              type="primary"
              ghost
              onClick={() => handleShowNotes(notes, record.ModelName)}
            />
          </Tooltip>
        );
      },
    },
    { title: "كمية الموديل", dataIndex: "AssetTotalCount", key: "AssetTotalCount", width: 120 },
    {
      title: "هل له أصول؟",
      dataIndex: "HasAssets",
      key: "HasAssets",
      width: 100,
      render: (_, value) => {
        return value.HasAssets
          ? <CheckCircleFilled />
          : <CloseCircleFilled style={{ color: "red" }} />;
      },
    },
    {
      title: "نفس عدد الاصول؟",
      dataIndex: "HasSameCount",
      key: "HasSameCount",
      width: 130,
      render: (_, value) => {
        return value.HasSameCount
          ? <CheckCircleFilled />
          : <CheckCircleFilled />;
      },
    },
    { title: "نوع اللاصق", dataIndex: "TagType", key: "TagType", width: 110 },
    { title: "العدد المتبقى فى المستودع", dataIndex: "RemainingCountNow", key: "RemainingCountNow", width: 170 },
    { title: "عدد التالف", dataIndex: "DamagedCountNow", key: "DamagedCountNow", width: 110 },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      width: 200,
      fixed: "right" as const,
      render: (_, record) => {
        return (
          <div className="act-btns">
            {user.user.Permissions.includes("EditModels") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => { handleEditMod(record); }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}
            {record?.AssetTotalCount != 0 && record?.AssetTotalCount != null && record?.AssetTotalCount > 0 && (

              <Tooltip title="عرض تفاصيل الاصول">
                <Button
                  onClick={() => {
                    setModelFilter(record);
                    navigate(RouterLinks.UniversityAssets);
                  }}
                  icon={<EyeFilled />}
                  shape="circle"
                />
              </Tooltip>
            )

            }

            <Tooltip title="رفع صور الموديل">
              <Button
                onClick={() => handleOpenImageModal(record)}
                icon={<PictureOutlined />}
                shape="circle"
                style={{
                  backgroundColor: "#e6f7ff",
                  color: "#1890ff",
                  borderColor: "#91d5ff",
                }}
              />
            </Tooltip>
            {/* {(record?.CompanyId === 2 || record?.TagType === null) && (
              <Tooltip title="تصحيح معلومات الأصل">
                <Button
                  onClick={() => handleOpenCorrectionModal(record)}
                  icon={<SyncOutlined />}
                  shape="circle"
                  style={{ backgroundColor: "#fff7e6", color: "#d48806", borderColor: "#ffe58f" }}
                />
              </Tooltip>
            )}

            {(record?.CompanyId === 2 || record?.TagType === null) && (
              <Popconfirm
                title="تأكيد المطابقة"
                description="هل أنت متأكد من أن هذا الموديل مطابق؟"
                onConfirm={() => handleExactAssetModel(record?.AssetModelId)}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="مطابق!">
                  <Button
                    icon={<CheckCircleFilled />}
                    shape="circle"
                    style={{ backgroundColor: "#f6ffed", color: "#52c41a", borderColor: "#b7eb8f" }}
                  />
                </Tooltip>
              </Popconfirm>
            )} */}

            {user.user.Permissions.includes("DeleteCategory") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => { handleDelete(record?.AssetModelId); }}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="حذف">
                  <Button icon={<DeleteOutlined />} shape="circle" danger />
                </Tooltip>
              </Popconfirm>
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

  const exportToExcel = () => {
    const selectedColumns = columns.slice(1, -1);
    const newResult = []
    rowData?.Results.forEach((element, index) => {
      let newObject = {};
      selectedColumns.forEach((col) => {
        newObject[col.title] = element[col.dataIndex]
      })
      newResult.push(newObject)
    });
    const worksheet = XLSX.utils.json_to_sheet(newResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = 'Models.xlsx';
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  const exportToCSV = () => {
    const selectedColumns = columns.slice(1, -1);
    const csvHeader = selectedColumns
      .map(col => `"${col.title.replace(/"/g, '""')}"`)
      .join(',') + '\n';
    const csvRows = rowData?.Results.map(row =>
      selectedColumns
        .map(col => {
          const cell = row[col.dataIndex];
          const cellStr = typeof cell === 'string' ? cell.replace(/"/g, '""') : cell;
          return `"${cellStr}"`;
        })
        .join(',')
    ).join('\n');
    const BOM = '\uFEFF';
    const csvContent = BOM + csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Models.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="custom-container">
      <div className="sec-dv sp-btwn">
        <div>
          {user?.user?.Permissions.includes("AddCategory") && (
            <Button onClick={() => { setOpenFormModel(true); }}>
              + إضافة جديد
            </Button>
          )}
        </div>
        <div className="sp-btwn">
          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>
        </div>
      </div>

      <div className="sub-table">
        <h5 style={{ justifySelf: "center", marginBottom: "20px" }}>الموديلات</h5>

        <div className="sp-btwn">
          <Input
            type="text"
            placeholder="ابحث بالاسم (الموديل) او كود  الموديل "
            style={{ width: 800 }}
            onChange={(e) => setkeyword(e.target.value)}
            
          />
          <AntSelect
            allowClear
            showSearch
            placeholder="اصناف الاصول"
            value={selectedCategoryId || undefined}
            onChange={(value) => { setSelectedCategoryId(value ?? ""); }}
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: 300 }}
          >
            {categories?.map((item) => (
              <Option key={item.AssetTypeId} value={item.AssetTypeId}>
                {item.AssetTypeName}
              </Option>
            ))}
          </AntSelect>

            {user?.user?.RoleTypeId === 4 && (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "10px",
      padding: "8px 12px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      border: "1px solid #e8e8e8"
    }}>
      <span style={{ fontWeight: 600, color: "#555", fontSize: "13px" }}>
        نوع الموديل:
      </span>
      <Radio.Group
        value={selectedBuildingTypeId || ""}
        onChange={(e) => {
          setSelectedBuildingTypeId(e.target.value);
          setPageNumber(1); // إعادة الصفحة للأولى
        }}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="">الكل</Radio.Button>
        <Radio.Button value={1}>مستودع</Radio.Button>
        <Radio.Button value={2}>مبانى إدارية</Radio.Button>
      </Radio.Group>
    </div>
  )}
        </div>

        <Table
          columns={columns}
          dataSource={rowData?.Results}
          pagination={false}
          loading={loading}
          scroll={{ x: 2000 }}
          summary={(pageData) => {
            const totalCount = pageData.reduce((sum, row) => sum + (row.AssetTotalCount || 0), 0);
            const totalRemaining = pageData.reduce((sum, row) => sum + (row.RemainingCountNow || 0), 0);
            const totalDamaged = pageData.reduce((sum, row) => sum + (row.DamagedCountNow || 0), 0);

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={10}>الإجمالي</Table.Summary.Cell>
                <Table.Summary.Cell index={1}>{totalCount}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={3} />
                <Table.Summary.Cell index={3}>{totalRemaining}</Table.Summary.Cell>
                <Table.Summary.Cell index={4}>{totalDamaged}</Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            );
          }}
        />

        <Pagination
          pageSize={pageSize}
          style={{ justifyContent: "center", display: "flex", marginTop: "20px" }}
          pageSizeOptions={[10, 20, 50, 100, 200]}
          onChange={(page, pageSize) => {
            setPageNumber(page);
            setPageSize(pageSize);
          }}
          total={rowData && rowData?.PageCount ? rowData?.PageCount * rowData?.PageSize : 1}
          current={pageNumber}
        />
      </div>

      {openFormModel && (
        <Modal
          width={"52%"}
          open={openFormModel}
          title={toEdit ? "تعديل الموديل" : "اضافة الموديل"}
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <ModelsForm />
        </Modal>
      )}

      {/* ============ Notes Modal ============ */}
      <Modal
        open={notesModalOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileTextOutlined style={{ color: "#1890ff" }} />
            <span>ملاحظات الموديل: {currentNotesTitle}</span>
          </div>
        }
        onCancel={() => setNotesModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setNotesModalOpen(false)}>إغلاق</Button>,
        ]}
        width={500}
      >
        <div
          style={{
            padding: "15px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #e8e8e8",
            lineHeight: "1.8",
            fontSize: "14px",
            color: "#333",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {currentNotes}
        </div>
      </Modal>

      {/* ============ NEW: Correction Modal ============ */}
      <Modal
        open={correctionModalOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SyncOutlined style={{ color: "#d48806" }} />
            <span>تصحيح معلومات الأصل: {currentEditingModel?.ModelName}</span>
          </div>
        }
        onCancel={handleCloseCorrectionModal}
        width={650}
        confirmLoading={correctionLoading}
        footer={[
          <Button key="cancel" onClick={handleCloseCorrectionModal} disabled={correctionLoading}>
            إلغاء
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={correctionLoading}
            onClick={handleSaveCorrection}
          >
            حفظ التصحيح
          </Button>,
        ]}
      >
        <div style={{ padding: "10px 0" }}>
          <Form layout="vertical">

            {/* ============ NEW: عرض صورة الموديل ============ */}
            {currentEditingModel?.ModelImagePath &&
              currentEditingModel.ModelImagePath.trim() !== "" && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#fafafa",
                    borderRadius: "8px",
                    border: "1px dashed #d9d9d9",
                  }}
                >
                  <Image
                    src={currentEditingModel.ModelImagePath}
                    alt={currentEditingModel.ModelName}
                    width={200}
                    height={150}
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #eee",
                      cursor: "pointer",
                    }}
                    preview={{
                      mask: <PictureOutlined style={{ fontSize: 20 }} />,
                    }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXMzMyWqznOAAAAC0lEQVR4nGNgAAIAAAUAAarVyFEAAAAASUVORK5CYII="
                  />

                </div>
              )}
            {/* 1. التصنيف */}
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>التصنيف <span style={{ color: "red" }}>*</span></span>}
              required
            >
              <AntSelect
                showSearch
                allowClear
                placeholder="اختر التصنيف"
                value={correctionCategoryId}
                onChange={handleCorrectionCategoryChange}
                loading={correctionLoading}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              >
                {allCategoriesList?.map((item: any) => (
                  <Option key={item.CategoryId} value={item.CategoryId}>
                    {item.CategoryName}
                  </Option>
                ))}
              </AntSelect>
            </Form.Item>

            {/* 2. نوع الأصل */}
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>نوع الأصل <span style={{ color: "red" }}>*</span></span>}
              required
            >
              <AntSelect
                showSearch
                allowClear
                placeholder={!correctionCategoryId ? "اختر التصنيف أولاً" : "اختر نوع الأصل"}
                value={correctionAssetTypeId}
                onChange={(value) => setCorrectionAssetTypeId(value)}
                disabled={!correctionCategoryId}
                loading={correctionLoading}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              >
                {filteredAssetTypesList?.map((item: any) => (
                  <Option key={item.AssetTypeId} value={item.AssetTypeId}>
                    {item.AssetTypeName}
                  </Option>
                ))}
              </AntSelect>
            </Form.Item>

            {/* 3. اسم الموديل (text) */}
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>اسم الموديل <span style={{ color: "red" }}>*</span></span>}
              required
            >
              <Input
                placeholder="أدخل اسم الموديل"
                value={correctionModelName}
                onChange={(e) => setCorrectionModelName(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>كود الموديل</span>}
            >
              <Input
                placeholder="أدخل كود الموديل"
                value={correctionModelNumber}
                onChange={(e) => setCorrectionModelNumber(e.target.value)}
              />
            </Form.Item>

            {/* ← جديد: الماركة */}
            <Form.Item
              label={<span style={{ fontWeight: 600 }}>الماركة</span>}
            >
              <Input
                placeholder="أدخل الماركة"
                value={correctionBrand}
                onChange={(e) => setCorrectionBrand(e.target.value)}
              />
            </Form.Item>
            {/* 4. الموديل المرجعي من Mosanda */}
            {/* <Form.Item
              label={
                <span style={{ fontWeight: 600 }}>
                  الموديل المرجعي (Odoo Models) <span style={{ color: "red" }}>*</span>
                </span>
              }
              required
              extra={
                <span style={{ color: "#888", fontSize: "12px" }}>
                  ابحث في القائمة الكاملة واختر الموديل المطابق
                </span>
              }
            > */}
            <Form.Item
              label={
                <span style={{ fontWeight: 600 }}>
                  الموديل المرجعي (Odoo Models)
                  <span style={{ color: "#888", fontSize: "12px", marginRight: "6px" }}>(اختياري)</span>
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
          </Form>
        </div>
      </Modal>
      {/* ================================================ */}
      <Modal
        open={imageModalOpen}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PictureOutlined style={{ color: "#1890ff" }} />
            <span>إدارة صور الموديل: {currentImageModel?.ModelName}</span>
          </div>
        }
        onCancel={handleCloseImageModal}
        width={520}
        footer={[
          <Button key="cancel" onClick={handleCloseImageModal} disabled={imageModalLoading}>
            إلغاء
          </Button>,
          <Button
            key="save" type="primary"
            loading={imageModalLoading}
            onClick={handleSaveImages}
          >
            حفظ
          </Button>,
        ]}
      >
        <div style={{ padding: "10px 0" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            {/* Slot 0 — الرئيسية */}
            <SlotBox
              slot={imageSlots[0]}
              index={0}
              isPrimary={true}
              onDelete={handleDeleteSlot}
              onUpload={handleUploadToSlot}
            />

            {/* زرار الـ Swap */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <Tooltip title="تبديل الترتيب">
                <Button
                  shape="circle"
                  icon={<SyncOutlined />}
                  onClick={handleSwap}
                  disabled={!imageSlots[0] || !imageSlots[1]}
                  style={{
                    width: "40px", height: "40px",
                    backgroundColor:
                      imageSlots[0] && imageSlots[1] ? "#e6f7ff" : "#f5f5f5",
                    borderColor:
                      imageSlots[0] && imageSlots[1] ? "#91d5ff" : "#d9d9d9",
                    color:
                      imageSlots[0] && imageSlots[1] ? "#1890ff" : "#bbb",
                  }}
                />
              </Tooltip>
              <span style={{ fontSize: "10px", color: "#aaa" }}>تبديل</span>
            </div>

            {/* Slot 1 — الثانوية */}
            <SlotBox
              slot={imageSlots[1]}
              index={1}
              isPrimary={false}
              onDelete={handleDeleteSlot}
              onUpload={handleUploadToSlot}
            />

          </div>

          {/* ملاحظة */}
          <div style={{
            marginTop: "14px", padding: "10px 14px",
            backgroundColor: "#e6f7ff", borderRadius: "8px",
            border: "1px solid #91d5ff", fontSize: "12px", color: "#096dd9",
          }}>
            💡 الصورة <strong>الرئيسية ⭐</strong> هي التي تظهر في القائمة.
            اضغط <strong>تبديل</strong> لتغيير ترتيبهم.
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default ModelsPage;