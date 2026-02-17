import React from 'react';
import { useController } from 'react-hook-form';
import { Form, Radio } from 'antd';

const AntdRadioGroup: React.FC<any> = ({
  control,
  name,
  label,
  validateStatus,
  errorMsg,
  radios,
  defaultValue,
  isRadioButton,
  className,
  style,
}) => {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue,
  });

  return (
    <Form.Item
      label={label}
      help={errorMsg}
      validateStatus={validateStatus}

    >
      <Radio.Group
        defaultValue={defaultValue}
        onChange={onChange}
        size="large"
        buttonStyle="solid"
        style={style}
      >
        {radios?.length &&
          radios.map((radio: any, index: number) =>
            isRadioButton ? (
              <Radio.Button key={index} value={radio.value}>
                {radio.title}
              </Radio.Button>
            ) : (
              <Radio key={index} value={radio.value} >
                {radio.title}
              </Radio>
            )
          )}
      </Radio.Group>
    </Form.Item>
  );
};

export default AntdRadioGroup;
