import React from "react";
import { useController } from "react-hook-form";
import { AutoComplete, Form, Input } from "antd";
interface Props {
  control?: any;
  name?: any;
  type?: any;
  label?: any;
  placeholder?: any;
  prefix?: any;
  validateStatus?: any;
  defaultValue?: any;
  errorMsg?: any;
  disabled?: any;
  autoComplete?: any;
  accept?: any;
  step?: any;
  onChange?: any;
  showCount?: any;
  maxLength?: any;
}
const AntdTextField: React.FC<Props> = ({
  control,
  name,
  type,
  label,
  placeholder,
  prefix,
  validateStatus,
  defaultValue,
  errorMsg,
  disabled,
  autoComplete,
  accept,
  step,
  onChange,
  showCount,
  maxLength
}) => {
  const {
    field,
  } = useController({
    name,
    control,
  });

  return (
    <Form.Item
      label={label}
      help={errorMsg}
      validateStatus={validateStatus}
      colon={false}
    >
      <Input
        {...field}
        placeholder={placeholder}
        prefix={prefix}
        type={type}
        size="large"
        readOnly={disabled}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        accept={accept}
        step={step}
        showCount={showCount}
        maxLength={maxLength}
        
      // autoComplete="off"
      // onChange={onChange}
      // value={defaultValue ? defaultValue : field.value}
      />
    </Form.Item>
  );
};

export default AntdTextField;
