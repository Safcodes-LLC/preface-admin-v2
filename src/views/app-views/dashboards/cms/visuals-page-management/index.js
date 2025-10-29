import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  message,
  Form,
  Modal,
  Select,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  PlusCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import Flex from "components/shared-components/Flex";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import axios from "axios"; 
import CustomFormPopup from "./customFormPopup";

const { TabPane } = Tabs;

const FeaturedArticles = () => {
  const dispatch = useDispatch();
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("article");
  const [viewMode, setViewMode] = useState(false);

  // Watch form fields for reactive filtering
  const selectedLanguage = Form.useWatch("language", form);

  // Get categories and languages from Redux store
  const categories = useSelector((state) => state.categories.categories);
  const languages = useSelector((state) => state.languages.languages);

  const [list, setList] = useState([]); // Feature selected posts (filtered)
  const [originalBannerData, setOriginalBannerData] = useState([]); // Original feature data (unfiltered)

  // New state for language-specific highlighting
  const [selectedLanguageForHighlights, setSelectedLanguageForHighlights] =
    useState(null);

  // Tab configuration (only Visuals Page)
  const tabConfig = {
    article: {
      title: "Visual Management",
      icon: <FileTextOutlined />,
      addButtonText: "Add New Visual",
      addCustomButtonText: "Add New Visual",
      modalTitle: "Manage Visual Selection",
      modalTitleCustom: "Manage Visual",
      endpoint: "article",
      postTypeId: "66d9d564987787d3e3ff1312",
    },
  };

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

  // Fetch visuals for main table with filters
  const fetchMainFeaturedPosts = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const langCode = (() => {
        if (!selectedLanguage) return undefined;
        const l = languages.find((x) => x._id === selectedLanguage);
        return l?.code || undefined;
      })();
      const response = await axios.get(
        `https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params: { lang: langCode, page: 1, limit: 10 },
        }
      );
      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setOriginalBannerData(data);
      setList(data);
    } catch (error) {
      console.error("Error fetching visuals:", error);
      message.error("Failed to fetch visuals");
    }
  };

  // Fetch on tab or filter changes
  useEffect(() => {
    fetchMainFeaturedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLanguage]);

  // Helper function to refresh Visuals data
  const refreshBannerData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const langCode = (() => {
        if (!selectedLanguage) return undefined;
        const l = languages.find((x) => x._id === selectedLanguage);
        return l?.code || undefined;
      })();
      const response = await axios.get(
        `https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          params: { lang: langCode, page: 1, limit: 10 },
        }
      );
      const data = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setOriginalBannerData(data);
      setList(data);
    } catch (error) {
      console.error("Error fetching visuals:", error);
      message.error("Failed to fetch visuals");
    }
  };

  const AddCustomContent = () => {
    setSelectedRecord(null);
    setViewMode(false);
    setIsCustomModalVisible(true);
    form.resetFields();
  };

  // Removed Manage Featured Articles modal handlers

  const handleCustomCancel = () => {
    setIsCustomModalVisible(false);
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("auth_token");
      await axios.delete(
        `https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );
      message.success("Visual deleted");
      // If the currently opened record is deleted, close and reset the modal
      if (selectedRecord && selectedRecord._id === id) {
        setIsCustomModalVisible(false);
        setSelectedRecord(null);
      }
      await refreshBannerData();
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to delete visual");
    }
  };

  // Removed: highlight logic (not applicable for visuals)

  const handleTabChange = (key) => {
    setActiveTab(key);
    form.resetFields();
  };

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    // Client-side title search on the current list
    const data = utils.wildCardSearch(originalBannerData, value);
    setList(data);
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
      dataIndex: "image",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={record?.image || "/img/avatars/default-avatar.jpg"}
          />
        </div>
      ),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => {
        const lang = record?.language;
        if (!lang) return "No Language";
        if (typeof lang === "object" && lang?.name) return lang.name;
        const found = languages.find((l) => l._id === lang);
        return found?.name || "No Language";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => (record?.status ? "Active" : "Inactive"),
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "right",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record);
              setViewMode(true);
              setIsCustomModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedRecord(record);
              setViewMode(false);
              setIsCustomModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Removed: modal table columns (no selection modal)
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
                {/* Simplified filters: Language and Search */}
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
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  onClick={AddCustomContent}
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  block
                >
                  {config.addCustomButtonText}
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

      {/* Modal for Managing Custom Visual */}
      <Modal
        title={tabConfig[activeTab].modalTitleCustom}
        visible={isCustomModalVisible}
        width={"80%"}
        footer={null}
        onCancel={handleCustomCancel}
        destroyOnClose
      >
        <CustomFormPopup
          key={selectedRecord ? selectedRecord._id : "new"}
          record={selectedRecord}
          view={viewMode}
          onSuccess={async () => {
            setIsCustomModalVisible(false);
            setSelectedRecord(null);
            await refreshBannerData();
          }}
          onCancel={handleCustomCancel}
        />
      </Modal>
    </Card>
  );
};

export default FeaturedArticles;
