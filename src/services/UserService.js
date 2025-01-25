import fetch from 'auth/FetchInterceptor';

const UserService = {};


// Auth service to fetch logged in user data 
UserService.loggedin_user_data = function (token) {
	return fetch({
		url: '/authentication/loggedin_user',
		method: 'get',
	})
}

// Fetch all users
UserService.getAllUsers = function () {
  return fetch({
    url: '/user/all',
    method: 'get',
  });
};

// Fetch users by role
UserService.getUsersByRole = function (roleId) {
  return fetch({
    url: `/user/role/${roleId}`,
    method: 'get',
  });
};

// Create a new user
UserService.createUser = function (userData) {
  return fetch({
    url: '/user/create',
    method: 'post',
    data: userData,
  });
};

// Update an existing user
UserService.updateUser = function (userId, userData) {
  return fetch({
    url: `/user/update/${userId}`,
    method: 'put',
    data: userData,
  });
};

// Delete a user by ID
UserService.deleteUser = function (userId) {
  return fetch({
    url: `/user/delete/${userId}`,
    method: 'delete',
  });
};

export default UserService;
