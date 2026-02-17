import React from "react";
import { useController } from "react-hook-form";
import { Form, Input } from "antd";

const AntdTextarea: React.FC<any> = ({
  name,
  maxLength,
  rows,
  label,
  placeholder,
  prefix,
  showCount,
  validateStatus,
  errorMsg,
  control,
  disable,
  height
}) => {
  const { TextArea } = Input;
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
      <TextArea
        {...field}
        disabled={disable}
        rows={rows}
        showCount={showCount}
        maxLength={maxLength}
        placeholder={placeholder}
        prefix={prefix}
        style={{ height: height }}
      />
    </Form.Item>
  );
};

export default AntdTextarea;
