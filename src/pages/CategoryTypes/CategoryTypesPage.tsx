import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { EditOutlined, DeleteOutlined, EyeFilled, PlusCircleFilled, SettingOutlined } from "@ant-design/icons";
import { deleteFromApi, getFromApi } from "../../apis/apis";
import {
  Button,
  Pagination,
  Table,
  Tooltip,
  Popconfirm,
  Modal,
  Tabs,
  Row,
  Col,
  Flex,
  Input,
} from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import UserContext from "../../contexts/user-context/UserProvider";

import BasicInformationContext from "../../contexts/pages-context/BasicInformationProvider";
import CategoryTypesContext from "../../contexts/pages-context/CategoryTypesProvider";
import CategoryForm from "./CategoryForm";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
const CategoryTypesPage = () => {


  const [selectedCatType, setSelectedCatTypeId] = useState("");


  const {
    rowData,
    setRowData,



    setToEdit,
    pageSize,
    setPageSize,
    pageNumber,
    setPageNumber,
    keyword,
    setkeyword,
    setOpenFormModel,
    loading,
    toEdit,
    detectChanges,
    openFormModel,
    setLoading,
    setdetectChanges,

    isActive
  } = useContext(CategoryTypesContext);


  const { user } = useContext(UserContext);

  useEffect(() => {

    setRowData(null);

  }, []);
  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `Category/get-all-categoryType-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}`
        );
        setRowData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges]);



  const handleEditMod = async (TableId) => {
    try {
      const response = await getFromApi(
        `Category/get-category-type-by-id?categoryId=${TableId}`
      );
      if (response) {
        setToEdit(response);
        setOpenFormModel(true);
      }
    } catch (error) {
      //console.log(error);
    }
  };

  const handleDelete = async (TableId: number) => {
    try {
      setLoading(true);
      await deleteFromApi(
        `Category/delete-category-type?categoryId=${TableId}`
      );
      setdetectChanges((prevState: number) => prevState + 1);
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
        title: "  ",
        message: "Try again",
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
    { title: "اسم نوع الصنف", dataIndex: "CategoryName", key: "CategoryName" },
    // { title: "وصف الصنف", dataIndex: "CategoryTypesDesc", key: "CategoryTypesDesc" },
    // { title: "اسم الجامعه ", dataIndex: "UniversityName", key: "UniversityName" },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">
            {user.user.Permissions.includes("EditCategoryTypes") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => {
                    handleEditMod(record.CategoryId);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}

            {user.user.Permissions.includes("DeleteCategoryTypes") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => {
                  handleDelete(record?.CategoryId);
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
    // 
  ];

  const handleCloseFormModel = () => {
    setOpenFormModel(false);
    setToEdit(null);
  };
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
    const fileName = 'categoryTypes.xlsx';
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
    a.download = 'categoryTypes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="custom-container">
      <div className="sec-dv sp-btwn">
        {user?.user?.Permissions.includes("AddCategoryTypes") && (
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




      <div className="sub-table">
        <h5 style={{ justifySelf: 'center' }}>الانواع الرئيسية</h5>
        <div className='sp-btwn'>
          <Input type='text' placeholder='ابحث باسم النوع الرئيسي' onChange={(e) => setkeyword(e.target.value)} />
        </div>

        <Table
          columns={columns}
          dataSource={rowData?.Results}
          pagination={false}
          loading={loading}
          scroll={{ x: 200 }}


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
              ? "تعديل نوع الصنف"
              : "اضافة نوع  الصنف"
          }
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <CategoryForm />
        </Modal>
      )}


    </div>
  );
};

export default CategoryTypesPage;