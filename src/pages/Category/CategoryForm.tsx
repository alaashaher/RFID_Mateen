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
  const defaultValues = {
    AssetTypeName: toEdit ? toEdit.AssetTypeName : "",
    AssetTypeCode: toEdit ? toEdit.AssetTypeCode : "",
    CategoryId: toEdit ? toEdit.CategoryId : "",
    UniversityName: toEdit ? toEdit.UniversityName : "أوقاف الراجحى الخيرية",

    BuildingTypeId: toEdit ? toEdit.BuildingTypeId : "1"
  };
  const schema = Yup.object().shape({
    AssetTypeName: Yup.string().required("ادخل اسم الطابق"),
    AssetTypeCode: Yup.string().required('ادخل كود الدور'),
    CategoryId: Yup.string().required("ادخل نوع الاصل"),
    UniversityName: Yup.string(),
    BuildingTypeId: Yup.string().required("ادخل نوع المبني"),
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
  useEffect(() => {

    const fetchLanguages = async () => {
      try {
        const res = await getFromApi(`Category/get-category-ddl?BuildingTypeId=${getValues("BuildingTypeId") ? getValues("BuildingTypeId") : ""}`);
        setBuildings(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
  }, [watch("BuildingTypeId")])

  const handleCloseModal = () => {
    setToEdit(null);
    setOpenFormModel(false);
  };

  useEffect(() => {
    if (toEdit) {
      setValue("AssetTypeName", toEdit.AssetTypeName);
      setValue("AssetTypeCode", toEdit.AssetTypeCode);
      setValue("CategoryId", String(toEdit.CategoryId))
      setValue("UniversityName", toEdit.UniversityName);
      setValue("BuildingTypeId", toEdit.BuildingTypeId ? String(toEdit.BuildingTypeId) : "1");

    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {

      const payload = {
        CategoryId: data.CategoryId,
        AssetTypeId: toEdit ? toEdit.AssetTypeId : 0,
        AssetTypeName: data.AssetTypeName,
        AssetTypeCode: data.AssetTypeCode,
        "IsActive": true,
        UniversityName: data.UniversityName,
        BuildingTypeId: data.BuildingTypeId,
        Category: {}
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
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >

            <AntdSelectOption
              control={control}
              name="CategoryId"
              setValue={setValue}
              formClassName="custom-form"
              errorMsg={errors.CategoryId?.message}
              label={<span>  وصف نوع الأصل<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" وصف نوع الأصل "
              options={buildings?.map((item) => ({ title: item.CategoryName, value: item.CategoryId }))}
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
