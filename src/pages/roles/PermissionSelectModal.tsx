import React, { useEffect, useState } from 'react';
import { Modal,Button, Checkbox, List } from 'antd';
import { postToApi, putToApi } from '../../apis/apis.tsx';
import { Store } from 'react-notifications-component';


const PermissionSelectModal = ({ visible, onCancel, permissions,RoleId, selectedPermissions }) => {
  const [checkedPermissions, setCheckedPermissions] = useState(selectedPermissions || []);

  useEffect(() => {
    setCheckedPermissions(selectedPermissions.map((perm) => perm.PermissionId));
  }, [selectedPermissions]);
  
  const handleCheck = (permissionId) => {
    setCheckedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = () => {
    const allPermissions = permissions.flatMap(group => group.Permissions.map(p => p.PermissionId));
    setCheckedPermissions((prev) =>
      prev.length === allPermissions.length ? [] : allPermissions
    );
  };

  const handleSelectByPageName = (group) => {
    const groupPermissionIds = group.Permissions.map(permission => permission.PermissionId);
    const isGroupChecked = groupPermissionIds.every(id => checkedPermissions.includes(id));

    setCheckedPermissions((prev) =>
      isGroupChecked
        ? prev.filter(id => !groupPermissionIds.includes(id))
        : [...prev, ...groupPermissionIds.filter(id => !prev.includes(id))]
    );
  };
  const handleSave = async () => {
    try {
      let values;
      values = {
      roleId: RoleId,
      permissionIds: checkedPermissions
    }
      //console.log('values obj', values);
      await putToApi('Roles/assign-permissions-to-role', values);
        Store.addNotification({
          title: "",
          message: "تم التعديل",
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

      } catch (error) {
        //console.log(error)
        Store.addNotification({
          title: "  ",
          message: "الرجاء المحاولة مرة اخرى",
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
      }
}
  return (
    <Modal
      title="تحديد الصلاحيات"
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
      footer={[
        <Button key="select-all" onClick={handleSelectAll}>تحديد الكل</Button>,
        <Button key="save" type="primary" onClick={handleSave}>Save</Button>
      ]}
    >
      <div style={{ marginBottom: '10px' }}>
        <Checkbox
          checked={checkedPermissions.length === permissions.flatMap(group => group.Permissions).length}
          indeterminate={checkedPermissions.length > 0 && checkedPermissions.length < permissions.flatMap(group => group.Permissions).length}
          onChange={handleSelectAll}
        >
          تحديد الكل
        </Checkbox>
      </div>
      <hr/>
      {permissions.map((group) => (
        <div key={group.PageName} style={{ marginTop: '15px' }}>
          <h4>
            <Checkbox
              checked={group.Permissions.every(permission => checkedPermissions.includes(permission.PermissionId))}
              indeterminate={
                group.Permissions.some(permission => checkedPermissions.includes(permission.PermissionId)) &&
                !group.Permissions.every(permission => checkedPermissions.includes(permission.PermissionId))
              }
              onChange={() => handleSelectByPageName(group)}
            >
              {group.Permissions[0].PageNameAr}
            </Checkbox>
          </h4>
          <List
            dataSource={group.Permissions}
            renderItem={(permission) => (
              <List.Item>
                <Checkbox
                  checked={checkedPermissions.includes(permission.PermissionId)}
                  onChange={() => handleCheck(permission.PermissionId)}
                >
                  {permission.PermissionNameAr}
                </Checkbox>
              </List.Item>
            )}
          />
        </div>
      ))}
    </Modal>
  );
};

export default PermissionSelectModal;
