import fetch from 'auth/FetchInterceptor';

const PostTypesService = {};

// Fetch all posttypes
PostTypesService.getAllPostTypes = function () {
  return fetch({
    url: '/posttypes/all',
    method: 'get',
  });
};

// Fetch posttype by ID
PostTypesService.getPostTypeById = function (postTypeId) {
  return fetch({
    url: `/posttypes/posttype/${postTypeId}`,
    method: 'get',
  });
};

// Create a new posttype
PostTypesService.createPostType = function (PostTypeData) {
  return fetch({
    url: '/posttype/create',
    method: 'post',
    data: PostTypeData,
  });
};

// Update an existing posttype
PostTypesService.updatePostType = function (postTypeId, PostTypeData) {
  return fetch({
    url: `/posttype/update/${postTypeId}`,
    method: 'put',
    data: PostTypeData,
  });
};

// Delete a posttype by ID
PostTypesService.deletePostType = function (postTypeId) {
  return fetch({
    url: `/posttype/delete/${postTypeId}`,
    method: 'delete',
  });
};

export default PostTypesService;
