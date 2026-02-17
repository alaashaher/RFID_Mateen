import React, { createContext, useReducer } from 'react';
import { setUser, removeUser, setUserToStateAction } from './user.actions';
import userReducer from './user.reducer';
import Cookies from 'js-cookie';

function decodeBase64(base64EncodedUserData) {
  try {
    
    // const parsedData = JSON.parse(base64EncodedUserData);
    // const base64User = parsedData.user;

    if (base64EncodedUserData) {
      const decodedUserString = decodeURIComponent(escape(atob(base64EncodedUserData)));
      const decodedUserObject = JSON.parse(decodedUserString);

      // ////console.log("New Decoded User Object:", decodedUserObject);
      return decodedUserObject;
    } else {
      console.error("No 'user' field found in the base64-encoded data.");
    }

  } catch (error) {
    console.error("Failed to decode base64 string", error);
    return null;
  }
}
const getUserFromSession = () => {
  // ////console.log("user-context", sessionStorage.getItem('currentUser'));
  let currentUser = null;

  if (sessionStorage.getItem('currentUser')) {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  } else if (Cookies.get('currentUser')) {
    currentUser = JSON.parse(Cookies.get('currentUser'));
  }

  if (currentUser && currentUser.user) {
    // Decode the base64-encoded 'user' field
    currentUser.user = decodeBase64(currentUser.user);
  }

  return currentUser;
};

const INITIAL_STATE = {
  loggedIn: Cookies.get('currentUser') || sessionStorage.getItem('currentUser') ? true : false,
  user: getUserFromSession()
};

const contextInitialState = {
  ...INITIAL_STATE,
  setUserToState: (user) => { },
  setCurrentUser: (user) => { },
  removeCurrentUser: () => { }
};

const UesrContext = createContext(contextInitialState);

export const UserProvider = ({ children }) => {
  const [reducerState, dispatch] = useReducer(userReducer, INITIAL_STATE);
  const { user, loggedIn } = reducerState;
  const setCurrentUser = (cUser) => dispatch(setUser(cUser));
  const setUserToState = (u) => dispatch(setUserToStateAction(u));
  const removeCurrentUser = () => dispatch(removeUser());

  return (
    <UesrContext.Provider
      value={{
        loggedIn,
        user,
        setUserToState,
        setCurrentUser,
        removeCurrentUser
      }}>
      {children}
    </UesrContext.Provider>
  );
};

export default UesrContext;
