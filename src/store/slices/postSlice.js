import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import PostService from "services/postService";

const initialState = {
  posts: [],
  selectedPost: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
};

// Create an async thunk to fetch all posts
export const fetchAllPosts = createAsyncThunk(
  "posts/fetchAllPosts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await PostService.getAllPosts();

      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Create an async thunk to fetch all toggle featured posts
export const fetchAllTogglePosts = createAsyncThunk(
  "posts/featured",
  async (_, { rejectWithValue }) => {
    try {
      const response = await PostService.featured();

      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//upate a toggle featured post
export const toggleFeaturedPost = createAsyncThunk(
  "posts/toggleFeaturedPost",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const response = await PostService.toggleFeaturedPost(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch all posts
export const fetchMyApprovedPost = createAsyncThunk(
  "posts/fetchMyApprovedPost",
  async ({ postTypeId }, { rejectWithValue }) => {
    try {
      const response = await PostService.getMyApprovedPost(postTypeId);
      console.log(response.data, "rpd");
      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch all posts with a specific post type
export const fetchAllPostsByPostType = createAsyncThunk(
  "posts/fetchAllPostsByPostType",
  async ({ postTypeId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await PostService.getAllPostsByPostType(postTypeId, page, limit);
      return response; // keep whole response (with pagination info)
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch a post by ID
export const fetchPostById = createAsyncThunk(
  "posts/fetchPostById",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const response = await PostService.getPostById(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to update a post status
export const updateStatus = createAsyncThunk(
  "posts/updateStatus",
  async ({ postId, giveApproval, editorMessage }, { rejectWithValue }) => {
    console.log(editorMessage, "ps em");

    try {
      const response = await PostService.updateStatus(
        postId,
        giveApproval,
        editorMessage
      );
      response.giveApproval = giveApproval;
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to update a post status
export const updateStatusByAdmin = createAsyncThunk(
  "posts/updateStatusByAdmin",
  async ({ postId, giveApproval }, { rejectWithValue }) => {
    try {
      const response = await PostService.updateStatusByAdmin(
        postId,
        giveApproval
      );
      response.giveApproval = giveApproval;
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to update a post status
export const editPost = createAsyncThunk(
  "posts/editPost",
  async ({ postId }, { rejectWithValue }) => {
    try {
      const response = await PostService.editPost(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to create a post
export const createPost = createAsyncThunk(
  "posts/createPost",
  async ({ postData }, { rejectWithValue }) => {
    try {
      const response = await PostService.createPost(postData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to update a post
export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ postId, postData }, { rejectWithValue }) => {
    try {
      const response = await PostService.updatePost(postId, postData);
      return response.data;
    } catch (error) {
      console.log(error, "errr");

      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to delete a post
export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async ({ postId }, { rejectWithValue }) => {
    try {
      await PostService.deletePost(postId);
      return postId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    setSelectedPost: (state, action) => {
      state.selectedPost = action.payload;
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
      .addCase(fetchAllPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.posts = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyApprovedPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApprovedPost.fulfilled, (state, action) => {
        state.posts = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchMyApprovedPost.rejected, (state, action) => {
        state.posts = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllPostsByPostType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPostsByPostType.fulfilled, (state, action) => {
        state.posts = action.payload.data; // backend returns {data: []}
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllPostsByPostType.rejected, (state, action) => {
        state.posts = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPostById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.selectedPost = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.selectedPost = null;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.push(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (post) => post._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (post) => post._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStatusByAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatusByAdmin.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (post) => post._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateStatusByAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Featured Post START
      .addCase(toggleFeaturedPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFeaturedPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (post) => post._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index].isFeatured = action.payload.isFeatured;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(toggleFeaturedPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       // Toggle Featured Post END

      .addCase(editPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editPost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(
          (post) => post._id === action.payload._id
        );
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(editPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post._id !== action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

      
  },
});

export const { setPosts, setSelectedPost, setLoading, setError } =
  postsSlice.actions;

export default postsSlice.reducer;
