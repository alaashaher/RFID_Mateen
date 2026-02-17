import React, { useEffect } from "react";
import { useController } from "react-hook-form";
import { Form, Select } from "antd";

interface Props {
    control: any;
    name: string;
    label?: React.ReactNode;
    placeholder?: string;
    setValue: any;
    validateStatus?: "error" | "success" | undefined;
    errorMsg?: string;
    options: { value: string }[];
    formClassName?: string;
    disable?: boolean;
}

const AntdBooleanInput: React.FC<Props> = ({
    control,
    name,
    label,
    placeholder,
    setValue,
    validateStatus,
    errorMsg,
    options,
    formClassName,
    disable
}) => {
    const { field } = useController({
        name,
        control,
    });

    const { Option } = Select;

    // Determine the display value based on the boolean value
    const displayValue = field.value === true ? "موثوق" : 
                         field.value === false ? "غير موثوق" : 
                         undefined;

    const handleChange = (value: string) => {
        // Convert to boolean directly
        const booleanValue = value === "موثوق";
        setValue(name, booleanValue, { shouldValidate: true });
    };

    // Ensure initial value is set correctly if not already set
    useEffect(() => {
        if (field.value === undefined) {
            setValue(name, false, { shouldValidate: true });
        }
    }, [field.value, setValue, name]);

    return (
        <Form.Item 
            label={label} 
            help={errorMsg} 
            validateStatus={validateStatus}
        >
            <Select
                {...field}
                value={displayValue}
                placeholder={placeholder}
                size="large"
                onChange={handleChange}
                disabled={disable}
                allowClear
                getPopupContainer={() =>
                    document.querySelector(`.${formClassName}`) as HTMLElement
                }
            >
                {options.map((op, index) => (
                    <Option key={index} value={op.value}>
                        {op.value}
                    </Option>
                ))}
            </Select>
        </Form.Item>
    );
};

export default AntdBooleanInput;