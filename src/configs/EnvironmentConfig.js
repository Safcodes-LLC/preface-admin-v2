const dev = {
  API_ENDPOINT_URL: "http://localhost:8080/api",
  // API_ENDPOINT_URL: "https://king-prawn-app-x9z27.ondigitalocean.app/api",
};

const prod = {
  API_ENDPOINT_URL: "https://king-prawn-app-x9z27.ondigitalocean.app/api",
};

const test = {
  API_ENDPOINT_URL: "/api",
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
