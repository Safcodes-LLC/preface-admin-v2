import React, { useEffect, useState } from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPostTypes } from "store/slices/postTypesSlice";
import { AUTH_TOKEN } from "constants/AuthConstant";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";

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
  language: [
    {
      required: true,
      message: "Please select a language",
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

// New upload props for icons
const iconUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/categories/icons",
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

// Validation for icon upload
const beforeIconUpload = (file) => {
  const isValidIcon = 
    file.type === "image/svg+xml" || 
    file.type === "image/png" || 
    file.type === "image/jpeg" ||
    file.type === "image/x-icon";
  
  if (!isValidIcon) {
    message.error("You can only upload SVG/PNG/JPG/ICO file!");
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Icon must smaller than 1MB!");
  }
  return isValidIcon && isLt1M;
};

const GeneralField = (props) => {
  const dispatch = useDispatch();
  const form = Form.useFormInstance(); // Get form instance to watch field values
  const postTypes = useSelector((state) => state.postTypes.postTypes);
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);

  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Watch the language field to filter parent categories
  const selectedLanguage = Form.useWatch('language', form);

  useEffect(() => {
    if (!postTypes.length) {
      dispatch(fetchAllPostTypes());
    }
  }, [dispatch, postTypes]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  useEffect(() => {
    if (categories.length === 0 && loadingCategories) {
      dispatch(fetchAllCategories()).then(() => {
        setLoadingCategories(false);
      });
    } else {
      setLoadingCategories(false);
    }
  }, [categories, dispatch]);

  // Reset parent category when language changes
  useEffect(() => {
    if (selectedLanguage) {
      form.setFieldsValue({ parentCategory: undefined });
    }
  }, [selectedLanguage, form]);

  // Filter categories that do not have a parentCategory AND match the selected language
  const filteredCategories = categories.filter((category) => {
    const hasNoParent = !category.parentCategory;
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    return hasNoParent && matchesLanguage;
  });

  console.log(filteredCategories, "filtered categories by language");

  return (
    <Row gutter={16}>
      <Col xs={24} sm={24} md={17}>
        <Card title="Basic Info">
          <Form.Item name="language" label="Language" rules={rules.language}>
            <Select
              style={{ width: "100%" }}
              placeholder="Language"
              disabled={props.view}
            >
              {languages.map((language) => (
                <Option key={language._id} value={language._id}>
                  {language.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
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
        {/* Featured Icon Card - Added before Featured Image */}
        <Card title="Featured Icon" className="mb-3">
          <Dragger
            {...iconUploadProps}
            beforeUpload={beforeIconUpload}
            onChange={(e) => props.handleIconUploadChange(e)}
          >
            {props.featuredIcon ? (
              <div className="text-center">
                <img
                  src={props.featuredIcon}
                  alt="icon"
                  style={{ maxWidth: '60px', maxHeight: '60px' }}
                />
              </div>
            ) : (
              <div>
                {props.iconUploadLoading ? (
                  <div>
                    <LoadingOutlined className="font-size-xxl text-primary" />
                    <div className="mt-3">Uploading</div>
                  </div>
                ) : (
                  <div>
                    <AppstoreOutlined className="display-3" />
                    <p>Click or drag icon to upload</p>
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                      SVG, PNG, JPG, ICO (Max 1MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </Dragger>
        </Card>

        {/* Featured Image Card */}
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
              placeholder={
                selectedLanguage 
                  ? "Select a parent category" 
                  : "Please select a language first"
              }
              disabled={!selectedLanguage}
            >
              {filteredCategories.map((category) => (
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