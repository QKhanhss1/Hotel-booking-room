import React from 'react';

function HotelCard({ hotel, handleHotelClick, startEditing, handleDelete }) {
    return (
        <div className="Room-1 flex-col justify-start items-start gap-2 flex px-2">
            <div className="flex flex-col items-center h-full w-full">
                <img
                    className="Image h-60 relative w-full object-cover rounded-lg cursor-pointer"
                    src={Array.isArray(hotel.images) ? hotel.images[0] : null}
                    alt={hotel.name}
                    onClick={() => handleHotelClick(hotel._id)}
                />
                <div className="Name text-[#1a1a1a] text-xl font-semibold font-['Inter'] leading-loose text-center w-full">
                    {hotel.name}
                </div>

                <div className="Type flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Loại khách sạn:</span>
                    <span>{hotel.type}</span>
                </div>

                <div className="City flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Thành phố:</span>
                    <span>{hotel.city}</span>
                </div>

                <div className="Address flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Địa chỉ:</span>
                    <span>{hotel.address}</span>
                </div>

                <div className="Distance flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Khoảng cách:</span>
                    <span>{hotel.distance}</span>
                </div>

                <div className="Title flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Tiêu đề:</span>
                    <span>{hotel.title}</span>
                </div>

                <div className="Rating flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Đánh giá:</span>
                    <span className="text-yellow-500">
                        {"★".repeat(Math.floor(hotel.rating))}
                        {"☆".repeat(5 - Math.floor(hotel.rating))}
                    </span>
                    <span>({hotel.rating}/5)</span>
                </div>

                <div className="LowestPrice flex items-center gap-2 text-[#1a1a1a] font-['Inter'] w-full">
                    <span className="font-semibold">Giá từ:</span>
                    <span className="text-blue-600 font-semibold">
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                        }).format(hotel.cheapestPrice)}
                        /đêm
                    </span>
                </div>

                <div className="Mo-ta text-[#667084] text-base font-normal font-['Inter'] leading-relaxed overflow-hidden flex-grow mt-2">
                    <span className="font-semibold">Mô tả: </span>
                    <span>{hotel.desc}</span>
                </div>

                <div className="flex gap-6 mt-auto pt-4">
                    <button
                        onClick={() => startEditing(hotel)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                    >
                        Sửa
                    </button>
                    <button
                        onClick={() => handleDelete(hotel._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                    >
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HotelCard;