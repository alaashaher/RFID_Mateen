// FormStepper.tsx
import React from 'react';
import { Steps } from 'antd';
import type { StepsProps } from 'antd';
import { Popover } from 'antd';
import "./FormStepper.scss";
import { FormContext } from '../../contexts/pages-context/HistoricalPeriodProvider';
const { Step } = Steps;

type Step = {
    title: string;
    content: JSX.Element;
};

type StepperProps = {
    steps: Step[];
    currentStep: number;
    setCurrentStep: (number: number) => void;
};

const customDot: StepsProps['progressDot'] = (dot, { status, index }) => (
    <Popover>
        {dot}
    </Popover>
);

const FormStepper: React.FC<StepperProps> = ({ steps, currentStep, setCurrentStep }) => {
    const { isView, isEdit } = React.useContext(FormContext)!;

    const onChange = (value: number) => {
        if (isView || isEdit) {
            setCurrentStep(value);
        }
    };
    return (
        <div style={{ padding: '10px 0px' }}>
            <Steps
                current={currentStep}
                direction="horizontal"
                progressDot={customDot}
                labelPlacement="vertical"
                onChange={onChange}
            >
                {steps.map((step, index) => (
                    <Step key={index} title={step.title} />
                ))}
            </Steps>
        </div>
    );
};

export default FormStepper;
