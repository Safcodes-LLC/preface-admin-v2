import React, { useEffect, useState } from "react";
import { Input, Row, Col, Card, Form, Upload, message, Select } from "antd";
import { ImageSvg } from "assets/svg/icon";
import CustomIcon from "components/util-components/CustomIcon";
import { LoadingOutlined, FilePdfOutlined } from "@ant-design/icons";
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
      message: "Please enter E-book title",
    },
  ],
  short_desc: [
    {
      required: true,
      message: "Please enter E-book description",
    },
  ],
};

const thumbnailUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/ebooks/pdffiles",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

// Define the allowed file types for PDF and eBooks
const allowedFileTypes = [
  "application/pdf",
  "application/epub+zip",
  "application/x-mobipocket-ebook",
];

// Function to check if the file type is allowed
const beforeUploadPdfOrEbook = (file) => {
  const isAllowedFileType = allowedFileTypes.includes(file.type);

  if (!isAllowedFileType) {
    message.error("You can only upload PDF or eBook files!");
  }

  const isLt10M = file.size / 1024 / 1024 < 10; // Adjust the file size limit as needed

  if (!isLt10M) {
    message.error("File must be smaller than 10MB!");
  }

  return isAllowedFileType && isLt10M;
};

// Function to open the file in a new tab
const openFileInNewTab = (url) => {
  const newTab = window.open(url, "_blank");
  if (newTab) {
    newTab.focus();
  } else {
    message.error(
      "Popup blocking is preventing opening the file in a new tab."
    );
  }
};

const GeneralField = (props) => {
  const dispatch = useDispatch();

  const ebook_categories = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const languages = useSelector((state) => state.languages.languages);

  useEffect(() => {
    dispatch(
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1315" })
    );
  }, [dispatch]);

  const [ebookCategoriesList, setEbookCategoriesList] =
    useState(ebook_categories);

  useEffect(() => {
    setEbookCategoriesList(ebook_categories);
  }, [ebook_categories]);

  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  return (
    <Row gutter={16}>
      <Col xs={24} sm={24} md={17}>
        <Card>
          <Form.Item name="title" label="E-book Title" rules={rules.title}>
            <Input placeholder="E-book Title" disabled={props.view} />
          </Form.Item>
          <Form.Item
            name="short_desc"
            label="description"
            rules={rules.short_desc}
          >
            <Input.TextArea rows={8} disabled={props.view} />
          </Form.Item>
        </Card>
      </Col>
      <Col xs={24} sm={24} md={7}>
        <Card title="PDF file">
          <Upload
            {...thumbnailUploadProps}
            beforeUpload={beforeUploadPdfOrEbook}
            onChange={(e) => props.handleThumbnailImgUploadChange(e)}
            showUploadList={false} // Hide the upload list if needed
            disabled={props.view}
          >
            <div className="upload-container">
              {props.uploadedThumbnailImg ? (
                // Display the PDF or eBook preview as a clickable link
                <a
                  href={props.uploadedThumbnailImg}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => openFileInNewTab(props.uploadedThumbnailImg)}
                >
                  {props.uploadedThumbnailImg.toLowerCase().endsWith(".pdf") ? (
                    <div className="pdf-preview">
                      <FilePdfOutlined className="pdf-icon" />
                      <p>{props.uploadedThumbnailImg}</p>
                    </div>
                  ) : (
                    <video controls className="uploaded-video">
                      <source
                        src={props.uploadedThumbnailImg}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </a>
              ) : (
                <div>
                  {props.uploadThumbnailImgLoading ? (
                    <div>
                      <LoadingOutlined className="font-size-xxl text-primary" />
                      <div className="mt-3">Uploading</div>
                    </div>
                  ) : (
                    <div>
                      <FilePdfOutlined className="pdf-icon" />
                      <p>Click or drag PDF or eBook file to upload</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Upload>
          ;
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
              {ebookCategoriesList.map((category) => (
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
