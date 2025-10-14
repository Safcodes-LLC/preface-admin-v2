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
  Space,
  Tooltip,
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
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import TextArea from "antd/es/input/TextArea";
import Dragger from "antd/es/upload/Dragger";
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";

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
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);
  
  const [list, setList] = useState([]); // Banner selected posts (filtered)
  const [originalBannerData, setOriginalBannerData] = useState([]); // Original banner data (unfiltered)
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [highlightedPosts, setHighlightedPosts] = useState([]); // Array for multiple highlights
  const [contentData, setContentData] = useState({
    video: [],
    article: [],
    topics: []
  });
  
  // New state for language-specific highlighting
  const [selectedLanguageForHighlights, setSelectedLanguageForHighlights] = useState(null);
  const [highlightStats, setHighlightStats] = useState({});
  
  // Categories list from Redux
  const [categoriesList, setCategoriesList] = useState([]);
  
  // Filter states for modal (only keep non-form related states)
  const [filteredData, setFilteredData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [bannerStatusChanges, setBannerStatusChanges] = useState({});
  const [allPosts, setAllPosts] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalPagination, setModalPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalFilters, setModalFilters] = useState({ language: undefined, parentCategory: undefined, categories: [], title: "" });

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
    // topics: {
    //   title: "Topics",
    //   icon: <TagsOutlined />,
    //   addButtonText: "Manage Topic Banner",
    //   modalTitle: "Manage Topic Banner Selection",
    //   endpoint: "topics",
    //   postTypeId: "66d9d564987787d3e3ff1313"
    // }
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
      console.log('Fetching all categories');
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
      const englishLang = languages.find(lang => 
        lang.name.toLowerCase().includes('english') || 
        lang.code === 'en' ||
        lang.code === 'eng'
      );
      if (englishLang) {
        setSelectedLanguageForHighlights(englishLang._id);
      }
    }
  }, [languages, selectedLanguageForHighlights]);

  // Update categories list when Redux state changes
  useEffect(() => {
    // console.log('Categories from Redux:', categories);
    // console.log('Categories from Redux length:', categories?.length || 0);
    // console.log('Categories from Redux type:', typeof categories);
    // console.log('Is array?', Array.isArray(categories));
    
    if (categories && Array.isArray(categories) && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      console.log('No categories available or invalid format');
      setCategoriesList([]);
    }
  }, [categories]);

  // Filter parent categories by language (same as GeneralField)
  const filteredParentCategories = categoriesList.filter((category) => {
    // console.log(category,'cat test - category item');
    
    const hasNoParent = !category.parentCategory;
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    // console.log('Parent Category Filter:', {
    //   categoryName: category.name,
    //   hasNoParent,
    //   categoryLanguage: category.language,
    //   selectedLanguage,
    //   matchesLanguage,
    //   willShow: hasNoParent && matchesLanguage
    // });
    
    return hasNoParent && matchesLanguage;
  });

  // Filter subcategories by parent category and language (same as GeneralField concept)
  const filteredSubCategories = categoriesList.filter((category) => {
    // console.log(selectedParentCategory,'selectedParentCategory');
    
    const hasParent = category.parentCategory && (category.parentCategory._id === selectedParentCategory || category.parentCategory.id === selectedParentCategory);
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    // console.log(category,'sub test coming');
    
    // console.log('Sub Category Filter:', {
    //   categoryName: category.name,
    //   hasParent,
    //   parentCategoryId: category.parentCategory?._id,
    //   selectedParentCategory,
    //   matchesLanguage,
    //   willShow: hasParent && matchesLanguage
    // });
    
    return hasParent && matchesLanguage;
  });

  // console.log('FILTERING DEBUG:', {
  //   categoriesListLength: categoriesList.length,
  //   selectedLanguage,
  //   selectedParentCategory,
  //   filteredParentCategoriesLength: filteredParentCategories.length,
  //   filteredSubCategoriesLength: filteredSubCategories.length,
  //   activeTab
  // });

  // Fetch banner data when tab changes
  useEffect(() => {
    const fetchData = async () => {
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
          setOriginalBannerData(data); // Store original data
          // Apply language filter immediately if one is selected
          applyLanguageFilterToBannerData(data, selectedLanguageForHighlights);
        }
      } catch (error) {
        console.error("Error fetching banner data:", error);
        message.error("Failed to fetch banner data");
      }
    };

    fetchData();
  }, [activeTab]);

  // New function to apply language filter to banner data
  const applyLanguageFilterToBannerData = (data, languageId) => {
    if (!languageId) {
      setList(data); // Show all if no language selected
      return;
    }
    
    const filteredData = data.filter(post => 
      post.language && post.language._id === languageId
    );
    setList(filteredData);
  };

  // Apply language filter when language selection changes
  useEffect(() => {
    if (originalBannerData.length > 0) {
      applyLanguageFilterToBannerData(originalBannerData, selectedLanguageForHighlights);
    }
  }, [selectedLanguageForHighlights, originalBannerData]);

  // Fetch highlighted posts when language changes (separate effect)
  useEffect(() => {
    if (selectedLanguageForHighlights && activeTab) {
      const fetchHighlights = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          const postTypeId = tabConfig[activeTab].postTypeId;
          
          let url = `${API_BASE_URL}/banner/posts/highlighted/${postTypeId}?languageId=${selectedLanguageForHighlights}`;
          
          const response = await axios.get(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          });

          if (response?.data?.status === "success") {
            const posts = response.data.data;
            const stats = response.data.details || {};
            const languageBreakdown = response.data.languageBreakdown || [];
            
            if (Array.isArray(posts)) {
              setHighlightedPosts(posts);
            } else if (posts && typeof posts === 'object') {
              setHighlightedPosts([posts]);
            } else {
              setHighlightedPosts([]);
            }

            setHighlightStats({
              ...stats,
              languageBreakdown
            });
          } else {
            setHighlightedPosts([]);
            setHighlightStats({});
          }
        } catch (error) {
          console.error("Error fetching highlighted posts:", error);
          setHighlightedPosts([]);
          setHighlightStats({});
        }
      };
      
      fetchHighlights();
    } else {
      // Clear highlighted posts if no language selected
      setHighlightedPosts([]);
      setHighlightStats({});
    }
  }, [selectedLanguageForHighlights, activeTab]);

  // Helper function to refresh banner data
  const refreshBannerData = async () => {
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
        setOriginalBannerData(data);
        applyLanguageFilterToBannerData(data, selectedLanguageForHighlights);
      }
    } catch (error) {
      console.error("Error fetching banner data:", error);
      message.error("Failed to fetch banner data");
    }
  };

  // Helper function to refresh highlighted posts
  const refreshHighlightedPosts = async (languageId) => {
    if (!languageId) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      
      let url = `${API_BASE_URL}/banner/posts/highlighted/${postTypeId}?languageId=${languageId}`;
      
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (response?.data?.status === "success") {
        const posts = response.data.data;
        const stats = response.data.details || {};
        const languageBreakdown = response.data.languageBreakdown || [];
        
        if (Array.isArray(posts)) {
          setHighlightedPosts(posts);
        } else if (posts && typeof posts === 'object') {
          setHighlightedPosts([posts]);
        } else {
          setHighlightedPosts([]);
        }

        setHighlightStats({
          ...stats,
          languageBreakdown
        });
      } else {
        setHighlightedPosts([]);
        setHighlightStats({});
      }
    } catch (error) {
      console.error("Error fetching highlighted posts:", error);
      setHighlightedPosts([]);
      setHighlightStats({});
    }
  };

  // Prepare modal on open: clear previous results and reset pagination; await user filters
  useEffect(() => {
    if (isModalVisible) {
      setFilteredData([]);
      setModalPagination({ current: 1, pageSize: 10, total: 0 });
      setModalFilters({ language: undefined, parentCategory: undefined, categories: [], title: "" });
    }
  }, [isModalVisible, activeTab]);

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
    setFilteredData([]); // Ensure no data is shown initially
    
    // Don't auto-set the modal language dropdown to avoid infinite loops
    // Let user select language manually in the modal
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
      await refreshBannerData();
      if (selectedLanguageForHighlights) {
        await refreshHighlightedPosts(selectedLanguageForHighlights);
      }
      
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
    setFilteredData([]); // Clear filtered data when closing modal
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

  // Clear all filters and show no data (user must select language and filter)
  const handleClearFilters = () => {
    form.resetFields();
    setFilteredData([]); // Clear data - user must select language and filter again
    setModalPagination({ current: 1, pageSize: modalPagination.pageSize, total: 0 });
    setModalFilters({ language: undefined, parentCategory: undefined, categories: [], title: "" });
  };

  const handleFilter = async () => {
    const languageValue = form.getFieldValue('language');
    const categoryValue = form.getFieldValue('ParentCategory');
    const subCategoryValue = form.getFieldValue('categories');
    const titleValue = form.getFieldValue('title');

    if (!languageValue) {
      message.warning("Please select a language first");
      return;
    }

    setModalLoading(true);
    setModalFilters({
      language: languageValue,
      parentCategory: categoryValue,
      categories: subCategoryValue || [],
      title: titleValue || "",
    });

    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      const page = 1;
      const limit = modalPagination.pageSize;
console.log("languageValue===",languageValue);

      const params = {
        page,
        limit,
        sortBy: 'priority',
        languageId: languageValue,
        language: languageValue,
        parentCategoryId: categoryValue,
        parentCategory: categoryValue,
        categories: Array.isArray(subCategoryValue) ? subCategoryValue : undefined,
        categoriesCsv: Array.isArray(subCategoryValue) ? subCategoryValue.join(',') : undefined,
        title: titleValue,
        search: titleValue,
      };

      console.log('Banner manage filter params:', params);
      const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${postTypeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        params,
        paramsSerializer: (params) => {
          const q = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
              q.set(key, value.join(','));
            } else {
              q.set(key, String(value));
            }
          });
          return q.toString();
        }
      });

      if (response?.data?.status === 'success') {
        const payload = response.data;
        const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.docs) ? payload.docs : [];
        const p = payload.pagination || {};
        setFilteredData(items);
        setModalPagination({ current: p.page || page, pageSize: p.limit || limit, total: p.total || 0 });
      } else {
        setFilteredData([]);
        setModalPagination({ current: 1, pageSize: limit, total: 0 });
      }
    } catch (err) {
      console.error('Error filtering posts:', err?.response || err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to fetch filtered posts';
      message.error(serverMsg);
      setFilteredData([]);
      setModalPagination({ current: 1, pageSize: modalPagination.pageSize, total: 0 });
    } finally {
      setModalLoading(false);
    }
  };

  const fetchModalPage = async (page, pageSize) => {
    const { language, parentCategory, categories, title } = modalFilters;
    if (!language) return;
    setModalLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const postTypeId = tabConfig[activeTab].postTypeId;
      const params = {
        page,
        limit: pageSize,
        sortBy: 'priority',
        languageId: language,
        language,
        parentCategoryId: parentCategory,
        parentCategory,
        categories: Array.isArray(categories) ? categories : undefined,
        categoriesCsv: Array.isArray(categories) ? categories.join(',') : undefined,
        title,
        search: title,
      };

      const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${postTypeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        params,
        paramsSerializer: (params) => {
          const q = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
              q.set(key, value.join(','));
            } else {
              q.set(key, String(value));
            }
          });
          return q.toString();
        }
      });

      if (response?.data?.status === 'success') {
        const payload = response.data;
        const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.docs) ? payload.docs : [];
        const p = payload.pagination || {};
        setFilteredData(items);
        setModalPagination({ current: p.page || page, pageSize: p.limit || pageSize, total: p.total || 0 });
      }
    } catch (err) {
      console.error('Error fetching modal page:', err?.response || err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Failed to fetch posts page';
      message.error(serverMsg);
    } finally {
      setModalLoading(false);
    }
  };

  // Updated function to handle toggling the highlight status
  const toggleHighlight = async (postId, shouldHighlight) => {
    try {
      const result = await toggleHighlightAPI(postId, shouldHighlight);
      
      if (result.status === "success") {
        // Show detailed message about language-specific highlighting
        message.success(result.message);
        
        // Refresh data to ensure proper state
        await refreshBannerData();
        if (selectedLanguageForHighlights) {
          await refreshHighlightedPosts(selectedLanguageForHighlights);
        }
        
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
      await refreshBannerData();
      if (selectedLanguageForHighlights) {
        await refreshHighlightedPosts(selectedLanguageForHighlights);
      }
      
    } catch (error) {
      message.error("Failed to remove post from banner");
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    setHighlightedPosts([]);
    setHighlightStats({});
    
    // Keep the current language selection instead of resetting
    // The useEffect will handle fetching data for the new tab
    
    form.resetFields();
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    // Apply search on the already language-filtered data
    const searchArray = value ? list : (selectedLanguageForHighlights ? 
      originalBannerData.filter(post => post.language && post.language._id === selectedLanguageForHighlights) :
      originalBannerData
    );
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
        // Check if this post is highlighted
        const isHighlighted = Array.isArray(highlightedPosts) && 
          highlightedPosts.some(post => post._id === record._id);
        
        return (
          <div>
            <Tooltip 
              title={
                !record.selectedForBanner 
                  ? "Post must be selected for banner first" 
                  : !record.language 
                  ? "Post must have a language assigned"
                  : isHighlighted 
                  ? "Click to remove highlight"
                  : "Click to highlight this post"
              }
            >
              <Switch
                checked={isHighlighted}
                onChange={(checked) => toggleHighlight(record._id, checked)}
                disabled={!record.selectedForBanner || !record.language}
                size="small"
              />
            </Tooltip>
          </div>
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
            <div style={{ fontSize: '10px', color: '#f5222d' }}>
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
                {/* Language filter for highlights - inline with search */}
                <div className="mr-md-3 mb-3">
                  <Select
                    style={{ width: 200 }}
                    placeholder="Select language"
                    allowClear
                    value={selectedLanguageForHighlights}
                    onChange={(value) => {
                      setSelectedLanguageForHighlights(value);
                      if (!value) {
                        setHighlightedPosts([]);
                        setHighlightStats({});
                        setList(originalBannerData);
                      }
                    }}
                    options={languages.map(l => ({ label: l.name, value: l._id }))}
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
                  options={languages.map(l => ({ label: l.name, value: l._id }))}
                />
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
                  options={filteredParentCategories.map(c => ({ label: c.name, value: c._id }))}
                />
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
                  options={filteredSubCategories.map(c => ({ label: c.name, value: c._id }))}
                />
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
                  icon={<FilterOutlined />}
                  style={{ width: "100%" }}
                >
                  Find
                </Button>
              </Form.Item>
            </Col>

            {/* Clear Filters button */}
            <Col xs={8} sm={12} md={4} lg={4} xl={2}>
              <Form.Item label={<span style={{ visibility: "hidden" }}>Clear</span>}>
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
                emptyText: filteredData.length === 0 && !modalLoading
                  ? "Select a language and click Find to load posts"
                  : undefined
              }}
              pagination={{
                current: modalPagination.current,
                pageSize: modalPagination.pageSize,
                total: modalPagination.total,
                showSizeChanger: true,
                showQuickJumper: false,
                onChange: (page, pageSize) => fetchModalPage(page, pageSize),
                onShowSizeChange: (current, size) => fetchModalPage(1, size),
                showTotal: (total, range) => total > 0 ? `${range[0]}-${range[1]} of ${total} posts` : "0 posts",
              }}
            />
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default Banner;