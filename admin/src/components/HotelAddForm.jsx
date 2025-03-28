import React from 'react';

function HotelAddForm({
    showAddForm,
   
    newHotel,
    setNewHotel,
    handleImageChange,
    handleUploadImage,
    isImageUploading,
    selectedImages,
    handleCreate,
    availableAmenities,
    handleAmenityChange
}) {
    return (
        <>
            {showAddForm && (
                <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Tên khách sạn"
                                value={newHotel.name}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, name: e.target.value })
                                }
                                disabled={isImageUploading}
                                className="p-2 border rounded-md"
                            />
                            <select
                                className="p-2 border rounded-md"
                                disabled={isImageUploading}
                                value={newHotel.type}
                                onChange={(e) => setNewHotel({ ...newHotel, type: e.target.value })}
                            >
                                <option value="">Chọn loại</option>
                                <option value="hotel">Khách sạn</option>
                                <option value="apartment">Căn hộ</option>
                                <option value="resort">Khu nghỉ dưỡng</option>
                                <option value="villa">Biệt thự</option>
                                <option value="cabin">Nhà gỗ nhỏ</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Thành phố"
                                value={newHotel.city}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, city: e.target.value })
                                }
                                disabled={isImageUploading}
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Địa chỉ"
                                value={newHotel.address}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, address: e.target.value })
                                } disabled={isImageUploading}
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Khoảng cách"
                                value={newHotel.distance}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, distance: e.target.value })
                                } disabled={isImageUploading}
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Tiêu đề"
                                value={newHotel.title}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, title: e.target.value })
                                } disabled={isImageUploading}
                                className="p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                type="number"
                                placeholder="Đánh giá (1-5)"
                                value={newHotel.rating}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, rating: e.target.value })
                                } disabled={isImageUploading}
                                className="p-2 border rounded-md"
                                min="1"
                                max="5"
                            />
                            <input
                                type="file"
                                multiple
                                onChange={handleImageChange}
                                className="p-2 border rounded-md"
                                disabled={isImageUploading}
                            />
                            {isImageUploading && <p>Đang tải ảnh...</p>}
                            <button
                                onClick={handleUploadImage}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                disabled={isImageUploading}
                            >
                                Tải ảnh
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <textarea
                                placeholder="Mô tả"
                                value={newHotel.desc}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, desc: e.target.value })
                                } disabled={isImageUploading}
                                className="w-full p-2 border rounded-md"
                                rows="3"
                            />
                        </div>
                        <div className="md:col-span-2 mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tiện ích khách sạn</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {availableAmenities.map((amenity) => (
                                    <div
                                        key={amenity.id}
                                        className={`flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 ${newHotel.amenities.includes(amenity.id) ? 'bg-blue-50 border-blue-500' : ''
                                            }`}
                                        onClick={() => handleAmenityChange(amenity.id)}
                                    >
                                        <span className="text-gray-600 mr-2">{amenity.icon}</span>
                                        <span>{amenity.name}</span>
                                        {newHotel.amenities.includes(amenity.id) && (
                                            <span className="material-icons text-blue-500 ml-auto">check</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">

                            <button
                                onClick={handleCreate}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                                disabled={isImageUploading || selectedImages.length === 0}
                            >
                                Thêm Khách Sạn
                            </button>
                            {isImageUploading && (
                                <p>Xin vui lòng chờ ảnh được tải lên trước khi tạo khách sạn!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default HotelAddForm;