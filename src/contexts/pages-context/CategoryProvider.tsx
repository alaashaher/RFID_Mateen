import { createContext, useState } from "react";
import React from "react";
const INITIAL_STATE = {};

const CategoryContext = createContext<any>(INITIAL_STATE);

export const CategoryProvider: React.FC<any> = ({ children }) => {
  const [rowData, setRowData] = useState<any>([]);

  const [rowDataSub, setRowDataSub] = useState<any>([]);

  const [rowDataSec, setRowDataSec] = useState<any>([]);

  const [pageSize, setPageSize] = useState(50);
  const [pageNumber, setPageNumber] = useState(1);


  const [pageSizeSec, setPageSizeSec] = useState(50);
  const [pageNumberSec, setPageNumberSec] = useState(1);


  const [pageSizeSub, setPageSizeSub] = useState(50);
  const [pageNumberSub, setPageNumberSub] = useState(1);

  const [keyword, setkeyword] = useState<string>("");
  const [keywordSub, setkeywordSub] = useState<string>("");
  const [keywordSec, setkeywordSec] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [openFormModel, setOpenFormModel] = useState<boolean>(false);
  const [toEdit, setToEdit] = useState<object | null>();
  const [detectChanges, setdetectChanges] = useState(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [selectedParentType, setSelectedParentType] = useState(null);
  const [CategoryTypeId, setCategoryTypeId] = useState(null);
  const [isSecondModalOpen, setIsSecondModalOpen] = useState(false);
  const [parentId, setParentId] = useState(null);

  return (
    <CategoryContext.Provider
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
        keywordSub,
        setkeywordSub,
        keywordSec,
        setkeywordSec,
        loading,
        setLoading,
        toEdit,
        setToEdit,
        isActive, setIsActive,
        detectChanges,
        setdetectChanges,
        selectedParentType, setSelectedParentType,
        CategoryTypeId, setCategoryTypeId,
        isSecondModalOpen, setIsSecondModalOpen,

        rowDataSub,
        setRowDataSub,

        rowDataSec,
        setRowDataSec,


        pageSizeSub,
        setPageSizeSub,
        pageNumberSub,
        setPageNumberSub,


        pageSizeSec,
        setPageSizeSec,
        pageNumberSec,
        setPageNumberSec,
        parentId, setParentId
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};
export default CategoryContext;
