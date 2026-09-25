import axios from 'axios';

// Backend (C#) API'mizin çalıştığı Render.com Bulut Sunucusu Adresi
const API_URL = 'https://localhost:7006/api';

const api = axios.create({
    baseURL: API_URL
});

// Gönderilen her kargonun (isteğin) içine Yaka Kartımızı (Token) otomatik ekleyen kurye
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
