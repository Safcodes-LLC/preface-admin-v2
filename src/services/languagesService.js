import fetch from 'auth/FetchInterceptor';

const languagesService = {};

// Service to fetch all languages
languagesService.getAllLanguages = function () {
  return fetch({
    url: '/languages/all',
    method: 'get',
  });
};


export default languagesService;
