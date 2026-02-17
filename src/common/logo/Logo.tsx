import "./Logo.scss";

import React from "react";
import { Link } from "react-router-dom";
import RouterLinks from "../../App/RouterLinks";

const Logo = ({ className }) => {
  return (
    <Link className={className} to={RouterLinks.homePage}>
      <img
        src="assets/imgs/logo/nauulogo.png"
        alt="app logo"
        width={"100px"}
      />
    </Link>
  );
};

export default Logo;
