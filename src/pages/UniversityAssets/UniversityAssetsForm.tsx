import React, { useContext, useEffect, useState } from "react";
import { Alert, Button, Col, Form, Row, Select } from "antd";
import { useForm } from "react-hook-form";
import AntdTextField from "../../common/antd-form-components/AntdTextField";
import * as Yup from "yup";
import UniversityAssetsContext from "../../contexts/pages-context/UniversityAssetsProvider";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";
import moment from "moment";

const UniversityAssetsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } = useContext(UniversityAssetsContext);

  const isEditMode = !!toEdit;

  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloor] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [AssetType, setAssetType] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [Models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const defaultValues = {
    UniversityAssetName: toEdit ? toEdit.UniversityAssetName : "",
    BuildingTypeId: toEdit ? toEdit.BuildingTypeId : "1",
    RoomId: toEdit ? toEdit.RoomId : "",
    FloorId: toEdit ? toEdit.FloorId : "",
    BuildingId: toEdit ? toEdit.BuildingId : "",
    AssetTypeId: toEdit ? toEdit.AssetTypeId : "",
    CategoryId: toEdit ? toEdit.CategoryId : "",
    AssetModelId: toEdit ? toEdit.AssetModelId : "",
  };

  // ── Schema للـ validation ──
  // فى وضع التعديل، فقط UniversityAssetName مطلوب
  const schema = isEditMode
    ? Yup.object().shape({
        UniversityAssetName: Yup.string().required("ادخل اسم الاصل"),
      })
    : Yup.object().shape({
        UniversityAssetName: Yup.string().required("ادخل اسم الاصل"),
        AssetModelId: Yup.string().required("اختر الموديل"),
        AssetTypeId: Yup.string().required("ادخل نوع صنف الأصل"),
        BuildingTypeId: Yup.string().required("ادخل نوع المبني"),
        CategoryId: Yup.string().required("ادخل الصنف"),
        RoomId: Yup.string(),
        BuildingId: Yup.string().required("ادخل المبني"),
        FloorId: Yup.string().required("ادخل الدور"),
      });

  const [form] = Form.useForm();
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const watchedAssetTypeId    = watch("AssetTypeId");
  const watchedCategoryId     = watch("CategoryId");
  const watchedBuildingTypeId = watch("BuildingTypeId");
  const watchedBuildingId     = watch("BuildingId");
  const watchedFloorId        = watch("FloorId");
  const watchedModelId        = watch("AssetModelId");

  // ──────────────────────────────────────────────────────────────────
  // جلب الموديلات حسب AssetType
  // عند الإضافة: نفلتر IsLot = false فقط
  // عند التعديل: لا نحتاج جلب الموديلات (الحقل disabled)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;

    const fetchModels = async () => {
      try {
        const assetTypeId = getValues("AssetTypeId");
        if (!assetTypeId) {
          setModels([]);
          return;
        }
        const res = await getFromApi(
          `AssetModel/get-assetModel-by-assetTypeId?assetTypeId=${assetTypeId}`
        );
        // ✅ فلترة الموديلات: IsLot = false أو null فقط
        const filtered = (res || []).filter(
          (m: any) => m.IsLot === false || m.IsLot === null
        );
        setModels(filtered);
      } catch (error) {}
    };
    fetchModels();
  }, [watchedAssetTypeId, isEditMode]);

  // ──────────────────────────────────────────────────────────────────
  // عند اختيار الموديل: تعبئة الاسم + حفظ بياناته للعرض
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    if (!watchedModelId) {
      setSelectedModel(null);
      return;
    }
    const model = Models.find(
      (m: any) => m.AssetModelId === Number(watchedModelId)
    );
    if (model) {
      setSelectedModel(model);
      setValue("UniversityAssetName", model.ModelName);
    }
  }, [watchedModelId, Models, isEditMode]);

  // ──────────────────────────────────────────────────────────────────
  // جلب AssetTypes حسب Category (للإضافة فقط)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;

    const fetchAssetTypes = async () => {
      try {
        const categoryId = getValues("CategoryId");
        if (!categoryId) {
          setAssetType([]);
          return;
        }
        const res = await getFromApi(
          `AssetType/get-assetType-ddl-byCategoryId?CategoryId=${categoryId}&hasModels=true`
        );
        setAssetType(res);
      } catch (error) {}
    };
    fetchAssetTypes();
  }, [watchedCategoryId, isEditMode]);

  // ──────────────────────────────────────────────────────────────────
  // جلب Buildings + Categories (للإضافة فقط)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;

    const fetchBuildings = async () => {
      try {
        const res = await getFromApi(`Building/get-building-ddl`);
        setBuildings(res);
      } catch (error) {}
    };
    const fetchCats = async () => {
      try {
        const buildingTypeId = getValues("BuildingTypeId");
        const res = await getFromApi(
          `Category/get-category-ddl?BuildingTypeId=${buildingTypeId || ""}`
        );
        setCats(res);
      } catch (error) {}
    };
    fetchBuildings();
    fetchCats();
  }, [watchedBuildingTypeId, isEditMode]);

  // ──────────────────────────────────────────────────────────────────
  // جلب الـ Floors حسب الـ Building (للإضافة فقط)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    const buildingId = getValues("BuildingId");
    if (!buildingId) return;
    const fetchFloors = async () => {
      try {
        const res = await getFromApi(
          `UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId}`
        );
        setFloor(res);
      } catch (error) {}
    };
    fetchFloors();
  }, [watchedBuildingId, isEditMode]);

  // ──────────────────────────────────────────────────────────────────
  // جلب الـ Rooms حسب الـ Floor (للإضافة فقط، للمبنى الإدارى)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode) return;
    const floorId = getValues("FloorId");
    if (!floorId) return;
    const fetchRooms = async () => {
      try {
        const resp = await getFromApi(`Room/get-room-ddl?floorId=${floorId}`);
        setRooms(resp);
      } catch (error) {}
    };
    fetchRooms();
  }, [watchedFloorId, isEditMode]);

  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };

  // ──────────────────────────────────────────────────────────────────
  // ملء البيانات عند التعديل (للعرض فقط)
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (toEdit) {
      setValue("BuildingId", String(toEdit.BuildingId));
      setValue("FloorId", String(toEdit.UniversityFloorId));
      setValue("UniversityAssetName", toEdit.UniversityAssetName);
      setValue("AssetModelId", toEdit.AssetModelId ? String(toEdit.AssetModelId) : "");
      setValue("AssetTypeId", toEdit.AssetTypeId ? String(toEdit.AssetTypeId) : "");
      setValue("BuildingTypeId", toEdit.BuildingTypeId ? String(toEdit.BuildingTypeId) : "1");
      setValue("RoomId", toEdit.RoomId ? String(toEdit.RoomId) : "");
      setValue("CategoryId", toEdit.CategoryId ? String(toEdit.CategoryId) : "");
    }
  }, [toEdit, setValue]);

  // ──────────────────────────────────────────────────────────────────
  // إرسال الفورم
  // ──────────────────────────────────────────────────────────────────
  const onFinish = async (data: any) => {
    let res: any;
    setLoading(true);

    try {
      let payload: any;

      if (isEditMode) {
        // ═══════════════════════════════════════════════════════════
        // وضع التعديل: نرسل فقط UniversityAssetId + الاسم
        // باقى الحقول الـ Backend يتجاهلها (Immutable)
        // ═══════════════════════════════════════════════════════════
        payload = {
          UniversityAssetId: toEdit.UniversityAssetId,
          UniversityAssetName: data.UniversityAssetName,
        };

        res = await putToApi(`UniversityAsset/update-UniversityAsset`, payload);
      } else {
        // ═══════════════════════════════════════════════════════════
        // وضع الإضافة: نرسل كل الحقول
        // الباركود/RFID/AssetCode يُولّدون فى Backend
        // ═══════════════════════════════════════════════════════════
        payload = {
          UniversityAssetId: 0,
          UniversityAssetName: data.UniversityAssetName,
          AssetModelId: data.AssetModelId ? parseInt(data.AssetModelId) : null,
          AssetTypeId:  data.AssetTypeId  ? parseInt(data.AssetTypeId)  : null,
          CategoryId:   data.CategoryId   ? parseInt(data.CategoryId)   : null,
          BuildingTypeId: data.BuildingTypeId ? parseInt(data.BuildingTypeId) : null,
          BuildingId:   data.BuildingId   ? parseInt(data.BuildingId)   : null,
          UniversityFloorId: data.FloorId ? parseInt(data.FloorId)      : null,
          RoomId: !data.RoomId || data.RoomId === "" ? 0 : parseInt(data.RoomId),
          IsScanned: false,
          CreationDate: moment(new Date()).format("YYYY-MM-DD"),
        };

        res = await postToApi(`UniversityAsset/add-UniversityAsset`, payload);
      }

      // التعامل مع الـ response
      const isSuccess = res?.success === true || res?.Success === true || res === true;
      const responseMessage = res?.message || res?.Message || "";
      const responseWarning = res?.warning || res?.Warning || "";

      if (isSuccess) {
        setdetectChanges((prev: number) => prev + 1);
        Store.addNotification({
          title: "",
          message: isEditMode ? "تم التعديل بنجاح" : "تمت الاضافة بنجاح",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, onScreen: true },
        });

        // عرض تحذير إن وُجد (مثل تجاوز AssetTotalCount)
        if (responseWarning) {
          Store.addNotification({
            title: "تنبيه",
            message: responseWarning,
            type: "warning",
            insert: "top",
            container: "top-right",
            animationIn: ["animate__animated", "animate__fadeIn"],
            animationOut: ["animate__animated", "animate__fadeOut"],
            dismiss: { duration: 5000, onScreen: true },
          });
        }

        handleCloseModal();
      } else {
        Store.addNotification({
          title: "",
          message: responseMessage || "حدث خطأ",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 3000, onScreen: true },
        });
      }
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Store.addNotification({
        title: "",
        message: error?.message || "حدث خطأ",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 3000, onScreen: true },
      });
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // معلومات الموديل (المتبقى) - للإضافة فقط
  // ──────────────────────────────────────────────────────────────────
  const renderModelInfo = () => {
    if (isEditMode || !selectedModel) return null;

    const total = selectedModel.AssetTotalCount || 0;
    const remaining = selectedModel.RemainingNewCountNow ?? 0;
    const isComplete = remaining <= 0;

    return (
      <Col xs={24}>
        <Alert
          type={isComplete ? "warning" : "info"}
          showIcon
          message={
            <span>
              <strong>الموديل:</strong> {selectedModel.ModelName} | 
              <strong> الإجمالى المطلوب:</strong> {total} | 
              <strong> المتبقى للإضافة:</strong> {remaining}
              {isComplete && " (تم الوصول للحد - أى إضافة ستكون زيادة محجوزة)"}
            </span>
          }
          style={{ marginBottom: 12 }}
        />
      </Col>
    );
  };

  // ──────────────────────────────────────────────────────────────────
  // معلومات الأصل عند التعديل (للعرض فقط)
  // ──────────────────────────────────────────────────────────────────
  const renderEditInfo = () => {
    if (!isEditMode) return null;

    return (
      <Col xs={24}>
        <Alert
          type="info"
          showIcon
          message={
            <div>
              <div><strong>الباركود:</strong> {toEdit?.AssetBarcode}</div>
              <div><strong>RFID:</strong> {toEdit?.RFIDCode}</div>
              <div><strong>كود الأصل:</strong> {toEdit?.AssetCode}</div>
              <div style={{ marginTop: 8, color: "#888" }}>
                ⚠️ بعد الإنشاء، لا يمكن تعديل الباركود أو RFID أو الموقع أو التصنيف.
                يمكن فقط تعديل اسم الأصل.
              </div>
            </div>
          }
          style={{ marginBottom: 12 }}
        />
      </Col>
    );
  };

  return (
    <div>
      <Form form={form} onFinish={handleSubmit(onFinish)} className="custom-form">
        <Row style={{ display: "flex" }} gutter={[16, 16]}>

          {/* معلومات الأصل (للتعديل فقط) */}
          {renderEditInfo()}

          {/* نوع المبنى */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="BuildingTypeId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.BuildingTypeId?.message}
              label={<span>نوع المبني{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="نوع المبني"
              disabled={isEditMode}
              options={[
                { title: "مستودع", value: 1 },
                { title: "مبني إدارى", value: 2 },
              ]}
            />
          </Col>

          {/* المبنى */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="BuildingId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.BuildingId?.message}
              label={<span>المبني{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="المبني"
              disabled={isEditMode}
              options={buildings
                ?.filter((item: any) => item.BuildingTypeId == watchedBuildingTypeId)
                .map((item: any) => ({ title: item.BuildingName, value: item.BuildingId }))}
            />
          </Col>

          {/* الدور */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="FloorId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.FloorId?.message}
              label={<span>الدور{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="الدور"
              disabled={isEditMode}
              options={floors?.map((item: any) => ({
                title: item.UniversityFloorName,
                value: item.UniversityFloorId,
              }))}
            />
          </Col>

          {/* الغرفة (للمبنى الإدارى فقط) */}
          {watchedBuildingTypeId == 2 && (
            <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
              <AntdSelectOption
                control={control}
                name="RoomId"
                setValue={setValue}
                formClassName="custom-form"
                errorMsg={errors.RoomId?.message}
                label={<span>الغرفه</span>}
                placeholder="الغرفه"
                disabled={isEditMode}
                options={rooms?.map((item: any) => ({
                  title: item.RoomName,
                  value: item.RoomId,
                }))}
              />
            </Col>
          )}

          {/* التصنيف */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="CategoryId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.CategoryId?.message}
              label={<span>تصنيف الاصل{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="تصنيف الاصل"
              disabled={isEditMode}
              options={cats?.map((item: any) => ({
                title: item.CategoryName,
                value: item.CategoryId,
              }))}
            />
          </Col>

          {/* نوع الأصل */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="AssetTypeId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.AssetTypeId?.message}
              label={<span>نوع صنف الأصل{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="نوع صنف الأصل"
              disabled={isEditMode}
              options={AssetType?.map((item: any) => ({
                title: item.AssetTypeName,
                value: item.AssetTypeId,
              }))}
            />
          </Col>

          {/* الموديل */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="AssetModelId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.AssetModelId?.message}
              label={<span>موديل الأصل{!isEditMode && <span style={{ color: "#252627" }}>*</span>}</span>}
              placeholder="موديل الأصل"
              disabled={isEditMode}
              options={Models?.map((item: any) => ({
                title: `${item.ModelName} ${item.Brand ? `- ${item.Brand}` : ""}`,
                value: item.AssetModelId,
              }))}
            />
          </Col>

          {/* اسم الأصل (الحقل الوحيد القابل للتعديل دائماً) */}
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name="UniversityAssetName"
              placeholder="اسم الاصل"
              label="اسم الاصل"
              errorMsg={errors?.UniversityAssetName?.message}
              validateStatus={errors?.UniversityAssetName ? "error" : ""}
              type="text"
            />
          </Col>

          {/* معلومات الموديل (للإضافة فقط) */}
          {renderModelInfo()}
        </Row>

        <div className="footer-form">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? "تعديل" : "حفظ"}
          </Button>
          <Button danger onClick={handleCloseModal}>
            الغاء
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default UniversityAssetsForm;