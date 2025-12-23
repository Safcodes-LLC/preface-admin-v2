import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Input, Button, Menu, Tag, Select, message } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { fetchAllCategories } from "store/slices/categoriesSlice";

const { Option } = Select;

const VideoList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const STORAGE_KEY = "videoListFilters";

  // Query param helpers using URLSearchParams
  const parseQuery = () => {
    const params = new URLSearchParams(location.search);
    return {
      searchValue: params.get("search") || "",
      selectedLanguage: params.get("lang") || "all",
      selectedCategory: params.get("cat") || "all",
      currentPage: params.get("page") ? parseInt(params.get("page"), 10) : 1,
    };
  };

  // Set initial state from query params
  const [searchValue, setSearchValue] = useState(parseQuery().searchValue);
  const [selectedLanguage, setSelectedLanguage] = useState(
    parseQuery().selectedLanguage
  );
  const [selectedCategory, setSelectedCategory] = useState(
    parseQuery().selectedCategory
  );
  const [currentPage, setCurrentPage] = useState(parseQuery().currentPage);
  const [pageSize] = useState(10);

  const updateQueryParams = (updates) => {
    const prev = parseQuery();
    const newParams = {
      ...prev,
      ...updates,
    };
    const paramMap = {
      search: newParams.searchValue,
      lang: newParams.selectedLanguage,
      cat: newParams.selectedCategory,
      page: newParams.currentPage,
    };
    const urlParams = new URLSearchParams();
    if (paramMap.search) urlParams.set("search", paramMap.search);
    if (paramMap.lang && paramMap.lang !== "all") urlParams.set("lang", paramMap.lang);
    if (paramMap.cat && paramMap.cat !== "all") urlParams.set("cat", paramMap.cat);
    if (paramMap.page && paramMap.page !== 1) urlParams.set("page", paramMap.page);
    navigate({ search: urlParams.toString() }, { replace: true });

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newParams));
    } catch (e) {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (!location.search) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedSaved = JSON.parse(saved);
          updateQueryParams(parsedSaved);
        }
      } catch (e) {
        // ignore storage errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const parsed = parseQuery();
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // redux states
  const { posts, totalCount, loading } = useSelector((state) => state.post);
  const { languages, loading: languagesLoading } = useSelector(
    (state) => state.languages
  );
  const { categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );

  // helper states for loaded
  const [langsLoaded, setLangsLoaded] = useState(false);
  const [catsLoaded, setCatsLoaded] = useState(false);

  useEffect(() => {
    if (!languagesLoading && languages && languages.length > 0) setLangsLoaded(true);
  }, [languagesLoading, languages]);
  useEffect(() => {
    if (!categoriesLoading && categories && categories.length > 0) setCatsLoaded(true);
  }, [categoriesLoading, categories]);

  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // available filters
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

  // helper: fetch posts with current filters
  const fetchPosts = (
    page = currentPage,
    search = searchValue,
    lang = selectedLanguage,
    cat = selectedCategory
  ) => {
    const languageFilter =
      lang === "all"
        ? ""
        : availableLanguages.find((l) => l._id === lang)?.name || "";

    const categoryFilter =
      cat === "all"
        ? ""
        : availableCategories.find((c) => c._id === cat)?._id || "";

    dispatch(
      fetchAllPostsByPostType({
        postTypeId: "66d9d564987787d3e3ff1314",
        page,
        limit: pageSize,
        search,
        language: languageFilter,
        category: categoryFilter,
      })
    );
  };

  // initial load (fetch lang/cat lists only)
  useEffect(() => {
    dispatch(fetchAllLanguages());
    dispatch(fetchAllCategories({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Only fetch posts when both languages & categories are loaded and location/search changes
  useEffect(() => {
    if (!langsLoaded || !catsLoaded) return;
    const parsed = parseQuery();
    setSearchValue(parsed.searchValue);
    setSelectedLanguage(parsed.selectedLanguage);
    setSelectedCategory(parsed.selectedCategory);
    setCurrentPage(parsed.currentPage);
    fetchPosts(
      parsed.currentPage,
      parsed.searchValue,
      parsed.selectedLanguage,
      parsed.selectedCategory
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, langsLoaded, catsLoaded]);

  // update list whenever posts change
  useEffect(() => {
    if (posts) setList(posts);
  }, [posts]);

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

  const AddVideo = () => {
    navigate(`/admin/dashboards/videos/add-video`);
  };

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/videos/view-video/${row._id}`);
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/videos/edit-video/${row._id}`);
  };

  const deleteRow = async (row) => {
    const idsToDelete =
      selectedRows.length > 0 ? selectedRows.map((r) => r._id) : [row._id];

    try {
      await Promise.all(
        idsToDelete.map((id) => dispatch(deletePost({ postId: id })))
      );
      message.success("Deleted Successfully");
      setList((prev) => prev.filter((item) => !idsToDelete.includes(item._id)));
      setSelectedRows([]);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error("Failed to delete");
    }
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
      ellipsis: false,
    },
    {
      title: "Image",
      dataIndex: "featuredImage",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus size={60} type="square" src={record.thumbnail} />
        </div>
      ),
    },
    // {
    //   title: "Author",
    //   dataIndex: "author",
    //   render: (_, record) => (
    //     <div className="d-flex">
    //       <AvatarStatus
    //         size={60}
    //         type="square"
    //         src={record.author.profile_pic || "/img/avatars/default-avatar.jpg"}
    //         name={record.author.username}
    //       />
    //     </div>
    //   ),
    //   sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    // },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name,
    },
    // {
    //   title: "Category",
    //   dataIndex: "category",
    //   render: (_, record) =>
    //     record?.categories?.[0]?.parentCategory?.name &&
    //     record?.categories?.[0]?.name
    //       ? `${record.categories[0].parentCategory.name} / ${record.categories[0].name}`
    //       : "",
    // },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => {
        return (
          <>
            <Tag color={record.status.includes("sendback") ? "red" : "green"}>
              {record.status}
            </Tag>
            {record.editingSession?.id && (
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

  const rowSelection = {
    onChange: (key, rows) => {
      setSelectedRows(rows);
      setSelectedRowKeys(key);
    },
  };

  // handlers: update state AND URL, triggering effect above
  const onSearch = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    setCurrentPage(1);
    updateQueryParams({
      searchValue: val,
      currentPage: 1,
    });
  };

  const onLanguageChange = (val) => {
    setSelectedLanguage(val);
    setSelectedCategory("all");
    setCurrentPage(1);
    updateQueryParams({
      selectedLanguage: val,
      selectedCategory: "all",
      currentPage: 1,
    });
  };

  const onCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
    updateQueryParams({
      selectedCategory: val,
      currentPage: 1,
    });
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
    updateQueryParams({
      currentPage: page,
    });
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
              onChange={onSearch}
              value={searchValue}
            />
          </div>
        </Flex>
        <div className="d-flex gap-2">
          <Select
            placeholder="Filter by language"
            value={selectedLanguage}
            onChange={onLanguageChange}
            loading={languagesLoading}
            style={{ width: 180, marginRight: 12 }}
          >
            {availableLanguages.map((language) => (
              <Option key={language._id} value={language._id}>
                {language.name}
              </Option>
            ))}
          </Select>
          {/* <Select
            placeholder="Filter by category"
            value={selectedCategory}
            onChange={onCategoryChange}
            loading={categoriesLoading}
            style={{ width: 180, marginRight: 12 }}
            dropdownMatchSelectWidth={false}
            dropdownStyle={{ width: "auto", minWidth: "180px" }}
            dropdownRender={(menu) => (
              <div style={{ width: "max-content" }}>{menu}</div>
            )}
          >
            {availableCategories.map((category) => (
              <Option key={category._id} value={category._id}>
                {category.name}
              </Option>
            ))}
          </Select> */}
          <Button
            onClick={AddVideo}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add Video
          </Button>
        </div>
      </Flex>
      <div className="table-responsive">
        <Table
          loading={loading}
          columns={tableColumns}
          dataSource={list}
          rowKey="_id"
          rowSelection={{
            selectedRowKeys,
            type: "checkbox",
            preserveSelectedRowKeys: false,
            ...rowSelection,
          }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            onChange: onPageChange,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} videos`,
          }}
        />
      </div>
    </Card>
  );
};

export default VideoList;
