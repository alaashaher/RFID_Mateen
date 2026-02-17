import React, { useState, createContext } from "react";

const initialState = {};

const RolesContext = createContext<any>(initialState);

export const RolesProvider: React.FC<any> = ({ children }) => {

    const [keyword, setkeyword] = useState("");
    const [pageSize, setPageSize] = useState(50);
    const [rowData, setRowData] = useState([]);
    //const [RoleId, setRoleId] = useState(0);
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
    const [babRowData, setBabRowData] = useState([]);
    const [babOrSanf, setBabOrSanf]=useState();


    return (
        <RolesContext.Provider value={{
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
            //RoleId, setRoleId,
            babRowData, setBabRowData,
            babOrSanf, setBabOrSanf

        }}>
            {children}
        </RolesContext.Provider>
    )
}
export default RolesContext;

