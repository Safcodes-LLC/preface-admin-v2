import fetch from "auth/FetchInterceptor";

const AuthService = {};

AuthService.login = function (data) {
  return fetch({
    url: "/authentication/login",
    method: "post",
    data: data,
  });
};

AuthService.register = function (data) {
  return fetch({
    url: "/authentication/register",
    method: "post",
    data: data,
  });
};

AuthService.changePassword = function (data) {
  return fetch({
    url: "/authentication/change-password", // Adjust the URL to match your backend endpoint
    method: "post",
    data: data,
  });
};

AuthService.requestPasswordReset = function (data) {
  return fetch({
    url: "/authentication/request-password-reset", // Adjust the URL to match your backend endpoint
    method: "post",
    data: data,
  });
};

AuthService.resetPassword = function (data) {
  return fetch({
    url: "/authentication/reset-password", // Adjust the URL to match your backend endpoint
    method: "post",
    data: data,
  });
};

export default AuthService;
