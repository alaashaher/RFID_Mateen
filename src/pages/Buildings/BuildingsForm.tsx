import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row } from "antd";
import { useForm } from "react-hook-form";
import AntdTextField from "../../common/antd-form-components/AntdTextField";
import * as Yup from "yup";
import AntdCheckbox from "../../common/antd-form-components/AntdCheckbox";
import CityArchitecturalStyleContext from "../../contexts/pages-context/BuildingsProvider";
import AntdTextarea from "../../common/antd-form-components/AntdTextarea";
import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";

const CityArchitecturalStyleForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } = useContext(CityArchitecturalStyleContext);




  const defaultValues = {
    BuildingName: toEdit ? toEdit.BuildingName : "",
    BuildingCode: toEdit ? toEdit.BuildingCode : "",
    BuildingTypeId: toEdit ? toEdit.BuildingTypeId : ""
  };

  const schema = Yup.object().shape(
    {
      BuildingName: Yup.string().required("اسم المنبي مطلوب"),
      BuildingCode: Yup.string().required("كود المبني مطلوب"),
      BuildingTypeId: Yup.string().required("نوع المبني مطلوب")
    }
  );

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
    console.log("🚀 ~ CityArchitecturalStyleForm ~ toEdit:", toEdit)
    if (toEdit) {
      setValue("BuildingCode", toEdit.BuildingCode)
      setValue("BuildingName", toEdit.BuildingName);
      setValue("BuildingTypeId", String(toEdit.BuildingTypeId));
    }
  }, [toEdit, setValue]);

  const onFinish = async (data) => {
    ////console.log("Form submitted:", data);

    let res;
    setLoading(true);


    try {
      const payload = {
        BuildingId: toEdit ? toEdit.BuildingId : 0,
        BuildingCode: data.BuildingCode,
        BuildingName: data.BuildingName,
        BuildingTypeId: parseInt(data.BuildingTypeId)
      };

      if (toEdit) {
        res = await putToApi(`Building/update-building`, payload);
      } else {
        res = await postToApi(`Building/add-building`, payload);
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
      }
      else {
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
      <Form form={form} onFinish={handleSubmit(onFinish)}>
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
              options={[{ title: "مستودع", value: "1" }, { title: "مبني أدري", value: "2" }]}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
            <AntdTextField
              control={control}
              name={`BuildingName`}
              placeholder="اسم المبني"
              label="اسم المنبي"
              errorMsg={errors?.BuildingName?.message}
              validateStatus={errors?.BuildingName ? "error" : ""}
              type={'text'}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
            <AntdTextField
              control={control}
              name={`BuildingCode`}
              placeholder="كود المبني"
              label="كود المبني"
              errorMsg={errors?.BuildingCode?.message}
              validateStatus={errors?.BuildingCode ? "error" : ""}
              type={"text"}
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

export default CityArchitecturalStyleForm;
