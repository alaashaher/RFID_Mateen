import { useEffect, useState } from "react";
import { Card, Table, Form, Select, DatePicker, Button, Space, Tag, Row, Col, Typography, Tooltip, Empty} from "antd";
import { SearchOutlined, ReloadOutlined, HistoryOutlined, ArrowLeftOutlined, EnvironmentOutlined} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { getFromApi } from "../../apis/apis";
import "./RelocationHistory.scss";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// ============ Types ============
interface RelocationHistoryDto {
  RelocationId: number;
  UniversityAssetId: number;
  UniversityAssetName?: string;

  OldBuildingId?: number;
  OldBuildingName?: string;
  OldFloorId?: number;
  OldFloorName?: string;
  OldSuiteId?: number;
  OldSuiteName?: string;
  OldRoomId?: number;
  OldRoomName?: string;

  NewBuildingId?: number;
  NewBuildingName?: string;
  NewFloorId?: number;
  NewFloorName?: string;
  NewSuiteId?: number;
  NewSuiteName?: string;
  NewRoomId?: number;
  NewRoomName?: string;

  RelocationDate: string;
  RelocationNotes?: string;
  CreatedByUserId?: string;
  CreatedByUserName?: string;
}

interface PagedResult<T> {
  TotalCount: number;
  PageNumber: number;
  PageSize: number;
  Items: T[];
}

interface LookupItem {
  id: number;
  name: string;
}

interface FiltersState {
  BuildingId?: number;
  floorId?: number;
  dateRange?: [Dayjs, Dayjs];
}

// ============ Component ============
const RelocationHistory: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RelocationHistoryDto[]>([]);
  const [TotalCount, setTotalCount] = useState(0);
  const [PageNumber, setPageNumber] = useState(1);
  const [PageSize, setPageSize] = useState(50);

  const [Buildings, setBuildings] = useState<LookupItem[]>([]);
  const [floors, setFloors] = useState<LookupItem[]>([]);
  const [filters, setFilters] = useState<FiltersState>({});

  // ============ Load Lookups ============
  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      const res = await getFromApi("Building/get-relocationBuilding-ddl");
      const Items = (res?.data || res || []).map((b: any) => ({
        id: b.BuildingId,
        name: b.BuildingName,
      }));
      setBuildings(Items);
    } catch {
      setBuildings([]);
    }
  };

  const loadFloorsByBuilding = async (BuildingId: number) => {
    try {
      const res = await getFromApi(
        `UniversityFloor/get-universityFloor-ddl-by-buildingid?buildingId=${BuildingId}`
      );
      const Items = (res?.data || res || []).map((f: any) => ({
        id: f.UniversityFloorId,
        name: f.UniversityFloorName,
      }));
      setFloors(Items);
    } catch {
      setFloors([]);
    }
  };

  // ============ Load History ============
  const loadHistory = async (
    page = PageNumber,
    size = PageSize,
    currentFilters = filters
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("PageNumber", String(page));
      params.append("PageSize", String(size));

      if (currentFilters.BuildingId)
        params.append("BuildingId", String(currentFilters.BuildingId));
      if (currentFilters.floorId)
        params.append("FloorId", String(currentFilters.floorId));
      if (currentFilters.dateRange?.[0])
        params.append(
          "FromDate",
          currentFilters.dateRange[0].format("YYYY-MM-DD")
        );
      if (currentFilters.dateRange?.[1])
        params.append(
          "ToDate",
          currentFilters.dateRange[1].format("YYYY-MM-DD")
        );

      const res: PagedResult<RelocationHistoryDto> = await getFromApi(
        `UniversityAsset/get-relocation-history?${params.toString()}`
      );

      setData(res?.Items || []);
      setTotalCount(res?.TotalCount || 0);
      setPageNumber(res?.PageNumber || 1);
      setPageSize(res?.PageSize || 50);
    } catch (err) {
      console.error(err);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1, PageSize, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Handlers ============
  const handleBuildingChange = (value?: number) => {
    form.setFieldValue("floorId", undefined);
    setFloors([]);
    if (value) loadFloorsByBuilding(value);
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newFilters: FiltersState = {
      BuildingId: values.BuildingId,
      floorId: values.floorId,
      dateRange: values.dateRange,
    };
    setFilters(newFilters);
    setPageNumber(1);
    loadHistory(1, PageSize, newFilters);
  };

  const handleReset = () => {
    form.resetFields();
    setFloors([]);
    setFilters({});
    setPageNumber(1);
    loadHistory(1, PageSize, {});
  };

  // ============ Helpers ============
  const formatLocation = (
    Building?: string,
    floor?: string,
    suite?: string,
    room?: string
  ) => {
    const parts = [Building, floor, suite, room].filter(Boolean);
    if (parts.length === 0) return <Text type="secondary">—</Text>;
    return (
      <div className="location-cell">
        {parts.map((p, i) => (
          <span key={i} className="location-part">
            {i > 0 && <span className="sep">/</span>}
            {p}
          </span>
        ))}
      </div>
    );
  };

  // ============ Columns ============
  const columns: ColumnsType<RelocationHistoryDto> = [
    {
      title: "#",
      dataIndex: "RelocationId",
      key: "RelocationId",
      width: 70,
      align: "center",
      render: (id: number) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: "الأصل",
      dataIndex: "UniversityAssetName",
      key: "UniversityAssetName",
      width: 200,
      render: (name?: string, record) => (
        <div>
          <div className="asset-name">{name || "—"}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ID: {record.UniversityAssetId}
          </Text>
        </div>
      ),
    },
    {
      title: (
        <span>
          <EnvironmentOutlined /> من (الموقع القديم)
        </span>
      ),
      key: "oldLocation",
      width: 280,
      render: (_, r) =>
        formatLocation(
          r.OldBuildingName,
          r.OldFloorName,
          r.OldSuiteName,
          r.OldRoomName
        ),
    },
    {
      title: "",
      key: "arrow",
      width: 50,
      align: "center",
      render: () => (
        <ArrowLeftOutlined style={{ color: "#1890ff", fontSize: 18 }} />
      ),
    },
    {
      title: (
        <span>
          <EnvironmentOutlined /> إلى (الموقع الجديد)
        </span>
      ),
      key: "newLocation",
      width: 280,
      render: (_, r) =>
        formatLocation(
          r.NewBuildingName,
          r.NewFloorName,
          r.NewSuiteName,
          r.NewRoomName
        ),
    },
    {
      title: "تاريخ النقل",
      dataIndex: "RelocationDate",
      key: "RelocationDate",
      width: 150,
      render: (d: string) => (
        <div>
          <div>{dayjs(d).format("YYYY-MM-DD")}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(d).format("HH:mm")}
          </Text>
        </div>
      ),
    },
    {
      title: "بواسطة",
      dataIndex: "CreatedByUserName",
      key: "CreatedByUserName",
      width: 140,
      render: (name?: string) => name || <Text type="secondary">—</Text>,
    },
    {
      title: "ملاحظات",
      dataIndex: "RelocationNotes",
      key: "RelocationNotes",
      ellipsis: true,
      render: (notes?: string) =>
        notes ? (
          <Tooltip title={notes}>
            <span>{notes}</span>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  // ============ Render ============
  return (
    <div className="relocation-history-page">
      <Card
        className="header-card"
        bordered={false}
        title={
          <Space>
            <HistoryOutlined style={{ fontSize: 20, color: "#1890ff" }} />
            <Title level={4} style={{ margin: 0 }}>
              سجل نقل الأصول
            </Title>
          </Space>
        }
      >
        <Text type="secondary">
          عرض تاريخ حركة الأصول بين المبانى، الأدوار، والغرف
        </Text>
      </Card>

      {/* Filters */}
      <Card className="filters-card" bordered={false}>
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="BuildingId" label="المبنى">
                <Select
                  placeholder="كل المبانى"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={handleBuildingChange}
                  options={Buildings.map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item name="floorId" label="الدور">
                <Select
                  placeholder="كل الأدوار"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  disabled={floors.length === 0}
                  options={floors.map((f) => ({
                    value: f.id,
                    label: f.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={8}>
              <Form.Item name="dateRange" label="نطاق التاريخ">
                <RangePicker
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                  placeholder={["من تاريخ", "إلى تاريخ"]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={4}>
              <Form.Item label=" ">
                <Space style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={loading}
                  >
                    بحث
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    إعادة تعيين
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Table */}
      <Card className="table-card" bordered={false}>
        <div className="table-header">
          <Text strong>
            عدد النتائج: <Tag color="blue">{TotalCount}</Tag>
          </Text>
        </div>

        <Table
          rowKey="RelocationId"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="لا توجد سجلات نقل"
              />
            ),
          }}
          pagination={{
            current: PageNumber,
            pageSize: PageSize,
            total: TotalCount,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} من ${total} سجل`,
            pageSizeOptions: ["50", "100"],
            onChange: (page, size) => {
              setPageNumber(page);
              setPageSize(size);
              loadHistory(page, size, filters);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default RelocationHistory;
