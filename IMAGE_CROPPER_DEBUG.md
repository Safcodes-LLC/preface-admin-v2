# Image Cropper Debugging Guide

## Changes Made to Fix Zoom, Ratio, and Upload Issues

### 1. ImageCropper Component Fixes

#### Added Proper Handlers
- `handleZoomChange`: Memoized callback for zoom changes
- `handleAspectRatioChange`: Resets crop position when ratio changes
- Added key prop to Cropper to force re-render on aspect ratio change

#### Updated Cropper Props
```javascript
<Cropper
  key={`cropper-${selectedAspectRatio}`}  // Forces re-render
  onZoomChange={handleZoomChange}          // Uses handler instead of setState
  // ... other props
/>
```

#### Added Validation in handleConfirm
- Checks if `croppedAreaPixels` exists before confirming
- Logs crop data for debugging

#### Added Console Logging
- `onCropComplete`: Logs when crop calculation completes
- `handleConfirm`: Logs crop data before calling parent
- All zoom/rotation changes tracked

### 2. GeneralField.js Upload Fixes

#### Added Validation
```javascript
if (!croppedAreaPixels) {
  message.error('Please wait for the crop area to be calculated');
  return;
}

if (!currentImageForCrop) {
  message.error('No image selected');
  return;
}
```

#### Added Comprehensive Logging
- Logs when crop starts
- Logs blob creation
- Logs file conversion
- Logs upload URL and type
- Logs response status and result
- Logs errors with full context

## Testing Steps

### 1. Check Browser Console
Open browser DevTools (F12) and watch the Console tab for:

**When opening cropper:**
- "Starting crop with: ..." should appear

**As you adjust the image:**
- "Crop complete: ..." should appear repeatedly
- Should show width, height, x, y values

**When you zoom:**
- Slider should move
- Value display should update
- Console should log crop complete events

**When you change aspect ratio:**
- Dropdown should change
- Image should adjust
- Crop area should reset

**When you click Confirm:**
- "Confirming crop with: ..." should appear
- "Cropped blob created: ..." should appear
- "Cropped file created: ..." should appear
- "Uploading to: ..." should appear
- "Upload response status: ..." should appear
- "Upload result: ..." should appear

### 2. Test Zoom Functionality

Try these zoom methods:
1. **Slider**: Drag from 1.0x to 3.0x
2. **Zoom In Button** (+): Click multiple times
3. **Zoom Out Button** (-): Click multiple times
4. **Mouse Wheel**: Scroll while hovering over image
5. **Value Display**: Should show current zoom (e.g., "1.5x")

**Expected Behavior:**
- All methods should change zoom level
- Image should visibly zoom in/out
- Buttons disabled at min/max
- Crop area recalculates (console logs)

### 3. Test Aspect Ratio

Try each ratio in dropdown:
- 16:9 (wide)
- 4:3 (standard)
- 1:1 (square)
- 3:4 (portrait)
- 9:16 (tall portrait)
- Free (no constraint)

**Expected Behavior:**
- Crop box shape changes immediately
- Image adjusts to show selected ratio
- Console shows "Crop complete" after change

### 4. Test Upload

After cropping and clicking Confirm:

**Expected Console Output:**
```
Confirming crop with: {croppedAreaPixels: {...}, rotation: 0, zoom: 1.5}
Starting crop with: {croppedAreaPixels: {...}, rotation: 0}
Cropped blob created: Blob {size: 12345, type: "image/png"}
Cropped file created: File {name: "...", size: 12345, ...}
Uploading to: https://...
Image type: thumbnail
Upload response status: 200
Upload result: {fileUrl: "...", ...}
```

**Expected UI:**
1. Modal closes immediately
2. "Uploading" text appears in upload area
3. After upload completes, image appears in preview
4. Success message: "Image uploaded successfully"

## Common Issues & Solutions

### Issue 1: Zoom Not Working

**Symptoms:**
- Slider moves but image doesn't zoom
- No console logs for "Crop complete"

**Check:**
1. Is `handleZoomChange` being called? (Add breakpoint)
2. Is Cropper receiving new zoom value? (Check React DevTools)
3. Is image URL valid? (Check Network tab)

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check for React strict mode double-rendering

### Issue 2: Aspect Ratio Not Changing

**Symptoms:**
- Dropdown changes but crop box doesn't
- Aspect ratio stuck on one shape

**Check:**
1. Is `handleAspectRatioChange` called? (Console log)
2. Is `selectedAspectRatio` state updating? (React DevTools)
3. Is Cropper re-rendering? (Check key prop in DevTools)

**Solution:**
- Key prop should change: `cropper-1.7777` → `cropper-1`
- If key doesn't change, aspect ratio state isn't updating

### Issue 3: Upload Not Working

**Symptoms:**
- Modal closes but no upload happens
- No "Uploading" indicator
- No image appears

**Check Console For:**
1. "No cropped area pixels" error → Wait longer before confirming
2. "Failed to create cropped image" → Check image format/size
3. 401/403 response → Check AUTH_TOKEN is valid
4. 500 response → Server error, check API
5. Network error → Check CORS/internet connection

**Check Network Tab:**
- Should see POST request to `/savefile/articles/thumbnails`
- Request should have FormData with file
- Response should have `fileUrl` property

**Solutions:**
- Wait 1-2 seconds after opening cropper before confirming
- Check Authorization header in request
- Verify file size < 1MB
- Check file type is PNG/WebP

### Issue 4: Image Preview Not Showing

**Symptoms:**
- Upload succeeds (status 200)
- But image doesn't appear in preview area

**Check:**
1. Console: Does result have `fileUrl`?
2. Is parent handler called with correct event structure?
3. Check parent component state in React DevTools

**Solution:**
- Event must have: `{ file: { status: 'done', response: { fileUrl: '...' } } }`
- Parent component must update state with `response.fileUrl`

## Debug Commands

Open browser console and run:

```javascript
// Check if cropper is mounted
document.querySelector('.reactEasyCrop_Container')

// Check current zoom value in React
// (Use React DevTools to inspect ImageCropper component)

// Test file upload directly
const formData = new FormData();
formData.append('file', new File(['test'], 'test.png', {type: 'image/png'}));
fetch('YOUR_UPLOAD_URL', {
  method: 'POST',
  headers: { Authorization: localStorage.getItem('AUTH_TOKEN') },
  body: formData
}).then(r => r.json()).then(console.log)

// Check auth token
localStorage.getItem('AUTH_TOKEN')
```

## Quick Fixes

### Force Component Re-mount
Change this in GeneralField.js:
```javascript
<ImageCropper
  key={currentImageForCrop} // Add this
  visible={cropperVisible}
  // ...
/>
```

### Increase Crop Delay
In ImageCropper, change `onCropComplete` debouncing:
```javascript
const onCropComplete = useCallback(
  debounce((croppedArea, croppedAreaPixels) => {
    console.log('Crop complete:', { croppedArea, croppedAreaPixels });
    setCroppedAreaPixels(croppedAreaPixels);
  }, 500), // Add 500ms delay
  []
);
```

### Disable Strict Mode
If using React 18 Strict Mode, it causes double-renders. In index.js:
```javascript
// Remove <React.StrictMode>
root.render(<App />);
```

## Contact Points

If issues persist, check:
1. **react-easy-crop version**: Should be ^5.5.3
2. **React version**: Should be ^18.2.0
3. **Browser**: Works best in Chrome/Edge latest
4. **Node version**: Check compatibility

## Success Indicators

Everything works when you see:
✅ Zoom slider moves and image zooms
✅ Aspect ratio dropdown changes crop box shape
✅ Console logs show crop calculations
✅ Upload shows loading state
✅ Image appears in preview after upload
✅ Success message appears
