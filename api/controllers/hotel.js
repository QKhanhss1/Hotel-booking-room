import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

export const createHotel = async (req, res, next) => {
  const newHotel = new Hotel(req.body);

  try {
    const savedHotel = await newHotel.save();
    res.status(200).json(savedHotel);
  } catch (err) {
    next(err);
  }
};
export const updateHotel = async (req, res, next) => {
  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedHotel);
  } catch (err) {
    next(err);
  }
};
export const deleteHotel = async (req, res, next) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id);
    res.status(200).json("Hotel has been deleted.");
  } catch (err) {
    next(err);
  }
};
export const getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    res.status(200).json(hotel);
  } catch (err) {
    next(err);
  }
};
export const getHotels = async (req, res, next) => {
  const { min, max, ...others } = req.query;
  try {
    const hotels = await Hotel.find({
      ...others,
      cheapestPrice: { $gte: min || 0, $lte: max || 999 },
    })
    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};
export const getFeaturedHotels = async (req, res, next) => {
  try {
    
    const featuredHotels = await Hotel.find({ featured: true }).limit(4);
    
  
    res.status(200).json(featuredHotels);
  } catch (err) {
    next(err); // Xử lý lỗi nếu có
  }
};
export const countByCity = async (req, res, next) => {
  const cities = req.query.cities.split(",");
  try {
    const list = await Promise.all(
      cities.map((city) => {
        return Hotel.countDocuments({ city: city });
      })
    );
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};
export const countByType = async (req, res, next) => {
  try {
    const hotelCount = await Hotel.countDocuments({ type: "hotel" });
    const apartmentCount = await Hotel.countDocuments({ type: "apartment" });
    const resortCount = await Hotel.countDocuments({ type: "resort" });
    const villaCount = await Hotel.countDocuments({ type: "villa" });
    const cabinCount = await Hotel.countDocuments({ type: "cabin" });

    res.status(200).json([
      { type: "hotel", count: hotelCount },
      { type: "apartments", count: apartmentCount },
      { type: "resorts", count: resortCount },
      { type: "villas", count: villaCount },
      { type: "cabins", count: cabinCount },
    ]);
  } catch (err) {
    next(err);
  }
};

export const getHotelRooms = async (req, res, next) => {
  try {
    // Get hotel by ID
    const hotel = await Hotel.findById(req.params.id).populate('rooms');
    console.log("Hotel found:", hotel); // Log hotel
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
 
    console.log("Rooms in hotel:", hotel.rooms); // Log rooms
    // If the hotel has no rooms, return an empty array
    // if (!hotel.rooms || hotel.rooms.length === 0) {
    //   return res.status(200).json([]);  
    // }
    if (!hotel.rooms || hotel.rooms.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }


    const rooms = await Promise.all(
      hotel.rooms.map((roomId) => Room.findById(roomId))
    );

    res.status(200).json(rooms); 
  } catch (err) {
    next(err); 
  }
};
