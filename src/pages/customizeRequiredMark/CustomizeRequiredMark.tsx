import React from 'react';

export const CustomizeRequiredMark = (label: React.ReactNode, { required }: { required: boolean }) => (
  <>
    {label}
    {required && <span style={{ color: "red" }}>*</span>}
  </>
);
export default CustomizeRequiredMark;