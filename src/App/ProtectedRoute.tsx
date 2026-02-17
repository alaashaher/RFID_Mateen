import React from "react";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import UesrContext from "../contexts/user-context/UserProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { user } = useContext(UesrContext);
////console.log("Protect Route User", user?.user?.Permissions);
  if (user?.user?.Permissions.includes(requiredPermission)) {
    return <>{children}</>;
  } else {
    return <Navigate to="/unauthorized" replace />;
  }
};

export default ProtectedRoute;
