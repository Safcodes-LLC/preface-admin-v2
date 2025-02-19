import React, { useState } from "react";
import { Card, Row, Col, Form, Input, Button, message, Typography } from "antd";
import { useSelector, useDispatch } from "react-redux";

const { Text, Title } = Typography;
const backgroundStyle = {
  backgroundImage: "url(/img/others/img-17.webp)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const EmailVerification = () => {

  const theme = useSelector((state) => state.theme.currentTheme);

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
                  <h3 className="mt-3 font-weight-bold">Email Verification</h3>
                </div>
                <Row justify="center">
                  <Col xs={24} sm={24} md={20} lg={20}>
                  <div className="text-center">
                      <Text strong style={{ color: "green", fontSize: "16px" }}>
                        Success
                      </Text>
                      <p style={{ color: "green", fontSize: "14px", marginTop: "5px" }}>
                        Email successfully verified. You can now log in.
                      </p>
                    </div>
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

export default EmailVerification;
