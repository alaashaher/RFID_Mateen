import React, { useState, useEffect, useCallback } from 'react';
import { useController } from 'react-hook-form';
import { Form, Select } from 'antd';

const AntdSelectOptionMulti = ({
  control,
  name,
  label,
  placeholder,
  setValue,
  validateStatus,
  errorMsg,
  options: initialOptions,
  formClassName,
  valueKey = 'value', // Default value key
  labelKey = 'title', // Default label key
}) => {
  const [options, setOptions] = useState([]);

  const [inputValue, setInputValue] = useState('');

  const { field } = useController({
    name,
    control,
  });

  const { Option } = Select;

  // Sync options state with initialOptions prop
  useEffect(() => {
    if (initialOptions) {
      const normalizedOptions = initialOptions.map((option) => ({
        value: option[valueKey],
        title: option[labelKey],
      }));
      setOptions(normalizedOptions);
    }
  }, [initialOptions, valueKey, labelKey]);

  const handleClear = () => {
    setValue(name, []);
  };

  const handleSearch = (value) => {
    setInputValue(value.trim());
  };

  const handleAddOption = useCallback(() => {
    if (inputValue && !options.find((op) => op.title === inputValue)) {
      const newOption = { value: options.length + 1, title: inputValue };

      setOptions((prevOptions) => {
        const updatedOptions = [...prevOptions, newOption];
        setValue(name, [...(field.value || []), newOption]);
        return updatedOptions;
      });

      setInputValue('');
    }
  }, [inputValue, options, setValue, name, field.value]);

  const handleChange = (selectedValues) => {
    const selectedObjects = selectedValues.map((selectedValue) => {
      return options.find((op) => op.value === selectedValue) || { value: selectedValue, title: '' };
    });

    setValue(name, selectedObjects);
    field.onChange(selectedObjects);
  };

  return (
    <Form.Item
      label={label}
      help={errorMsg}
      validateStatus={errorMsg ? 'error' : 'success'}
      className='mb-0'
    >
      <Select
        mode="multiple"
        placeholder={placeholder}
        size="large"
        allowClear
        value={field.value?.map((selected) => selected.value)}
        showSearch
        onSearch={handleSearch}
        onClear={handleClear}
        onBlur={(e) => {
          if (!e.relatedTarget) handleAddOption();
          field.onBlur();
        }}
        onChange={handleChange}
        optionFilterProp="children"
        getPopupContainer={() => document.querySelector(`.${formClassName}`)}
        dropdownRender={(menu) => (
          <>
            {menu}
            {inputValue && !options.find((op) => op.title === inputValue) && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  cursor: 'pointer',
                  borderTop: '1px solid #e8e8e8',
                }}
                onClick={handleAddOption}
              >
                <span style={{ color: '#1890ff' }}>+ Add "{inputValue}"</span>
              </div>
            )}
          </>
        )}
      >
        {options.map((op) => (
          <Option key={op.value} value={op.value}>
            {op.title}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};

export default AntdSelectOptionMulti;
