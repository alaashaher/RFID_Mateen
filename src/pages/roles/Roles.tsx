import React from 'react'
import { useEffect,useState } from 'react';
import { deleteFromApi, getFromApi } from '../../apis/apis';
import { EnvironmentOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined,SettingOutlined,KeyOutlined , CheckOutlined, CloseOutlined} from "@ant-design/icons";
import { Button, Input, Pagination, Select, Table, Tooltip, Popconfirm, Modal, Flex, Tabs } from "antd";
import type { TabsProps } from 'antd';
import RoleForm from './RoleForm'
import { useContext } from "react";
import { Store } from 'react-notifications-component';
import RolesContext from '../../contexts/pages-context/RolesProvider';
import PermissionSelectModal from './PermissionSelectModal';
import UserContext from "../../contexts/user-context/UserProvider";


const Roles = () => {

  const { keyword, setkeyword,
    pageSize, setPageSize,
    rowData, setRowData,
    toEdit, setToEdit,
    openedModal, setOpenedModal,
    detectChanges, setDetectChanges,
    loadingData, setLoadingData,
    page, setPage,
    viewRSTData, setViewRSTData,
    opndRoleModal, setOpndRoleModal,
    itmId, setItmId,
    babOrSanf, setBabOrSanf
  } = useContext(RolesContext);

  const { Option } = Select;
  const { user } = useContext(UserContext);

  const [permissions, setPermissions] = useState([]);
  const [RoleId, setRoleId] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isPermissionModalVisible, setPermissionModalVisible] = useState(false);  useEffect(() => {
    const getRoles = async () => {
      try {
        const res = await getFromApi(`Roles/get-roles-pager?isActive=true&pageSize=${pageSize}&currentPage=${page}&keyword=${keyword}`);

        setRowData(res);
      } catch (error) { setLoadingData(false); //console.log(error) 
        }
    }; getRoles();
  }, [page, pageSize, keyword, detectChanges])

  const fetchPermissions = async () => {
    const response = await getFromApi('Roles/get-all-permissions');
    setPermissions(response);
  };

  const handlePermissionClick = async (roleId) => {
    const response = await getFromApi(
      `Roles/get-role-permissions?roleId=${roleId}`
    );
    setRoleId(roleId);
    fetchPermissions();
    setSelectedPermissions(response); 
    setPermissionModalVisible(true);
  };

  const handleSavePermissions = (newPermissions) => {
    setDetectChanges((prevState) => prevState + 1);
    setPermissionModalVisible(false);
  };
  const columns = [
    {
      title: 'اسم الصلاحية',
      dataIndex: 'Name',
      key: 'Name',
    },
    {
      title: 'اجراءات',
      dataIndex: 'actions',
      key: 'actions',
      render: (_: any, record: any) => {
        return (
          <div className='actions-btns act-btns'>
            {user.user.Permissions.includes("SetPermissionsRoles") && (
             <Tooltip title='الصلاحيات'>
            <Button icon={<KeyOutlined />} onClick={() => handlePermissionClick(record.Id)} />
          </Tooltip>
           )}
           {user.user.Permissions.includes("EditRoles") && (
             <Tooltip title='تعديل'>
              <Button icon={<EditOutlined />} onClick={() => { setOpenedModal(true); setToEdit(record); }} />
            </Tooltip>
           )}
           {user.user.Permissions.includes("DeleteRoles") && (
            <Popconfirm title="هل انت متأكد من الحذف؟"
              okText="نعم"
              cancelText="لا"
              onConfirm={() => handleDelete(record.Id)}
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

  const handleDelete = async (Id: any) => {
    try {
      var res = await deleteFromApi(`Roles/delete-role?roleId=${Id}`);
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
      });
    }
    else  {
      Store.addNotification({
        title: "",
        message: "لا يمكن حذف الصلاحية مرتبطة بمستخدمين!",
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
  const tabsRoles: TabsProps['items'] = [
    {
      key: '1',
      label: ' اضافة صلاحية',
      children: <RoleForm />,

    }
  ];

  return (
    <div className="custom-container">
        <div className='dsp-flx'>
          <Flex
            gap="3px">
            <p className="header-title">  عرض الصلاحيات</p>
            <EnvironmentOutlined />
          </Flex>
        </div>
        <div className="sec-dv">
        {user.user.Permissions.includes("AddRoles") && (
        <Button onClick={() => { setOpenedModal(true); }}> + إضافة جديد </Button>
        )}
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
    <RoleForm />
  </Modal>
)}
 <PermissionSelectModal
        visible={isPermissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        permissions={permissions}
        RoleId={RoleId}
        selectedPermissions={selectedPermissions}
      />

    </div>

  )
}

export default Roles