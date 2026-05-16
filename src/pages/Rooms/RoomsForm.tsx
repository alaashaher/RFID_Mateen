import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "antd";
import { useForm } from "react-hook-form";
import AntdTextField from "../../common/antd-form-components/AntdTextField";
import * as Yup from "yup";
import AntdCheckbox from "../../common/antd-form-components/AntdCheckbox";
import RoomsContext from "../../contexts/pages-context/RoomsProvider";
import AntdTextarea from "../../common/antd-form-components/AntdTextarea";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";

const RoomsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } = useContext(RoomsContext);

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloor] = useState([]);
  // ✅ جديد: state للأجنحة
  const [suites, setSuites] = useState([]);

  // جلب المباني
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await getFromApi(`Building/get-building-ddl`);
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchBuildings();
  }, []);

  const defaultValues = {
    FloorId: toEdit ? toEdit.FloorId : "",
    BuildingId: toEdit ? toEdit.BuildingId : "",
    SuiteId: toEdit ? toEdit.SuiteId : "",          // ✅ جديد
    RoomName: toEdit ? toEdit.RoomName : "",
    RoomCode: toEdit ? toEdit.RoomCode : "",
  };

  const schema = Yup.object().shape({
    BuildingId: Yup.string().required("ادخل المبني"),
    FloorId: Yup.string().required("ادخل الدور"),
    SuiteId: Yup.string().nullable(),               // ✅ جديد - اختياري
    RoomName: Yup.string().required("ادخل اسم الطابق"),
    RoomCode: Yup.string(),
  });

  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };

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

  // جلب الأدوار حسب المبنى
  useEffect(() => {
    if (getValues("BuildingId") != "") {
      const fetchFloors = async () => {
        try {
          const res = await getFromApi(
            `UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`
          );
          setFloor(res);
        } catch (error) {
          //console.log(error);
        }
      };
      fetchFloors();

      // ✅ عند تغيير المبنى، نمسح الدور والجناح
      if (!toEdit) {
        setValue("FloorId", "");
        setValue("SuiteId", "");
        setSuites([]);
      }
    }
  }, [watch("BuildingId")]);

  // ✅ جديد: جلب الأجنحة حسب الدور
  useEffect(() => {
    const currentFloorId = getValues("FloorId");
    if (currentFloorId && currentFloorId !== "") {
      const fetchSuites = async () => {
        try {
          const res = await getFromApi(`Suite/get-suite-ddl?floorId=${currentFloorId}`);
          // الـ response ممكن يكون { Success, Data: [...] } أو array مباشرة
          const suitesData = res?.Data || res?.data || res || [];
          setSuites(Array.isArray(suitesData) ? suitesData : []);
        } catch (error) {
          //console.log(error);
          setSuites([]);
        }
      };
      fetchSuites();

      // ✅ لو مش في وضع التعديل، نمسح الجناح
      if (!toEdit) {
        setValue("SuiteId", "");
      }
    } else {
      setSuites([]);
      setValue("SuiteId", "");
    }
  }, [watch("FloorId")]);

  // تعبئة بيانات التعديل
  useEffect(() => {
    if (toEdit) {
      setValue("BuildingId", String(toEdit.BuildingId));
      setValue("FloorId", String(toEdit.UniversityFloorId));
      // ✅ جديد: تعبئة الجناح لو موجود
      setValue("SuiteId", toEdit.SuiteId ? String(toEdit.SuiteId) : "");
      setValue("RoomName", toEdit.RoomName);
      setValue("RoomCode", toEdit.RoomCode);
    }
  }, [toEdit, setValue]);

  const onFinish = async (data) => {
    let res;
    setLoading(true);
    try {
      const payload = {
        RoomId: toEdit ? toEdit.RoomId : 0,
        BuildingId: data.BuildingId,
        UniversityFloorId: data.FloorId,
        // ✅ جديد: نرسل الجناح لو موجود، null لو فاضي
        SuiteId: data.SuiteId && data.SuiteId !== "" ? data.SuiteId : null,
        RoomName: data.RoomName,
        RoomCode: data.RoomCode
      };

      if (toEdit) {
        res = await putToApi(`Room/update-room`, payload);
      } else {
        res = await postToApi(`Room/add-room`, payload);
      }

      if (res) {
        setdetectChanges((prev) => prev + 1);
        Store.addNotification({
          title: "",
          message: toEdit ? "تم التعديل بنجاح" : "تمت الاضافة بنجاح",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 2000,
            onScreen: true,
          },
        });
        handleCloseModal();
        setLoading(false);
      } else {
        setLoading(false);
        Store.addNotification({
          title: "",
          message: "حدث خطأ",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 2000,
            onScreen: true,
          },
        });
      }
    } catch (error) {
      setLoading(false);
      Store.addNotification({
        title: "",
        message: "حدث خطأ",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 2000,
          onScreen: true,
        },
      });
    }
  };

  return (
    <div>
      <Form form={form} onFinish={handleSubmit(onFinish)} className="custom-form">
        <Row style={{ display: "flex" }} gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="BuildingId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.BuildingId?.message}
              label={<span>المبني<span style={{ color: '#252627' }}>*</span></span>}
              placeholder="المبني"
              options={buildings?.filter((item) => item.BuildingTypeId != 1).map((item) => ({ title: item.BuildingName, value: item.BuildingId }))}
            />
          </Col>

          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdSelectOption
              control={control}
              name="FloorId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.FloorId?.message}
              label={<span>الدور<span style={{ color: '#252627' }}>*</span></span>}
              placeholder="الدور"
              options={floors?.map((item) => ({ title: item.UniversityFloorName, value: item.UniversityFloorId }))}
            />
          </Col>

          {/* ✅ جديد: حقل الجناح - يظهر فقط لو الدور المختار فيه أجنحة */}
          {suites.length > 0 && (
            <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
              <AntdSelectOption
                control={control}
                name="SuiteId"
                formClassName="custom-form"
                setValue={setValue}
                errorMsg={errors.SuiteId?.message}
                label={<span>الجناح <span style={{ color: '#888', fontSize: '12px' }}>(اختياري)</span></span>}
                placeholder="اختر الجناح"
                options={suites?.map((item) => ({
                  title: `${item.SuiteNameAr} - ${item.SuiteCode}`,
                  value: item.SuiteId
                }))}
              />
            </Col>
          )}

          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`RoomName`}
              placeholder={`اسم الغرفه`}
              label={`اسم الغرفه`}
              errorMsg={errors?.[`RoomName`]?.message}
              validateStatus={errors?.[`RoomName`] ? "error" : ""}
              type={'text'}
            />
          </Col>
        </Row>

        <div className="footer-form">
          <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
            حفظ
          </Button>
          <Button danger onClick={handleCloseModal}>
            الغاء
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default RoomsForm;