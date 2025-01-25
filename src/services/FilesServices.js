import fetch from 'auth/FetchInterceptor';

const FilesServices = {};

// Service to fetch all languages
FilesServices.deleteExtraFiles = function (post_data) {
  return fetch({
    url: '/fileupload/deleteextrafiles',
    method: 'post',
    data: post_data,
  });
};


export default FilesServices;
