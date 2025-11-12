# Image Cropping Implementation with react-easy-crop

## Overview
This implementation adds image cropping functionality to the article form using the `react-easy-crop` library. Users can now adjust, zoom, rotate, and crop images before uploading them.

## Features
✅ **Zoom Control**: Zoom in/out with slider (1x to 3x)
✅ **Rotation**: Rotate images with buttons (-90°/+90°) or slider (0° to 360°)
✅ **Aspect Ratio Selection**: Choose from multiple aspect ratios (16:9, 4:3, 1:1, 3:4, 9:16, Free)
✅ **Visual Grid**: Grid overlay for better alignment
✅ **Modal Interface**: Clean modal for cropping experience
✅ **Multiple Image Types**: Works with thumbnail, featured, and regular images

## Files Created

### 1. ImageCropper Component
**Location**: `src/components/shared-components/ImageCropper/index.js`

Reusable component that provides the cropping interface with:
- Cropper canvas using react-easy-crop
- Zoom slider with icons
- Rotation controls (buttons + slider)
- Aspect ratio selector
- Confirm/Cancel actions

### 2. Image Cropper Styles
**Location**: `src/components/shared-components/ImageCropper/ImageCropper.css`

Styling for:
- Crop container (400px height with dark background)
- Controls container
- Modal layout
- Responsive controls

### 3. Image Crop Utilities
**Location**: `src/utils/imageCropUtils.js`

Utility functions for:
- `createImage()`: Create image element from URL
- `getRadianAngle()`: Convert degrees to radians
- `rotateSize()`: Calculate rotated rectangle bounds
- `getCroppedImg()`: Generate cropped image blob from canvas
- `blobToFile()`: Convert blob to file
- `readFile()`: Read file as data URL

## Integration in GeneralField.js

The component has been integrated into the article form with:

### State Management
```javascript
const [cropperVisible, setCropperVisible] = useState(false);
const [currentImageForCrop, setCurrentImageForCrop] = useState(null);
const [currentImageType, setCurrentImageType] = useState(null);
const [originalFile, setOriginalFile] = useState(null);
```

### Handler Functions

**handleOpenCropper**: Opens cropper modal with selected image
**handleCropComplete**: Processes cropped image and uploads it
**handleCropCancel**: Closes cropper and clears state

### Upload Integration

All three upload areas (Thumbnail, Featured, Image) now:
1. Validate the file (PNG/WebP, <1MB)
2. Open the cropper modal if valid
3. Allow user to adjust the image
4. Upload the cropped version

## Usage

### For Users
1. Click or drag an image to any upload area
2. Image cropper modal opens automatically
3. Adjust the image:
   - Use zoom slider to zoom in/out
   - Use rotation buttons or slider to rotate
   - Select different aspect ratios from dropdown
   - Drag to reposition the crop area
4. Click "Confirm" to proceed with upload
5. Click "Cancel" to discard and select a different image

### For Developers

#### Using the ImageCropper Component
```javascript
import ImageCropper from 'components/shared-components/ImageCropper';

<ImageCropper
  visible={true}
  image={imageDataUrl}
  onCancel={() => {}}
  onComplete={(croppedAreaPixels, rotation) => {}}
  aspectRatio={16 / 9}
  cropShape="rect"
  showAspectRatioSelector={true}
  showGrid={true}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| visible | boolean | - | Controls modal visibility |
| image | string | - | Image data URL |
| onCancel | function | - | Callback when cancelled |
| onComplete | function | - | Callback with crop data |
| aspectRatio | number | 16/9 | Initial aspect ratio |
| cropShape | string | 'rect' | 'rect' or 'round' |
| showAspectRatioSelector | boolean | true | Show ratio dropdown |
| showGrid | boolean | true | Show alignment grid |

#### Using Crop Utilities
```javascript
import { getCroppedImg, readFile, blobToFile } from 'utils/imageCropUtils';

// Read a file
const imageDataUrl = await readFile(file);

// Crop the image
const croppedBlob = await getCroppedImg(
  imageDataUrl,
  croppedAreaPixels,
  rotation
);

// Convert to file
const croppedFile = blobToFile(croppedBlob, 'cropped-image.png');
```

## Technical Details

### How It Works

1. **File Selection**: User selects an image file
2. **File Reading**: File is read as Data URL using FileReader
3. **Crop UI**: react-easy-crop displays the image with crop overlay
4. **User Adjustments**: User zooms, rotates, and positions the crop area
5. **Canvas Processing**: 
   - Original image is drawn to canvas with rotation
   - Cropped area is extracted to new canvas
   - Canvas is converted to blob
6. **Upload**: Cropped blob is converted to file and uploaded

### Benefits

- **Better User Experience**: Users get exactly the image they want
- **Consistent Image Sizes**: Cropping ensures proper aspect ratios
- **Reduced Server Load**: Images are processed client-side
- **Preview Before Upload**: Users see exactly what will be uploaded

## Customization

### Change Default Aspect Ratio
Edit the `aspectRatio` prop in GeneralField.js:
```javascript
<ImageCropper
  aspectRatio={4 / 3}  // Change to desired ratio
  ...
/>
```

### Add More Aspect Ratios
Edit `aspectRatios` array in ImageCropper component:
```javascript
const aspectRatios = [
  { label: '21:9', value: 21 / 9 },  // Add new ratio
  ...
];
```

### Change Crop Shape
```javascript
<ImageCropper
  cropShape="round"  // For circular crops
  ...
/>
```

### Adjust Zoom Range
Edit slider props in ImageCropper:
```javascript
<Slider
  min={1}
  max={5}  // Change max zoom
  step={0.1}
  ...
/>
```

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 (requires polyfills)

## Dependencies

- `react-easy-crop`: ^5.5.3 (already installed)
- `antd`: For UI components
- `@ant-design/icons`: For icons

## Future Enhancements

Potential improvements:
- Add flip horizontal/vertical controls
- Add filters (brightness, contrast, etc.)
- Support for multiple image formats (JPEG, GIF)
- Add crop presets for common social media sizes
- Save crop settings per image type
- Undo/redo functionality

## Troubleshooting

### Image not loading in cropper
- Check if file is valid PNG/WebP
- Verify file size is under 1MB
- Check browser console for errors

### Cropped image quality issues
- Increase canvas size in `getCroppedImg()` function
- Use higher quality source images
- Adjust MIME type in blob conversion

### Upload not working after crop
- Verify upload endpoints are accessible
- Check AUTH_TOKEN is valid
- Ensure proper file format after crop

## Support

For issues or questions:
1. Check browser console for errors
2. Verify react-easy-crop version
3. Review network tab for upload requests
4. Check file size and format constraints
