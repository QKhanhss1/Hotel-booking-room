import axios from "axios";

const BASE_API = "http://localhost:8800/api"; 

export const facebookAuth = async (accessToken) => {
  try {
    const response = await axios.post(`${BASE_API}/auth/facebook-auth`, { accessToken });
    return response.data;
  } catch (error) {
    console.error("Facebook Auth Error:", error);
    throw error;
  }
};
