import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Form, message, Button, Tooltip } from 'antd';
import { SearchOutlined, HistoryOutlined, CommentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Flex from 'components/shared-components/Flex';
import { APP_PREFIX_PATH } from 'configs/AppConfig';
import utils from 'utils';

const AskTheScholarUser = () => {
	const [form] = Form.useForm();
	const navigate = useNavigate();

	const [list, setList] = useState([]); // Filtered user questions
	const [UserData, setUserData] = useState([]); // User questions data
	const [loading, setLoading] = useState(false);

	const token = localStorage.getItem('auth_token');
	// Fetch user questions
	useEffect(() => {
		const fetchUserQuestions = async () => {
			setLoading(true);
			try {
				const response = await fetch('https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/user/all', {
					headers: {
						'Content-Type': 'application/json',
						Authorization: token || null,
					},
				});
				const data = await response.json();
				if (data.success === true) {
					setUserData(data.data);
					setList(data.data);
				} else {
					message.error('Failed to fetch user questions');
				}
			} catch (error) {
				console.error('Error fetching user questions:', error);
				message.error('Error fetching user questions');
			} finally {
				setLoading(false);
			}
		};

		fetchUserQuestions();
	}, [token]);

	// Search function
	const onSearch = (e) => {
		const value = e.currentTarget.value;
		// Client-side search on the current list
		const data = utils.wildCardSearch(UserData, value);
		setList(data);
	};

	console.log('UserData', UserData);
	console.log('token', token);

	const getMainTableColumns = () => [
		{
			title: 'ID',
			dataIndex: '_id',
			render: (_, record, index) => <span>{index + 1}</span>,
		},
		{
			title: 'Name',
			dataIndex: 'name',
		},
		{
			title: 'Email',
			dataIndex: 'email',
		},
		{
			title: 'Regarding',
			dataIndex: 'regarding',
		},
		{
			title: 'Subject',
			dataIndex: 'subject',
		},
		// {
		// 	title: 'Question',
		// 	dataIndex: 'question',
		// },
		{
			title: 'Messages',
			dataIndex: 'replies',
			render: (replies) => <span>{replies?.length || 0}</span>,
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			render: (createdAt) => new Date(createdAt).toLocaleDateString(),
		},
		{
			title: 'Last Updated',
			dataIndex: 'lastUpdated',
			render: (lastUpdated) => new Date(lastUpdated).toLocaleDateString(),
		},
		{
			title: 'Status',
			dataIndex: 'status',
			render: (status) => (
				<div>
					{status === 'Pending' && <span style={{ padding: '6px 10px', borderRadius: '6px', color: 'white', backgroundColor: 'orange' }}>Pending</span>}
					{status === 'User Replied' && <span style={{ padding: '6px 10px', borderRadius: '6px', color: 'white', backgroundColor: 'orange' }}>User Replied</span>}
					{status === 'Answered' && <span style={{ padding: '6px 10px', borderRadius: '6px', color: 'white', backgroundColor: 'green' }}>Answered</span>}
					{status === 'Closed' && <span style={{ padding: '6px 10px', borderRadius: '6px', color: 'white', backgroundColor: 'gray' }}>Closed</span>}
				</div>
			), 
		},
		{
			title: 'Action',
			dataIndex: 'actions',
			align: 'right',
			render: (_, record) => (
				<div style={{ display: 'flex', gap: '6px', justifyContent: 'end' }}>
					{(record.status === 'Answered' || record.status === 'Closed') && (
						<Tooltip title="View question history">
							<Button
								onClick={() => navigate(`${APP_PREFIX_PATH}/dashboards/ask-the-scholar/user/view-history/${record._id}`)}
								icon={<HistoryOutlined />}
								size="small"
								style={{
									backgroundColor: '#808080',
									borderColor: '#808080',
									color: 'white',
									display: 'flex',
									padding: '6px 8px',
									borderRadius: '6px',
									justifyContent: 'center',
									alignItems: 'center',
								}}>
								View History
							</Button>
						</Tooltip>
					)}
					{record.status === 'Pending' || record.status === 'User Replied' ? (
						<Tooltip title="Answer this question">
							<Button
								onClick={() => navigate(`${APP_PREFIX_PATH}/dashboards/ask-the-scholar/user/view-history/${record._id}`)}
								icon={<CommentOutlined />}
								size="small"
								style={{
									backgroundColor: '#3b6efa',
									borderColor: '#3b6efa',
									color: 'white',
									display: 'flex',
									padding: '6px 8px',
									borderRadius: '6px',
									justifyContent: 'center',
									alignItems: 'center',
								}}>
								Answer
							</Button>
						</Tooltip>
					) : null}
				</div>
			),
		},
	];

	// Removed: modal table columns (no selection modal)
	return (
		<Card>
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<Flex className="mb-1" mobileFlex={false}>
					{/* Search by name, email, or question */}
					<Form form={form} layout="inline">
						<Form.Item className="mr-md-3 mb-3">
							<Input placeholder="Search by name, email, or question" prefix={<SearchOutlined />} onChange={onSearch} allowClear style={{ minWidth: 300 }} />
						</Form.Item>
					</Form>
				</Flex>
			</Flex>

			<div className="table-responsive">
				<Table
					columns={getMainTableColumns()}
					dataSource={list}
					rowKey={(record) => record._id}
					loading={loading}
					pagination={{
						showSizeChanger: true,
						// showQuickJumper: true,
						showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} user questions`,
					}}
				/>
			</div>
		</Card>
	);
};

export default AskTheScholarUser;
