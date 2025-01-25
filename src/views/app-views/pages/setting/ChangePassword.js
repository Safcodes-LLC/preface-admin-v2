import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { Form, Button, Input, Row, Col, message } from "antd";
import { changePassword, hideAuthMessage } from "store/slices/authSlice"; // Adjust the import path according to your project structure
import { useNavigate } from "react-router-dom";

export const ChangePassword = (props) => {
  const { changePassword, loading, redirect, message } = props;
  const navigate = useNavigate();
  const changePasswordFormRef = useRef();

  useEffect(() => {
    if (message.status === "success") {
      navigate(redirect);
    }
  }, [message]);

  const onFinish = (values) => {
    changePassword(values);
  };

  return (
    <>
      <h2 className="mb-4">Change Password</h2>
      <Row>
        <Col xs={24} sm={24} md={24} lg={8}>
          <Form
            name="changePasswordForm"
            layout="vertical"
            ref={changePasswordFormRef}
            onFinish={onFinish}
          >
            <Form.Item
              label="Current Password"
              name="oldPassword"
              rules={[
                {
                  required: true,
                  message: "Please enter your current password!",
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Please enter your new password!" },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject("Password not matched!");
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Change password
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
};

const mapStateToProps = (state) => ({
  loading: state.auth.loading,
  message: state.auth.message,
  redirect: state.auth.redirect,
});

const mapDispatchToProps = {
  changePassword,
};

export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);
