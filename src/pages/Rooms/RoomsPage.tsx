import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import {
  EditOutlined,
  DeleteOutlined,
  AppstoreAddOutlined, PrinterOutlined,
} from "@ant-design/icons";
import { deleteFromApi, getFromApi } from "../../apis/apis";
import {
  Button,
  Pagination,
  Table,
  Tooltip,
  Popconfirm,
  Modal,
  Flex,
  Input,
  Select,
  Grid,
} from "antd";
import RoomsContext from "../../contexts/pages-context/RoomsProvider";
import RoomsForm from "./RoomsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import RoomPrintModal from "./RoomPrintModal";
import RoomAssetsModal from "./RoomAssetsModal";

const { useBreakpoint } = Grid;

const RoomsPage = () => {
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
  } = useContext(RoomsContext);
  const { Option } = Select;
  const { user } = useContext(UserContext);

  // ✅ breakpoints لمعرفة حجم الشاشه
  const screens = useBreakpoint();
  const isMobile = !screens.md; // اقل من 768px

  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");

  const [floors, setFloor] = useState([]);
  const [floorId, setFloorId] = useState("");

  const [suites, setSuites] = useState([]);
  const [suiteId, setSuiteId] = useState("");

  const [assetsModalOpen, setAssetsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  // ✅ State لمودل الطباعه
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printRoomId, setPrintRoomId] = useState<number | null>(null);
  const [printRoomIds, setPrintRoomIds] = useState<number[]>([]);

  // ✅ Selected rows فى الجدول (للطباعه الجماعيه)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // جلب المباني
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await getFromApi(`Building/get-building-ddl?buildingTypeId=2`);
        setBuildings(res);
      } catch (error) { }
    };
    fetchBuildings();
  }, []);

  // جلب الأدوار حسب المبنى
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const res = await getFromApi(
          `UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId ? buildingId : ""}`
        );
        setFloor(res);
      } catch (error) { }
    };
    fetchFloors();
    setFloorId("");
    setSuiteId("");
    setSuites([]);
  }, [buildingId]);

  // جلب الأجنحة حسب الدور
  useEffect(() => {
    if (floorId) {
      const fetchSuites = async () => {
        try {
          const res = await getFromApi(`Suite/get-suite-ddl?floorId=${floorId}`);
          const suitesData = res?.Data || res?.data || res || [];
          setSuites(Array.isArray(suitesData) ? suitesData : []);
        } catch (error) {
          setSuites([]);
        }
      };
      fetchSuites();
    } else {
      setSuites([]);
    }
    setSuiteId("");
  }, [floorId]);

  // جلب الغرف
  useEffect(() => {
    const getAllData = async () => {
      try {
        const resp = await getFromApi(
          `Room/get-all-room-pager?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&keyword=${keyword}&buildingId=${buildingId ? buildingId : ""}&floorId=${floorId ? floorId : ""}&suiteId=${suiteId ? suiteId : ""}`
        );
        setRowData(resp);
      } catch (error) { }
    };
    getAllData();
  }, [pageNumber, pageSize, keyword, detectChanges, floorId, buildingId, suiteId]);

  const handleEditMod = async (TableId) => {
    try {
      const response = await getFromApi(`Room/get-room-by-id?roomId=${TableId}`);
      if (response) {
        setToEdit(response);
        setOpenFormModel(true);
      }
    } catch (error) { }
  };

  const handleDelete = async (TableId) => {
    try {
      setLoading(true);
      await deleteFromApi(`Room/delete-room?roomId=${TableId}`);
      setdetectChanges((prevState) => prevState + 1);
      Store.addNotification({
        title: "",
        message: "تم الحذف بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      setLoading(false);
    } catch (error) {
      Store.addNotification({
        title: "",
        message: "Try again",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      setLoading(false);
    }
  };

  const handleOpenAssetsModal = (record: any) => {
    setSelectedRoom({
      RoomId: record.RoomId,
      RoomName: record.RoomName,
      RoomCode: record.RoomCode,
      UniversityFloorName: record.UniversityFloorName,
      SuiteName: record.SuiteName,
      BuildingName: record.BuildingName,
    });
    setAssetsModalOpen(true);
  };

  const handleCloseAssetsModal = () => {
    setAssetsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleAssetsSaved = () => {
    setdetectChanges((p) => p + 1);
  };

  // طباعة غرفة واحدة (من زرار الصف)
  const handlePrintSingle = (record: any) => {
    setPrintRoomId(record.RoomId);
    setPrintRoomIds([]);
    setPrintModalOpen(true);
  };

  // طباعة الغرف المختاره (من الزرار العلوى)
  const handlePrintBulk = () => {
    if (selectedRowKeys.length === 0) {
      Store.addNotification({
        title: "",
        message: "اختر غرفة أو أكثر للطباعة",
        type: "warning",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: { duration: 2000, onScreen: true },
      });
      return;
    }
    setPrintRoomId(null);
    setPrintRoomIds(selectedRowKeys.map((k) => Number(k)));
    setPrintModalOpen(true);
  };

  const handleClosePrintModal = () => {
    setPrintModalOpen(false);
    setPrintRoomId(null);
    setPrintRoomIds([]);
  };

  const columns = [
    {
      title: "#",
      key: "index",
      render: (item, record, index) => <>{index + 1}</>,
      width: 30,
    },
    { title: "اسم الغرفه", dataIndex: "RoomName", key: "RoomName" },
    { title: "كود الغرفه", dataIndex: "RoomCode", key: "RoomCode" },
    {
      title: "اسم الدور ",
      dataIndex: "UniversityFloorName",
      key: "UniversityFloorName",
      responsive: ["md"] as any, // ✅ يخفى على الموبايل
    },
    {
      title: "كود الدور",
      dataIndex: "UniversityFloorCode",
      key: "UniversityFloorCode",
      responsive: ["lg"] as any,
    },
    {
      title: "الجناح",
      dataIndex: "SuiteName",
      key: "SuiteName",
      render: (val) => val || "-",
      responsive: ["md"] as any,
    },
    {
      title: "اسم المبني ",
      dataIndex: "BuildingName",
      key: "BuildingName",
      responsive: ["lg"] as any,
    },
    {
      title: "كود المبني ",
      dataIndex: "BuildingCode",
      key: "BuildingCode",
      responsive: ["xl"] as any,
    },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      fixed: isMobile ? undefined : ("right" as any),
      width: isMobile ? undefined : 160,
      render: (_, record) => {
        return (
          <div
            className="act-btns"
            style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
          >
            {(user.user.Permissions.includes("AddRoomAssets") ||
              user.user.Permissions.includes("ViewRoomAssets") ||
              user.user.Permissions.includes("EditRooms")) && (
                <Tooltip title="جرد / إنشاء أصول الغرفة">
                  <Button
                    onClick={() => handleOpenAssetsModal(record)}
                    icon={<AppstoreAddOutlined />}
                    shape="circle"
                    style={{
                      background: "#1a56db",
                      color: "#fff",
                      borderColor: "#1a56db",
                    }}
                  />
                </Tooltip>

              )}

            {user.user.Permissions.includes("EditRooms") && (
              <Tooltip title="تعديل">
                <Button
                  onClick={() => handleEditMod(record.RoomId)}
                  icon={<EditOutlined />}
                  shape="circle"
                />
              </Tooltip>

            )}
            <Tooltip title="طباعة لاصق الغرفة">
              <Button
                onClick={() => handlePrintSingle(record)}
                icon={<PrinterOutlined />}
                shape="circle"
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  borderColor: "#16a34a",
                }}
              />
            </Tooltip>
            {user.user.Permissions.includes("DeleteRooms") && (
              <Popconfirm
                title="هل أنت متأكد من الحذف؟"
                onConfirm={() => handleDelete(record?.RoomId)}
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
  };

  const handleshowPage = (e: any) => {
    setPageSize(e);
  };

  const exportToExcel = () => {
    const selectedColumns = columns.slice(1, -1);
    const newResult = [];
    rowData?.Results.forEach((element) => {
      let newObject = {};
      selectedColumns.forEach((col) => {
        newObject[col.title] = element[col.dataIndex];
      });
      newResult.push(newObject);
    });
    const worksheet = XLSX.utils.json_to_sheet(newResult);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "Rooms.xlsx");
  };

  const exportToCSV = () => {
    const selectedColumns = columns.slice(1, -1);
    const csvHeader =
      selectedColumns.map((col) => `"${col.title.replace(/"/g, '""')}"`).join(",") +
      "\n";
    const csvRows = rowData?.Results.map((row) =>
      selectedColumns
        .map((col) => {
          const cell = row[col.dataIndex];
          const cellStr = typeof cell === "string" ? cell.replace(/"/g, '""') : cell;
          return `"${cellStr}"`;
        })
        .join(",")
    ).join("\n");
    const BOM = "\uFEFF";
    const csvContent = BOM + csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rooms.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="custom-container" style={{ padding: isMobile ? 8 : 16 }}>
      {/* ✅ شريط الازرار العلوى - flex-wrap */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        {user.user.Permissions.includes("AddRooms") && (
          <Button
            onClick={() => setOpenFormModel(true)}
            type="primary"
            size={isMobile ? "small" : "middle"}
          >
            + إضافة جديد
          </Button>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* ✅ جديد - زرار طباعة المختار */}
          {user.user.Permissions.includes("PrintRooms") && (
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrintBulk}
              disabled={selectedRowKeys.length === 0}
              type="primary"
              ghost
              size={isMobile ? "small" : "middle"}
            >
              {isMobile
                ? `طباعة (${selectedRowKeys.length})`
                : `طباعة المختار (${selectedRowKeys.length})`}
            </Button>
          )}

          <Button onClick={exportToExcel} size={isMobile ? "small" : "middle"}>
            {isMobile ? "Excel" : "Export to Excel"}
          </Button>
          <Button onClick={exportToCSV} size={isMobile ? "small" : "middle"}>
            {isMobile ? "CSV" : "Export to CSV"}
          </Button>
        </div>
      </div>

      <h5
        style={{
          textAlign: "center",
          marginBottom: "16px",
          fontSize: isMobile ? 16 : 18,
        }}
      >
        الغرف
      </h5>

      {/* ✅ الفلاتر - grid responsive بدل sp-btwn */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Input
          type="text"
          placeholder="ابحث باسم الغرفه او كود الغرفه"
          onChange={handleSearch}
          allowClear
        />

        <Select
          allowClear
          placeholder="اختر المبني"
          value={buildingId || undefined}
          onChange={(val) => setBuildingId(val || "")}
          style={{ width: "100%" }}
        >
          {buildings.map((client) => (
            <Option key={client.BuildingId} value={client.BuildingId}>
              {client.BuildingName} - {client.BuildingCode}
            </Option>
          ))}
        </Select>

        <Select
          allowClear
          placeholder="اختر الدور"
          value={floorId || undefined}
          onChange={(val) => setFloorId(val || "")}
          style={{ width: "100%" }}
        >
          {floors.map((client) => (
            <Option
              key={client.UniversityFloorId}
              value={client.UniversityFloorId}
            >
              {client.UniversityFloorName} - {client.UniversityFloorCode}
            </Option>
          ))}
        </Select>

        {floorId && suites.length > 0 && (
          <Select
            allowClear
            placeholder="اختر الجناح (اختياري)"
            value={suiteId || undefined}
            onChange={(val) => setSuiteId(val || "")}
            style={{ width: "100%" }}
          >
            {suites.map((suite) => (
              <Option key={suite.SuiteId} value={suite.SuiteId}>
                {suite.SuiteNameAr} - {suite.SuiteCode}
              </Option>
            ))}
          </Select>
        )}

        <Flex gap="4px" align="center" justify={isMobile ? "flex-start" : "flex-end"}>
          <span>SHOW</span>
          <Select
            defaultValue={"50"}
            onChange={handleshowPage}
            style={{ width: 100 }}
          >
            <Option value="10">10</Option>
            <Option value="20">20</Option>
            <Option value="50">50</Option>
            <Option value="100">100</Option>
            <Option value="200">200</Option>
          </Select>
        </Flex>
      </div>

      {/* ✅ الجدول - scroll x اوتوماتيكى */}
      <Table
        columns={columns as any}
        dataSource={rowData?.Results}
        pagination={false}
        loading={loading}
        scroll={{ x: "max-content" }}
        size={isMobile ? "small" : "middle"}
        rowKey={(r: any) => r.RoomId}
        // ✅ جديد - rowSelection
        rowSelection={
          user.user.Permissions.includes("PrintRooms")
            ? {
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              // الـ checkbox يبقى ثابت لما نـ scroll
              fixed: true,
            }
            : undefined
        }
      />
      <Pagination
        pageSize={pageSize}
        style={{
          justifyContent: "center",
          display: "flex",
          marginTop: 16,
          flexWrap: "wrap",
        }}
        pageSizeOptions={[10, 20, 50, 100, 200]}
        size={isMobile ? "small" : "default"}
        simple={isMobile}
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

      {/* مودل اضافة/تعديل غرفه - responsive */}
      {openFormModel && (
        <Modal
          width={isMobile ? "95%" : "52%"}
          open={openFormModel}
          title={toEdit ? "تعديل  الغرفه" : "اضافة غرفه"}
          footer={false}
          onCancel={handleCloseFormModel}
          onOk={handleCloseFormModel}
          centered
        >
          <RoomsForm />
        </Modal>
      )}

      {/* ✅ مودل جرد/إنشاء أصول الغرفه */}
      <RoomAssetsModal
        open={assetsModalOpen}
        room={selectedRoom}
        onClose={handleCloseAssetsModal}
        onSaved={handleAssetsSaved}
      />
      <RoomPrintModal
        open={printModalOpen}
        onClose={handleClosePrintModal}
        roomId={printRoomId}
        roomIds={printRoomIds}
      />
    </div>
  );
};

export default RoomsPage;