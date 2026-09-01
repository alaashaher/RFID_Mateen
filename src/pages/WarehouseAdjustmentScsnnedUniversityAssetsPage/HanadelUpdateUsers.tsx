import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row, Select, Table } from "antd";
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
import WarehouseAdjustmentContext from "../../contexts/pages-context/WarehouseAdjustmentProvider";

const HanadelUpdateUsers = () => {
    const {
        setLoading,
        toEdit,
        setToEdit,
        setdetectChanges,
        setOpenFormModel,
        detectChanges
    } =
        useContext(WarehouseAdjustmentContext);

    const [Users, setUsers] = useState([]);

    const [StoredUsers, setStoredUsers] = useState([]);


    const defaultValues = {


        UserIds: toEdit ? toEdit.UserIds : [],

    };
    const schema = Yup.object().shape(
        {

            UserIds: Yup.array().required("ادخل المستخدمين"),

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

        const fetchCats = async () => {
            try {
                const res = await getFromApi(`Users/get-all-adjustment-mobile-users-ddl`);
                const mapStoredUsers = StoredUsers.map((itemm) => ({ title: `${itemm.UserName}`, value: itemm.UserId }))
                const mapAllUsers = res.map((itemm) => ({ title: `${itemm.UserName}`, value: itemm.UserId }))
                // console.log("🚀 ~ fetchCats ~ mapAllUsers:", mapAllUsers.filter(item => !mapStoredUsers.includes(item)))
                var filteredArray = mapAllUsers.filter(function (array_el) {
                    return mapStoredUsers.filter(function (anotherOne_el) {
                        return anotherOne_el.value == array_el.value;
                    }).length == 0
                });
                // console.log("🚀 ~ fetchCats ~ mapAllUsers:", filteredArray)

                setUsers(filteredArray);
            } catch (error) {
                //console.log(error);
            }
        };
        fetchCats();
    }, [StoredUsers]);



    const handleCloseModal = () => {
        setToEdit(null);
        setOpenFormModel(false);
    };

    useEffect(() => {
        if (toEdit) {
            const fetchCats = async () => {
                try {
                    const res = await getFromApi(`Adjustment/get-adjustment-users?adjustmentId=${toEdit.AdjustmentId}`);
                    setStoredUsers(res);
                } catch (error) {
                    //console.log(error);
                }
            };
            fetchCats();
        }
    }, [toEdit, setValue, detectChanges]);
    const onFinish = async (data) => {
        console.log("Form submitted:", data);
        let res;
        setLoading(true);
        try {
            const payload = {
                userIds: data.UserIds.map((item) => item.value),
                adjustmentId: toEdit.AdjustmentId
            };

            res = await putToApi(`Adjustment/add-adjustment-users`, payload);

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
                setValue("UserIds", []);
                // handleCloseModal();
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

    const columns = [
        {
            title: "#",
            key: "index",
            render: (item, record, index) => <>{index + 1}</>,
            width: 30,
        },
        {
            title: "الاسم",
            dataIndex: "UserName",
            key: "UserName",
        },
        {
            title: "رقم الهاتف",
            dataIndex: "PhoneNumber",
            key: "PhoneNumber",
        },
    ]
    return (
        <div>
            <Form form={form} onFinish={handleSubmit(onFinish)} className="multi">
                <Row style={{ display: "flex" }} gutter={[16, 16]}>

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
                    <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting  || toEdit.IsFinished == true}>
                        حفظ
                    </Button>
                    <Button danger onClick={handleCloseModal}>
                        الغاء
                    </Button>
                </div>
            </Form>

            <div>
                <Table
                    columns={columns}
                    dataSource={StoredUsers}
                    pagination={false}
                    // loading={loading}
                    scroll={{ x: 400 }}
                />
            </div>
        </div >
    );
};

export default HanadelUpdateUsers;
