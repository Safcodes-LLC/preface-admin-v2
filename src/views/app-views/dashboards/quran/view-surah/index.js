import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Table, Input, Space, message, Button, Modal, Select, Form, Divider, Tooltip } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, InfoCircleOutlined, LinkOutlined } from '@ant-design/icons';
import QuranService from 'services/quranService';
import Flex from 'components/shared-components/Flex';

// eslint-disable-next-line no-unused-vars
const { Title, Text } = Typography;

const ViewSurah = () => {
	const { surahId } = useParams();
	const navigate = useNavigate();
	const [surahInfo, setSurahInfo] = useState(null);
	const [ayahs, setAyahs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	const [surahModalVisible, setSurahModalVisible] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState('en');
	const [selectedAyahs, setSelectedAyahs] = useState([]);
	const [groupModalVisible, setGroupModalVisible] = useState(false);

	useEffect(() => {
		const fetchSurah = async () => {
			setLoading(true);
			try {
				const res = await QuranService.getSurahById(surahId);
				const data = Array.isArray(res.data) ? res.data : [];
				setAyahs(data);
				if (data.length > 0 && data[0].surah) {
					setSurahInfo(data[0].surah);
				}
			} catch (err) {
				message.error('Failed to load Surah details');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchSurah();
	}, [surahId]);

	const onSearchChange = (e) => setSearchValue(e.target.value);

	const languages = [
		{ label: 'English', value: 'en' },
		{ label: 'Arabic', value: 'ar' },
		{ label: 'Malayalam', value: 'ml' },
	];

	const handleViewAyah = (record) => {
		navigate(`/admin/dashboards/quran/view-surah/${surahId}/ayah/${record.ayahNumber}`);
	};

	const handleCreateGroup = () => {
		if (selectedAyahs.length < 2) {
			message.warning('Please select at least 2 ayahs to create a group');
			return;
		}
		setGroupModalVisible(true);
	};

	const handleConfirmGroup = () => {
		const sortedAyahs = selectedAyahs.sort((a, b) => a - b);
		const groupStart = sortedAyahs[0];
		const groupEnd = sortedAyahs[sortedAyahs.length - 1];

		// Update ayahs with grouping info
		const updatedAyahs = ayahs.map((ayah) => {
			if (selectedAyahs.includes(ayah.ayahNumber)) {
				return {
					...ayah,
					ayahGroupStart: groupStart,
					ayahGroupEnd: groupEnd,
				};
			}
			return ayah;
		});

		setAyahs(updatedAyahs);
		setSelectedAyahs([]);
		setGroupModalVisible(false);
		message.success(`Ayahs ${groupStart}-${groupEnd} grouped successfully!`);
	};

	const handleRemoveGroup = () => {
		if (selectedAyahs.length === 0) {
			message.warning('Please select ayahs to remove from group');
			return;
		}

		const updatedAyahs = ayahs.map((ayah) => {
			if (selectedAyahs.includes(ayah.ayahNumber)) {
				return {
					...ayah,
					ayahGroupStart: null,
					ayahGroupEnd: null,
				};
			}
			return ayah;
		});

		setAyahs(updatedAyahs);
		setSelectedAyahs([]);
		message.success('Group removed successfully!');
	};

	const filteredAyahs = useMemo(() => {
		const search = searchValue.trim().toLowerCase();
		if (!search) return ayahs;
		return ayahs.filter((a) => {
			return String(a.ayahNumber).includes(search) || (a.textUthmani || '').toLowerCase().includes(search) || (a.textImlaei || '').toLowerCase().includes(search);
		});
	}, [ayahs, searchValue]);

	const columns = [
		{
			title: '#',
			dataIndex: 'ayahNumber',
			key: 'ayahNumber',
			width: 70,
			sorter: (a, b) => a.ayahNumber - b.ayahNumber,
		},
		{
			title: 'Ayah',
			dataIndex: 'textUthmani',
			key: 'textUthmani',
			render: (text) => <span style={{ fontSize: 18 }}>{text}</span>,
		},
		// {
		//   title: "Arabic (Imlaei)",
		//   dataIndex: "textImlaei",
		//   key: "textImlaei",
		// },
		{
			title: 'Page',
			dataIndex: 'pageNumber',
			key: 'pageNumber',
			width: 90,
		},
		{
			title: 'Juz',
			dataIndex: 'juzNumber',
			key: 'juzNumber',
			width: 90,
		},
		{
			title: 'Hizb',
			dataIndex: 'hizbNumber',
			key: 'hizbNumber',
			width: 90,
		},
		{
			title: 'Group',
			key: 'group',
			width: 120,
			render: (_, record) => {
				if (record.ayahGroupStart === null && record.ayahGroupEnd === null) {
					return (
						<Tag color="orange">
							{record.ayahGroupStart} - {record.ayahGroupEnd}
						</Tag>
					);
				}
				return <Tag color="orange">UNGROUPED</Tag>;
			},
		},
		{
			title: 'Action',
			key: 'action',
			width: 100,
			render: (_, record) => (
				<Tooltip title="View Details">
					<Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewAyah(record)}>
						View
					</Button>
				</Tooltip>
			),
		},
	];

	return (
		<Card loading={loading}>
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/dashboards/quran/listing')}>
					Back to Quran List
				</Button>
			</Flex>
			<Divider />
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<div>
					<Title level={3} style={{ marginBottom: 0 }}>
						{surahInfo?.nameComplex} ({surahInfo?.nameArabic})
						{/* {surahInfo?.nameArabic && (
              <Text type="primary" style={{ marginLeft: 8, fontSize: 22 }}>
                ({surahInfo?.nameArabic})
              </Text>
            )} */}
					</Title>
					{surahInfo && (
						<Space size={12} style={{ marginTop: 8 }}>
							<Tag color="blue">ID: {surahInfo.surahId}</Tag>
							<Tag color="green">Ayahs: {surahInfo.ayahCount}</Tag>
							<Tag color={surahInfo.revelationPlace === 'makkah' ? 'gold' : 'cyan'}>{surahInfo.revelationPlace?.[0]?.toUpperCase() + surahInfo.revelationPlace?.slice(1)}</Tag>
							{surahInfo.pages && (
								<Tag>
									Pages: {surahInfo.pages[0]} - {surahInfo.pages[1]}
								</Tag>
							)}
							{typeof surahInfo.bismillahPre === 'boolean' && <Tag color={surahInfo.bismillahPre ? 'purple' : 'default'}>Bismillah: {surahInfo.bismillahPre ? 'Shown' : 'Not shown'}</Tag>}
						</Space>
					)}
				</div>
				<Space size="large">
					<Tooltip title="View Surah Info">
						<Button type="primary" icon={<InfoCircleOutlined />} onClick={() => setSurahModalVisible(true)}>
							Surah Info
						</Button>
					</Tooltip>

					<Input placeholder="Search ayahs" value={searchValue} onChange={onSearchChange} style={{ width: 250 }} />
				</Space>
			</Flex>
			{selectedAyahs.length > 0 && (
				<Flex justifyContent="flex-start" style={{ marginTop: 16 }} gap="10px">
					<Button type="primary" style={{backgroundColor:"orange"}} icon={<LinkOutlined />} onClick={handleCreateGroup}>
						Group ({selectedAyahs.length} selected)
					</Button>
					<Button onClick={() => setSelectedAyahs([])}>Clear Selection</Button>
					<Button danger onClick={handleRemoveGroup}>
						Remove Group
					</Button>
				</Flex>
			)}

			<div className="table-responsive" style={{ marginTop: 16 }}>
				<Table
					columns={columns}
					dataSource={filteredAyahs}
					rowKey="ayahNumber"
					pagination={{ pageSize: 20, showSizeChanger: true }}
					rowSelection={{
						selectedRowKeys: selectedAyahs,
						onChange: (selectedKeys) => setSelectedAyahs(selectedKeys),
						preserveSelectedRowKeys: true,
					}}
				/>
			</div>

			{/* Surah Info Modal */}
			<Modal
				title="Surah Information"
				open={surahModalVisible}
				onCancel={() => setSurahModalVisible(false)}
				width={700}
				footer={[
					<Button key="close" onClick={() => setSurahModalVisible(false)}>
						Close
					</Button>,
					<Button key="publish" type="primary" onClick={() => message.success('Surah info published!')}>
						Publish
					</Button>,
					<Button key="save" onClick={() => message.success('Surah info saved!')}>
						Save Draft
					</Button>,
				]}>
				<Form layout="vertical">
					<Form.Item label="Language">
						<Select value={selectedLanguage} onChange={setSelectedLanguage} options={languages} />
					</Form.Item>
					<Form.Item label="Surah Description">
						<textarea
							rows={6}
							placeholder="Enter surah description"
							defaultValue={surahInfo?.surahinfo || ''}
							style={{
								width: '100%',
								padding: '8px',
								borderRadius: '4px',
								border: '1px solid #d9d9d9',
								fontFamily: 'monospace',
							}}
						/>
					</Form.Item>
				</Form>
			</Modal>

			{/* Group Confirmation Modal */}
			<Modal title="Create Ayah Group" open={groupModalVisible} onOk={handleConfirmGroup} onCancel={() => setGroupModalVisible(false)} width={500}>
				<Form layout="vertical">
					<Form.Item label="Selected Ayahs for Grouping">
						<div
							style={{
								padding: '12px',
								backgroundColor: '#f5f5f5',
								borderRadius: '4px',
								marginBottom: '16px',
							}}>
							<p>
								<strong>Ayahs:</strong> {selectedAyahs.sort((a, b) => a - b).join(', ')}
							</p>
							<p>
								<strong>Group Range:</strong> {Math.min(...selectedAyahs)} - {Math.max(...selectedAyahs)}
							</p>
							<p>
								<strong>Total:</strong> {selectedAyahs.length} ayahs
							</p>
						</div>
					</Form.Item>
					<Form.Item>
						<p style={{ color: '#666', fontSize: '12px' }}>These ayahs will be grouped together. When viewing any ayah in this group, the translation and tafsir will apply to the entire group.</p>
					</Form.Item>
				</Form>
			</Modal>
		</Card>
	);
};

export default ViewSurah;
