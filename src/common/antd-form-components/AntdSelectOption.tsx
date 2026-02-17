import React from "react";
import { useController } from "react-hook-form";
import { Form, Select } from "antd";

interface Props {
  control?: any;
  name?: any;
  setValue?: any;
  label?: any;
  placeholder?: any;
  options?: any;
  validateStatus?: any;
  defaultValue?: any;
  errorMsg?: any;
  maxLength?: any;
  showCount?: any;
  formClassName?: any;
  disable?: any;
  style?: any;
}

const AntdSelectOption: React.FC<Props> = ({
  control,
  name,
  label,
  placeholder,
  setValue,
  validateStatus,
  errorMsg,
  options,
  formClassName,
  disable,
  style,
  defaultValue
}) => {
  const {
    // field: { ...inputProps }
    field,
  } = useController({
    name,
    control,
  });
  const { Option } = Select;

  const hanldeClear = () => {
    setValue(name, "");
  };
  const onSearch = (value: any) => {
    ////console.log("🚀 ~ onSearch ~ value:", value)

  }
  return (
    <Form.Item label={label} help={errorMsg} validateStatus={validateStatus} style={style} >
      <Select
        onClear={hanldeClear}
        showSearch
        // onChange={field.onChange}
        // onChange={(e) => {
        //   ////console.log("🚀 ~ e:", e)

        //   }}
        // onBlur={field.onBlur}
        optionFilterProp="label"
        onSearch={onSearch}
        {...field}
        placeholder={placeholder}
        size="large"
        allowClear
        defaultValue={defaultValue}
        disabled={disable}
        getPopupContainer={() =>
          document.querySelector(`.${formClassName}`) as HTMLElement
        }
        options={options.map((op: any, index: any) => ({ label: op.title, value: String(op.value) }))}
      >
        {/* {options?.length > 0 &&
          options.map((op: any, index: any) => (
            <Option key={index} value={String(op.value)}>
              {op.label}
            </Option>
          ))} */}
      </Select>
    </Form.Item>
  );
};

export default AntdSelectOption;
