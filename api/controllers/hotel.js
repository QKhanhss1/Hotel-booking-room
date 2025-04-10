import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";

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
  const { name, type, city, address, desc, distance, title, imageIds, rating, amenities } = req.body;
  
  try {
    // Lấy thông tin khách sạn hiện tại để giữ nguyên giá trị cheapestPrice
    const existingHotel = await Hotel.findById(req.params.id);
    if (!existingHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        city,
        address,
        desc,
        distance,
        title,
        imageIds: imageIds,
        rating,
        amenities,
        // Giữ nguyên giá trị cheapestPrice
        cheapestPrice: existingHotel.cheapestPrice 
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
  } catch (err) {
    console.error("Error updating hotel:", err);
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
  const { min, max, city, name, ...others } = req.query;
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
    
    // Hàm chuẩn hóa chuỗi (bỏ dấu và chuyển thành chữ thường)
    const normalizeString = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };
    
    // Mảng chứa các điều kiện tìm kiếm
    const conditions = [];
    
    // Xử lý tìm kiếm city không phân biệt hoa thường và dấu
    if (city) {
      const cityCondition = {
        $or: [
          { city: { $regex: city, $options: "i" } },  // Tìm chuỗi gốc
          { normalizedCity: { $regex: normalizeString(city), $options: "i" } }  // Tìm chuỗi đã chuẩn hóa
        ]
      };
      conditions.push(cityCondition);
    }
    
    // Xử lý tìm kiếm tên khách sạn không phân biệt hoa thường và dấu
    if (name) {
      const nameCondition = {
        $or: [
          { name: { $regex: name, $options: "i" } },  // Tìm chuỗi gốc
          { normalizedName: { $regex: normalizeString(name), $options: "i" } }  // Tìm chuỗi đã chuẩn hóa
        ]
      };
      conditions.push(nameCondition);
    }
    
    // Nếu có điều kiện tìm kiếm, thêm vào query
    if (conditions.length > 0) {
      query.$or = conditions;
    }
    
    const hotels = await Hotel.find(query)
      .populate('imageIds')
      .populate({
        path: 'rooms',
        model: 'Room',
        select: 'amenities'
      });
    
    // Thêm trường normalizedName và normalizedCity vào kết quả để so sánh
    const hotelsWithNormalizedFields = hotels.map(hotel => {
      const hotelObj = hotel.toObject();
      hotelObj.normalizedName = normalizeString(hotel.name);
      hotelObj.normalizedCity = normalizeString(hotel.city);
      return hotelObj;
    });
    
    // Lọc kết quả dựa trên các trường đã chuẩn hóa
    let filteredHotels = hotelsWithNormalizedFields;
    
    if (city) {
      const normalizedCityQuery = normalizeString(city);
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.city.toLowerCase().includes(city.toLowerCase()) || 
        hotel.normalizedCity.includes(normalizedCityQuery)
      );
    }
    
    if (name) {
      const normalizedNameQuery = normalizeString(name);
      filteredHotels = filteredHotels.filter(hotel => 
        hotel.name.toLowerCase().includes(name.toLowerCase()) || 
        hotel.normalizedName.includes(normalizedNameQuery)
      );
    }
    
    res.status(200).json(filteredHotels);
  } catch (err) {
    console.error("Error in getHotels:", err);
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
  const { userId, rating, comment, images } = req.body;

  try {
    console.log("Creating review for user:", userId, "with images:", images);
    
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
      images: images || []
    };

    // Thêm vào mảng reviews
    hotel.reviews.push(review);

    // Cập nhật số lượng đánh giá và điểm trung bình
    hotel.numReviews = hotel.reviews.length;
    hotel.rating =
      hotel.reviews.reduce((acc, item) => item.rating + acc, 0) /
      hotel.reviews.length;

    // Lưu khách sạn với đánh giá mới
    const updatedHotel = await hotel.save();
    
    // Lấy đánh giá vừa thêm (phần tử cuối cùng trong mảng reviews)
    const newReview = updatedHotel.reviews[updatedHotel.reviews.length - 1];
    
    console.log("Review saved successfully:", newReview._id);

    // Trả về thông tin đánh giá mới
    res.status(201).json({ 
      message: "Thêm bình luận thành công!",
      review: newReview
    });
  } catch (error) {
    console.error("Error creating review:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getReviewsByHotelId = async (req, res, next) => {
  try {
    const hotelId = req.params.id;

    // Tìm khách sạn theo ID
    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ message: "Khách sạn không tồn tại" });
    }

    // Xử lý ảnh trong review nếu có
    const reviews = await Promise.all(hotel.reviews.map(async (review) => {
      let reviewObj = review._doc || review;
      
      console.log("Processing review:", reviewObj._id, "Images:", reviewObj.images);
      
      // Nếu review có trường images và không rỗng
      if (reviewObj.images && reviewObj.images.length > 0) {
        try {
          // Lấy URL thực từ các imageId
          const imageUrls = await Promise.all(
            reviewObj.images.map(async (imageId) => {
              try {
                console.log("Fetching image:", imageId);
                const image = await mongoose.model('Image').findById(imageId);
                console.log("Image result:", image ? image._id : "not found", image ? image.url : "no url");
                return image ? image.url : null;
              } catch (error) {
                console.error(`Error fetching image ${imageId}:`, error);
                return null;
              }
            })
          );
          
          // Lọc null và undefined
          const filteredUrls = imageUrls.filter(url => url);
          console.log("Filtered image URLs:", filteredUrls.length);
          reviewObj.images = filteredUrls;
        } catch (error) {
          console.error("Error processing images for review:", reviewObj._id, error);
          reviewObj.images = [];
        }
      } else {
        reviewObj.images = [];
      }
      
      return {
        ...reviewObj,
        hotelName: hotel.name
      };
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
    console.log("Original query in getCitiesByQuery:", query);

    // Hàm chuẩn hóa chuỗi (bỏ dấu và chuyển thành chữ thường)
    const normalizeString = (str) => {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    // Tìm tất cả khách sạn
    const hotels = await Hotel.find({});
    console.log(`Found ${hotels.length} hotels in database`);
    
    // Nếu không có query hoặc query rỗng, trả về các thành phố phổ biến
    if (!query || query.trim() === '') {
      const popularCities = hotels
        .reduce((acc, hotel) => {
          const cityKey = hotel.city.toLowerCase();
          if (!acc[cityKey]) {
            acc[cityKey] = {
              name: hotel.city,
              count: 1,
              category: 'city'
            };
          } else {
            acc[cityKey].count++;
          }
          return acc;
        }, {});
      
      const cities = Object.values(popularCities)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      console.log(`Returning ${cities.length} popular cities`);
      return res.status(200).json(cities);
    }
    
    // Chuẩn hóa query để tìm kiếm
    const normalizedQuery = normalizeString(query);
    const originalQuery = query.toLowerCase();
    console.log("Normalized query:", normalizedQuery);
    console.log("Original lowercase query:", originalQuery);
    
    // Mảng kết quả tìm kiếm
    let results = [];
    
    // 1. Tìm các thành phố phù hợp
    const matchingCities = hotels
      .filter(hotel => {
        const normalizedCity = normalizeString(hotel.city);
        const cityMatch = normalizedCity.includes(normalizedQuery) || 
                         hotel.city.toLowerCase().includes(originalQuery);
        return cityMatch;
      })
      .reduce((acc, hotel) => {
        const cityKey = hotel.city.toLowerCase();
        if (!acc[cityKey]) {
          acc[cityKey] = {
            _id: hotel._id,
            name: hotel.city,
            count: 1,
            category: 'city'
          };
        } else {
          acc[cityKey].count++;
        }
        return acc;
      }, {});
    
    const cities = Object.values(matchingCities)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    results = [...results, ...cities];
    console.log(`Found ${cities.length} matching cities`);
    
    // 2. Tìm các loại khách sạn phù hợp
    const matchingTypes = hotels
      .filter(hotel => {
        const normalizedType = normalizeString(hotel.type);
        const typeMatch = normalizedType.includes(normalizedQuery) || 
                         hotel.type.toLowerCase().includes(originalQuery);
        return typeMatch;
      })
      .reduce((acc, hotel) => {
        const typeKey = hotel.type.toLowerCase();
        if (!acc[typeKey]) {
          acc[typeKey] = {
            _id: hotel._id,
            name: hotel.type,
            count: 1,
            category: 'type'
          };
        } else {
          acc[typeKey].count++;
        }
        return acc;
      }, {});
    
    const types = Object.values(matchingTypes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    results = [...results, ...types];
    console.log(`Found ${types.length} matching types`);
    
    // 3. Tìm các khách sạn phù hợp theo tên và địa chỉ
    const matchingHotels = hotels
      .filter(hotel => {
        const normalizedName = normalizeString(hotel.name);
        const normalizedAddress = hotel.address ? normalizeString(hotel.address) : '';
        
        const nameMatch = normalizedName.includes(normalizedQuery) || 
                         hotel.name.toLowerCase().includes(originalQuery);
        
        const addressMatch = normalizedAddress.includes(normalizedQuery) || 
                           (hotel.address && hotel.address.toLowerCase().includes(originalQuery));
        
        return nameMatch || addressMatch;
      })
      .map(hotel => ({
        _id: hotel._id,
        name: hotel.name,
        city: hotel.city,
        category: 'hotel',
        type: hotel.type,
        address: hotel.address
      }))
      .slice(0, 5);
    
    results = [...results, ...matchingHotels];
    console.log(`Found ${matchingHotels.length} matching hotels`);
    
    // Log kết quả trước khi trả về
    console.log(`Total results: ${results.length}`);
    results.forEach((item, index) => {
      console.log(`Result ${index+1}: ${item.category} - ${item.name}`);
    });
    
    res.status(200).json(results);
  } catch (err) {
    console.error('Error in getCitiesByQuery:', err);
    next(err);
  }
};

// Thêm API endpoint để lấy tất cả các city từ database
export const getCities = async (req, res, next) => {
  try {
    // Lấy tất cả các cities từ database
    const cities = await Hotel.aggregate([
      { $group: { 
        _id: "$city", 
        count: { $sum: 1 },
        // Lấy image ID đầu tiên từ một khách sạn ngẫu nhiên trong city đó
        sampleHotel: { $first: "$imageIds" }
      }},
      { $sort: { count: -1 } }, // Sắp xếp theo số lượng khách sạn giảm dần
      { $project: { 
        _id: 0, 
        name: "$_id", 
        count: 1,
        imageId: { $arrayElemAt: ["$sampleHotel", 0] } // Lấy hình ảnh đầu tiên
      }}
    ]);

    // Thêm URL hình ảnh cho mỗi city
    const citiesWithImages = await Promise.all(cities.map(async (city) => {
      let imageUrl = null;
      
      if (city.imageId) {
        try {
          // Tìm URL hình ảnh từ image ID
          const image = await mongoose.model('Image').findById(city.imageId);
          if (image && image.url) {
            imageUrl = image.url;
          }
        } catch (err) {
          console.error(`Error fetching image for city ${city.name}:`, err);
        }
      }
      
      return {
        ...city,
        imageUrl: imageUrl || `https://source.unsplash.com/300x200/?${city.name},city`,
        category: 'city'
      };
    }));

    res.status(200).json(citiesWithImages);
  } catch (err) {
    next(err);
  }
};

// Thêm hàm cập nhật giá phòng nhỏ nhất cho khách sạn
export const updateCheapestPrice = async (hotelId) => {
  try {
    // Tìm tất cả phòng của khách sạn
    const hotel = await Hotel.findById(hotelId).populate('rooms');
    
    if (!hotel || !hotel.rooms || hotel.rooms.length === 0) {
      console.log(`Không có phòng cho khách sạn ${hotelId}`);
      return;
    }
    
    // Tìm giá phòng nhỏ nhất
    const cheapestPrice = Math.min(...hotel.rooms.map(room => room.price || Infinity));
    
    if (cheapestPrice === Infinity) {
      console.log(`Không tìm thấy giá phòng hợp lệ cho khách sạn ${hotelId}`);
      return;
    }
    
    // Cập nhật giá phòng nhỏ nhất cho khách sạn
    await Hotel.findByIdAndUpdate(hotelId, { cheapestPrice: cheapestPrice });
    console.log(`Đã cập nhật giá phòng nhỏ nhất cho khách sạn ${hotelId}: ${cheapestPrice}`);
  } catch (error) {
    console.error(`Lỗi khi cập nhật giá phòng nhỏ nhất cho khách sạn ${hotelId}:`, error);
  }
};





