import "./NotFound.styles.scss";

import React from "react";
import { Link as RouterLink } from "react-router-dom";

const NotFoundPage = () => {
  // DocTitleScrollTop('Not Found');

  return (
    <div className="notFoundPage">
      <div className="mfa-container">
        <div className="notFoundContent">
          <p>Whoops, we cannot find that page.</p>
          <p>You can always visit </p>
          <RouterLink to="/" color="primary">
            homepage
          </RouterLink>{" "}
          to get a fresh start.
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
