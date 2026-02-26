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

import CategoryContext from "../../contexts/pages-context/CategoryProvider";
import UserContext from "../../contexts/user-context/UserProvider";

import BasicInformationContext from "../../contexts/pages-context/BasicInformationProvider";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import CategoryForm from "./CategoryForm";
import { Store } from "react-notifications-component";
const { Option } = Select;

const CategoryPage = () => {

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
          `Category/get-category-ddl?BuildingTypeId=${selectedBuildingTypeId ? selectedBuildingTypeId : ""}`
        );
        setCategories(res);
        // Reset category selection when building type changes
        setSelectedCategoryId("");
      } catch (error) {
        //console.log(error);
      }
    };
    fetchCategories();
  }, [selectedBuildingTypeId]);
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
  } = useContext(CategoryContext);
  const { user } = useContext(UserContext);

  // --- UPDATED: Added selectedBuildingTypeId and selectedCategoryId to dependencies ---
  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `AssetType/get-all-AssetType-pager?isActive=true&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&categoryId=${selectedCategoryId ? selectedCategoryId : ""}`
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
    try {
      const response = await getFromApi(
        `AssetType/get-assetType-by-id?categoryId=${TableId}`
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
        `AssetType/delete-assetType?categoryId=${TableId}`
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
    { title: "نوع الأصل", dataIndex: "AssetTypeName", key: "AssetTypeName" },
    { title: "كود نوع الأصل", dataIndex: "AssetTypeCode", key: "AssetTypeCode" },
    { title: "تصنيف الأصل(المحور)", dataIndex: "CategoryName", key: "CategoryName" },
    { title: "اسم الجامعه ", dataIndex: "UniversityName", key: "UniversityName" },
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
                    handleEditMod(record.AssetTypeId);
                  }}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>
            )}

            {user.user.Permissions.includes("DeleteCategory") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => {
                  handleDelete(record?.AssetTypeId);
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

  return (
    <div className="custom-container">
      <div className="sec-dv">
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

      <div className="sub-table">
        <h5 style={{ justifySelf: "center", marginBottom: "20px" }}>
          تصنيف الاصول
        </h5>

        <div className="sp-btwn">
          {/* Search Input */}
          <Input
            type="text"
            placeholder="ابحث بالاسم (نوع الأصل) او كود  تصنيف الاصول"
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
          <Select
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
          />

          {/* NEW: Category filter - dynamic based on BuildingTypeId */}
          <Select
            allowClear
            placeholder="تصنيف الأصل"
            value={selectedCategoryId || undefined}
            onChange={(value) => {
              setSelectedCategoryId(value ?? "");
            }}
            style={{ width: 250 }}
            disabled={!selectedBuildingTypeId}
          >
            {categories?.map((item) => (
              <Option key={item.CategoryId} value={item.CategoryId}>
                {item.CategoryName}
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
          title={toEdit ? "تعديل  تصنيف الاصول" : "اضافة تصنيف الاصول"}
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

export default CategoryPage;