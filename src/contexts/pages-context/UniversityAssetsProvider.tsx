import { createContext, useState } from "react";
import React from "react";
const INITIAL_STATE = {};

const UniversityAssetsContext = createContext<any>(INITIAL_STATE);

export const UniversityAssetsProvider: React.FC<any> = ({ children }) => {
  const [rowData, setRowData] = useState<any>([]);
  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);
  const [keyword, setkeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [openFormModel, setOpenFormModel] = useState<boolean>(false);
  const [toEdit, setToEdit] = useState<object | null>();
  const [detectChanges, setdetectChanges] = useState(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  return (
    <UniversityAssetsContext.Provider
      value={{
        rowData,
        setRowData,
        openFormModel,
        setOpenFormModel,
        pageSize,
        setPageSize,
        pageNumber,
        setPageNumber,
        keyword,
        setkeyword,
        loading,
        setLoading,
        toEdit,
        setToEdit,
        isActive, setIsActive,
        detectChanges,
        setdetectChanges,
      }}
    >
      {children}
    </UniversityAssetsContext.Provider>
  );
};
export default UniversityAssetsContext;
