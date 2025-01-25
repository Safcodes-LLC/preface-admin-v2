import React, { useEffect } from "react";
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
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import {
  LoadingOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CopyOutlined,
} from "@ant-design/icons";
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
      message: "Please enter user username it must be unique",
    },
  ],
  email: [
    {
      required: true,
      message: "Please enter user email it must be unique",
    },
  ],
  name: [
    {
      required: true,
      message: "Please enter user name",
    },
  ],
  surname: [
    {
      required: true,
      message: "Please enter user surname",
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
    // "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/users/profilepics",
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/user/upload-profile-pic",

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

  const handleCopy = () => {
    navigator.clipboard.writeText(props.samplePassword);
    message.success("Password copied to clipboard!");
  };

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
          <Form.Item name="username" label="User username" rules={rules.name}>
            <Input placeholder="User username" disabled={props.view} />
          </Form.Item>
          <Form.Item name="email" label="User Email" rules={rules.email}>
            <Input placeholder="User email" disabled={props.view} />
          </Form.Item>
          <Form.Item name="bio" label="Bio" rules={rules.description}>
            <Input.TextArea rows={4} disabled={props.view} />
          </Form.Item>
        </Card>
        <Card title="Personal Info">
          <Row gutter={16}>
            <Col xs={24} sm={24} md={12}>
              <Form.Item name="name" label="Name" rules={rules.name}>
                <Input placeholder="User name" disabled={props.view} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Form.Item name="surname" label="Surname" rules={rules.surname}>
                <Input placeholder="User surname" disabled={props.view} />
              </Form.Item>
            </Col>
            {props.view && props.samplePassword && (
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="samplePassword"
                  label="Password"
                  rules={rules.surname}
                >
                  <div style={{ display: "flex" }}>
                    <Input.Password
                      placeholder="User password"
                      value={props.samplePassword}
                      iconRender={(visible) =>
                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                      }
                    />
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                      style={{ marginLeft: "10px" }}
                    />
                  </div>
                </Form.Item>
              </Col>
            )}
          </Row>
        </Card>
      </Col>
      <Col xs={24} sm={24} md={7}>
        <Card title="Profile pic">
          <Dragger
            {...imageUploadProps}
            beforeUpload={beforeUpload}
            onChange={(e) => props.handleUploadChange(e)}
            disabled={props.view}
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
              disabled={props.view}
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
              disabled={props.view}
            >
              {roles
                .filter((role) => {
                  if (props.type === "admin") {
                    return (
                      role.title === "Administrator" ||
                      role.title === "Post Admin"
                    );
                  } else {
                    return (
                      role.title !== "Administrator" &&
                      role.title !== "Post Admin"
                    );
                  }
                })
                .map((role) => (
                  <Option key={role._id} value={role._id}>
                    {role.title}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Card>
      </Col>
    </Row>
  );
};

export default GeneralField;
