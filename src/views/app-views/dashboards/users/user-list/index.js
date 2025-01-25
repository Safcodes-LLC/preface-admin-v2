import React, { useEffect, useState } from "react";
import { Card, Table, Input, Button, Menu, Select } from "antd";
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
import { fetchAllRoles } from "store/slices/rolesSlice";

const { Option } = Select;

const UserList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [list, setList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);

  // Check if it is in the global state
  const users_list = useSelector((state) => state.user.userList);
  const roles = useSelector((state) => state.roles.roles);

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  useEffect(() => {
    const filteredList = users_list.filter(
      (user) =>
        !user.roles.some(
          (role) =>
            role.title === "Administrator" || role.title === "Post Admin"
        )
    );
    setList(filteredList.reverse());
    console.log(filteredList, "Filtered User List");
  }, [users_list]);

  useEffect(() => {
    if (!roles.length) {
      dispatch(fetchAllRoles());
    }
  }, [dispatch, roles]);

  // useEffect(() => {
  //     dispatch(fetchAllUsers());
  //   if (!users_list.length) {
  //     dispatch(fetchAllUsers());
  //   } else {
  //     setList(users_list.slice().reverse());
  //   }
  // }, [users_list, dispatch]);

  const handleRoleChange = (value) => {
    setSelectedRole(value);

    // Filter the user list based on the selected role
    if (value) {
      const filteredUsers = users_list.filter((user) =>
        user.roles.some((role) => role.title === value)
      );
      setList(filteredUsers);
    } else {
      setList(users_list);
    }
    setSelectedRowKeys([]);
    setSearchQuery("");
  };

  const addUser = () => {
    navigate(`/admin/dashboards/users/add-user`);
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
    setSearchQuery(value);

    // Filter the user list based on the search query
    const filteredUsers = users_list.filter((user) => {
      return (
        user.username.toLowerCase().includes(value.toLowerCase()) ||
        user.name.toLowerCase().includes(value.toLowerCase())
      );
    });

    // Apply role filter if a role is selected
    if (selectedRole) {
      const roleFilteredUsers = filteredUsers.filter((user) =>
        user.roles.some((role) => role.title === selectedRole)
      );
      setList(roleFilteredUsers);
    } else {
      setList(filteredUsers);
    }

    setSelectedRowKeys([]);
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
          <Select
            placeholder="Filter by Role"
            style={{ width: 200 }}
            onChange={handleRoleChange}
            value={selectedRole}
          >
            <Option value={null}>All Roles</Option>
            {roles &&
              roles.map((role) => (
                <Option key={role.title} value={role.title}>
                  {role.title}
                </Option>
              ))}
          </Select>
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
