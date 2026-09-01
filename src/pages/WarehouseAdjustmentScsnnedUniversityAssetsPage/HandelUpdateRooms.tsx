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

const HandelUpdateRooms = () => {
    const {
        setLoading,
        toEdit,
        setToEdit,
        setdetectChanges,
        setOpenFormModel,
        detectChanges
    } =
        useContext(WarehouseAdjustmentContext);

    const { Option } = Select;

    const [buildings, setBuildings] = useState([]);
    const [floors, setFloor] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [StoredRooms, setStoredRooms] = useState([]);



    const defaultValues = {

        RoomId: toEdit ? toEdit.RoomId : [],
        FloorId: toEdit ? toEdit.FloorId : [],
        BuildingId: toEdit ? toEdit.BuildingId : ""

    };
    const schema = Yup.object().shape(
        {
            RoomId: Yup.array().required('This field is required'),
            BuildingId: Yup.string().required("ادخل المبني"),
            FloorId: Yup.array().required('This field is required'),
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

        const fetchCats = async () => {
            try {
                const query = getValues("FloorId").map((item) => `floorIds=${item.value}`)
                const res = await getFromApi(`Room/get-roomsddl-by-floor-id?${query.join("&")}`);
                const mapStoredRooms = StoredRooms.map((item) => ({ title: ` ${item.RoomName} - ${item.UniversityFloorName} `, value: item.RoomId }))
                const mapAllRooms = res.map((item) => ({ title: `${item.RoomName} - ${item.UniversityFloorName}`, value: item.RoomId }))
                // console.log("🚀 ~ fetchCats ~ mapStoredRooms:", mapStoredRooms)
                // console.log("🚀 ~ fetchCats ~ mapAllRooms:", mapAllRooms)
                // console.log("🚀 ~ fetchCats ~ mapAllRooms:", mapAllRooms.filter(item => !mapStoredRooms.includes(item)))
                var filteredArray = mapAllRooms.filter(function (array_el) {
                    return mapStoredRooms.filter(function (anotherOne_el) {
                        return anotherOne_el.value == array_el.value;
                    }).length == 0
                });
                // console.log("🚀 ~ fetchCats ~ mapAllRooms:", filteredArray)

                setRooms(filteredArray);
            } catch (error) {
                //console.log(error);
            }
        };
        fetchCats();
    }, [StoredRooms, watch("FloorId")]);
    useEffect(() => {
        setValue("FloorId", []);
        setValue("RoomId", []);

        if (getValues("BuildingId") != "") {
            const fetchLanguages = async () => {
                try {
                    const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`);
                    setFloor(res?.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId })));
                } catch (error) {
                    //console.log(error);
                }
            };
            fetchLanguages();
        }
    }, [watch("BuildingId")]);
    // useEffect(() => {
    //     setValue("RoomId", []);

    //     if (getValues("FloorId").length > 0) {

    //         const getAllData = async () => {
    //             try {
    //                 const query = getValues("FloorId").map((item) => `floorIds=${item.value}`)

    //                 const resp = await getFromApi(
    //                     `Room/get-roomsddl-by-floor-id?${query.join("&")}`);
    //                 setRooms(resp?.map((item) => ({ title: `${item.RoomName} - ${item.RoomCode}`, value: item.RoomId })));
    //             } catch (error) {
    //                 //console.log(error);
    //             }
    //         };
    //         getAllData();
    //     }
    // }, [watch("FloorId")]);


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
                    const res = await getFromApi(`Adjustment/get-adjustment-rooms?adjustmentId=${toEdit.AdjustmentId}`);
                    setStoredRooms(res.sort((a, b) => a.UniversityFloorId - b.UniversityFloorId));
                    const mapStoredFloors = res.map((itemm) => ({ value: itemm.UniversityFloorId }))

                    const uniqueArray = mapStoredFloors.filter((tag, index, array) => array.findIndex(t => t.value == tag.value) == index);
                    setValue("FloorId", uniqueArray)
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
                // FloorsIds: data.FloorId.map((item) => item.value),
                adjustmentId: toEdit.AdjustmentId,
                roomIds: data.RoomId.map((item) => item.value),
            };
            res = await putToApi(`Adjustment/add-adjustment-rooms`, payload);

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
                setValue("RoomId", []);
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
            title: "كود الغرفة",
            dataIndex: "RoomCode",
            key: "RoomCode",
        },
        {
            title: "اسم الغرفة",
            dataIndex: "RoomName",
            key: "RoomName",
        },
        {
            title: "اسم الدور",
            dataIndex: "UniversityFloorName",
            key: "UniversityFloorName",
        },
    ]
    return (
        <div>
            <Form form={form} onFinish={handleSubmit(onFinish)} className="multi custom-form">
                <Row style={{ display: "flex" }} gutter={[16, 16]}>

                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >

                        <AntdSelectOption
                            control={control}
                            setValue={setValue}
                            name="BuildingId"
                            formClassName="custom-form"
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
                    <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
                        {rooms &&
                            <AntdSelectOptionMulti
                                control={control}
                                name="RoomId"
                                label={<span>  الغرفه<span style={{ color: '#252627' }}>*</span></span>}
                                placeholder=" الغرفه"
                                setValue={setValue}
                                options={rooms}
                                formClassName="multi"
                                validateStatus={errors.RoomId ? "error" : "success"}
                                errorMsg={errors.RoomId?.message}
                            />
                        }
                    </Col>

                </Row>
                <div className="footer-form">
                    <Button type="primary" htmlType="submit" loading={isSubmitting} disabled={isSubmitting || toEdit.IsFinished == true}>
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
                    dataSource={StoredRooms}
                    pagination={false}
                    // loading={loading}
                    scroll={{ x: 400 }}
                />
            </div>
        </div >
    );
};

export default HandelUpdateRooms;
