import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row, Select } from "antd";
import { useForm } from "react-hook-form";
import AntdTextField from "../../common/antd-form-components/AntdTextField";
import * as Yup from "yup";
import AntdCheckbox from "../../common/antd-form-components/AntdCheckbox";
import UniversityAssetsContext from "../../contexts/pages-context/UniversityAssetsProvider";
import AntdTextarea from "../../common/antd-form-components/AntdTextarea";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";
import moment from "moment";
import UniversityAssetsRelocationContext from "../../contexts/pages-context/UniversityAssetsRelocationProvider";

const UniversityAssetsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } =
    useContext(UniversityAssetsRelocationContext);

  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloor] = useState([]);
  const [cats, setCats] = useState([]);

  const [buildingId, setBuildingId] = useState("");

  const [floorId, setFloorId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");

  const defaultValues = {
    BuildingCode: toEdit ? toEdit.BuildingCode : "",
    FloorCode: toEdit ? toEdit.BuildingCode : "",

    UniversityAssetName: toEdit ? toEdit.UniversityAssetName : "",
    AssetCode: toEdit ? toEdit.AssetCode : "",
    RoomId: toEdit ? toEdit.RoomId : "",
    RoomCode: toEdit ? toEdit.RoomCode : "",
    FloorId: toEdit ? toEdit.FloorId : "",
    BuildingId: toEdit ? toEdit.BuildingId : ""
  };
  const schema = Yup.object().shape(
    {
      BuildingCode: Yup.string(),
      UniversityAssetName: Yup.string().required("ادخل اسم الاصل"),

      AssetCode: Yup.string().required("ادخل العمله"),
      RoomId: Yup.string().required("ادخل الغرفه"),
      RoomCode: Yup.string().required("ادخل الصنف"),
      FloorCode: Yup.string().required("ادخل الصنف"),

      BuildingId: Yup.string().required("ادخل المبني"),
      FloorId: Yup.string().required("ادخل الدور"),
    }
  );
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
  useEffect(() => {

    const fetchLanguages = async () => {
      try {
        const res = await getFromApi(`Building/get-building-ddl`);
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
    const fetchCats = async () => {
      try {
        const res = await getFromApi(`Category/get-category-ddl`);
        setCats(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCats();
  }, []);
  useEffect(() => {
    if (getValues("BuildingId") != "") {
      const fetchLanguages = async () => {
        try {
          const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`);
          setFloor(res);
        } catch (error) {
          //console.log(error);
        }
      };
      fetchLanguages();
    }
  }, [watch("BuildingId")]);
  useEffect(() => {
    if (getValues("FloorId")) {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `Room/get-room-ddl?floorId=${getValues("FloorId") ? getValues("FloorId") : ""}`
          );
          setRooms(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    }
  }, [watch("FloorId")]);


  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };

  useEffect(() => {
    if (toEdit) {
      // console.log("🚀 ~ useEffect ~ toEdit:", toEdit)
      // setValue("BuildingId", String(toEdit.BuildingId))
      // setValue("FloorId", String(toEdit.UniversityFloorId))
      setValue("UniversityAssetName", toEdit.UniversityAssetName);
      // // setValue("IsScanned", toEdit.IsScanned);
      // setValue("Currency", toEdit.Currency);
      // // setValue("UniversityAssetDate", toEdit.UniversityAssetDate);
      setValue("RoomCode", toEdit.RoomCode);
      setValue("BuildingCode", toEdit.BuildingCode);
      setValue("FloorCode", String(toEdit.FloorCode))

      setValue("AssetCode", toEdit.AssetBarcode);
      // setValue("RoomId", String(toEdit.RoomId))
    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {
      const payload = {
        UniversityAssetId: toEdit.UniversityAssetId,
        // BuildingCode: "",
        // UniversityFloorCode: "",

        // AssetCode: data.AssetCode,
        BuildingId: data.BuildingId,
        UniversityFloorId: data.FloorId,

        RoomId: data.RoomId,


      };
      if (toEdit) {
        res = await putToApi(`UniversityAsset/update-tree-forAsset`, payload);
      } else {
        res = await postToApi(`UniversityAsset/add-UniversityAsset`, payload);
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
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >
            <AntdTextField
              control={control}
              name={`UniversityAssetName`}
              placeholder={`اسم الاصل`}
              label={`اسم الاصل`}
              errorMsg={errors?.UniversityAssetName?.message}
              validateStatus={errors?.UniversityAssetName ? "error" : ""}
              type={'text'}
              disabled={true}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >
            <AntdTextField
              control={control}
              name={`AssetCode`}
              placeholder={`كود الاصل`}
              label={`كود الاصل`}
              errorMsg={errors?.AssetCode?.message}
              validateStatus={errors?.AssetCode ? "error" : ""}
              type={'text'}
              disabled={true}

            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={6} xxl={6} >
            <AntdTextField
              control={control}
              name={`BuildingCode`}
              placeholder={`كود منبي القديم`}
              label={`كود منبي القديم`}
              errorMsg={errors?.BuildingCode?.message}
              validateStatus={errors?.BuildingCode ? "error" : ""}
              type={'text'}
              disabled={true}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={18} xxl={18} >

            <AntdSelectOption
              control={control}
              name="BuildingId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.BuildingId?.message}
              label={<span>  المبني<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" المبني"
              options={buildings?.map((item) => ({ title: `${item.BuildingName} - ${item.BuildingCode}`, value: item.BuildingId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={6} xxl={6} >
            <AntdTextField
              control={control}
              name={`FloorCode`}
              placeholder={`كود الدور القديم`}
              label={`كود الدور القديم`}
              errorMsg={errors?.FloorCode?.message}
              validateStatus={errors?.FloorCode ? "error" : ""}
              type={'text'}
              disabled={true}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={18} xxl={18} >


            <AntdSelectOption
              control={control}
              name="FloorId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.FloorId?.message}
              label={<span>  الدور<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" الدور"
              options={floors?.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={6} xxl={6} >
            <AntdTextField
              control={control}
              name={`RoomCode`}
              placeholder={`كود الغرفه القديم`}
              label={`كود الغرفه القديم`}
              errorMsg={errors?.RoomCode?.message}
              validateStatus={errors?.RoomCode ? "error" : ""}
              type={'text'}
              disabled={true}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={18} xxl={18} >

            <AntdSelectOption
              control={control}
              name="RoomId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.RoomId?.message}
              label={<span>  الغرفه<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" الغرفه"
              options={rooms?.map((item) => ({ title: `${item.RoomName} - ${item.RoomCode}`, value: item.RoomId }))}
            />
          </Col>


          {/* <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >

          التاريخ الحالي للاصل:   {moment(new Date(toEdit?.UniversityAssetDate).toISOString()).format("YYYY-DD-MM")}
            <AntdTextField
              control={control}
              name={`UniversityAssetDate`}
              placeholder={`تاريخ الاصل`}
              label={`تاريخ الاصل`}
              errorMsg={errors?.UniversityAssetDate?.message}
              validateStatus={errors?.UniversityAssetDate ? "error" : ""}
              type={'date'}
              defaultValue={"03/03/2025"}
            />
            <input type="date" name="" id="" value="2022-01-31" />
          </Col> */}



          {/* 
          <Col span={24}>
            <AntdCheckbox control={control} errors={errors} name="IsScanned" label=" مقروء" />
          </Col> */}
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

export default UniversityAssetsForm;
