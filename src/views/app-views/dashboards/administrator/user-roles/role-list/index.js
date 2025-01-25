import React, {useEffect, useState} from 'react'
import { Card, Table, Input, Button, Menu } from 'antd';
import { EyeOutlined, DeleteOutlined, SearchOutlined, PlusCircleOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex'
import { useNavigate } from "react-router-dom";
import utils from 'utils'
import { useDispatch, useSelector } from 'react-redux';
import { deleteRole, fetchAllRoles } from 'store/slices/rolesSlice';
import EllipsisDropdown from 'components/shared-components/EllipsisDropdown';

const RoleList = () => {
	const navigate = useNavigate();
	const [list, setList] = useState([])
	const [selectedRows, setSelectedRows] = useState([])
	const [selectedRowKeys, setSelectedRowKeys] = useState([])

	// check it is in global state 
	const roles_list = useSelector((state) => state.roles.roles);
	const dispatch = useDispatch();
	useEffect(()=>{
		if (!roles_list.length) {
			dispatch(fetchAllRoles());
		}else{
			setList(roles_list);
		}
	},[roles_list , dispatch]);

	const dropdownMenu = row => (
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
					<span className="ml-2">{selectedRows.length > 0 ? `Delete (${selectedRows.length})` : 'Delete'}</span>
				</Flex>
			</Menu.Item>
		</Menu>
	);
	
	const addRole = () => {
		navigate(`/admin/dashboards/administrator/user-roles/add-role`)
	}
	
	const viewDetails = row => {
		navigate(`/admin/dashboards/administrator/user-roles/edit-role/${row._id}`)
	}
	
	const deleteRow = row => {
		const objKey = '_id'
		let data = list
		if(selectedRows.length > 1) {
			selectedRows.forEach(elm => {
				data = utils.deleteArrayRow(data, objKey, elm._id)
				setList(data)
				setSelectedRows([])
				// Need to dispatch the delete role
				dispatch(deleteRole({roleId : elm._id})); 
			})
		} else {
				// Need to dispatch the delete role 
				dispatch(deleteRole({roleId : row._id})); 
				data = utils.deleteArrayRow(data, objKey, row._id)
				setList(data)
		}
	}

	const tableColumns = [
		{
			title: 'ID',
			dataIndex: 'id',
			render: (_, record, index) => <span>{index + 1}</span>,
		},
    	{
			title: 'Role title',
			dataIndex: 'title'
		},
    	{
			title: 'Description',
			dataIndex: 'description'
		},
		{
			title: '',
			dataIndex: 'actions',
			render: (_, elm) => (
				<div className="text-right">
					<EllipsisDropdown menu={dropdownMenu(elm)}/>
				</div>
			)
		}
	];
	
	const rowSelection = {
		onChange: (key, rows) => {
			setSelectedRows(rows)
			setSelectedRowKeys(key)
		}
	};

	const onSearch = e => {
		const value = e.currentTarget.value
		const searchArray = e.currentTarget.value? list : []
		const data = utils.wildCardSearch(searchArray, value)
		setList(data)
		setSelectedRowKeys([])
	}

	return (
		<Card>
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<Flex className="mb-1" mobileFlex={false}>
					<div className="mr-md-3 mb-3">
						<Input placeholder="Search" prefix={<SearchOutlined />} onChange={e => onSearch(e)}/>
					</div>
				</Flex>
				<div>
					<Button onClick={addRole} type="primary" icon={<PlusCircleOutlined />} block>Add Role</Button>
				</div>
			</Flex>
			<div className="table-responsive">
				<Table 
					columns={tableColumns} 
					dataSource={list} 
					rowKey='id' 
					rowSelection={{
						selectedRowKeys: selectedRowKeys,
						type: 'checkbox',
						preserveSelectedRowKeys: false,
						...rowSelection,
					}}
				/>
			</div>
		</Card>
	)
}

export default RoleList
