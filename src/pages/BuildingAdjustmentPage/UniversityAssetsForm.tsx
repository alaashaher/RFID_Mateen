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
import AntdSelectOptionMulti from "../../common/antd-form-components/AntdSelectOptionMulti";
import BuildingAdjustmentContext from "../../contexts/pages-context/BuildingAdjustmentProvider";

const UniversityAssetsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } =
    useContext(BuildingAdjustmentContext);

  const { Option } = Select;

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloor] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [Users, setUsers] = useState([]);

  const [cats, setCats] = useState([]);

  const [buildingId, setBuildingId] = useState([]);

  const [floorId, setFloorId] = useState("");

  const [radio1, setRadio1] = useState("BuildingLevel")

  const defaultValues = {
    // IsScanned: toEdit ? toEdit.IsScanned : true,
    AdjustmentName: toEdit ? toEdit.AdjustmentName : "",
    AdjustmentDesc: toEdit ? toEdit.AdjustmentDesc : "",
    // UniversityAssetDate: toEdit ? toEdit.UniversityAssetDate : "",
    AdjustmentLevel: toEdit ? toEdit.AdjustmentLevel : "",

    UserIds: toEdit ? toEdit.UserIds : [],
    RoomId: toEdit ? toEdit.RoomId : [],
    FloorId: toEdit ? toEdit.FloorId : [],
    BuildingId: toEdit ? toEdit.BuildingId : ""
  };
  const schema = Yup.object().shape(
    {
      // IsScanned: Yup.boolean(),
      AdjustmentName: Yup.string().required("ادخل اسم الجرد"),
      AdjustmentDesc: Yup.string(),
      // UniversityAssetDate: Yup.string().required("ادخل اسم الاصل"),
      AdjustmentLevel: Yup.string().required("ادخل المستوي"),
      UserIds: Yup.array().required("ادخل المستخدمين"),
      RoomId: Yup.array().when('AdjustmentLevel', {
        is: (value: any) => value === 'RoomLevel',
        then: (schema) => schema.required('This field is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
      BuildingId: Yup.string().required("ادخل المبني"),
      FloorId: Yup.array().when('AdjustmentLevel', {
        is: (value: any) => value === 'RoomLevel' || value === 'FloorLevel',
        then: (schema) => schema.required('This field is required'),
        otherwise: (schema) => schema.notRequired(),
      }),
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
    setValue("AdjustmentLevel", "BuildingLevel");
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
        const res = await getFromApi(`Users/get-all-adjustment-mobile-users-ddl`);
        setUsers(res?.map((item) => ({ title: `${item.UserName}`, value: item.UserId })));
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCats();
  }, []);
  useEffect(() => {
    setValue("FloorId", []);
    setValue("RoomId", []);

    if (getValues("BuildingId") != "") {
      const fetchLanguages = async () => {
        try {
          const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`);
          setFloor(res?.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId })));
        } catch (error) {
          //console.log(error);
        }
      };
      fetchLanguages();
    }
  }, [watch("BuildingId")]);
  useEffect(() => {
    // setValue("RoomId", []);

    if (getValues("FloorId").length > 0) {

      const getAllData = async () => {
        try {
          const query = getValues("FloorId").map((item) => `floorIds=${item.value}`)
          // console.log("🚀 ~ getAllData ~ query:", query)
          const resp = await getFromApi(
            `Room/get-roomsddl-by-floor-id?${query.join("&")}`);
          setRooms(resp?.map((item) => ({ title: `${item.RoomCode} - ${item.RoomName} - ${item.UniversityFloorName}`, value: item.RoomId })));
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
      setValue("FloorId", (toEdit.UniversityFloorId))
      setValue("RoomId", (toEdit.RoomId))


      setValue("AdjustmentName", toEdit.AdjustmentName);
      // setValue("IsScanned", toEdit.IsScanned);
      setValue("AdjustmentDesc", toEdit.AdjustmentDesc);


      // setValue("UniversityAssetDate", toEdit.UniversityAssetDate);
      setValue("AdjustmentLevel", toEdit.AdjustmentLevel);


      setValue("UserIds", toEdit.UserIds);

    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    // console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {
      const payload = {
        AdjustmentId: toEdit ? toEdit.AdjustmentId : 0,
        AdjustmentName: data.AdjustmentName,
        AdjustmentDesc: data.AdjustmentDesc,


        // UniversityAssetDate: data.UniversityAssetDate,
        AdjustmentLevel: data.AdjustmentLevel,

        UserIds: data.UserIds.map((item) => item.value),
        FloorsIds: data.AdjustmentLevel === "RoomLevel" || data.AdjustmentLevel === "FloorLevel" ? data.FloorId.map((item) => item.value) : [],
        BuildingId: data.BuildingId,

        RoomsIds: data.AdjustmentLevel === "RoomLevel" ? data.RoomId.map((item) => item.value) : [],


      };
      if (toEdit) {
        res = await putToApi(`Adjustment/update-adjustment`, payload);
      } else {
        res = await postToApi(`Adjustment/add-adjustment`, payload);
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
      <Form form={form} onFinish={handleSubmit(onFinish)} className="multi custom-form">
        <Row style={{ display: "flex" }}>
          <div className="radio-div" style={{margin: "auto"}}>
            <div className={`single-item active`}>

              {moment(new Date()).year()}
            </div>
          </div>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} style={{ margin: "20px 0" }}>
            <div className="radio-div">
              <div className="title">
                <span>مستوي الجرد <span style={{ color: '#252627' }}>*</span></span>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
            <div className="radio-div">

              <div className={`single-item ${radio1 == "BuildingLevel" ? "active" : ""}`} onClick={() => {
                setRadio1("BuildingLevel")
                setValue("AdjustmentLevel", "BuildingLevel")
              }}>
                <div className="circle">
                  <div className="small">
                  </div>
                </div>
                <div>
                  مبني
                </div>
              </div>
              <div className={`single-item ${radio1 == "FloorLevel" ? "active" : ""}`} onClick={() => {
                setRadio1("FloorLevel")
                setValue("AdjustmentLevel", "FloorLevel")
              }}>
                <div className="circle">
                  <div className="small">
                  </div>
                </div>
                <div>
                  ادوار
                </div>
              </div>
              <div className={`single-item ${radio1 == "RoomLevel" ? "active" : ""}`} onClick={() => {
                setRadio1("RoomLevel");
                setValue("AdjustmentLevel", "RoomLevel")
              }}>
                <div className="circle">
                  <div className="small">
                  </div>
                </div>
                <div>
                  غرف
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >

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
          {(radio1 == "RoomLevel" || radio1 == "FloorLevel") && <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            {floors &&
              <AntdSelectOptionMulti
                control={control}
                name="FloorId"
                label={<span>  الدور<span style={{ color: '#252627' }}>*</span></span>}
                placeholder=" الدور"
                setValue={setValue}
                options={floors}
                formClassName="multi"
                validateStatus={errors.FloorId ? "error" : "success"}
                errorMsg={errors.FloorId?.message}
              />
            }

          </Col>}

          {(radio1 == "RoomLevel") &&
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
              {rooms &&
                <AntdSelectOptionMulti
                  control={control}
                  name="RoomId"
                  label={<span>  الغرفه<span style={{ color: '#252627' }}>*</span></span>}
                  placeholder=" الغرفه"
                  setValue={setValue}
                  options={rooms}
                  formClassName="multi"
                  validateStatus={errors.RoomId ? "error" : "success"}
                  errorMsg={errors.RoomId?.message}
                />
              }
            </Col>}

          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
            <AntdTextField
              control={control}
              name={`AdjustmentName`}
              placeholder={`اسم الجرد`}
              label={`اسم الجرد`}
              errorMsg={errors?.AdjustmentName?.message}
              validateStatus={errors?.AdjustmentName ? "error" : ""}
              type={'text'}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
            <AntdTextarea
              control={control}
              name={`AdjustmentDesc`}
              placeholder={`وصف الجرد`}
              label={`وصف الجرد`}
              errorMsg={errors?.AdjustmentDesc?.message}
              validateStatus={errors?.AdjustmentDesc ? "error" : ""}

            />
          </Col>

          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
            {Users &&
              <AntdSelectOptionMulti
                control={control}
                name="UserIds"
                label={<span>  المستحدمين<span style={{ color: '#252627' }}>*</span></span>}
                placeholder=" المستحدمين"
                setValue={setValue}
                options={Users}
                formClassName="multi"
                validateStatus={errors.UserIds ? "error" : "success"}
                errorMsg={errors.UserIds?.message}
              />
            }
          </Col>

          {/* <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
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
    </div >
  );
};

export default UniversityAssetsForm;
