import React from 'react';
import { useController } from 'react-hook-form';
import { Form, Checkbox } from 'antd';
//import 'antd/dist/reset.css';


const AntdCheckbox: React.FC<any> = ({ control, name, label, validateStatus, errorMsg,change }) => {
  const {
    // field: { ...inputProps }
    field
  } = useController({
    name,
    control
  });

  return (
    <Form.Item help={errorMsg} validateStatus={validateStatus} colon={false}>
      <Checkbox {...field} checked={field.value} onChange={change}>
        {label}
      </Checkbox>
    </Form.Item>
  );
};

export default AntdCheckbox;
