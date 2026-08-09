import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { ApiResponse, ResponseShape } from "../utils/types/api-response.type";
import Cookies from 'js-cookie';

axios.defaults.headers.common["Content-Type"] = "application/json";
import urls from "../urls";
import { Store } from "react-notifications-component";

const url = urls.baseUrl;

function decodeBase64(base64EncodedUserData: string) {
  try {

    const parsedData = JSON.parse(base64EncodedUserData);
    const base64User = parsedData.user;

    if (base64User) {
      const decodedUserString = decodeURIComponent(escape(atob(base64User)));
      const decodedUserObject = JSON.parse(decodedUserString);

      // ////console.log("Decoded User Object:", decodedUserObject);
      return decodedUserObject;
    } else {
      console.error("No 'user' field found in the base64-encoded data.");
    }

  } catch (error) {
    console.error("Failed to decode base64 string", error);
    return null;
  }
}

export function setAuthorizationToken(token?: string) {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return;
  }
  const userCookie = localStorage.getItem("token");
  // ////console.log('====================================');
  // ////console.log('userCookie',userCookie);
  // ////console.log('====================================');
  axios.defaults.headers.common["Accept-Language"] = Cookies.get("i18next");
  // ////console.log("c-user", sessionStorage.getItem('currentUser'))
  if (sessionStorage.getItem('currentUser')) {
    // ////console.log("c-user2", sessionStorage.getItem('currentUser'))
    let base64EncodedUser = sessionStorage.getItem('currentUser');
    const decodedUser = decodeBase64(base64EncodedUser);
    // ////console.log("c-user-Id", decodedUser.UserId)

    axios.defaults.headers.common["userid"] = decodedUser.UserId;
    axios.defaults.headers.common["RoleTypeId"] = decodedUser.RoleTypeId  ? decodedUser.RoleTypeId : null;
    
    axios.defaults.headers.common["alaa"] = "alaa";
    axios.defaults.headers.common["Authorization"] = `Bearer ${JSON.parse(sessionStorage.getItem('currentUser')).token}`;
    return;
  }
  // if (userCookie) {

  // }
  return;
}
setAuthorizationToken();

function checkResponse(response: any) {
  if (response.status !== 200) {
    const error = new Error(response.message);
    throw error;
  } else {
    const newResponse = {
      ...response.data,
    };
    // ////console.log("token test", response)
    return response.data;
  }
}

export function displayError(message: string) {
  // const lang = Cookies.get("i18next");
  Store.addNotification({
    title: "error occured",
    message: message || "Try Again",
    type: "danger",
    insert: "top",
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 5000,
      showIcon: true,
      onScreen: true,
    },
  });
}

export async function postToApi<resData>(
  path: string,
  body: any,
  config?: AxiosRequestConfig
) {
  const response = await axios
    .create({
      baseURL: url,
    })
    .post(path, body, config);
  return checkResponse(response);
}

export async function deleteToApi<resData>(
  path: string,
  config?: AxiosRequestConfig
) {
  setAuthorizationToken();
  const response = await axios.delete(path, config);
  return checkResponse(response);
}
export async function uploadToApi(
  path: string,
  formData: FormData,
  config?: AxiosRequestConfig
) {
  const response = await axios.create({
    baseURL: url,
  }).post(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return checkResponse(response);
}
export async function getFromApi(
  path: string,
  config?: AxiosRequestConfig
) {
  setAuthorizationToken();
  const response = await axios
    .create({
      baseURL: url,
    })
    .get(path, config);
  // ////console.log(response);

  return checkResponse(response);
}

export async function putToApi<resData>(
  path: string,
  body: any,
  config?: AxiosRequestConfig
) {
  setAuthorizationToken();
  const response = await axios
    .create({
      baseURL: url,
    })
    .put(path, body, config);
  return checkResponse(response);
}

export async function deleteFromApi(path: string, config?: AxiosRequestConfig) {
  setAuthorizationToken();
  const response = await axios
    .create({
      baseURL: url,
    })
    .delete(path, config);

  return checkResponse(response);
}

export default axios.create({ baseURL: url });
