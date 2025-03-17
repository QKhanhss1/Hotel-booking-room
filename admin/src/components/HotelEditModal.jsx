import React from 'react';
import Modal from 'react-modal';

Modal.setAppElement('#root'); // hoặc phần tử gốc của ứng dụng của bạn

function HotelEditModal({
    isEditModalOpen,
    editingHotel,
    closeEditModal,
    setEditingHotel,
    handleUpdate,
    handleEditImageUpload,
    isImageUploading,
    setEditSelectedImages,

}) {
    const modalStyles = {
        overlay: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        },
        content: {
            position: 'relative',
            top: 'auto',
            left: 'auto',
            right: 'auto',
            bottom: 'auto',
            maxWidth: '4xl',
            width: '70%',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
    };

    return (
        <Modal
            isOpen={isEditModalOpen}
            onRequestClose={closeEditModal}
            style={modalStyles}
            contentLabel="Chỉnh sửa khách sạn"
        >
            {editingHotel && (
                <div
                    className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-4"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Chỉnh sửa khách sạn</h2>
                        <button
                            onClick={closeEditModal}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <input
                                type="text"
                                placeholder="Tên khách sạn"
                                disabled={isImageUploading}
                                value={editingHotel.name}
                                onChange={(e) =>
                                    setEditingHotel({ ...editingHotel, name: e.target.value })
                                }
                                className="p-2 border rounded-md"
                            />
                            <select
                                className="p-2 border rounded-md"
                                value={editingHotel.type}
                                disabled={isImageUploading}
                                onChange={(e) => setEditingHotel({ ...editingHotel, type: e.target.value })}
                            >
                                <option value="">Chọn loại</option>
                                <option value="hotel">Khách sạn</option>
                                <option value="apartment">Căn hộ</option>
                                <option value="resort">Khu nghỉ dưỡng</option>
                                <option value="villa">Biệt thự</option>
                            </select>
                            <input
                                type="text"
                                disabled={isImageUploading}
                                placeholder="Thành phố"
                                value={editingHotel.city}
                                onChange={(e) =>
                                    setEditingHotel({ ...editingHotel, city: e.target.value })
                                }
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Địa chỉ"
                                value={editingHotel.address}
                                disabled={isImageUploading}
                                onChange={(e) =>
                                    setEditingHotel({
                                        ...editingHotel,
                                        address: e.target.value,
                                    })
                                }
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Khoảng cách"
                                value={editingHotel.distance}
                                disabled={isImageUploading}
                                onChange={(e) =>
                                    setEditingHotel({
                                        ...editingHotel,
                                        distance: e.target.value,
                                    })
                                }
                                className="p-2 border rounded-md"
                            />
                            <input
                                type="text"
                                placeholder="Tiêu đề"
                                disabled={isImageUploading}
                                value={editingHotel.title}
                                onChange={(e) =>
                                    setEditingHotel({
                                        ...editingHotel,
                                        title: e.target.value,
                                    })
                                }
                                className="p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                type="number"
                                placeholder="Đánh giá (1-5)"
                                disabled={isImageUploading}
                                value={editingHotel.rating}
                                onChange={(e) =>
                                    setEditingHotel({
                                        ...editingHotel,
                                        rating: e.target.value,
                                    })
                                }
                                className="p-2 border rounded-md"
                                min="1"
                                max="5"
                            />
                            <input
                                type="file"
                                multiple
                                onChange={(e) => setEditSelectedImages(Array.from(e.target.files))}
                                className="p-2 border rounded-md"
                                disabled={isImageUploading}
                            />
                            {isImageUploading && <p>Đang tải ảnh...</p>}
                            <button
                                onClick={handleEditImageUpload}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                disabled={isImageUploading}
                            >
                                Tải ảnh
                            </button>

                        </div>
                        <div className="md:col-span-2">
                            <textarea
                                placeholder="Mô tả"
                                disabled={isImageUploading}
                                value={editingHotel.desc}
                                onChange={(e) =>
                                    setEditingHotel({ ...editingHotel, desc: e.target.value })
                                }
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
                                        className={`flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 ${editingHotel.amenities?.includes(amenity.id) ? 'bg-blue-50 border-blue-500' : ''
                                            }`}
                                        onClick={() => handleAmenityChange(amenity.id, true)}
                                    >
                                        <span className="text-gray-600 mr-2">{amenity.icon}</span>
                                        <span>{amenity.name}</span>
                                        {editingHotel.amenities?.includes(amenity.id) && (
                                            <span className="material-icons text-blue-500 ml-auto">check</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button
                                onClick={closeEditModal}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => handleUpdate(editingHotel._id)}
                                disabled={isImageUploading}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Cập nhật
                            </button>

                            {isImageUploading && (
                                <p>Xin vui lòng chờ ảnh được tải lên trước khi tạo khách sạn!</p>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
export default HotelEditModal;