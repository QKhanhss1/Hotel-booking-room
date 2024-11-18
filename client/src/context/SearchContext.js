import { createContext, useReducer, useEffect } from "react";

const INITIAL_STATE = {
  destination: "",
  dates: JSON.parse(localStorage.getItem("dates")) || [
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ],
  options: JSON.parse(localStorage.getItem("options")) || {
    adult: 1,
    children: 0,
    room: 1,
  },
};

export const SearchContext = createContext(INITIAL_STATE);

const SearchReducer = (state, action) => {
  switch (action.type) {
    case "NEW_SEARCH":
      return action.payload;
    case "UPDATE_DESTINATION":
      return { ...state, destination: action.payload };
    case "UPDATE_DATES":
      return { ...state, dates: action.payload };
    case "UPDATE_OPTIONS":
      return { ...state, options: action.payload };
    default:
      return state;
  }
};

export const SearchContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(SearchReducer, INITIAL_STATE);

  // Lưu dates và options vào localStorage mỗi khi chúng thay đổi
  useEffect(() => {
    localStorage.setItem("dates", JSON.stringify(state.dates));
    localStorage.setItem("options", JSON.stringify(state.options));
  }, [state.dates, state.options]);

  return (
    <SearchContext.Provider
      value={{
        destination: state.destination,
        dates: state.dates,
        options: state.options,
        dispatch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
