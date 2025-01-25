import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Upload, Col, Select, Row } from "antd";
import TextArea from "antd/es/input/TextArea";
import Dragger from "antd/es/upload/Dragger";
import { UploadOutlined } from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";
import { Option } from "antd/es/mentions";

const EditBanner = () => {
  const [form] = Form.useForm();
  const [bannerData, setBannerData] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  // console.log(id, " banner id");
  // console.log(bannerData?.title, "banner adta");

  //   useEffect(() => {
  //     // Fetch the banner data based on ID
  //     const fetchBanner = async () => {
  //       try {
  //         const token = localStorage.getItem("auth_token");
  //         const response = await axios.get(`${API_BASE_URL}/banner/${id}`, {
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: token,
  //           },
  //         });

  //         if (response?.data?.status === "success") {
  //           setBannerData(response.data.data);
  //           form.setFieldsValue({
  //             title: response.data.data.title,
  //             shortdescription: response.data.data.description,
  //             readmore: response.data.data.url,
  //           });

  //           // Set preview image if available
  //           if (response.data.data.photo) {
  //             setPreviewImage(
  //               `https://king-prawn-app-x9z27.ondigitalocean.app/${response.data.data.photo}`
  //             );
  //           }
  //         }
  //       } catch (error) {
  //         console.error("Error fetching banner data:", error);
  //         message.error("Failed to fetch banner data.");
  //       }
  //     };

  //     fetchBanner();
  //   }, [id, form]);

  // Fetch categories and authors
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/frontend/category-list`
        );
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    const fetchAuthors = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(
          `${API_BASE_URL}/frontend/all-authors`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );
        setAuthors(response.data.data);
      } catch (error) {
        console.error("Error fetching author list:", error);
      }
    };

    fetchCategories();
    fetchAuthors();
  }, []);

  // Fetch banner data based on ID
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(`${API_BASE_URL}/banner/all`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });

        if (response?.data?.status === "success") {
          const banners = response.data.data;
          const filteredBanner = banners?.find((data) => data._id === id);
          // console.log(filteredBanner);

          // Set default values in the form
          if (filteredBanner) {
            setBannerData(filteredBanner);

            // Set default values in the form
            form.setFieldsValue({
              title: filteredBanner.title,
              shortdescription: filteredBanner.description,
              readmore: filteredBanner.url,
              author: filteredBanner.author?._id, // Ensure it matches dropdown values
              category: filteredBanner.category.map((item) => item._id), // Ensure it matches dropdown values
            });

            // Set the preview image if available
            if (filteredBanner?.photo) {
              setPreviewImage(
                `https://king-prawn-app-x9z27.ondigitalocean.app/${filteredBanner.photo}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching the data:", error);
      }
    };

    fetchData();
  }, [id, form]); // Added 'form' as dependency to re-run on form change
  //   console.log(bannerData.filter(),"banner data");

  const onFileChange = ({ fileList }) => {
    if (fileList.length > 1) {
      message.error("You can only upload one image");
      return;
    }
    setFileList(fileList);

    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async () => {
    form.validateFields().then(async (values) => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.shortdescription);
      formData.append("url", values.readmore);
      formData.append("author", values.author);
      formData.append("category", values.category);
      if (fileList.length > 0) {
        formData.append("photo", fileList[0].originFileObj);
      }

      const token = localStorage.getItem("auth_token");
      try {
        const response = await axios.put(
          `${API_BASE_URL}/banner/update/${id}`,
          formData,
          {
            headers: {
              Authorization: token,
            },
          }
        );

        if (response.data.status === "success") {
          message.success("Banner updated successfully!");
          navigate("/admin/dashboards/cms/banner");
        } else {
          message.error("Failed to update banner. Please try again.");
        }
      } catch (error) {
        console.error("Error updating the banner:", error);
        message.error("An error occurred while updating the banner.");
      }
    });
  };

  return (
    <div>
      <h2>Edit Banner</h2>
      <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please input the title!" }]}
        >
          <Input placeholder="Enter title" />
        </Form.Item>
        <Row gutter={[5, 1]}>
          {/* author dropdown */}
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="Author"
              name="author"
              rules={[{ required: true, message: "Select an author!" }]}
            >
              <Select
                onChange={(value) => form.setFieldValue("author", value)} // Set the selected author ID in the form
                placeholder="Select an Author"
              >
                {authors.map((author) => (
                  <Option key={author._id} value={author._id}>
                    {/* Use author._id as the value */}
                    {author.username} {/* Display username */}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* category dropdown */}
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              label="Category"
              name="category"
              // rules={[{ required: true, message: "Select a category!" }]}
              // style={{}}
            >
              <Select
                // onChange={}
                onChange={(value) => form.setFieldValue("category", value)} // Set the selected category ID in the form
                placeholder="Select a Category"
              >
                {categories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {/* Use category._id as the value */}
                    {category.name} {/* Display category name */}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="shortdescription"
          label="Short Description"
          rules={[
            { required: true, message: "Please input the short description!" },
          ]}
        >
          <TextArea
            placeholder="Short Description"
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <Form.Item
          name="readmore"
          label="URL (Read More)"
          rules={[{ required: true, message: "Please input the URL!" }]}
        >
          <Input placeholder="Enter URL" />
        </Form.Item>
        <Form.Item name="upload" label="Upload Image">
          <Dragger
            fileList={fileList}
            onChange={onFileChange}
            multiple={false}
            beforeUpload={() => false}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt="Uploaded Banner"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div>
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to upload</p>
              </div>
            )}
          </Dragger>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Update Banner
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditBanner;
