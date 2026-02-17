import React, { Suspense, useContext, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";

import Routess from "./Routess";
import "./App.scss";
import i18next from 'i18next';

import { ConfigProvider } from "antd";
import UesrContext from "../contexts/user-context/UserProvider";
import { ReactNotifications } from "react-notifications-component";
import RouterLinks from "./RouterLinks";
import LogIn from "../pages/log-in/LogIn";
import AppLayout from "./Layout";
import { useTranslation } from "react-i18next";
import Loading from "../common/loading/Loading";
import "../i18n";
import NotFoundPage from "../pages/not-found-page/NotFoundPage";
function App() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    i18next.changeLanguage("ar")
    document.body.dir = i18n.dir();
    // navigate(RouterLinks.homePage)
  }, [i18n.dir()]);

  const { loggedIn } = useContext(UesrContext);

  return (
    <div className={`app app-${i18n.dir()}`}>
      <Suspense fallback={<Loading />}>
        <ConfigProvider direction={i18n.dir()}>
          <ReactNotifications className={i18n.dir()} />

          {!loggedIn ? (
            <Routes>
              <Route path={RouterLinks.homePage} element={<LogIn />}></Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          ) : (

            <AppLayout>
              <Routess />
            </AppLayout>
          )}
          {/* <Route path="*" component={NotFoundPage} /> */}
        </ConfigProvider>
      </Suspense>
    </div>
  );
}

export default App;
