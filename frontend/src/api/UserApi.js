import API from "./axios";

const UserApi = {
  getUsers: () => API.get("/users"),
  getUserById: (id) => API.get(`/users/${id}`),
  createUser: (data) => API.post("/users", data),
  changePassword: (data) => API.put("/users/change-password", data),
  updateProfile: (data) => API.put("/users/update-user", data),
  deleteUser: (id) => API.delete(`/users/${id}`),
};

export default UserApi;
