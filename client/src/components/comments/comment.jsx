import React, { useState } from "react";
import "./comment.css";

const Comment= () => {
    return (
      <div className="Form">
        <h2>Bình luận</h2>
        <div className="flex-column">
          <textarea placeholder="Viết bình luận.."></textarea>
          <div class="flex-row">
            <input type="text" placeholder="Nhập tên" />
            <input type="email" placeholder="Nhập email" />
          </div>
          
          <div class="submit-container">
            <button>Gửi</button>
          </div>
        </div>
</div>
    );
};

export default Comment;