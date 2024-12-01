import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./comment.css";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const Comment = () => {
  const { user } = useContext(AuthContext);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id } = useParams();

  const [formData, setFormData] = useState({
    userId: user.details._id,
    rating: 0,
    comment: "",
  });
 

  const handleRatingChange = (ratingValue) => {
    setFormData((prevState) => ({ ...prevState, rating: ratingValue }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id) {
      console.error("Không có khách sạn!");
      return;
    }

    if (!user || !user.details._id) {
      console.error("Chưa đăng nhập!");
      return;
    }

    const payload = {
      ...formData,
      userId: user.details._id,
    };

    console.log("Submitted data:", payload);

    try {
      const response = await fetch(`http://localhost:8800/api/hotels/reviews/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.status === 400 && data.message === "Bạn đã đánh giá trước đó rồi!") {
        // If the user has already reviewed, show an error alert
        alert(data.message);
        return;
      }

      // Reset form sau khi gửi thành công
      setFormData({ userId: user.details._id, rating: 0, comment: "" });
      alert("Đánh giá của bạn đã được gửi thành công!");
    } catch (error) {
      console.error("Error:", error);
      alert("Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại!");
    }
  };
  //mở model comment
  const toggleModal = () => {
    if (!isModalOpen) {
      fetchComments();
    }
    setIsModalOpen(!isModalOpen);
  };
  //lấy comment
  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:8800/api/hotels/review/all/${id}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };


  return (
    <div className="Form">
      <div className="headerct">
        <h2>Bình luận và đánh giá</h2>
        <button className="viewCommentButton" onClick={toggleModal}>
          {showComments ? "Đóng danh sách" : "Xem bình luận"}
        </button>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modalContent">
            <div className="modalHeader">
              {/* Font Awesome Close Icon */}
              <h3 className="modalTitle">Bình luận</h3>
              <FontAwesomeIcon
                icon={faTimes}
                className="closeModalButton"
                onClick={toggleModal}
              />
            </div>
            <div className="commentList">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={index} className="commentItem">
                    <div className="commentHeader">
                      <p className="username">
                        <strong>{comment.username}</strong>
                      </p>
                      <p className="rating">
                        {[...Array(comment.rating)].map((_, i) => (
                          <span key={i} className="staricon">
                            ★
                          </span>
                        ))}
                      </p>
                    </div>
                    <p className="commentContent">
                      {comment.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p>Chưa có bình luận nào.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex-column">
        <div className="flex-row">
          <label htmlFor="rating">Đánh giá:</label>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star-icon ${formData.rating >= star ? "filled" : ""}`}
                onClick={() => handleRatingChange(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <textarea
          name="comment"
          placeholder="Viết bình luận..."
          value={formData.comment}
          onChange={handleChange}
          required
        ></textarea>
        <div className="submit-container">
          <button type="submit">Gửi</button>
        </div>
      </form>
    </div>
  );
};

export default Comment;
