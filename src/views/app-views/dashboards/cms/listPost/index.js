import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Menu,
  Tag,
  Modal,
  Form,
  Select,
  Row,
  Col,
  Grid,
  message,
  Checkbox,
  Input as AntInput,
} from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import { DeleteOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "configs/AppConfig";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchAllPostsByPostType } from "store/slices/postSlice";
import axios from "axios";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { fetchAllCategories } from "store/slices/categoriesSlice";

const ListPost = () => {
  const { Option } = Select;
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint(); // Get screen size information
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop(); // Get the last part of the path

  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [featuredStatusChanges, setFeaturedStatusChanges] = useState({});
  const [listMain, setListMain] = useState([]);

  // Redux states
  const {
    posts,
    totalCount,
    loading: postsLoading,
  } = useSelector((state) => state.post);
  const { languages, loading: languagesLoading } = useSelector(
    (state) => state.languages
  );
  const { categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );

  // Available filters
  const availableLanguages = useMemo(
    () => [{ _id: "all", name: "All Languages" }, ...(languages || [])],
    [languages]
  );

  const availableCategories = useMemo(() => {
    if (selectedLanguage === "all") {
      return [
        { _id: "all", name: "All Categories" },
        ...(categories?.filter((cat) => cat.parentCategory) || []),
      ];
    }
    return [
      { _id: "all", name: "All Categories" },
      ...(categories?.filter((cat) => {
        const langId = cat.language?._id || cat.language;
        return langId === selectedLanguage && cat.parentCategory;
      }) || []),
    ];
  }, [categories, selectedLanguage]);

  // Fetch posts with current filters
  const fetchPosts = (
    page = 1,
    search = searchValue,
    lang = selectedLanguage,
    cat = selectedCategory
  ) => {
    const languageFilter = lang !== "all" ? lang : "";
    const categoryFilter = cat !== "all" ? cat : "";
    const searchQuery = search || "";

    const postTypeIdMapping = {
      "popular-article": "66d9d564987787d3e3ff1312",
      "popular-podcast": "66d9d564987787d3e3ff1313",
      "popular-video": "66d9d564987787d3e3ff1314",
    };

    const postTypeId = Object.keys(postTypeIdMapping).find((key) =>
      location.pathname.includes(key)
    );

    if (postTypeId) {
      const params = {
        postTypeId: postTypeIdMapping[postTypeId],
        page,
        limit: pageSize,
      };

      // Only include parameters that have values
      if (searchQuery) params.search = searchQuery;
      if (languageFilter) params.language = languageFilter;
      if (categoryFilter) params.category = categoryFilter;

      dispatch(
        fetchAllPostsByPostType(params)
      );
    }
  };

  // Initial load
  useEffect(() => {
    dispatch(fetchAllLanguages());
    dispatch(fetchAllCategories({ page: 1, limit: 100 }));
    fetchPosts(1);
  }, [dispatch]);

  // Define label logic outside JSX
  let labelContent;
  if (screens.lg || screens.xl || screens.xxl) {
    labelContent = <span style={{ visibility: "hidden" }}>Filter</span>; // Hidden but space occupied
  } else if (screens.sm || screens.md) {
    labelContent = <span style={{ display: "none" }}>Filter</span>; // Completely hidden for smaller screens
  }

  const allArticlePosts = useSelector((state) => state.post.posts);

  const [list, setList] = useState([]);
  const [allListData] = useState([]); // State to store data conditionally

  // const [categories, setCategories] = useState([]);
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

  // Fetch languages on component mount
  // useEffect(() => {
  //   if (languages.length === 0) {
  //     dispatch(fetchAllLanguages());
  //   }
  // }, [dispatch, languages.length]);

  // Fetch posts by post type
  useEffect(() => {
    // Post type mapping
    const postTypeIdMapping = {
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
    let path = "";

    if (location.pathname.includes("popular-article")) {
      path = "view-article";
    } else if (location.pathname.includes("popular-podcast")) {
      path = "view-podcast";
    } else if (location.pathname.includes("popular-video")) {
      path = "view-video";
    }

    switch (path) {
      case "view-article":
        navigate(`/admin/dashboards/articles/${path}/${row._id}`);
        break;
      case "view-podcast":
        navigate(`/admin/dashboards/podcasts/${path}/${row._id}`);
        break;
      case "view-video":
        navigate(`/admin/dashboards/videos/${path}/${row._id}`);
        break;
      default:
        console.error("No matching path found");
        break;
    }
  };

  //filter category, title, and language
  const handleFilter = () => {
    fetchPosts(1, searchValue, selectedLanguage, selectedCategory);
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

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    fetchPosts(1, e.target.value);
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    fetchPosts(pagination.current);
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
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Language">
                <Select
                  value={selectedLanguage}
                  onChange={(value) => setSelectedLanguage(value)}
                  loading={languagesLoading}
                  style={{ width: "100%" }}
                >
                  {availableLanguages.map((lang) => (
                    <Option key={lang._id} value={lang._id}>
                      {lang.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* category dropdown */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Category">
                <Select
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  loading={categoriesLoading}
                  style={{ width: "100%" }}
                >
                  {availableCategories.map((cat) => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* Title */}
            <Col xs={24} sm={12} md={20} lg={20} xl={10}>
              <Form.Item name="title" label={"Title"}>
                <AntInput
                  placeholder={`Enter title`}
                  value={selectedTitle}
                  onChange={(e) => {
                    setSelectedTitle(e.target.value);
                    setSearchValue(e.target.value); // Also update searchValue
                  }}
                />
              </Form.Item>
            </Col>
            {/* <Col xs={24} sm={24} md={8} lg={10}>
              <Form.Item label="Search">
                <Input
                  placeholder="Search by title..."
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  allowClear
                  onPressEnter={(e) => handleSearch(e)}
                />
              </Form.Item>
            </Col> */}

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
              columns={popupTableColumns}
              dataSource={posts}
              rowKey="_id"
              loading={postsLoading}
              rowSelection={{
                selectedRowKeys,
                onChange: (selectedRowKeys) =>
                  setSelectedRowKeys(selectedRowKeys),
              }}
              pagination={{
                current: currentPage,
                pageSize,
                total: totalCount,
                showSizeChanger: false,
              }}
              onChange={handleTableChange}
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
