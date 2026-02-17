import React from 'react'
import { useEffect } from 'react';
import { deleteFromApi, getFromApi } from '../../apis/apis';
import { EnvironmentOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined} from "@ant-design/icons";
import { Button, Input, Pagination, Select, Table, Tooltip, Popconfirm, Modal, Flex, Tabs } from "antd";
import type { TabsProps } from 'antd';
import UserForm from './UserForm'
import { useContext } from "react";
import { Store } from 'react-notifications-component';
import UsersContext from '../../contexts/pages-context/UsersProvider';
import UserContext from "../../contexts/user-context/UserProvider";


const Users = () => {

  const { keyword, setkeyword,
    pageSize, setPageSize,
    rowData, setRowData,

    toEdit, setToEdit,
    openedModal, setOpenedModal,
    detectChanges, setDetectChanges,

    loadingData, setLoadingData,
    page, setPage,
    viewRSTData, setViewRSTData,
    opndUserModal, setOpndUserModal,
    itmId, setItmId,
    babOrSanf, setBabOrSanf
  } = useContext(UsersContext);

  const { Option } = Select;
  const { user } = useContext(UserContext);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await getFromApi(`Users/get-all-users-pager?isActive=true&pageSize=${pageSize}&currentPage=${page}&keyword=${keyword}`);

        setRowData(res);
      } catch (error) { setLoadingData(false); 
        // //console.log(error) 
      }
    }; getUsers();
  }, [page, pageSize, keyword, detectChanges])

  const columns = [
    {
      title: 'اسم المستخدم',
      dataIndex: 'User',
      key: 'User',
      render: (_: any, record: any) => {
        return (
          <div> {record.User.UserName}
            
          </div>
        )
    }
    },
    {
      title: 'الايميل',
      dataIndex: 'User',
      key: 'User',
      render: (_: any, record: any) => {
        return (
          <div> {record.User.Email}
            
          </div>
        )
    }
    },
    {
      title: 'الرقم الوظيفى فى أودو',
      dataIndex: 'User',
      key: 'User',
      render: (_: any, record: any) => {
        return (
          <div> {record.User.OdooJobNumber}
            
          </div>
        )
    }
    },
    {
      title: 'رقم التليفون',
      dataIndex: 'User',
      key: 'User',
      render: (_: any, record: any) => {
          return (
            <div> {record.User.PhoneNumber}
              
            </div>
          )
      }
    },
    {
      title: 'الصلاحية',
      dataIndex: 'RoleName',
      key: 'RoleName',
    },
    {
      title: 'مفعل',
      dataIndex: 'User',
      key: 'User',
      render: (_: any, record: any) => {
        if (record.User.IsActive) {
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
          <div className='actions-btns act-btns'>
            {user.user.Permissions.includes("EditUsers") && (
             <Tooltip title='تعديل'>
              <Button icon={<EditOutlined />} onClick={() => { setOpenedModal(true); setToEdit(record); }} />
            </Tooltip>
            )}
             {user.user.Permissions.includes("DeleteUsers") && (
<Popconfirm title="هل انت متأكد من الحذف؟"
              okText="نعم"
              cancelText="لا"
              onConfirm={() => handleDelete(record.User.UserId)}
            >
              <Tooltip title='حذف'>
              <Button icon={<DeleteOutlined />} shape="circle" danger />
              </Tooltip>
            </Popconfirm>
             )}
             
          
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

  const handleDelete = async (UserId: any) => {
    try {
      var res = await deleteFromApi(`Users/delete-user?userId=${UserId}`);
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
  const tabsUsers: TabsProps['items'] = [
    {
      key: '1',
      label: ' اضافة مستخدم',
      children: <UserForm />,

    }
  ];
  return (
    <div className="custom-container">
        <div className='dsp-flx'>
          <Flex
            gap="3px">
            <p className="header-title">  عرض المستخدمين  </p>
            <EnvironmentOutlined />
          </Flex>
      </div>
        <div className="sec-dv">
        {user.user.Permissions.includes("AddUsers") && (
        <Button onClick={() => { setOpenedModal(true); }}> + إضافة جديد </Button>
        )}
      </div>
             
        <div className='sp-btwn'>
          <div className='sp-btwn'>
            <Flex
              gap="4px"
              align='center'>
              <Input type='text' placeholder='ابحث باسم المستخدم' onChange={(e) => handleSearch(e)} />
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
   title={toEdit ? "تعديل مستخدم" : "اضافة مستخدم"}
    footer={false}
    onCancel={handleCloseFormModel}
    onOk={handleCloseFormModel}
  >
    <UserForm />
  </Modal>
)}

    </div>

  )
}

export default Users