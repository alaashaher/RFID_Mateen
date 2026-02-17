import './Users.scss';
import { useEffect, useState, useContext } from 'react';
import { getFromApi, postToApi, putToApi } from '../../apis/apis.tsx';
import { Button, Form, Input, Checkbox, Select } from "antd";
import { Store } from 'react-notifications-component';
import CustomizeRequiredMark from '../customizeRequiredMark/CustomizeRequiredMark.tsx';
import UserContext from '../../contexts/pages-context/UsersProvider.tsx';
import React from 'react';

const { Option } = Select;

interface ClassificationItem {
  label: string;
  value: string;
}

const UserForm = () => {
  const {
    setRowData,
    setVwEdModal,
    toEdit,
    setToEdit,
    setOpenedModal,
    setDetectChanges,
    viewRSTData,
    setViewRSTData
  } = useContext(UserContext);
  const [classificationList, setClassificationList] = useState<ClassificationItem[]>([]);
  const [roleName, setRoleName] = useState("")
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
      setRoleName(toEdit.RoleName)
      form.setFieldsValue({ UserId: toEdit.User.UserId, OdooJobNumber: toEdit.User.OdooJobNumber,UserName: toEdit.User.UserName, Email: toEdit.User.Email, PhoneNumber: toEdit.User.PhoneNumber, RoleId: toEdit.RoleId });
    }

    if (viewRSTData) {
      const { UserId, UserName, OdooJobNumber, Email, RoleId, Password, PhoneNumber } = viewRSTData;
      form.setFieldsValue({ UserId: viewRSTData.User.UserId, OdooJobNumber: viewRSTData.User.OdooJobNumber, UserName: viewRSTData.User.UserName, Email: viewRSTData.User.Email, RoleId: viewRSTData.RoleId, Password, PhoneNumber: viewRSTData.User.PhoneNumber });
    }

    getAllClassifications();
  }, [toEdit, viewRSTData]);

  const onFinish = async (values: any) => {
    //console.log('Form Values:', values, toEdit); 
    const payload = {
      UserId: (toEdit != null && toEdit.User.UserId) ? toEdit.User.UserId.toString() : undefined,
      UserName: values.UserName,
      OdooJobNumber: values.OdooJobNumber,
      Email: values.Email,
      RoleId: values.RoleId,
      // Password: values.Password ? values.Password : "",
      PhoneNumber: values.PhoneNumber,
      RoleName: roleName
    };
    if (values.Password) {
      payload.Password = values.Password
    }
    //console.log('Payload:', payload); 

    if (toEdit) {
      try {
        payload.UserId = toEdit.User.UserId.toString();
        await putToApi('Users/update-user', payload);
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
        payload.UserId = "0";
        const resp = await postToApi('Users/add-user', payload);
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
          label="الصلاحية"
          name="RoleId"
          rules={[{ required: true, message: 'الرجاء اختيار الصلاحية' }]}
        >
          <Select
            showSearch
            onChange={(value) => {
              form.setFieldsValue({ RoleId: value });
              setRoleName(classificationList.filter((item) => item.value == value)[0].label)
            }}
            filterOption={false}
            placeholder={"الصلاحية"}
            size="large"
            allowClear
            disabled={viewRSTData ? true : false}
          >
            {classificationList.map((op, index) => (
              <Option key={index} value={op.value}>
                {op.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label="اسم المستخدم"
          name="UserName"
          rules={[{ required: true, message: 'الرجاء ادخال اسم المستخدم' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="الرقم الوظيفى فى أودو"
          name="OdooJobNumber"
          rules={[{ required: true, message: 'الرجاء ادخال الرقم الوظيفى' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="الايميل"
          name="Email"
          rules={[{ required: true, message: 'الرجاء ادخال الايميل' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="رقم التليفون"
          name="PhoneNumber"
          rules={[{ required: true, message: 'الرجاء ادخال رقم التليفون' }]}
        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="الرقم السرى"
          name="Password"
          rules={[{ required: toEdit ? false : true, message: 'الرجاء ادخال الرقم السرى' }]}
        >
          <Input type="Password" disabled={viewRSTData ? true : false} />

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

export default UserForm;
