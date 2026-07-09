export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

export const setToken = (token: string) => {
  localStorage.setItem("accessToken", token);
};

export const removeToken = () => {
  localStorage.removeItem("accessToken");
};

export const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem("refreshToken", token);
};

export const removeRefreshToken = () => {
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => {
  return !!getToken();
};
