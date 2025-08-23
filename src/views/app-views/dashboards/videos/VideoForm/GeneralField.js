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
import { fetchAllCategoriesByPostType } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { AUTH_TOKEN } from "constants/AuthConstant";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  title: [
    {
      required: true,
      message: "Please enter video title",
    },
  ],
  sub_title: [
    {
      required: false,
      message: "Please enter video sub title",
    },
  ],
  short_desc: [
    {
      required: false,
      message: "Please enter video short description",
    },
  ],
  content: [
    {
      required: true,
      message: "Please enter video content",
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
  thumbnail: [
    {
      required: true,
      message: "Please upload thumbnail horizontal image",
    },
  ],
};

const thumbnailUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/videos/videofiles",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

// For more images
const moreImagesUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/videos/moreimages",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

// For thumbnail image
const thumbnailImageUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/videos/thumbnails",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

const beforeUploadVideo = (file) => {
  const acceptedFormats = ["video/mp4", "video/mpeg", "video/quicktime"]; // Add more formats if needed
  if (acceptedFormats.indexOf(file.type) === -1) {
    message.error(
      "You can only upload video files in MP4, MPEG, or QuickTime formats!"
    );
  }

  const isLt100M = file.size / 1024 / 1024 < 100; // Adjust the size limit as needed (100MB in this example)
  if (!isLt100M) {
    message.error("Video must be smaller than 100MB!");
  }

  return acceptedFormats.indexOf(file.type) !== -1 && isLt100M;
};
// const beforeUploadVideo = (file) => {
//   const acceptedFormats = ["video/mp4", "video/webm"];
//   if (!acceptedFormats.includes(file.type)) {
//     message.error("You can only upload MP4 or WebM video files!");
//     return Upload.LIST_IGNORE;
//   }

//   const isLt20M = file.size / 1024 / 1024 < 20; // safer cap
//   if (!isLt20M) {
//     message.error("Video must be smaller than 20MB!");
//     return Upload.LIST_IGNORE;
//   }

//   return true;
// };

const beforeUploadMoreImages = (file) => {
  const isPngOrWebp = file.type === "image/png" || file.type === "image/webp";
  if (!isPngOrWebp) {
    message.error("You can only upload PNG or WebP files!");
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Image must be smaller than 1MB!");
  }
  return isPngOrWebp && isLt1M;
};

const beforeUploadThumbnail = (file) => {
  const isPngOrWebp = file.type === "image/png" || file.type === "image/webp";
  if (!isPngOrWebp) {
    message.error("You can only upload PNG or WebP files!");
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Thumbnail must be smaller than 1MB!");
  }
  return isPngOrWebp && isLt1M;
};

const GeneralField = (props) => {
  const dispatch = useDispatch();

  const video_categories = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const languages = useSelector((state) => state.languages.languages);

  const [subCategories, setSubCategories] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Filter categories based on selected language
  useEffect(() => {
    if (selectedLanguage && video_categories.length > 0) {
      const filtered = video_categories.filter(
        (category) =>
          category.language && category.language._id === selectedLanguage
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [selectedLanguage, video_categories]);

  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
    // Clear parent category and subcategories when language changes
    if (props.form) {
      props.form.setFieldsValue({
        ParentCategory: undefined,
        categories: undefined,
      });
    }
    setSubCategories([]);
  };

  const handleParentCategoryChange = (value) => {
    const filteredSubCategories = filteredCategories.filter(
      (category) =>
        category.parentCategory && category.parentCategory.id === value
    );
    setSubCategories(filteredSubCategories);
  };

  useEffect(() => {
    if (props?.currentparentcategory) {
      const defaultParentCategory = props.currentparentcategory?.[0];
      handleParentCategoryChange(defaultParentCategory);
    }
  }, [props.currentparentcategory, filteredCategories]);

  useEffect(() => {
    dispatch(
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1314" })
    );
  }, [dispatch]);

  const [categoriesList, setCategoriesList] = useState(video_categories);

  useEffect(() => {
    setCategoriesList(filteredCategories);
  }, [filteredCategories]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={17}>
          <Card>
            <Form.Item name="title" label="Video Title" rules={rules.title}>
              <Input placeholder="Video Title" disabled={props.view} />
            </Form.Item>
            <Form.Item
              name="sub_title"
              label="Video sub Title"
              rules={rules.sub_title}
            >
              <Input placeholder="Video Sub Title" disabled={props.view} />
            </Form.Item>
            <Form.Item
              name="short_desc"
              label="Video short description"
              rules={rules.short_desc}
            >
              <Input.TextArea
                rows={2}
                placeholder="Video short description"
                disabled={props.view}
              />
            </Form.Item>
            {/* <Form.Item name="content" label="Content" rules={rules.content}>
              <Input.TextArea rows={8} disabled={props.view} />
            </Form.Item> */}
            {/*  */}
            <div
              className={`editor-container ${isFullscreen ? "fullscreen" : ""}`}
            >
              <button onClick={toggleFullscreen}>
                {isFullscreen ? "X" : <ArrowsAltOutlined />}
              </button>
              {props.children}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={7}>
          <Card title="Video file">
            <Upload
              {...thumbnailUploadProps}
              beforeUpload={beforeUploadVideo}
              onChange={(e) => props.handleThumbnailImgUploadChange(e)}
              showUploadList={false} // Hide the upload list if needed
              disabled={props.view}
            >
              <div className="upload-container">
                {props.uploadedThumbnailImg ? (
                  <video
                    controls
                    className="uploaded-video"
                    style={{ width: "100px" }}
                  >
                    <source src={props.uploadedThumbnailImg} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="upload-placeholder">
                    {props.uploadThumbnailImgLoading ? (
                      <div>
                        <LoadingOutlined className="font-size-xxl text-primary" />
                        <div className="mt-3">Uploading</div>
                      </div>
                    ) : (
                      <div>
                        <CustomIcon className="display-3" svg={ImageSvg} />
                        <p>Click or drag video file to upload</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Upload>
          </Card>

          <Card title="Thumbnail horizontal">
            <Form.Item name="thumbnail" rules={rules.thumbnail}>
              <Upload
                {...thumbnailImageUploadProps}
                beforeUpload={beforeUploadThumbnail}
                onChange={(e) => props.handleThumbnailImageUploadChange(e)}
                showUploadList={false}
                disabled={props.view}
              >
                <div className="upload-container">
                  {props.uploadedThumbnailImage ? (
                    <img
                      src={props.uploadedThumbnailImage}
                      alt="Thumbnail"
                      className="img-fluid"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div className="upload-placeholder">
                      {props.uploadThumbnailImageLoading ? (
                        <div>
                          <LoadingOutlined className="font-size-xxl text-primary" />
                          <div className="mt-3">Uploading</div>
                        </div>
                      ) : (
                        <div>
                          <CustomIcon className="display-3" svg={ImageSvg} />
                          <p>Click or drag thumbnail image to upload</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Upload>
            </Form.Item>
          </Card>

          <Card title="Thumbnail vertical">
            <Upload
              {...moreImagesUploadProps}
              beforeUpload={beforeUploadMoreImages}
              onChange={(e) => props.handleUploadMoreImagesChange(e)}
              disabled={props.view}
            >
              {props.uploadedMoreImgs ? (
                <img
                  src={props.uploadedMoreImgs}
                  alt="Additional thumbnail"
                  className="img-fluid"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                  }}
                />
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
                      <p>Click or drag file to upload</p>
                    </div>
                  )}
                </div>
              )}
            </Upload>
          </Card>

          {/* <Card>
            {props.uploadedMoreImgs ? (
              <Button
                type="primary"
                onClick={props.handleClearSelectedMoreImages}
              >
                Clear More Image
              </Button>
            ) : (
              ""
            )}
          </Card> */}

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
            <Form.Item
              name="ParentCategory"
              label="Parent Category"
              rules={rules.ParentCategory}
            >
              <Select
                style={{ width: "100%" }}
                placeholder={
                  selectedLanguage
                    ? "Parent Category"
                    : "Please select language first"
                }
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
            <Form.Item
              name="categories"
              label="Sub Category"
              rules={rules.categories}
            >
              <Select
                style={{ width: "100%" }}
                mode="multiple"
                placeholder={
                  selectedLanguage
                    ? "Sub Category"
                    : "Please select language first"
                }
                disabled={props.view || !selectedLanguage}
              >
                {subCategories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GeneralField;
