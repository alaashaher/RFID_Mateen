import UserActionTypes from './user.types';
import Cookies from 'js-cookie';

export const setUserToStateAction = (user) => {
  sessionStorage.setItem('currentUser', JSON.stringify(user));

  return {
    type: UserActionTypes.SET_USER_TO_STATE,
    payload: user
  };
};

export const setUser = (user) => {
  ////console.log("uuuuu_user", user);
  // localStorage.setItem('currentUser', JSON.stringify(user));
  Cookies.set('currentUser', JSON.stringify(user), {
    sameSite: 'strict'
    // expires: 90
    // expires: 5 / (24 * 60 * 60) // 5 secondas
  });

  return {
    type: UserActionTypes.SET_USER,
    payload: user
  };
};

export const removeUser = () => {
  sessionStorage.removeItem('currentUser');
  Cookies.remove('currentUser');
  return {
    type: UserActionTypes.REMOVE_USER
  };
};
