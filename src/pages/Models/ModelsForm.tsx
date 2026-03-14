import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "antd";
import { useForm } from "react-hook-form";
import AntdTextField from "../../common/antd-form-components/AntdTextField";
import * as Yup from "yup";
import AntdCheckbox from "../../common/antd-form-components/AntdCheckbox";
import AntdTextarea from "../../common/antd-form-components/AntdTextarea";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";

const ModelsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
    openFormModel,

  } = useContext(CategoryContext);
  const [buildings, setBuildings] = useState([]);
  const defaultValues = {
    ModelName: toEdit ? toEdit.ModelName : "",
    ModelNumber: toEdit ? toEdit.ModelNumber : "",
    AssetTypeId: toEdit ? toEdit.AssetTypeId : "",
    TagType: toEdit ? toEdit.TagType : "",  // ✅ جديد
    Brand: toEdit ? toEdit.Brand : "",
    ModelCode: toEdit ? toEdit.ModelCode : "",
    AssetTotalCount: toEdit ? toEdit.AssetTotalCount : ""
  };
  const schema = Yup.object().shape({
    ModelName: Yup.string().required("ادخل اسم الموديل"),
    ModelCode: Yup.string().required("ادخل كود الموديل"),
    ModelNumber: Yup.string(),
    AssetTypeId: Yup.string().required("ادخل نوع الاصل"),
    TagType: Yup.string().required("ادخل نوع اللاصق"),  // ✅ جديد
    Brand: Yup.string(),
    AssetTotalCount: Yup.string(),
  });
  const tagTypeOptions = [
  { title: "RFID-DogBone97*27",  value: "RFID-DogBone97*27"  },
  { title: "RFID-NonMetal50*25", value: "RFID-NonMetal50*25" },
  { title: "RFID-Metal60*24",    value: "RFID-Metal60*24"    },
];
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
        const hasmode = true;
        const res = await getFromApi(
          
          `AssetType/get-assetType-ddl?hasModels=${hasmode}`
        );
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
  }, [])

  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };

  useEffect(() => {
    if (toEdit) {
      setValue("ModelName", toEdit.ModelName);
      setValue("ModelNumber", toEdit.ModelNumber);
      setValue("AssetTypeId", String(toEdit.AssetTypeId))
      setValue("TagType", toEdit.TagType);  // ✅ جديد
      setValue("Brand", toEdit.Brand);
      setValue("AssetTotalCount", toEdit.AssetTotalCount);
      setValue("ModelCode", toEdit.ModelCode)
    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {

      const payload = {
        AssetTypeId: data.AssetTypeId,
        AssetModelId: toEdit ? toEdit.AssetModelId : 0,
        ModelName: data.ModelName,
        ModelNumber: data.ModelNumber,
        TagType: data.TagType,   
        Brand: data.Brand,
        AssetTotalCount: data.AssetTotalCount,
        ModelCode: data.ModelCode,
        UniversityName: data.UniversityName,
        "IsActive": true,
        "IsDeleted": false
        //Category: {}
      };
      if (toEdit) {
        res = await putToApi(`AssetModel/update-assetModel`, payload);
      } else {
        res = await postToApi(`AssetModel/add-assetModel`, payload);
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

            <AntdSelectOption
              control={control}
              name="AssetTypeId"  
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.AssetTypeId?.message}
              label={<span> نوع صنف الأصل<span style={{ color: '#252627' }}>*</span></span>}
              placeholder="  نوع صنف الأصل "
              options={buildings?.map((item) => ({ title: item.AssetTypeName, value: item.AssetTypeId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
  <AntdSelectOption
    control={control}
    name="TagType"
    setValue={setValue}
    formClassName="custom-form"
    errorMsg={errors.TagType?.message}
    label={<span>نوع اللاصق<span style={{ color: '#252627' }}>*</span></span>}
    placeholder="نوع اللاصق"
    options={tagTypeOptions}
  />
</Col>
          
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`ModelName`}
              placeholder={`اسم الموديل`}
              label={`اسم الموديل`}
              errorMsg={errors?.[`ModelName`]?.message}
              validateStatus={errors?.[`ModelName`] ? "error" : ""}
              type={'text'}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`ModelCode`}
              placeholder={`كود الموديل`}
              label={`كود الموديل`}
              errorMsg={errors?.[`ModelCode`]?.message}
              validateStatus={errors?.[`ModelCode`] ? "error" : ""}
              type={'text'}
            // disabled={true}
            />
          </Col>

          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`ModelNumber`}
              placeholder={`رقم الموديل`}
              label={`رقم الموديل`}
              errorMsg={errors?.[`ModelNumber`]?.message}
              validateStatus={errors?.[`ModelNumber`] ? "error" : ""}
              type={'text'}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`Brand`}
              placeholder={`اسم الماركه`}
              label={`اسم الماركه`}
              errorMsg={errors?.[`Brand`]?.message}
              validateStatus={errors?.[`Brand`] ? "error" : ""}
              type={'text'}
            // disabled={true}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`AssetTotalCount`}
              placeholder={`العدد الكلى`}
              label={`العدد الكلى`}
              errorMsg={errors?.[`AssetTotalCount`]?.message}
              validateStatus={errors?.[`AssetTotalCount`] ? "error" : ""}
              type={'text'}
            // disabled={true}
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

export default ModelsForm;
