import React from 'react';

function HotelAddForm({
    showAddForm,
    setShowAddForm,
    newHotel,
    setNewHotel,
    handleImageChange,
    handleUploadImage,
    isImageUploading,
    selectedImages,
    handleCreate,
    imageIds,
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
                                type="number"
                                placeholder="Giá rẻ nhất"
                                value={newHotel.cheapestPrice}
                                onChange={(e) =>
                                    setNewHotel({ ...newHotel, cheapestPrice: e.target.value })
                                } disabled={isImageUploading}
                                className="p-2 border rounded-md"
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