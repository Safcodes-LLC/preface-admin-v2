import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import PostTypesService from 'services/PostTypesServices';

const initialState = {
  postTypes: [],
  selectedPostType: null,
  loading: false,
  error: null,
};

// Create an async thunk to fetch all post types
export const fetchAllPostTypes = createAsyncThunk('postTypes/fetchAllPostTypes', async (_, { rejectWithValue }) => {
  try {
    const response = await PostTypesService.getAllPostTypes();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Create an async thunk to create a post type
export const createPostType = createAsyncThunk('postTypes/createPostType', async (postTypeData, { rejectWithValue }) => {
  try {
    const response = await PostTypesService.createPostType(postTypeData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Create an async thunk to update a post type
export const updatePostType = createAsyncThunk('postTypes/updatePostType', async ({ postTypeId, postTypeData }, { rejectWithValue }) => {
  try {
    const response = await PostTypesService.updatePostType(postTypeId, postTypeData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Create an async thunk to delete a post type
export const deletePostType = createAsyncThunk('postTypes/deletePostType', async (postTypeId, { rejectWithValue }) => {
  try {
    await PostTypesService.deletePostType(postTypeId);
    return postTypeId;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const postTypesSlice = createSlice({
  name: 'postTypes',
  initialState,
  reducers: {
    setPostTypes: (state, action) => {
      state.postTypes = action.payload;
    },
    setSelectedPostType: (state, action) => {
      state.selectedPostType = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPostTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPostTypes.fulfilled, (state, action) => {
        state.postTypes = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllPostTypes.rejected, (state, action) => {
        state.postTypes = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPostType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPostType.fulfilled, (state, action) => {
        state.postTypes.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createPostType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePostType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePostType.fulfilled, (state, action) => {
        const index = state.postTypes.findIndex((postType) => postType._id === action.payload._id);
        if (index !== -1) {
          state.postTypes[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePostType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePostType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePostType.fulfilled, (state, action) => {
        state.postTypes = state.postTypes.filter((postType) => postType._id !== action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(deletePostType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPostTypes, setSelectedPostType, setLoading, setError } = postTypesSlice.actions;

export default postTypesSlice.reducer;
