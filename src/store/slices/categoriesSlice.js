import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import CategoriesService from "services/CategoriesServices";
import { notification } from "antd";

const initialState = {
  categories: [],
  categoriesByPostType: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

// Create an async thunk to fetch all categories
export const fetchAllCategories = createAsyncThunk(
  "categories/fetchAllCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await CategoriesService.getAllCategories();
      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch all categories
export const fetchAllCategoriesByPostType = createAsyncThunk(
  "categories/fetchAllCategoriesByPostType",
  async ({ postTypeId }, { rejectWithValue }) => {
    try {
      const response = await CategoriesService.getAllCategoriesByPostType(
        postTypeId
      );
      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to fetch a category by ID
export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async ({ categoryId }, { rejectWithValue }) => {
    try {
      const response = await CategoriesService.getCategoryById(categoryId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to create a category
export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async ({ categoryData }, { rejectWithValue }) => {
    try {
      const response = await CategoriesService.createCategory(categoryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to update a category by ID
export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const response = await CategoriesService.updateCategory(
        categoryId,
        categoryData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Create an async thunk to delete a category by ID
export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async ({ categoryId }, { rejectWithValue }) => {
    try {
      await CategoriesService.deleteCategory(categoryId);
      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
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
      .addCase(fetchAllCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.categories = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllCategoriesByPostType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCategoriesByPostType.fulfilled, (state, action) => {
        state.categoriesByPostType = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllCategoriesByPostType.rejected, (state, action) => {
        state.categoriesByPostType = [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.selectedCategory = null;
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.loading = false;
        state.error = null;
        notification.success({
          message: "Category Created",
          description: "The Category has been successfully created.",
        });
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.categoriesByPostType.findIndex(
          (category) => category._id === action.payload._id
        );
        if (index !== -1) {
          state.categoriesByPostType[index] = action.payload;
        }
        const categoriesIndex = state.categories.findIndex(
          (category) => category._id === action.payload._id
        );
        if (categoriesIndex !== -1) {
          state.categories[categoriesIndex] = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.categoriesByPostType = state.categoriesByPostType.filter(
          (category) => category._id !== action.payload
        );
        state.categories = state.categories.filter(
          (category) => category._id !== action.payload
        );
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCategories, setSelectedCategory, setLoading, setError } =
  categoriesSlice.actions;

export default categoriesSlice.reducer;
