import React from 'react';
import { DatePicker, Form } from 'antd';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import type { FormItemProps } from 'antd';

// Define Props interface
interface Props extends Omit<FormItemProps, 'validateStatus'> {
    control: any; // React Hook Form's control
    name: string; // Field name in the form
    label?: string; // Field label
    placeholder?: any; // Placeholder text
    defaultValue?: any; // Default value as a string
    validateStatus?: any; // Validation status
    errorMsg?: any; // Error message
    disabled?: boolean; // Disable field
    onChange?: any; // Custom onChange handler
    width?: number; // Width as a number in pixels
}
const AntdDateInput: React.FC<Props> = ({
    control,
    name,
    label,
    placeholder,
    defaultValue,
    errorMsg,
    disabled,
    width,
    onChange,
    ...rest
}) => {
    return (
        <Form.Item
            label={label}
            validateStatus={errorMsg ? 'error' : undefined}
            help={errorMsg}
            {...rest}
        >
            <Controller
                name={name}
                control={control}
                defaultValue={defaultValue}
                render={({ field: { value, onChange: fieldOnChange } }) => (
                    <DatePicker
                        placeholder={placeholder}
                        value={value ? dayjs(value) : null} // Ensure value is a dayjs object
                        disabled={disabled}
                        format="YYYY-MM-DD" // Specify a date format
                        onChange={(date, dateString) => {
                            fieldOnChange(date ? date.format('YYYY-MM-DD') : null); // Store formatted date string
                            if (onChange) onChange(date, dateString); // Pass both date and dateString to the custom onChange
                        }}
                        style={{ width: width || '100%' }}
                    />
                )}
            />
        </Form.Item>
    );
};

export default AntdDateInput;
