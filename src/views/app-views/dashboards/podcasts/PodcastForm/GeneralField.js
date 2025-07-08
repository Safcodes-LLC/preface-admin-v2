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
      message: "Please enter podcast title",
    },
  ],
  sub_title: [
    {
      required: true,
      message: "Please enter podcast sub title",
    },
  ],
  short_desc: [
    {
      required: true,
      message: "Please enter podcast short description",
    },
  ],
  content: [
    {
      required: true,
      message: "Please enter podcast content",
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
};

const thumbnailUploadProps = {
  name: "file",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  action:
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/podcasts/audiofiles",
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
    "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/podcasts/moreimages",
  headers: {
    Authorization: localStorage.getItem(AUTH_TOKEN) || null,
  },
};

const beforeUploadAudio = (file) => {
  const allowedAudioFormats = ["audio/mpeg", "audio/wav", "audio/mp3"]; // Add more formats if needed
  const isAudioFormatAllowed = allowedAudioFormats.includes(file.type);

  if (!isAudioFormatAllowed) {
    message.error(
      "You can only upload audio files in MP3, WAV, or MPEG format!"
    );
  }

  const isLt5M = file.size / 1024 / 1024 < 5; // Adjust the size limit as needed
  if (!isLt5M) {
    message.error("Audio file must be smaller than 5MB!");
  }

  return isAudioFormatAllowed && isLt5M;
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

  const podcast_categories = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const languages = useSelector((state) => state.languages.languages);

  const [subCategories, setSubCategories] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Filter categories based on selected language
  useEffect(() => {
    if (selectedLanguage && podcast_categories.length > 0) {
      const filtered = podcast_categories.filter(
        (category) => category.language && category.language._id === selectedLanguage
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [selectedLanguage, podcast_categories]);

  const handleLanguageChange = (value) => {
    setSelectedLanguage(value);
    // Clear parent category and subcategories when language changes
    if (props.form) {
      props.form.setFieldsValue({
        ParentCategory: undefined,
        categories: undefined
      });
    }
    setSubCategories([]);
  };

  const handleParentCategoryChange = (value) => {
    const filteredSubCategories = filteredCategories.filter(
      (category) => category.parentCategory && category.parentCategory.id === value
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
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1313" })
    );
  }, [dispatch]);

  const [categoriesList, setCategoriesList] =
    useState(podcast_categories);

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
    <Row gutter={16}>
      <Col xs={24} sm={24} md={17}>
        <Card>
          <Form.Item name="title" label="Podcast Title" rules={rules.title}>
            <Input placeholder="Podcast Title" disabled={props.view} />
          </Form.Item>
          <Form.Item
            name="sub_title"
            label="Podcast sub Title"
            rules={rules.sub_title}
          >
            <Input placeholder="Podcast Sub Title" disabled={props.view} />
          </Form.Item>
          <Form.Item
            name="short_desc"
            label="Podcast short description"
            rules={rules.short_desc}
          >
            <Input.TextArea
              rows={2}
              placeholder="Podcast short description"
              disabled={props.view}
            />
          </Form.Item>
           {/* <Form.Item name="content" label="Content" rules={rules.content}>
              <Input.TextArea rows={8} disabled={props.view} />
            </Form.Item>
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
        <Card title="Podcast Audio file">
          {/* <Dragger {...thumbnailUploadProps} beforeUpload={beforeUpload} onChange={e=> props.handleThumbnailImgUploadChange(e)}>
						{
							props.uploadedThumbnailImg ? 
							<img src={props.uploadedThumbnailImg} alt="avatar" className="img-fluid" /> 
							: 
							<div>
								{
									props.uploadThumbnailImgLoading ? 
									<div>
										<LoadingOutlined className="font-size-xxl text-primary"/>
										<div className="mt-3">Uploading</div>
									</div> 
									: 
									<div>
										<CustomIcon className="display-3" svg={ImageSvg}/>
										<p>Click or drag file to upload</p>
									</div>
								}
							</div>
						}
					</Dragger> */}

          <Upload.Dragger
            {...thumbnailUploadProps}
            beforeUpload={beforeUploadAudio}
            onChange={(e) => props.handleThumbnailImgUploadChange(e)}
            disabled={props.view}
          >
            {props.uploadedThumbnailImg ? (
              <audio controls>
                <source src={props.uploadedThumbnailImg} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
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
                    <p>Click or drag an audio file to upload</p>
                  </div>
                )}
              </div>
            )}
          </Upload.Dragger>
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
  );
};

export default GeneralField;
