import axios from "axios";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";


const Login = () => {
    const [credentials, setCredentials] = useState({
        username: undefined,
        password: undefined,
    });


    const { loading, error, dispatch } = useContext(AuthContext);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleClick = async (e) => {
        e.preventDefault();
        dispatch({ type: "LOGIN_START" });
        try {
            const res = await axios.post("/auth/login", credentials);
    //         if (res.data.isAdmin) {
    //             if (res.data.token) {
    //                 localStorage.setItem("token", res.data.token);
    //                 dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
    //                 console.log("có token")
    //             } else {
    //                 console.log("không có token")
    //             }

    //             navigate("/");
    //         } else {
    //             dispatch({
    //                 type: "LOGIN_FAILURE",
    //                 payload: { message: "You are not allowed!" },
    //             });
    //         }
    //     } catch (err) {
    //         dispatch({ type: "LOGIN_FAILURE", payload: err.response.data });
    //     }
    // };
    if (res && res.data) {
        if (res.data.isAdmin) {
            // Lưu token nếu có
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }
            
            // Kiểm tra details tồn tại trước khi dispatch
            if (res.data.details) {
                dispatch({ type: "LOGIN_SUCCESS", payload: res.data.details });
            } else {
                dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
            }
            
            navigate("/");
        } else {
            dispatch({
                type: "LOGIN_FAILURE",
                payload: { message: "Bạn không có quyền truy cập!" },
            });
        }
    } else {
        throw new Error("Invalid response format");
    }
} catch (err) {
    dispatch({ 
        type: "LOGIN_FAILURE", 
        payload: err.response?.data || { message: "Đăng nhập thất bại!" }
    });
}
};

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="flex flex-col gap-4 p-8 bg-white rounded-lg shadow-lg w-96">
                <input
                    type="text"
                    placeholder="Username"
                    id="username"
                    onChange={handleChange}
                    className="h-10 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="Password"
                    id="password"
                    onChange={handleChange}
                    className="h-10 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    disabled={loading}
                    onClick={handleClick}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md disabled:bg-blue-300 cursor-pointer hover:bg-blue-700 focus:outline-none"
                >
                    Login
                </button>
                {error && <span className="text-red-500 text-sm">{error.message}</span>}
            </div>
        </div>
    );
};

export default Login;