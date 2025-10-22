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
import { LoadingOutlined } from "@ant-design/icons";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllLanguages } from "store/slices/languagesSlice"; 
import axios from "axios";

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
  title: [{ required: true, message: "Please enter title" }],
  link: [{ required: true, message: "Please enter link URL" }],
  content: [{ required: true, message: "Please enter content" }],
  language: [{ required: true, message: "Please select language" }],
  featured_image: [{ required: true, message: "Please upload featured image" }],
  startDate: [{ required: true, message: "Please select start date" }],
  endDate: [{ required: true, message: "Please select end date" }],
  // status is optional in UI; will default to server or a safe value on submit
};

const featuredUploadProps = {
  name: "featured_image",
  multiple: false,
  listType: "picture-card",
  showUploadList: false,
  accept: "image/png,image/webp",
};

const beforeUpload = (file) => {
  const isPngOrWebp = file.type === "image/png" || file.type === "image/webp";
  if (!isPngOrWebp) {
    message.error("You can only upload PNG or WebP files!");
    return Upload.LIST_IGNORE;
  }
  const isLt1M = file.size / 1024 / 1024 < 1;
  if (!isLt1M) {
    message.error("Image must be smaller than 1MB!");
    return Upload.LIST_IGNORE;
  }
  // Prevent auto-upload; we'll handle file in onChange and submit via FormData
  return false;
};

const CustomFeaturedForm = (props) => {
  const viewModeProp = props?.view || false;
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const languages = useSelector((state) => state.languages.languages);
 
  // Keep selected language id for submission and separate code for fetching
  const [selectedLanguage, setSelectedLanguage] = useState(null); // language _id for POST
  const [selectedLanguageCode, setSelectedLanguageCode] = useState("en"); // language code for GET
  const [uploadedFeaturedImg, setUploadedFeaturedImg] = useState(""); // preview URL (object URL or remote URL)
  const [featuredFile, setFeaturedFile] = useState(null); // actual File for submit
  const [uploadFeaturedImgLoading, setUploadFeaturedImgLoading] =
    useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Removed fullscreen toggle button per request

  useEffect(() => {
    if (!languages.length) dispatch(fetchAllLanguages());
  }, [dispatch, languages.length]);

  // Auto-load existing data when language is selected (uses language CODE in GET)
  useEffect(() => {
    const load = async () => {
      if (!selectedLanguageCode) return;
      try {
        const token = localStorage.getItem("auth_token");
        const res = await axios.get(
          `https://king-prawn-app-x9z27.ondigitalocean.app/api/featured/all?lang=${selectedLanguageCode}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );
        const data = Array.isArray(res?.data?.data)
          ? res.data.data[0]
          : res?.data?.data || {};
        if (data) {
          const langId = data.language?._id || data.language;
          const langObj = languages.find(
            (l) => l._id === langId || l.code === data.language
          );
          if (langObj) {
            setSelectedLanguage(langObj._id);
            setSelectedLanguageCode(langObj.code || "");
          }
          form.setFieldsValue({
            title: data.title,
            link: data.link,
            content: data.content,
            language: langObj?._id || langId,
            featured_image: data.featured_image || data.featuredImage,
            startDate: data.startDate
              ? new Date(data.startDate).toISOString().slice(0, 10)
              : undefined,
            endDate: data.endDate
              ? new Date(data.endDate).toISOString().slice(0, 10)
              : undefined,
            status: data.status || undefined,
          });
          setUploadedFeaturedImg(
            data.featured_image || data.featuredImage || ""
          );
        }
      } catch (e) {
        message.error(
          e?.response?.data?.message || "Failed to load featured article"
        );
      }
    };
    load();
  }, [selectedLanguageCode, languages, form]);

  const handleFeaturedImgUploadChange = (info) => {
    const file = info?.file?.originFileObj || info?.file;
    if (!file) return;
    setUploadFeaturedImgLoading(true);
    setFeaturedFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedFeaturedImg(previewUrl);
    form.setFieldsValue({ featured_image: file.name });
    setUploadFeaturedImgLoading(false);
  };

  const handleDeactivate = async () => {
    try {
      setDeactivating(true);
      const token = localStorage.getItem("auth_token");
      const values = await form.validateFields();
      console.log(values);
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("link", values.link);
      formData.append(
        "content",
        typeof values.content === "string"
          ? values.content
          : JSON.stringify(values.content)
      );
      formData.append("language", selectedLanguage);
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);
      formData.append("status", "Deactivated");
      await axios.post(
        `https://king-prawn-app-x9z27.ondigitalocean.app/api/featured/create-featured-article`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      form.setFieldsValue({ status: "Deactivated" });
      message.success("Featured article deactivated");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to submit";
      message.error(msg);
    }
    finally {
      setDeactivating(false);
    }
  };

  const submitFeaturedArticle = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const values = await form.validateFields();
      console.log(values);
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("link", values.link);
      formData.append(
        "content",
        typeof values.content === "string"
          ? values.content
          : JSON.stringify(values.content)
      );
      formData.append("language", selectedLanguage);
      formData.append("startDate", values.startDate);
      formData.append("endDate", values.endDate);
      // formData.append("status", values.status || "Deactivated");
      if (featuredFile) {
        formData.append("featured_image", featuredFile);
      }
      await axios.post(
        `https://king-prawn-app-x9z27.ondigitalocean.app/api/featured/create-featured-article`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      message.success("Featured article updated");
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to submit";
      message.error(msg);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={24} md={17}>
            <div style={{ display: "flex", gap: 8, paddingBottom: 16 }}>
              <div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Language"
                  disabled={viewModeProp}
                  onChange={(val) => {
                    setSelectedLanguage(val); // id for POST
                    const found = languages.find((l) => l._id === val);
                    setSelectedLanguageCode(found?.code || ""); // code for GET
                    form.setFieldsValue({ language: val }); // store id in form
                  }}
                  value={selectedLanguage || form.getFieldValue("language")}
                >
                  {languages.map((language) => (
                    <Option key={language._id} value={language._id}>
                      {language.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div style={{ display: "flex", gap: 12, marginLeft: "auto",alignItems:"center" }}>
                <p style={{margin: "auto", color: "black"}}>
                  Status: <span style={{color : form.getFieldValue("status") === "Active" ? "green" : form.getFieldValue("status") === "Upcoming" ? "blue" : form.getFieldValue("status") === "Expired" ? "gray" : "red" }}>{form.getFieldValue("status")}</span>
                </p>
                {form.getFieldValue("status") === "Active" ||
                form.getFieldValue("status") === "Upcoming" ? (
                  <Button
                    style={{
                      background: "#ffd9d9",
                      borderColor: "red",
                      color: "red",
                    }}
                    onClick={handleDeactivate}
                    loading={deactivating}
                    disabled={deactivating || viewModeProp}
                  >
                    Deactivate
                  </Button>
                ) : (
                  null
                )}
                <Button
                  type="primary"
                  onClick={submitFeaturedArticle}
                  disabled={viewModeProp}
                >
                  {form.getFieldValue("status") === "Deactivated" ? "Activate" : "Update"}
                </Button>
              </div>
            </div>
            <Card>
              <Form.Item name="title" label="Title" rules={rules.title}>
                <Input placeholder="Title" disabled={viewModeProp} />
              </Form.Item>
              <Form.Item name="link" label="Link" rules={rules.link}>
                <Input
                  placeholder="https://example.com"
                  disabled={viewModeProp}
                />
              </Form.Item>
              <Form.Item name="content" label="Content" rules={rules.content}>
                <Input.TextArea
                  rows={6}
                  placeholder="Enter content"
                  disabled={viewModeProp}
                />
              </Form.Item>
              {/* Hidden field to store featured_image for validation and submit */}
              <Form.Item name="featured_image" style={{ display: "none" }}>
                <Input type="hidden" />
              </Form.Item>
              <div className={`editor-container`}>
                {props.children}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={7}>
            <Card title="Featured Image">
              <Dragger
                disabled={viewModeProp}
                {...featuredUploadProps}
                beforeUpload={beforeUpload}
                onChange={handleFeaturedImgUploadChange}
              >
                {uploadedFeaturedImg ? (
                  <img
                    src={uploadedFeaturedImg}
                    alt="avatar"
                    className="img-fluid"
                  />
                ) : (
                  <div>
                    {uploadFeaturedImgLoading ? (
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
            <Card title="Schedule">
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={rules.startDate}
              >
                <Input type="date" disabled={viewModeProp} />
              </Form.Item>
              <Form.Item name="endDate" label="End Date" rules={rules.endDate}>
                <Input type="date" disabled={viewModeProp} />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CustomFeaturedForm;
