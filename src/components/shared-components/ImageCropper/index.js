import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Modal, Button, Slider, Row, Col, Select, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, RotateLeftOutlined, RotateRightOutlined } from '@ant-design/icons';
import './ImageCropper.css';

const { Option } = Select;

const ImageCropper = ({
	visible,
	image,
	onCancel,
	onComplete,
	aspectRatio = 16 / 9,
	cropShape = 'rect', // 'rect' or 'round'
	showAspectRatioSelector = true,
	showGrid = true,
	aspectRatios = [
		{ label: '16:9 (widescreen)', value: 16 / 9 },
		{ label: '4:3 (landscape)', value: 4 / 3 },
		{ label: '3:1 (banner)', value: 3 / 1 },
		{ label: '1:1 (square)', value: 1 },
		{ label: '3:4 (portrait)', value: 3 / 4 },
		{ label: '9:16 (vertical)', value: 9 / 16 },
	],
}) => {
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [rotation, setRotation] = useState(0);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
	const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);

	// Reset state when modal opens with new image
	useEffect(() => {
		if (visible && image) {
			setCrop({ x: 0, y: 0 });
			setZoom(1);
			setRotation(0);
			setCroppedAreaPixels(null);
			setSelectedAspectRatio(aspectRatio);
		}
	}, [visible, image, aspectRatio]);

	// Handle zoom changes
	const handleZoomChange = useCallback((newZoom) => {
		setZoom(newZoom);
	}, []);

	// Handle aspect ratio change
	const handleAspectRatioChange = useCallback((newRatio) => {
		setSelectedAspectRatio(newRatio);
		// Reset crop position when aspect ratio changes
		setCrop({ x: 0, y: 0 });
	}, []);

	//   const aspectRatios = [
	//     // { label: '16:9 (widescreen)', value: 16 / 9 },
	//     { label: '4:3 (image landscape)', value: 4 / 3 },
	//     { label: '3:1 (banner)', value: 3 / 1 },
	//     { label: '1:1 (featured square)', value: 1 },
	//     // { label: '3:4 (portrait)', value: 3 / 4 },
	//     // { label: '9:16 (image vertical)', value: 9 / 16 },
	//   ];

	const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
		console.log('Crop complete:', { croppedArea, croppedAreaPixels });
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);

	const handleConfirm = async () => {
		if (!croppedAreaPixels) {
			console.error('No cropped area pixels available');
			return;
		}

		console.log('Confirming crop with:', { croppedAreaPixels, rotation, zoom });

		if (onComplete) {
			onComplete(croppedAreaPixels, rotation);
		}
	};

	const handleCancel = () => {
		// Reset states
		setCrop({ x: 0, y: 0 });
		setZoom(1);
		setRotation(0);
		setCroppedAreaPixels(null);
		setSelectedAspectRatio(aspectRatio);
		onCancel();
	};

	const handleRotateLeft = () => {
		setRotation((prev) => prev - 90);
	};

	const handleRotateRight = () => {
		setRotation((prev) => prev + 90);
	};

	return (
		<Modal
			title="Crop Image"
			open={visible}
			onCancel={handleCancel}
			width={800}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					Cancel
				</Button>,
				<Button key="confirm" type="primary" onClick={handleConfirm}>
					Confirm
				</Button>,
			]}
			className="image-cropper-modal">
			<div className="crop-container">
				{image && (
					<Cropper
						key={`cropper-${selectedAspectRatio}`}
						image={image}
						crop={crop}
						zoom={zoom}
						rotation={rotation}
						aspect={selectedAspectRatio}
						onCropChange={setCrop}
						onCropComplete={onCropComplete}
						onZoomChange={handleZoomChange}
						onRotationChange={setRotation}
						cropShape={cropShape}
						showGrid={showGrid}
						restrictPosition={false}
						zoomSpeed={0.5}
						zoomWithScroll={true}
					/>
				)}
			</div>

			<div className="controls-container">
				{showAspectRatioSelector && (
					<Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
						<Col span={24}>
							<label style={{ marginRight: 8 }}>Aspect Ratio:</label>
							<Select value={selectedAspectRatio} onChange={handleAspectRatioChange} style={{ width: 120 }}>
								{aspectRatios.map((ratio) => (
									<Option key={ratio.label} value={ratio.value}>
										{ratio.label}
									</Option>
								))}
							</Select>
						</Col>
					</Row>
				)}

				<Row gutter={[16, 16]}>
					<Col span={24}>
						<div className="control-item">
							<label style={{ minWidth: '60px' }}>Zoom</label>
							<Space style={{ marginLeft: 16, flex: 1, width: '100%' }}>
								<Button icon={<ZoomOutOutlined />} onClick={() => handleZoomChange(Math.max(1, zoom - 0.1))} size="small" disabled={zoom <= 1} />
								<Slider value={zoom} min={1} max={3} step={0.1} onChange={handleZoomChange} style={{ flex: 1, minWidth: 200 }} tooltip={{ formatter: (value) => `${value}x` }} />
								<Button icon={<ZoomInOutlined />} onClick={() => handleZoomChange(Math.min(3, zoom + 0.1))} size="small" disabled={zoom >= 3} />
								<span style={{ minWidth: '40px', textAlign: 'center' }}>{zoom.toFixed(1)}x</span>
							</Space>
						</div>
					</Col>
				</Row>

				<Row gutter={[16, 16]}>
					<Col span={24}>
						<div className="control-item">
							<label style={{ minWidth: '60px' }}>Rotation</label>
							<Space style={{ marginLeft: 16, flex: 1 }}>
								<Button icon={<RotateLeftOutlined />} onClick={handleRotateLeft} size="small">
									-90°
								</Button>
								<Slider value={rotation} min={0} max={360} step={1} onChange={setRotation} style={{ flex: 1, minWidth: 200 }} tooltip={{ formatter: (value) => `${value}°` }} />
								<Button icon={<RotateRightOutlined />} onClick={handleRotateRight} size="small">
									+90°
								</Button>
								<span style={{ minWidth: '40px', textAlign: 'center' }}>{rotation}°</span>
							</Space>
						</div>
					</Col>
				</Row>
			</div>
		</Modal>
	);
};

export default ImageCropper;
