import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Hotel from "./pages/hotel/Hotel";
import List from "./pages/list/List";
import Login from "./pages/login/Login";
import SingUp from "./pages/singup/singUp";
import FavoritePage from "./pages/fa/FavoritePage";

import { FavoriteContextProvider } from "./context/FavoriteContext";
import { useContext } from "react";
import { AuthContext, AuthContextProvider } from "./context/AuthContext"; 
function App() {
  const { user } = useContext(AuthContext);

  return (
    <AuthContextProvider>
      <FavoriteContextProvider user={user}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<List />} />
            <Route path="/hotels/:id" element={<Hotel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SingUp />} />
            <Route path="/favorites" element={<FavoritePage />} />
          </Routes>
        </BrowserRouter>
      </FavoriteContextProvider>
    </AuthContextProvider>
  );
}

export default App;
