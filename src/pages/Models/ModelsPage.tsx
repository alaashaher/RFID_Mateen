import { useContext, useEffect, useState } from "react";

import { deleteFromApi, getFromApi } from "../../apis/apis";
import {
  Pagination,
  Table,
  Input,
  Select,
  Button,
  Tooltip,
  Modal,
  Popconfirm,
} from "antd";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import UserContext from "../../contexts/user-context/UserProvider";

import BasicInformationContext from "../../contexts/pages-context/BasicInformationProvider";
import { CheckCircleFilled, CloseCircleFilled, DeleteOutlined, EditOutlined, EyeFilled } from "@ant-design/icons";
import ModelsForm from "./ModelsForm";
import { Store } from "react-notifications-component";
import {  useNavigate } from "react-router-dom";
import RouterLinks from "../../App/RouterLinks";
const { Option } = Select;

const ModelsPage = () => {
const navigate = useNavigate();
  const [categoryType, setcategoryType] = useState([]);
  const [selectedCatType, setSelectedCatTypeId] = useState("");

  // --- NEW STATES ---
  const [selectedBuildingTypeId, setSelectedBuildingTypeId] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  // ------------------

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    const fetchCategoryTypes = async () => {
      const resp = await getFromApi(`CategoryType/get-categoryType-ddl`);
      setcategoryType(resp);
    };
    fetchCategoryTypes();
  }, []);

  // --- NEW: Fetch categories when BuildingTypeId changes ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getFromApi(
          `AssetType/get-assetType-ddl`
        );
        setCategories(res);
        // Reset category selection when building type changes
        setSelectedCategoryId("");
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCategories();
  }, []);
  // ---------------------------------------------------------

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
    setModelFilter,
    modelFilter
  } = useContext(CategoryContext);
  const { user } = useContext(UserContext);

  // --- UPDATED: Added selectedBuildingTypeId and selectedCategoryId to dependencies ---
  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `AssetModel/get-all-assetModel-pager?isActive=true&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&assetTypeId=${selectedCategoryId ? selectedCategoryId : ""}`
        );
        setRowData(resp);
      } catch (error) {
        //console.log(error);
      }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges, selectedCatType, selectedBuildingTypeId, selectedCategoryId]);
  // ------------------------------------------------------------------------------------

  const handleEditMod = async (TableId) => {
    // try {
    //   const response = await getFromApi(
    //     `AssetModel/get-assetModel-by-id?assetTypeId=${TableId}`
    //   );
    //   if (response) {
    setToEdit(TableId);
    setOpenFormModel(true);
    //   }
    // } catch (error) {
    //   //console.log(error);
    // }
  };

  const handleDelete = async (TableId: number) => {
    try {
      setLoading(true);
      await deleteFromApi(
        `AssetModel/delete-assetModel?categoryId=${TableId}`
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
    { title: "رقم الموديل", dataIndex: "AssetModelId", key: "AssetModelId" },
    { title: "كود نوع الصنف", dataIndex: "AssetTypeId", key: "AssetTypeId" },
    { title: "اسم الموديل", dataIndex: "ModelName", key: "ModelName" },
    { title: "رقم الموديل", dataIndex: "ModelNumber", key: "ModelNumber" },
    { title: "الماركة", dataIndex: "Brand", key: "Brand" },
    
    { title: "نوع الصنف ", dataIndex: "AssetTypeName", key: "AssetTypeName" },
    { title: "كمية الموديل ", dataIndex: "AssetTotalCount", key: "AssetTotalCount" },
    { title: "هل له أصول؟", dataIndex: "HasAssets", key: "HasAssets",
      render: (_,value) => {
        return value.HasAssets ? <CheckCircleFilled /> : <CloseCircleFilled style={{color:"red"}} />;
      }
     },
     { title: "نفس عدد الاصول؟", dataIndex: "HasSameCount", key: "HasSameCount",
      render: (_,value) => {
        return value.HasSameCount ? <CheckCircleFilled /> : <CloseCircleFilled style={{color:"red"}} />;
      }
     },
    { title: "نوع اللاصق ", dataIndex: "TagType", key: "TagType" },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">
            {user.user.Permissions.includes("EditCategory") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => {
                    handleEditMod(record);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}
            <Tooltip title="عرض تفاصيل الاصول">
              <Button
                onClick={() => {
                  setModelFilter(record);
                  navigate(RouterLinks.UniversityAssets);
                }}
                icon={<EyeFilled />}
                shape="circle"
              />
            </Tooltip>
            {user.user.Permissions.includes("DeleteCategory") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => {
                  handleDelete(record?.AssetModelId);
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
    const fileName = 'Models.xlsx';
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
    a.download = 'Models.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="custom-container">
      <div className="sec-dv sp-btwn">
        <div>

          {user?.user?.Permissions.includes("AddCategory") && (
            <Button
              onClick={() => {
                setOpenFormModel(true);
              }}
            >
              + إضافة جديد
            </Button>
          )}
        </div>
        <div className="sp-btwn">

          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

        </div>
      </div>

      <div className="sub-table">
        <h5 style={{ justifySelf: "center", marginBottom: "20px" }}>
          الموديلات
        </h5>

        <div className="sp-btwn">
          {/* Search Input */}
          <Input
            type="text"
            placeholder="ابحث بالاسم (الموديل) او كود  الموديل "
            onChange={(e) => setkeyword(e.target.value)}
          />

          {/* OLD: CategoryType filter - kept as is */}
          {/* <Select
            allowClear
            placeholder="اختر نوع الفئة"
            onChange={setSelectedCatTypeId}
            style={{ width: 530 }}
          >
            {categoryType.map((client) => (
              <Option key={client.CategoryTypeId} value={client.CategoryTypeId}>
                {client.CategoryTypeName}
              </Option>
            ))}
          </Select> */}

          {/* NEW: BuildingType filter - 2 static options */}
          {/* <Select
            allowClear
            placeholder="اختر نوع مبنى الأصل"
            onChange={(value) => {
              setSelectedBuildingTypeId(value ?? "");
            }}
            style={{ width: 250 }}
            options={[
              { label: "مستودع", value: 1 },
              { label: "مبني إداري", value: 2 },
            ]}
          /> */}

          {/* NEW: Category filter - dynamic based on BuildingTypeId */}
          <Select
            allowClear
            placeholder="اصناف الاصول"
            value={selectedCategoryId || undefined}
            onChange={(value) => {
              setSelectedCategoryId(value ?? "");
            }}
            style={{ width: 250 }}
          // disabled={!selectedBuildingTypeId}
          >
            {categories?.map((item) => (
              <Option key={item.AssetTypeId} value={item.AssetTypeId}>
                {item.AssetTypeName}
              </Option>
            ))}
          </Select>
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
          title={toEdit ? "تعديل الموديل" : "اضافة الموديل"}
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
        >
          <ModelsForm />
        </Modal>
      )}
    </div>
  );
};

export default ModelsPage;