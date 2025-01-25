import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import languagesService from "../../services/languagesService";

const initialState = {
  languages: [],
  loading: false,
  error: null,
};

export const fetchAllLanguages = createAsyncThunk(
  "languages/fetchAllLanguages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await languagesService.getAllLanguages();
      return response.data.reverse();
    } catch (error) {
      return rejectWithValue(
        error.response.data.message || "Failed to fetch languages"
      );
    }
  }
);

const languagesSlice = createSlice({
  name: "languages",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllLanguages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLanguages.fulfilled, (state, action) => {
        state.languages = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllLanguages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {} = languagesSlice.actions;

export default languagesSlice.reducer;
