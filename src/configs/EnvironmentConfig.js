const dev = {
  // API_ENDPOINT_URL: "http://localhost:8080/api",
  API_ENDPOINT_URL: "https://king-prawn-app-x9z27.ondigitalocean.app/api",
  QURAN_API_URL: "http://localhost:3077",
};

const prod = {
  API_ENDPOINT_URL: "https://king-prawn-app-x9z27.ondigitalocean.app/api",
  QURAN_API_URL: "http://localhost:3077",
};

const test = {
  API_ENDPOINT_URL: "/api",
  QURAN_API_URL: "http://localhost:3077",
};

const getEnv = () => {
  switch (process.env.NODE_ENV) {
    case "development":
      return dev;
    case "production":
      return prod;
    case "test":
      return test;
    default:
      break;
  }
};

export const env = getEnv();
