import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row, Select } from "antd";
import { get, useForm } from "react-hook-form";
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

const UniversityAssetsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } =
    useContext(UniversityAssetsContext);

  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloor] = useState([]);
  const [cats, setCats] = useState([]);

  const [buildingId, setBuildingId] = useState("");

  const [floorId, setFloorId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");

  const defaultValues = {
    // IsScanned: toEdit ? toEdit.IsScanned : true,
    UniversityAssetName: toEdit ? toEdit.UniversityAssetName : "",
    Currency: toEdit ? toEdit.Currency : "",
    // UniversityAssetDate: toEdit ? toEdit.UniversityAssetDate : "",
    GrossValue: toEdit ? toEdit.GrossValue : "",
    AssetBarcode: toEdit ? toEdit.AssetBarcode : "",
    BuildingTypeId: toEdit ? toEdit.BuildingTypeId : "1",
    RoomId: toEdit ? toEdit.RoomId : "",
    CategoryId: toEdit ? toEdit.CategoryId : "",
    FloorId: toEdit ? toEdit.FloorId : "",
    BuildingId: toEdit ? toEdit.BuildingId : ""
  };
  const schema = Yup.object().shape(
    {
      // IsScanned: Yup.boolean(),
      UniversityAssetName: Yup.string().required("ادخل اسم الاصل"),
      // Currency: Yup.string().required("ادخل العمله"),
      // UniversityAssetDate: Yup.string().required("ادخل اسم الاصل"),
      // GrossValue: Yup.string().required("ادخل العمله"),
      AssetBarcode: Yup.string(),
      BuildingTypeId: Yup.string().required("ادخل نوع المبني"),
      RoomId: Yup.string(),
      CategoryId: Yup.string().required("ادخل الصنف"),
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
        const res = await getFromApi(`Category/get-category-ddl?BuildingTypeId=${getValues("BuildingTypeId") ? getValues("BuildingTypeId") : ""}`);
        setCats(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCats();
  }, [getValues("BuildingTypeId")]);
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
    if (getValues("FloorId") != "") {
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
      setValue("BuildingId", String(toEdit.BuildingId))
      setValue("FloorId", String(toEdit.UniversityFloorId))
      setValue("UniversityAssetName", toEdit.UniversityAssetName);
      // setValue("IsScanned", toEdit.IsScanned);
      setValue("Currency", toEdit.Currency);
      // setValue("UniversityAssetDate", toEdit.UniversityAssetDate);
      setValue("GrossValue", toEdit.GrossValue);
      setValue("AssetBarcode", toEdit.AssetBarcode);
      setValue("BuildingTypeId", toEdit.BuildingTypeId ? String(toEdit.BuildingTypeId) : "1");
      setValue("RoomId", String(toEdit.RoomId))
      setValue("CategoryId", String(toEdit.CategoryId))
    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {
      const payload = {
        UniversityAssetId: toEdit ? toEdit.UniversityAssetId : 0,
        UniversityAssetName: data.UniversityAssetName,
        Currency: data.Currency,
        // UniversityAssetDate: data.UniversityAssetDate,
        GrossValue: data.GrossValue,
        AssetBarcode: data.AssetBarcode,
        BuildingTypeId: data.BuildingTypeId ? parseInt(data.BuildingTypeId) : null,
        CreationDate: moment(new Date()).format('YYYY-MM-DD'),
        BuildingId: data.BuildingId,
        UniversityFloorId: data.FloorId,
        IsScanned: null,
        RoomId: (data.RoomId == "" || data.RoomId == null) ? null : data.RoomId,
        CategoryId: data.CategoryId

      };
      console.log("payload2____,", payload)
      if (toEdit) {
        res = await putToApi(`UniversityAsset/update-UniversityAsset`, payload);
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
            />
          </Col>

          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >


            <AntdSelectOption
              control={control}
              name="BuildingTypeId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.BuildingTypeId?.message}
              label={<span>  نوع المبني<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" نوع المبني"
              options={[{ title: "مستودع", value: 1 }, { title: "مبني أدري", value: 2 }]}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >


            <AntdSelectOption
              control={control}
              name="CategoryId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.CategoryId?.message}
              label={<span>  تصنيف الاصل<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" تصنيف الاصل"
              options={cats?.map((item) => ({ title: item.CategoryName, value: item.CategoryId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >

            <AntdSelectOption
              control={control}
              name="BuildingId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.BuildingId?.message}
              label={<span>  المبني<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" المبني"
              options={buildings?.filter((item) => item.BuildingTypeId == watch("BuildingTypeId")).map((item) => ({ title: item.BuildingName, value: item.BuildingId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >


            <AntdSelectOption
              control={control}
              name="FloorId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.FloorId?.message}
              label={<span>  الدور<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" الدور"
              options={floors?.map((item) => ({ title: item.UniversityFloorName, value: item.UniversityFloorId }))}
            />
          </Col>
          {watch("BuildingTypeId") == 2 &&
            <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >

              <AntdSelectOption
                control={control}
                name="RoomId"
                setValue={setValue}
                formClassName="custom-form"
                errorMsg={errors.RoomId?.message}
                label={<span>  الغرفه<span style={{ color: '#252627' }}>*</span></span>}
                placeholder=" الغرفه"
                options={rooms?.map((item) => ({ title: item.RoomName, value: item.RoomId }))}
              />
            </Col>
          }
          {/* <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >
            <AntdTextField
              control={control}
              name={`AssetBarcode`}
              placeholder={`باركود الاصل`}
              label={`باركود الاصل`}
              errorMsg={errors?.AssetBarcode?.message}
              validateStatus={errors?.AssetBarcode ? "error" : ""}
              type={'text'}
            />
          </Col> */}

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


          {/* <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12} >
            <AntdTextField
              control={control}
              name={`AssetCode`}
              placeholder={`كود الاصل`}
              label={`كود الاصل`}
              errorMsg={errors?.AssetCode?.message}
              validateStatus={errors?.AssetCode ? "error" : ""}
              type={'text'}
            />
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
