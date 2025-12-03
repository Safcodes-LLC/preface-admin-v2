import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Input, Button, Menu, Tag, Modal, Form, Select, Row, Col, Grid, message, Checkbox, Input as AntInput } from 'antd';
import { PlusCircleOutlined } from '@ant-design/icons';
import { DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { API_BASE_URL } from 'configs/AppConfig';
import EllipsisDropdown from 'components/shared-components/EllipsisDropdown';
import Flex from 'components/shared-components/Flex';
import utils from 'utils';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchAllPostsByPostType } from 'store/slices/postSlice';
import axios from 'axios';
import { fetchAllLanguages } from 'store/slices/languagesSlice';
import { fetchAllCategories } from 'store/slices/categoriesSlice';

const ListPost = () => {
	const dispatch = useDispatch();
	const [form] = Form.useForm();
	const { useBreakpoint } = Grid;
	const screens = useBreakpoint(); // Get screen size information
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath = location.pathname.split('/').pop(); // Get the last part of the path

	// Watch form fields for reactive filtering
	const watchedLanguage = Form.useWatch('language', form);
	const watchedParentCategory = Form.useWatch('ParentCategory', form);

	// State for pagination and filters
	const [isModalVisible, setIsModalVisible] = useState(false);
	// Selection state for popup list
	// const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [featuredStatusChanges, setFeaturedStatusChanges] = useState({});
	const [listMain, setListMain] = useState([]);
	const [modalLoading, setModalLoading] = useState(false);
	const [filteredData, setFilteredData] = useState([]);
	const [modalPagination, setModalPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [modalFilters, setModalFilters] = useState({
		language: undefined,
		parentCategory: undefined,
		categories: undefined,
		title: '',
	});

	// Categories list from Redux
	const [categoriesList, setCategoriesList] = useState([]);

	// Redux states
	const { languages, loading: languagesLoading } = useSelector((state) => state.languages);
	const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);

	// Fetch categories
	useEffect(() => {
		if (!categories.length) {
			console.log('Fetching all categories');
			dispatch(fetchAllCategories());
		}
	}, [dispatch, categories]);

	// Update categories list when Redux state changes
	useEffect(() => {
		if (categories && Array.isArray(categories) && categories.length > 0) {
			setCategoriesList(categories);
		} else {
			console.log('No categories available or invalid format');
			setCategoriesList([]);
		}
	}, [categories]);

	// Available filters

	// Filter parent categories by language (same as featured articles)
	const filteredParentCategories = categoriesList.filter((category) => {
		const hasNoParent = !category.parentCategory;
		const matchesLanguage = watchedLanguage ? category.language?._id === watchedLanguage || category.language === watchedLanguage : true;
		return hasNoParent && matchesLanguage;
	});

	// Filter subcategories by parent category and language (same as featured articles)
	const filteredSubCategories = categoriesList.filter((category) => {
		const hasParent = category.parentCategory && (category.parentCategory._id === watchedParentCategory || category.parentCategory.id === watchedParentCategory);
		const matchesLanguage = watchedLanguage ? category.language?._id === watchedLanguage || category.language === watchedLanguage : true;
		return hasParent && matchesLanguage;
	});

	const availableParentCategories = useMemo(() => {
		// console.log('Filtered parent categories:', filteredParentCategories);
		return filteredParentCategories;
	}, [filteredParentCategories]);

	const availableSubCategories = useMemo(() => {
		// console.log('Filtered subcategories:', filteredSubCategories);
		return filteredSubCategories;
	}, [filteredSubCategories]);

	// Reset parent category when language changes
	useEffect(() => {
		if (watchedLanguage) {
			form.setFieldsValue({ ParentCategory: undefined, categories: undefined });
		}
	}, [watchedLanguage, form]);

	// Reset subcategory when parent category changes
	useEffect(() => {
		if (watchedParentCategory) {
			form.setFieldsValue({ categories: undefined });
		}
	}, [watchedParentCategory, form]);

	// Fetch posts with current filters using the manage API (for pagination)
	const fetchModalPage = async (page, pageSize) => {
		const { language, parentCategory, categories, title } = modalFilters;
		if (!language || !categories) return;

		setModalLoading(true);
		try {
			const token = localStorage.getItem('auth_token');
			const postTypeIdMapping = {
				'popular-article': '66d9d564987787d3e3ff1312',
				'popular-podcast': '66d9d564987787d3e3ff1313',
				'popular-video': '66d9d564987787d3e3ff1314',
			};

			const postTypeId = Object.keys(postTypeIdMapping).find((key) => location.pathname.includes(key));

			if (!postTypeId) return;

			const params = {
				page,
				limit: pageSize,
				sortBy: 'priority',
				languageId: language,
				language,
				parentCategoryId: parentCategory,
				parentCategory,
				category: categories,
				categoriesCsv: categories,
				title,
				search: title,
			};

			const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${postTypeIdMapping[postTypeId]}`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: token,
				},
				params,
				paramsSerializer: (params) => {
					const q = new URLSearchParams();
					Object.entries(params).forEach(([key, value]) => {
						if (value === undefined || value === null || value === '') return;
						if (Array.isArray(value)) {
							q.set(key, value.join(','));
						} else {
							q.set(key, String(value));
						}
					});
					return q.toString();
				},
			});

			if (response?.data?.status === 'success') {
				const payload = response.data;
				const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.docs) ? payload.docs : [];
				const p = payload.pagination || {};
				const sortedItems = [...items].sort((a, b) => (b?.featured === true) - (a?.featured === true));
				setFilteredData(sortedItems);
				setModalPagination({
					current: p.page || page,
					pageSize: p.limit || pageSize,
					total: p.total || 0,
				});
			}
		} catch (error) {
			console.error('Error fetching posts:', error?.response || error);
			const serverMsg = error?.response?.data?.message || error?.message || 'Failed to fetch posts page';
			message.error(serverMsg);
		} finally {
			setModalLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		dispatch(fetchAllLanguages());
		dispatch(fetchAllCategories({ page: 1, limit: 100 }));
	}, [dispatch]);

	// Prepare modal on open: clear previous results and reset
	useEffect(() => {
		if (isModalVisible) {
			setFilteredData([]);
			setModalPagination({ current: 1, pageSize: 10, total: 0 });
			setModalFilters({
				language: undefined,
				parentCategory: undefined,
				categories: undefined,
				title: '',
			});
		}
	}, [isModalVisible]);

	// Define label logic outside JSX
	let labelContent;
	if (screens.lg || screens.xl || screens.xxl) {
		labelContent = <span style={{ visibility: 'hidden' }}>Filter</span>; // Hidden but space occupied
	} else if (screens.sm || screens.md) {
		labelContent = <span style={{ display: 'none' }}>Filter</span>; // Completely hidden for smaller screens
	}

	const allArticlePosts = useSelector((state) => state.post.posts);

	// Remove unused local list state (main list uses listMain)
	const [allListData] = useState([]); // State to store data conditionally

	// const [categories, setCategories] = useState([]);
	const [originalData, setOriginalData] = useState([]); // Store original dataset

	const isPrefaceToIslam = location.pathname.includes('preface-to-islam');
	// console.log(list,"list data");
	// console.log(allListData,"allListData data");
	// console.log(filteredData,"filteredData data");

	// Assuming you fetch this data from an API or some initial source
	const sourceData = isPrefaceToIslam ? allListData : allArticlePosts;

	useEffect(() => {
		setOriginalData(sourceData);
	}, [sourceData]);

	// Removed unused local list updates

	// Fetch languages on component mount
	// useEffect(() => {
	//   if (languages.length === 0) {
	//     dispatch(fetchAllLanguages());
	//   }
	// }, [dispatch, languages.length]);

	// Fetch posts by post type
	useEffect(() => {
		// Post type mapping
		const postTypeIdMapping = {
			'popular-article': '66d9d564987787d3e3ff1312',
			'popular-podcast': '66d9d564987787d3e3ff1313',
			'popular-video': '66d9d564987787d3e3ff1314',
		};

		const postTypeId = Object.keys(postTypeIdMapping).find((key) => location.pathname.includes(key));

		if (postTypeId) {
			dispatch(fetchAllPostsByPostType({ postTypeId: postTypeIdMapping[postTypeId] }));
		}
	}, [dispatch, location.pathname]);

	// Helper to refresh main Popular list (featured by post type)
	const refreshPopularList = async () => {
		const postTypeIdMapping = {
			'popular-article': '66d9d564987787d3e3ff1312',
			'popular-podcast': '66d9d564987787d3e3ff1313',
			'popular-video': '66d9d564987787d3e3ff1314',
		};

		const postTypeId = Object.keys(postTypeIdMapping).find((key) => location.pathname.includes(key));

		if (!postTypeId) return;

		try {
			const token = localStorage.getItem('auth_token');
			const response = await axios.get(`${API_BASE_URL}/posts/featured/${postTypeIdMapping[postTypeId]}`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: token,
				},
			});
			setListMain(response?.data?.data || []);
		} catch (error) {
			console.error(error.message);
		}
	};

	// popup list data
	useEffect(() => {
		refreshPopularList();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname]); // Rerun when the pathname changes

	// Function to format the current path
	const formatPath = (path) => {
		return path
			.split('-') // Split by hyphen
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
			.join(' '); // Join back with space
	};

	const dropdownMenu = (row) => (
		<Menu>
			<Menu.Item onClick={() => viewDetails(row)}>
				<Flex alignItems="center">
					<EyeOutlined />
					<span className="ml-2">View Details</span>
				</Flex>
			</Menu.Item>
			<Menu.Item onClick={() => deleteRow(row)}>
				{' '}
				{/* */}
				<Flex alignItems="center">
					<DeleteOutlined />
					<span className="ml-2">Remove</span>
				</Flex>
			</Menu.Item>
		</Menu>
	);

	// Function to handle opening the modal
	const AddArticle = () => {
		setIsModalVisible(true);
		form.resetFields();
	};

	//view details
	const viewDetails = (row) => {
		let path = '';

		if (location.pathname.includes('popular-article')) {
			path = 'view-article';
		} else if (location.pathname.includes('popular-podcast')) {
			path = 'view-podcast';
		} else if (location.pathname.includes('popular-video')) {
			path = 'view-video';
		}

		switch (path) {
			case 'view-article':
				navigate(`/admin/dashboards/articles/${path}/${row._id}`);
				break;
			case 'view-podcast':
				navigate(`/admin/dashboards/podcasts/${path}/${row._id}`);
				break;
			case 'view-video':
				navigate(`/admin/dashboards/videos/${path}/${row._id}`);
				break;
			default:
				console.error('No matching path found');
				break;
		}
	};

	//filter category, title, and language
	const handleFilter = async () => {
		const languageValue = form.getFieldValue('language');
		const categoryValue = form.getFieldValue('ParentCategory');
		const subCategoryValue = form.getFieldValue('categories');
		const titleValue = form.getFieldValue('title');

		if (!languageValue) {
			message.warning('Please select a language first');
			return;
		}
		if (!subCategoryValue) {
			message.warning('Please select a sub category to filter');
			return;
		}

		setModalLoading(true);
		setModalFilters({
			language: languageValue,
			parentCategory: categoryValue,
			categories: subCategoryValue || undefined,
			title: titleValue || '',
		});

		try {
			const token = localStorage.getItem('auth_token');
			const postTypeIdMapping = {
				'popular-article': '66d9d564987787d3e3ff1312',
				'popular-podcast': '66d9d564987787d3e3ff1313',
				'popular-video': '66d9d564987787d3e3ff1314',
			};

			const postTypeId = Object.keys(postTypeIdMapping).find((key) => location.pathname.includes(key));

			if (!postTypeId) {
				message.error('Invalid post type');
				return;
			}

			const page = 1;
			const limit = modalPagination.pageSize;

			const params = {
				page,
				limit,
				sortBy: 'priority',
				languageId: languageValue,
				language: languageValue,
				parentCategoryId: categoryValue,
				parentCategory: categoryValue,
				category: subCategoryValue,
				categoriesCsv: subCategoryValue,
				title: titleValue,
				search: titleValue,
			};

			const response = await axios.get(`${API_BASE_URL}/banner/posts/manage/${postTypeIdMapping[postTypeId]}`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: token,
				},
				params,
				paramsSerializer: (params) => {
					const q = new URLSearchParams();
					Object.entries(params).forEach(([key, value]) => {
						if (value === undefined || value === null || value === '') return;
						if (Array.isArray(value)) {
							q.set(key, value.join(','));
						} else {
							q.set(key, String(value));
						}
					});
					return q.toString();
				},
			});

			if (response?.data?.status === 'success') {
				const payload = response.data;
				const items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.docs) ? payload.docs : [];
				const p = payload.pagination || {};
				const sortedItems = [...items].sort((a, b) => (b?.featured === true) - (a?.featured === true));
				setFilteredData(sortedItems);
				setModalPagination({
					current: p.page || page,
					pageSize: p.limit || limit,
					total: p.total || 0,
				});
			} else {
				setFilteredData([]);
				setModalPagination({ current: 1, pageSize: limit, total: 0 });
			}
		} catch (err) {
			console.error('Error filtering posts:', err?.response || err);
			const serverMsg = err?.response?.data?.message || err?.message || 'Failed to fetch filtered posts';
			message.error(serverMsg);
			setFilteredData([]);
			setModalPagination({
				current: 1,
				pageSize: modalPagination.pageSize,
				total: 0,
			});
		} finally {
			setModalLoading(false);
		}
	};

	// Clear filters function
	const handleClearFilters = () => {
		form.resetFields();
		setFilteredData([]);
		setModalPagination({
			current: 1,
			pageSize: modalPagination.pageSize,
			total: 0,
		});
		setModalFilters({
			language: undefined,
			parentCategory: undefined,
			categories: undefined,
			title: '',
		});
	};

	// Function to handle checkbox change in popup list
	const handleCheckboxChange = (record) => {
		const nextStatus = !(featuredStatusChanges[record._id] ?? record.featured);
		setFeaturedStatusChanges((prev) => ({ ...prev, [record._id]: nextStatus }));

		// maintain visual selection list
		// setSelectedRowKeys((prev) => {
		//   const exists = prev.includes(record._id);
		//   if (!exists && nextStatus) return [...prev, record._id];
		//   if (exists && !nextStatus) return prev.filter((k) => k !== record._id);
		//   return prev;
		// });
	};

	// Function to handle submitting the form
	const handleOk = async (e) => {
		e.preventDefault();
		try {
			// Commit all toggles made in popup to backend
			const updates = Object.entries(featuredStatusChanges).map(([postId, newStatus]) => toggleFeaturedAPI(postId, newStatus));
			if (updates.length > 0) {
				await Promise.all(updates);
			}
			// Refresh the main Popular list so selected items appear
			await refreshPopularList();
			message.success('Popular list refreshed');

			// clear local selection state
			setFeaturedStatusChanges({});
			// setSelectedRowKeys([]);

			// Delay the reload slightly to ensure state is updated
			// setTimeout(() => {
			//   window.location.reload();
			// }, 100); // Adjust the timeout as necessary
		} catch (error) {
			message.error('Failed to update featured statuses');
		} finally {
			setIsModalVisible(false); // Hide the modal after the operation
		}
	};

	// Function to handle closing the modal
	const handleCancel = () => {
		setIsModalVisible(false);
		form.resetFields();
	};

	//LIST MAIN toggle data fetch
	const toggleFeaturedAPI = async (postId, newStatus) => {
		const token = localStorage.getItem('auth_token');
		if (!token) {
			message.error('Authorization token is missing');
			return;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/posts/${postId}/toggle-featured`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token,
				},
				body: JSON.stringify({ featured: newStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to update featured status');
			}
		} catch (error) {
			throw error; // Re-throw to handle in handleOk
		}
	};

	// No checkbox toggle in popup

	// remove the mainList data
	const deleteRow = async (row) => {
		const token = localStorage.getItem('auth_token'); // Get the token from local storage
		if (!token) {
			message.error('Authorization token is missing');
			return;
		}

		try {
			// API request to set featured to false
			const response = await axios.put(
				`${API_BASE_URL}/posts/${row._id}/toggle-featured`,
				{ featured: false },
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: token,
					},
				}
			);

			// Check if the response was successful
			if (response.status === 200) {
				// Update the state locally to reflect the new featured status
				const updatedList = listMain.map((item) => (item._id === row._id ? { ...item, featured: false } : item));
				setListMain(updatedList);
				message.success('Post removed successfully and set to not featured.');
				window.location.reload();
			} else {
				throw new Error('Failed to update featured status');
			}
		} catch (error) {
			message.error(error.message || 'Failed to remove the post');
		}
	};

	const onSearch = (e) => {
		const value = e.currentTarget.value;
		// If the input is empty, reset to original data
		const searchArray = value ? listMain : originalData; // Use original data when the search input is empty
		const data = utils.wildCardSearch(searchArray, value); // Use the search utility to filter the data
		setListMain(data); // Update the list to the filtered data
		// Clear local search selection state
	};

	const tableColumns = [
		{
			title: 'ID',
			dataIndex: '_id',
			render: (_, record, index) => <span>{index + 1}</span>,
		},
		{ title: 'Title', dataIndex: 'title' },
		{
			title: 'Language',
			dataIndex: 'language',
			render: (_, record) => record?.language?.name,
		},
		{
			title: 'Categories',
			dataIndex: 'categories',
			render: (_, record) => record?.categories?.map((item) => item?.parentCategory?.name).join(', ') + ' / ' + record?.categories?.map((item) => item?.name).join(', ') || 'Uncategorized',
		},
		{
			title: 'Status',
			dataIndex: 'status',
			render: (_, record) => {
				return (
					<>
						<Tag color={record?.status?.includes('sendback') ? 'red' : 'green'}>{record?.status}</Tag>
						{record?.editingSession?.id && <Tag color={'grey'}>Edit in progress</Tag>}
					</>
				);
			},
		},
	];

	const popupTableColumns = [
		...tableColumns,
		{
			title: 'Popular',
			dataIndex: 'select',
			render: (_, record) => (
				<Checkbox checked={featuredStatusChanges[record._id] !== undefined ? featuredStatusChanges[record._id] : record?.featured} onChange={() => handleCheckboxChange(record)} />
			),
		},
	];

	// Define the popup table columns by adding the "show/hidden" column
	const mainTableColumns = [
		...tableColumns,
		{
			title: '',
			dataIndex: 'actions',
			render: (_, elm) => (
				<Button className="text-right" danger style={{cursor:"pointer",padding:"4px 10px" }} onClick={() => deleteRow(elm)}>
					<DeleteOutlined />
				</Button>
			),
		},
	];

	return (
		<Card>
			<Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
				<Flex className="mb-1" mobileFlex={false}>
					<div className="mr-md-3 mb-3">
						<Input placeholder="Search" prefix={<SearchOutlined />} onChange={(e) => onSearch(e)} />
					</div>
				</Flex>
				<div>
					<Button onClick={AddArticle} type="primary" icon={<PlusCircleOutlined />} block>
						Add {formatPath(currentPath)}
					</Button>
				</div>
			</Flex>

			{/* Modal for Adding Article */}
			<Modal title={formatPath(currentPath)} visible={isModalVisible} onOk={handleOk} onCancel={handleCancel} okText="Submit" cancelText="Cancel" width={'90%'}>
				<Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
					<Row gutter={[5, 1]}>
						<Col xs={24} sm={12} md={12} lg={12} xl={4}>
							<Form.Item label="Language" name="language">
								<Select
									placeholder="Select Language"
									loading={languagesLoading}
									style={{ width: '100%' }}
									allowClear
									options={languages.map((l) => ({
										label: l.name,
										value: l._id,
									}))}
								/>
							</Form.Item>
						</Col>
						{/* Parent category dropdown */}
						<Col xs={24} sm={12} md={12} lg={12} xl={4}>
							<Form.Item label="Parent Category" name="ParentCategory">
								<Select
									placeholder={watchedLanguage ? 'Select a parent category' : 'Please select a language first'}
									loading={categoriesLoading}
									style={{ width: '100%' }}
									disabled={!watchedLanguage}
									allowClear
									options={availableParentCategories.map((c) => ({
										label: c.name,
										value: c._id,
									}))}
								/>
							</Form.Item>
						</Col>
						{/* Sub category dropdown */}
						<Col xs={24} sm={12} md={12} lg={12} xl={4}>
							<Form.Item label="Sub Category" name="categories">
								<Select
									placeholder={watchedParentCategory ? 'Select sub categories' : 'Please select a parent category first'}
									loading={categoriesLoading}
									style={{ width: '100%' }}
									disabled={!watchedParentCategory}
									allowClear
									options={availableSubCategories.map((c) => ({
										label: c.name,
										value: c._id,
									}))}
								/>
							</Form.Item>
						</Col>
						{/* Title */}
						<Col xs={24} sm={12} md={20} lg={20} xl={8}>
							<Form.Item name="title" label={'Title'}>
								<AntInput placeholder={`Enter title to search`} />
							</Form.Item>
						</Col>
						{/* <Col xs={24} sm={24} md={8} lg={10}>
              <Form.Item label="Search">
                <Input
                  placeholder="Search by title..."
                  prefix={<SearchOutlined />}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  allowClear
                  onPressEnter={(e) => handleSearch(e)}
                />
              </Form.Item>
            </Col> */}

						{/* Filter button */}
						<Col xs={8} sm={12} md={4} lg={4} xl={2}>
							<Form.Item label={labelContent}>
								<Button onClick={handleFilter} type="primary" style={{ width: '100%' }}>
									Find
								</Button>
							</Form.Item>
						</Col>

						{/* Clear Filters button */}
						<Col xs={8} sm={12} md={4} lg={4} xl={2}>
							<Form.Item label={<span style={{ visibility: 'hidden' }}>Clear</span>}>
								<Button onClick={handleClearFilters} type="default" style={{ width: '100%' }}>
									Clear
								</Button>
							</Form.Item>
						</Col>
					</Row>
					<div>
						{/*popup list Table */}
						<Table
							columns={popupTableColumns}
							dataSource={filteredData}
							rowKey="_id"
							loading={modalLoading}
							// rowSelection={{
							//   selectedRowKeys,
							//   onChange: (keys) => setSelectedRowKeys(keys),
							// }}
							locale={{
								emptyText: filteredData.length === 0 && !modalLoading ? 'Select language and sub category, then click Find to load posts' : undefined,
							}}
							pagination={{
								current: modalPagination.current,
								pageSize: modalPagination.pageSize,
								total: modalPagination.total,
								showSizeChanger: true,
								showQuickJumper: false,
								onChange: (page, pageSize) => fetchModalPage(page, pageSize),
								onShowSizeChange: (current, size) => fetchModalPage(1, size),
								showTotal: (total, range) => (total > 0 ? `${range[0]}-${range[1]} of ${total} posts` : '0 posts'),
							}}
						/>
					</div>
				</Form>
			</Modal>

			<div className="table-responsive">
				{/* main list table   */}
				<Table
					columns={mainTableColumns}
					dataSource={listMain}
					rowKey="_id"
					// rowSelection={{
					//   selectedRowKeys: selectedRowKeys,
					//   type: "checkbox",
					//   preserveSelectedRowKeys: false,
					//   ...rowSelection,
					// }}
				/>
			</div>
		</Card>
	);
};

export default ListPost;
