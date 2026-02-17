import { createContext, useState } from "react";
import React from "react";
const INITIAL_STATE = {};

const BasicInformationContext = createContext<any>(INITIAL_STATE);

export const BasicInformationProvider:React.FC<any> =({children})=>{
    const [rowData, setRowData] = useState<any>([]);
    const [pageSize, setPageSize] = useState(50);
    const [pageNumber, setPageNumber] = useState(1);
    const [keyword, setkeyword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [openFormModel, setOpenFormModel] = useState<boolean>(false);
    const [toEdit, setToEdit] = useState<object | null>();
    const [detectChanges, setdetectChanges] = useState(1);
    const [isActive, setIsActive] = useState<boolean>(true);
    const [currActiveKey, setCurrActiveKey] = useState<string>("1");
    const [openCategoryModel, setOpenCategoryModel] = useState<boolean>(false);
    const [openCityModel, setOpenCityModel] = useState<boolean>(false);
    const [openHistPerModel, setOpenHistPerModel] = useState<boolean>(false);



    return(
        <BasicInformationContext.Provider
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
            currActiveKey,
            setCurrActiveKey,
            openCategoryModel,
             setOpenCategoryModel,
             openCityModel,
              setOpenCityModel,
              openHistPerModel,
               setOpenHistPerModel
        }}
        >
            {children}
        </BasicInformationContext.Provider>
    )
}
export default BasicInformationContext;