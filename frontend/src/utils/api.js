// frontend/src/utils/api.js
import axios from 'axios';

// Create a custom Axios instance pointing to our Express backend
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// The Interceptor: Runs before every request
API.interceptors.request.use((req) => {
  // Grab the token from local storage
  const userInfo = localStorage.getItem('userInfo');
  
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    // Attach it to the Authorization header just like we did in Thunder Client
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;