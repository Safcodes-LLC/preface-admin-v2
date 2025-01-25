import React, { useEffect, useState } from "react";
import { Card, Row, Col, Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { resetPassword } from "store/slices/authSlice"; // Adjust the import path according to your project structure
import { useSearchParams } from "react-router-dom";

const backgroundStyle = {
  backgroundImage: "url(/img/others/img-17.webp)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const NewPasswordPage = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    console.log(token);
  }, [token]);

  const onSetPassword = (values) => {
    setLoading(true);
    dispatch(resetPassword({ token, newPassword: values.newPassword }))
      .unwrap()
      .then(() => {
        setLoading(false);
        message.success("Password successfully updated!");
        // Redirect the user or perform any post-reset logic here
      })
      .catch((error) => {
        setLoading(false);
        message.error(error.message);
      });
  };

  return (
    <div className="h-100" style={backgroundStyle}>
      <div className="container d-flex flex-column justify-content-center h-100">
        <Row justify="center">
          <Col xs={20} sm={20} md={20} lg={9}>
            <Card>
              <div className="my-2">
                <div className="text-center">
                  <img
                    className="img-fluid"
                    src="/img/logo.png" // Adjust the image path according to your project structure
                    alt=""
                  />
                  <h3 className="mt-3 font-weight-bold">Set New Password</h3>
                  <p className="mb-4">Enter your new password</p>
                </div>
                <Row justify="center">
                  <Col xs={24} sm={24} md={20} lg={20}>
                    <Form
                      form={form}
                      layout="vertical"
                      name="new-password"
                      onFinish={onSetPassword}
                    >
                      <Form.Item
                        name="newPassword"
                        rules={[
                          {
                            required: true,
                            message: "Please input your new password",
                          },
                          {
                            min: 8,
                            message:
                              "Password must be at least 8 characters long",
                          },
                        ]}
                      >
                        <Input.Password
                          placeholder="New Password"
                          prefix={<LockOutlined className="text-primary" />}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button
                          loading={loading}
                          type="primary"
                          htmlType="submit"
                          block
                        >
                          {loading ? "Updating..." : "Update Password"}
                        </Button>
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default NewPasswordPage;
