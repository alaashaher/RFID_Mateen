import React, { useContext, useEffect, useState } from "react";
import { Store } from "react-notifications-component";
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, PrinterOutlined, FileDoneOutlined } from "@ant-design/icons";
import { deleteFromApi, getFromApi, postToApi, putToApi } from "../../apis/apis";
import {
  Button,
  Pagination,
  Table,
  Tooltip,
  Popconfirm,
  Modal,
  Tabs, Flex, Input, Select,
  Form,
  Row,
  Col
} from "antd";
import { useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import UniversityAssetsForm from "./UniversityAssetsForm";
import UserContext from "../../contexts/user-context/UserProvider";
import UniversityAssetsScannedContext from "../../contexts/pages-context/UniversityAssetsProviderScanned";
import Chart from 'react-apexcharts'
import AntdSelectOption from "../../common/antd-form-components/AntdSelectOption";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
    isActive,
  } = useContext(UniversityAssetsScannedContext);
  const { user } = useContext(UserContext);
  const { Option } = Select;
  const [buildings, setBuildings] = useState([]);
  const [buildingId, setBuildingId] = useState("");

  const [tempKeyWord, setTempKeyWord] = useState("");
  const [floorId, setFloorId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [charts, setCharts] = useState([]);
  // const { Option } = Select;
  // const [buildings, setBuildings] = useState([]);
  // const [buildingId, setBuildingId] = useState("");

  const [floors, setFloor] = useState([]);
  // const [floorId, setFloorId] = useState("");
  // const [rooms, setRooms] = useState([]);
  // const [roomId, setRoomId] = useState("");
  const defaultValues = {
    RoomId: "",
    FloorId: "",
    BuildingId: ""
  };
  const schema = Yup.object().shape(
    {
      RoomId: Yup.string(),
      BuildingId: Yup.string(),
      FloorId: Yup.string(),
    }
  );
  const [form] = Form.useForm();
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    // console.log("🚀 ~ useEffect ~ keyword:", keyword)
    if (keyword !== "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-byRoomCode?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&roomCode=${keyword}`
          );
          setRowData(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    } else if (getValues("RoomId") !== "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-byRoomCode?isActive=${isActive}&pageSize=${pageSize}&currentPage=${pageNumber}&roomId=${getValues("RoomId")}`
          );
          setRowData(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    }
    return () => {
      setkeyword("")
      setRowData([]);
    };
  }, [pageNumber, pageSize, keyword, detectChanges, watch("RoomId")]);
  useEffect(() => {
    if (keyword !== "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-Statistics-byRoom?roomCode=${keyword}`
          );
          setCharts(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    } else if (getValues("RoomId") !== "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `UniversityAsset/get-all-universityAsset-Statistics-byRoom?roomId=${getValues("RoomId")}`
          );
          setCharts(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    }
  }, [watch("RoomId"), keyword]);
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
    setValue("RoomId", "");

    if (getValues("FloorId") != "") {
      const getAllData = async () => {
        try {
          const resp = await getFromApi(
            `Room/get-room-ddl?floorId=${getValues("FloorId") ? getValues("FloorId") : ""}`
          );
          setRooms(resp);
        } catch (error) {
          //console.log(error);
        }
      };
      getAllData();
    }
  }, [watch("FloorId")]);
  useEffect(() => {
    setValue("FloorId", "");
    if (getValues("BuildingId") != "") {
      const fetchLanguages = async () => {
        try {
          const res = await getFromApi(`UniversityFloor/get-universityFloor-ddl?buildingId=${getValues("BuildingId") ? getValues("BuildingId") : ""}`);
          setFloor(res);
        } catch (error) {
          //console.log(error);
        }
      };
      fetchLanguages();
    }
  }, [watch("BuildingId")]);
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

  const handleFindAssest = async (TableId) => {
    try {
      setLoading(true);
      await putToApi(
        `RFID/Asset-IsExist?assetId=${TableId}`, null
      );
      setdetectChanges((prevState) => prevState + 1);
      Store.addNotification({
        title: "",
        message: "تم التاكيد بنجاح",
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


  useEffect(() => {
    localStorage.removeItem("UniversityAssetsAdjustment")

  }, [])
  const handleRelocation = async (TableId) => {
    try {
      // const response = await getFromApi(
      //   `UniversityAsset/get-universityAsset-by-id?universityAssetId=${TableId}`
      // );
      // if (response) {
      setToEdit(TableId);
      setOpenFormModel(true);
      // }
    } catch (error) {
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
      title: 'مقروء',
      dataIndex: 'IsScanned',
      key: 'IsScanned',
      render: (_: any, record: any) => {
        if (record.IsScanned) {
          return (
            <div>
              <CheckOutlined style={{ color: 'green', fontSize: '30px' }} />
            </div>
          )
        } else {
          return (
            <div>
              <CloseOutlined style={{ color: 'red', fontSize: '30px' }} />
            </div>
          )
        }
      }
    },
    {
      title: 'موجود ولكن غير مقروء',
      dataIndex: 'ExistButNotScanned',
      key: 'ExistButNotScanned',
      render: (_: any, record: any) => {
        if (record.ExistButNotScanned) {
          return (
            <div>
              <CheckOutlined style={{ color: 'green', fontSize: '30px' }} />
            </div>
          )
        } else {
          return (
            <div>
              {/* <CloseOutlined style={{ color: 'red', fontSize: '30px' }} /> */}
            </div>
          )
        }
      }
    },
    // { title: " باركود الاصل", dataIndex: "AssetBarcode", key: "AssetBarcode" },
    // { title: " كود الاصل ", dataIndex: "AssetCode", key: "AssetCode" },
    // { title: " الصنف  ", dataIndex: "Product", key: "Product" },
    // { title: "اسم الغرفه", dataIndex: "RoomName", key: "RoomName" },
    // { title: "اسم الدور ", dataIndex: "UniversityFloorName", key: "UniversityFloorName" },
    // { title: "اسم المبني ", dataIndex: "BuildingName", key: "BuildingName" },
    {
      title: "إجراءات",
      dataIndex: "Actions",
      key: "Actions",
      render: (_, record) => {
        return (
          <div className="act-btns">
            {!record.IsScanned && (
              <>
                {user.user.Permissions.includes("PrintUniversityAssetsScanned")  && !record.IsScanned && record.ExistButNotScanned  && (
                  <Tooltip title="طباعه الباركود">
                    <Button
                      onClick={() => {
                        handlePrintMod(record.UniversityAssetId);
                      }}
                      icon={<PrinterOutlined />}
                      shape="circle"
                    />
                  </Tooltip>
                )}
                {/* {user.user.Permissions.includes("FoundUniversityAssetsScanned") && !record.IsScanned && !record.ExistButNotScanned && (
                  <Popconfirm
                    title="هل أنت متأكد من تاكيد وجود الاصل"
                    onConfirm={() => {
                      handleFindAssest(record?.UniversityAssetId);
                    }}
                    okText="نعم"
                    cancelText="لا"
                  >
                    <Tooltip title="تاكيد وجود الاصل">
                      <Button icon={<FileDoneOutlined />} shape="circle" danger />
                    </Tooltip>
                  </Popconfirm>
                )} */}
                {/* {user.user.Permissions.includes("RelocationUniversityAssetsScanned") && (
                  <Tooltip title="اعادة تسكين">
                    <Button
                      onClick={() => {
                        handleRelocation(record);
                      }}
                      icon={<EditOutlined />}
                      shape="circle"
                    />
                  </Tooltip>
                )} */}
              </>
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

    setTempKeyWord(e.target.value);
    //console.log(keyword);
  }
  const handleshowPage = (e: any) => {

    setPageSize(e);
    //console.log(pageSize);
  }
  var state = {

    series: [
      {
        name: 'العدد الكلي',
        data: charts ? charts?.map((itemm: any) => itemm.TotalCount) : []
      }, {
        name: 'المقروءه',
        data: charts ? charts?.map((itemm: any) => itemm.ScannedCount) : []
      }, {
        name: 'غير المقروءه',
        data: charts ? charts?.map((itemm: any) => itemm.NotScannedCount) : []
      }
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5,
          borderRadiusApplication: 'end'
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: charts ? charts?.map((item: any) => item.UniversityAssetName) : [],
      },
      yaxis: {
        title: {
          text: ''
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "" + val + ""
          }
        }
      }
    },


  }

  const onFinish = async (data) => {

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
    const fileName = 'AdjustmentResult.xlsx';
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
    a.download = 'AdjustmentResult.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="custom-container">


      <h5 style={{ justifySelf: 'center', marginBottom: '20px' }}>نتائج الجرد</h5>

      <div className="sp-btwn">
        <div></div>
        <div className="sp-btwn">

          <Button onClick={exportToExcel} style={{ marginBottom: 16 }}>Export to Excel</Button>
          <Button onClick={exportToCSV} style={{ marginBottom: 16 }}>Export to CSV</Button>

        </div>
      </div>
      <div className='sp-btwn '>
        <div className='sp-btwn header-page'>
          <Flex
            gap="4px"
            align='center'>
            <Input type='text' placeholder='ابحث بكود الغرفه ' value={tempKeyWord} onChange={(e) => handleSearch(e)} />
            <span> </span>
          </Flex>
          <Button
            onClick={() => {
              if (tempKeyWord.length >= 6) {
                setkeyword(tempKeyWord);
                setValue("RoomId", "");
                setValue("FloorId", "");
                setValue("BuildingId", "");
              }
            }}
          >
            بحث
          </Button>
        </div>
        {/* <div className='sp-btwn'>
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

        </div> */}
      </div>
      <div className='form-dix'>
        <div className=''>
          <Form form={form} onFinish={handleSubmit(onFinish)} className="custom-form">
            <Row style={{ display: "flex" }} gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8} >

                <AntdSelectOption
                  control={control}
                  name="BuildingId"
                  setValue={setValue}
                  formClassName="custom-form"
                  errorMsg={errors.BuildingId?.message}
                  label={<span>  المبني<span style={{ color: '#252627' }}>*</span></span>}
                  placeholder=" المبني"
                  options={buildings?.map((item) => ({ title: `${item.BuildingName} - ${item.BuildingCode}`, value: item.BuildingId }))}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8} >
                <AntdSelectOption
                  control={control}
                  name="FloorId"
                  setValue={setValue}
                  formClassName="custom-form"
                  errorMsg={errors.FloorId?.message}
                  label={<span>  الدور<span style={{ color: '#252627' }}>*</span></span>}
                  placeholder=" الدور"
                  options={floors?.map((item) => ({ title: `${item.UniversityFloorName} - ${item.UniversityFloorCode}`, value: item.UniversityFloorId }))}
                />
              </Col>
              <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8} >
                <AntdSelectOption
                  control={control}
                  setValue={setValue}
                  name="RoomId"
                  formClassName="custom-form"
                  errorMsg={errors.RoomId?.message}
                  label={<span>  الغرفه<span style={{ color: '#252627' }}>*</span></span>}
                  placeholder=" الغرفه"
                  options={rooms?.map((item) => ({ title: `${item.RoomName} - ${item.RoomCode}`, value: item.RoomId }))}
                />
              </Col>
            </Row>

          </Form>

        </div>
        <div className='sp-btwn div'>
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
      {rowData?.Results ?

        <Chart options={state.options} series={state.series} type="bar" height={350} /> : <></>
      }
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

export default UniversityAssetsPage;
