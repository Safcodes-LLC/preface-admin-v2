import React, { useEffect, useState } from "react";
import { Card, Table, Input, Button, Menu } from "antd";
import CategoriesListData from "assets/data/categories-list.data.json";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import AvatarStatus from "components/shared-components/AvatarStatus";
import EllipsisDropdown from "components/shared-components/EllipsisDropdown";
import Flex from "components/shared-components/Flex";
import { useNavigate } from "react-router-dom";
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategory,
  fetchAllCategoriesByPostType,
} from "store/slices/categoriesSlice";

const ArticlesCategoriesList = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    // Dispatch the action to fetch categories data
    dispatch(
      fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1312" })
    );
  }, [dispatch]);

  const navigate = useNavigate();
  const categoriesListOfArticles = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  const [list, setList] = useState(categoriesListOfArticles);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    setList(categoriesListOfArticles);
  }, [categoriesListOfArticles]);

  const dropdownMenu = (row) => (
    <Menu>
      <Menu.Item onClick={() => viewDetails(row)}>
        <Flex alignItems="center">
          <EyeOutlined />
          <span className="ml-2">View Details</span>
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

  const addCategory = () => {
    navigate(`/admin/dashboards/categories/add-category`);
  };

  const viewDetails = (row) => {
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
    // {
    // 	title: 'icon',
    // 	dataIndex: 'icon',
    // 	render: (_, record) => (
    // 		<div className="d-flex">
    // 			<AvatarStatus size={60} type="square" src={record.icon} name={record.name}/>
    // 		</div>
    // 	),
    // },
    {
      title: "Image",
      dataIndex: "featuredImage",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={record.featuredImage}
            name={record.name}
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
    const searchArray = e.currentTarget.value ? list : CategoriesListData;
    const data = utils.wildCardSearch(searchArray, value);
    setList(data);
    setSelectedRowKeys([]);
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

export default ArticlesCategoriesList;
