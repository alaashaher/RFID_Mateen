import React from 'react'
import { useEffect } from 'react';
import { deleteFromApi, getFromApi } from '../../apis/apis';
import { EnvironmentOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined} from "@ant-design/icons";
import { Button, Input, Pagination, Select, Table, Tooltip, Popconfirm, Modal, Flex, Tabs } from "antd";
import type { TabsProps } from 'antd';
import PermissionForm from './PermissionForm'
import { useContext } from "react";
import { Store } from 'react-notifications-component';
import PermissionContext from '../../contexts/pages-context/PermissionProvider';

const PermissionPage = () => {

  const { keyword, setkeyword,
    pageSize, setPageSize,
    rowData, setRowData,

    toEdit, setToEdit,
    openedModal, setOpenedModal,
    detectChanges, setDetectChanges,

    loadingData, setLoadingData,
    page, setPage,
    viewRSTData, setViewRSTData,
    opndPermissionModal, setOpndPermissionModal,
    itmId, setItmId,
    babOrSanf, setBabOrSanf
  } = useContext(PermissionContext);

  const { Option } = Select;

  useEffect(() => {
    const getPermission = async () => {
      try {
        const res = await getFromApi(`Permission/get-all-permission-pager?isActive=true&pageSize=${pageSize}&currentPage=${page}&keyword=${keyword}`);

        setRowData(res);
      } catch (error) { setLoadingData(false); //console.log(error) 
        }
    }; getPermission();
  }, [page, pageSize, keyword, detectChanges])

  const columns = [
    { title: "اسم الصلاحية بالانجليزى", dataIndex: "PermissionName", key: "PermissionName" },
    { title: "اسم الصلاحية بالعربى", dataIndex: "PermissionNameAr", key: "PermissionNameAr" },
    { title: "اسم الصفحة بالانجليزى", dataIndex: "PageName", key: "PageName" },
    { title: "اسم الصفحة بالعربى", dataIndex: "PageNameAr", key: "PageNameAr" },
    {
      title: 'مفعل',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (_: any, record: any) => {
        if (record.IsActive) {
          return (
            <div>
              <CheckOutlined />
            </div>
          )
        } else {
          return (
            <div>
              <CloseOutlined />
            </div>
          )
        }
      }
    },
    {
      title: 'اجراءات',
      dataIndex: 'actions',
      key: 'actions',
      render: (_: any, record: any) => {
        return (
          <div className='actions-btns'>
             <Tooltip title='تعديل'>
              <Button icon={<EditOutlined />} onClick={() => { setOpenedModal(true); setToEdit(record); }} />
            </Tooltip>
            
<Popconfirm title="هل انت متأكد من الحذف؟"
              okText="نعم"
              cancelText="لا"
              onConfirm={() => handleDelete(record.PermissionId)}
            >
              <Tooltip title='حذف'>
              <Button icon={<DeleteOutlined />} shape="circle" danger />
              </Tooltip>
            </Popconfirm>

             
          
          </div>
        )
      }
    },
        
    
  ]

  const handleSearch = (e: any) => {

    setkeyword(e.target.value);
    //console.log(keyword);
  }
  const handleshowPage = (e: any) => {

    setPageSize(e);
    //console.log(pageSize);
  }

  const handleCloseFormModel = () => {
    setOpenedModal(false);
    setToEdit(null);
    };

  const handleDelete = async (PermissionId: any) => {
    try {
      var res = await deleteFromApi(`Permission/delete-permission?permissionId=${PermissionId}`);
      setDetectChanges((prevState: any) => prevState + 1);
      if(res == true){
      Store.addNotification({
        title: "",
        message: "تم الحذف بنجاح",
        type: "success",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 3000,
          onScreen: true
        }
      }); }
      else  {
        Store.addNotification({
          title: "",
          message: "لا يمكن حذف المستخدم مرتبط",
          type: 'warning',
          insert: 'top',
          container: 'center',
          animationIn: ["animate__animated", "animate__fadeIn"],
          animationOut: ["animate__animated", "animate__fadeOut"],
          dismiss: {
            duration: 5000,
            onScreen: true
          }
        });
      }
    } catch (error) {
      Store.addNotification({
        title: "  ",
        message: "الرجاء المحاولة مره اخرى",
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
      //console.log(error)
    }
  }
  const tabsPermission: TabsProps['items'] = [
    {
      key: '1',
      label: ' اضافة صلاحية',
      children: <PermissionForm />,

    }
  ];
  return (
    <div className="custom-container">
        <div className='dsp-flx'>
          <Flex
            gap="3px">
            <p className="header-title">  عرض الصلاحيات  </p>
            <EnvironmentOutlined />
          </Flex>
      </div>
        <div className="sec-dv">
        <Button onClick={() => { setOpenedModal(true); }}> + إضافة جديد </Button>
      </div>
             
        <div className='sp-btwn'>
          <div className='sp-btwn'>
            <Flex
              gap="4px"
              align='center'>
              <Input type='text' placeholder='ابحث باسم الصلاحية' onChange={(e) => handleSearch(e)} />
              <span> </span>
            </Flex>

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
        <Table columns={columns} dataSource={rowData?.Results} pagination={false} loading={loadingData} scroll={{ x: 600 }} />
        <Pagination
          pageSize={pageSize}
          style={{ justifyContent: "center", display: "flex", marginTop: "20px", }}
          pageSizeOptions={[10, 20, 50, 100, 200]}
          onChange={(page, pageSize) => { setPage(page); setPageSize(pageSize); }}
          total={ rowData && rowData?.PageCount ? rowData?.PageCount * rowData?.PageSize : 1 }
          current={page}
        />
      </div>
      {openedModal && (
  <Modal
    open={openedModal}
   title={toEdit ? "تعديل صلاحية" : "اضافة صلاحية"}
    footer={false}
    onCancel={handleCloseFormModel}
    onOk={handleCloseFormModel}
  >
    <PermissionForm />
  </Modal>
)}

    </div>

  )
}

export default PermissionPage