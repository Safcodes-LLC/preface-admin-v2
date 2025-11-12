/**
 * Creates an image element from a URL
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Gets rotation in radians
 */
export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Creates a cropped image from the provided image and crop area
 * @param {string} imageSrc - The source URL of the image
 * @param {Object} pixelCrop - The crop area in pixels
 * @param {number} rotation - The rotation angle in degrees
 * @param {boolean} flip - Whether to flip the image horizontally
 * @returns {Promise<Blob>} - A promise that resolves to the cropped image as a Blob
 */
export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create another canvas for the final cropped image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/png');
  });
}

/**
 * Converts a Blob to a File
 * @param {Blob} blob - The blob to convert
 * @param {string} fileName - The name for the file
 * @returns {File} - The converted file
 */
export function blobToFile(blob, fileName) {
  return new File([blob], fileName, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/**
 * Reads a file as a data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} - A promise that resolves to the data URL
 */
export function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result), false);
    reader.readAsDataURL(file);
  });
}
