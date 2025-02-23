import React, { useState, useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./comment.css";
import { AuthContext } from "../../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, Bounce } from 'react-toastify';

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
        alert(data.message);
        return;
      }

      setFormData({ userId: user.details._id, rating: 0, comment: "" });
      toast.success("Đánh giá của bạn đã được gửi thành công!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại!");
    }
  };

  const toggleModal = () => {
    if (!isModalOpen) {
      fetchComments();
    }
    setIsModalOpen(!isModalOpen);
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:8800/api/hotels/review/all/${id}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };
  const userId = user.details._id;
  // Hàm xử lý xóa comment
  const handleDeleteComment = async (reviewId) => {
    try {
      const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).token : null;
      // Gọi API xóa comment
      const response = await fetch(`http://localhost:8800/api/hotels/${id}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`, // Thêm header Authorization
        },
      });

      if (response.status === 200) {
        // Nếu xóa thành công, cập nhật lại danh sách comment
        setComments(comments.filter((comment) => comment._id !== reviewId));
        toast.success("Xóa đánh giá thành công!");
      } else {
        toast.error("Không thể xóa đánh giá này.");
      }
    } catch (error) {
      console.error("Lỗi khi xóa đánh giá:", error);
      toast.error("Đã xảy ra lỗi khi xóa đánh giá. Vui lòng thử lại!");
    }
  };

  return (
    <div className="Form">
      <div className="headerct">
        <h2>Bình luận và đánh giá</h2>
        <button className="viewCommentButton" onClick={toggleModal}>
          {showComments ? "Đóng danh sách" : "Xem đánh giá"}
        </button>
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="modalOverlay">
          <div className="modalContent">
            <div className="modalHeader">
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
                        {/* Nút xóa comment */}
                        {(user?.isAdmin == true || userId === comment.user) && (
                          <button
                            className="deleteCommentButton"
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </p>
                    </div>
                    <p className="commentContent">
                      {comment.comment}
                    </p>
                  </div>
                ))
              ) : (
                <p>Chưa có đánh giá nào.</p>
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
          placeholder="Viết đánh giá..."
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