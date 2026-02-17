import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import "./UnauthorizedPage.scss"; 

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="unauthorized-page">
    <h1>تم رفض الوصول</h1>
    <p>ليس لديك إذن لعرض هذه الصفحة.</p>
      <Button type="primary" onClick={handleGoBack}>
       العودة
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
