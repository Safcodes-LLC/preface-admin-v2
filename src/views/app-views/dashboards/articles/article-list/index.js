import React, { useEffect, useState } from "react";
import { Card, Table, Input, Button, Menu, Tag, message } from "antd";
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
import utils from "utils";
import { useDispatch, useSelector } from "react-redux";
import { deletePost, fetchAllPostsByPostType } from "store/slices/postSlice";

const ArticleList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { posts, totalCount, totalPages, loading } = useSelector(
    (state) => state.post
  );

  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    dispatch(
      fetchAllPostsByPostType({
        postTypeId: "66d9d564987787d3e3ff1312",
        page: currentPage,
        limit: pageSize,
      })
    );
  }, [dispatch, currentPage, pageSize]);

  useEffect(() => {
    if (posts) {
      setList(posts);
    }
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

  const AddArticle = () => {
    navigate(`/admin/dashboards/articles/add-article`);
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/articles/edit-article/${row._id}`);
  };

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/articles/view-article/${row._id}`);
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
        dispatch(deletePost({ postId: elm._id })).then((res) => {
          console.log(res, "1");
        });
      });
    } else {
      dispatch(deletePost({ postId: row._id })).then((res) => {
        if (!res.error) {
          message.success("Deleted Successfully");
          data = utils.deleteArrayRow(data, objKey, row._id);
          setList(data);
        }
      });
    }
  };

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
    },
    {
      title: "Language",
      dataIndex: "language",
      render: (_, record) => record?.language?.name,
    },
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

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    const data = utils.wildCardSearch(posts, value);
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
            selectedRowKeys: selectedRowKeys,
            type: "checkbox",
            preserveSelectedRowKeys: false,
            ...rowSelection,
          }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} articles`,
          }}
        />
      </div>
    </Card>
  );
};

export default ArticleList;
