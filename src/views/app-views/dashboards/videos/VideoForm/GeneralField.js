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
      required: true,
      message: "Please enter video sub title",
    },
  ],
  short_desc: [
    {
      required: true,
      message: "Please enter video short description",
    },
  ],
  content: [
    {
      required: true,
      message: "Please enter video content",
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
  multiple: true,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/videos/moreimages",
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

const beforeUploadMoreImages = (file) => {
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

  const video_categories = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const languages = useSelector((state) => state.languages.languages);

  useEffect(() => {
    dispatch(
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1314" })
    );
  }, [dispatch]);

  const [videoCategoriesList, setVideoCategoriesList] =
    useState(video_categories);

  useEffect(() => {
    setVideoCategoriesList(video_categories);
  }, [video_categories]);

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

          <Card title="More Images">
            <Dragger
              {...moreImagesUploadProps}
              beforeUpload={beforeUploadMoreImages}
              onChange={(e) => props.handleUploadMoreImagesChange(e)}
              disabled={props.view}
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
            <Form.Item name="language" label="Language">
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
                {videoCategoriesList.map((category) => (
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
