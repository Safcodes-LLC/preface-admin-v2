import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button, 
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
  Grid,
  Tooltip,
} from "antd";
import {
  EyeOutlined, 
  SearchOutlined,
  PlusCircleOutlined, 
  VideoCameraOutlined,
  FileTextOutlined, 
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus"; 
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux"; 
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice"; 
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";

const { TabPane } = Tabs;

const FeaturedArticles = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("video");

  // Watch form fields for reactive filtering
  const selectedLanguage = Form.useWatch("language", form);
  const selectedParentCategory = Form.useWatch("ParentCategory", form);
  const selectedSubCategory = Form.useWatch("categories", form);

  const navigate = useNavigate();

  // Get categories and languages from Redux store
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);

  const [list, setList] = useState([]); // Feature selected posts (filtered)
  const [originalBannerData, setOriginalBannerData] = useState([]); // Original feature data (unfiltered) 

  // New state for language-specific highlighting
  const [selectedLanguageForHighlights, setSelectedLanguageForHighlights] =
    useState(null);

  // Categories list from Redux
  const [categoriesList, setCategoriesList] = useState([]);

  // Filter states for modal (only keep non-form related states)
  const [filteredData, setFilteredData] = useState([]); 
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPagination, setModalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalFilters, setModalFilters] = useState({
    language: undefined,
    parentCategory: undefined,
    categories: undefined,
    title: "",
  });

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
      title: "home page",
      icon: <VideoCameraOutlined />,
      addButtonText: "Manage Featured Articles",
      modalTitle: "Manage Featured Articles Selection",
      endpoint: "article",
      postTypeId: "66d9d564987787d3e3ff1312",
    },
    article: {
      title: "category page",
      icon: <FileTextOutlined />,
      addButtonText: "Manage Featured Articles",
      modalTitle: "Manage Featured Articles Selection",
      endpoint: "article",
      postTypeId: "66d9d564987787d3e3ff1312",
    },
  };

  // API call to toggle featured selection (for modal 'Select for featured')
  const toggleFeaturedSelectionAPI = async (postId) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/featured/posts/${postId}/toggle-featured-selection`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update featured selection"
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
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

  // Fetch categories - use same approach as GeneralField
  useEffect(() => {
    if (!categories.length) {
      console.log("Fetching all categories");
      dispatch(fetchAllCategories());
    }
  }, [dispatch, categories]);

  // Fetch languages
  useEffect(() => {
    dispatch(fetchAllLanguages());
  }, [dispatch]);

  // Set English as default when languages are loaded (only once)
  useEffect(() => {
    if (languages.length > 0 && selectedLanguageForHighlights === null) {
      const englishLang = languages.find(
        (lang) =>
          lang.name.toLowerCase().includes("english") ||
          lang.code === "en" ||
          lang.code === "eng"
      );
      if (englishLang) {
        setSelectedLanguageForHighlights(englishLang._id);
      }
    }
  }, [languages, selectedLanguageForHighlights]);

  // Update categories list when Redux state changes
  useEffect(() => { 
    if (categories && Array.isArray(categories) && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      console.log("No categories available or invalid format");
      setCategoriesList([]);
    }
  }, [categories]);

  // Filter parent categories by language (same as GeneralField)
  const filteredParentCategories = categoriesList.filter((category) => {
    const hasNoParent = !category.parentCategory;
    const matchesLanguage = selectedLanguage
      ? category.language?._id === selectedLanguage ||
        category.language === selectedLanguage
      : true;
    return hasNoParent && matchesLanguage;
  });

  // Filter subcategories by parent category and language (same as GeneralField concept)
  const filteredSubCategories = categoriesList.filter((category) => {
    const hasParent =
      category.parentCategory &&
      (category.parentCategory._id === selectedParentCategory ||
        category.parentCategory.id === selectedParentCategory);
    const matchesLanguage = selectedLanguage
      ? category.language?._id === selectedLanguage ||
        category.language === selectedLanguage
      : true;
    return hasParent && matchesLanguage;
  });

  // Fetch featured posts for main table with filters
  const fetchMainFeaturedPosts = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const params = {
        lang: selectedLanguage || undefined,
        parentCategory: selectedParentCategory || undefined,
        category: Array.isArray(selectedSubCategory)
          ? selectedSubCategory[0]
          : selectedSubCategory || undefined,
      };
      const response = await axios.get(
        `${API_BASE_URL}/featured/featured-posts`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params,
        }
      );
      if (response?.data?.status === "success") {
        const data = response.data.data || [];
        const sorted = [...data].sort(
          (a, b) => (b?.selectedForHomeFeatured === true) - (a?.selectedForHomeFeatured === true)
        );
        setOriginalBannerData(sorted);
        setList(sorted);
      }
    } catch (error) {
      console.error("Error fetching featured posts:", error);
      message.error("Failed to fetch featured posts");
    }
  };

  // Fetch on tab or filter changes
  useEffect(() => {
    fetchMainFeaturedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedLanguage,
    selectedParentCategory,
    selectedSubCategory,
  ]);

  // Helper function to refresh Feature data
  const refreshBannerData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      // const postTypeId = tabConfig[activeTab].postTypeId;

      const response = await axios.get(
        `${API_BASE_URL}/featured/featured-posts`, 
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (response?.data?.status === "success") {
        const data = response.data.data || [];
        const sorted = [...data].sort(
          (a, b) => (b?.selectedForHomeFeatured === true) - (a?.selectedForHomeFeatured === true)
        );
        setOriginalBannerData(sorted);
        setList(sorted);
      }
    } catch (error) {
      console.error("Error fetching feature data:", error);
      message.error("Failed to fetch feature data");
    }
  };

  // Prepare modal on open: clear previous results and reset pagination; await user filters
  useEffect(() => {
    if (isModalVisible) {
      setFilteredData([]);
      setModalPagination({ current: 1, pageSize: 10, total: 0 });
      setModalFilters({
        language: undefined,
        parentCategory: undefined,
        categories: undefined,
        title: "",
      });
    }
  }, [isModalVisible, activeTab]);

  const AddContent = () => {
    setIsModalVisible(true);
    form.resetFields(); 
    setFilteredData([]); // Ensure no data is shown initially

 
  };

  const handleOk = async () => {
    const updates = [];

    try {
      await Promise.all(updates);
      message.success("Featured selections updated successfully");

      // Refresh data
      await refreshBannerData();
    } catch (error) {
      message.error("Failed to update featured selections");
    } finally {
      setIsModalVisible(false); 
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields(); 
    setFilteredData([]); // Clear filtered data when closing modal
  };

  // API call to toggle highlight (home page) with language scoping
  const toggleHighlightAPI = async (postId, languageId) => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      message.error("Authorization token is missing");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/featured/posts/${postId}/toggle-home-featured-selection/${languageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update highlight status"
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleFeaturedSwitch = async (record) => {
    try {
      const result = await toggleFeaturedSelectionAPI(record._id);
      if (result?.status === "success") {
        message.success(result?.message || "Featured selection updated");
        // Refresh modal list if filters are active, else do nothing
        if (modalFilters.language && modalFilters.categories) {
          await fetchModalPage(modalPagination.current, modalPagination.pageSize);
        }
        // Refresh main Feature/featured data to reflect changes
        await refreshBannerData();
      } else {
        message.error("Failed to update featured selection");
      }
    } catch (e) {
      message.error(e?.message || "Failed to update featured selection");
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    setFilteredData([]); // Clear data - user must select language and filter again
    setModalPagination({
      current: 1,
      pageSize: modalPagination.pageSize,
      total: 0,
    });
    setModalFilters({
      language: undefined,
      parentCategory: undefined,
      categories: undefined,
      title: "",
    });
  };

  const handleFilter = async () => {
    const languageValue = form.getFieldValue("language");
    const categoryValue = form.getFieldValue("ParentCategory");
    const subCategoryValue = form.getFieldValue("categories");
    const titleValue = form.getFieldValue("title");

    if (!languageValue) {
      message.warning("Please select a language first");
      return;
    }
    if (!subCategoryValue) {
      message.warning("Please select a sub category to filter");
      return;
    }

    setModalLoading(true);
    setModalFilters({
      language: languageValue,
      parentCategory: categoryValue,
      categories: subCategoryValue || undefined,
      title: titleValue || "",
    });

    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      const page = 1;
      const limit = modalPagination.pageSize;
      console.log("languageValue===", languageValue);

      const params = {
        page,
        limit,
        sortBy: "priority",
        languageId: languageValue,
        language: languageValue,
        parentCategoryId: categoryValue,
        parentCategory: categoryValue,
        category: subCategoryValue,
        categoriesCsv: subCategoryValue,
        title: titleValue,
        search: titleValue,
      };

      console.log("Feature manage filter params:", params);
      const response = await axios.get(
        `${API_BASE_URL}/banner/posts/manage/${postTypeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params,
          paramsSerializer: (params) => {
            const q = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (value === undefined || value === null || value === "") return;
              if (Array.isArray(value)) {
                q.set(key, value.join(","));
              } else {
                q.set(key, String(value));
              }
            });
            return q.toString();
          },
        }
      );

      if (response?.data?.status === "success") {
        const payload = response.data;
        const items = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.docs)
          ? payload.docs
          : [];
        const p = payload.pagination || {};
        const sortedItems = [...items].sort(
          (a, b) => (b?.selectedForFeatured === true) - (a?.selectedForFeatured === true)
        );
        setFilteredData(sortedItems);
        setModalPagination({
          current: p.page || page,
          pageSize: p.limit || limit,
          total: p.total || 0,
        });
      } else {
        setFilteredData([]);
        setModalPagination({ current: 1, pageSize: limit, total: 0 });
      }
    } catch (err) {
      console.error("Error filtering posts:", err?.response || err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch filtered posts";
      message.error(serverMsg);
      setFilteredData([]);
      setModalPagination({
        current: 1,
        pageSize: modalPagination.pageSize,
        total: 0,
      });
    } finally {
      setModalLoading(false);
    }
  };

  const fetchModalPage = async (page, pageSize) => {
    const { language, parentCategory, categories, title } = modalFilters;
    if (!language || !categories) return;
    setModalLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      const params = {
        page,
        limit: pageSize,
        sortBy: "priority",
        languageId: language,
        language,
        parentCategoryId: parentCategory,
        parentCategory,
        category: categories,
        categoriesCsv: categories,
        title,
        search: title,
      };

      const response = await axios.get(
        `${API_BASE_URL}/banner/posts/manage/${postTypeId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params,
          paramsSerializer: (params) => {
            const q = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (value === undefined || value === null || value === "") return;
              if (Array.isArray(value)) {
                q.set(key, value.join(","));
              } else {
                q.set(key, String(value));
              }
            });
            return q.toString();
          },
        }
      );

      if (response?.data?.status === "success") {
        const payload = response.data;
        const items = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.docs)
          ? payload.docs
          : [];
        const p = payload.pagination || {};
        const sortedItems = [...items].sort(
          (a, b) => (b?.selectedForFeatured === true) - (a?.selectedForFeatured === true)
        );
        setFilteredData(sortedItems);
        setModalPagination({
          current: p.page || page,
          pageSize: p.limit || pageSize,
          total: p.total || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching modal page:", err?.response || err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch posts page";
      message.error(serverMsg);
    } finally {
      setModalLoading(false);
    }
  };

  // Updated function to handle toggling the highlight status (home page only, single active)
  const toggleHighlight = async (postId, shouldHighlight, languageId) => {
    try {
      const result = await toggleHighlightAPI(postId, languageId);

      if (result.status === "success") {
        message.success(result.message || "Highlight updated");

        // Refresh data to ensure proper state
        await refreshBannerData();
      } else {
        message.error(
          `Failed to ${shouldHighlight ? "highlight" : "unhighlight"} post`
        );
      }
    } catch (error) {
      console.error("Error during highlight toggle:", error);
      message.error(
        `An error occurred while ${
          shouldHighlight ? "highlighting" : "unhighlighting"
        } the post.`
      );
    }
  };

   

  const handleTabChange = (key) => {
    setActiveTab(key);
    form.resetFields();
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    // Client-side title search on the current list
    const data = utils.wildCardSearch(originalBannerData, value);
    const sorted = [...data].sort(
      (a, b) => (b?.selectedForHomeFeatured === true) - (a?.selectedForHomeFeatured === true)
    );
    setList(sorted);
  };

  const getMainTableColumns = () => [
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
            src={record?.thumbnail || "/img/avatars/default-avatar.jpg"}
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
      title: "Parent Category",
      dataIndex: "parentCategory",
      render: (_, record) =>
        record?.categories[0]?.parentCategory?.name || "Uncategorized",
    },
    {
      title: "Sub Category",
      dataIndex: "subCategory",
      render: (_, record) => record?.categories[0]?.name || "Uncategorized",
    },
    // Conditionally include Highlight column only when NOT on category page
    ...(activeTab === "article"
      ? []
      : [
          {
            title: "Highlight",
            dataIndex: "highlight",
            render: (_, record) => {
              const isHighlighted = record.selectedForHomeFeatured;
              return (
                <div>
                  <Tooltip
                    title={
                      isHighlighted
                        ? "Click to remove highlight"
                        : "Click to highlight this post"
                    }
                  >
                    <Switch
                      checked={isHighlighted}
                      onChange={(checked) =>
                        toggleHighlight(
                          record._id,
                          checked,
                          record?.language?._id || record?.language
                        )
                      } 
                      size="small"
                    />
                  </Tooltip>
                </div>
              );
            },
          },
        ]),
      // {
      //   title: "",
      //   dataIndex: "actions",
      //   render: (_, row) => (
      //     <button
      //       onClick={() =>
      //         navigate(`/admin/dashboards/articles/view-article/${row._id}`)
      //       }
      //       style={{
      //         border: "none",
      //         background: "#3e79f7",
      //         cursor: "pointer",
      //         color: "white",
      //         borderRadius: "5px",
      //       }}
      //       className="px-2 py-1"
      //     >
      //       <Flex alignItems="center">
      //         <EyeOutlined />
      //         <span className="ml-1">View Details</span>
      //       </Flex>
      //     </button>
      //   ),
      // },
  ];

  const getModalTableColumns = () => [
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
            src={record?.thumbnail || "/img/avatars/default-avatar.jpg"}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => (
        <div>
          <span>{record?.language?.name || "No Language"}</span>
          {!record?.language && (
            <div style={{ fontSize: "10px", color: "#f5222d" }}>
              Language required for highlighting
            </div>
          )}
        </div>
      ),
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
      title: "Select for featured",
      dataIndex: "select",
      render: (_, record) => (
        <div>
          <Tooltip
            title={
              record?.selectedForFeatured
                ? "Unselect from featured"
                : "Select as featured"
            }
          >
            <Switch
              checked={record?.selectedForFeatured || false}
              onChange={() => handleFeaturedSwitch(record)}
              size="small"
            />
          </Tooltip>
        </div>
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
                {/* Main table filters */}
                <Form form={form} layout="inline">
                  <Form.Item name="language" className="mr-md-3 mb-3">
                    <Select
                      placeholder="Language"
                      style={{ minWidth: 160 }}
                      allowClear
                      options={languages.map((l) => ({
                        label: l.name,
                        value: l._id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="ParentCategory" className="mr-md-3 mb-3">
                    <Select
                      placeholder={
                        selectedLanguage
                          ? "Parent Category"
                          : "Select language first"
                      }
                      style={{ minWidth: 180 }}
                      disabled={!selectedLanguage}
                      allowClear
                      options={filteredParentCategories.map((c) => ({
                        label: c.name,
                        value: c._id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="categories" className="mr-md-3 mb-3">
                    <Select
                      placeholder={
                        selectedParentCategory
                          ? "Sub Category"
                          : "Select parent first"
                      }
                      style={{ minWidth: 180 }}
                      disabled={!selectedParentCategory}
                      allowClear
                      options={filteredSubCategories.map((c) => ({
                        label: c.name,
                        value: c._id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item className="mr-md-3 mb-3">
                    <Input
                      placeholder="Search title"
                      prefix={<SearchOutlined />}
                      onChange={onSearch}
                      allowClear
                      style={{ minWidth: 220 }}
                    />
                  </Form.Item>
                </Form>
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
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} feature posts`,
                }}
              />
            </div>
          </TabPane>
        ))}
      </Tabs>

      {/* Modal for Managing Feature Content */}
      <Modal
        title={tabConfig[activeTab].modalTitle}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Update Featured Selections"
        cancelText="Cancel"
        width={"90%"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: "20px" }}>
          <Row gutter={[5, 1]}>
            {/* Language dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item label="Language" name="language">
                <Select
                  style={{ width: "100%" }}
                  placeholder="Select Language"
                  allowClear
                  options={languages.map((l) => ({
                    label: l.name,
                    value: l._id,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Parent Category dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item label="Parent Category" name="ParentCategory">
                <Select
                  style={{ width: "100%" }}
                  placeholder={
                    selectedLanguage
                      ? "Select a parent category"
                      : "Please select a language first"
                  }
                  disabled={!selectedLanguage}
                  allowClear
                  options={filteredParentCategories.map((c) => ({
                    label: c.name,
                    value: c._id,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Sub Category dropdown */}
            <Col xs={24} sm={12} md={12} lg={12} xl={4}>
              <Form.Item label="Sub Category" name="categories">
                <Select
                  style={{ width: "100%" }}
                  placeholder={
                    selectedParentCategory
                      ? "Select sub categories"
                      : "Please select a parent category first"
                  }
                  disabled={!selectedParentCategory}
                  allowClear
                  options={filteredSubCategories.map((c) => ({
                    label: c.name,
                    value: c._id,
                  }))}
                />
              </Form.Item>
            </Col>

            {/* Title */}
            <Col xs={24} sm={12} md={20} lg={20} xl={8}>
              <Form.Item name="title" label={"Title"}>
                <AntInput placeholder={`Enter title to search`} />
              </Form.Item>
            </Col>

            {/* Filter button */}
            <Col xs={8} sm={12} md={4} lg={4} xl={2}>
              <Form.Item label={labelContent}>
                <Button
                  onClick={handleFilter}
                  type="primary"
                  icon={<FilterOutlined />}
                  style={{ width: "100%" }}
                >
                  Find
                </Button>
              </Form.Item>
            </Col>

            {/* Clear Filters button */}
            <Col xs={8} sm={12} md={4} lg={4} xl={2}>
              <Form.Item
                label={<span style={{ visibility: "hidden" }}>Clear</span>}
              >
                <Button
                  onClick={handleClearFilters}
                  type="default"
                  icon={<ClearOutlined />}
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
              loading={modalLoading}
              rowKey="_id"
              locale={{
                emptyText:
                  filteredData.length === 0 && !modalLoading
                    ? "Select a language and click Find to load posts"
                    : undefined,
              }}
              pagination={{
                current: modalPagination.current,
                pageSize: modalPagination.pageSize,
                total: modalPagination.total,
                showSizeChanger: true,
                showQuickJumper: false,
                onChange: (page, pageSize) => fetchModalPage(page, pageSize),
                onShowSizeChange: (current, size) => fetchModalPage(1, size),
                showTotal: (total, range) =>
                  total > 0
                    ? `${range[0]}-${range[1]} of ${total} posts`
                    : "0 posts",
              }}
            />
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default FeaturedArticles;
