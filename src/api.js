import axios from "axios";

const api = axios.create({
  baseURL: "http://43.201.64.218:8080/", // 포트 번호 8080으로 설정
  withCredentials: true, // 세션 쿠키를 전송
});

// 요청 인터셉터를 설정하여 동적으로 Authorization 헤더를 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
