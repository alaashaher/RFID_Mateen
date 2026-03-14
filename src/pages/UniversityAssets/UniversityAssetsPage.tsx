import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { CheckCircleFilled, CloseCircleFilled,EditOutlined, DeleteOutlined, PrinterOutlined, SettingFilled } from "@ant-design/icons";
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
import UniversityAssetsScannedContext from "../../contexts/pages-context/UniversityAssetsProviderScanned";
import UniversityAssetsContext from "../../contexts/pages-context/UniversityAssetsProvider";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import UniversityModelForm from "./UniversityModelForm";
const UniversityAssetsPage = () => {
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
    openFormModelAddingModel,
    setOpenFormModelAddingModel,
    isActive,
  } = useContext(UniversityAssetsContext);
  const { user } = useContext(UserContext);

  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");

  const [floors, setFloor] = useState([]);
  const [floorId, setFloorId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");


  const [cats, setCats] = useState([]);
  const [AssetType, setAssetType] = useState([]);

  const [CategoryId, setCategoryId] = useState("");
  const [AssetTypeId, setAssetTypeId] = useState("");

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
            `Room/get-room-ddl?floorId=${floorId ? floorId : ""}`
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

    const fetchLanguages = async () => {
      try {
        const hasmode = true;
        const res = await getFromApi(

          `AssetType/get-assetType-ddl-byCategoryId?CategoryId=${CategoryId ? CategoryId : ""}&hasModels=${hasmode}`
        );
        setAssetType(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchLanguages();
  }, [CategoryId])

  useEffect(() => {

    const fetchCats = async () => {
      try {
        const res = await getFromApi(`Category/get-category-ddl?BuildingTypeId=${buildingId ? buildingId : ""}`);
        setCats(res);
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCats();
  }, [buildingId]);
  useEffect(() => {
    if (buildingId != "") {
      const fetchLanguages = async () => {
        try {
          const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId ? buildingId : ""}`);
          setFloor(res);
        } catch (error) {
          //console.log(error);
        }
      };
      fetchLanguages();
    }
  }, [buildingId]);

  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `UniversityAsset/get-all-universityAsset-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&&buildingId=${buildingId ? buildingId : 0}&AssetTypeId=${AssetTypeId ? AssetTypeId : 0}&CategoryId=${CategoryId ? CategoryId : 0}`
        );
        setRowData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges, buildingId, AssetTypeId, CategoryId]);

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
  const handleModelPopUp = async (TableId) => {
    try {
      const response = await getFromApi(
        `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
      );
      if (response) {
        setToEdit(response);
        setOpenFormModelAddingModel(true);
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
      if (response != null) {
        setdetectChanges((prevState) => prevState + 1);
        Store.addNotification({
          title: "",
          message: response.Item2,
          type: !response.Item1 ? "danger" : "success",
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
      setLoading(false);
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
      //console.log(error);
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
      title: "الأصل",
      dataIndex: "UniversityAssetName",
      key: "UniversityAssetName",
    },
    {
      title: "نوع الأصل",
      dataIndex: "AssetTypeName",
      key: "AssetTypeName",
    },
    {
      title: "نوع مبنى الأصول",
      dataIndex: "BuildingTypeName",
      key: "BuildingTypeName",
    },

    {
      title: "المبنى",
      dataIndex: "BuildingName",
      key: "BuildingName",
    },
    {
      title: " تصنيف الاصل ",
      dataIndex: "CategoryName",
      key: "CategoryName",
    },
    {
      title: "باركود الأصل",
      dataIndex: "AssetBarcode",
      key: "AssetBarcode",

    },
    // { title: " الغرفه", dataIndex: "RoomName", key: "RoomName" },
    // {
    //   title: "كود الغرفة",
    //   dataIndex: "RoomCode",
    //   key: "RoomCode",
    // },

    { title: " الدور ", dataIndex: "UniversityFloorName", key: "UniversityFloorName" },
    {
      title: "عدد مرات الطباعه",
      dataIndex: "PrintedNumber",
      key: "PrintedNumber",

    },
     { title: "له موديلات", dataIndex: "AssetTypeId", key: "AssetTypeId",
      render: (_,value) => {
        return value.AssetModelId != null ? <CheckCircleFilled /> : <CloseCircleFilled style={{color:"red"}} />;
      }
     },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">
            {user.user.Permissions.includes("EditUniversityAssets") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => {
                    handleEditMod(record.UniversityAssetId);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("EditUniversityAssets") && record.AssetModelId == null && (
              <Tooltip title="أضافه موديل">
                <Button
                  onClick={() => {
                    handleModelPopUp(record.UniversityAssetId);
                  }}
                  icon={<SettingFilled />}
                  shape="circle"
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("PrintRFIDUniversityAssets") && (
              <Tooltip title="طباعه الباركود">
                <Button
                  onClick={() => {
                    handlePrintMod(record.UniversityAssetId);
                  }}
                  icon={<PrinterOutlined />}
                  shape="circle"
                />
              </Tooltip>)}

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
    const fileName = 'Assets.xlsx';
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
    a.download = 'Assets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (

    <div className="custom-container">
      <h5 style={{ justifySelf: 'center', marginBottom: '20px' }}>اصول المستودع </h5>
      <div className="sec-dv  sp-btwn">
        {user.user.Permissions.includes("AddUniversityAssets") &&
          <Button
            onClick={() => {
              setOpenFormModel(true);
            }}
          >
            + إضافة جديد
          </Button>
        }
        <div className="sp-btwn">

          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

        </div>
      </div>


      <div className='sp-btwn'>
        <div className='sp-btwn'>
          <Flex
            gap="4px"
            align='center'>
            <Input type='text' placeholder='ابحث باسم ' onChange={(e) => handleSearch(e)} />
            <span> </span>
          </Flex>
          <Select
            allowClear
            placeholder="اختر المبني"
            onChange={(e) => {
              setRooms([])
              setBuildingId(e)
              setFloorId("")
            }}
            style={{ width: 230 }}
          >
            {buildings.filter((res) => res.BuildingTypeId == 1).map((client) => (
              <Option key={client.BuildingId} value={client.BuildingId}>
                {client.BuildingName} - {client.BuildingCode}
              </Option>
            ))}
          </Select>

          <Select
            allowClear
            placeholder="اختر نوع الاصل"

            onChange={(e) => {

              setCategoryId(e)
              setAssetTypeId("")
            }}
            style={{ width: 230 }}
          >
            {cats.map((client) => (
              <Option key={client.CategoryId} value={client.CategoryId}>
                {client.CategoryName} 
              </Option>
            ))}
          </Select>
          <Select
            allowClear
            placeholder="اختر تصنيف الاصل"
            onChange={setAssetTypeId}
            style={{ width: 230 }}
          >
            {AssetType.map((client) => (
              <Option key={client.AssetTypeId} value={client.AssetTypeId}>
                {client.AssetTypeName}
              </Option>
            ))}
          </Select>
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
            toEdit
              ? "تعديل اصل موجود"
              : "اضافة أصل جديد"
          }
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <UniversityAssetsForm />
        </Modal>
      )}
      {openFormModelAddingModel && (
        <Modal
          width={"52%"}
          open={openFormModelAddingModel}
          title={
            toEdit
              ? "اضافه موديل للاصل"
              : "اضافة موديل للاصل"
          }
          footer={false}
          onCancel={() => { setOpenFormModelAddingModel(false); setToEdit(null) }}
          onOk={() => { setOpenFormModelAddingModel(false); setToEdit(null) }}
        >
          <UniversityModelForm />
        </Modal>
      )}


    </div>
  );
};

export default UniversityAssetsPage;
