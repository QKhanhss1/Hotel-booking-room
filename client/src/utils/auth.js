import axios from "axios";
import environment from '../environments/environment';
const BASE_API = environment.BASE_API || "https://localhost:8800/api";

export const facebookAuth = async (accessToken) => {
  try {
    const response = await axios.post(`${BASE_API}/auth/facebook-auth`, { accessToken });
    return response.data;
  } catch (error) {
    console.error("Facebook Auth Error:", error);
    throw error;
  }
};

export const googleLogin = async (token) => {
  try {
    const response = await axios.post(`${BASE_API}/auth/google-login`, { token }, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw error;
  }
};