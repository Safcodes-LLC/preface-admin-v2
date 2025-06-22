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
  Tabs,
  Checkbox,
  Grid,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  EditOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import { fetchAllCategoriesByPostType } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import TextArea from "antd/es/input/TextArea";
import Dragger from "antd/es/upload/Dragger";
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";
import { Option } from "antd/es/mentions";

const { TabPane } = Tabs;

const Banner = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  
  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("video");

  // Watch form fields for reactive filtering
  const selectedLanguage = Form.useWatch('language', form);
  const selectedParentCategory = Form.useWatch('ParentCategory', form);

  const navigate = useNavigate();
  
  // Get categories and languages from Redux store
  const categoriesByPostType = useSelector((state) => state.categories.categoriesByPostType);
  const languages = useSelector((state) => state.languages.languages);
  
  const [list, setList] = useState([]); // Banner selected posts
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [highlightedPosts, setHighlightedPosts] = useState([]); // Array for multiple highlights
  const [contentData, setContentData] = useState({
    video: [],
    article: [],
    topics: []
  });
  
  // Categories list from Redux
  const [categoriesList, setCategoriesList] = useState([]);
  
  // Filter states for modal (only keep non-form related states)
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [bannerStatusChanges, setBannerStatusChanges] = useState({});
  const [allPosts, setAllPosts] = useState([]);

  // Define label logic for responsive design
  let labelContent;
  if (screens.lg || screens.xl || screens.xxl) {
    labelContent = <span style={{ visibility: "hidden" }}>Filter</span>;
  } else if (screens.sm || screens.md) {
    labelContent = <span style={{ display: "none" }}>Filter</span>;
  }

  // Tab configuration with correct post type IDs
  const tabConfig = {
    video: {
      title: "Video",
      icon: <VideoCameraOutlined />,
      addButtonText: "Manage Video Banner",
      modalTitle: "Manage Video Banner Selection",
      endpoint: "video",
      postTypeId: "66d9d564987787d3e3ff1314"
    },
    article: {
      title: "Article",
      icon: <FileTextOutlined />,
      addButtonText: "Manage Article Banner",
      modalTitle: "Manage Article Banner Selection",
      endpoint: "article",
      postTypeId: "66d9d564987787d3e3ff1312"
    },
    topics: {
      title: "Topics",
      icon: <TagsOutlined />,
      addButtonText: "Manage Topic Banner",
      modalTitle: "Manage Topic Banner Selection",
      endpoint: "topics",
      postTypeId: "66d9d564987787d3e3ff1313"
    }
  };

  // Reset parent category when language changes
  useEffect(() => {
    if (selectedLanguage) {
      form.setFieldsValue({ ParentCategory: undefined, categories: undefined });
    }
  }, [selectedLanguage, form]);

  // Reset subcategory when parent category changes
  useEffect(() => {
    if (selectedParentCategory) {
      form.setFieldsValue({ categories: undefined });
    }
  }, [selectedParentCategory, form]);

  // Fetch categories using the same approach as GeneralField
  useEffect(() => {
    const postTypeId = tabConfig[activeTab].postTypeId;
    dispatch(fetchAllCategoriesByPostType({ postTypeId }));
  }, [dispatch, activeTab]);

  // Fetch languages
  useEffect(() => {
    if (!languages.length) {
      dispatch(fetchAllLanguages());
    }
  }, [dispatch, languages]);

  // Update categories list when Redux state changes
  useEffect(() => {
    setCategoriesList(categoriesByPostType);
  }, [categoriesByPostType]);

  // Filter parent categories by language
  const filteredParentCategories = categoriesList.filter((category) => {
    const hasNoParent = !category.parentCategory;
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    return hasNoParent && matchesLanguage;
  });

  // Filter subcategories by parent category and language
  const filteredSubCategories = categoriesList.filter((category) => {
    const hasParent = category.parentCategory && category.parentCategory.id === selectedParentCategory;
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    return hasParent && matchesLanguage;
  });

  // Fetch banner data when tab changes
  useEffect(() => {
    fetchBannerData();
    fetchHighlightedPosts();
  }, [activeTab]);

  // Fetch banner selected posts
  const fetchBannerData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      
      const response = await axios.get(`${API_BASE_URL}/banner/posts/banner-selected/${postTypeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (response?.data?.status === "success") {
        const data = response.data.data || [];
        setContentData(prev => ({
          ...prev,
          [activeTab]: data
        }));
        setList(data);
      }
    } catch (error) {
      console.error("Error fetching banner data:", error);
      message.error("Failed to fetch banner data");
    }
  };

  // Fetch highlighted posts (can be multiple for articles)
  const fetchHighlightedPosts = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      
      const response = await axios.get(`${API_BASE_URL}/banner/posts/highlighted/${postTypeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      console.log('Highlighted posts API response:', response.data);

      if (response?.data?.status === "success") {
        // Ensure we always set an array
        const posts = response.data.data;
        console.log('Highlighted posts data:', posts, 'Type:', typeof posts, 'Is Array:', Array.isArray(posts));
        
        if (Array.isArray(posts)) {
          setHighlightedPosts(posts);
        } else if (posts && typeof posts === 'object') {
          // If API returns single object, convert to array
          setHighlightedPosts([posts]);
          console.log('Converted single object to array');
        } else {
          // If null or undefined, set empty array
          setHighlightedPosts([]);
          console.log('Set empty array for highlighted posts');
        }
      } else {
        setHighlightedPosts([]);
        console.log('API response not successful, setting empty array');
      }
    } catch (error) {
      console.error("Error fetching highlighted posts:", error);
      setHighlightedPosts([]); // Ensure array on error
    }
  };

  // Fetch all posts for the modal selection
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const postTypeId = tabConfig[activeTab].postTypeId;
        
        const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${postTypeId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params: {
            page: 1,
            limit: 100,
            sortBy: 'priority'
          }
        });

        if (response?.data?.status === "success") {
          setAllPosts(response.data.data);
          setOriginalData(response.data.data);
          setFilteredData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching all posts:", error);
        message.error("Failed to fetch posts");
      }
    };

    if (isModalVisible) {
      fetchAllPosts();
    }
  }, [isModalVisible, activeTab]);

  useEffect(() => {
    if (contentData[activeTab]) {
      setList(contentData[activeTab]);
    }
  }, [activeTab, contentData]);

  const dropdownMenu = (row) => (
    <Menu>
      <Menu.Item onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item onClick={() => editDetails(row)}>
        <Flex alignItems="center">
          <EditOutlined />
          <span className="ml-2">Edit Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item onClick={() => removeFromBanner(row)}>
        <Flex alignItems="center">
          <DeleteOutlined />
          <span className="ml-2">Remove from Banner</span>
        </Flex>
      </Menu.Item>
    </Menu>
  );

  const AddContent = () => {
    setIsModalVisible(true);
    form.resetFields();
    setBannerStatusChanges({});
    setSelectedRowKeys([]);
  };

  const handleOk = async () => {
    const updates = [];

    // Process banner status changes
    for (const [postId, newStatus] of Object.entries(bannerStatusChanges)) {
      updates.push(toggleBannerSelectionAPI(postId, newStatus));
    }

    try {
      await Promise.all(updates);
      message.success("Banner selections updated successfully");
      
      // Refresh data
      await fetchBannerData();
      await fetchHighlightedPosts();
      
    } catch (error) {
      message.error("Failed to update banner selections");
    } finally {
      setIsModalVisible(false);
      setBannerStatusChanges({});
      setSelectedRowKeys([]);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setBannerStatusChanges({});
    setSelectedRowKeys([]);
  };

  // API call to toggle banner selection
  const toggleBannerSelectionAPI = async (postId, selectedForBanner) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banner/posts/${postId}/toggle-banner-selection`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ selectedForBanner }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update banner selection");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  // API call to toggle highlight
  const toggleHighlightAPI = async (postId, highlighted) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/banner/posts/${postId}/toggle-highlight`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ highlighted }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update highlight status");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const toggleBannerSelection = (postId, currentStatus) => {
    const newStatus = !currentStatus;
    setBannerStatusChanges((prev) => ({
      ...prev,
      [postId]: newStatus,
    }));
  };

  const handleCheckboxChange = (record) => {
    const selected = selectedRowKeys.includes(record._id)
      ? selectedRowKeys.filter((key) => key !== record._id)
      : [...selectedRowKeys, record._id];
    setSelectedRowKeys(selected);

    toggleBannerSelection(
      record._id,
      bannerStatusChanges[record._id] ?? record.selectedForBanner
    );
  };

  // Clear all filters and show all data
  const handleClearFilters = () => {
    form.resetFields();
    setFilteredData(originalData);
  };

  const handleFilter = () => {
    const languageValue = form.getFieldValue('language');
    const categoryValue = form.getFieldValue('ParentCategory');
    const subCategoryValue = form.getFieldValue('categories');
    const titleValue = form.getFieldValue('title');

    console.log('Filter Values:', {
      languageValue,
      categoryValue,
      subCategoryValue,
      titleValue
    });

    // Debug: Log all original data to see structure
    console.log('=== DEBUGGING ORIGINAL DATA ===');
    console.log('Original Data Count:', originalData.length);
    originalData.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item._id,
        title: item.title,
        language: item.language,
        categories: item.categories,
        selectedForBanner: item.selectedForBanner
      });
    });
    console.log('=== END DEBUG DATA ===');

    const filteredList = originalData.filter((item, index) => {
      // Language filter
      const matchesLanguage = languageValue
        ? item.language && item.language._id === languageValue
        : true;

      // Category filtering logic:
      // If subcategories are selected, only check subcategory match
      // If only parent category is selected, check for parent category OR its subcategories
      let matchesCategory = true;
      
      if (subCategoryValue && subCategoryValue.length > 0) {
        // If subcategories are selected, only check subcategory match
        matchesCategory = item.categories && item.categories.some((category) => 
          subCategoryValue.includes(category._id)
        );
      } else if (categoryValue) {
        // If only parent category is selected, check for parent category OR its subcategories
        matchesCategory = item.categories && item.categories.some((category) => {
          // Check if item has the parent category directly
          if (category._id === categoryValue) {
            return true;
          }
          // Check if item has any subcategory of the selected parent category
          return category.parentCategory && category.parentCategory.id === categoryValue;
        });
      }
      
      // Remove the separate subcategory check since it's handled above

      // Title filter - only apply if user actually entered something
      const matchesTitle = titleValue && titleValue.trim()
        ? item.title && item.title.toLowerCase().includes(titleValue.toLowerCase())
        : true;

      // Debug each filter for first few items
      if (index < 3) {
        console.log(`=== ITEM ${index + 1} FILTER DEBUG ===`);
        console.log('Item:', item.title);
        console.log('Item Language:', item.language);
        console.log('Item Categories:', item.categories);
        
        // Show detailed category info
        if (item.categories && item.categories.length > 0) {
          item.categories.forEach((cat, catIndex) => {
            console.log(`  Category ${catIndex + 1}:`, {
              id: cat._id,
              name: cat.name,
              parentCategory: cat.parentCategory
            });
          });
        }
        
        console.log('Language Match:', matchesLanguage, '(checking:', languageValue, 'vs', item.language?._id, ')');
        console.log('Category Match:', matchesCategory, '(checking category:', categoryValue, 'subcategories:', subCategoryValue, ')');
        console.log('Title Match:', matchesTitle, '(checking:', titleValue, ')');
        console.log('Overall Match:', matchesLanguage && matchesCategory && matchesTitle);
        console.log('=== END ITEM DEBUG ===');
      }

      const matches = matchesLanguage && matchesCategory && matchesTitle;
      
      return matches;
    });

    console.log('Original Data Count:', originalData.length);
    console.log('Filtered Data Count:', filteredList.length);
    console.log('Sample filtered item:', filteredList[0]);

    setFilteredData(filteredList);
  };

  // Function to handle toggling the highlight status
  const toggleHighlight = async (postId, shouldHighlight) => {
    try {
      const result = await toggleHighlightAPI(postId, shouldHighlight);
      
      if (result.status === "success") {
        message.success(`Post ${shouldHighlight ? 'highlighted' : 'unhighlighted'} successfully!`);
        
        // Refresh data to ensure proper state
        await Promise.all([
          fetchBannerData(),
          fetchHighlightedPosts()
        ]);
        
      } else {
        message.error(`Failed to ${shouldHighlight ? 'highlight' : 'unhighlight'} post`);
      }
    } catch (error) {
      console.error("Error during highlight toggle:", error);
      message.error(`An error occurred while ${shouldHighlight ? 'highlighting' : 'unhighlighting'} the post.`);
    }
  };

  const viewDetails = (row) => {
    let path = '';
    
    if (activeTab === "article") {
      path = 'view-article';
      navigate(`/admin/dashboards/articles/${path}/${row._id}`);
    } else if (activeTab === "topics") {
      path = 'view-podcast';
      navigate(`/admin/dashboards/podcasts/${path}/${row._id}`);
    } else if (activeTab === "video") {
      path = 'view-video';
      navigate(`/admin/dashboards/videos/${path}/${row._id}`);
    }
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/cms/${activeTab}/edit-${activeTab}/${row._id}`);
  };

  const removeFromBanner = async (row) => {
    try {
      await toggleBannerSelectionAPI(row._id, false);
      message.success("Post removed from banner successfully");
      
      // Refresh data
      await fetchBannerData();
      await fetchHighlightedPosts();
      
    } catch (error) {
      message.error("Failed to remove post from banner");
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setHighlightedPosts([]); // Reset highlighted posts when changing tabs
    form.resetFields();
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    const searchArray = value ? list : contentData[activeTab];
    const data = utils.wildCardSearch(searchArray, value);
    setList(data);
    setSelectedRowKeys([]);
  };

  const getMainTableColumns = () => [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    { 
      title: "Title", 
      dataIndex: "title" 
    },
    {
      title: "Author",
      dataIndex: "author",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={record?.author?.profile_pic || "/img/avatars/default-avatar.jpg"}
            name={record?.author?.username}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name || "No Language",
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
    {
      title: "Highlight",
      dataIndex: "highlight",
      render: (_, record) => {
        // Ensure highlightedPosts is always an array before using .some()
        const isHighlighted = Array.isArray(highlightedPosts) && 
          highlightedPosts.some(post => post._id === record._id);
        
        return (
          <Switch
            checked={isHighlighted}
            onChange={(checked) => toggleHighlight(record._id, checked)}
            disabled={!record.selectedForBanner}
          />
        );
      },
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

  const getModalTableColumns = () => [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    { 
      title: "Title", 
      dataIndex: "title" 
    },
    {
      title: "Author",
      dataIndex: "author",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={record?.author?.profile_pic || "/img/avatars/default-avatar.jpg"}
            name={record?.author?.username}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name || "No Language",
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
    {
      title: "Select for Banner",
      dataIndex: "select",
      render: (_, record) => (
        <Checkbox
          checked={
            bannerStatusChanges[record._id] !== undefined
              ? bannerStatusChanges[record._id]
              : record?.selectedForBanner || false
          }
          onChange={() => handleCheckboxChange(record)}
        />
      ),
    },
  ];

  return (
    <Card>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        {Object.entries(tabConfig).map(([key, config]) => (
          <TabPane 
            tab={
              <span>
                {config.icon}
                {config.title}
              </span>
            } 
            key={key}
          >


            <Flex
              alignItems="center"
              justifyContent="space-between"
              mobileFlex={false}
            >
              <Flex className="mb-1" mobileFlex={false}>
                <div className="mr-md-3 mb-3">
                  <Input
                    placeholder="Search banner posts"
                    prefix={<SearchOutlined />}
                    onChange={(e) => onSearch(e)}
                  />
                </div>
              </Flex>
              <div>
                <Button
                  onClick={AddContent}
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  block
                >
                  {config.addButtonText}
                </Button>
              </div>
            </Flex>

            <div className="table-responsive">
              <Table
                columns={getMainTableColumns()}
                dataSource={list}
                rowKey="_id"
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} banner posts`,
                }}
              />
            </div>
          </TabPane>
        ))}
      </Tabs>

      {/* Modal for Managing Banner Content */}
      <Modal
        title={tabConfig[activeTab].modalTitle}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Update Banner Selections"
        cancelText="Cancel"
        width={"90%"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: "20px" }}>
          <Row gutter={[5, 1]}>
            {/* Language dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item
                label="Language"
                name="language"
              >
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Language"
                  allowClear
                >
                  {languages.map((language) => (
                    <Option key={language._id} value={language._id}>
                      {language.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Parent Category dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item
                label="Parent Category"
                name="ParentCategory"
              >
                <Select
                  style={{ width: "100%" }}
                  placeholder={
                    selectedLanguage 
                      ? "Select a parent category" 
                      : "Please select a language first"
                  }
                  disabled={!selectedLanguage}
                  allowClear
                >
                  {filteredParentCategories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Sub Category dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item
                label="Sub Category"
                name="categories"
              >
                <Select
                  style={{ width: "100%" }}
                  mode="multiple"
                  placeholder={
                    selectedParentCategory 
                      ? "Select sub categories" 
                      : "Please select a parent category first"
                  }
                  disabled={!selectedParentCategory}
                  allowClear
                >
                  {filteredSubCategories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            {/* Title */}
            <Col xs={24} sm={12} md={20} lg={20} xl={8}>
              <Form.Item name="title" label={"Title"}>
                <AntInput
                  placeholder={`Enter title to search`}
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

            {/* Clear Filters button */}
            <Col xs={8} sm={12} md={4} lg={4} xl={2}>
              <Form.Item label={<span style={{ visibility: "hidden" }}>Clear</span>}>
                <Button
                  onClick={handleClearFilters}
                  type="default"
                  style={{ width: "100%" }}
                >
                  Clear
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <div>
            {/* Modal table for selection */}
            <Table
              style={{ marginTop: "20px" }}
              columns={getModalTableColumns()}
              dataSource={filteredData}
              rowKey="_id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} posts`,
              }}
            />
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default Banner;