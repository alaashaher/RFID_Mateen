import { useController } from 'react-hook-form';
import { Form, Checkbox } from 'antd';

const AntdCheckbox = ({ control, name, label, validateStatus, errorMsg }) => {
  const {
    // field: { ...inputProps }
    field
  } = useController({
    name,
    control
  });

  return (
    <Form.Item help={errorMsg} validateStatus={validateStatus} colon={false}>
      <Checkbox {...field} checked={field.value}>
        {label}
      </Checkbox>
    </Form.Item>
  );
};

export default AntdCheckbox;
