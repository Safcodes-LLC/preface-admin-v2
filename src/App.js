import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import store from "./store";
import history from "./history";
import Layouts from "./layouts";
import { THEME_CONFIG } from "./configs/AppConfig";
import "./lang";
import { fetchUserData } from "store/slices/userSlice";
import "./index.css";

const themes = {
  dark: `${process.env.PUBLIC_URL}/css/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/css/light-theme.css`,
};

function App() {
  useEffect(() => {
    // Get the authentication token from the store
    const auth = store.getState().auth;
    // Get the user data from the store
    const user = store.getState().user;

    // Check if there's a token and user data is not available
    if (auth.token && !user.userData) {
      // Dispatch the fetchUserData action using the store directly
      store.dispatch(fetchUserData(auth.token));
    }
  }, []);
  const user = store.getState().user;

  return (
    <div className="App">
      <Provider store={store}>
        <BrowserRouter history={history}>
          <ThemeSwitcherProvider
            themeMap={themes}
            defaultTheme={THEME_CONFIG.currentTheme}
            insertionPoint="styles-insertion-point"
          >
            <Layouts />
          </ThemeSwitcherProvider>
        </BrowserRouter>
      </Provider>
    </div>
  );
}

export default App;
