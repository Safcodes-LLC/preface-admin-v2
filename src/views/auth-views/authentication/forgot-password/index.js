import React, { useState } from "react";
import { Card, Row, Col, Form, Input, Button, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { requestPasswordReset } from "store/slices/authSlice";
import { useNavigate } from "react-router-dom";

const backgroundStyle = {
  backgroundImage: "url(/img/others/img-17.webp)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch(); // Use useDispatch hook
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const theme = useSelector((state) => state.theme.currentTheme);

  const onSend = (values) => {
    setLoading(true);
    dispatch(requestPasswordReset(values)) // Dispatch the forgotPassword action with form values
      .unwrap()
      .then(() => {
        setLoading(false);
        message.success("New password has been sent to your email!");
        console.log("done");
        navigate("/admin/auth/login-1");
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
                    src={`/img/${
                      theme === "light" ? "logo.png" : "logo-white.png"
                    }`}
                    alt=""
                  />
                  <h3 className="mt-3 font-weight-bold">Forgot Password?</h3>
                  <p className="mb-4">Enter your Email to reset password</p>
                </div>
                <Row justify="center">
                  <Col xs={24} sm={24} md={20} lg={20}>
                    <Form
                      form={form}
                      layout="vertical"
                      name="forget-password"
                      onFinish={onSend}
                    >
                      <Form.Item
                        name="email"
                        rules={[
                          {
                            required: true,
                            message: "Please input your email address",
                          },
                          {
                            type: "email",
                            message: "Please enter a valid email!",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Email Address"
                          prefix={<MailOutlined className="text-primary" />}
                        />
                      </Form.Item>
                      <Form.Item>
                        <Button
                          loading={loading}
                          type="primary"
                          htmlType="submit"
                          block
                        >
                          {loading ? "Sending..." : "Send"}
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

export default ForgotPassword;
