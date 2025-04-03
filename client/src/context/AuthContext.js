import { createContext, useEffect, useReducer } from "react";

const INITIAL_STATE = {
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
};

console.log("Initial user state from localStorage:", INITIAL_STATE.user);

export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {
  console.log("AuthReducer action:", action.type, action.payload);
  
  switch (action.type) {
    case "LOGIN_START":
      return {
        user: null,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      console.log("LOGIN_SUCCESS payload:", action.payload);
      return {
        user: action.payload.user,  
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        user: null,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    console.log("AuthContext state changed:", state);
    
    if (state.user) {
      console.log("Saving user to localStorage:", state.user);
      localStorage.setItem("user", JSON.stringify(state.user));
    } else {
      console.log("Removing user from localStorage");
      localStorage.removeItem("user");
    }
    if (state.token) { 
      console.log("Saving token to localStorage:", state.token);
      localStorage.setItem("token", state.token);
    } else {
      console.log("Removing token from localStorage");
      localStorage.removeItem("token"); 
    }
  }, [state.user, state.token]);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};