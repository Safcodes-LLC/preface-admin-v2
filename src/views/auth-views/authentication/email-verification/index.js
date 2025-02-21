import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography } from "antd";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const { Text } = Typography;

const backgroundStyle = {
  backgroundImage: "url(/img/others/img-17.webp)",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const theme = useSelector((state) => state.theme.currentTheme);
  const [status, setStatus] = useState("");   
  const [searchParams] = useSearchParams();   
  const token = searchParams.get("token");
  const [isApiCalled, setIsApiCalled] = useState(false); // Prevent API call repetition

  useEffect(() => {
    // Check if the token exists and if the API has been called before
    if (token && !isApiCalled) {
      setIsApiCalled(true); // Set flag to avoid repeated calls

      axios
        .post(`https://king-prawn-app-x9z27.ondigitalocean.app/api/user/verify-email`, { token })
        .then((response) => {
          setVerificationStatus("success");
          setVerificationMessage(response.data.message);
        })
        .catch((error) => {
          setVerificationStatus("failed");
          setVerificationMessage(error.response?.data?.message || "Verification failed");
        });
    }
  }, [token, isApiCalled]);

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
                      <Text
                        strong
                        style={{
                          color:
                            verificationStatus === "success" ? "green" : "red",
                          fontSize: "16px",
                        }}
                      >
                        {verificationStatus?.charAt(0).toUpperCase() +
                          verificationStatus?.slice(1)}
                      </Text>
                      <p
                        style={{
                          color:
                            verificationStatus === "success" ? "green" : "red",
                          fontSize: "14px",
                          marginTop: "5px",
                        }}
                      >
                        {verificationMessage}
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
