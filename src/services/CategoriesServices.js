import fetch from 'auth/FetchInterceptor';

const CategoryService = {};

// Fetch all categories
CategoryService.getAllCategories = function () {
  return fetch({
    url: '/categories/all',
    method: 'get',
  });
};

// Fetch a specific category by ID
CategoryService.getCategoryById = function (categoryId) {
  return fetch({
    url: `/categories/category/${categoryId}`,
    method: 'get',
  });
};

// Create a new category
CategoryService.createCategory = function (categoryData) {
  return fetch({
    url: '/categories/create',
    method: 'post',
    data: categoryData,
  });
};

// Update an existing category by ID
CategoryService.updateCategory = function (categoryId, categoryData) {
  return fetch({
    url: `/categories/update/${categoryId}`,
    method: 'put',
    data: categoryData,
  });
};

// Delete a category by ID
CategoryService.deleteCategory = function (categoryId) {
  return fetch({
    url: `/categories/delete/${categoryId}`,
    method: 'delete',
  });
};

// Fetch categories by postTypeId
CategoryService.getAllCategoriesByPostType = function (postTypeId) {
  return fetch({
    url: `/categories/all/byposttype/${postTypeId}`,
    method: 'get',
  });
};

export default CategoryService;
