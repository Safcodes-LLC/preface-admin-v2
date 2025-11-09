import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Form, message, Button, Tooltip, Modal } from 'antd';
import { SearchOutlined, EyeOutlined, CloseOutlined, CheckOutlined, SendOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import utils from 'utils';

const { TextArea } = Input;

const AskTheScholarGuest = () => {
	const [form] = Form.useForm();

	const [list, setList] = useState([]); // Filtered guest questions
	const [GuestData, setGuestData] = useState([]); // Guest questions data
	const [loading, setLoading] = useState(false);
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState(null);
	const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
	const [emailSubject, setEmailSubject] = useState('');
	const [emailBody, setEmailBody] = useState('');

	// Fetch guest questions
	useEffect(() => {
		const fetchGuestQuestions = async () => {
			setLoading(true);
			try {
				const response = await fetch('https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/guest');
				const data = await response.json();

				if (data.success) {
					setGuestData(data.questions);
					setList(data.questions);
				} else {
					message.error('Failed to fetch guest questions');
				}
			} catch (error) {
				console.error('Error fetching guest questions:', error);
				message.error('Error fetching guest questions');
			} finally {
				setLoading(false);
			}
		};

		fetchGuestQuestions();
	}, []);

	// Search function
	const onSearch = (e) => {
		const value = e.currentTarget.value;
		// Client-side search on the current list
		const data = utils.wildCardSearch(GuestData, value);
		setList(data);
	};
	const token = localStorage.getItem('auth_token');

	// Show question modal
	const showQuestionModal = (record) => {
		setSelectedQuestion(record);
		setIsModalVisible(true);
	};

	// Close modal
	const handleModalClose = () => {
		setIsModalVisible(false);
		setSelectedQuestion(null);
	};

	// Handle answer from modal - Open email composer
	const handleAnswerFromModal = () => {
		if (selectedQuestion) {
			setEmailSubject(`Re: ${selectedQuestion.question.substring(0, 50)}...`);
			setEmailBody('');
			setIsEmailModalVisible(true);
		}
	};

	// Close email composer modal
	const handleEmailModalClose = () => {
		setIsEmailModalVisible(false);
		setEmailSubject('');
		setEmailBody('');
	};

	// Open email client with pre-filled data
	const handleSendEmail = () => {
		if (!emailSubject.trim()) {
			message.warning('Please enter an email subject');
			return;
		}
		if (!emailBody.trim()) {
			message.warning('Please enter an email message');
			return;
		}

		// Construct mailto link with all fields
		const mailtoLink = `mailto:${selectedQuestion.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

		// Open default email client
		window.location.href = mailtoLink;

		message.success('Opening your email client...');

		// Optionally close the modals after a short delay
		setTimeout(() => {
			handleEmailModalClose();
		}, 1000);
	};

	// Handle close question (mark as closed)
	// const handleCloseQuestion = async () => {
	// 	if (!selectedQuestion) return;

	// 	setLoading(true);
	// 	try {
	// 		const response = await fetch(`https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/status/${selectedQuestion._id}`, {
	// 			method: 'PATCH',
	// 			headers: {
	// 				'Content-Type': 'application/json',
	// 				Authorization: token || null,
	// 			},
	// 			body: JSON.stringify({
	// 				status: 'Closed',
	// 			}),
	// 		});

	// 		const data = await response.json();

	// 		if (data.success) {
	// 			message.success('Question closed successfully');

	// 			// Update local state
	// 			const updatedQuestions = GuestData.map((q) => (q._id === selectedQuestion._id ? { ...q, status: 'Closed' } : q));
	// 			setGuestData(updatedQuestions);
	// 			setList(updatedQuestions);
	// 			handleModalClose();
	// 		} else {
	// 			message.error(data.message || 'Failed to close question');
	// 		}
	// 	} catch (error) {
	// 		console.error('Error closing question:', error);
	// 		message.error('Error closing question');
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	// Handle answered button click - toggle between Answered and Pending
	const handleAnswered = async (record) => {
		// Determine the new status based on current status
		const newStatus = record.status === 'Pending' ? 'Answered' : 'Pending';
		const statusMessage = newStatus === 'Answered' ? 'Answered' : 'Pending';

		setLoading(true);
		try {
			const response = await fetch(`https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/status/${record._id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token || null,
				},
				body: JSON.stringify({
					status: newStatus,
				}),
			});

			const data = await response.json();

			if (data.success) {
				message.success(`Question status updated to ${statusMessage}`);

				// Update local state
				const updatedQuestions = GuestData.map((q) => (q._id === record._id ? { ...q, status: newStatus } : q));
				setGuestData(updatedQuestions);
				setList(updatedQuestions);
			} else {
				message.error(data.message || 'Failed to update question status');
			}
		} catch (error) {
			console.error('Error updating question status:', error);
			message.error('Error updating question status');
		} finally {
			setLoading(false);
		}
	};

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
			title: 'Mobile Number',
			dataIndex: 'mobileNumber',
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			render: (createdAt) => new Date(createdAt).toLocaleDateString(),
		},
		{
			title: 'Status',
			dataIndex: 'status',
			render: (status) => (
				<div>
					{status === 'Pending' && <span style={{ border: '1px solid orange', padding: '4px 8px', borderRadius: '6px', color: 'orange' }}>Pending</span>}
					{status === 'Closed' && <span style={{ border: '1px solid gray', padding: '4px 8px', borderRadius: '6px', color: 'gray' }}>Closed</span>}
					{status === 'Answered' && <span style={{ border: '1px solid green', padding: '4px 4px', borderRadius: '6px', color: 'green' }}>Answered</span>}
				</div>
			),
		},
		{
			title: 'Action',
			dataIndex: 'actions',
			align: 'right',
			render: (_, record) => (
				<div style={{ display: 'flex', gap: '6px', justifyContent: 'end' }}>
					{record.status === 'Pending' && (
						<Button
							icon={<CheckOutlined />}
							onClick={() => handleAnswered(record)}
							size="small"
							style={{ backgroundColor: '#0da20d', borderColor: '#0da20d', color: 'white', display: 'flex', alignItems: 'center' }}>
							Mark as Answered
						</Button>
					)}
					{record.status === 'Answered' || record.status === 'Closed' ? (
						<Button
							icon={<CloseOutlined />}
							onClick={() => handleAnswered(record)}
							size="small"
							style={{ backgroundColor: '#de4646', borderColor: '#de4646', color: 'white', display: 'flex', alignItems: 'center' }}>
							Mark as Unanswered
						</Button>
					) : null}
					{record.status === 'Pending' && (
						<Tooltip title="Answer this question">
							<Button
								icon={<EyeOutlined />}
								onClick={() => showQuestionModal(record)}
								size="small"
								style={{ backgroundColor: '#3b6efa', borderColor: '#3b6efa', color: 'white', display: 'flex', alignItems: 'center' }}>
								View Question
							</Button>
						</Tooltip>
					)}
				</div>
			),
		},
	];

	// Removed: modal table columns (no selection modal)
	return (
		<>
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
						rowKey={(record) => record._id || record.email}
						loading={loading}
						pagination={{
							showSizeChanger: true,
							// showQuickJumper: true,
							showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} guest questions`,
						}}
					/>
				</div>
			</Card>

			{/* Question View Modal */}
			<Modal
				title="Question Details"
				open={isModalVisible}
				onCancel={handleModalClose}
				width={700}
				footer={[
					<Button key="close" icon={<CloseOutlined />} onClick={handleModalClose} danger loading={loading}>
						Close Question
					</Button>,
					<Button key="answer" type="primary" icon={<CheckOutlined />} onClick={handleAnswerFromModal}>
						Compose Answer
					</Button>,
				]}>
				{selectedQuestion && (
					<div style={{ padding: '16px 0' }}>
						<div style={{ marginBottom: 16 }}>
							<h4 style={{ marginBottom: 8, color: '#595959' }}>Personal Information</h4>
							<div style={{ backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8 }}>
								<p style={{ margin: '8px 0' }}>
									<strong>Name:</strong> {selectedQuestion.name}
								</p>
								<p style={{ margin: '8px 0' }}>
									<strong>Email:</strong> {selectedQuestion.email}
								</p>
								<p style={{ margin: '8px 0' }}>
									<strong>Mobile Number:</strong> {selectedQuestion.mobileNumber || 'N/A'}
								</p>
								<p style={{ margin: '8px 0' }}>
									<strong>Status:</strong>{' '}
									<span
										style={{
											padding: '4px 8px',
											borderRadius: '4px',
											backgroundColor: selectedQuestion.status === 'Pending' ? '#fff7e6' : selectedQuestion.status === 'Answered' ? '#f6ffed' : '#f5f5f5',
											color: selectedQuestion.status === 'Pending' ? '#fa8c16' : selectedQuestion.status === 'Answered' ? '#52c41a' : '#8c8c8c',
											border: `1px solid ${selectedQuestion.status === 'Pending' ? '#ffd591' : selectedQuestion.status === 'Answered' ? '#b7eb8f' : '#d9d9d9'}`,
										}}>
										{selectedQuestion.status}
									</span>
								</p>
								<p style={{ margin: '8px 0' }}>
									<strong>Created At:</strong> {new Date(selectedQuestion.createdAt).toLocaleString()}
								</p>
							</div>
						</div>

						<div>
							<h4 style={{ marginBottom: 8, color: '#595959' }}>Question</h4>
							<div
								style={{
									backgroundColor: '#f9f9f9',
									padding: 16,
									borderRadius: 8,
									border: '1px solid #e8e8e8',
									minHeight: 100,
								}}>
								<p style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>{selectedQuestion.question}</p>
							</div>
						</div>
					</div>
				)}
			</Modal>

			{/* Email Composer Modal */}
			<Modal
				title={
					<div>
						<div style={{ fontSize: 16, fontWeight: 600 }}>Compose Email Response</div>
						{selectedQuestion && (
							<div style={{ fontSize: 13, fontWeight: 400, color: '#8c8c8c', marginTop: 4 }}>
								To: {selectedQuestion.name} ({selectedQuestion.email})
							</div>
						)}
					</div>
				}
				open={isEmailModalVisible}
				onCancel={handleEmailModalClose}
				width={800}
				footer={[
					<Button key="cancel" onClick={handleEmailModalClose}>
						Cancel
					</Button>,
					<Button key="send" type="primary" icon={<SendOutlined />} onClick={handleSendEmail}>
						Open in Email Client
					</Button>,
				]}>
				{selectedQuestion && (
					<div style={{ padding: '16px 0' }}>
						{/* Original Question Reference */}
						<div style={{ marginBottom: 24, padding: 12, backgroundColor: '#f0f5ff', borderLeft: '3px solid #1890ff', borderRadius: 4 }}>
							<div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>Original Question:</div>
							<div style={{ fontSize: 13, color: '#595959' }}>{selectedQuestion.question}</div>
						</div>

						{/* Email Subject */}
						<div style={{ marginBottom: 16 }}>
							<label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#595959' }}>
								Subject <span style={{ color: 'red' }}>*</span>
							</label>
							<Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Enter email subject" size="large" />
						</div>

						{/* Email Body */}
						<div>
							<label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#595959' }}>
								Message <span style={{ color: 'red' }}>*</span>
							</label>
							<TextArea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Type your response here..." rows={10} style={{ fontSize: 14 }} />
							<div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>Compose your response. This will open in your default email client where you can review and send.</div>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
};

export default AskTheScholarGuest;
