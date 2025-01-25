import React, { useEffect, useState } from "react";
import { Dropdown, Avatar } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  EditOutlined,
  SettingOutlined,
  ShopOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import NavItem from "./NavItem";
import Flex from "components/shared-components/Flex";
import { signOut } from "store/slices/authSlice";
import styled from "@emotion/styled";
import {
  FONT_WEIGHT,
  MEDIA_QUERIES,
  SPACER,
  FONT_SIZES,
} from "constants/ThemeConstant";
import { setUser, fetchUserData, clearUser } from "store/slices/userSlice";
import { APP_PREFIX_PATH } from "configs/AppConfig";
const Icon = styled.div(() => ({
  fontSize: FONT_SIZES.LG,
}));

const Profile = styled.div(() => ({
  display: "flex",
  alignItems: "center",
}));

const UserInfo = styled("div")`
  padding-left: ${SPACER[2]};

  @media ${MEDIA_QUERIES.MOBILE} {
    display: none;
  }
`;

const Name = styled.div(() => ({
  fontWeight: FONT_WEIGHT.SEMIBOLD,
}));

const Title = styled.span(() => ({
  opacity: 0.8,
}));

const MenuItem = (props) => (
  <Flex as="a" href={props.path} alignItems="center" gap={SPACER[2]}>
    <Icon>{props.icon}</Icon>
    <span>{props.label}</span>
  </Flex>
);

const MenuItemSignOut = (props) => {
  const dispatch = useDispatch();

  const handleSignOut = () => {
    dispatch(signOut());
    dispatch(clearUser());
  };

  return (
    <div onClick={handleSignOut}>
      <Flex alignItems="center" gap={SPACER[2]}>
        <Icon>
          <LogoutOutlined />
        </Icon>
        <span>{props.label}</span>
      </Flex>
    </div>
  );
};

const items = [
  // {
  //   key: "Edit Profile",
  //   label: <MenuItem path="/" label="Edit Profile" icon={<EditOutlined />} />,
  // },
  {
    key: "Account Setting",
    label: (
      <MenuItem
        path={`${APP_PREFIX_PATH}/pages/setting/`}
        label="Account Setting"
        icon={<SettingOutlined />}
      />
    ),
  },
  // {
  //   key: "Account Billing",
  //   label: (
  //     <MenuItem path="/" label="Account Billing" icon={<ShopOutlined />} />
  //   ),
  // },
  // {
  //   key: "Help Center",
  //   label: (
  //     <MenuItem
  //       path="/"
  //       label="Help Center"
  //       icon={<QuestionCircleOutlined />}
  //     />
  //   ),
  // },
  {
    key: "Sign Out",
    label: <MenuItemSignOut label="Sign Out" />,
  },
];

export const NavProfile = ({ mode }) => {
  const [userData, setUserData] = useState({});
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if userData is not null in auth
    if (auth.userData) {
      dispatch(setUser(auth.userData));
      setUserData(auth.userData);
    } else {
      // Check if userData is null and there's a valid token
      if (!user.userData && auth.token) {
        // Dispatch the action to fetch user data
        dispatch(fetchUserData(auth.token));
      } else {
        setUserData(user.userData);
      }
    }
  }, [dispatch, user.userData, auth.token, auth.userData, userData]);

  return (
    <Dropdown placement="bottomRight" menu={{ items }} trigger={["click"]}>
      <NavItem mode={mode}>
        <Profile>
          <Avatar
            src={userData.profile_pic || "/img/avatars/default-avatar.jpg"}
          />
          <UserInfo className="profile-text">
            <Name>
              {userData.name} {userData.surname}
            </Name>
            <Title>
              {userData.roles &&
                userData.roles.map((role, index) => {
                  let comma = index === userData.roles.length - 1 ? " " : ", ";
                  return role.title + comma;
                })}
            </Title>
          </UserInfo>
        </Profile>
      </NavItem>
    </Dropdown>
  );
};

export default NavProfile;
