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

const CategoryForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
    openFormModel,

  } = useContext(CategoryContext);
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {

    const fetchLanguages = async () => {
      try {
        const res = await getFromApi(`CategoryType/get-category-type-ddl`);
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
  }, [])
  const defaultValues = {
    AssetTypeName: toEdit ? toEdit.AssetTypeName : "",
    AssetTypeCode: toEdit ? toEdit.AssetTypeCode : "",
    ParentAssetTypeId: toEdit ? toEdit.ParentAssetTypeId : "",
    UniversityName: toEdit ? toEdit.UniversityName : "جامعة نايف العربية للعلوم الأمنية"


  };
  const schema = Yup.object().shape({
    AssetTypeName: Yup.string().required("ادخل اسم الطابق"),
    AssetTypeCode: Yup.string().required('ادخل كود الدور'),
    ParentAssetTypeId: Yup.string().required("ادخل نوع الاصل"),
    UniversityName: Yup.string()
  })
    ;
  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };
  const [form] = Form.useForm();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });
  useEffect(() => {
    if (toEdit) {
      setValue("AssetTypeName", toEdit.AssetTypeName);
      setValue("AssetTypeCode", toEdit.AssetTypeCode);
      setValue("ParentAssetTypeId", String(toEdit.ParentAssetTypeId))
      setValue("UniversityName", toEdit.UniversityName);
    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {

      const payload = {
        ParentAssetTypeId: data.ParentAssetTypeId,
        AssetTypeId: toEdit ? toEdit.AssetTypeId : 0,
        AssetTypeName: data.AssetTypeName,
        AssetTypeCode: data.AssetTypeCode,
        "IsActive": true,
        UniversityName: data.UniversityName
      };
      if (toEdit) {
        res = await putToApi(`AssetType/update-AssetType`, payload);
      } else {
        res = await postToApi(`AssetType/add-AssetType`, payload);
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
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >

            <AntdSelectOption
              control={control}
              name="ParentAssetTypeId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.ParentAssetTypeId?.message}
              label={<span>  وصف نوع الأصل<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" وصف نوع الأصل "
              options={buildings?.map((item) => ({ title: item.CategoryTypeName, value: item.CategoryTypeId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`AssetTypeName`}
              placeholder={`اسم نوع الاصل`}
              label={`اسم نوع الاصل`}
              errorMsg={errors?.[`AssetTypeName`]?.message}
              validateStatus={errors?.[`AssetTypeName`] ? "error" : ""}
              type={'text'}
            />
          </Col>

          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`AssetTypeCode`}
              placeholder={`كود نوع الاصل`}
              label={`كود نوع الاصل`}
              errorMsg={errors?.[`AssetTypeCode`]?.message}
              validateStatus={errors?.[`AssetTypeCode`] ? "error" : ""}
              type={'text'}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`UniversityName`}
              placeholder={`اسم الجامعه`}
              label={`اسم الجامعه`}
              errorMsg={errors?.[`UniversityName`]?.message}
              validateStatus={errors?.[`UniversityName`] ? "error" : ""}
              type={'text'}
              disabled={true}
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

export default CategoryForm;
