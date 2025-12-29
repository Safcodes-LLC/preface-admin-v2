import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Button, Tag, message, Space, Tooltip } from 'antd';
import { EyeOutlined, SearchOutlined, BookOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import QuranService from 'services/quranService';
import { useNavigate } from 'react-router-dom';

const QuranList = () => {
	const navigate = useNavigate();
	const [list, setList] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchValue, setSearchValue] = useState('');

	useEffect(() => {
		fetchSurahs();
	}, []);

	const fetchSurahs = async () => {
		setLoading(true);
		try {
			const response = await QuranService.getAllSurahs();
			if (response && response.data) {
				setList(response.data);
			}
		} catch (error) {
			message.error('Failed to fetch Surah list');
			console.error('Error fetching surahs:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (e) => {
		setSearchValue(e.target.value);
	};

	const filteredList = list.filter((surah) => {
		const search = searchValue.toLowerCase();
		return surah.nameEnglish.toLowerCase().includes(search) || surah.nameArabic.includes(search) || surah.nameComplex.toLowerCase().includes(search) || surah.surahId.toString().includes(search);
	});

	const tableColumns = [
		{
			title: 'Surah #',
			dataIndex: 'surahId',
			key: 'surahId',
			width: 120,
			sorter: (a, b) => a.surahId - b.surahId,
		},
		{
			title: 'Surah Name',
			dataIndex: 'nameComplex',
			key: 'nameComplex',
		},
		{
			title: 'Arabic Name',
			dataIndex: 'nameArabic',
			key: 'nameArabic',
			render: (text) => <span style={{ fontSize: '18px' }}>{text}</span>,
		},
		// {
		//   title: "English Name",
		//   dataIndex: "nameEnglish",
		//   key: "nameEnglish",
		// },
		{
			title: 'Ayah Count',
			dataIndex: 'ayahCount',
			key: 'ayahCount',
			// width: 100,
			sorter: (a, b) => a.ayahCount - b.ayahCount,
		},
		{
			title: 'Revelation',
			dataIndex: 'revelationPlace',
			key: 'revelationPlace',
			width: 120,
			render: (place) => <Tag color={place === 'makkah' ? 'gold' : 'green'}>{place.charAt(0).toUpperCase() + place.slice(1)}</Tag>,
			filters: [
				{ text: 'Makkah', value: 'makkah' },
				{ text: 'Madinah', value: 'madinah' },
			],
			onFilter: (value, record) => record.revelationPlace === value,
		},
		{
			title: 'Pages',
			key: 'pages',
			width: 100,
			render: (_, record) => (record.pages ? `${record.pages[0]} - ${record.pages[1]}` : 'N/A'),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 100,
			render: (_, record) => (
				<Space size="small">
					<Tooltip title="View Surah">
						<Button type="primary" icon={<EyeOutlined />} onClick={() => viewSurah(record)} size="small">
							View
						</Button>
					</Tooltip>
				</Space>
			),
		},
	];

	const viewSurah = (record) => {
		navigate(`/admin/dashboards/quran/view-surah/${record.surahId}`);
	};

	return (
		<Card>
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<Flex className="mb-1" mobileFlex={false}>
					<div className="mr-md-3 mb-3">
						<Input placeholder="Search Surah" prefix={<SearchOutlined />} onChange={handleSearch} value={searchValue} style={{ width: 300 }} />
					</div>
				</Flex>
				{/* <div>
					<Button type="primary" icon={<BookOutlined />} block onClick={() => message.info('Full Quran view coming soon')}>
						View Full Quran
					</Button>
				</div> */}
			</Flex>
			<div className="table-responsive">
				<Table
					columns={tableColumns}
					dataSource={filteredList}
					rowKey="id"
					loading={loading}
					pagination={{
						pageSize: 20,
						showSizeChanger: true,
						pageSizeOptions: ['10', '20', '30', '50', '114'],
						showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} Surahs`,
					}}
				/>
			</div>
		</Card>
	);
};

export default QuranList;
