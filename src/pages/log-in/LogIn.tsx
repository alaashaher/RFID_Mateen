import React from "react";
import LoginForm from "./LoginForm";
import "./LogIn.scss";
const LoginPage = () => {
  return (
    <div className="login-page">
      <div className="custom-container">
        <div className="page-wrapper">
          {/* <div className="img-wrap">
            <img src={"imges/signin.png"} alt="signin" />
          </div> */}
          <div className="form-top-level-wrapper">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
