import React, { useEffect, useState } from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPostTypes } from "store/slices/postTypesSlice";
import { AUTH_TOKEN } from "constants/AuthConstant";
import { fetchAllCategories } from "store/slices/categoriesSlice";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  name: [
    {
      required: true,
      message: "Please enter category name",
    },
  ],
  short_desc: [
    {
      required: true,
      message: "Please enter category description",
    },
  ],
  postType: [
    {
      required: true,
      message: "Please enter category PostType",
    },
  ],
};

const imageUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/categories/featuredimages",
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
  const postTypes = useSelector((state) => state.postTypes.postTypes);
  const categories = useSelector((state) => state.categories.categories); // Get categories from Redux store
  const [loadingCategories, setLoadingCategories] = useState(true);
  useEffect(() => {
    if (!postTypes.length) {
      dispatch(fetchAllPostTypes());
    }
  }, [dispatch, postTypes]);
  useEffect(() => {
    if (categories.length === 0 && loadingCategories) {
      // If categories haven't been fetched, fetch them
      dispatch(fetchAllCategories()).then(() => {
        setLoadingCategories(false);
      });
    } else {
      setLoadingCategories(false);
    }
  }, [categories, dispatch]);
  return (
    <Row gutter={16}>
      <Col xs={24} sm={24} md={17}>
        <Card title="Basic Info">
          <Form.Item name="name" label="Category Name" rules={rules.name}>
            <Input placeholder="Category name" />
          </Form.Item>
          <Form.Item
            name="shortDescription"
            label="Short Description"
            rules={rules.short_desc}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Card>
      </Col>
      <Col xs={24} sm={24} md={7}>
        <Card title="Featured Image">
          <Dragger
            {...imageUploadProps}
            beforeUpload={beforeUpload}
            onChange={(e) => props.handleUploadChange(e)}
          >
            {props.featuredImage ? (
              <img
                src={props.featuredImage}
                alt="avatar"
                className="img-fluid"
              />
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
        <Card>
          <Form.Item
            name="postType"
            label="Creating for Post type"
            rules={rules.postType}
          >
            <Select
              style={{ width: "100%" }}
              placeholder="Post type"
              onChange={(val) => {
                console.log(val, "lklk");
              }}
            >
              {postTypes.map((postType) => (
                <Option key={postType._id} value={postType._id}>
                  {postType.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="parentCategory" label="Parent Category">
            <Select
              style={{ width: "100%" }}
              placeholder="Select a parent category"
            >
              {/* <Option value={null}>
                None (Create as a top-level category)
              </Option> */}
              {categories.map((category) => (
                <Option key={category._id} value={category._id}>
                  {category.name}
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
