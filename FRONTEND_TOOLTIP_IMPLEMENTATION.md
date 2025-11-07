# Frontend Tooltip Implementation Guide

## Problem
Tooltips and images in links are not displaying properly in the frontend.

## Solution
The tooltip content and image URLs are stored in the Draft.js entity data. You need to extract and render them properly in your Next.js frontend, including handling image links with tooltips.

---

## Implementation Steps

### 1. Update Your Frontend Component (SingleContentContainer.tsx)

Replace your current link rendering logic with this enhanced version that supports **both tooltips and images**:

```tsx
import { convertFromRaw, ContentState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

// Custom style map matching admin panel
const customStyleMap = {
  FONTWEIGHT_NORMAL: { style: { fontWeight: '400' } },
  FONTWEIGHT_SLIM: { style: { fontWeight: '300' } },
  FONTWEIGHT_MEDIUM: { style: { fontWeight: '500' } },
  FONTWEIGHT_SEMIBOLD: { style: { fontWeight: '600' } },
  FONTWEIGHT_BOLD: { style: { fontWeight: '700' } },
  FONTWEIGHT_EXTRABOLD: { style: { fontWeight: '800' } },
  HIGHLIGHT_YELLOW: { style: { backgroundColor: '#ffff00', padding: '2px 0' } },
  HIGHLIGHT_GREEN: { style: { backgroundColor: '#90ee90', padding: '2px 0' } },
  HIGHLIGHT_BLUE: { style: { backgroundColor: '#add8e6', padding: '2px 0' } },
  HIGHLIGHT_PINK: { style: { backgroundColor: '#ffb6c1', padding: '2px 0' } },
  HIGHLIGHT_ORANGE: { style: { backgroundColor: '#ffa500', padding: '2px 0' } },
  HIGHLIGHT_PURPLE: { style: { backgroundColor: '#dda0dd', padding: '2px 0' } },
};

// Enhanced entity styling with tooltip AND image support
const entityStyleFn = (entity: any) => {
  const entityType = entity.get('type').toLowerCase();
  
  if (entityType === 'link') {
    const data = entity.getData();
    const { url, target, tooltipContent, imageUrl } = data;
    
    // Build base attributes
    const attributes: any = {
      href: url || '#',
      target: target || '_blank',
      rel: target === '_blank' ? 'noopener noreferrer' : undefined,
    };
    
    // Add tooltip as title attribute
    if (tooltipContent) {
      attributes.title = tooltipContent;
      attributes.class = 'has-tooltip';
    }
    
    // Handle links with images
    if (imageUrl) {
      attributes.class = attributes.class ? `${attributes.class} has-image` : 'has-image';
      attributes.style = {
        display: 'inline-block',
        borderBottom: tooltipContent ? '1px dotted blue' : 'none',
      };
    }
    
    return {
      element: 'a',
      attributes,
    };
  }
  
  return undefined;
};

// Custom block renderer to handle image rendering inside links
const blockRendererFn = (contentBlock: any) => {
  const text = contentBlock.getText();
  const entityKey = contentBlock.getEntityAt(0);
  
  if (entityKey) {
    const contentState = contentBlock.getContentState?.();
    if (contentState) {
      const entity = contentState.getEntity(entityKey);
      const entityType = entity.getType();
      
      if (entityType === 'LINK') {
        const { imageUrl } = entity.getData();
        if (imageUrl) {
          // Return custom HTML for image inside link
          return `<img src="${imageUrl}" alt="${text || 'Link image'}" style="max-width: 100%; height: auto; display: block;" />`;
        }
      }
    }
  }
  
  return undefined;
};

// In your component
const renderedHtml = useMemo(() => {
  if (!post?.content) return '';
  
  try {
    const contentState = convertFromRaw(JSON.parse(post.content));
    
    // Custom function to handle image rendering inside links
    const renderWithImages = (html: string, contentState: any) => {
      // Find all link entities and check if they have images
      const entityMap = contentState.getEntityMap();
      
      entityMap.forEach((entity: any, entityKey: string) => {
        if (entity.getType() === 'LINK') {
          const data = entity.getData();
          if (data.imageUrl) {
            // Find the corresponding text in HTML and wrap image
            const text = contentState.getBlocksAsArray().find((block: any) => {
              return block.getEntityAt(0) === entityKey;
            })?.getText() || 'Link image';
            
            // Replace text with image HTML
            const imgHtml = `<img src="${data.imageUrl}" alt="${text}" style="max-width: 100%; height: auto; display: block;" />`;
            html = html.replace(new RegExp(`>${text}<`, 'g'), `>${imgHtml}<`);
          }
        }
      });
      
      return html;
    };
    
    let html = stateToHTML(contentState, {
      inlineStyles: customStyleMap,
      entityStyleFn: entityStyleFn,
    });
    
    // Process to add images to links
    html = renderWithImages(html, contentState);
    
    return html;
  } catch (error) {
    console.error('Error converting content:', error);
    return '';
  }
}, [post?.content]);
```

**Simplified Alternative** (Recommended - handles images more reliably):

```tsx
const renderedHtml = useMemo(() => {
  if (!post?.content) return '';
  
  try {
    const rawContent = JSON.parse(post.content);
    const contentState = convertFromRaw(rawContent);
    
    // Process entity map to add images
    let html = stateToHTML(contentState, {
      inlineStyles: customStyleMap,
      entityStyleFn: (entity: any) => {
        if (entity.get('type').toLowerCase() === 'link') {
          const data = entity.getData();
          const { url, target, tooltipContent, imageUrl } = data;
          
          const attributes: any = {
            href: url || '#',
            target: target || '_blank',
            rel: target === '_blank' ? 'noopener noreferrer' : undefined,
          };
          
          if (tooltipContent) {
            attributes.title = tooltipContent;
            attributes.class = 'has-tooltip';
          }
          
          if (imageUrl) {
            attributes.class = attributes.class ? `${attributes.class} has-image` : 'has-image';
          }
          
          return {
            element: 'a',
            attributes,
          };
        }
      },
    });
    
    // Post-process: Replace link text with images where imageUrl exists
    const entityMap = rawContent.entityMap || {};
    Object.keys(entityMap).forEach((key) => {
      const entity = entityMap[key];
      if (entity.type === 'LINK' && entity.data.imageUrl) {
        // Find blocks that use this entity
        rawContent.blocks.forEach((block: any) => {
          block.entityRanges?.forEach((range: any) => {
            if (range.key.toString() === key) {
              const text = block.text.substring(range.offset, range.offset + range.length);
              // Replace the text with image HTML in the final output
              const imageHtml = `<img src="${entity.data.imageUrl}" alt="${text || 'Link image'}" style="max-width: 100%; height: auto; display: block;" />`;
              html = html.replace(`>${text}<`, `>${imageHtml}<`);
            }
          });
        });
      }
    });
    
    return html;
  } catch (error) {
    console.error('Error converting content:', error);
    return '';
  }
}, [post?.content]);
```

---

### 2. Add Tooltip & Image CSS Styles

Create or update your CSS file (`article-content-styles.css` or in your globals.css):

```css
/* Link styles with tooltips */
.article-content a {
  color: #1890ff;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.article-content a:hover {
  color: #40a9ff;
}

.article-content a:visited {
  color: #722ed1;
}

/* Links with tooltips - dotted underline */
.article-content a.has-tooltip {
  border-bottom: 1px dotted #1890ff;
  text-decoration: none;
  cursor: help;
  position: relative;
}

.article-content a.has-tooltip:hover {
  border-bottom-color: #40a9ff;
}

/* Links with images */
.article-content a.has-image {
  display: inline-block;
  text-decoration: none;
  border: none;
}

.article-content a.has-image:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

/* Images inside links */
.article-content a img {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
  transition: transform 0.2s ease;
}

.article-content a:hover img {
  transform: scale(1.02);
}

/* Links with both image and tooltip */
.article-content a.has-image.has-tooltip {
  border-bottom: 1px dotted #1890ff;
  cursor: help;
}

.article-content a.has-image.has-tooltip:hover {
  border-bottom-color: #40a9ff;
}

/* Enhanced tooltip appearance using native title attribute */
/* Note: Native browser tooltips will work automatically with title attribute */
/* For custom styled tooltips, see Option 3 below */
```

---

### 3. (Optional) Advanced Custom Tooltips

If you want **beautifully styled custom tooltips** instead of native browser tooltips, use a tooltip library:

#### Option A: Using React Tooltip Library

```bash
npm install react-tooltip
```

Then update your component:

```tsx
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Modify the entityStyleFn to add data attributes
const entityStyleFn = (entity: any) => {
  const entityType = entity.get('type').toLowerCase();
  
  if (entityType === 'link') {
    const data = entity.getData();
    const { url, target, tooltipContent, imageUrl } = data;
    
    const attributes: any = {
      href: url || '#',
      target: target || '_blank',
      rel: target === '_blank' ? 'noopener noreferrer' : undefined,
    };
    
    if (tooltipContent) {
      // Use data attributes for react-tooltip
      attributes['data-tooltip-id'] = 'link-tooltip';
      attributes['data-tooltip-content'] = tooltipContent;
      attributes['data-tooltip-place'] = 'top';
      attributes.class = 'has-tooltip';
    }
    
    return {
      element: 'a',
      attributes,
    };
  }
  
  return undefined;
};

// In your JSX
return (
  <div className="article-content">
    <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    {/* Add the tooltip component */}
    <Tooltip id="link-tooltip" />
  </div>
);
```

Add custom tooltip CSS:

```css
/* Custom tooltip styling */
.react-tooltip {
  background-color: #333 !important;
  color: #fff !important;
  border-radius: 4px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  max-width: 300px !important;
  word-wrap: break-word !important;
  z-index: 9999 !important;
}
```

---

### 4. Testing Tooltips and Images

After implementation, test by:

1. **Create different types of links in admin panel**:
   
   **Test Case 1: Simple link with tooltip**
   - Select text: "Click here"
   - Click "Add Link with Tooltip"
   - URL: https://example.com
   - Tooltip: "This is a helpful tooltip"
   - Save article
   
   **Test Case 2: Link with tooltip AND image**
   - Select text: "Product Image"
   - Click "Add Link with Tooltip"
   - URL: https://example.com/product
   - Tooltip: "View product details"
   - Upload an image
   - Save article
   
   **Test Case 3: Simple link without tooltip**
   - Select text: "Simple link"
   - Click "Add Link" (not the tooltip version)
   - URL: https://example.com
   - Save article

2. **View on frontend**:
   - Navigate to the article page
   - **For links with tooltips**: Hover over the text/image - tooltip should appear
   - **For links with images**: Image should be displayed and clickable
   - **For links with both**: Image should show with dotted underline, tooltip on hover
   - All links should navigate to correct URL when clicked

3. **Verify HTML output**:
   - Right-click on a link and "Inspect Element"
   - Check for:
     ```html
     <!-- Link with tooltip -->
     <a href="https://example.com" target="_blank" title="This is a helpful tooltip" class="has-tooltip">
       Click here
     </a>
     
     <!-- Link with image and tooltip -->
     <a href="https://example.com/product" target="_blank" title="View product details" class="has-tooltip has-image">
       <img src="https://cdn.example.com/image.jpg" alt="Product Image" style="max-width: 100%; height: auto; display: block;" />
     </a>
     ```

---

## Troubleshooting

### Issue: Tooltips not showing at all
**Solution**: Make sure you're using the `entityStyleFn` option in `stateToHTML()` and passing the tooltip as the `title` attribute.

### Issue: Tooltip text is not displaying
**Solution**: Check that `tooltipContent` is being saved in the database. Log the entity data:
```tsx
console.log('Entity data:', entity.getData());
```

### Issue: Links not styled correctly
**Solution**: Ensure the `has-tooltip` class is being applied and your CSS is loaded.

### Issue: Native tooltips look ugly
**Solution**: Use Option 3 with a tooltip library for beautiful custom-styled tooltips.

---

## Summary

The key points are:

1. ✅ Use `entityStyleFn` in `stateToHTML()` to handle link entities
2. ✅ Extract `tooltipContent` and `imageUrl` from entity data
3. ✅ Add tooltip as `title` attribute for native tooltips
4. ✅ **Handle image rendering by post-processing the HTML to replace text with `<img>` tags**
5. ✅ Apply CSS classes: `has-tooltip` for tooltips, `has-image` for images
6. ✅ Style links and images appropriately with CSS
7. ✅ Support combinations: text links, image links, links with tooltips, images with tooltips
8. ✅ Test thoroughly with all link variations

---

## Code Summary for Quick Copy-Paste

**Complete entityStyleFn with image support:**

```tsx
const entityStyleFn = (entity: any) => {
  if (entity.get('type').toLowerCase() === 'link') {
    const { url, target, tooltipContent, imageUrl } = entity.getData();
    
    const attributes: any = {
      href: url || '#',
      target: target || '_blank',
      rel: target === '_blank' ? 'noopener noreferrer' : undefined,
    };
    
    if (tooltipContent) {
      attributes.title = tooltipContent;
      attributes.class = 'has-tooltip';
    }
    
    if (imageUrl) {
      attributes.class = attributes.class ? `${attributes.class} has-image` : 'has-image';
    }
    
    return { element: 'a', attributes };
  }
};
```

**Image replacement logic:**

```tsx
// After stateToHTML conversion, replace link text with images
const entityMap = rawContent.entityMap || {};
Object.keys(entityMap).forEach((key) => {
  const entity = entityMap[key];
  if (entity.type === 'LINK' && entity.data.imageUrl) {
    rawContent.blocks.forEach((block: any) => {
      block.entityRanges?.forEach((range: any) => {
        if (range.key.toString() === key) {
          const text = block.text.substring(range.offset, range.offset + range.length);
          const imageHtml = `<img src="${entity.data.imageUrl}" alt="${text || 'Link image'}" style="max-width: 100%; height: auto; display: block;" />`;
          html = html.replace(`>${text}<`, `>${imageHtml}<`);
        }
      });
    });
  }
});
```

---

## Need Help?

If tooltips still don't work, share:
1. Your current SingleContentContainer.tsx code
2. The HTML output (inspect element)
3. Console errors (if any)
4. Example of entity data from database
