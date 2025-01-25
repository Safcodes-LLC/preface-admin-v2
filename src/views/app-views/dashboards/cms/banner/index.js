import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Dropdown,
  Menu,
  Tag,
  message,
  Form,
  Modal,
  Input as AntInput,
  Switch,
  Col,
  Select,
  Row,
} from "antd";
import ArticleListData from "assets/data/article-list.data.json";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  EditOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import TextArea from "antd/es/input/TextArea";
import Dragger from "antd/es/upload/Dragger";
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";
import { Option } from "antd/es/mentions";

const Banner = () => {
  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
  const [form] = Form.useForm(); // Ant Design form instance

  const navigate = useNavigate();
  const allArticlePosts = useSelector((state) => state.post.posts);
  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(null); // To track the highlighted row
  const [fileList, setFileList] = useState([]); // State to handle file uploads
  const [previewImage, setPreviewImage] = useState(""); // To store the preview image URL
  const [bannerData, setBannerData] = useState(""); // To store the preview image URL
  const [editingBanner, setEditingBanner] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  // console.log(categories, "categories list data");
  // console.log(authors, "author list data");

  useEffect(() => {
    // Dispatch the action to fetch Article posts
    dispatch(
      fetchAllPostsByPostType({ postTypeId: "66d9d564987787d3e3ff1312" })
    );
  }, [dispatch]);

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
          setBannerData(banners);

          // Set the highlighted index based on the featured status
          const featuredIndex = banners.findIndex(
            (item) => item.featured === true
          );
          if (featuredIndex !== -1) {
            setHighlightedIndex(featuredIndex);
          }
        }
      } catch (error) {
        console.error("Error fetching the data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (bannerData) {
      setList(bannerData);
    }
  }, [bannerData]);

  //category
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/frontend/category-list`
        );
        // Preserve category objects with `_id` and `name`
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchCategories();
  }, []);

  //authors
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(
          `${API_BASE_URL}/frontend/all-authors`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token, // Pass the token directly without 'Bearer'
            },
          }
        );
        // Preserve author objects with `_id` and `username`
        setAuthors(response.data.data);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchAuthors();
  }, []);
  // console.log(authors, "author hj");

  const dropdownMenu = (row) => (
    <Menu>
      {/* <Menu.Item onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
        </Flex>
      </Menu.Item> */}
      <Menu.Item onClick={() => editDetails(row)}>
        <Flex alignItems="center">
          <EditOutlined />
          <span className="ml-2">Edit Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item onClick={() => deleteRow(row)}>
        <Flex alignItems="center">
          <DeleteOutlined />
          <span className="ml-2">
            {selectedRows.length > 0
              ? `Delete (${selectedRows.length})`
              : "Delete"}
          </span>
        </Flex>
      </Menu.Item>
    </Menu>
  );

  // Function to handle opening the modal
  const AddArticle = () => {
    setIsModalVisible(true); // Show the modal
  };

  // Function to handle submitting the form
  const handleOk = () => {
    form.validateFields().then(async (values) => {
      console.log("Form values:", values);
      console.log("Uploaded file:", fileList); // Handle file list

      // Prepare form data
      const formData = {
        title: values.title,
        description: values.shortdescription,
        url: values.readmore,
        photo: fileList.length > 0 ? fileList[0].originFileObj : null, // Add the image file if available
        author: values.author, // Selected author ID
        category: values.category, // Selected category ID
      };

      const token = localStorage.getItem("auth_token"); // Get the token from local storage

      const apiUrl = editingBanner
        ? `${API_BASE_URL}/banner/update/${editingBanner._id}`
        : `${API_BASE_URL}/banner/create`;

      try {
        const formDataWithFile = new FormData(); // Using FormData to handle file upload
        formDataWithFile.append("title", formData.title);
        formDataWithFile.append("description", formData.description);
        formDataWithFile.append("url", formData.url);
        formDataWithFile.append("author", formData.author); // Include author ID
        formDataWithFile.append("category", formData.category); // Include category ID
        if (formData.photo) {
          formDataWithFile.append("photo", formData.photo); // Attach the image file if present
        }

        const method = editingBanner ? "PUT" : "POST";
        const response = await fetch(apiUrl, {
          method,
          headers: {
            Authorization: token, // Pass the token directly
          },
          body: formDataWithFile, // Send the formData with the file
        });

        const result = await response.json();

        if (result.status === "success") {
          message.success(
            `Banner ${editingBanner ? "updated" : "created"} successfully!`
          );
          // You can optionally close the modal or reset the form here
          setIsModalVisible(false); // Close modal
          form.resetFields(); // Reset form
          window.location.reload();
        } else {
          // Check if the specific error message is returned
          if (result.message === "Cannot create more than 4 banners") {
            message.error(
              "You cannot create more than 4 banners. Please delete an existing one to continue."
            );
          } else {
            message.error("Failed to create banner. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error during request:", error);
        message.error("An error occurred while submitting the banner.");
      }
    });
  };

  // Function to handle closing the modal
  const handleCancel = () => {
    setIsModalVisible(false); // Hide the modal
    setEditingBanner(null); // Reset edit state on cancel
    form.resetFields(); // Reset form fields
    setPreviewImage(""); // Clear preview image
  };

  // Handle file change
  const onFileChange = ({ fileList }) => {
    // Check if the user tries to upload more than one image
    if (fileList?.length > 1) {
      message.error("You can only upload one image");
      return; // Prevent further execution
    }

    setFileList(fileList); // Update the file list

    // Generate a preview for the uploaded image
    if (fileList && fileList?.length > 0) {
      const file = fileList[0].originFileObj;

      // Read the file as a data URL (Base64) to preview it
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result); // Set the preview image
      };
      reader.readAsDataURL(file); // Convert file to Base64 string
    }
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/cms/banner/edit-banner/${row._id}`);
  };

  const deleteRow = async (row) => {
    const bannerId = row._id; // Extract the ID dynamically from the row
    const token = localStorage.getItem("auth_token"); // Retrieve token for authorization

    try {
      // Call the DELETE API with the dynamic ID
      const response = await fetch(
        `${API_BASE_URL}/banner/delete/${bannerId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: token, // Use token directly for authorization
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        message.success("Banner deleted successfully!");
        // Update the state to remove the deleted banner from the list
        const updatedList = list.filter((item) => item._id !== bannerId);
        setList(updatedList);
      } else {
        message.error("Failed to delete banner. Please try again.");
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      message.error("An error occurred while deleting the banner.");
    }
  };

  // Function to handle toggling the featured status
  const toggleFeatured = async (bannerId, isFeatured) => {
    const token = localStorage.getItem("auth_token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/banner/${bannerId}/toggle-featured`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ featured: isFeatured }),
        }
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        message.success("Banner status updated successfully!");

        // Update list state to reflect the change in featured status
        setList((prevList) =>
          prevList.map((item) =>
            item._id === bannerId ? { ...item, featured: isFeatured } : item
          )
        );

        // Ensure the highlighted index is updated on the UI
        if (isFeatured) {
          const index = list.findIndex((item) => item._id === bannerId);
          setHighlightedIndex(index);
        } else {
          setHighlightedIndex(null);
        }
      } else {
        message.error("Failed to update banner status. Please try again.");
      }
    } catch (error) {
      console.error("Error during the PUT request:", error);
      message.error("An error occurred while updating the banner status.");
    }
  };

  // Modify the highlightRow function to include API call
  const highlightRow = (index, bannerId) => {
    const newFeaturedState = highlightedIndex !== index; // Determine the new state
    setHighlightedIndex(newFeaturedState ? index : null); // Update highlightedIndex for UI
    toggleFeatured(bannerId, newFeaturedState); // Call the API with the new state
  };

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    {
      title: "Title",
      dataIndex: "title",
    },
    {
      title: "Image",
      dataIndex: "author",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={`${record?.photo}` || "/img/avatars/default-avatar.jpg"}
            // name={record?.author?.username}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (_, record) => record?.description,
    },
    {
      title: "URL",
      dataIndex: "url",
      render: (_, record) => record?.url,
    },
    {
      title: "Highlight",
      dataIndex: "highlight",
      render: (_, record, index) => (
        <Switch
          checked={highlightedIndex === index}
          onChange={() => highlightRow(index, record._id)} // Pass the banner ID dynamically
          disabled={false} // Allow toggling
        />
      ),
    },
    {
      title: "",
      dataIndex: "actions",
      render: (_, elm) => (
        <div className="text-right">
          <EllipsisDropdown menu={dropdownMenu(elm)} />
        </div>
      ),
    },
  ];

  // const rowSelection = {
  //   onChange: (key, rows) => {
  //     setSelectedRows(rows);
  //     setSelectedRowKeys(key);
  //   },
  // };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    const searchArray = e.currentTarget.value ? list : ArticleListData;
    const data = utils.wildCardSearch(searchArray, value);
    setList(data);
    setSelectedRowKeys([]);
  };

  return (
    <Card>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mobileFlex={false}
      >
        <Flex className="mb-1" mobileFlex={false}>
          <div className="mr-md-3 mb-3">
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              onChange={(e) => onSearch(e)}
            />
          </div>
        </Flex>
        <div>
          <Button
            onClick={AddArticle}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add Banner
          </Button>
        </div>
      </Flex>

      {/* Modal for Adding Article */}
      <Modal
        title="Add Home Page Banner"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Submit"
        cancelText="Cancel"
        width={"80%"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: false, message: "Please input the title!" }]}
          >
            <AntInput placeholder="Enter title" />
          </Form.Item>
          <Row gutter={[5, 1]}>
            {/* author dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                label="Author"
                name="author"
                // rules={[{ required: true, message: "Select an author!" }]}
              >
                <Select
                  // onChange={}
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
              {
                required: false,
                message: "Please input the Short Description!",
              },
            ]}
          >
            <TextArea
              // value={value}
              // onChange={(e) => setValue(e.target.value)}
              placeholder="Short Description"
              autoSize={{
                minRows: 3,
                maxRows: 5,
              }}
            />
          </Form.Item>
          <Form.Item
            name="readmore"
            label="URL (Read More)"
            rules={[{ required: false, message: "Please input the url!" }]}
          >
            <AntInput placeholder="Enter url" />
          </Form.Item>

          {/* File Upload */}
          <Form.Item name="upload" label="Upload Image">
            <Dragger
              fileList={fileList}
              onChange={onFileChange}
              multiple={false}
              beforeUpload={() => false} // Prevent automatic upload
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
                  <p className="ant-upload-text">
                    Click or drag file to upload
                  </p>
                  <p className="ant-upload-hint">
                    Upload an image for the banner.
                  </p>
                </div>
              )}
            </Dragger>
          </Form.Item>
          {/* Add other form fields as needed */}
        </Form>
      </Modal>

      <div className="table-responsive">
        <Table
          columns={tableColumns}
          dataSource={list}
          rowKey="id"
          // rowSelection={{
          //   selectedRowKeys: selectedRowKeys,
          //   type: "checkbox",
          //   preserveSelectedRowKeys: false,
          //   ...rowSelection,
          // }}
        />
      </div>
    </Card>
  );
};

export default Banner;
