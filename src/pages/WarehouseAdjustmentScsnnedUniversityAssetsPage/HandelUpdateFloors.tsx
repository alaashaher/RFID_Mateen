import React, { useContext, useEffect, useState } from "react";
import { Button, Col, Form, Row, Select, Table } from "antd";
import { useForm } from "react-hook-form";
import * as Yup from "yup";

import { yupResolver } from "@hookform/resolvers/yup";
import { getFromApi, postToApi, putToApi } from "../../apis/apis";
import { Store } from "react-notifications-component";
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";

import AntdSelectOptionMulti from "../../common/antd-form-components/AntdSelectOptionMulti";
import WarehouseAdjustmentContext from "../../contexts/pages-context/WarehouseAdjustmentProvider";

const HandelUpdateFloors = () => {
    const {
        setLoading,
        toEdit,
        setToEdit,
        setdetectChanges,
        setOpenFormModel,
        detectChanges
    } =
        useContext(WarehouseAdjustmentContext);


    const [buildings, setBuildings] = useState([]);
    const [floors, setFloor] = useState([]);
    const [Storedfloors, setStoredfloors] = useState([]);



    const defaultValues = {

        FloorId: toEdit ? toEdit.FloorId : [],
        BuildingId: toEdit ? toEdit.BuildingId : ""
    };
    const schema = Yup.object().shape(
        {

            BuildingId: Yup.string().required("ادخل المبني"),
            FloorId: Yup.array().required('This field is required')
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

        const fetchLanguages = async () => {
            try {
                const res = await getFromApi(`Building/get-building-ddl`);
                setBuildings(res);
            } catch (error) {
                //console.log(error);
            }
        };
        fetchLanguages();
    }, []);
    useEffect(() => {
        setValue("FloorId", []);


        if (getValues("BuildingId") != "") {
            const fetchLanguages = async () => {
                try {
                    const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`);
                    const mapStoredFoors = Storedfloors.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId }))
                    const mapAllFoors = res.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId }))
                    var filteredArray = mapAllFoors.filter(function (array_el) {
                        return mapStoredFoors.filter(function (anotherOne_el) {
                            return anotherOne_el.value == array_el.value;
                        }).length == 0
                    });
                    // console.log("🚀 ~ filteredArray ~ filteredArray:", filteredArray)
                    setFloor(filteredArray);
                } catch (error) {
                    //console.log(error);
                }
            };
            fetchLanguages();
        }
    }, [watch("BuildingId"), Storedfloors]);



    const handleCloseModal = () => {
        setToEdit(null);
        setOpenFormModel(false);
    };

    useEffect(() => {
        if (toEdit) {
            setValue("BuildingId", String(toEdit.BuildingId))
            // setValue("FloorId", (toEdit.UniversityFloorId))

            const fetchCats = async () => {
                try {
                    const res = await getFromApi(`Adjustment/get-adjustment-floors?adjustmentId=${toEdit.AdjustmentId}`);
                    setStoredfloors(res);
                } catch (error) {
                    //console.log(error);
                }
            };
            fetchCats();


        }
    }, [toEdit, setValue, detectChanges]);
    const onFinish = async (data) => {
        // console.log("Form submitted:", data);
        let res;
        setLoading(true);
        try {
            const payload = {
                AdjustmentId: toEdit ? toEdit.AdjustmentId : 0,
                floorIds: data.FloorId.map((item) => item.value),
                BuildingId: data.BuildingId,



            };

            res = await putToApi(`Adjustment/add-adjustment-floors`, payload);

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
                // handleCloseModal();
                setValue("FloorId", []);
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
            title: "اسم الغرفه",
            dataIndex: "UniversityFloorName",
            key: "UniversityFloorName",
        },
        {
            title: "كود الغرفه",
            dataIndex: "UniversityFloorCode",
            key: "UniversityFloorCode",
        },
    ]
    return (
        <div>
            <Form form={form} onFinish={handleSubmit(onFinish)} className="multi custom-form">
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
                            options={buildings?.map((item) => ({ title: `${item.BuildingName} - ${item.BuildingCode}`, value: item.BuildingId }))}
                            disable={true}
                       />
                    </Col>
                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
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
                    dataSource={Storedfloors}
                    pagination={false}
                    // loading={loading}
                    scroll={{ x: 400 }}
                />
            </div>
        </div >
    );
};

export default HandelUpdateFloors;
