// rolesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import RolesService from 'services/rolesService';
import { notification } from 'antd';

const initialState = {
  roles: [],
  loading: false,
  error: null,
};

// Create an async thunk to fetch all roles
export const fetchAllRoles = createAsyncThunk('roles/fetchAllRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await RolesService.getAllRoles();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || 'Failed to fetch roles');
  }
});

// Create an async thunk to create a new role
export const createNewRole = createAsyncThunk('roles/createNewRole', async ({roleData}, { rejectWithValue }) => {
  try {
    const response = await RolesService.createRole(roleData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || 'Failed to create role');
  }
});

// Create an async thunk to update a role
export const updateRole = createAsyncThunk('roles/updateRole', async ({ roleId, roleData }, { rejectWithValue }) => {
  try {
    const response = await RolesService.updateRole(roleId, roleData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || 'Failed to update role');
  }
});

// Create an async thunk to delete a role
export const deleteRole = createAsyncThunk('roles/deleteRole', async ({roleId}, { rejectWithValue }) => {
  try {
    const response = await RolesService.deleteRole(roleId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data.message || 'Failed to delete role');
  }
});

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRoles.fulfilled, (state, action) => {
        state.roles = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createNewRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewRole.fulfilled, (state, action) => {
        // Display a success notification
        notification.success({
          message: 'Role Created',
          description: 'The role has been successfully created.',
        });
        // Add the new role to the roles list
        state.roles.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createNewRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the role in the roles list
        const updatedRoleIndex = state.roles.findIndex(role => role.id === action.payload.id);
        if (updatedRoleIndex !== -1) {
          state.roles[updatedRoleIndex] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Remove the deleted role from the roles list
        state.roles = state.roles.filter(role => role.id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default rolesSlice.reducer;
