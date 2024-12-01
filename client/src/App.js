import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import Hotel from "./pages/hotel/Hotel";
import List from "./pages/list/List";
import Login from "./pages/login/Login";
import SingUp from "./pages/singup/singUp";
import FavoritePage from "./pages/fa/FavoritePage";
import { HashRouter } from "react-router-dom"; 
import HotelTypes from "./pages/hotelTypes/hotelTypes";
import { FavoriteContextProvider } from "./context/FavoriteContext";
import { useContext } from "react";
import { AuthContext, AuthContextProvider } from "./context/AuthContext"; 
import Payment from "./pages/payment/payment";
import PaymentStatus from "./pages/payment/paymentStatus";
import BookingPage from "./pages/booking/booking";
function App() {
  const { user } = useContext(AuthContext);

  return (
    <AuthContextProvider>
      <FavoriteContextProvider user={user}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels" element={<List />} />
            <Route path="/hotel-types" element={<HotelTypes />} />
            <Route path="/hotels/:id" element={<Hotel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SingUp />} />
            <Route path="/favorites" element={<FavoritePage />} />
            <Route path="/payment/:status" element={<PaymentStatus />} />
            <Route path="/booking" element={<BookingPage />} />
          </Routes>
        </BrowserRouter>
      </FavoriteContextProvider>
    </AuthContextProvider>
  );
}

export default App;
