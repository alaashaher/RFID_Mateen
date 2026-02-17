import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./contexts/user-context/UserProvider.jsx";
import Loading from "./common/loading/Loading.js";
import App from "./App/App.js";

const modules = import.meta.glob("./contexts/pages-context/*.tsx", { eager: true });

const providerNames = Object.keys(modules).map(modulePath => {
  const moduleName = modulePath.split('/').pop().replace('.tsx', '');
  return moduleName;
});

////console.log("providerNames", providerNames);

// const providers = Object.values(modules)
//   .map((module: any) => module.default)
//   .filter((Provider) => typeof Provider === "function");

  const providers = Object.values(modules).map((module: any) => {
    ////console.log('Module content:', module); 
    return module.default;
  }).filter((Provider) => typeof Provider === "function");
  
  ////console.log("providers after filtering", providers);
// const providers = Object.values(modules)
//   .map((module: any) => module.default)
//   .filter((Provider) => typeof Provider === "function");
////console.log("modules", modules);
////console.log("providers", providers);

const DynamicProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return providers.reduce(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      <UserProvider>
        <DynamicProviderWrapper>
          <Router>
            <App />
          </Router>
        </DynamicProviderWrapper>
      </UserProvider>
    </Suspense>
  </React.StrictMode>
);
