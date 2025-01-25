import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Grid } from 'antd';
import IntlMessage from '../util-components/IntlMessage';
import Icon from '../util-components/Icon';
import navigationConfig from 'configs/NavigationConfig';
import { useSelector, useDispatch } from 'react-redux';
import { SIDE_NAV_LIGHT, NAV_TYPE_SIDE } from "constants/ThemeConstant";
import utils from 'utils';
import { onMobileNavToggle } from 'store/slices/themeSlice';
import { fetchUserData } from 'store/slices/userSlice';

const { useBreakpoint } = Grid;

const setLocale = (localeKey, isLocaleOn = true) =>
  isLocaleOn ? <IntlMessage id={localeKey} /> : localeKey.toString();

const setDefaultOpen = (key) => {
  let keyList = [];
  let keyString = "";
  if (key) {
    const arr = key.split("-");
    for (let index = 0; index < arr.length; index++) {
      const elm = arr[index];
      index === 0 ? (keyString = elm) : (keyString = `${keyString}-${elm}`);
      keyList.push(keyString);
    }
  }
  return keyList;
};

const MenuItem = ({ title, icon, path }) => {
  const dispatch = useDispatch();
  const isMobile = !utils.getBreakPoint(useBreakpoint()).includes('lg');
  const closeMobileNav = () => {
    if (isMobile) {
      dispatch(onMobileNavToggle(false))
    }
  };
  return (
    <>
      {icon && <Icon type={icon} />}
      <span>{setLocale(title)}</span>
      {path && <Link onClick={closeMobileNav} to={path} />}
    </>
  );
};

const filterMenuItems = (navItem, userRoles) => {
  return navItem
    .filter(nav => {
      if (nav.authority && nav.authority.length > 0) {
        // Check if at least one role in authorities array is in userRoles
        return nav.authority.some(role => userRoles.includes(role));
      }
      // If no authorities are defined, show the menu item
      return true;
    })
    .map(nav => {
      return {
        key: nav.key,
        label: <MenuItem title={nav.title} {...(nav.isGroupTitle ? {} : { path: nav.path, icon: nav.icon })} />,
        ...(nav.isGroupTitle ? { type: 'group' } : {}),
        ...(nav.submenu.length > 0 ? { children: filterMenuItems(nav.submenu, userRoles) } : {})
      };
    });
};

const SideNavContent = (props) => {
	const dispatch = useDispatch();
  const { routeInfo, hideGroupTitle, sideNavTheme = SIDE_NAV_LIGHT } = props;
//   const userRoles = useSelector(state => state.auth.userRoles);
  const [userRoles, setUserRoles] = useState([]);
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);
  useEffect(() => {
	  // Check if userData is not null in auth
	  if (auth.userRoles.length > 0) {
		  setUserRoles(auth.userRoles);
	  }else{
		  // Check if userData is null and there's a valid token
		  if (!user.userRoles && auth.token) {
			  // Dispatch the action to fetch user data
			  dispatch(fetchUserData(auth.token));
		  }else{
			  setUserRoles(user.userRoles);
		  }
	  }
  }, [dispatch, user.userRoles, auth.token ,auth.userRoles ,userRoles]);

//   console.log("userRoles" , userRoles);
  const menuItems = useMemo(() => filterMenuItems(navigationConfig, userRoles), [userRoles]);
  return (
    <Menu
      mode="inline"
      theme={sideNavTheme === SIDE_NAV_LIGHT ? "light" : "dark"}
      style={{ height: "100%", borderInlineEnd: 0 }}
      defaultSelectedKeys={[routeInfo?.key]}
      defaultOpenKeys={setDefaultOpen(routeInfo?.key)}
      className={hideGroupTitle ? "hide-group-title" : ""}
      items={menuItems}
    />
  );
};

const TopNavContent = () => {
  const topNavColor = useSelector(state => state.theme.topNavColor);
  const userRoles = useSelector(state => state.auth.userRoles);
  const menuItems = useMemo(() => filterMenuItems(navigationConfig, userRoles), [userRoles]);
  return (
    <Menu
      mode="horizontal"
      style={{ backgroundColor: topNavColor }}
      items={menuItems}
    />
  );
};

const MenuContent = (props) => {
  return props.type === NAV_TYPE_SIDE ? (
    <SideNavContent {...props} />
  ) : (
    <TopNavContent {...props} />
  );
};

export default MenuContent;
