import React, { useEffect, useState } from "react";
import { Card, Table, Input, Button, Menu } from "antd";
import AuthorListData from "assets/data/author-list.data.json";
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
import { fetchUsersByRole, deleteUser } from "store/slices/userSlice";

const AuthorList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  
  // check it is in global state
  const authors_list = useSelector((state) => state.user.userList);

  const dispatch = useDispatch();
  // useEffect(() => {
  //   if (!authors_list.length) {
  //     dispatch(fetchUsersByRole({ roleId: "66d9ff16e8202c00309cf0ec" }));
  //   } else {
  //     setList(authors_list.slice().reverse());
  //   }
  // }, [authors_list]);

  useEffect(() => {
    const reversedList = [...authors_list].reverse();
    setList(reversedList);
  }, [authors_list]);

  useEffect(() => {
    dispatch(fetchUsersByRole({ roleId: "66d9ff16e8202c00309cf0ec" }));
  }, [dispatch]);

  // fetch authors by using the users by role action

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

  const addAuthor = () => {
    navigate(`/admin/dashboards/authors/add-author`);
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/authors/edit-author/${row._id}`);
  };

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/authors/view-author/${row._id}`);
  };

  const deleteRow = (row) => {
    const objKey = "_id";
    let data = list;
    if (selectedRows.length > 1) {
      selectedRows.forEach((elm) => {
        data = utils.deleteArrayRow(data, objKey, elm._id);
        setList(data);
        setSelectedRows([]);
        // Need to dispatch the delete author
        dispatch(deleteUser({ userId: elm._id }));
      });
    } else {
      // Need to dispatch the delete author
      dispatch(deleteUser({ userId: row._id }));
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
      title: "Username",
      dataIndex: "username",
    },
    {
      title: "Author",
      dataIndex: "name",
      render: (_, record) => (
        <div className="d-flex">
          <AvatarStatus
            size={60}
            type="square"
            src={
              record.profile_pic
                ? record.profile_pic
                : "/img/avatars/default-avatar.jpg"
            }
            name={record?.name}
          />
        </div>
      ),
      sorter: (a, b) => utils.antdTableSorter(a, b, "name"),
    },
    {
      title: "Languages",
      dataIndex: "languages",
      render: (_, record) => (
        <div className="d-flex">
          {record.languages.map((obj) => obj.name + " ")}
        </div>
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

  const onSearch = (e) => {
    const value = e.currentTarget.value;
    const searchArray = e.currentTarget.value ? list : AuthorListData;
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
            onClick={addAuthor}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add Author
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

export default AuthorList;
