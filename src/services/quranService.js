import axios from "axios";
import { AUTH_TOKEN } from "constants/AuthConstant";

// Create a separate axios instance for Quran API
const quranApi = axios.create({
  baseURL: "http://localhost:3077",
  timeout: 60000,
});

// Add request interceptor to include auth token if needed
quranApi.interceptors.request.use(
  (config) => {
    const jwtToken = localStorage.getItem(AUTH_TOKEN) || null;
    if (jwtToken) {
      config.headers.authorization = jwtToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const QuranService = {};

// Fetch all Surahs
QuranService.getAllSurahs = function () {
  return quranApi.get("/quran/surah");
};

// Fetch a specific Surah by ID
QuranService.getSurahById = function (surahId) {
  return quranApi.get(`/quran/surah/${surahId}`);
};

// Fetch a specific Ayah by ID
QuranService.getAyahById = function (surahId, ayahId) {
  return quranApi.get(`/quran/surah/${surahId}/ayah/${ayahId}`);
};

export default QuranService;
