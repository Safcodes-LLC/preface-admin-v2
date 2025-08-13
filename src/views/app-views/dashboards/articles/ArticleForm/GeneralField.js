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
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined, ArrowsAltOutlined } from "@ant-design/icons";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { AUTH_TOKEN } from "constants/AuthConstant";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  title: [
    {
      required: true,
      message: "Please enter article title",
    },
  ],
  sub_title: [
    {
      required: true,
      message: "Please enter article sub title",
    },
  ],
  short_desc: [
    {
      required: true,
      message: "Please enter article short description",
    },
  ],
  content: [
    {
      required: true,
      message: "Please enter article content",
    },
  ],
  language: [
    {
      required: true,
      message: "Please select Language",
    },
  ],
  ParentCategory: [
    {
      required: true,
      message: "Please select Parent Category",
    },
  ],
  categories: [
    {
      required: true,
      message: "Please select at least one Sub Category",
    },
  ],
  subSubCategories: [
    {
      required: false,
      message: "Please select Sub-Sub Category",
    },
  ],
};

const thumbnailUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/articles/thumbnails",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

// For more images
const moreImagesUploadProps = {
  name: "file",
  multiple: true,
  listType: "picture-card",
  showUploadList: false,
  action: "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/articles/moreimages",
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

const GeneralField = (props) => {
  const dispatch = useDispatch();

  const article_categories = useSelector(
    (state) => state.categories.categories
  );

  const languages = useSelector((state) => state.languages.languages);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedSubSubCategories, setSelectedSubSubCategories] = useState([]);
  const [finalCategoriesForSubmission, setFinalCategoriesForSubmission] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Filter categories based on selected language
  useEffect(() => {
    if (selectedLanguage && article_categories.length > 0) {
      const filtered = article_categories.filter(
        (category) => category.language && category.language._id === selectedLanguage
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [selectedLanguage, article_categories]);

  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
    // Clear all category selections when language changes
    if (props.form) {
      props.form.setFieldsValue({
        ParentCategory: undefined,
        categories: undefined,
        subSubCategories: undefined
      });
    }
    setSubCategories([]);
    setSubSubCategories([]);
    setSelectedSubCategories([]);
  };

  const handleParentCategoryChange = (value) => {
    const filteredSubCategories = filteredCategories.filter(
      (category) => category.parentCategory && category.parentCategory.id === value
    );
    setSubCategories(filteredSubCategories);
    
    // Clear sub and sub-sub categories when parent changes
    if (props.form) {
      props.form.setFieldsValue({
        categories: undefined,
        subSubCategories: undefined
      });
    }
    setSubSubCategories([]);
    setSelectedSubCategories([]);
  };

  const handleSubCategoryChange = (selectedValues) => {
    console.log("=== SUB CATEGORY CHANGE ===");
    console.log("Selected sub category values:", selectedValues);
    
    setSelectedSubCategories(selectedValues);
    
    // Find all sub-sub categories that have any of the selected sub categories as parent
    const filteredSubSubCategories = filteredCategories.filter(
      (category) => 
        category.parentCategory && 
        selectedValues.includes(category.parentCategory.id)
    );
    
    console.log("Filtered sub-sub categories:", filteredSubSubCategories);
    setSubSubCategories(filteredSubSubCategories);
    
    // Clear sub-sub category selection when sub categories change
    setSelectedSubSubCategories([]);
    if (props.form) {
      props.form.setFieldsValue({
        subSubCategories: undefined
      });
    }
    
    // Set final categories to sub categories (will be overridden if sub-sub categories are selected)
    setFinalCategoriesForSubmission(selectedValues);
    
    // Set the categories field to sub category values
    if (props.form) {
      props.form.setFieldsValue({
        categories: selectedValues
      });
    }
    
    console.log("Form values after sub category change:", props.form.getFieldsValue());
  };

  const handleSubSubCategoryChange = (selectedValues) => {
    console.log("=== SUB-SUB CATEGORY SELECTION ===");
    console.log("Selected sub-sub category IDs:", selectedValues);
    
    // Update state
    setSelectedSubSubCategories(selectedValues);
    
    // Find the actual category objects for debugging
    const selectedCategories = selectedValues.map(id => 
      filteredCategories.find(cat => cat._id === id)
    );
    console.log("Selected sub-sub category objects:", selectedCategories);
    
    // Set final categories to sub-sub categories
    setFinalCategoriesForSubmission(selectedValues);
    
    // Force update the categories field multiple times to ensure it sticks
    if (props.form) {
      // Method 1: Direct field update
      props.form.setFieldsValue({
        categories: selectedValues,
        finalParentCategory: selectedValues
      });
      
      // Method 2: Force re-render with timeout
      setTimeout(() => {
        props.form.setFieldsValue({
          categories: selectedValues
        });
        console.log("Form values after timeout update:", props.form.getFieldsValue());
      }, 50);
    }
    
    // Notify parent component with the correct categories
    if (props.onSubSubCategoryChange) {
      props.onSubSubCategoryChange(selectedValues);
    }
    
    // Also call a direct callback to parent if available
    if (props.onFinalCategoriesChange) {
      props.onFinalCategoriesChange(selectedValues);
    }
  };

  useEffect(() => {
    if (props?.currentparentcategory) {
      const defaultParentCategory = props.currentparentcategory?.[0];
      handleParentCategoryChange(defaultParentCategory);
    }
  }, [props.currentparentcategory, filteredCategories]);
  

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const [categoriesList, setCategoriesList] =
    useState(article_categories);

  useEffect(() => {
    setCategoriesList(filteredCategories);
  }, [filteredCategories]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  // Effect to ensure categories field is always updated with final categories
  useEffect(() => {
    if (finalCategoriesForSubmission.length > 0 && props.form) {
      console.log("Updating categories field with final categories:", finalCategoriesForSubmission);
      props.form.setFieldsValue({
        categories: finalCategoriesForSubmission
      });
    }
  }, [finalCategoriesForSubmission, props.form]);

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={17}>
          <Card>
            <Form.Item name="title" label="Article Title" rules={rules.title}>
              <Input placeholder="Article Title" disabled={props.view} />
            </Form.Item>
            <Form.Item
              name="sub_title"
              label="Article sub Title"
              rules={rules.sub_title}
            >
              <Input placeholder="Article Sub Title" disabled={props.view} />
            </Form.Item>
            <Form.Item
              name="short_desc"
              label="Article short description"
              rules={rules.short_desc}
            >
              <Input.TextArea
                rows={2}
                placeholder="Article short description"
                disabled={props.view}
              />
            </Form.Item>

            <div
              className={`editor-container ${isFullscreen ? "fullscreen" : ""}`}
            >
              <button onClick={toggleFullscreen} className="min-full-btn">
                {isFullscreen ? "X" : <ArrowsAltOutlined />}
              </button>
              {props.children}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={7}>
          <Card title="Article thumbnail">
            <Dragger
              disabled={props.view}
              {...thumbnailUploadProps}
              beforeUpload={beforeUpload}
              onChange={(e) => props.handleThumbnailImgUploadChange(e)}
            >
              {props.uploadedThumbnailImg ? (
                <img
                  src={props.uploadedThumbnailImg}
                  alt="avatar"
                  className="img-fluid"
                />
              ) : (
                <div>
                  {props.uploadThumbnailImgLoading ? (
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
          <Card title="More Images">
            <Dragger
              disabled={props.view}
              {...moreImagesUploadProps}
              beforeUpload={beforeUpload}
              onChange={(e) => props.handleUploadMoreImagesChange(e)}
            >
              {props.uploadedMoreImgs && props.uploadedMoreImgs.length ? (
                props.uploadedMoreImgs.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index}`}
                    className="img-fluid"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                ))
              ) : (
                <div>
                  {props.uploadMoreImgLoading ? (
                    <div>
                      <LoadingOutlined className="font-size-xxl text-primary" />
                      <div className="mt-3">Uploading</div>
                    </div>
                  ) : (
                    <div>
                      <CustomIcon className="display-3" svg={ImageSvg} />
                      <p>Click or drag files to upload</p>
                    </div>
                  )}
                </div>
              )}
            </Dragger>
          </Card>
          <Card>
            {props.uploadedMoreImgs && props.uploadedMoreImgs.length ? (
              <Button
                type="primary"
                onClick={props.handleClearSelectedMoreImages}
              >
                Clear Selected more Images
              </Button>
            ) : (
              ""
            )}
          </Card>
          <Card title="Language AND Categories">
            <Form.Item name="language" label="Language" rules={rules.language}>
              <Select
                style={{ width: "100%" }}
                placeholder="Language"
                disabled={props.view}
                onChange={handleLanguageChange}
              >
                {languages.map((language) => (
                  <Option key={language._id} value={language._id}>
                    {language.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
             <Form.Item name="ParentCategory" label="Parent Category" rules={rules.ParentCategory}>
              <Select
                style={{ width: "100%" }}
                placeholder={selectedLanguage ? "Parent Category" : "Please select language first"}
                disabled={props.view || !selectedLanguage}
                onChange={handleParentCategoryChange}
              >
                {categoriesList
                  .filter((category) => !category.parentCategory)
                  .map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item name="categories" label="Sub Category" rules={rules.categories}>
              <Select
                style={{ width: "100%" }}
                mode="multiple"
                placeholder={selectedLanguage ? "Sub Category" : "Please select language first"}
                disabled={props.view || !selectedLanguage}
                onChange={handleSubCategoryChange}
              >
                {subCategories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* <Form.Item name="subSubCategories" label="Sub-Sub Category (Final Selection)" rules={rules.subSubCategories}>
              <Select
                style={{ width: "100%" }}
                mode="multiple"
                placeholder={
                  selectedSubCategories.length > 0 
                    ? "Select Sub-Sub Category (This will be the final category)" 
                    : "Please select sub categories first"
                }
                disabled={props.view || selectedSubCategories.length === 0}
                onChange={handleSubSubCategoryChange}
              >
                {subSubCategories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item> */}

            {/* Hidden field to store the final parent category for form submission */}
            <Form.Item name="finalParentCategory" style={{ display: 'none' }}>
              <Input type="hidden" />
            </Form.Item>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneralField;