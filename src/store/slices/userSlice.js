// userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import UserService from "services/UserService";
import { AUTH_TOKEN } from "constants/AuthConstant";
import { notification } from "antd";
const initialState = {
  userData: null,
  loading: false,
  error: null,
  userList: [],
  userRoles: [],
};

// Create an async thunk to fetch user data
export const fetchUserData = createAsyncThunk(
  "user/fetchUserData",
  async ({ rejectWithValue }) => {
    const token = localStorage.getItem(AUTH_TOKEN);
    const response = await UserService.loggedin_user_data(token);
    if (response) {
      return response.data;
    } else {
      return rejectWithValue(response.message);
    }
  }
);

// Create an async thunk to fetch all users

export const fetchAllUsers = createAsyncThunk(
  "user/fetchAllUsers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await UserService.getAllUsers();

      if (response) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      // Handle errors here, including error messages
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch users by role (author)
export const fetchUsersByRole = createAsyncThunk(
  "user/fetchUsersByRole",
  async ({ roleId }, { rejectWithValue }) => {
    const response = await UserService.getUsersByRole(roleId);
    if (response) {
      return response.data;
    } else {
      return rejectWithValue(response.message);
    }
  }
);

// Create an async thunk to create a user
export const createUser = createAsyncThunk(
  "user/createUser",
  async ({ userData }, { rejectWithValue }) => {
    try {
      const response = await UserService.createUser(userData);
      if (response) {
        return response.data;
      } else {
        return rejectWithValue(response.message);
      }
    } catch (error) {
      // Check if the error status code is 409 (Conflict)
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        let error_message = error.response.data.message;
        return rejectWithValue(error_message);
      } else {
        return rejectWithValue("An error occurred while creating the user.");
      }
    }
  }
);

// Create an async thunk to update a user
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async ({ userId, userData }, { rejectWithValue }) => {
    const response = await UserService.updateUser(userId, userData);
    if (response) {
      return response.data;
    } else {
      return rejectWithValue(response.message);
    }
  }
);

// Create an async thunk to delete a user
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async ({ userId }, { rejectWithValue }) => {
    const response = await UserService.deleteUser(userId);
    if (response) {
      return response._id;
    } else {
      return rejectWithValue(response.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.userData = action.payload;
    },
    clearUser: (state) => {
      state.userData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.loading = false;
        state.error = null;
        state.userRoles = action.payload.roles.map((role) => role.title);
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.userData = null;
        state.loading = false;
        state.error = action.payload;
        state.userRoles = [];
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.userList = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.userList = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.userList = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.userList = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        // Display a success notification
        notification.success({
          message: "Author Created",
          description: "The Author has been successfully created.",
        });
        // Add the new user to the user list
        state.userList.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the user in the user list
        const updatedUserIndex = state.userList.findIndex(
          (user) => user._id === action.payload._id
        );
        if (updatedUserIndex !== -1) {
          state.userList[updatedUserIndex] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Remove the deleted user from the user list
        state.userList = state.userList.filter(
          (user) => user._id !== action.payload
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
