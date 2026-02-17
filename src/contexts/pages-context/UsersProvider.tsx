import React, { useState, createContext } from "react";

const initialState = {};

const UsersContext = createContext<any>(initialState);

export const UsersProvider: React.FC<any> = ({ children }) => {

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
        <UsersContext.Provider value={{
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
        </UsersContext.Provider>
    )
}
export default UsersContext;

