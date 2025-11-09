import React, { useEffect, useState } from 'react';
import { Card, Input, Button, message, Spin, Avatar, Typography } from 'antd';
import { SendOutlined, UserOutlined, CustomerServiceOutlined, ArrowLeftOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Flex from 'components/shared-components/Flex';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ViewHistory = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);
	const [questionData, setQuestionData] = useState(null);
	const [replyMessage, setReplyMessage] = useState('');
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [showScrollTopButton, setShowScrollTopButton] = useState(false);
	const token = localStorage.getItem('auth_token');
	const chatEndRef = React.useRef(null);
	const chatContainerRef = React.useRef(null);

	// Fetch question details with replies
	const fetchQuestionDetails = async (silent = false) => {
		if (!silent) setLoading(true);
		try {
			const response = await fetch(`https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/${id}`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: token || null,
				},
			});
			const data = await response.json();
			if (data.success === true) {
				setQuestionData(data.data);
				return true;
			} else {
				if (!silent) message.error('Failed to fetch question details');
				return false;
			}
		} catch (error) {
			console.error('Error fetching question details:', error);
			if (!silent) message.error('Error fetching question details');
			return false;
		} finally {
			if (!silent) setLoading(false);
		}
	};

	useEffect(() => {
		if (id) {
			fetchQuestionDetails();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, token]);

	// Scroll to bottom of chat
	const scrollToBottom = () => {
		chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	// Scroll to top of chat
	const scrollToTop = () => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (questionData?.replies?.length > 0) {
			setTimeout(scrollToBottom, 300);
		}
	}, [questionData?.replies?.length]);

	// Handle scroll event to show/hide scroll buttons
	const handleScroll = () => {
		const container = chatContainerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
		const isNearTop = scrollTop < 100;

		// Show scroll-to-bottom button only when at top
		setShowScrollButton(isNearTop && !isNearBottom);
		// Show scroll-to-top button only when at bottom
		setShowScrollTopButton(isNearBottom && !isNearTop);
	}; // Send reply
	const handleSendReply = async () => {
		if (!replyMessage.trim()) {
			message.warning('Please enter a message');
			return;
		}

		// Create optimistic reply object
		const optimisticReply = {
			_id: `temp-${Date.now()}`,
			sender: 'Admin',
			message: replyMessage,
			sentAt: new Date().toISOString(),
		};

		// Store the message before clearing
		const messageToSend = replyMessage;

		// Optimistically update UI
		setQuestionData((prev) => ({
			...prev,
			replies: [...(prev.replies || []), optimisticReply],
		}));
		setReplyMessage('');

		// Scroll to new message
		setTimeout(scrollToBottom, 100);

		setSending(true);
		try {
			const response = await fetch(`https://king-prawn-app-x9z27.ondigitalocean.app/api/scholar-questions/reply/${id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token || null,
				},
				body: JSON.stringify({
					message: messageToSend,
				}),
			});

			const data = await response.json();
			if (data.success === true) {
				message.success('Reply sent successfully', 2);
				// Refetch to get the latest data from server
				await fetchQuestionDetails(true);
				setTimeout(scrollToBottom, 100);
			} else {
				// Rollback on error and refetch
				setQuestionData((prev) => ({
					...prev,
					replies: prev.replies.filter((r) => r._id !== optimisticReply._id),
				}));
				setReplyMessage(messageToSend);
				message.error('Failed to send reply');
				// Refetch to ensure data is in sync
				await fetchQuestionDetails(true);
			}
		} catch (error) {
			// Rollback on error and refetch
			setQuestionData((prev) => ({
				...prev,
				replies: prev.replies.filter((r) => r._id !== optimisticReply._id),
			}));
			setReplyMessage(messageToSend);
			console.error('Error sending reply:', error);
			message.error('Error sending reply');
			// Refetch to ensure data is in sync
			await fetchQuestionDetails(true);
		} finally {
			setSending(false);
		}
	};

	const formatDate = (date) => {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const isClosed = questionData?.status === 'Closed';

	if (loading) {
		return (
			<Card>
				<div style={{ textAlign: 'center', padding: '50px 0' }}>
					<Spin size="large" />
				</div>
			</Card>
		);
	}

	if (!questionData) {
		return (
			<Card>
				<div style={{ textAlign: 'center', padding: '50px 0' }}>
					<Text>Question not found</Text>
				</div>
			</Card>
		);
	}

	return (
		<div>
			<Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16, padding: 0 }}>
				Back to Questions
			</Button>

			<Card>
				{/* Question Header */}
				<div style={{ marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
					<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
						<div>
							<Title level={4} style={{ marginBottom: 8 }}>
								{questionData.subject}
							</Title>
							<Text type="secondary">
								From: <strong>{questionData.name}</strong> ({questionData.email})
							</Text>
							<br />
							<Text type="secondary">
								Regarding: <strong>{questionData.regarding}</strong>
							</Text>
							<Text type="secondary" style={{ fontSize: 12 }}>
								{formatDate(questionData.createdAt)}
							</Text>
						</div>
						<div>
							{questionData.status === 'Pending' && <span style={{ padding: '6px 12px', borderRadius: '6px', color: 'white', backgroundColor: 'orange' }}>Pending</span>}
							{questionData.status === 'Answered' && <span style={{ padding: '6px 12px', borderRadius: '6px', color: 'white', backgroundColor: 'green' }}>Answered</span>}
							{questionData.status === 'Closed' && <span style={{ padding: '6px 12px', borderRadius: '6px', color: 'white', backgroundColor: 'gray' }}>Closed</span>}
						</div>
					</Flex>
				</div>

				{/* Chat History */}
				<div style={{ marginBottom: 24, position: 'relative' }}>
					<div
						ref={chatContainerRef}
						onScroll={handleScroll}
						style={{
							maxHeight: 'calc(100vh - 500px)',
							overflowY: 'auto',
							padding: '0 8px',
							scrollBehavior: 'smooth',
						}}>
						{questionData.replies && questionData.replies.length > 0 ? (
							<>
								{questionData.replies.map((reply, index) => {
									const isAdmin = reply.sender === 'Admin';
									const isTempMessage = reply._id.toString().startsWith('temp-');

									return (
										<div
											key={reply._id || index}
											style={{
												display: 'flex',
												justifyContent: isAdmin ? 'flex-end' : 'flex-start',
												marginBottom: 16,
												opacity: isTempMessage ? 0.6 : 1,
												transition: 'opacity 0.3s ease-in-out',
											}}>
											<div
												style={{
													display: 'flex',
													flexDirection: isAdmin ? 'row-reverse' : 'row',
													maxWidth: '70%',
													gap: 12,
												}}>
												<Avatar
													icon={isAdmin ? <CustomerServiceOutlined /> : <UserOutlined />}
													style={{
														backgroundColor: isAdmin ? '#3b6efa' : '#52c41a',
														flexShrink: 0,
													}}
												/>
												<div>
													<div
														style={{
															padding: '12px 16px',
															borderRadius: 8,
															backgroundColor: isAdmin ? '#3b6efa' : '#f0f0f0',
															color: isAdmin ? 'white' : 'black',
															boxShadow: isTempMessage ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
														}}>
														<Text style={{ color: isAdmin ? 'white' : 'black' }}>{reply.message}</Text>
													</div>
													<div style={{ marginTop: 4, textAlign: isAdmin ? 'right' : 'left' }}>
														<Text type="secondary" style={{ fontSize: 11 }}>
															{reply.sender} • {formatDate(reply.sentAt)}
															{isTempMessage && ' (Sending...)'}
														</Text>
													</div>
												</div>
											</div>
										</div>
									);
								})}
								<div ref={chatEndRef} />
							</>
						) : (
							<div style={{ textAlign: 'center', padding: '20px 0' }}>
								<Text type="secondary">No replies yet</Text>
							</div>
						)}
					</div>

					{/* Scroll to Bottom Button */}
					{showScrollButton && (
						<Button
							type="primary"
							shape="default"
							icon={<DownOutlined />}
							size="small"
							onClick={() => scrollToBottom()}
							style={{
								position: 'absolute',
								bottom: '15px',
								right: 'calc(50% - 40px)',
								zIndex: 10,
								boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
								backgroundColor: '#52c41ae8',
								borderColor: '#52c41ae8',
							}}>
							Scroll to Down
						</Button>
					)}

					{/* Scroll to Top Button */}
					{showScrollTopButton && (
						<Button
							type="primary"
							shape="default"
							icon={<UpOutlined />}
							size="small"
							onClick={() => scrollToTop()}
							style={{
								position: 'absolute',
								top: '10px',
								right: 'calc(50% - 40px)',
								zIndex: 10,
								boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
								backgroundColor: '#52c41ae8',
								borderColor: '#52c41ae8',
							}}>
							Scroll to Top
						</Button>
					)}
				</div>

				{/* Reply Input */}
				<div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
					<Title level={5} style={{ marginBottom: 12 }}>
						{isClosed ? 'Conversation Closed' : 'Send Reply'}
					</Title>
					<div style={{ display: 'flex', gap: 12 }}>
						<TextArea
							value={replyMessage}
							onChange={(e) => setReplyMessage(e.target.value)}
							placeholder={isClosed ? 'This conversation is closed' : 'Type your reply...'}
							disabled={isClosed || sending}
							rows={3}
							style={{ flex: 1 }}
							onPressEnter={(e) => {
								if (e.ctrlKey || e.metaKey) {
									handleSendReply();
								}
							}}
						/>
						<Button
							type="primary"
							icon={<SendOutlined />}
							onClick={handleSendReply}
							loading={sending}
							disabled={isClosed || !replyMessage.trim() || sending}
							style={{
								height: 'auto',
								backgroundColor: isClosed ? '#d9d9d9' : '#3b6efa',
								borderColor: isClosed ? '#d9d9d9' : '#3b6efa',
								color: isClosed ? 'rgba(0,0,0,0.25)' : 'white',
							}}>
							Send
						</Button>
					</div>
					{isClosed ? (
						<Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
							This conversation has been closed and no further replies can be sent.
						</Text>
					) : (
						<Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
							Press Ctrl+Enter to send quickly
						</Text>
					)}
				</div>
			</Card>
		</div>
	);
};

export default ViewHistory;
