import React, { useEffect, useState } from "react";
import axios from "axios";
import "./users.css";

const Users = () => {
    const [users, setUsers] = useState([]);

    // Lấy danh sách người dùng khi component được mount
    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem("token"); // Lấy token từ localStorage

            if (!token) {
                console.error("No token found! Please login to access this page.");
                return;
            }

            try {
                const res = await axios.get("http://localhost:8800/api/users", {
                    headers: {
                        Authorization: `Bearer ${token}`, // Gửi token qua header
                    },
                });
                setUsers(res.data); // Cập nhật danh sách người dùng
            } catch (err) {
                console.error("Error fetching users:", err); // Log lỗi
            }
        };

        fetchUsers();
    }, []);


    // Xóa người dùng
    const handleDeleteUser = async (id) => {
        const token = localStorage.getItem("access_token"); // Lấy token từ localStorage

        if (!token) {
            console.error("No token found! Please login.");
            return;
        }

        try {
            await axios.delete(`http://localhost:8800/api/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Gửi token qua header
                },
            });
            setUsers(users.filter((user) => user._id !== id)); // Cập nhật danh sách người dùng
            console.log("User deleted successfully.");
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };


    return (
        <div className="users-container">
            <h1>Danh sách người dùng</h1>
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
        </div>
    );

};

export default Users;
