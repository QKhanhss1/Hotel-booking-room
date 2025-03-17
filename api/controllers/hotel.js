import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

export const createHotel = async (req, res, next) => {
  const newHotel = new Hotel(req.body);
  try {
    const savedHotel = await newHotel.save();
    const populatedHotel = await Hotel.findById(savedHotel._id).populate('imageIds');
    res.status(200).json(populatedHotel);
  } catch (err) {
    console.error('Error creating hotel', err); // Log lỗi
    next(err);
  }
};

export const updateHotel = async (req, res, next) => {
  console.log('req.body updateHotel', req.body);
  const { name, type, city, address, desc, cheapestPrice, distance, title, imageIds, rating } = req.body;
  const updatedHotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    {
      name,
      type,
      city,
      address,
      desc,
      cheapestPrice,
      distance,
      title,
      imageIds: imageIds,
      rating
    },
    { new: true }
  );
  console.log('updatedHotel', updatedHotel);
  if (!updatedHotel) {
    return res.status(404).json({ message: 'Hotel not found' });
  }
  const populatedHotel = await Hotel.findById(updatedHotel._id).populate('imageIds');
  // console.log('populatedHotel', populatedHotel);
  // console.log('populatedHotel.imageIds', populatedHotel.imageIds);
  const modifiedHotel = {
    ...populatedHotel.toObject(),
    imageIds: populatedHotel.imageIds ? populatedHotel.imageIds.map((image) => image._id.toString()) : [],
  };
  res.status(200).json(modifiedHotel);
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
  const { min, max, city, ...others } = req.query;
  try {
    // Tạo đối tượng tìm kiếm
    let query = {};
    
    // Xử lý tất cả các tham số khác
    Object.keys(others).forEach(key => {
      query[key] = others[key];
    });
    
    // Thêm điều kiện lọc giá
    query.cheapestPrice = { 
      $gte: min || 0, 
      $lte: max || 99999999 
    };
    
    // Xử lý tìm kiếm city không phân biệt hoa thường và dấu
    if (city) {
      query.city = { $regex: new RegExp(city, "i") };
    }
    
    const hotels = await Hotel.find(query).populate('imageIds');
    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};
export const getAllHotel= async (req, res, next) => {
  try {
    const hotels = await Hotel.find({
    
    }).populate('imageIds')
    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};
export const getFeaturedHotels = async (req, res, next) => {
  try {

    const getFeaturedHotels = await Hotel.find({ rating: { $exists: true, $ne: null } }) // Lọc khách sạn có rating
      .sort({ rating: -1 }).populate('imageIds');

    res.status(200).json(getFeaturedHotels);
  } catch (err) {
    next(err);
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
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Populate rooms with all details
    const hotelWithRooms = await Hotel.findById(req.params.id)
      .populate({
        path: 'rooms',
        populate: {
          path: 'imageIds',
          model: 'Image',
          select: '_id url'
        }
      })
      .exec();

    const validRooms = hotelWithRooms.rooms.filter(room => room !== null);

    // Get all successful and pending bookings
    const bookings = await Booking.find({
      hotelId: req.params.id,
      paymentStatus: { $in: ["success", "pending"] }, // Include both successful and pending bookings
      'paymentInfo.checkoutDate': { $gte: new Date() } // Only consider current and future bookings
    });

    // Process each room to check availability
    const processedRooms = validRooms.map(room => {
      const roomObj = room.toObject();
      
      // Check each roomNumber's availability
      const availableRoomNumbers = room.roomNumbers.filter(roomNumber => {
        return !bookings.some(booking => {
          return booking.selectedRooms.some(selectedRoom => {
            if (selectedRoom.roomId.equals(room._id) && 
                selectedRoom.roomNumber === roomNumber.number) {
                
              const bookingStart = new Date(booking.paymentInfo.checkinDate);
              const bookingEnd = new Date(booking.paymentInfo.checkoutDate);
              const requestStart = new Date(req.query.startDate);
              const requestEnd = new Date(req.query.endDate);

              // Check if there's any overlap in dates
              return (
                (requestStart <= bookingEnd && requestEnd >= bookingStart)
              );
            }
            return false;
          });
        });
      });

      return {
        ...roomObj,
        roomNumbers: availableRoomNumbers
      };
    });

    // Only return rooms that have available room numbers
    const availableRooms = processedRooms.filter(room => room.roomNumbers.length > 0);
    res.status(200).json(availableRooms);

  } catch (err) {
    console.error("Error in getHotelRooms:", err);
    next(err);
  }
};

//review
export const createReview = async (req, res) => {
  const { userId, rating, comment } = req.body;

  try {
    const user = await User.findById(userId);
    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId trong yêu cầu!" });
    }

    // Tìm khách sạn theo ID
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Khách sạn không tồn tại!" });
    }

    // Kiểm tra xem người dùng đã đánh giá chưa
    const alreadyReviewed = hotel.reviews.find(
      (review) => review.user.toString() === userId
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Bạn đã đánh giá trước đó rồi!" });
    }

    // Tạo đánh giá mới
    const review = {
      username: user.username || "Ẩn danh", // Tên người dùng từ body
      rating: Number(rating),
      comment,
      user: userId,
    };

    hotel.reviews.push(review);

    // Cập nhật số lượng đánh giá và điểm trung bình
    hotel.numReviews = hotel.reviews.length;
    hotel.rating =
      hotel.reviews.reduce((acc, item) => item.rating + acc, 0) /
      hotel.reviews.length;

    await hotel.save();

    res.status(201).json({ message: "Thêm bình luận thành công!" });
  } catch (error) {
    console.error("Error creating review:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};
  //get all
  export const getReviewsByHotelId = async (req, res, next) => {
    try {
      const hotelId = req.params.id;

      // Tìm khách sạn theo ID và chỉ lấy trường `reviews` và `name`
      const hotel = await Hotel.findById(hotelId);
      
      if (!hotel) {
        return res.status(404).json({ message: "Khách sạn không tồn tại" });
      }

      // Trả về các đánh giá kèm tên khách sạn
      const reviews = hotel.reviews.map((review) => ({
        ...review._doc,
        hotelName: hotel.name,
      }));

      res.status(200).json(reviews);
    } catch (err) {
      console.error("Lỗi:", err);
      next(err);
    }
  };

//
export const getHotelsByType = async (req, res, next) => {
  const { type } = req.params;

  // Kiểm tra và chuẩn hóa type trước khi tìm kiếm
  const normalizedType = type.trim().toLowerCase(); // Loại bỏ khoảng trắng và chuyển thành chữ thường

  console.log("Searching for hotels of type:", normalizedType);

  try {
    const hotels = await Hotel.find({ type: { $regex: new RegExp("^" + normalizedType + "$", "i") } }).populate('imageIds');;  // Dùng regex để tìm chính xác

    console.log("Hotels found:", hotels);

    if (!hotels || hotels.length === 0) {
      return res.status(404).json({ message: `No hotels found for type: ${normalizedType}` });
    }

    res.status(200).json(hotels);
  } catch (err) {
    next(err);
  }
};
export const deleteReview = async (req, res) => {
  const { hotelId, reviewId } = req.params;

  try {
    // 1. Tìm khách sạn
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }
    
    const review = hotel.reviews.id(reviewId); // Lấy review bằng ID của nó
    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy bình luận" });
    }
    console.log("req.user:", req.user); // DEBUG
    console.log("review.user:", review.user); // DEBUG
    // Kiểm tra quyền xóa: chỉ admin hoặc người tạo bình luận mới được xóa
    if (req.user.isAdmin !== true && review.user.toString() !== req.user.id.toString()) { 
      return res.status(403).json({ message: "Bạn không có quyền xóa bình luận này" });
    }
    // 2. Lọc bỏ review cần xóa
    hotel.reviews = hotel.reviews.filter(
      (review) => review._id.toString() !== reviewId
    );

    // 3. Cập nhật lại số lượng review và rating trung bình
    hotel.numReviews = hotel.reviews.length;

    if (hotel.numReviews > 0) {
      const totalRating = hotel.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      hotel.rating = totalRating / hotel.numReviews;
    } else {
      hotel.rating = 0; // Nếu không còn review nào thì rating = 0
    }

    // 4. Lưu lại khách sạn đã cập nhật
    await hotel.save();

    res.status(200).json({ message: "Xóa bình luận thành công", hotel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const getCitiesByQuery = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    // Find unique cities that match the query (case-insensitive) with counts
    const cities = await Hotel.aggregate([
      { 
        $match: { 
          city: query ? { $regex: query, $options: "i" } : { $exists: true }
        } 
      },
      { 
        $group: { 
          _id: "$city",
          count: { $sum: 1 }
        } 
      },
      { 
        $project: { 
          _id: 0, 
          name: "$_id",
          count: 1,
          category: "city"
        } 
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: query ? 5 : 10
      }
    ]);
    
    // Find unique types that match the query (case-insensitive) with counts
    let types = [];
    if (query) {
      types = await Hotel.aggregate([
        { 
          $match: { 
            type: { $regex: query, $options: "i" } 
          } 
        },
        { 
          $group: { 
            _id: "$type",
            count: { $sum: 1 }
          } 
        },
        { 
          $project: { 
            _id: 0, 
            name: "$_id",
            count: 1,
            category: "type"
          } 
        },
        {
          $limit: 3
        }
      ]);
    }
    
    // Combine results
    const results = query ? [...cities, ...types] : cities;
    
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};





