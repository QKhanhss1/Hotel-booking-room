import React, { useEffect, useState } from "react";
import axios from "axios";
import "./users.css";
import Navbar from "../navbar/Navbar";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); 
  const [newRole, setNewRole] = useState(""); 

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found! Please login to access this page.");
        return;
      }

      try {
        const res = await axios.get("http://localhost:8800/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found! Please login.");
      return;
    }

    try {
      await axios.delete(`http://localhost:8800/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.filter((user) => user._id !== id)); 
      console.log("User deleted successfully.");
    } catch (err) {
      console.error("Failed to delete user", err);
    }
  };

  
  const handleUpdateRole = async (id) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No token found! Please login.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:8800/api/users/${id}`,
        { isAdmin: newRole === "admin" }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Cập nhật lại danh sách người dùng sau khi chỉnh sửa
      setUsers(
        users.map((user) =>
          user._id === id ? { ...user, isAdmin: newRole === "admin" } : user
        )
      );
      setEditingUser(null); 
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleOpenEditForm = (user) => {
    setEditingUser(user);
    setNewRole(user.isAdmin ? "admin" : "user"); 
  };

  return (
    <div className="users-container">
      <Navbar />
      <h1 className="textheader">Danh sách người dùng</h1>
      <table className="usersTable">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên người dùng</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="deleteButton"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => handleOpenEditForm(user)}
                    className="editButton"
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Không có người dùng nào.</td>
            </tr>
          )}
        </tbody>
      </table>

      {editingUser && (
        <div className="editForm">
          <h2>Chỉnh sửa quyền người dùng</h2>
          <label htmlFor="role">Chọn quyền:</label>
          <select
            id="role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
          <button onClick={() => handleUpdateRole(editingUser._id)}>
            Lưu
          </button>
          <button className="cancelButton" onClick={() => setEditingUser(null)}>
            Hủy
          </button>
        </div>
      )}
    </div>
  );
};

export default Users;
