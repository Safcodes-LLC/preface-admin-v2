import React, { useEffect, useState } from "react";
import { Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { AUTHENTICATED_ENTRY } from "configs/AppConfig";
import {
  protectedRoutes,
  publicRoutes,
  unrestrictedRoutes,
} from "configs/RoutesConfig";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import AppRoute from "./AppRoute";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserData } from "store/slices/userSlice";

const Routes = () => {
  const dispatch = useDispatch();
  const [userRoles, setUserRoles] = useState([]);
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);
  useEffect(() => {
    // Check if userData is not null in auth
    if (auth.userRoles.length > 0) {
      setUserRoles(auth.userRoles);
    } else {
      // Check if userData is null and there's a valid token
      if (!user.userRoles && auth.token) {
        // Dispatch the action to fetch user data
        dispatch(fetchUserData(auth.token));
      } else {
        setUserRoles(user.userRoles);
      }
    }
  }, [dispatch, user.userRoles, auth.token, auth.userRoles, userRoles]);

  function check_authority(authority = [], roles = []) {
    return roles.length === 0 || roles.some((role) => authority.includes(role));
  }

  return (
    <RouterRoutes>
      {/* Unrestricted routes that bypass auth checks */}
      {unrestrictedRoutes.map((route) => (
        <Route
          key={route.key}
          path={route.path}
          element={<AppRoute component={route.component} />}
        />
      ))}
      <Route path="/" element={<ProtectedRoute />}>
        <Route
          path="/"
          element={<Navigate replace to={AUTHENTICATED_ENTRY} />}
        />
        {/* {protectedRoutes.map((route, index) => {
					return (
						<Route 
							key={route.key + index} 
							path={route.path}
							element={
								<AppRoute
									routeKey={route.key} 
									component={route.component}
									{...route.meta} 
								/>
							}
						/>
					)
				})} */}
        {protectedRoutes
          .filter((route) => check_authority(route.authority, userRoles))
          .map((route, index) => (
            <Route
              key={route.key + index}
              path={route.path}
              element={
                <AppRoute
                  routeKey={route.key}
                  component={route.component}
                  {...route.meta}
                />
              }
            />
          ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      <Route path="/" element={<PublicRoute />}>
        {publicRoutes.map((route) => {
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <AppRoute
                  routeKey={route.key}
                  component={route.component}
                  {...route.meta}
                />
              }
            />
          );
        })}
      </Route>
    </RouterRoutes>
  );
};

export default Routes;
