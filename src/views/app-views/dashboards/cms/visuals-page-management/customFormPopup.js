import React, { useEffect, useState } from 'react';
import { Input, Row, Col, Card, Form, Upload, message, Select, Button, Switch } from 'antd';
import { ImageSvg } from 'assets/svg/icon';
import CustomIcon from 'components/util-components/CustomIcon';
import { LoadingOutlined } from '@ant-design/icons';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllLanguages } from 'store/slices/languagesSlice';
import axios from 'axios';

// Create an axios instance specifically for file uploads
const uploadInstance = axios.create({
    baseURL: 'https://king-prawn-app-x9z27.ondigitalocean.app',
    timeout: 60000, // 60 seconds
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
    }
});

const { Dragger } = Upload;
const { Option } = Select;

const rules = {
	title: [{ required: true, message: 'Please enter title' }],
	language: [{ required: true, message: 'Please select language' }],
	// videoLink optional; image/video optional per API spec
};

const featuredUploadProps = {
	name: 'image',
	multiple: false,
	listType: 'picture-card',
	showUploadList: false,
	accept: 'image/png,image/webp',
};

const beforeUpload = (file) => {
	const isPngOrWebp = file.type === 'image/png' || file.type === 'image/webp';
	if (!isPngOrWebp) {
		message.error('You can only upload PNG or WebP files!');
		return Upload.LIST_IGNORE;
	}
	const isLt1M = file.size / 1024 / 1024 < 1;
	if (!isLt1M) {
		message.error('Image must be smaller than 1MB!');
		return Upload.LIST_IGNORE;
	}
	// Prevent auto-upload; we'll handle file in onChange and submit via FormData
	return false;
};


const CustomFormPopup = (props) => {
	const { record, onSuccess } = props || {};
	const viewModeProp = props?.view || false;
	const dispatch = useDispatch();
	const [form] = Form.useForm();

	const languages = useSelector((state) => state.languages.languages);

	// Keep selected language id for submission and separate code for fetching
	const [selectedLanguage, setSelectedLanguage] = useState(null); // language _id for POST
	const [selectedLanguageCode, setSelectedLanguageCode] = useState('en'); // language code for GET
	const [uploadedFeaturedImg, setUploadedFeaturedImg] = useState(''); // preview URL (object URL or remote URL)
	const [featuredFile, setFeaturedFile] = useState(null); // actual File for submit (image)
	const [videoFile, setVideoFile] = useState(null); // actual File for submit (video)
	const [videoPreviewUrl, setVideoPreviewUrl] = useState(''); // object URL for local video preview
	const [removedVideo, setRemovedVideo] = useState(false); // whether existing video was removed in edit
	const [statusBool, setStatusBool] = useState(false);
	const [uploadFeaturedImgLoading, setUploadFeaturedImgLoading] = useState(false);
	const [deactivating, setDeactivating] = useState(false);
	const [loadingRecord, setLoadingRecord] = useState(false);

	const normalizeVideoUrl = (value) => {
		if (!value) return "";
		// For blob URLs (local file previews)
		if (value.startsWith('blob:')) return value;

		// For DigitalOcean Spaces URLs (do NOT append timestamp for videos)
		if (value.includes('digitaloceanspaces.com')) {
			// Ensure HTTPS
			return value.replace('http://', 'https://');
		}

		// For relative paths or API paths
		const API_HOST = 'https://king-prawn-app-x9z27.ondigitalocean.app';
		if (value.startsWith('/')) return `${API_HOST}${value}`;
		if (!value.startsWith('http')) return `${API_HOST}/${value}`;

		// For all other URLs
		return value;
	};

	// Removed fullscreen toggle button per request

	useEffect(() => {
		if (!languages.length) dispatch(fetchAllLanguages());
	}, [dispatch, languages.length]);


	// Fetch latest data by ID for edit/view mode
	useEffect(() => {
		const fetchById = async (id) => {
			setLoadingRecord(true);
			try {
				const token = localStorage.getItem('auth_token');
				const res = await axios.get(`https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals/${id}`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: token,
					},
				});
				const data = res?.data || {};
				// Handle language as string or object
				const langId = data?.language?._id || data?.language;
				const langObj = languages.find((l) => l._id === langId || l.code === data.language);
				setSelectedLanguage(langObj?._id || langId || null);
				setSelectedLanguageCode(langObj?.code || '');
				form.setFieldsValue({
					title: data?.title || '',
					link: data?.videoLink || data?.video_link || data?.link || '',
					language: langObj?._id || langId || null,
					featured_image: data?.image || '',
				});
				setUploadedFeaturedImg(data?.image || '');
				setStatusBool(Boolean(data?.status));
				setVideoPreviewUrl(data?.video || data?.videoUrl || data?.video_url || '');
			} catch (e) {
				message.error(e?.response?.data?.message || 'Failed to load visual');
			} finally {
				setLoadingRecord(false);
			}
		};

		if (record && record._id) {
			fetchById(record._id);
		}
	}, [record, form, languages]);

	// Reset form when creating a new visual (no record provided)
	useEffect(() => {
		if (!record || !record._id) {
			form.resetFields();
			setUploadedFeaturedImg('');
			setFeaturedFile(null);
			setVideoFile(null);
			if (videoPreviewUrl) {
				URL.revokeObjectURL(videoPreviewUrl);
			}
			setVideoPreviewUrl('');
			setRemovedVideo(false);
			setStatusBool(false);
			setSelectedLanguage(null);
			setSelectedLanguageCode('en');
		}
	}, [record, form, videoPreviewUrl]);

	// Cleanup object URL on unmount or when URL changes
	useEffect(() => {
		return () => {
			if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
				URL.revokeObjectURL(videoPreviewUrl);
			}
		};
	}, [videoPreviewUrl]);

	// Auto-load existing data when language is selected (uses language CODE in GET)
	useEffect(() => {
		const load = async () => {
			// Skip loading if we're in view mode and have a record
			if (viewModeProp && record) return;

			if (!selectedLanguageCode) return;
			// Skip for Add and Edit to avoid overwriting
			if (!viewModeProp) return;

			try {
				const token = localStorage.getItem('auth_token');
				const res = await axios.get(`https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals?lang=${selectedLanguageCode}&page=1&limit=10`, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: token,
					},
				});
				const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
				const data = arr?.[0] || {};
				if (data) {
					const langId = data.language?._id || data.language;
					const langObj = languages.find((l) => l._id === langId || l.code === data.language);
					if (langObj) {
						setSelectedLanguage(langObj._id);
						setSelectedLanguageCode(langObj.code || '');
					}
					form.setFieldsValue({
						title: data.title,
						link: data.videoLink,
						language: langObj?._id || langId,
						featured_image: data.image,
					});
					setUploadedFeaturedImg(data.image || '');
					setStatusBool(Boolean(data.status));
					setVideoPreviewUrl(data.video || '');
				}
			} catch (e) {
				message.error(e?.response?.data?.message || 'Failed to load visuals');
			}
		};
		load();
	}, [selectedLanguageCode, languages, form, record, viewModeProp]);

	const handleFeaturedImgUploadChange = (info) => {
		const file = info?.file?.originFileObj || info?.file;
		if (!file) return;
		setUploadFeaturedImgLoading(true);
		setFeaturedFile(file);
		// Create preview URL
		const previewUrl = URL.createObjectURL(file);
		setUploadedFeaturedImg(previewUrl);
		form.setFieldsValue({ featured_image: file.name });
		setUploadFeaturedImgLoading(false);
	};

	const handleDeactivate = async () => {
		try {
			setDeactivating(true);
			const token = localStorage.getItem('auth_token');
			const values = await form.validateFields(['title']);
			if (!selectedLanguage) {
				message.warning('Language is required');
				return;
			}
			const formData = new FormData();
			formData.append('title', values.title);
			formData.append('language', selectedLanguage);
			formData.append('status', false);
			const linkVal = (form.getFieldValue('link') || '').trim();
			formData.append('videoLink', linkVal);

			// Handle image file
			if (featuredFile) {
				formData.append('image', featuredFile, featuredFile.name);
			}

			// Handle video file
			if (videoFile) {
				// Ensure proper video MIME type
				const videoType = videoFile.type || 'video/mp4';
				const videoBlob = new Blob([videoFile], { type: videoType });
				formData.append('video', videoBlob, videoFile.name);
			}
			await axios.post(`https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals`, formData, {
				headers: {
					Authorization: token,
					'Content-Type': 'multipart/form-data',
					'Accept': 'application/json',
				},
				maxBodyLength: Infinity,
				maxContentLength: Infinity,
			});
			message.success('Visual saved as deactivated');
			onSuccess();
		} catch (e) {
			const msg = e?.response?.data?.message || e?.message || 'Failed to submit';
			message.error(msg);
		} finally {
			setDeactivating(false);
		}
	};

	const submitFeaturedArticle = async () => {
		try {
			const token = localStorage.getItem('auth_token');
			const fieldsToValidate = ['title']; // always need title
			if (!(record && record._id)) {
				fieldsToValidate.push('language'); // only require language on add
			}
			const values = await form.validateFields(fieldsToValidate);
			if (!(record && record._id) && !selectedLanguage) {
				message.warning('Language is required');
				return;
			}
			// Required checks
			const hasTitle = !!values.title && values.title.trim() !== '';
			const hasImage = !!featuredFile || !!uploadedFeaturedImg;
			const statusDefined = statusBool !== undefined && statusBool !== null;
			const hasVideoFile = !!videoFile;
			const linkVal = (form.getFieldValue('link') || '').trim();
			const hasVideoLink = linkVal !== '';
			if (!hasTitle) {
				message.warning('Title is required');
				return;
			}
			if (!hasImage) {
				message.warning('Image is required');
				return;
			}
			if (!statusDefined) {
				message.warning('Status is required');
				return;
			}
			if (!hasVideoFile && !hasVideoLink) {
				message.warning('Provide either a video file or a video link');
				return;
			}
			const formData = new FormData();
			formData.append('title', values.title);
			if (!(record && record._id)) {
				formData.append('language', selectedLanguage);
			}
			formData.append('status', statusBool === undefined || statusBool === null ? false : statusBool);
			formData.append('videoLink', linkVal);

			// Handle image file
			if (featuredFile) {
				formData.append('image', featuredFile, featuredFile.name);
			}

			// Handle video file
			if (videoFile) {
				formData.append('video', videoFile);
			}

			// Handle video removal in edit mode
			if (record && record._id && removedVideo && !videoFile) {
				formData.append('removeVideo', 'true');
				formData.append('video', '');
			}
			if (record && record._id) {
				await axios.put(`https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals/${record._id}`, formData, {
					headers: {
						Authorization: token,
						'Content-Type': 'multipart/form-data',
					},
				});
				message.success('Visual updated');
			} else {
				await axios.post(`https://king-prawn-app-x9z27.ondigitalocean.app/api/visuals`, formData, {
					headers: {
						Authorization: token,
						'Content-Type': 'multipart/form-data',
					},
				});
				message.success('Visual saved');
			}
			if (onSuccess) onSuccess();
		} catch (e) {
			const msg = e?.response?.data?.message || e?.message || 'Failed to submit';
			message.error(msg);
		}
	};

	return (
		<div>
			<Form form={form} layout="vertical">
				<Row gutter={16}>
					<Col xs={24} sm={24} md={17}>
						<div style={{ display: 'flex', gap: 8, paddingBottom: 16 }}>
							{!viewModeProp && !(record && record._id) && (
								<div>
									<Select
										style={{ width: '100%' }}
										placeholder="Language"
										onChange={(val) => {
											setSelectedLanguage(val); // id for POST
											const found = languages.find((l) => l._id === val);
											setSelectedLanguageCode(found?.code || ''); // code for GET
											form.setFieldsValue({ language: val }); // store id in form
										}}
										value={selectedLanguage || form.getFieldValue('language')}>
										{languages.map((language) => (
											<Option key={language._id} value={language._id}>
												{language.name}
											</Option>
										))}
									</Select>
								</div>
							)}
							<div style={{ display: 'flex', gap: 12, marginLeft: 'auto', alignItems: 'center' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>Status</span>
									<Switch checked={statusBool} onChange={setStatusBool} disabled={viewModeProp} />
								</div>
								{!viewModeProp && !(record && record._id) && (
									<Button type="default" onClick={handleDeactivate} loading={deactivating}>
										Save as Deactivated
									</Button>
								)}
								{!viewModeProp && (
									<Button type="primary" onClick={submitFeaturedArticle}>
										Save Visual
									</Button>
								)}
							</div>
						</div>
						<Card>
							<Form.Item name="title" label="Title" rules={rules.title}>
								<Input placeholder="Title" disabled={viewModeProp} />
							</Form.Item>
							<Form.Item name="link" label="videoLink">
								<Input placeholder="https://example.com" disabled={viewModeProp} />
							</Form.Item>
							{/* Hidden field to store image filename for optional validation */}
							<Form.Item name="featured_image" style={{ display: 'none' }}>
								<Input type="hidden" />
							</Form.Item>
							<div className={`editor-container`}>{props.children}</div>
						</Card>
					</Col>
					<Col xs={24} sm={24} md={7}>
						<Card title="Image">
							<Dragger disabled={viewModeProp} {...featuredUploadProps} beforeUpload={beforeUpload} onChange={handleFeaturedImgUploadChange}>
								{uploadedFeaturedImg ? (
									<img src={uploadedFeaturedImg} alt="avatar" className="img-fluid" />
								) : (
									<div>
										{uploadFeaturedImgLoading ? (
											<div>
												<LoadingOutlined className="font-size-xxl text-primary" />
												<div className="mt-3">Uploading</div>
											</div>
										) : (
											<div>
												<CustomIcon className="display-3" svg={ImageSvg} />
												<p>Click or drag file to upload</p>
											</div>
										)}
									</div>
								)}
							</Dragger>
						</Card>
						<Card title="Video">
							{videoPreviewUrl ? (
								<div>
									<video
										key={videoPreviewUrl}
										style={{ width: '100%' }}
										controls
										playsInline
										preload="metadata"
										crossOrigin="anonymous"
										onError={(e) => {
											console.error('Video error:', e);
											message.error('Unable to load video. Please ensure the video URL is accessible.');
										}}
									>
										<source 
											src={normalizeVideoUrl(videoPreviewUrl)} 
											type="video/mp4"
										/>
										Your browser does not support the video tag.
									</video>
									{!viewModeProp && (
										<div style={{ marginTop: 8 }}>
											<Upload.Dragger
												disabled={viewModeProp}
												multiple={false}
												showUploadList={false}
												beforeUpload={() => false}
												accept="video/*"
												onChange={(info) => {
													const file = info?.file?.originFileObj || info?.file;
													if (!file) return;

													// Check file size (100MB limit)
													const isLt100M = file.size / 1024 / 1024 < 100;
													if (!isLt100M) {
														message.error('Video must be smaller than 100MB');
														return;
													}

													const supported = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
													if (file.type && !supported.includes(file.type)) {
														message.warning('This video format may not play in all browsers. Prefer MP4 (H.264) or WebM.');
													}

													// Use the file directly
													setVideoFile(file);
													if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
													const url = URL.createObjectURL(file);
													setVideoPreviewUrl(url);
													setRemovedVideo(false);
												}}>
												<div>Replace video (click or drag)</div>
											</Upload.Dragger>
											{record && record._id && (
												<Button
													danger
													type="link"
													onClick={() => {
														if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
															URL.revokeObjectURL(videoPreviewUrl);
														}
														setVideoPreviewUrl('');
														setVideoFile(null);
														setRemovedVideo(true);
													}}>
													Remove video
												</Button>
											)}
										</div>
									)}
								</div>
							) : (
								<Upload.Dragger
									disabled={viewModeProp}
									multiple={false}
									showUploadList={!!videoFile}
									beforeUpload={() => false}
									accept="video/*"
									onChange={(info) => {
										const file = info?.file?.originFileObj || info?.file;
										if (!file) return;
										const supported = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
										if (file.type && !supported.includes(file.type)) {
											message.warning('This video format may not play in all browsers. Prefer MP4 (H.264) or WebM.');
										}
										setVideoFile(file);
										const url = URL.createObjectURL(file);
										setVideoPreviewUrl(url);
										setRemovedVideo(false);
									}}>
									<div>Click or drag video file to upload</div>
								</Upload.Dragger>
							)}
						</Card>
					</Col>
				</Row>
			</Form>
		</div>
	);
};

export default CustomFormPopup;
