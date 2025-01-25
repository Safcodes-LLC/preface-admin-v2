import fetch from 'auth/FetchInterceptor';

const rolesService = {};

// Service to fetch all roles
rolesService.getAllRoles = function () {
  return fetch({
    url: '/roles/all',
    method: 'get',
  });
};

// Service to fetch a role by ID
rolesService.getRoleById = function (roleId) {
  return fetch({
    url: `/roles/role/${roleId}`,
    method: 'get',
  });
};

// Service to create a new role
rolesService.createRole = function (roleData) {
  return fetch({
    url: '/roles/create',
    method: 'post',
    data: roleData,
  });
};

// Service to update a role by ID
rolesService.updateRole = function (roleId, roleData) {
  return fetch({
    url: `/roles/update/${roleId}`,
    method: 'put',
    data: roleData,
  });
};

// Service to delete a role by ID
rolesService.deleteRole = function (roleId) {
  return fetch({
    url: `/roles/delete/${roleId}`,
    method: 'delete',
  });
};

export default rolesService;
