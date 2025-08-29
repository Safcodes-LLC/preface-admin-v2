import fetch from "auth/FetchInterceptor";

const PostService = {};

// Fetch all posts
PostService.getAllPosts = function () {
  return fetch({
    url: "/posts/all",
    method: "get",
  });
};

// Fetch all posts
PostService.getMyApprovedPost = function (postTypeId) {
  return fetch({
    url: `/posts/myapprovedpost/${postTypeId}`,
    method: "get",
  });
};

// Fetch all posts with a specific post type
PostService.getAllPostsByPostType = function (postTypeId, page = 1, limit = 10) {
  return fetch({
    url: `/posts/byposttype/${postTypeId}?page=${page}&limit=${limit}`,
    method: "get",
  });
};

// Fetch a specific post by ID
PostService.getPostById = function (postId) {
  return fetch({
    url: `/posts/post/${postId}`,
    method: "get",
  });
};

// Fetch a specific post by ID
PostService.editPost = function (postId) {
  return fetch({
    url: `/posts/editpost/${postId}`,
    method: "get",
  });
};

// update status of post
PostService.updateStatus = function (postId, giveApproval, editorMessage) {
  return fetch({
    url: `/posts/updatestatus/${postId}/${giveApproval}`,
    method: "put",
    data: { editorMessage: editorMessage },
  });
};

// update status of post
PostService.updateStatusByAdmin = function (postId, giveApproval) {
  return fetch({
    url: `/posts/updatestatusbyadmin/${postId}/${giveApproval}`,
    method: "get",
  });
};

// Create a new post
PostService.createPost = function (postData) {
  return fetch({
    url: "/posts/create",
    method: "post",
    data: postData,
  });
};

// Update an existing post by ID
PostService.updatePost = function (postId, postData) {
  return fetch({
    url: `/posts/update/${postId}`,
    method: "put",
    data: postData,
  });
};

// Delete a post by ID
PostService.deletePost = function (postId) {
  return fetch({
    url: `/posts/delete/${postId}`,
    method: "delete",
  });
};


// Delete a post by ID
PostService.featured = function (postId) {
  return fetch({
    url: `/posts/featured/${postId}`,
    method: "get",
  });
};

// Toggle featured status of a post by ID
PostService.toggleFeaturedPost = function (postId) {
  return fetch({
    url: `/posts/${postId}/toggle-featured`,   
    method: "patch",
  });
};

export default PostService;
