import React, { useContext } from "react";
import "./AnotherInformationItems.scss";
import RouterLinks from "../../App/RouterLinks";
import UserContext from "../../contexts/user-context/UserProvider";
import { Card } from "antd";
import { Link as RouterLink } from "react-router-dom";

const AnotherInformationItems = () => {
  const { user } = useContext(UserContext);

  const CityInformationIItemss = [
    {
      key: 1,
      path: RouterLinks.referenceandResource,
      name: "المصادر والمراجع",

      hidden: user?.user?.Permissions?.includes("ViewEra")
        ? false
        : true,
    },
    {
      key: 2,
      path: RouterLinks.era,
      name: "العصور",

      hidden: user?.user?.Permissions?.includes("ViewEra")
        ? false
        : true,
    },
    {
      key: 3,
      path: RouterLinks.civilization,
      name: "الحضارات",
      hidden: user?.user?.Permissions?.includes("ViewCivilization")
        ? false
        : true,
    },
    {
      key: 4,
      path: RouterLinks.differentPrice,
      name: "أسعار أخرى",
      hidden: user?.user?.Permissions?.includes("ViewCivilization")
        ? false
        : true,
    },
  ];

  return (
    <div className="citys-itmss">
      <div className="main-cont">
        {CityInformationIItemss.map(
          (itm, index) =>
            !itm.hidden && (
              <RouterLink to={itm.path} key={index}>
                <Card hoverable className="slb-crd" bordered>
                  <span>{itm.name}</span>
                </Card>
              </RouterLink>
            )
        )}
      </div>
    </div>
  );
};

export default AnotherInformationItems;
