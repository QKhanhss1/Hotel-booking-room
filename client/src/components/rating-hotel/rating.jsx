import React, { useState } from "react";
import "./rating.css";

const Rating = () => {
    const [isRatingVisible, setIsRatingVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [isRated, setIsRated] = useState(false); 
    const totalReviews = 125; 
    const handleRatingClick = () => {
        setIsRatingVisible(!isRatingVisible);
        if (!isRatingVisible && isRated) {
            setRating(rating); 
        }
    };

    const handleRating = (rate) => {
        setRating(rate);
        setIsRated(true); // Đánh dấu là đã đánh giá
        setIsRatingVisible(false); // Ẩn thanh sao sau khi đánh giá
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
                    <div className="modal">
                        <div className="modal-content" onClick={() => setIsRated(false)}>
                            <div className="rating-result">
                                <div className="stars">
                                    <h2 style={{ display: "inline" }}>Bạn đã đánh giá: </h2>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            style={{ color: star <= rating ? "gold" : "gray", fontSize: "24px", marginLeft: "5px" }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {isRatingVisible && (
                <div className="modal">
                    <div className="modal-content">
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rating;