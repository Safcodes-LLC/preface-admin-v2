import React, { useEffect } from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllRoles } from "store/slices/rolesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { AUTH_TOKEN } from "constants/AuthConstant";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  username: [
    {
      required: true,
      message: "Please enter author username it must be unique",
    },
  ],
  email: [
    {
      required: true,
      message: "Please enter author email it must be unique",
    },
  ],
  name: [
    {
      required: true,
      message: "Please enter author name",
    },
  ],
  surname: [
    {
      required: true,
      message: "Please enter author surname",
    },
  ],
  languages: [
    {
      required: true,
      message: "Please select atleast one language",
    },
  ],
};

const imageUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/users/profilepics",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
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

const GeneralField = (props) => {
  const dispatch = useDispatch();

  const roles = useSelector((state) => state.roles.roles);
  const languages = useSelector((state) => state.languages.languages);

  useEffect(() => {
    if (!roles.length) {
      dispatch(fetchAllRoles());
    }
  }, [dispatch, roles]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  
  return (
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
          <Form.Item name="email" label="Author Email" rules={rules.email}>
            <Input placeholder="Author email" />
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
            {props.profilePic ? (
              <img src={props.profilePic} alt="avatar" className="img-fluid" />
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
          <Form.Item name="languages" label="Languages" rules={rules.languages}>
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Languages"
            >
              {languages.map((language) => (
                <Option key={language._id} value={language._id}>
                  {language.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="roles" label="Roles">
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              placeholder="Roles"
              defaultValue={["Authors"]}
              disabled
            >
              {roles.map((role) => (
                <Option key={role._id} value={role._id}>
                  {role.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>
        {/* <Card title="Elite authors">
          <Form.Item name="elite" label="">
            <Select style={{ width: "100%" }} placeholder="Select Yes or No">
              <Option value="yes">Yes</Option>
              <Option value="no">No</Option>
            </Select>
          </Form.Item>
        </Card> */}
      </Col>
    </Row>
  );
};

export default GeneralField;
