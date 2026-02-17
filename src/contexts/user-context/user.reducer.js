import UserActionTypes from './user.types';

const userReducer = (currState, action) => {
  switch (action.type) {
    case UserActionTypes.SET_USER_TO_STATE:
      return {
        ...currState,
        loggedIn: true,
        user: action.payload
      };
    case UserActionTypes.SET_USER:
      return {
        ...currState,
        loggedIn: true,
        user: action.payload
      };
    case UserActionTypes.REMOVE_USER:
      return {
        ...currState,
        loggedIn: false,
        user: null
      };

    default:
      return currState;
  }
};

export default userReducer;
