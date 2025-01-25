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

  const article_categories = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const languages = useSelector((state) => state.languages.languages);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    dispatch(
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1312" })
    );
  }, [dispatch]);

  const [articleCategoriesList, setArticleCategoriesList] =
    useState(article_categories);

  useEffect(() => {
    setArticleCategoriesList(article_categories);
  }, [article_categories]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

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
            {/* <Form.Item name="content" label="Content" rules={rules.content}>
              <Input.TextArea rows={8} />
            </Form.Item> */}

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
                      <div className="mt-3">Uploading if</div>
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
              >
                {languages.map((language) => (
                  <Option key={language._id} value={language._id}>
                    {language.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="categories" label="Categories">
              <Select
                mode="multiple"
                style={{ width: "100%" }}
                placeholder="Categories"
                disabled={props.view}
              >
                {articleCategoriesList.map((category) => (
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
