import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./favoritePage.css";
import Header from "../../components/header/Header";
import Navbar from "../../components/navbar/Navbar";

const FavoritePage = () => {
  const { user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      const fetchFavorites = async () => {
        try {
          const res = await axios.get("/favorites", {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
          setFavorites(res.data.hotels);
        } catch (error) {
          console.error("Error fetching favorites:", error);
        }
      };
      fetchFavorites();
    }
  }, [user, navigate]);

  const handleRemoveFavorite = async (hotelId) => {
    try {
      await axios.delete(`/favorites/${hotelId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      // Cập nhật lại danh sách khách sạn yêu thích
      setFavorites(favorites.filter((hotel) => hotel._id !== hotelId));
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return (
    <>
      <Navbar />
      <Header />
      <div className="favoritePage">
        <h1>Your Favorites</h1>
        <div className="favoriteHotels">
          {favorites.map((hotel) => (
            <div key={hotel._id} className="favoriteHotel">
              <button
                className="removeFavoriteBtn"
                onClick={() => handleRemoveFavorite(hotel._id)}
              >
                X
              </button>
              <h2>{hotel.name}</h2>
              <img
                src={`http://localhost:8800/api/images/${hotel.photos}`}
                alt={hotel.name}
                className="hotelImage"
              />
              <p>{hotel.address}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default FavoritePage;
