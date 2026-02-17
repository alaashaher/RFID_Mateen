import './Permission.scss';
import { useEffect, useState, useContext } from 'react';
import { getFromApi, postToApi, putToApi } from '../../apis/apis.tsx';
import { Button, Form, Input, Checkbox, Select } from "antd";
import { Store } from 'react-notifications-component';
import CustomizeRequiredMark from '../customizeRequiredMark/CustomizeRequiredMark.tsx';
import PermissionContext from '../../contexts/pages-context/PermissionProvider.tsx';
import React from 'react';

const { Option } = Select;

interface ClassificationItem {
  label: string;
  value: string;
}

const PermissionForm = () => {
  const {
    setRowData,
    setVwEdModal,
    toEdit,
    setToEdit,
    setOpenedModal,
    setDetectChanges,
    viewRSTData,
    setViewRSTData
  } = useContext(PermissionContext);
  const [classificationList, setClassificationList] = useState<ClassificationItem[]>([]);
  const getAllClassifications = async () => {
    try {
      const allClassifications = await getFromApi('Roles/get-roles-ddl');
      setClassificationList(allClassifications.map((ele: any) => ({ label: ele.Name, value: ele.Id })));
    } catch (error) {
      console.error("Error fetching classifications:", error);
    }
  };

  const [form] = Form.useForm();

  useEffect(() => {
    if (toEdit) {
      form.setFieldsValue({ PermissionId: toEdit.PermissionId, PermissionName: toEdit.PermissionName, PermissionName_ar: toEdit.PermissionNameAr, PageName: toEdit.PageName, PageName_ar: toEdit.PageNameAr });
    }

    if (viewRSTData) {
      const { PermissionId, PermissionName, PermissionName_ar, PageName, PageName_ar } = viewRSTData;
      form.setFieldsValue({ PermissionId: viewRSTData.PermissionId, PermissionName: viewRSTData.PermissionName, PermissionName_ar: viewRSTData.PermissionNameAr, PageName: viewRSTData.PageName, PageName_ar: viewRSTData.PageNameAr });
    }

    getAllClassifications();
  }, [toEdit, viewRSTData]);

  const onFinish = async (values: any) => {
    //console.log('Form Values:', values, toEdit); 
    const payload = {
      PermissionId: (toEdit != null && toEdit.PermissionId) ? toEdit.PermissionId.toString() : undefined,
      PermissionName: values.PermissionName,
      PermissionNameAr: values.PermissionName_ar,
      PageName: values.PageName,
      PageNameAr: values.PageName_ar,
    };

    //console.log('Payload:', payload); 
    if (toEdit) {
      try {
        payload.PermissionId = toEdit.PermissionId.toString(); 
        await putToApi('Permission/update-permission', payload);
        setDetectChanges((prevState: number) => prevState + 1);
        setVwEdModal(false);
        setToEdit(null);
        setOpenedModal(false);
        Store.addNotification({
          title: "",
          message: "تم التعديل",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 3000, onScreen: true }
        });
      } catch (error) {
        //console.log(error);
        Store.addNotification({
          title: "  ",
          message: "الرجاء المحاولة مرة اخرى",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, showIcon: true, onScreen: true },
        });
      }
    } else {
      try {
        //console.log('Payload:', payload);
        payload.PermissionId = "0"; 
        const resp = await postToApi('Permission/add-permission', payload);
        setRowData({ ...resp });
        setDetectChanges((prevState: number) => prevState + 1);
        setOpenedModal(false);
        //console.log("postToApi");
        //console.log('Success:', payload);
        Store.addNotification({
          title: "",
          message: "تمت الاضاف بنجاح",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 3000, onScreen: true }
        });
      } catch (error) {
        Store.addNotification({
          title: "  ",
          message: "الرجاء المحاولة مرة اخرى",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: { duration: 2000, showIcon: true, onScreen: true },
        });
      }
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    //console.log('Failed:', errorInfo);
  };

  return (
    <div>
      <Form
        name="basic"
        style={{ maxWidth: 600, direction: 'rtl' }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        form={form}
        requiredMark={CustomizeRequiredMark}
        labelAlign="right"
      >

        <Form.Item
          label="اسم الصلاحية انجليزى"
          name="PermissionName"
          // rules={[{ required: true, message: 'الرجاء ادخال اسم الصلاحية' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="اسم الصلاحية عربى"
          name="PermissionName_ar"
          // rules={[{ required: true, message: 'الرجاء ادخال الصلاحية' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="اسم الصفحة انجليزى"
          name="PageName"
          rules={[{ required: true, message: 'الرجاء ادخال اسم الصفحة' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="اسم الصفحة عربى"
          name="PageName_ar"
          rules={[{ required: toEdit ? false : true, message: 'الرجاء ادخال اسم الصفحة عربى' }]}
        >
          <Input disabled={viewRSTData ? true : false} />

        </Form.Item>
        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {!viewRSTData && <Button type="primary" htmlType="submit">حفظ</Button>}
            <Button type="primary" danger onClick={() => { setOpenedModal(false); setToEdit(null); setViewRSTData(null); }}>إلغاء</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}

export default PermissionForm;
