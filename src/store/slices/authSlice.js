import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AUTH_TOKEN } from "constants/AuthConstant";
import FirebaseService from "services/FirebaseService";
import AuthService from "services/AuthService";

export const initialState = {
  loading: false,
  message: "",
  showMessage: false,
  redirect: "",
  token: localStorage.getItem(AUTH_TOKEN) || null,
  showForgetPassword: true,
  userData: null,
  user: null,
  userRoles: [],
};

export const signIn = createAsyncThunk(
  "auth/signIn",
  async (data, { rejectWithValue }) => {
    // const { email, password } = data
    // try {
    // 	const response = await FirebaseService.signInEmailRequest(email, password)
    // 	if (response.user) {
    // 		const token = response.user.refreshToken;
    // 		localStorage.setItem(AUTH_TOKEN, response.user.refreshToken);
    // 		return token;
    // 	} else {
    // 		return rejectWithValue(response.message?.replace('Firebase: ', ''));
    // 	}
    // } catch (err) {
    // 	return rejectWithValue(err.message || 'Error')
    // }

    const { emailOrUsername, password } = data;

    // As per our API
    try {
      const response = await AuthService.login({ emailOrUsername, password });
      if (response.token) {
        const token = response.token;
        const userData = response.userData;
        localStorage.setItem(AUTH_TOKEN, token);
        return { token, userData };
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Invalid credentials");
        return rejectWithValue("Invalid credentials");
      } else {
        console.error("Login error:", error.message);
        return rejectWithValue("Login error:", error.message);
      }
    }
  }
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (data, { rejectWithValue }) => {
    const { email, password } = data;
    try {
      const response = await FirebaseService.signUpEmailRequest(
        email,
        password
      );
      if (response.user) {
        const token = response.user.refreshToken;
        localStorage.setItem(AUTH_TOKEN, response.user.refreshToken);
        return token;
      } else {
        return rejectWithValue(response.message?.replace("Firebase: ", ""));
      }
    } catch (err) {
      return rejectWithValue(err.message || "Error");
    }
  }
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  // const response = await FirebaseService.signOutRequest()
  // localStorage.removeItem(AUTH_TOKEN);
  // return response.data

  // As per our API
  localStorage.removeItem(AUTH_TOKEN);
});

export const signInWithGoogle = createAsyncThunk(
  "auth/signInWithGoogle",
  async (_, { rejectWithValue }) => {
    const response = await FirebaseService.signInGoogleRequest();
    if (response.user) {
      const token = response.user.refreshToken;
      localStorage.setItem(AUTH_TOKEN, response.user.refreshToken);
      return token;
    } else {
      return rejectWithValue(response.message?.replace("Firebase: ", ""));
    }
  }
);

export const signInWithFacebook = createAsyncThunk(
  "auth/signInWithFacebook",
  async (_, { rejectWithValue }) => {
    const response = await FirebaseService.signInFacebookRequest();
    if (response.user) {
      const token = response.user.refreshToken;
      localStorage.setItem(AUTH_TOKEN, response.user.refreshToken);
      return token;
    } else {
      return rejectWithValue(response.message?.replace("Firebase: ", ""));
    }
  }
);

// ChangePassword Async Thunk
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ oldPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await AuthService.changePassword({
        oldPassword,
        newPassword,
      });
      if (response.status === "success") {
        return response; // Assuming the response contains the updated user data
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || "Error changing password");
    }
  }
);

export const requestPasswordReset = createAsyncThunk(
  "auth/requestPasswordReset",
  async (email, { rejectWithValue }) => {
    try {
      const response = await AuthService.requestPasswordReset(email); // Implement this function in AuthService
      if (response.success) {
        return response.data; // Assuming the response contains the reset token
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(
        error.message || "Error requesting password reset"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      // Assuming you have a method in your AuthService to reset the password
      const response = await AuthService.resetPassword({
        token,
        newPassword,
      });
      if (response.success) {
        // On successful password reset, update the local storage with the new token
        localStorage.setItem(AUTH_TOKEN, response.token);
        return response; // Return the response or any relevant data
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      return rejectWithValue(error.message || "Error resetting password");
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticated: (state, action) => {
      state.loading = false;
      state.redirect = "/";
      state.token = action.payload;
    },
    showAuthMessage: (state, action) => {
      state.message = action.payload;
      state.showMessage = true;
      state.loading = false;
    },
    hideAuthMessage: (state) => {
      state.message = "";
      state.showMessage = false;
    },
    signOutSuccess: (state) => {
      state.loading = false;
      state.token = null;
      state.redirect = "/";
    },
    showLoading: (state) => {
      state.loading = true;
    },
    signInSuccess: (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.userData = action.payload.userData;
      state.user = action.payload.userData;
      state.userRoles = action.payload.userData.roles.map((role) => role.title);
      console.log("state.user", state.user);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = "/";
        // state.token = action.payload

        state.token = action.payload.token;
        state.userData = action.payload.userData;
        state.user = action.payload.userData;
        state.userRoles = action.payload.userData.roles.map(
          (role) => role.title
        );
      })
      .addCase(signIn.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
        state.userRoles = [];
      })
      .addCase(signOut.fulfilled, (state) => {
        state.loading = false;
        state.token = null;
        state.redirect = "/";
      })
      .addCase(signOut.rejected, (state) => {
        state.loading = false;
        state.token = null;
        state.redirect = "/";
      })
      .addCase(signUp.pending, (state) => {
        state.loading = true;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = "/";
        state.token = action.payload;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = "/";
        state.token = action.payload;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })
      .addCase(signInWithFacebook.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInWithFacebook.fulfilled, (state, action) => {
        state.loading = false;
        state.redirect = "/";
        state.token = action.payload;
      })
      .addCase(signInWithFacebook.rejected, (state, action) => {
        state.message = action.payload;
        state.showMessage = true;
        state.loading = false;
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.redirect = "/";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload;
        state.showMessage = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.message = "Password successfully reset!";
        state.showForgetPassword = false;
      });
  },
});

export const {
  authenticated,
  showAuthMessage,
  hideAuthMessage,
  signOutSuccess,
  showLoading,
  signInSuccess,
} = authSlice.actions;

export default authSlice.reducer;
