import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Layout as AntdLayout,
  Menu,
  Breadcrumb,
  Dropdown,
  Button,
  MenuProps,
} from "antd";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
// import { Link } from "react-router-dom";

import {
  HomeOutlined,
  BankOutlined,
  AppstoreAddOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
  LoadingOutlined,
  BranchesOutlined,
  ControlOutlined,
  DatabaseOutlined,
  GroupOutlined,
  HddOutlined,
  MergeOutlined,
  NodeExpandOutlined,
  TeamOutlined,
  SubnodeOutlined,
  ThunderboltOutlined,
  FileMarkdownFilled,
  BarChartOutlined,
  ScanOutlined,
  MutedOutlined,
  CiOutlined,
  EnvironmentOutlined,

} from "@ant-design/icons";
// import ReactNotification from 'react-notifications-component';
import { Store } from "react-notifications-component";

import routerLinks from "./RouterLinks";
import Logo from "../common/logo/Logo";
import slugify from "slugify";
import Avatar from "antd/lib/avatar/avatar";
import UesrContext from "../contexts/user-context/UserProvider";
import "./Layout.scss";
import RouterLinks from "./RouterLinks";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const AppLayout: React.FC<any> = ({ children }) => {
  const { user, removeCurrentUser } = useContext(UesrContext);
  console.log("🚀 ~ user:", user)

  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  const { Header, Content, Sider } = AntdLayout;

  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed((prevState) => !prevState);
    if (!collapsed) {
      // document.getElementsByClassName("ant-layout-sider-collapsed").classList.add("my-class") 
    }
  };
  // ////console.log("🚀 ~ onCollapse ~ collapsed:", collapsed)

  const mainLinks = [
    // {
    //   key: 1,
    //   path: routerLinks.homePage,
    //   name: "الصفحة الرئيسية",
    //   icon: <HomeOutlined />,
    // },
    {
      key: 2,
      path: routerLinks.InventoryReport,
      name: "الصفحة الرئيسية - المستودع",
      icon: <HomeOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewInventoryReport")) ? false : true
    },
    {
      key: 2,
      path: routerLinks.AdminBuildings,
      name: "الصفحة الرئيسية - المبانى الادارية",
      icon: <HomeOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewAdminBuildings")) ? false : true
    },
    {
      key: 110,
      path: routerLinks.OutOrders,
      name: " أوامر الخروج",
      icon: <CiOutlined />,
      hidden: (user?.user?.Permissions?.includes(
        "ViewDispatchOrders")) ? false : true
    },
{
      key: 114,
      path: routerLinks.returnOrders,
      name: " أوامر الرجوع الى المستودع",
      icon: <CiOutlined />,
      hidden: (user?.user?.Permissions?.includes(
        "ViewReturnOrders")) ? false : true
    },

    {
      key: 111,
      path: routerLinks.CampsManagement,
      name: " المخيمات",
      icon: <BankOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCampManagers")) ? false : true
    },
    {
      key: 112,
      path: routerLinks.CampOrdersPage,
      name: " طلبات المخيمات",
      icon: <CiOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCampOrders")) ? false : true
    },
    // {
    //   key: 212,
    //   path: routerLinks.InventoryOrdersPage,
    //   name: " طلبات المستودع",
    //   icon: <CiOutlined />,
    //   // hidden: (user?.user?.Permissions?.includes("ViewInventoryOrders")) ? false : true
    // },
    {
      key: 113,
      path: routerLinks.CampAdjustmentPage,
      name: " جرد المخيمات",
      icon: <CiOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCampAdjustment")) ? false : true
    },
    // {
    //   key: 111,
    //   path: routerLinks.CategoryTypes,
    //   name: "أنواع الأصناف",
    //   icon: <BarChartOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCategoryTypes")) ? false : true
    // },
    {
      key: 3,
      path: routerLinks.CategoryNew,
      name: " تصنيف الاصول",
      icon: <BranchesOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCategory")) ? false : true
    },
    {
      key: 1,
      path: routerLinks.category,
      name: "اصناف الاصول",
      icon: <ControlOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCategory")) ? false : true
    },
    {
      key: 101,
      path: routerLinks.models,
      name: "الموديلات",
      icon: <MutedOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewCategory")) ? false : true
    },
    {
      key: 2,
      path: routerLinks.Buildings,
      name: "المباني",
      icon: <DatabaseOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewBuildings")) ? false : true
    },
    {
      key: 6,
      path: routerLinks.UniversityFloors,
      name: "الأدوار",
      icon: <HddOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityFloors")) ? false : true
    },
    {
      key: 7,
      path: routerLinks.Suites,
      name: "الجناح",
      icon: <HddOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityFloors")) ? false : true
    },
    {
      key: 3,
      path: routerLinks.Rooms,
      name: "الغرف",
      icon: <GroupOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewRooms")) ? false : true

    },
    // {
    //   key: 2,
    //   path: routerLinks.AdminBuildings,
    //   name: "المباني الأدارية",
    //   icon: <BankOutlined  />,
    //   hidden: (user?.user?.Permissions?.includes("ViewBuildings")) ? false : true
    // },
    {
      key: 5,
      path: routerLinks.UniversityAssets,
      name: "الأصول",
      icon: <MergeOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityAssets")) ? false : true

    },
    {
      key: 10,
      path: routerLinks.UnassignedAssets,
      name: "أصول مؤرشفة مؤقتا",
      icon: <FileMarkdownFilled />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityAssetsRelocation")) ? false : true

    },
    {
      key: 8,
      path: routerLinks.Relocationhistory,
      name: "الأصول التى تم نقلها",
      icon: <FileMarkdownFilled />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityAssetsRelocation")) ? false : true

    },
    
    {
      key: 29,
      path: routerLinks.BuildingAdjustment,
      name: "جرد المباني الأدارية",
      icon: <ScanOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewAdjustmentUniversityAssets")) ? false : true

    },
    {
      key: 15,
      path: routerLinks.WarehouseAdjustment,
      name: "جرد المستودعات",
      icon: <ScanOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewAdjustmentUniversityAssets")) ? false : true

    },
    {
      key: 5,
      path: routerLinks.UniversityAssetsScanned,
      name: " نتائج الجرد",
      icon: <NodeExpandOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewUniversityAssetsScanned")) ? false : true

    },

    // {
    //   key: 4,
    //   path: routerLinks.cityImportance,
    //   name: "أهمية المدن",
    //   icon: <AppstoreAddOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCityImportance")) ? false : true

    // },
    // {
    //   key: 7,
    //   path: routerLinks.cityhistory,
    //   name: "تاريخ الدول و المدن",
    //   icon: <AppstoreAddOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCityHistory")) ? false : true

    // },
    // {
    //   key: 8,
    //   path: routerLinks.citymainlandmark,
    //   name: "المعالم الرئيسية للمدن",
    //   icon: <AppstoreAddOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCityMainLandmark")) ? false : true

    // },
    // {
    //   key: 9,
    //   path: routerLinks.citymeansofhisttrans,
    //   name: "وسائل النقل التاريخية",
    //   icon: <AppstoreAddOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCityMeansofHistTrans")) ? false : true

    // },
    // {
    //   key: 10,
    //   path: routerLinks.citysustainandEnv,
    //   name: "الاستدامة والبيئة للمدن و الدول",
    //   icon: <AppstoreAddOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewCitySustainandEnv")) ? false : true

    // },


    // {
    //   key: 26,
    //   path: routerLinks.civilization,
    //   name: "الحضارة",
    //   icon: <AppstoreAddOutlined />,
    //   // hidden: (user?.user?.Permissions?.includes("ViewCivilization")) ? false : true

    // },
    // {
    //   key: 27,
    //   path: routerLinks.differentPrice,
    //   name: "اسعار مختلفة",
    //   icon: <AppstoreAddOutlined />,
    //   // hidden: (user?.user?.Permissions?.includes("ViewDifferentPrice")) ? false : true
    // },
    // {
    //   key: 28,
    //   path: routerLinks.era,
    //   name: "العصور",
    //   icon: <AppstoreAddOutlined />,
    //   // hidden: (user?.user?.Permissions?.includes("ViewEra")) ? false : true
    // },



    {
      key: 29,
      path: routerLinks.roles,
      name: "صلاحيات المستخدمين",
      icon: <SubnodeOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewRoles")) ? false : true

    },
    {
      key: 30,
      path: routerLinks.users,
      name: "المستخدمين",
      icon: <TeamOutlined />,
      hidden: (user?.user?.Permissions?.includes("ViewUsers")) ? false : true

    },
    // {
    //   key: 31,
    //   path: routerLinks.permissions,
    //   name: "الصلاحيات",
    //   icon: <ThunderboltOutlined />,
    //   hidden: (user?.user?.Permissions?.includes("ViewPermissions")) ? false : true

    // },

  ];

  const renderMainLinks = () => {
    return mainLinks.map((link) => (
      <Menu.Item
        key={link.key}
        icon={link.icon}
        className={
          slugify(pathname) === slugify(link.path)
            ? "ant-menu-item-selected"
            : ""
        }
      >
        <RouterLink to={link.path}>{link.name}</RouterLink>
      </Menu.Item>
    ));
  };

  const [loadingSignout, setLoadingSignout] = useState(false);
  // const history = useHistory();
  const navigate = useNavigate();
  const handleSignout = async () => {
    removeCurrentUser();
    navigate("/")
    try {
      setLoadingSignout(true);
    } catch (error) {
      setLoadingSignout(false);
      Store.addNotification({
        title: "wrong",
        message: "try again",
        type: "danger",
        insert: "top",
        container: "top-right",
        animationIn: ["animate__animated", "animate__fadeIn"],
        animationOut: ["animate__animated", "animate__fadeOut"],
        dismiss: {
          duration: 2000,
          showIcon: true,
          onScreen: true,
        },
      });
      //////console.log(error);
    }
  };
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a onClick={handleSignout}>
          <LogoutOutlined />
          تسجيل خروج
        </a>
      ),
    },
  ];
  const itemss: MenuItem[] = mainLinks.map((link, index) => {
    if (!link.hidden) {
      return (
        getItem(
          <RouterLink to={link.path} className={`${link.hidden ? "d-hide" : "d-show"}`}>{link.name}</RouterLink>,
          index,
          link.icon
        ))
    } else {
      return null
    }
  }
  );





  const newItems = () => {
    return (
      [

        getItem(
          <RouterLink to={routerLinks.homePage}>الصفحة الرئيسية</RouterLink>,
          "4",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.roles}>صلاحيات المستخدمين</RouterLink>,
          "1",
          <AppstoreAddOutlined />
        ),

        getItem(
          <RouterLink to={routerLinks.users}>المستخدمين</RouterLink>,
          "2",
          <AppstoreAddOutlined />
        ),

        getItem(
          <RouterLink to={routerLinks.permissions}>الصلاحيات</RouterLink>,
          "3",
          <AppstoreAddOutlined />
        ),

        getItem(
          <RouterLink to={routerLinks.Buildings}>المباني</RouterLink>,
          "5",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.category}>الاصناف</RouterLink>,
          "6",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.CategoryTypes}> انواع الاصناف </RouterLink>,
          "7",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.Rooms}>الغرف</RouterLink>,
          "8",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.UniversityAssets}>مصادر الجامعات</RouterLink>,
          "9",
          <AppstoreAddOutlined />
        ),
        getItem(
          <RouterLink to={routerLinks.UniversityFloors}>ادور الجامعات</RouterLink>,
          "9",
          <AppstoreAddOutlined />
        ),
      ]
    )

  }



  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const onClick: MenuProps['onClick'] = (e) => {
    // console.log('click ', e);
    setCollapsed(true);
    // document.getElementsByClassName("ant-layout-sider-collapsed").revomec
  };
  return (
    <div className={`app-layout app-${i18n.dir()}`}>
      <AntdLayout style={{ minHeight: "100vh" }}>
        <Sider
          trigger={null}
          theme="light"
          width="252"
          collapsible
          collapsed={collapsed}
          // onCollapse={onCollapse}
          breakpoint="lg"
          collapsedWidth={windowWidth > 700 ? "50px" : "0px"}
          onBreakpoint={(broken) => {
            // //////console.log(broken);
          }}
        >
          {/* <Logo className="logo-link" /> */}
          <RouterLink className={"logo-link"} to={RouterLinks.EptyDashboard}>
            <img
              src="assets/imgs/favicon.png"
              alt="app logo"

            />
          </RouterLink>
          <Menu
            className="app-aside-menu"
            theme="light"
            mode="inline"
            onClick={onClick}
            selectable={false}
            items={itemss}
          ></Menu>
        </Sider>
        {/* <Sider>
          <Button
            type="primary"
            onClick={toggleCollapsed}
            style={{ marginBottom: 16 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
          <Menu
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            mode="inline"
            theme="light"
            inlineCollapsed={collapsed}
            items={itemss}
          />
        </Sider> */}
        <AntdLayout className="site-layout app-site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }}>
            {/* {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger-layout-btn',
              onClick: toggleCollapsed
            })} */}
            {collapsed ? (
              <MenuUnfoldOutlined
                className="trigger-layout-btn"
                onClick={toggleCollapsed}
              />
            ) : (
              <MenuFoldOutlined
                className="trigger-layout-btn"
                onClick={toggleCollapsed}
              />
            )}

            <div className="avatar-wrapper">
              <Dropdown
                trigger={["click"]}
                disabled={loadingSignout}
                menu={{ items }}
              >
                <Button className="profile-menu-btn" type="text">
                  {loadingSignout ? <LoadingOutlined /> : <DownOutlined />}
                  <span className="user-name">{user?.user?.UserName}</span>
                  <Avatar size={38} icon={<UserOutlined />} src={user?.image} />
                </Button>
              </Dropdown>
            </div>
          </Header>
          <Content style={{ margin: "0 16px" }}>
            <Breadcrumb></Breadcrumb>
            <div
              className="site-layout-background"
              style={{ minHeight: 360 }}
            >
              {children}
            </div>
          </Content>
          {/* <Footer style={{ textAlign: 'center' }}>Layout footer</Footer> */}
        </AntdLayout>
      </AntdLayout>
      {/* <ReactNotification className={i18n.dir()} /> */}
    </div>
  );
};

export default AppLayout;
