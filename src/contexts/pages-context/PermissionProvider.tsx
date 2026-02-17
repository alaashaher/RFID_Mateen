import React, { useState, createContext } from "react";

const initialState = {};

const PermissionContext = createContext<any>(initialState);

export const PermissionProvider: React.FC<any> = ({ children }) => {

    const [keyword, setkeyword] = useState("");
    const [pageSize, setPageSize] = useState(50);
    const [rowData, setRowData] = useState([]);
    const [vwEdModal, setVwEdModal] = useState(false);
    const [toEdit, setToEdit] = useState(null);
    const [openedModal, setOpenedModal] = useState(false);
    const [detectChanges, setDetectChanges] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [elmName, setElmName] = useState('');
    const [elemDesc, setElemDesc] = useState('');
    const [loadingData, setLoadingData] = useState(false);
    const [page, setPage] = useState(1);
    const [viewRSTData, setViewRSTData] = useState(null);
    const [opndBabModal, setOpndBabModal] = useState(false);
    const [itmId, setItmId] = useState();
    const [babRowData, setBabRowData] = useState([]);
    const [babOrSanf, setBabOrSanf]=useState();


    return (
        <PermissionContext.Provider value={{
            keyword, setkeyword,
            pageSize, setPageSize,
            rowData, setRowData,
            vwEdModal, setVwEdModal,
            toEdit, setToEdit,
            openedModal, setOpenedModal,
            detectChanges, setDetectChanges,
            currentPage, setCurrentPage,
            elmName, setElmName,
            elemDesc, setElemDesc,
            loadingData, setLoadingData,
            page, setPage,
            viewRSTData, setViewRSTData,
            opndBabModal, setOpndBabModal,
            itmId, setItmId,
            babRowData, setBabRowData,
            babOrSanf, setBabOrSanf

        }}>
            {children}
        </PermissionContext.Provider>
    )
}
export default PermissionContext;

