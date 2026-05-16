import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  getFromApi,
  postToApi,
  putToApi,
  deleteFromApi,
} from "../../apis/apis";
import "./Suites.scss";

// ============== Types (PascalCase - matches Backend response) ==============
interface Building {
  BuildingId: number;
  BuildingName: string;
  BuildingCode?: string;
  BuildingTypeId?: number;
}

interface Floor {
  UniversityFloorId: number;
  UniversityFloorName: string;
  UniversityFloorCode?: string;
  BuildingId?: number;
}

interface Suite {
  Id: number;
  UniversityFloorId: number;
  UniversityFloorName: string;
  BuildingId: number;
  BuildingName: string;
  SuiteCode: string;
  SuiteNameAr: string;
  SuiteNameEn?: string | null;
  IsActive: boolean;
  CreatedAt?: string;
}

interface SuiteFormValues {
  UniversityFloorId: number;
  SuiteNameAr: string;
  SuiteNameEn?: string;
  IsActive?: boolean;
}

// ============== Helper: Extract array from response ==============
const extractArray = <T,>(response: any): T[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.Data)) return response.Data;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.Data?.Data)) return response.Data.Data;
  if (Array.isArray(response.Result)) return response.Result;
  if (Array.isArray(response.result)) return response.result;
  console.warn("Unexpected response shape:", response);
  return [];
};

// ============== Helper: Read flag from response (Success / success) ==============
const isSuccess = (res: any): boolean => {
  if (!res) return false;
  if (res.Success === true || res.success === true) return true;
  if (res.Success === false || res.success === false) return false;
  return true;
};

const getMessage = (res: any): string => {
  return res?.Message || res?.message || "";
};

// ============== Helper: Load floors by building from API ==============
const loadFloorsByBuilding = async (buildingId: number): Promise<Floor[]> => {
  try {
    const res = await getFromApi(
      `UniversityFloor/get-universityFloor-ddl?buildingId=${buildingId}`
    );
    return extractArray<Floor>(res);
  } catch (error) {
    console.error("Failed to load floors for building:", error);
    return [];
  }
};

const Suites = () => {
  // ============== State ==============
  const [suites, setSuites] = useState<Suite[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredFloors, setFilteredFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterBuildingId, setFilterBuildingId] = useState<number | null>(null);
  const [filterFloorId, setFilterFloorId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<Suite | null>(null);
  const [form] = Form.useForm<SuiteFormValues>();
  const [modalBuildingId, setModalBuildingId] = useState<number | null>(null);
  const [modalFloors, setModalFloors] = useState<Floor[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ============== Initial Load ==============
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [suitesRes, buildingsRes] = await Promise.all([
        getFromApi("Suite/get-all-suites").catch(() => null),
        getFromApi("Building/get-building-ddl").catch(() => null),
      ]);

      setSuites(extractArray<Suite>(suitesRes));
      setBuildings(extractArray<Building>(buildingsRes));
    } catch (error) {
      message.error("فشل تحميل البيانات");
      console.error("Load error:", error);
      setSuites([]);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  // ============== Floor Filtering Logic ==============
  // ✅ جلب أدوار المبنى المختار من الـ Backend
  useEffect(() => {
    if (filterBuildingId) {
      loadFloorsByBuilding(filterBuildingId).then((floorsForBuilding) => {
        setFilteredFloors(floorsForBuilding);
      });
      setFilterFloorId(null);
    } else {
      setFilteredFloors([]);
      setFilterFloorId(null);
    }
  }, [filterBuildingId]);

  const filteredSuites = (Array.isArray(suites) ? suites : []).filter((s) => {
    if (filterBuildingId && s.BuildingId !== filterBuildingId) return false;
    if (filterFloorId && s.UniversityFloorId !== filterFloorId) return false;
    if (searchText) {
      const lower = searchText.toLowerCase();
      return (
        s.SuiteNameAr?.toLowerCase().includes(lower) ||
        s.SuiteCode?.toLowerCase().includes(lower)
      );
    }
    return true;
  });

  // ============== Modal Handlers ==============
  const openAddModal = () => {
    setEditingSuite(null);
    setModalBuildingId(null);
    setModalFloors([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (suite: Suite) => {
    setEditingSuite(suite);
    setModalBuildingId(suite.BuildingId);

    // ✅ جلب أدوار المبنى من الـ Backend
    const floorsForBuilding = await loadFloorsByBuilding(suite.BuildingId);
    setModalFloors(floorsForBuilding);

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSuite(null);
    setModalBuildingId(null);
    setModalFloors([]);
    form.resetFields();
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingSuite) {
        form.setFieldsValue({
          UniversityFloorId: editingSuite.UniversityFloorId,
          SuiteNameAr: editingSuite.SuiteNameAr,
          SuiteNameEn: editingSuite.SuiteNameEn || undefined,
          IsActive: editingSuite.IsActive,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isModalOpen, editingSuite, form]);

  const handleModalBuildingChange = async (BuildingId: number) => {
    setModalBuildingId(BuildingId);
    form.setFieldValue("UniversityFloorId", undefined);

    // ✅ جلب أدوار المبنى من الـ Backend
    const floorsForBuilding = await loadFloorsByBuilding(BuildingId);
    setModalFloors(floorsForBuilding);
  };

  // ============== Submit ==============
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingSuite) {
        const payload = {
          Id: editingSuite.Id,
          UniversityFloorId: values.UniversityFloorId,
          SuiteNameAr: values.SuiteNameAr,
          SuiteNameEn: values.SuiteNameEn || null,
          IsActive: values.IsActive ?? true,
        };
        const res = await putToApi("Suite/update-suite", payload);
        if (isSuccess(res)) {
          message.success("تم تعديل الجناح بنجاح");
          closeModal();
          loadInitialData();
        } else {
          message.error(getMessage(res) || "فشل التعديل");
        }
      } else {
        const payload = {
          UniversityFloorId: values.UniversityFloorId,
          SuiteNameAr: values.SuiteNameAr,
          SuiteNameEn: values.SuiteNameEn || null,
        };
        const res = await postToApi("Suite/add-suite", payload);
        if (isSuccess(res)) {
          message.success("تم إضافة الجناح بنجاح");
          closeModal();
          loadInitialData();
        } else {
          message.error(getMessage(res) || "فشل الإضافة");
        }
      }
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error("حدث خطأ");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ============== Delete ==============
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteFromApi(`Suite/delete-suite?id=${id}`);
      if (isSuccess(res)) {
        message.success("تم حذف الجناح");
        loadInitialData();
      } else {
        message.error(getMessage(res) || "فشل الحذف");
      }
    } catch (err) {
      message.error("حدث خطأ أثناء الحذف");
    }
  };

  // ============== Table Columns ==============
  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_: any, __: Suite, index: number) => index + 1,
    },
    {
      title: "كود الجناح",
      dataIndex: "SuiteCode",
      key: "SuiteCode",
      width: 110,
      render: (code: string) => <strong className="suite-code">{code}</strong>,
    },
    {
      title: "اسم الجناح",
      dataIndex: "SuiteNameAr",
      key: "SuiteNameAr",
    },
    {
      title: "المبنى",
      dataIndex: "BuildingName",
      key: "BuildingName",
    },
    {
      title: "الدور",
      dataIndex: "UniversityFloorName",
      key: "UniversityFloorName",
    },
    {
      title: "الحالة",
      dataIndex: "IsActive",
      key: "IsActive",
      width: 100,
      render: (active: boolean) => (
        <span className={`status-badge ${active ? "active" : "inactive"}`}>
          {active ? "مفعّل" : "غير مفعّل"}
        </span>
      ),
    },
    {
      title: "إجراءات",
      key: "actions",
      width: 160,
      render: (_: any, record: Suite) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
          >
            تعديل
          </Button>
          <Popconfirm
            title="تأكيد الحذف"
            description="هل أنت متأكد من حذف هذا الجناح؟"
            okText="نعم"
            cancelText="إلغاء"
            onConfirm={() => handleDelete(record.Id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============== Render ==============
  return (
    <div className="suites-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>إدارة الأجنحة</h2>
          <p className="subtitle">
            الأجنحة هي تقسيمات داخل الأدوار (اختيارية حسب المبنى)
          </p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openAddModal}
        >
          إضافة جناح جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <Select
          placeholder="فلترة بالمبنى"
          allowClear
          value={filterBuildingId}
          onChange={(val) => setFilterBuildingId(val ?? null)}
          style={{ width: 220 }}
          options={buildings
            .filter((b) => b && b.BuildingId != null)
            .map((b) => ({
              key: b.BuildingId,
              value: b.BuildingId,
              label: b.BuildingName,
            }))}
        />
        <Select
          placeholder="فلترة بالدور"
          allowClear
          value={filterFloorId}
          onChange={(val) => setFilterFloorId(val ?? null)}
          disabled={!filterBuildingId}
          style={{ width: 200 }}
          options={filteredFloors
            .filter((f) => f && f.UniversityFloorId != null)
            .map((f) => ({
              key: f.UniversityFloorId,
              value: f.UniversityFloorId,
              label: f.UniversityFloorName,
            }))}
        />
        <Input
          placeholder="بحث بالاسم أو الكود"
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260 }}
        />
        <Button icon={<ReloadOutlined />} onClick={loadInitialData}>
          تحديث
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredSuites}
        rowKey="Id"
        loading={loading}
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `إجمالي: ${total} جناح`,
        }}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingSuite ? "تعديل الجناح" : "إضافة جناح جديد"}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingSuite ? "حفظ التعديلات" : "إضافة"}
        cancelText="إلغاء"
        width={520}
        forceRender
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ IsActive: true }}
          preserve={false}
        >
          <Form.Item label="المبنى" required>
            <Select
              placeholder="اختر المبنى"
              value={modalBuildingId}
              onChange={handleModalBuildingChange}
              disabled={!!editingSuite}
              options={buildings
                .filter((b) => b && b.BuildingId != null)
                .map((b) => ({
                  key: b.BuildingId,
                  value: b.BuildingId,
                  label: b.BuildingName,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="الدور"
            name="UniversityFloorId"
            rules={[{ required: true, message: "اختر الدور" }]}
          >
            <Select
              placeholder="اختر الدور"
              disabled={!modalBuildingId || !!editingSuite}
              options={modalFloors
                .filter((f) => f && f.UniversityFloorId != null)
                .map((f) => ({
                  key: f.UniversityFloorId,
                  value: f.UniversityFloorId,
                  label: f.UniversityFloorName,
                }))}
            />
          </Form.Item>

          <Form.Item
            label="اسم الجناح"
            name="SuiteNameAr"
            rules={[
              { required: true, message: "أدخل اسم الجناح" },
              { max: 100, message: "الحد الأقصى 100 حرف" },
            ]}
          >
            <Input placeholder="مثال: الجناح الشرقي" />
          </Form.Item>

          {editingSuite && (
            <Form.Item
              label="الحالة"
              name="IsActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="مفعّل" unCheckedChildren="غير مفعّل" />
            </Form.Item>
          )}

          {!editingSuite && (
            <div className="info-note">
              💡 سيتم توليد كود الجناح تلقائياً حسب الترتيب في الدور
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Suites;