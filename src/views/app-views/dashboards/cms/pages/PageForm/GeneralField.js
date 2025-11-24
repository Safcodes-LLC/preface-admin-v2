import React, { useEffect, useState } from "react";
import {
  Input,
  Row,
  Col,
  Card,
  Form,
  Upload,
  message,
  Select,
  Button,
} from "antd";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useDispatch, useSelector } from "react-redux";

const rules = {
  title: [
    {
      required: true,
      message: "Please enter article title",
    },
  ],
  content: [
    {
      required: true,
      message: "Please enter article content",
    },
  ],
};

const GeneralField = (props) => {
  const dispatch = useDispatch();

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={24}>
          <Card>
            <Form.Item name="title" label="Page Title" rules={rules.title}>
              <Input placeholder="Page Title" disabled={props.view} />
            </Form.Item>

            <div
              className={`editor-container ${isFullscreen ? "fullscreen" : ""}`}
            >
              {/* <button onClick={toggleFullscreen} className="min-full-btn">
                {isFullscreen ? "X" : <ArrowsAltOutlined />}
              </button> */}
              {props.children}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneralField;
