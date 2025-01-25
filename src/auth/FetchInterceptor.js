import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";
import { signOutSuccess } from "store/slices/authSlice";
import store from "../store";
import { AUTH_TOKEN } from "constants/AuthConstant";
import { notification } from "antd";

const unauthorizedCode = [401, 403];

const service = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// Config
const TOKEN_PAYLOAD_KEY = "authorization";

// API Request interceptor
service.interceptors.request.use(
  (config) => {
    const jwtToken = localStorage.getItem(AUTH_TOKEN) || null;

    if (jwtToken) {
      config.headers[TOKEN_PAYLOAD_KEY] = jwtToken;
    }

    return config;
  },
  (error) => {
    // Do something with request error here
    notification.error({
      message: "Error",
    });
    Promise.reject(error);
  }
);

// API respone interceptor
service.interceptors.response.use(
  (response) => {
    if (response.data.message === "Password Changed Successfully") {
      notification.success({
        message: response.data.message,
      });
    }

    return response.data;
  },
  (error) => {
    let notificationParam = {
      message: "",
    };

    // Remove token and redirect
    if (unauthorizedCode.includes(error.response.status)) {
      notificationParam.message = "Authentication Fail";
      notificationParam.description = "Please login again";
      localStorage.removeItem(AUTH_TOKEN);
      store.dispatch(signOutSuccess());
    } else if (error.response.status === 404) {
      notificationParam.message = "Not Found";
    } else if (error.response.status === 500) {
      notificationParam.message = "Internal Server Error";
    } else if (error.response.status === 508) {
      notificationParam.message = "Time Out";
    } else {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        let error_message = error.response.data.message;
        notificationParam.message = error_message;
      } else {
        notificationParam.message =
          "An error occurred while doing a process please try again.";
      }
    }

    notification.error(notificationParam);

    return Promise.reject(error);
  }
);

export default service;
