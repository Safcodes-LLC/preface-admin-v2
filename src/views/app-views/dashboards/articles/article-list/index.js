import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Input, Button, Menu, Tag, message, Select } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllLanguages } from "store/slices/languagesSlice";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";
import { fetchAllCategories } from "store/slices/categoriesSlice";
import AvatarStatus from "components/shared-components/AvatarStatus";

const { Option } = Select;

const ArticleList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // filters
  const [searchValue, setSearchValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // redux states
  const { posts, totalCount, loading } = useSelector((state) => state.post);
  const { languages, loading: languagesLoading } = useSelector(
    (state) => state.languages
  );
  const { categories, loading: categoriesLoading } = useSelector(
    (state) => state.categories
  );

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
        postTypeId: "66d9d564987787d3e3ff1312",
        page,
        limit: pageSize,
        search,
        language: languageFilter,
        category: categoryFilter,
      })
    );
  };

  // initial load
  useEffect(() => {
    dispatch(fetchAllLanguages());
    dispatch(fetchAllCategories({ page: 1, limit: 100 }));
    fetchPosts(1); // initial fetch
  }, [dispatch]);

  // update list whenever posts change
  useEffect(() => {
    if (posts) setList(posts);
  }, [posts]);

  // actions
  const AddArticle = () => navigate(`/admin/dashboards/articles/add-article`);
  const editDetails = (row) =>
    navigate(`/admin/dashboards/articles/edit-article/${row._id}`);
  const viewDetails = (row) =>
    navigate(`/admin/dashboards/articles/view-article/${row._id}`);

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

  // handlers: trigger fetch immediately
  const onSearch = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    setCurrentPage(1);
    fetchPosts(1, val, selectedLanguage, selectedCategory);
  };

  const onLanguageChange = (val) => {
    setSelectedLanguage(val);
    setSelectedCategory("all");
    setCurrentPage(1);
    fetchPosts(1, searchValue, val, "all");
  };

  const onCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
    fetchPosts(1, searchValue, selectedLanguage, val);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
    fetchPosts(page, searchValue, selectedLanguage, selectedCategory);
  };

  // table columns
  const tableColumns = [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => (
        <span>{(currentPage - 1) * pageSize + (index + 1)}</span>
      ),
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
          <AvatarStatus
            size={60}
            type="square"
            src={record.thumbnail}
            // name={record.name}
          />
        </div>
      ),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name,
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (_, record) =>
        record?.categories[0]?.parentCategory?.name +
        " / " +
        record?.categories[0]?.name,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => (
        <>
          <Tag color={record.status.includes("sendback") ? "red" : "green"}>
            {record.status}
          </Tag>
          {record.editingSession?.id && (
            <Tag color="grey">Edit in progress</Tag>
          )}
        </>
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

  const rowSelection = {
    onChange: (key, rows) => {
      setSelectedRows(rows);
      setSelectedRowKeys(key);
    },
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
          <Select
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
          </Select>
          <Button
            onClick={AddArticle}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add Article
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
            showTotal: (total) => `Total ${total} articles`,
          }}
        />
      </div>
    </Card>
  );
};

export default ArticleList;
