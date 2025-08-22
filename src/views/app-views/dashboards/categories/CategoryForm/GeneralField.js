import React, { useEffect, useState } from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
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
      required: false,
      message: "Please enter category description",
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
  const isPngOrWebp = file.type === "image/png" || file.type === "image/webp";
  if (!isPngOrWebp) {
    message.error("You can only upload PNG or WebP files!");
    return false;
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Image must be smaller than 1MB!");
    return false;
  }
  return true;
};

const beforeIconUpload = (file) => {
  const isValidIcon = file.type === "image/png" || file.type === "image/webp";

  if (!isValidIcon) {
    message.error("You can only upload PNG or WebP files!");
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Icon must smaller than 1MB!");
  }
  return isValidIcon && isLt1M;
};

const GeneralField = (props) => {
  const dispatch = useDispatch();
  const form = Form.useFormInstance();
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);

  const [loadingCategories, setLoadingCategories] = useState(true);

  const selectedLanguage = Form.useWatch("language", form);
  const selectedParentCategory = Form.useWatch("parentCategory", form);

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

  // Reset parent and sub category when language changes
  useEffect(() => {
    if (selectedLanguage) {
      form.setFieldsValue({
        parentCategory: undefined,
        subCategory: undefined,
      });
    }
  }, [selectedLanguage, form]);

  // Reset sub category when parent category changes
  useEffect(() => {
    form.setFieldsValue({ subCategory: undefined });
  }, [selectedParentCategory, form]);

  // Filter categories that match the selected language
  const filteredCategories = categories.filter((category) => {
    const matchesLanguage = selectedLanguage
      ? category.language?._id === selectedLanguage ||
        category.language === selectedLanguage
      : true;

    return matchesLanguage;
  });

  // Get main categories (categories without parent)
  const mainCategories = filteredCategories.filter(
    (category) => !category.parentCategory
  );

  // Get sub categories based on selected parent category
  const subCategories = selectedParentCategory
    ? filteredCategories.filter(
        (category) =>
          category.parentCategory &&
          (category.parentCategory.id === selectedParentCategory ||
            category.parentCategory === selectedParentCategory)
      )
    : [];

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

          <Form.Item
            name="isTrending"
            label="Trending Topic"
            initialValue={false}
          >
            <Select
              style={{ width: "100%" }}
              placeholder="Select trending status"
              disabled={props.view}
            >
              <Option value={false}>No</Option>
              <Option value={true}>Yes</Option>
            </Select>
          </Form.Item>

          <Form.Item name="name" label="Category Name" rules={rules.name}>
            <Input placeholder="Category name" disabled={props.view} />
          </Form.Item>
          <Form.Item
            name="shortDescription"
            label="Short Description"
            rules={rules.short_desc}
          >
            <Input.TextArea rows={2} disabled={props.view} />
          </Form.Item>
        </Card>
      </Col>
      <Col xs={24} sm={24} md={7}>
        <Card title="Featured Icon" className="mb-3">
          <Dragger
            {...iconUploadProps}
            beforeUpload={beforeIconUpload}
            onChange={(e) => props.handleIconUploadChange(e)}
            disabled={props.view}
          >
            {props.featuredIcon ? (
              <div className="text-center">
                <img
                  src={props.featuredIcon}
                  alt="icon"
                  style={{ maxWidth: "60px", maxHeight: "60px" }}
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
                    <p className="text-muted" style={{ fontSize: "12px" }}>
                      PNG, WebP (Max 1MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </Dragger>
        </Card>

        <Card title="Featured Image">
          <Dragger
            {...imageUploadProps}
            beforeUpload={beforeUpload}
            onChange={(e) => props.handleUploadChange(e)}
            disabled={props.view}
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
          {/* Parent Category Dropdown */}
          <Form.Item name="parentCategory" label="Parent Category">
            <Select
              style={{ width: "100%" }}
              placeholder={
                selectedLanguage
                  ? "Please select language first"
                  : "Please select language first"
              }
              disabled={!selectedLanguage || props.view}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {mainCategories.map((category) => (
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
