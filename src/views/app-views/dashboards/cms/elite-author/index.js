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

const EliteAuthor = () => {
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
  const [selectedLanguage, setSelectedLanguage] = useState(null); // Initialize with the language
  const [selectedCategory, setSelectedCategory] = useState(null); // Initialize with the first category
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
  //get data elite
  const [listMain, setListMain] = useState([]);
  const [featuredStatusChanges, setFeaturedStatusChanges] = useState({});
  const [categories, setCategories] = useState([]);
  const [language, setLanguage] = useState([]);
  const [selectedName, setSelectedName] = useState(""); // State for title filter
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]); // Store original dataset
  const isPrefaceToIslam = location.pathname.includes("preface-to-islam");
  console.log(list, "list aane");

  console.log(listMain, "listMAin data");
  // console.log(filteredData,"filtereed data main");
  console.log(allListData, " all list data");

  // Assuming you fetch this data from an API or some initial source
  const sourceData = allListData;

  useEffect(() => {
    setOriginalData(sourceData);
    setFilteredData(sourceData); // Initialize filtered data
  }, [sourceData]);

  // useEffect(() => {
  //   if (allArticlePosts) {
  //     setList(allArticlePosts);
  //   }
  // }, [allArticlePosts]);

  //all list data
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/frontend/all-authors`
        );
        setAllListData(response.data.data);
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchAuthors();
  }, []);

  // //category
  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const response = await axios.get(
  //         `${API_BASE_URL}/frontend/category-list`
  //       );
  //       setCategories(response.data.data.map((cat) => cat.name));
  //     } catch (error) {
  //       console.error("Error fetching category list:", error);
  //     }
  //   };

  //   fetchCategories();
  // }, []);

  //language
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/languages/all`);
        // setAuthors(response.data.data.map((author) => author.username));
        setLanguage(response.data.data.map((language) => language.name));
      } catch (error) {
        console.error("Error fetching category list:", error);
      }
    };

    fetchAuthors();
  }, []);

  // useEffect(() => {
  //   const postTypeIdMapping = {
  //     // static data
  //     "popular-article": "66d9d564987787d3e3ff1312",
  //     "popular-podcast": "66d9d564987787d3e3ff1313",
  //     "popular-video": "66d9d564987787d3e3ff1314",
  //   };

  //   const postTypeId = Object.keys(postTypeIdMapping).find((key) =>
  //     location.pathname.includes(key)
  //   );

  //   if (postTypeId) {
  //     dispatch(
  //       fetchAllPostsByPostType({ postTypeId: postTypeIdMapping[postTypeId] })
  //     );
  //   }
  // }, [dispatch, location.pathname]);

  // popup list data

  //get data listmain
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/frontend/elite-users`
        );
        setListMain(response.data.data);
      } catch (error) {
        console.error("Error fetching elite users:", error);
      }
    };
    fetchAuthors();
  }, []);

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
    navigate(`/admin/dashboards/users/view-user/${row._id}`);
  };

  //filter category, title, author
  const handleFilter = () => {
    const filteredList = originalData.filter((item) => {
      const matchesLanguage = selectedLanguage
        ? item.languages.some(
            (lang) =>
              lang === selectedLanguage || lang.name === selectedLanguage
          )
        : true;

      // Update this line to match the correct field (e.g., item.name or item.username)
      const matchesName = selectedName
        ? (item.name || "").toLowerCase().includes(selectedName.toLowerCase())
        : true;

      return matchesLanguage && matchesName;
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
    togglePrefaceFeatured(
      record._id,
      featuredStatusChanges[record._id] ?? record.elite
    );
  };

  // Function to handle submitting the form
  const handleOk = async () => {
    const updates = [];

    // Check the selected items based on selectedRowKeys
    for (const item of allListData) {
      if (selectedRowKeys.includes(item._id)) {
        const newStatus = featuredStatusChanges[item._id];
        if (newStatus !== undefined) {
          updates.push(togglePrefaceFeaturedAPI(item._id, newStatus));
        }
      }
    }

    try {
      await Promise.all(updates); // Wait for all API calls to complete

      // Only update the main list state after successful API calls
      const updatedList = allListData.map((item) => {
        const newStatus = featuredStatusChanges[item._id];
        if (newStatus !== undefined) {
          return { ...item, elite: newStatus };
        }
        window.location.reload();
        return item;
      });

      setAllListData(updatedList); // Update the list state with new featured statuses
      message.success("elite statuses updated successfully");

      // Delay the reload slightly to ensure state is updated
      setTimeout(() => {
        window.location.reload();
      }, 100); // Adjust the timeout as necessary
    } catch (error) {
      message.error("Failed to update elite statuses");
    } finally {
      setIsModalVisible(false); // Hide the modal after the operation
    }
  };

  // Function to handle closing the modal
  const handleCancel = () => {
    setIsModalVisible(false); // Hide the modal
  };

  //LIST MAIN toggle data fetch
  const togglePrefaceFeaturedAPI = async (postId, newStatus) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/user/${postId}/toggle-elite`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ elite: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update elite status");
      }
    } catch (error) {
      throw error; // Re-throw to handle in handleOk
    }
  };

  const togglePrefaceFeatured = (postId, currentStatus) => {
    const newStatus = !currentStatus;
    // console.log(`Post ID: ${postId}, elite Status: ${newStatus}`);

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
      // API request to set elite to false
      const response = await axios.put(
        `${API_BASE_URL}/user/${row._id}/toggle-elite`,
        { elite: false },
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
          item._id === row._id ? { ...item, elite: false } : item
        );
        setListMain(updatedList);
        message.success("Post removed successfully and set to not elite.");
        window.location.reload();
      } else {
        throw new Error("Failed to update elite status");
      }
    } catch (error) {
      message.error(error.message || "Failed to remove the post");
    }
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    const searchArray = value ? listMain : originalData;
    const data = utils.wildCardSearch(searchArray, value);
    setListMain(data);
    setSelectedRowKeys([]);
  };

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    {
      title: "Username",
      dataIndex: "username",
    },
    {
      title: "Author",
      dataIndex: "name",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={
              record.profile_pic
                ? record.profile_pic
                : "/img/avatars/default-avatar.jpg"
            }
            name={record?.name}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Languages",
      dataIndex: "languages",
      render: (_, record) => (
        <div className="d-flex">
          {record.languages.map((obj) => obj.name + " ")}
        </div>
      ),
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
              : record.elite
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
            {/* language dropdown */}
            <Col xs={24} sm={12} md={8} lg={6} xl={5}>
              <Form.Item
                label="Language"
                name="language"
                initialValue={selectedLanguage}
                // rules={[{ required: true, message: "Select an author!" }]}
              >
                <Select
                  onChange={(value) => setSelectedLanguage(value)}
                  placeholder="Select an language"
                >
                  {language?.map((lang) => (
                    <Option key={lang} value={lang}>
                      {lang}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            {/* category dropdown */}
            {/* <Col xs={24} sm={12} md={12} lg={12} xl={5}>
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
            </Col> */}
            {/* Title */}
            <Col xs={24} sm={12} md={12} lg={14} xl={17}>
              <Form.Item name="name" label={"Author Name"}>
                <AntInput
                  placeholder={`Enter Author name`}
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)} // Update title state
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

export default EliteAuthor;
