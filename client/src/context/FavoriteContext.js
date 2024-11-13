import { createContext, useReducer, useEffect } from "react";
import axios from "axios";

export const FavoriteContext = createContext();

const INITIAL_STATE = {
  favorites: [],
};

const favoriteReducer = (state, action) => {
  switch (action.type) {
    case "SET_FAVORITES":
      return { favorites: action.payload };
    case "ADD_FAVORITE":
      return { favorites: [...state.favorites, action.payload] };
    case "REMOVE_FAVORITE":
      return {
        favorites: state.favorites.filter(
          (hotel) => hotel._id !== action.payload
        ),
      };
    default:
      return state;
  }
};

export const FavoriteContextProvider = ({ children, user }) => {
  const [state, dispatch] = useReducer(favoriteReducer, INITIAL_STATE);

  // Fetch favorites when user logs in
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        try {
          const res = await axios.get("/favorites", {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          dispatch({ type: "SET_FAVORITES", payload: res.data.hotels });
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      } else {
        dispatch({ type: "SET_FAVORITES", payload: [] });
      }
    };
    fetchFavorites();
  }, [user]);

  return (
    <FavoriteContext.Provider
      value={{
        favorites: state.favorites,
        dispatch,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};
