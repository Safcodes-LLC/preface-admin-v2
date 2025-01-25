import { combineReducers } from 'redux'
import theme from './slices/themeSlice'
import auth from './slices/authSlice'
import user from './slices/userSlice'
import roles from './slices/rolesSlice'
import languages from './slices/languagesSlice'
import postTypes from './slices/postTypesSlice'
import categories from './slices/categoriesSlice'
import post from './slices/postSlice'

const rootReducer = (asyncReducers) => (state, action) => {
    const combinedReducer = combineReducers({
        theme,
        auth,
        user,
        roles,
        languages,
        postTypes,
        categories,
        post,
        ...asyncReducers,
    })
    return combinedReducer(state, action)
}
  
export default rootReducer
