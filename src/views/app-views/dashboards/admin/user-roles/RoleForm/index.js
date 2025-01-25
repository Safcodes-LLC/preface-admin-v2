import React from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined } from "@ant-design/icons";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  name: [
    {
      required: true,
      message: "Please enter author name",
    },
  ],
  bio: [
    {
      required: true,
      message: "Please enter author description",
    },
  ],
};

const imageUploadProps = {
  name: "file",
  multiple: true,
  listType: "picture-card",
  showUploadList: false,
  action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
};

const beforeUpload = (file) => {
  const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
  if (!isJpgOrPng) {
    message.error("You can only upload JPG/PNG file!");
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error("Image must smaller than 2MB!");
  }
  return isJpgOrPng && isLt2M;
};

const languages = ["English", "Arabian", "Hindi", "Malylam", "Telugu"];
const roles = [
  "Content Writer",
  "Content Editor Level 1",
  "Content Editor Level 2",
  "Content Editor Level 3",
  "Language Editor",
  "Chief Editor",
  "Post Admin",
];

const GeneralField = (props) => (
  <Row gutter={16}>
    <Col xs={24} sm={24} md={17}>
      {/* username
            email
            bio
            name
            surname
            profile photo
            roles
            langs  */}

      <Card title="Basic Info">
        <Form.Item name="username" label="Author username" rules={rules.name}>
          <Input placeholder="Author username" />
        </Form.Item>
        <Form.Item name="bio" label="Bio" rules={rules.description}>
          <Input.TextArea rows={4} />
        </Form.Item>
      </Card>
      <Card title="Personal Info">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={12}>
            <Form.Item name="name" label="Name" rules={rules.name}>
              <Input placeholder="Author name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Form.Item name="surname" label="Surname" rules={rules.surname}>
              <Input placeholder="Author surname" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Col>
    <Col xs={24} sm={24} md={7}>
      <Card title="Profile pic">
        <Dragger
          {...imageUploadProps}
          beforeUpload={beforeUpload}
          onChange={(e) => props.handleUploadChange(e)}
        >
          {props.uploadedImg ? (
            <img src={props.uploadedImg} alt="avatar" className="img-fluid" />
          ) : (
            <div>
              {props.uploadLoading ? (
                <div>
                  <LoadingOutlined className="font-size-xxl text-primary" />
                  <div className="mt-3">Uploading</div>
                </div>
              ) : (
                <div>
                  <CustomIcon className="display-3" svg={ImageSvg} />
                  <p>Click or drag file to upload</p>
                </div>
              )}
            </div>
          )}
        </Dragger>
      </Card>
      <Card title="Roles and languages">
        <Form.Item name="languages" label="Languages">
          <Select
            mode="multiple"
            style={{ width: "100%" }}
            placeholder="Languages"
          >
            {languages.map((elm) => (
              <Option key={elm} value={elm}>
                {elm}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="roles" label="Roles">
          <Select mode="multiple" style={{ width: "100%" }} placeholder="Roles">
            {roles.map((elm) => (
              <Option key={elm}>{elm}</Option>
            ))}
          </Select>
        </Form.Item>
      </Card>
    </Col>
  </Row>
);

export default GeneralField;
