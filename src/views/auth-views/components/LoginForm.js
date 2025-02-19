import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Button, Form, Input, Divider, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import { GoogleSVG, FacebookSVG } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import {
  signIn,
  showLoading,
  showAuthMessage,
  hideAuthMessage,
  signInWithGoogle,
  signInWithFacebook,
} from "store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const LoginForm = (props) => {
  const navigate = useNavigate();

  const {
    otherSignIn,
    showForgetPassword,
    hideAuthMessage,
    showLoading,
    signInWithGoogle,
    signInWithFacebook,
    extra,
    signIn,
    token,
    loading,
    redirect,
    showMessage,
    message,
    allowRedirect = true,
  } = props;

  console.log(showForgetPassword, "sfp");

  const initialCredential = {
    emailOrUsername: "",
    password: "",
  };

  const onLogin = (values) => {
    showLoading();
    signIn(values);
  };

  const onGoogleLogin = () => {
    showLoading();
    signInWithGoogle();
  };

  const onFacebookLogin = () => {
    showLoading();
    signInWithFacebook();
  };

  useEffect(() => {
    if (token !== null && allowRedirect) {
      navigate(redirect);
    }
    if (showMessage) {
      const timer = setTimeout(() => hideAuthMessage(), 3000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, []);

  // const renderOtherSignIn = (
  //   <div>
  //     <Divider>
  //       <span className="text-muted font-size-base font-weight-normal">
  //         or connect with
  //       </span>
  //     </Divider>
  //     <div className="d-flex justify-content-center">
  //       <Button
  //         onClick={() => onGoogleLogin()}
  //         className="mr-2"
  //         disabled={loading}
  //         icon={<CustomIcon svg={GoogleSVG} />}
  //       >
  //         Google
  //       </Button>
  //       <Button
  //         onClick={() => onFacebookLogin()}
  //         icon={<CustomIcon svg={FacebookSVG} />}
  //         disabled={loading}
  //       >
  //         Facebook
  //       </Button>
  //     </div>
  //   </div>
  // );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, marginBottom: 0 }}
        animate={{
          opacity: showMessage ? 1 : 0,
          marginBottom: showMessage ? 20 : 0,
        }}
      >
        <Alert type="error" showIcon message={message}></Alert>
      </motion.div>
      <Form
        layout="vertical"
        name="login-form"
        initialValues={initialCredential}
        onFinish={onLogin}
      >
        <Form.Item
          name="emailOrUsername"
          // name="email"
          label="Email / Username"
          rules={[
            {
              required: true,
              message: "Please input your email or username",
            },
            {
              type: "email",
              message: "Please enter a validate email or username!",
            },
          ]}
        >
          <Input prefix={<MailOutlined className="text-primary" />} />
        </Form.Item>
        <Form.Item
          name="password"
          label={
            <div
              className={`${
                showForgetPassword
                  ? "d-flex justify-content-between w-100 align-items-center"
                  : ""
              }`}
            >
              <span>Password</span>
              {showForgetPassword && (
                <a
                  className="cursor-pointer font-size-sm font-weight-normal text-muted ml-2"
                  href="/admin/auth/forgot-password"
                >
                  Forget Password?
                </a>
              )}
            </div>
          }
          rules={[
            {
              required: true,
              message: "Please input your password",
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined className="text-primary" />} />
        </Form.Item>

        {/* <p style={{ margin: " -10px 0 10px 0" }}>
          Forget password? <a href="/auth/forgot-password">Click Here</a>
        </p> */}
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Sign In
          </Button>
        </Form.Item>
        {/* {otherSignIn ? renderOtherSignIn : null} */}
        {extra}
      </Form>
    </>
  );
};

LoginForm.propTypes = {
  otherSignIn: PropTypes.bool,
  showForgetPassword: PropTypes.bool,
  extra: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

LoginForm.defaultProps = {
  otherSignIn: true,
  showForgetPassword: true,
};

const mapStateToProps = ({ auth }) => {
  const { loading, message, showMessage, token, redirect } = auth;
  return { loading, message, showMessage, token, redirect };
};

const mapDispatchToProps = {
  signIn,
  showAuthMessage,
  showLoading,
  hideAuthMessage,
  signInWithGoogle,
  signInWithFacebook,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginForm);
