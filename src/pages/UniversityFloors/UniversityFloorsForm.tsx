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
import UniversityFloorsContext from "../../contexts/pages-context/UniversityFloorsProvider";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";

const UniversityFloorsForm = () => {
  const {
    setLoading,
    toEdit,
    setToEdit,
    setdetectChanges,
    setOpenFormModel,
  } = useContext(UniversityFloorsContext);
  const [buildings, setBuildings] = useState([]);

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
  }, [])
  const defaultValues = {
    UniversityFloorName: toEdit ? toEdit.UniversityFloorName : "",
    UniversityFloorCode: toEdit ? toEdit.UniversityFloorCode : "",
    BuildingId: toEdit ? toEdit.BuildingId : ""

  };
  const schema = Yup.object().shape({
    UniversityFloorName: Yup.string().required("ادخل اسم الطابق"),
    UniversityFloorCode: Yup.string(),
    BuildingId: Yup.string().required("ادخل المبني"),

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
      setValue("UniversityFloorName", toEdit.UniversityFloorName);
      setValue("UniversityFloorCode", toEdit.UniversityFloorCode);
      setValue("BuildingId", String(toEdit.BuildingId))

    }
  }, [toEdit, setValue]);
  const onFinish = async (data) => {
    //console.log("Form submitted:", data);
    let res;
    setLoading(true);
    try {
      const payload = {
        BuildingId: data.BuildingId,
        UniversityFloorId: toEdit ? toEdit.UniversityFloorId : 0,
        UniversityFloorName: data.UniversityFloorName,
        UniversityFloorCode: data.UniversityFloorCode
      };
      if (toEdit) {
        res = await putToApi(`UniversityFloor/update-UniversityFloor`, payload);
      } else {
        res = await postToApi(`UniversityFloor/add-UniversityFloor`, payload);
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
              name="BuildingId"
              formClassName="custom-form"
              setValue={setValue}
              errorMsg={errors.BuildingId?.message}
              label={<span>  المبني<span style={{ color: '#252627' }}>*</span></span>}
              placeholder=" المبني"
              options={buildings?.map((item) => ({ title: item.BuildingName, value: item.BuildingId }))}
            />
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`UniversityFloorName`}
              placeholder={`اسم الدور`}
              label={`اسم الدور`}
              errorMsg={errors?.[`UniversityFloorName`]?.message}
              validateStatus={errors?.[`UniversityFloorName`] ? "error" : ""}
              type={'text'}
            />
          </Col>

          {/* <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <AntdTextField
              control={control}
              name={`UniversityFloorCode`}
              placeholder={`كود الدور`}
              label={`كود الدور`}
              errorMsg={errors?.[`UniversityFloorCode`]?.message}
              validateStatus={errors?.[`UniversityFloorCode`] ? "error" : ""}
              type={'text'}
            />
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

export default UniversityFloorsForm;
