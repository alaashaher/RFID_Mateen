import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { EditOutlined, DeleteOutlined, PrinterOutlined, InfoCircleFilled, UserAddOutlined, GroupOutlined, HddOutlined, SendOutlined } from "@ant-design/icons";
import { deleteFromApi, getFromApi, postToApi } from "../../apis/apis";
import {
    Button,
    Pagination,
    Table,
    Tooltip,
    Popconfirm,
    Modal,
    Tabs, Flex, Input, Select
} from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import UniversityAssetsForm from "./UniversityAssetsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import ScsnnedUniversityAssetsContext from "../../contexts/pages-context/ScsnnedUniversityAssetsProvider";
import { User } from "../../utils/user.type";
import HandelUpdateFloors from "./HandelUpdateFloors";
import HanadelUpdateUsers from "./HanadelUpdateUsers";
import HandelUpdateRooms from "./HandelUpdateRooms";
import moment from "moment";
import RouterLinks from "../../App/RouterLinks";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
const ScsnnedUniversityAssetsPage = () => {
    const {
        rowData,
        setRowData,
        pageSize,
        setPageSize,
        pageNumber,
        setPageNumber,
        keyword,
        setkeyword,
        loading,
        setLoading,
        toEdit,
        setToEdit,
        detectChanges,
        setdetectChanges,
        openFormModel,
        setOpenFormModel,
        isActive,
        popupType, setPopupType
    } = useContext(ScsnnedUniversityAssetsContext);
    const { user } = useContext(UserContext);
    // console.log("🚀 ~ ScsnnedUniversityAssetsPage ~ user:", user)
    const navigate = useNavigate();
    const { Option } = Select;
    const [buildings, setBuildings] = useState([]);
    const [buildingId, setBuildingId] = useState("");

    const [floors, setFloor] = useState([]);
    const [floorId, setFloorId] = useState("");
    const [rooms, setRooms] = useState([]);
    const [roomId, setRoomId] = useState("");


    // const [yearCount, setyearCount] = useState((moment(new Date()).year() - 2025))
    const [yearOpation, setyearOpation] = useState([])

    // console.log("🚀 ~ ScsnnedUniversityAssetsPage ~ yearCount:", yearCount)
    const [year, setyear] = useState(moment(new Date()).year())
    useEffect(() => {
        setkeyword("")
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
        if (floorId != "") {
            const getAllData = async () => {
                try {
                    const resp = await getFromApi(
                        `Room/get-roomsddl-by-floor-id?floorId=${floorId ? floorId : ""}`
                    );
                    setRooms(resp);
                } catch (error) {
                    //console.log(error);
                }
            };
            getAllData();
        }
    }, [floorId]);
    useEffect(() => {
        if (buildingId != "") {
            const fetchLanguages = async () => {
                try {
                    const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl-by-buildingid?buildingId=${buildingId ? buildingId : ""}`);
                    setFloor(res);
                } catch (error) {
                    //console.log(error);
                }
            };
            fetchLanguages();
        }
    }, [buildingId]);

    useEffect(() => {
        let yearCount = (moment(new Date()).year() - 2025)
        // console.log("🚀 ~ useEffect ~ yearCount:", yearCount)
        // const renderOpation =()=> {
        if (yearCount >= 0) {
            // console.log("🚀 ~ //renderOpation ~ yearCount:", yearCount)
            setyearOpation([
                ...yearOpation,
                (moment(new Date()).year()) + yearCount
            ])
            yearCount = yearCount - 1;
        }
        // console.log("🚀 ~ //renderOpation ~ yearOpation:", yearOpation)
        // }
        // renderOpation()

        const getAllData = async () => {
            try {
                const resp = await getFromApi(
                    `Adjustment/get-all-adjustmentes-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&year=${year}`
                );
                setRowData(resp);
            } catch (error) {
                //console.log(error);
            }
        };
        getAllData();
    }, [pageNumber, pageSize, keyword, detectChanges, buildingId, floorId, roomId]);

    const handleEditMod = async (TableId) => {
        try {
            const response = await getFromApi(
                `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
            );
            if (response) {
                setToEdit(response);
                setOpenFormModel(true);
            }
        } catch (error) {
            //console.log(error);
        }
    };

    const handleDelete = async (TableId) => {
        try {
            setLoading(true);
            await deleteFromApi(
                `UniversityAsset/delete-universityAsset?universityAssetId=${TableId}`
            );
            setdetectChanges((prevState) => prevState + 1);
            Store.addNotification({
                title: "",
                message: "تم الحذف بنجاح",
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
            setLoading(false);
        } catch (error) {
            //console.log(error);
            Store.addNotification({
                title: "",
                message: "Try again",
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
            setLoading(false);
        }
    };

    const handlePrintMod = async (TableId) => {
        try {
            setLoading(true)
            const response = await postToApi(
                `RFID/print-rfid`, {
                "AssetId": TableId
            }
            );
            if (!response) {
                setdetectChanges((prevState) => prevState + 1);
                Store.addNotification({
                    title: "",
                    message: "تم الطباعه بنجاح",
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
                setLoading(false);
            } else {
                Store.addNotification({
                    title: "",
                    message: "Try again",
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
                setLoading(false);
            }
        } catch (error) {
            //console.log(error);
        }
    };

    const sendAssetAdjustmentToOdoo = async (adjustmentId) => {
        try {
            const response = await getFromApi(
                `UniversityAsset/send-asset-adjustment-to-odoo?adjustmentId=${adjustmentId}`
            );
            if (response) {
                setdetectChanges((prevState) => prevState + 1);
                Store.addNotification({
                    title: "",
                    message: "تم الارسال بنجاح",
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
                setLoading(false);
            } else {
                Store.addNotification({
                    title: "",
                    message: "Try again",
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
                setLoading(false);
            }
        } catch (error) {
            //console.log(error);
        }
    }

    const columns = [
        {
            title: "#",
            key: "index",
            render: (item, record, index) => <>{index + 1}</>,
            width: 30,
        },
        {
            title: "اسم الجرد",
            dataIndex: "AdjustmentName",
            key: "AdjustmentName",
        },
        {
            title: " الوصف ",
            dataIndex: "AdjustmentDesc",
            key: "AdjustmentDesc",
        },
        {
            title: " اسم المبني ",
            dataIndex: "BuildingName",
            key: "BuildingName",
        },
        {
            title: " مستوي الجرد ",
            dataIndex: "AdjustmentLevel",
            key: "AdjustmentLevel",
            render: (_, record) => {
                if (record?.AdjustmentLevel == 'RoomLevel') {
                    return 'مستوي غرفة'
                } else if (record?.AdjustmentLevel == 'BuildingLevel') {
                    return 'مستوي مبني'
                } else if (record?.AdjustmentLevel == 'FloorLevel') {
                    return 'مستوي دور'
                }
            }

        },
        {
            title: " حاله الجرد",
            dataIndex: "BuildingName",
            key: "BuildingName",
            render: (_, record) => {
                if (record?.IsFinished) {
                    return 'منتهي'
                } else {
                    return 'في التشغيل'
                }
            }
        },
        {
            title: "إجراءات",
            dataIndex: "Actions",
            key: "Actions",
            render: (_, record) => {
                return (
                    <div className="act-btns">
                        {user.user.Permissions.includes("HandelUserAdjustmentUniversityAssets") && (
                            <Tooltip title="عرض أو أضافه مستخدمين">
                                <Button
                                    onClick={() => {
                                        setPopupType("UpdateUsers");
                                        setOpenFormModel(true);
                                        setToEdit(record);
                                    }}
                                    icon={<UserAddOutlined />}
                                    shape="circle"
                                />
                            </Tooltip>
                        )}
                        {user.user.Permissions.includes("HandelRoomsAdjustmentUniversityAssets") && record?.AdjustmentLevel == 'RoomLevel' && (
                            <Tooltip title="عرض او اضاقه غرف">
                                <Button
                                    onClick={() => {
                                        setPopupType("UpdateRooms");
                                        setOpenFormModel(true);
                                        setToEdit(record);
                                    }}
                                    icon={<GroupOutlined />}
                                    shape="circle"
                                />
                            </Tooltip>
                        )}
                        {user.user.Permissions.includes("HandelFloorsAdjustmentUniversityAssets") && record?.AdjustmentLevel == 'FloorLevel' && (
                            <Tooltip title="عرض او اضافه ادوار">
                                <Button
                                    onClick={() => {
                                        setPopupType("UpdateFloors");
                                        setOpenFormModel(true);
                                        setToEdit(record);
                                    }}
                                    icon={<HddOutlined />}
                                    shape="circle"
                                />
                            </Tooltip>
                        )}

                        {user.user.Permissions.includes("InfoAdjustmentUniversityAssets") && (
                            <Tooltip title="عرض نتائج الجرد">
                                <Button
                                    onClick={() => {
                                        localStorage.setItem("UniversityAssetsAdjustment", JSON.stringify(record));
                                        navigate(RouterLinks.UniversityAssetsAdjustment)
                                    }}
                                    icon={<InfoCircleFilled />}
                                    shape="circle"
                                />
                            </Tooltip>
                        )}
                        {user.user.Permissions.includes("SendResultToOdooAdjustmentUniversityAssets") && record?.IsFinished && (
                            <Tooltip title="ارسال نتائج الجرد الى أودو">
                                <Button
                                    onClick={() => {
                                        sendAssetAdjustmentToOdoo(record.AdjustmentId)
                                    }}
                                    icon={<SendOutlined />}
                                    shape="circle"
                                />
                            </Tooltip>
                        )}
                    </div>
                );
            },
        },
    ];

    const handleCloseFormModel = () => {
        setOpenFormModel(false);
        setToEdit(null);
    };
    const handleSearch = (e: any) => {

        setkeyword(e.target.value);
        //console.log(keyword);
    }
    const handleshowPage = (e: any) => {

        setPageSize(e);
        //console.log(pageSize);
    }

    const exportToExcel = () => {
        // Convert table data to worksheet
        const selectedColumns = columns.slice(1, -1); // exclude first and last
    const newResult = []
    rowData?.Results.forEach((element, index) => {
      let newObject = {};
      selectedColumns.forEach((col) => {
        newObject[col.title] = element[col.dataIndex]
      })
      newResult.push(newObject)
    });
    const worksheet = XLSX.utils.json_to_sheet(newResult);

        // Create a new workbook and append the worksheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // Save the file
        const fileName = 'adjustments.xlsx';
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };
    const exportToCSV = () => {
        // Prepare header row
        const selectedColumns = columns.slice(1, -1); // exclude first and last

        // Create header row with Arabic titles
        const csvHeader = selectedColumns
            .map(col => `"${col.title.replace(/"/g, '""')}"`)
            .join(',') + '\n';
        // Prepare data rows
        const csvRows = rowData?.Results.map(row =>
            selectedColumns
                .map(col => {
                    const cell = row[col.dataIndex];
                    // Escape double quotes
                    const cellStr = typeof cell === 'string' ? cell.replace(/"/g, '""') : cell;
                    return `"${cellStr}"`;
                })
                .join(',')
        ).join('\n');

        // Add BOM for UTF-8
        const BOM = '\uFEFF';

        const csvContent = BOM + csvHeader + csvRows;

        // Create a blob with proper encoding
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adjustments.csv';
        a.click();
        URL.revokeObjectURL(url);
    };
    return (
        <div className="custom-container">
            <h5 style={{ justifySelf: 'center', marginBottom: '20px' }}>الجرد </h5>
            <div className="sec-dv sp-btwn">
                {user.user.Permissions.includes("AddAdjustmentUniversityAssets") &&
                    <Button
                        onClick={() => {
                            setOpenFormModel(true);
                            setPopupType("add")
                        }}
                    >
                        + أضافه جرد جديد
                    </Button>
                }
                <div className="sp-btwn">

                    <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
                    <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

                </div>
            </div>


            <div className='sp-btwn'>
                <div className='sp-btwn'>
                    <div style={{ width: "70%" }} >
                        <Flex
                            gap="4px"
                            align='center'>
                            <Input type='text' placeholder='ابحث باسم الجرد او اسم المبنى' onChange={(e) => handleSearch(e)} />
                            <span> </span>
                        </Flex>
                    </div>
                    <Select
                        allowClear
                        placeholder="اختر السنه"
                        onChange={(e) => {
                            setyear(e)

                        }}
                        defaultValue={moment(new Date()).year()}
                        style={{ width: 230 }}
                    >
                        {yearOpation.map((client) => (
                            <Option key={client} value={client}>
                                {client}
                            </Option>
                        ))}
                    </Select>
                    {/* <Select
                        allowClear
                        placeholder="اختر الدور"

                        onChange={(e) => {

                            setFloorId(e)
                            setRoomId("")
                        }}
                        style={{ width: 230 }}
                    >
                        {floors.map((client) => (
                            <Option key={client.UniversityFloorId} value={client.UniversityFloorId}>
                                {client.UniversityFloorName} - {client.UniversityFloorCode}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        allowClear
                        placeholder="اختر الغرفه"
                        onChange={setRoomId}
                        style={{ width: 230 }}
                    >
                        {rooms.map((client) => (
                            <Option key={client.RoomId} value={client.RoomId}>
                                {client.RoomName} - {client.RoomCode}
                            </Option>
                        ))}
                    </Select> */}
                </div>
                <div className='sp-btwn'>
                    <Flex
                        gap="4px"
                        align='center'>
                        <span>SHOW</span>
                        <Select
                            allowClear
                            defaultValue={'50'}
                            onChange={(e) => handleshowPage(e)}
                        >
                            <Option value="10">10</Option>
                            <Option value="20">20</Option>
                            <Option value="50">50</Option>
                            <Option value="100">100</Option>
                            <Option value="200">200</Option>
                        </Select>
                    </Flex>

                </div>
            </div>
            <div>
                <Table
                    columns={columns}
                    dataSource={rowData?.Results}
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 600 }}
                />
                <Pagination
                    pageSize={pageSize}
                    style={{
                        justifyContent: "center",
                        display: "flex",
                        marginTop: "20px",
                    }}
                    pageSizeOptions={[10, 20, 50, 100, 200]}
                    onChange={(page, pageSize) => {
                        setPageNumber(page);
                        setPageSize(pageSize);
                    }}
                    total={
                        rowData && rowData?.PageCount
                            ? rowData?.PageCount * rowData?.PageSize
                            : 1
                    }
                    current={pageNumber}
                />
            </div>
            {openFormModel && (
                <Modal
                    width={"52%"}
                    open={openFormModel}
                    title={
                        popupType === "add"
                            ? `اضافة جرد جديد `
                            : popupType === "UpdateUsers"
                                ? "تعديل المستخدمين"
                                : popupType === "UpdateRooms"
                                    ? "تعديل الغرف"
                                    : popupType === "UpdateFloors"
                                        ? "تعديل الادوار"
                                        : ""
                    }
                    footer={false}
                    onCancel={handleCloseFormModel}
                    onOk={handleCloseFormModel}
                >
                    {
                        popupType === "add" ? <UniversityAssetsForm />
                            : popupType === "UpdateUsers" ? <HanadelUpdateUsers />
                                : popupType === "UpdateRooms" ? <HandelUpdateRooms />
                                    : popupType === "UpdateFloors" ? <HandelUpdateFloors />
                                        : <></>
                    }

                </Modal>
            )}
        </div>
    )
}

export default ScsnnedUniversityAssetsPage
