import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App/App.js";
import "./index.scss";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./contexts/user-context/UserProvider.jsx";
import Loading from "./common/loading/Loading.js";
import "react-notifications-component/dist/theme.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { BuildingsProvider } from "./contexts/pages-context/BuildingsProvider.js";
import { RoomsProvider } from "./contexts/pages-context/RoomsProvider.js";
import { UniversityAssetsProvider } from "./contexts/pages-context/UniversityAssetsProvider.js";

import { RolesProvider } from "./contexts/pages-context/RolesProvider.js";
import { UsersProvider } from "./contexts/pages-context/UsersProvider.js";
import { PermissionProvider } from "./contexts/pages-context/PermissionProvider.js";


import { CategoryProvider } from "./contexts/pages-context/CategoryProvider.js";
import { CategoryTypesProvider } from "./contexts/pages-context/CategoryTypesProvider.js";
import { UniversityFloorsProvider } from "./contexts/pages-context/UniversityFloorsProvider.js";
import { UniversityAssetsScannedProvider } from "./contexts/pages-context/UniversityAssetsProviderScanned.js";
import { UniversityAssetsRelocationProvider } from "./contexts/pages-context/UniversityAssetsRelocationProvider.js";
import { CategoryListProvider } from "./contexts/pages-context/CategoryListProvider.js";
import { BuildingAdjustmentProvider } from "./contexts/pages-context/BuildingAdjustmentProvider.js";
import { WarehouseAdjustmentProvider } from "./contexts/pages-context/WarehouseAdjustmentProvider.js";






ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      <UserProvider>

        <RolesProvider>
          <UsersProvider>
            <PermissionProvider>

              <BuildingsProvider>
                <CategoryProvider>
                  <CategoryTypesProvider>
                    <RoomsProvider>
                      <UniversityAssetsProvider>
                        <UniversityAssetsScannedProvider>
                          <UniversityAssetsRelocationProvider>
                            <UniversityFloorsProvider>
                              <CategoryListProvider>
                                <BuildingAdjustmentProvider>
                                <WarehouseAdjustmentProvider>
                                  <Router>
                                    <App />
                                  </Router>
                                </WarehouseAdjustmentProvider>
                                </BuildingAdjustmentProvider>
                              </CategoryListProvider>
                            </UniversityFloorsProvider>
                          </UniversityAssetsRelocationProvider>
                        </UniversityAssetsScannedProvider>
                      </UniversityAssetsProvider>
                    </RoomsProvider>
                  </CategoryTypesProvider>
                </CategoryProvider>
              </BuildingsProvider>

            </PermissionProvider>
          </UsersProvider>
        </RolesProvider>

      </UserProvider>
    </Suspense>
  </React.StrictMode>
);
