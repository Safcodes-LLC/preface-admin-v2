import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  // Dropdown,
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
  // Space,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  // EditOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  // TagsOutlined,
  FilterOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
// import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
// import TextArea from "antd/es/input/TextArea";
import Dragger from "antd/es/upload/Dragger";
import axios from "axios";
import { API_BASE_URL } from "configs/AppConfig";

const { TabPane } = Tabs;

const Pages = () => {
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  
  const dispatch = useDispatch();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [customRow, setCustomRow] = useState(null);
  const [customAssets, setCustomAssets] = useState({
    customVideo: null,
    customVideoImage: null,
    customImage: null,
    customHorizontalImage: null,
    customVerticalImage: null,
    customBannerStatus: null,
    customVideoLink: null,
  });
  const [customFiles, setCustomFiles] = useState({
    customVideo: null,
    customVideoImage: null,
    customImage: null,
    customHorizontalImage: null,
    customVerticalImage: null,
  });
  const [customPreviews, setCustomPreviews] = useState({
    customVideo: null,
    customVideoImage: null,
    customImage: null,
    customHorizontalImage: null,
    customVerticalImage: null,
  });

  const revokePreviews = () => {
    try {
      Object.values(customPreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    } catch (_) {}
  };
  
  // Watch form fields for reactive filtering
  const selectedLanguage = Form.useWatch('language', form);
  const selectedParentCategory = Form.useWatch('ParentCategory', form);

  const navigate = useNavigate();
  
  // Get categories and languages from Redux store
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);
  
  const [list, setList] = useState([]); // Banner selected posts (filtered)
  const [originalBannerData, setOriginalBannerData] = useState([]); // Original banner data (unfiltered)
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [highlightedPosts, setHighlightedPosts] = useState([]); // Array for multiple highlights
  
  // New state for language-specific highlighting
  const [selectedLanguageForHighlights, setSelectedLanguageForHighlights] = useState(null);
  
  // Categories list from Redux
  const [categoriesList, setCategoriesList] = useState([]);
  
  // Filter states for modal (only keep non-form related states)
  const [filteredData, setFilteredData] = useState([]);
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

  // Article configuration
  const articleConfig = {
    title: "Article",
    icon: <FileTextOutlined />,
    addButtonText: "Manage Article Banner",
    modalTitle: "Manage Article Banner Selection",
    endpoint: "article",
    postTypeId: "66d9d564987787d3e3ff1312"
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
    if (categories && Array.isArray(categories) && categories.length > 0) {
      setCategoriesList(categories);
    } else {
      console.log('No categories available or invalid format');
      setCategoriesList([]);
    }
  }, [categories]);

  // Filter parent categories by language (same as GeneralField)
  const filteredParentCategories = categoriesList.filter((category) => {
    const hasNoParent = !category.parentCategory;
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    return hasNoParent && matchesLanguage;
  });

  // Filter subcategories by parent category and language (same as GeneralField concept)
  const filteredSubCategories = categoriesList.filter((category) => {
    const hasParent = category.parentCategory && (category.parentCategory._id === selectedParentCategory || category.parentCategory.id === selectedParentCategory);
    const matchesLanguage = selectedLanguage ? 
      (category.language?._id === selectedLanguage || category.language === selectedLanguage) : 
      true;
    
    return hasParent && matchesLanguage;
  });

  // Fetch banner data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await axios.get(`${API_BASE_URL}/banner/posts/banner-selected/${articleConfig.postTypeId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });

        if (response?.data?.status === "success") {
          const data = response.data.data || [];
          setOriginalBannerData(data);
        }
      } catch (error) {
        console.error("Error fetching banner data:", error);
        message.error("Failed to fetch banner data");
      }
    };

    fetchData();
  }, []);

  // New function to apply language filter to banner data
  const applyLanguageFilterToBannerData = React.useCallback((data, languageId) => {
    if (!languageId) {
      setList(data); // Show all if no language selected
      return;
    }
    
    const filteredData = data.filter(post => 
      post.language && post.language._id === languageId
    );
    setList(filteredData);
  }, []);

  // Apply language filter when language selection changes
  useEffect(() => {
    if (originalBannerData.length > 0) {
      applyLanguageFilterToBannerData(originalBannerData, selectedLanguageForHighlights);
    }
  }, [selectedLanguageForHighlights, originalBannerData, applyLanguageFilterToBannerData]);

  // Fetch highlighted posts when language changes
  useEffect(() => {
    if (selectedLanguageForHighlights) {
      const fetchHighlights = async () => {
        try {
          const token = localStorage.getItem("auth_token");
          let url = `${API_BASE_URL}/banner/posts/highlighted/${articleConfig.postTypeId}?languageId=${selectedLanguageForHighlights}`;
          
          const response = await axios.get(url, {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          });

          if (response?.data?.status === "success") {
            const posts = response.data.data;
            
            if (Array.isArray(posts)) {
              setHighlightedPosts(posts);
            } else if (posts && typeof posts === 'object') {
              setHighlightedPosts([posts]);
            } else {
              setHighlightedPosts([]);
            }
          } else {
            setHighlightedPosts([]);
          }
        } catch (error) {
          console.error("Error fetching highlighted posts:", error);
          setHighlightedPosts([]);
        }
      };
      
      fetchHighlights();
    } else {
      setHighlightedPosts([]);
    }
  }, [selectedLanguageForHighlights]);

  // Helper function to refresh banner data
  const refreshBannerData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(`${API_BASE_URL}/banner/posts/banner-selected/${articleConfig.postTypeId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (response?.data?.status === "success") {
        const data = response.data.data || [];
        setOriginalBannerData(data);
        applyLanguageFilterToBannerData(data, selectedLanguageForHighlights);
      }
    } catch (error) {
      console.error("Error fetching banner data:", error);
    }
  };

  // Helper function to refresh highlighted posts
  const refreshHighlightedPosts = async (languageId) => {
    if (!languageId) return;
    
    try {
      const token = localStorage.getItem("auth_token");
      let url = `${API_BASE_URL}/banner/posts/highlighted/${articleConfig.postTypeId}?languageId=${languageId}`;
      
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (response?.data?.status === "success") {
        const posts = response.data.data;
        
        if (Array.isArray(posts)) {
          setHighlightedPosts(posts);
        } else if (posts && typeof posts === 'object') {
          setHighlightedPosts([posts]);
        } else {
          setHighlightedPosts([]);
        }
      } else {
        setHighlightedPosts([]);
      }
    } catch (error) {
      console.error("Error fetching highlighted posts:", error);
      setHighlightedPosts([]);
    }
  };

  // Prepare modal on open: clear previous results and reset pagination; await user filters
  useEffect(() => {
    if (isModalVisible) {
      setFilteredData([]);
      setModalPagination({ current: 1, pageSize: 10, total: 0 });
      setModalFilters({ language: undefined, parentCategory: undefined, categories: [], title: "" });
    }
  }, [isModalVisible]);

  const dropdownMenu = (row) => (
    <Menu>
      <Menu.Item onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item onClick={() => manageDetails(row)}>
        <Flex alignItems="center">
          <UploadOutlined />
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
    setFilteredData([]); // Ensure no data is shown initially
  };

  const handleOk = async () => {
    try {
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
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setFilteredData([]); // Clear filtered data when closing modal
  };

  const handleCheckboxChange = (record) => {
    const selected = selectedRowKeys.includes(record._id)
      ? selectedRowKeys.filter((key) => key !== record._id)
      : [...selectedRowKeys, record._id];
    setSelectedRowKeys(selected);
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
      const params = {
        page: 1,
        limit: modalPagination.pageSize,
        sortBy: 'priority',
        languageId: languageValue,
        language: languageValue,
        parentCategoryId: categoryValue,
        parentCategory: categoryValue,
        category: Array.isArray(subCategoryValue) ? subCategoryValue : undefined,
        categoriesCsv: Array.isArray(subCategoryValue) ? subCategoryValue.join(',') : undefined,
        title: titleValue,
        search: titleValue,
      };

      const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${articleConfig.postTypeId}`, {
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
        setModalPagination({ current: p.page || 1, pageSize: p.limit || modalPagination.pageSize, total: p.total || 0 });
      } else {
        setFilteredData([]);
        setModalPagination({ current: 1, pageSize: modalPagination.pageSize, total: 0 });
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
      const params = {
        page,
        limit: pageSize,
        sortBy: 'priority',
        languageId: language,
        language,
        parentCategoryId: parentCategory,
        parentCategory,
        category: Array.isArray(categories) ? categories : undefined,
        categoriesCsv: Array.isArray(categories) ? categories.join(',') : undefined,
        title,
        search: title,
      };

      const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${articleConfig.postTypeId}`, {
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

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/articles/view-article/${row._id}`);
  };

  const removeFromBanner = async (row) => {
    try {
      await axios.put(`${API_BASE_URL}/banner/posts/${row._id}/toggle-banner-selection`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("auth_token"),
        },
        body: JSON.stringify({ selectedForBanner: false }),
      });
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

  const manageDetails = async (row) => {
    try {
      setCustomRow(row);
      setIsCustomModalVisible(true);
      setCustomLoading(true);
      const token = localStorage.getItem("auth_token");
      const res = await axios.get(`${API_BASE_URL}/banner/posts/custom-banner/${row._id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });
      const data = res?.data?.data || {};
      const rawStatus = (data.customBannerStatus !== undefined && data.customBannerStatus !== null)
        ? data.customBannerStatus
        : data.status;
      const normalizedStatus = typeof rawStatus === 'boolean'
        ? rawStatus
        : (String(rawStatus).toLowerCase() === 'active' || String(rawStatus).toLowerCase() === 'true'
            ? true
            : (String(rawStatus).toLowerCase() === 'deactivated' || String(rawStatus).toLowerCase() === 'false'
                ? false
                : null));
      setCustomAssets({
        customVideo: data.customVideo || null,
        customVideoImage: data.customVideoImage || null,
        customImage: data.customImage || null,
        customHorizontalImage: data.customHorizontalImage || null,
        customVerticalImage: data.customVerticalImage || null,
        customBannerStatus: normalizedStatus,
        customVideoLink: data.customVideoLink || data.videoLink || null,
      });
    } catch (e) {
      console.error("Failed to load custom banner:", e);
      message.error(e?.response?.data?.message || "Failed to load custom banner");
    } finally {
      setCustomLoading(false);
    }
  };

  const handleCustomCancel = () => {
    setIsCustomModalVisible(false);
    setCustomRow(null);
    revokePreviews();
    setCustomFiles({
      customVideo: null,
      customVideoImage: null,
      customImage: null,
      customHorizontalImage: null,
      customVerticalImage: null,
    });
    setCustomPreviews({
      customVideo: null,
      customVideoImage: null,
      customImage: null,
      customHorizontalImage: null,
      customVerticalImage: null,
    });
  };

  const handleCustomSubmit = async () => {
    if (!customRow?._id) {
      message.warning("No row selected");
      return;
    }
    // Required: status (boolean true/false allowed; only null/undefined invalid)
    if (customAssets.customBannerStatus === null || customAssets.customBannerStatus === undefined) {
      message.warning("Please select a status before saving");
      return;
    }
    // Validate per tab
    if (customAssets.customBannerStatus === null || customAssets.customBannerStatus === undefined) {
      message.warning("Please select a status before saving");
      return;
    }
    try {
      setCustomLoading(true);
      const token = localStorage.getItem("auth_token");
      const fd = new FormData();
      if (customFiles.customVideo) fd.append("customVideo", customFiles.customVideo);
      if (customFiles.customVideoImage) fd.append("customVideoImage", customFiles.customVideoImage);
      if (customFiles.customImage) fd.append("customImage", customFiles.customImage);
      if (customFiles.customHorizontalImage) fd.append("customHorizontalImage", customFiles.customHorizontalImage);
      if (customFiles.customVerticalImage) fd.append("customVerticalImage", customFiles.customVerticalImage);
      if (customAssets.customBannerStatus !== null && customAssets.customBannerStatus !== undefined) {
        fd.append("customBannerStatus", customAssets.customBannerStatus);
      }
      if (customAssets.customVideoLink) {
        fd.append("customVideoLink", (customAssets.customVideoLink ?? ""));
      }

      await axios.put(`${API_BASE_URL}/banner/posts/custom-banner/${customRow._id}`,
        fd,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      message.success("Custom banner updated");
      setIsCustomModalVisible(false);
      setCustomRow(null);
      revokePreviews();
      setCustomPreviews({
        customVideo: null,
        customVideoImage: null,
        customImage: null,
        customHorizontalImage: null,
        customVerticalImage: null,
      });
      await refreshBannerData();
    } catch (e) {
      console.error("Failed to update custom banner:", e);
      const msg = e?.response?.data?.message || e?.message || "Failed to update";
      message.error(msg);
    } finally {
      setCustomLoading(false);
    }
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
      title: "Select for Banner",
      dataIndex: "select",
      render: (_, record) => (
        <Checkbox
          checked={selectedRowKeys.includes(record._id)}
          onChange={() => handleCheckboxChange(record)}
        />
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
                  setList(originalBannerData);
                }
              }}
            >
              {languages.map((lang) => (
                <Select.Option key={lang._id} value={lang._id}>
                  {lang.name}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Flex>
        <div>
          <Button
            onClick={AddContent}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            {articleConfig.addButtonText}
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

      {/* Modal for Managing Banner Content */}
      <Modal
        title={articleConfig.modalTitle}
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

      {/* Modal for Managing Custom Banner Assets */}
      <Modal
        title="Manage Custom Banner"
        visible={isCustomModalVisible}
        onOk={handleCustomSubmit}
        onCancel={handleCustomCancel}
        okText={customLoading ? "Saving..." : "Save"}
        cancelText="Cancel"
        confirmLoading={customLoading}
        width={720}
      >
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item label="Status">
                <Select
                  placeholder="Select status"
                  value={customAssets.customBannerStatus ?? undefined}
                  onChange={(val) =>
                    setCustomAssets((p) => ({ ...p, customBannerStatus: val }))
                  }
                  options={[
                    { label: "Active", value: true },
                    { label: "Deactivated", value: false },
                  ]}
                  allowClear
                  style={{ maxWidth: 240 }}
                />
              </Form.Item>
            </Col>
            
            {(
              <>
                <Col xs={24} md={12}>
                  <Form.Item label="Custom Image (600x600)">
                    <Dragger
                      multiple={false}
                      beforeUpload={() => false}
                      accept="image/*"
                      onChange={(info) => {
                        const f = info?.file?.originFileObj || info?.file;
                        setCustomFiles((p) => ({ ...p, customImage: f }));
                        if (f) {
                          setCustomPreviews((p) => ({ ...p, customImage: URL.createObjectURL(f) }));
                        }
                      }}
                    >
                      {customPreviews.customImage ? (
                        <img src={customPreviews.customImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : customAssets.customImage ? (
                        <img src={customAssets.customImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : (
                        <div>Click or drag image</div>
                      )}
                    </Dragger>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Custom Horizontal Image (630x240)">
                    <Dragger
                      multiple={false}
                      beforeUpload={() => false}
                      accept="image/*"
                      onChange={(info) => {
                        const f = info?.file?.originFileObj || info?.file;
                        setCustomFiles((p) => ({ ...p, customHorizontalImage: f }));
                        if (f) {
                          setCustomPreviews((p) => ({ ...p, customHorizontalImage: URL.createObjectURL(f) }));
                        }
                      }}
                    >
                      {customPreviews.customHorizontalImage ? (
                        <img src={customPreviews.customHorizontalImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : customAssets.customHorizontalImage ? (
                        <img src={customAssets.customHorizontalImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : (
                        <div>Click or drag image</div>
                      )}
                    </Dragger>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Custom Vertical Image (300x380)">
                    <Dragger
                      multiple={false}
                      beforeUpload={() => false}
                      accept="image/*"
                      onChange={(info) => {
                        const f = info?.file?.originFileObj || info?.file;
                        setCustomFiles((p) => ({ ...p, customVerticalImage: f }));
                        if (f) {
                          setCustomPreviews((p) => ({ ...p, customVerticalImage: URL.createObjectURL(f) }));
                        }
                      }}
                    >
                      {customPreviews.customVerticalImage ? (
                        <img src={customPreviews.customVerticalImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : customAssets.customVerticalImage ? (
                        <img src={customAssets.customVerticalImage} alt="preview" style={{ maxWidth: '100%' }} />
                      ) : (
                        <div>Click or drag image</div>
                      )}
                    </Dragger>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default Pages;