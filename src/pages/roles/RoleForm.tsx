import './Roles.scss';
import { useEffect, useState } from 'react';
import { getFromApi, postToApi, putToApi } from '../../apis/apis.tsx';
import { Button, Form, Input, Checkbox, Flex, Select } from "antd";
import { useContext } from "react";
import RoleContext from '../../contexts/pages-context/RolesProvider.tsx';
import { Store } from 'react-notifications-component';
import CustomizeRequiredMark from '../customizeRequiredMark/CustomizeRequiredMark.tsx';
import React from 'react';
const { Option } = Select;

const RoleForm = () => {
  const {
    setRowData,
    setVwEdModal,
    toEdit,
    setToEdit,
    setOpenedModal,
    setDetectChanges,
    viewRSTData,
    setViewRSTData
  } = useContext(RoleContext);

  const [form] = Form.useForm();
  const [classificationList, setClassificationList] = useState<any[]>([]);

  useEffect(() => {
    const getAllClassifications = async () => {
      try {
        const allClassifications = await getFromApi('Roles/get-role-types-ddl');
        setClassificationList(allClassifications.map((ele: any) => ({
          label: ele.RoleTypeName,
          value: ele.RoleTypeId,
          IsCampSupervisor: ele.IsCampSupervisor
        })));
      } catch (error) {
        console.error("Error fetching classifications:", error);
      }
    };
    getAllClassifications();
  }, [])
  useEffect(() => {
    if (toEdit) {
      const { Name, IsCampSupervisor } = toEdit;
      form.setFieldValue('Name', Name);
      form.setFieldValue('IsCampSupervisor', IsCampSupervisor ?? false);
    }

    if (viewRSTData) {
      const { Name, IsCampSupervisor } = viewRSTData;
      form.setFieldValue('Name', Name);
      form.setFieldValue('IsCampSupervisor', IsCampSupervisor ?? false);
    }

  }, [toEdit, viewRSTData])


  const onFinish = async (values: any) => {
    if (toEdit) {
      try {
        //console.log("putToApi");
        values.RoleId = toEdit.Id;
        await putToApi('Roles/update-role', values);
        setDetectChanges((prevState) => prevState + 1)
        setVwEdModal(false);
        setToEdit(null);
        setOpenedModal(false);
        //console.log(values);
        Store.addNotification({
          title: "",
          message: "تم التعديل",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 3000,
            onScreen: true
          }
        });

      } catch (error) {
        //console.log(error)
        Store.addNotification({
          title: "  ",
          message: "الرجاء المحاولة مرة اخرى",
          type: "danger",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 2000,
            showIcon: true,
            onScreen: true,
          },
        });
      }

    } else {
      try {

        values.RoleId = "";
        const resp = await postToApi('Roles/add-role', values);
        //console.log(resp);
        setRowData({ ...resp });
        setDetectChanges((prevState) => prevState + 1);
        setOpenedModal(false);
        //console.log("postToApi");
        //console.log('Success:', values);
        Store.addNotification({
          title: "",
          message: "تمت الاضاف بنجاح",
          type: "success",
          insert: "top",
          container: "top-right",
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 3000,
            onScreen: true
          }
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
          dismiss: {
            duration: 2000,
            showIcon: true,
            onScreen: true,
          },
        });
        //console.log(error)
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
          label="اسم الصلاحية"
          name="Name"
          rules={[{ required: true, message: 'الرجاء ادخال اسم الصلاحية' }]}

        >
          <Input disabled={viewRSTData ? true : false} />
        </Form.Item>
        <Form.Item
          label="نوع الصلاحية"
          name="RoleTypeId"
          rules={[{ required: true, message: 'الرجاء اختيار الصلاحية' }]}
        >
          <Select
            showSearch
            onChange={(value) => {
              form.setFieldsValue({ RoleTypeId: value });
              const selectedRole = classificationList.find((item) => item.value == value);
              if (selectedRole.IsCampSupervisor) {
                form.setFieldsValue({ IsCampSupervisor: true });

              } else {
                form.setFieldsValue({ IsCampSupervisor: false });

              }
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
        {/* <Form.Item
          name="IsCampSupervisor"
          valuePropName="checked"
        >
          <Checkbox disabled={viewRSTData ? true : false}>
            صلاحية لمشرف مخيم
          </Checkbox>
        </Form.Item> */}
        <Form.Item  >
          <Flex gap="small" justify='end'>
            {!viewRSTData && <Button type="primary" htmlType="submit">
              حفظ
            </Button>}

            <Button type="primary" danger
              onClick={() => { setOpenedModal(false); setToEdit(null); setViewRSTData(null) }}>
              إلغاء
            </Button>
          </Flex>

        </Form.Item>
      </Form>
    </div>
  )

}
export default RoleForm