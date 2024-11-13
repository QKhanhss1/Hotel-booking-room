import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./favoritePage.css";

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

  return (
    <div className="favoritePage">
      <h1>Your Favorites</h1>
      <div className="favoriteHotels">
        {favorites.map((hotel) => (
          <div key={hotel._id} className="favoriteHotel">
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
  );
};

export default FavoritePage;
