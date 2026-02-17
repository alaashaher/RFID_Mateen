import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { EditOutlined, DeleteOutlined, PrinterOutlined } from "@ant-design/icons";
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
const UniversityAssetsPrintedPage = () => {
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
  } = useContext(UniversityAssetsContext);
  const { user } = useContext(UserContext);

  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");

  const [floors, setFloor] = useState([]);
  const [floorId, setFloorId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");



  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `UniversityAsset/get-assets-needs-print?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}`
        );
        setRowData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges, buildingId, floorId, roomId]);





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
      title: "الاسم",
      dataIndex: "UniversityAssetName",
      key: "UniversityAssetName",
    },
    {
      title: " الصنف ",
      dataIndex: "ProductName",
      key: "ProductName",
    },
    {
      title: " وصف الاصل ",
      dataIndex: "CategoryName",
      key: "CategoryName",
    },
    {
      title: "باركود الأصل",
      dataIndex: "AssetBarcode",
      key: "AssetBarcode",

    },
    { title: "اسم الغرفه", dataIndex: "RoomName", key: "RoomName" },
    {
      title: "كود الغرفة",
      dataIndex: "RoomCode",
      key: "RoomCode",
    },

    { title: "اسم الدور ", dataIndex: "UniversityFloorName", key: "UniversityFloorName" },
    { title: "اسم المبني ", dataIndex: "BuildingName", key: "BuildingName" },
    {
      title: "عدد مرات الطباعه",
      dataIndex: "PrintedNumber",
      key: "PrintedNumber",

    },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">
            {/* {user.user.Permissions.includes("EditUniversityAssets") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => {
                    handleEditMod(record.UniversityAssetId);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )} */}
            {user.user.Permissions.includes("EditUniversityAssets") && !record.IsScanned && (
              <Tooltip title="طباعه الباركود">
                <Button
                  onClick={() => {
                    handlePrintMod(record.UniversityAssetId);
                  }}
                  icon={<PrinterOutlined />}
                  shape="circle"
                />
              </Tooltip>)}
            {/* {user.user.Permissions.includes("DeleteUniversityAssets") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => {
                  handleDelete(record?.UniversityAssetId);
                }}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="حذف">
                  <Button icon={<DeleteOutlined />} shape="circle" danger />
                </Tooltip>
              </Popconfirm>
            )} */}
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
    const fileName = 'AssetsNotScanned.xlsx';
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
    a.download = 'AssetsNotScanned.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="custom-container">
      <h5 style={{ justifySelf: 'center', marginBottom: '20px' }}>اصول تحتاج الي طباعه </h5>
      <div className="sec-dv">
        <div>

        </div>
        <div className="sp-btwn">

          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

        </div>      </div>

      {/* 
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
            {buildings.map((client) => (
              <Option key={client.BuildingId} value={client.BuildingId}>
                {client.BuildingName}
              </Option>
            ))}
          </Select>
          <Select
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
                {client.UniversityFloorName}
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
                {client.RoomName}
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
      </div> */}
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
    </div>
  );
};

export default UniversityAssetsPrintedPage;
