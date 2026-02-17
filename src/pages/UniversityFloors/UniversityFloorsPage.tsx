import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { deleteFromApi, getFromApi } from "../../apis/apis";
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
import UniversityFloorsForm from "./UniversityFloorsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import UniversityFloorsContext from "../../contexts/pages-context/UniversityFloorsProvider";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
const UniversityFloorsPage = () => {
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
  } = useContext(UniversityFloorsContext);
  const { user } = useContext(UserContext);
  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");


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
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `UniversityFloor/get-all-universityFloor-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&buildingId=${buildingId ? buildingId : ""}`
        );
        setRowData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges, buildingId]);

  const handleEditMod = async (TableId) => {
    try {
      const response = await getFromApi(
        `UniversityFloor/get-universityFloor-by-id?universityFloorId=${TableId}`
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
        `UniversityFloor/delete-universityFloor?universityFloorId=${TableId}`
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

  const columns = [
    {
      title: "#",
      key: "index",
      render: (item, record, index) => <>{index + 1}</>,
      width: 30,
    },
    {
      title: "اسم الدور",
      dataIndex: "UniversityFloorName",
      key: "UniversityFloorName",
    },
    {
      title: "كود الدور",
      dataIndex: "UniversityFloorCode",
      key: "UniversityFloorCode",
    },
    { title: "اسم المبني ", dataIndex: "BuildingName", key: "BuildingName" },

    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">

            {user.user.Permissions.includes("EditUniversityFloors") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => {
                    handleEditMod(record.UniversityFloorId);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}
            {user.user.Permissions.includes("DeleteUniversityFloors") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => {
                  handleDelete(record?.UniversityFloorId);
                }}
                okText="نعم"
                cancelText="لا"
              >
                <Tooltip title="حذف">
                  <Button icon={<DeleteOutlined />} shape="circle" danger />
                </Tooltip>
              </Popconfirm>
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
    const fileName = 'Floors.xlsx';
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
    a.download = 'Floors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="custom-container">
      <div className="sec-dv sp-btwn">
        {user.user.Permissions.includes("AddUniversityFloors") && (
          <Button
            onClick={() => {
              setOpenFormModel(true);
            }}
          >
            + إضافة جديد
          </Button>
        )}
        <div className="sp-btwn">

          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

        </div>
      </div>
      {/* <Tabs
        defaultActiveKey={selectedLanguage}
        onChange={(key) => setSelectedLanguage(key)}
      >
        {allLanguage.map((lang) => (
          <Tabs.TabPane tab={lang.LanguageName} key={lang.LanguageCode} />
        ))}
      </Tabs> */}
      <h5 style={{ justifySelf: 'center', marginBottom: '20px' }}> الادوار</h5>

      <div className='sp-btwn'>
        <div className='sp-btwn'>
          <Flex
            gap="4px"
            align='center'>
            <Input type='text' style={{ width: 530 }} placeholder='ابحث باسم الدور او كود الدور' onChange={(e) => handleSearch(e)} />
            <span> </span>
          </Flex>
          <Select
            allowClear
            placeholder="اختر المبني"
            onChange={setBuildingId}
            style={{ width: 230 }}
          >
            {buildings.map((client) => (
              <Option key={client.BuildingId} value={client.BuildingId}>
                {client.BuildingName} - {client.BuildingCode}
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
              ? "تعديل دور"
              : "اضافة دور"
          }
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <UniversityFloorsForm />
        </Modal>
      )}
    </div>
  );
};

export default UniversityFloorsPage;
