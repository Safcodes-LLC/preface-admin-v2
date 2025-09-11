import React, { useEffect, useState, useMemo } from "react";
import { Card, Table, Input, Button, Menu, Select } from "antd";
import CategoriesListData from "assets/data/categories-list.data.json";
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
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategory,
  fetchAllCategories,
} from "store/slices/categoriesSlice";

const { Option } = Select;

const CategoriesList = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    // Dispatch the action to fetch all categories data
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const navigate = useNavigate();
  const categoriesListOfArticles = useSelector(
    (state) => state.categories.categories
  );

  const [list, setList] = useState(categoriesListOfArticles);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [searchValue, setSearchValue] = useState("");

  // Get unique languages from the data
  const availableLanguages = useMemo(() => {
    const languages = new Set();
    categoriesListOfArticles.forEach(item => {
      const languageName = item?.language?.name || "No Language";
      languages.add(languageName);
    });
    return Array.from(languages).sort();
  }, [categoriesListOfArticles]);

  // Filter data based on language and search
  useEffect(() => {
    let filteredData = categoriesListOfArticles;
    
    // Filter by language
    if (selectedLanguage && selectedLanguage !== "All Languages") {
      filteredData = filteredData.filter(item => {
        const itemLanguage = item?.language?.name || "No Language";
        return itemLanguage === selectedLanguage;
      });
    }
    
    // Filter by search value
    if (searchValue) {
      filteredData = utils.wildCardSearch(filteredData, searchValue);
    }
    
    setList(filteredData);
    setSelectedRowKeys([]);
  }, [categoriesListOfArticles, selectedLanguage, searchValue]);

  const dropdownMenu = (row) => (
    <Menu>
      <Menu.Item key="view" onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item key="edit" onClick={() => editDetails(row)}>
        <Flex alignItems="center">
          <EditOutlined />
          <span className="ml-2">Edit Details</span>
        </Flex>
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => deleteRow(row)}>
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

  const addCategory = () => {
    navigate(`/admin/dashboards/categories/add-category`);
  };

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/categories/view-category/${row._id}`);
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/categories/edit-category/${row._id}`);
  };

  const deleteRow = (row) => {
    const objKey = "_id";
    let data = list;
    if (selectedRows.length > 1) {
      selectedRows.forEach((elm) => {
        data = utils.deleteArrayRow(data, objKey, elm._id);
        setList(data);
        setSelectedRows([]);
        // Need to dispatch the delete category
        dispatch(deleteCategory({ categoryId: elm._id }));
      });
    } else {
      dispatch(deleteCategory({ categoryId: row._id }));
      data = utils.deleteArrayRow(data, objKey, row._id);
      setList(data);
    }
  };

  const tableColumns = [
    {
      title: "ID",
      dataIndex: "_id",
      render: (_, record, index) => <span>{index + 1}</span>,
    },
    {
      title: "Category Name",
      dataIndex: "name",
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Image",
      dataIndex: "featuredImage",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={record.featuredImage}
            // name={record.name}
          />
        </div>
      ),
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) =>
        record?.language ? record.language.name : "No Language",
    },
    {
      title: "Parent Category",
      dataIndex: "parentCategory",
      render: (parentCategory) =>
        parentCategory ? parentCategory.name : "No Parent",
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

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    setSearchValue(value);
  };

  const onLanguageChange = (value) => {
    setSelectedLanguage(value);
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
              style={{ width: 200 }}
            />
          </div>
        </Flex>
        <div className="d-flex  gap-2">
          <Select
            placeholder="Filter by Language"
            value={selectedLanguage}
            onChange={onLanguageChange}
            style={{ width: 180, marginRight: 12 }}
          >
            <Option value="All Languages">All Languages</Option>
            {availableLanguages.map(language => (
              <Option key={language} value={language}>
                {language}
              </Option>
            ))}
          </Select>
          <Button
            onClick={addCategory}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add Category
          </Button>
        </div>
      </Flex>
      <div className="table-responsive">
        <Table
          columns={tableColumns}
          dataSource={list}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedRowKeys,
            type: "checkbox",
            preserveSelectedRowKeys: false,
            ...rowSelection,
          }}
        />
      </div>
    </Card>
  );
};

export default CategoriesList;