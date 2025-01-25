import React, { useEffect, useState } from "react";
import { Card, Table, Input, Button, Menu } from "antd";
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
import { deleteUser, fetchAllUsers } from "store/slices/userSlice";

const UserList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // check it is in global state
  const users_list = useSelector((state) => state.user.userList);
  const dispatch = useDispatch();
  dispatch(fetchAllUsers());
  useEffect(() => {
    if (!users_list.length) {
      dispatch(fetchAllUsers());
    } else {
      const filteredList = users_list.filter((user) =>
        user.roles.some(
          (role) =>
            role.title === "Administrator" || role.title === "Post Admin"
        )
      );
      setList(filteredList.reverse());
    }
  }, [users_list, dispatch]);

  // fetch users by using the users by role action

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

  const addUser = () => {
    navigate(`/admin/dashboards/users/add-admin-user`);
  };

  const viewDetails = (row) => {
    navigate(`/admin/dashboards/users/view-user/${row._id}`);
  };

  const editDetails = (row) => {
    navigate(`/admin/dashboards/users/edit-user/${row._id}`);
  };

  const deleteRow = (row) => {
    const objKey = "_id";
    let data = list;
    if (selectedRows.length > 1) {
      selectedRows.forEach((elm) => {
        data = utils.deleteArrayRow(data, objKey, elm._id);
        setList(data);
        setSelectedRows([]);
        // Need to dispatch the delete user
        dispatch(deleteUser({ userId: elm._id }));
      });
    } else {
      // Need to dispatch the delete user
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
      title: "User",
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
            name={record.name}
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
          {record.languages.map((obj, index) => {
            let comma = index !== record.languages.length - 1 ? ", " : " ";
            return obj.name + comma;
          })}
        </div>
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      render: (_, record) => (
        <div className="d-flex">
          {record.roles.map((obj, index) => {
            let comma = index !== record.roles.length - 1 ? ", " : " ";
            return obj.title + comma;
          })}
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
    const searchArray = e.currentTarget.value ? list : [];
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
            onClick={addUser}
            type="primary"
            icon={<PlusCircleOutlined />}
            block
          >
            Add User
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

export default UserList;
