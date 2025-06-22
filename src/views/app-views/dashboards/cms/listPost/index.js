import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Dropdown,
  Menu,
  Select,
  Space,
  Tag,
  message,
  Form,
  Modal,
  Input as AntInput,
  Row,
  Col,
  Grid,
  Switch,
  Checkbox,
} from "antd";
import ArticleListData from "assets/data/article-list.data.json";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { API_BASE_URL } from "configs/AppConfig";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate, useLocation } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import axios from "axios";

const ListPost = () => {
  const { Option } = Select;
  const dispatch = useDispatch();
  const [form] = Form.useForm(); // Ant Design form instance

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint(); // Get screen size information

  // Define label logic outside JSX
  let labelContent;
  if (screens.lg || screens.xl || screens.xxl) {
    labelContent = <span style={{ visibility: "hidden" }}>Filter</span>; // Hidden but space occupied
  } else if (screens.sm || screens.md) {
    labelContent = <span style={{ display: "none" }}>Filter</span>; // Completely hidden for smaller screens
  }

  // Get the current path
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop(); // Get the last part of the path
  const navigate = useNavigate();
  const allArticlePosts = useSelector((state) => state.post.posts);

  const [list, setList] = useState([]);
  const [allListData, setAllListData] = useState([]); // New state to store data conditionally
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  // State to manage selected values
  const [selectedAuthor, setSelectedAuthor] = useState(null); // Initialize with the first author
  const [selectedCategory, setSelectedCategory] = useState(null); // Initialize with the first category
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
  const [listMain, setListMain] = useState([]);
  const [featuredStatusChanges, setFeaturedStatusChanges] = useState({});
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(""); // State for title filter
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Store original dataset
  const isPrefaceToIslam = location.pathname.includes("preface-to-islam");
  // console.log(list,"list data");
  // console.log(allListData,"allListData data");
  // console.log(filteredData,"filteredData data");

  // Assuming you fetch this data from an API or some initial source
  const sourceData = isPrefaceToIslam ? allListData : allArticlePosts;

  useEffect(() => {
    setOriginalData(sourceData);
    setFilteredData(sourceData); // Initialize filtered data
  }, [sourceData]);

  useEffect(() => {
    if (allArticlePosts) {
      setList(allArticlePosts);
    }
  }, [allArticlePosts]);

  // useEffect(() => {
  //   console.log(location.pathname, "location"); // Log the current path

  //   if (location.pathname.includes("preface-to-islam")) {
  //     const fetchListPosts = async () => {
  //       try {
  //         const response = await axios.get(
  //           `${API_BASE_URL}/frontend/list-posts`
  //         );
  //         setAllListData(response.data.data.list);
  //       } catch (error) {
  //         console.error("Error fetching list posts:", error);
  //       }
  //     };

  //     fetchListPosts();
  //   }
  // }, [location.pathname]);

  //category
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/frontend/category-list`
        );
        setCategories(response.data.data.map((cat) => cat.name));
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
        setAuthors(response.data.data.map((author) => author.username));
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchAuthors();
  }, []);
  // console.log(authors, "author hj");
  
  useEffect(() => {
    const postTypeIdMapping = {
      // static data
      "popular-article": "66d9d564987787d3e3ff1312",
      "popular-podcast": "66d9d564987787d3e3ff1313",
      "popular-video": "66d9d564987787d3e3ff1314",
    };

    const postTypeId = Object.keys(postTypeIdMapping).find((key) =>
      location.pathname.includes(key)
    );

    if (postTypeId) {
      dispatch(
        fetchAllPostsByPostType({ postTypeId: postTypeIdMapping[postTypeId] })
      );
    }
  }, [dispatch, location.pathname]);

  // popup list data
  useEffect(() => {
    const postTypeIdMapping = {
      // static data
      "popular-article": "66d9d564987787d3e3ff1312",
      "popular-podcast": "66d9d564987787d3e3ff1313",
      "popular-video": "66d9d564987787d3e3ff1314",
    };

    // Determine the post type based on the current pathname
    const postTypeId = Object.keys(postTypeIdMapping).find((key) =>
      location.pathname.includes(key)
    );

    const fetchFeaturedPosts = async () => {
      if (!postTypeId) return; // Exit if no valid post type ID is found

      try {
        const token = localStorage.getItem("auth_token"); // Get the token from local storage
        const response = await axios.get(
          `${API_BASE_URL}/posts/featured/${postTypeIdMapping[postTypeId]}`, // Adjust URL based on post type ID
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token, // Pass the token directly without 'Bearer'
            },
          }
        );

        setListMain(response.data.data); // Store the data in state
      } catch (error) {
        console.error(error.message); // Optionally log the error message
      } finally {
        // Optional loading/error state handling
      }
    };

    fetchFeaturedPosts(); // Call the fetch function
  }, [location.pathname]); // Rerun when the pathname changes

  // const Author = ["salman", "ameen", "shahad", "rufaid"]; // Static data for first dropdown
  // const Category = ["QURAN", "HADEES", "RELIGION"]; // Static data for second dropdown

  // Function to format the current path
  const formatPath = (path) => {
    return path
      .split("-") // Split by hyphen
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(" "); // Join back with space
  };

  const dropdownMenu = (row) => (
    <Menu>
      <Menu.Item onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item onClick={() => deleteRow(row)}>
        {" "}
        {/* */}
        <Flex alignItems="center">
          <DeleteOutlined />
          <span className="ml-2">Remove</span>
        </Flex>
      </Menu.Item>
    </Menu>
  );

  // Function to handle opening the modal
  const AddArticle = () => {
    setIsModalVisible(true); // Show the modal
  };

  //view details
  const viewDetails = (row) => {
    let path = '';
  
    if (location.pathname.includes("popular-article")) {
      path = 'view-article';
    } else if (location.pathname.includes("popular-podcast")) {
      path = 'view-podcast';
    } else if (location.pathname.includes("popular-video")) {
      path = 'view-video';
    }
  
    switch (path) {
      case 'view-article':
        navigate(`/admin/dashboards/articles/${path}/${row._id}`);
        break;
      case 'view-podcast':
        navigate(`/admin/dashboards/podcasts/${path}/${row._id}`);
        break;
      case 'view-video':
        navigate(`/admin/dashboards/videos/${path}/${row._id}`);
        break;
      default:
        console.error('No matching path found');
        break;
    }
  };

  //filter category, title, author
  const handleFilter = () => {
    const filteredList = originalData.filter((item) => {
      const matchesCategory = selectedCategory
        ? item.categories.some((category) => category.name === selectedCategory)
        : true;
        
      const matchesAuthor = selectedAuthor
      ? item.author && item.author.username === selectedAuthor
      : true;

      const matchesTitle = selectedTitle
        ? item.title.toLowerCase().includes(selectedTitle.toLowerCase())
        : true;

      return matchesCategory && matchesAuthor && matchesTitle;
    });

    setFilteredData(filteredList); // Update filtered data
  };

  // Function to handle checkbox change
  const handleCheckboxChange = (record) => {
    // Update selectedRowKeys state
    const selected = selectedRowKeys.includes(record._id)
      ? selectedRowKeys.filter((key) => key !== record._id)
      : [...selectedRowKeys, record._id];
    setSelectedRowKeys(selected);

    // Toggle the featured status and pass the current status
    toggleFeatured(
      record._id,
      featuredStatusChanges[record._id] ?? record.featured
    );
  };

  // Function to handle submitting the form
  const handleOk = async (e) => {
    e.preventDefault();
    const updates = [];

    // Check the selected items based on selectedRowKeys
    for (const item of list) {
      if (selectedRowKeys.includes(item._id)) {
        const newStatus = featuredStatusChanges[item._id];
        if (newStatus !== undefined) {
          updates.push(toggleFeaturedAPI(item._id, newStatus));
        }
      }
    }

    try {
      await Promise.all(updates); // Wait for all API calls to complete

      // Only update the main list state after successful API calls
      const updatedList = list.map((item) => {
        const newStatus = featuredStatusChanges[item._id];
        if (newStatus !== undefined) {
          return { ...item, featured: newStatus };
        }
        // window.location.reload();
        return item;
      });

      setList(updatedList); // Update the list state with new featured statuses
      message.success("Featured statuses updated successfully");

      // Delay the reload slightly to ensure state is updated
      // setTimeout(() => {
      //   window.location.reload();
      // }, 100); // Adjust the timeout as necessary
    } catch (error) {
      message.error("Failed to update featured statuses");
    } finally {
      setIsModalVisible(false); // Hide the modal after the operation
    }
  };

  // Function to handle closing the modal
  const handleCancel = () => {
    setIsModalVisible(false); // Hide the modal
  };

  //LIST MAIN toggle data fetch
  const toggleFeaturedAPI = async (postId, newStatus) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/posts/${postId}/toggle-featured`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ featured: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update featured status"
        );
      }
    } catch (error) {
      throw error; // Re-throw to handle in handleOk
    }
  };

  const toggleFeatured = (postId, currentStatus) => {
    const newStatus = !currentStatus;
    // console.log(`Post ID: ${postId}, Featured Status: ${newStatus}`);

    // Update local state without calling the API
    setFeaturedStatusChanges((prev) => ({
      ...prev,
      [postId]: newStatus,
    }));
  };

  // remove the mainList data
  const deleteRow = async (row) => {
    const token = localStorage.getItem("auth_token"); // Get the token from local storage
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }

    try {
      // API request to set featured to false
      const response = await axios.put(
        `${API_BASE_URL}/posts/${row._id}/toggle-featured`,
        { featured: false },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      // Check if the response was successful
      if (response.status === 200) {
        // Update the state locally to reflect the new featured status
        const updatedList = listMain.map((item) =>
          item._id === row._id ? { ...item, featured: false } : item
        );
        setListMain(updatedList);
        message.success("Post removed successfully and set to not featured.");
        window.location.reload();
      } else {
        throw new Error("Failed to update featured status");
      }
    } catch (error) {
      message.error(error.message || "Failed to remove the post");
    }
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    // If the input is empty, reset to original data
    const searchArray = value ? listMain : originalData; // Use original data when the search input is empty
    const data = utils.wildCardSearch(searchArray, value); // Use the search utility to filter the data
    setListMain(data); // Update the list to the filtered data
    setSelectedRowKeys([]); // Clear selected row keys
  };

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    { title: "Title", dataIndex: "title" },
    {
      title: "Author",
      dataIndex: "author",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={
              record?.author?.profile_pic || "/img/avatars/default-avatar.jpg"
            }
            name={record?.author?.username}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name,
    },
    {
      title: "Categories",
      dataIndex: "categories",
      render: (_, record) =>
        record?.categories?.map((item) => item?.name).join(", ") ||
        "Uncategorized",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => {
        return (
          <>
            <Tag color={record?.status?.includes("sendback") ? "red" : "green"}>
              {record?.status}
            </Tag>
            {record?.editingSession?.id && (
              <Tag color={"grey"}>Edit in progress</Tag>
            )}
          </>
        );
      },
    },
  ];

  const popupTableColumns = [
    ...tableColumns,
    {
      title: "Select", // Custom row selection at the end
      dataIndex: "select",
      render: (_, record) => (
        <Checkbox
          checked={
            featuredStatusChanges[record._id] !== undefined
              ? featuredStatusChanges[record._id]
              : record?.featured
          }
          onChange={() => handleCheckboxChange(record)}
        />
      ),
    },
  ];

  // Define the popup table columns by adding the "show/hidden" column
  const mainTableColumns = [
    ...tableColumns,
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
            Add {formatPath(currentPath)}
          </Button>
        </div>
      </Flex>

      {/* Modal for Adding Article */}
      <Modal
        title={formatPath(currentPath)}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Submit"
        cancelText="Cancel"
        width={"90%"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: "20px" }}>
          <Row gutter={[5, 1]}>
            {/* author dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={5}>
              <Form.Item
                label="Author"
                name="author"
                initialValue={selectedAuthor}
                // rules={[{ required: true, message: "Select an author!" }]}
              >
                <Select
                  onChange={(value) => setSelectedAuthor(value)}
                  placeholder="Select an Author"
                >
                  {authors.map((author) => (
                    <Option key={author} value={author}>
                      {author}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* category dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={5}>
              <Form.Item
                label="Category"
                name="category"
                initialValue={selectedCategory}
                // rules={[{ required: true, message: "Select a category!" }]}
                // style={{}}
              >
                <Select
                  onChange={(value) => setSelectedCategory(value)}
                  placeholder="Select a Category"
                >
                  {categories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* Title */}
            <Col xs={24} sm={12} md={20} lg={20} xl={12}>
              <Form.Item name="title" label={"Title"}>
                <AntInput
                  placeholder={`Enter title`}
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)} // Update title state
                />
              </Form.Item>
            </Col>

            {/* Filter button */}
            <Col xs={8} sm={12} md={4} lg={4} xl={2}>
              <Form.Item label={labelContent}>
                <Button
                  onClick={handleFilter}
                  type="primary"
                  style={{ width: "100%" }}
                >
                  Filter
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <div>
            {/*popup list Table */}
            <Table
              style={{ marginTop: "20px" }}
              columns={popupTableColumns}
              dataSource={filteredData} // Update dataSource to use filtered data
              rowKey="id"
            />
          </div>
        </Form>
      </Modal>

      <div className="table-responsive">
        {/* main list table   */}
        <Table
          columns={mainTableColumns}
          dataSource={listMain}
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

export default ListPost;
