import React from "react";
import { Route, Routes } from "react-router-dom";
import routerLinks from "./RouterLinks";
import HomePage from "../pages/home-page/HomePage";
import NotFoundPage from "../pages/not-found-page/NotFoundPage";
import BuildingsPage from "../pages/Buildings/BuildingsPage";
import RoomsPage from "../pages/Rooms/RoomsPage";
import UniversityAssets from "../pages/UniversityAssets/UniversityAssetsPage";
import UniversityFloors from "../pages/UniversityFloors/UniversityFloorsPage";


//////////////////

////////////////
import Roles from "../pages/roles/Roles";
import Users from "../pages/users/Users";
import Permission from "../pages/permissions/PermissionPage";
import UnauthorizedPage from "../pages/unauthorized-page/UnauthorizedPage"
import ProtectedRoute from "./ProtectedRoute";

import CategoryTypesPage from "../pages/CategoryTypes/CategoryTypesPage";
import UniversityAssetsPage from "../pages/UniversityAssetsScsnned/UniversityAssetsPage";
import UniversityAssetsPageRelocation from "../pages/UniversityAssetsRelocation/UniversityAssetsPageRelocation";
import CategoryListPage from "../pages/Category-list/CategoryListPage";
import UniversityAssetsPrintedPage from "../pages/UniversityAssetsPrinted/UniversityAssetsPrintedPage";
import UniversityAssetsAdjustmentInfo from "../pages/UniversityAssetsScsnned/UniversityAssetsAdjustmentInfo";
import AssetsTypePage from "../pages/AssetsType/AssetsTypePage";
import ModelsPage from "../pages/Models/ModelsPage";
import WarehouseAdjustmentPage from "../pages/WarehouseAdjustmentScsnnedUniversityAssetsPage/ScsnnedUniversityAssetsPage";
import ScsnnedUniversityAssetsPage from "../pages/ScsnnedUniversityAssetsPage/ScsnnedUniversityAssetsPage";
import OutOrders from "../pages/out-orders/OutOrders";
import CampOrdersPage from "../pages/CampOrdersPage/CampOrdersPage";
import CampsManagement from "../pages/CampsManagement/CampsManagement";
import CampAdjustmentPage from "../pages/Campadjustmentpage/CampAdjustmentPage"
import ReturnOrders from "../pages/ReturnOrdersPage/ReturnOrders";
import InventoryReport from "../pages/InventoryReport/InventoryReport";
import Suites from "../pages/Suites/Suites"
import InventoryOrdersPage from "../pages/InventoryOrdersPage/InventoryOrdersPage";


const Routess = () => {
  return (
    <Routes>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path={routerLinks.homePage} element={<HomePage />}></Route>
      <Route path={routerLinks.Buildings} element={<ProtectedRoute requiredPermission="ViewBuildings"> <BuildingsPage /> </ProtectedRoute>} />

      <Route path={routerLinks.category} element={
        <ProtectedRoute requiredPermission="ViewCategory">
          <AssetsTypePage />
        </ProtectedRoute>
      }></Route>
      <Route path={routerLinks.models} element={
        <ProtectedRoute requiredPermission="ViewCategory">
          <ModelsPage />
        </ProtectedRoute>
      }></Route>
      <Route path={routerLinks.CategoryNew} element={
        <ProtectedRoute requiredPermission="ViewCategory">
          <CategoryListPage />
        </ProtectedRoute>
      }></Route>
      <Route path={routerLinks.CategoryTypes} element={
        <ProtectedRoute requiredPermission="ViewCategoryTypes">
          <CategoryTypesPage />
        </ProtectedRoute>
      }></Route>
      <Route path={routerLinks.Rooms} element={<ProtectedRoute requiredPermission="ViewRooms"> <RoomsPage /> </ProtectedRoute>} />

      <Route path={routerLinks.UniversityAssets} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <UniversityAssets />
        </ProtectedRoute>}>
      </Route>

      <Route path={routerLinks.UniversityAssetsPrinted} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <UniversityAssetsPrintedPage />
        </ProtectedRoute>}>
      </Route>

      <Route path={routerLinks.WarehouseAdjustmentScsnnedUniversityAssets} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <WarehouseAdjustmentPage />
        </ProtectedRoute>}>
      </Route>
      <Route path={routerLinks.ScsnnedUniversityAssetsPage} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <ScsnnedUniversityAssetsPage />
        </ProtectedRoute>}>
      </Route>


        <Route path={routerLinks.OutOrders} element={
        <ProtectedRoute requiredPermission=
"ViewDispatchOrders">
          <OutOrders />
        </ProtectedRoute>}>
      </Route>
       <Route path={routerLinks.CampOrdersPage} element={
        <ProtectedRoute requiredPermission="ViewCampOrders">
          <CampOrdersPage />
        </ProtectedRoute>}>
      </Route>
      {/* ViewInventoryOrders */}
       <Route path={routerLinks.InventoryOrdersPage} element={
        <ProtectedRoute requiredPermission="ViewCampOrders">
          <InventoryOrdersPage />
        </ProtectedRoute>}>
      </Route>
       <Route path={routerLinks.CampsManagement} element={
        <ProtectedRoute requiredPermission="ViewCampManagers">
          <CampsManagement />
        </ProtectedRoute>}>
      </Route>
      
      <Route path={routerLinks.UniversityAssetsAdjustment} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <UniversityAssetsAdjustmentInfo />
        </ProtectedRoute>}>
      </Route>

      <Route path={routerLinks.UniversityAssetsRelocation} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssets">
          <UniversityAssetsPageRelocation />
        </ProtectedRoute>}>
      </Route>
      <Route path={routerLinks.UniversityAssetsScanned} element={
        <ProtectedRoute requiredPermission="ViewUniversityAssetsScanned">
          <UniversityAssetsPage />
        </ProtectedRoute>}>
      </Route>
      <Route path={routerLinks.UniversityFloors} element={
        <ProtectedRoute requiredPermission="ViewUniversityFloors">
          <UniversityFloors />
        </ProtectedRoute>}>
      </Route>
      <Route path={routerLinks.CampAdjustmentPage} element={
        <ProtectedRoute requiredPermission="ViewCampAdjustment">
          <CampAdjustmentPage />
        </ProtectedRoute>}>
      </Route>

      <Route path={routerLinks.roles} element={
        <ProtectedRoute requiredPermission="ViewRoles">
          <Roles />
        </ProtectedRoute>

      }></Route>

      <Route path={routerLinks.users} element={
        <ProtectedRoute requiredPermission="ViewUsers">
          <Users />
        </ProtectedRoute>
      }></Route>
<Route path={routerLinks.returnOrders} element={
        <ProtectedRoute requiredPermission="ViewReturnOrders">
          <ReturnOrders />
        </ProtectedRoute>
      }></Route>
<Route path={routerLinks.InventoryReport} element={
        <ProtectedRoute requiredPermission="ViewReturnOrders">
          <InventoryReport />
        </ProtectedRoute>
      }></Route>
      <Route path={routerLinks.Suites} element={
        <ProtectedRoute requiredPermission="ViewRooms">
          <Suites />
        </ProtectedRoute>
      }></Route>

      {/* <Route path={routerLinks.permissions} element={
          <ProtectedRoute requiredPermission="ViewPermission">
            <Permission />
          </ProtectedRoute>
        }></Route> */}
      <Route path={routerLinks.permissions} element={<Permission />}></Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default Routess;
