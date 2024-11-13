import React, { useState } from "react";
import "./rating.css";

const Rating = () => {
    const [isRatingVisible, setIsRatingVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [isRated, setIsRated] = useState(false); // Thêm state để kiểm tra đã đánh giá hay chưa
    const totalReviews = 125; // Số lượng đánh giá

    const handleRatingClick = () => {
        setIsRatingVisible(!isRatingVisible);
        if (!isRatingVisible && isRated) {
            setRating(rating); // Giữ lại đánh giá trước đó khi hiển thị lại
        }
    };

    const handleRating = (rate) => {
        setRating(rate);
        setIsRated(true); // Đánh dấu là đã đánh giá
        setIsRatingVisible(false); // Ẩn thanh sao sau khi đánh giá
    };

    const handleEditRating = () => {
        setIsRated(false); // Cho phép sửa đánh giá
        setIsRatingVisible(true); // Hiện lại thanh sao
    };

    return (
        <div className="rating-container">
            <div className="reviews-count">
                <h3>{totalReviews} đánh giá</h3>
            </div>
            <div className="rating-button">
                {!isRated ? (
                    <button onClick={handleRatingClick}>
                        {isRatingVisible ? "Ẩn đánh giá" : "Đánh giá"}
                    </button>
                ) : (
                    <div className="rating-result">
                        <div className="stars">
                            <h2>Bạn đã đánh giá:</h2>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    style={{ color: star <= rating ? "gold" : "gray", fontSize: "24px" }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <button onClick={() => setIsRated(false)}>Ẩn đánh giá</button>
                    </div>
                )}
            </div>
            {isRatingVisible && (
                <div className="stars">
                    <h2>Chọn đánh giá của bạn:</h2>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            onClick={() => handleRating(star)}
                            style={{ cursor: "pointer", color: star <= rating ? "gold" : "gray", fontSize: "24px" }}
                        >
                            ★
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Rating;