# Frontend Implementation Guide for Custom Font Weights and Highlights

## Overview
This guide explains how to display articles with custom font weights and highlight colors on your frontend website.

## Required Dependencies

Install these packages in your **frontend project**:

```bash
npm install draft-js draft-js-export-html
# or
yarn add draft-js draft-js-export-html
```

## Implementation

### 1. Create a Utility Function to Convert Draft.js to HTML

Create a file: `utils/draftToHtml.js`

```javascript
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

// Define the same custom style map used in the editor
const customStyleMap = {
  FONTWEIGHT_NORMAL: {
    fontWeight: 400,
  },
  FONTWEIGHT_SLIM: {
    fontWeight: 300,
  },
  FONTWEIGHT_MEDIUM: {
    fontWeight: 500,
  },
  FONTWEIGHT_SEMIBOLD: {
    fontWeight: 600,
  },
  FONTWEIGHT_BOLD: {
    fontWeight: 700,
  },
  FONTWEIGHT_EXTRABOLD: {
    fontWeight: 800,
  },
  HIGHLIGHT_YELLOW: {
    backgroundColor: '#ffff00',
    padding: '2px 0',
  },
  HIGHLIGHT_GREEN: {
    backgroundColor: '#90ee90',
    padding: '2px 0',
  },
  HIGHLIGHT_BLUE: {
    backgroundColor: '#add8e6',
    padding: '2px 0',
  },
  HIGHLIGHT_PINK: {
    backgroundColor: '#ffb6c1',
    padding: '2px 0',
  },
  HIGHLIGHT_ORANGE: {
    backgroundColor: '#ffa500',
    padding: '2px 0',
  },
  HIGHLIGHT_PURPLE: {
    backgroundColor: '#dda0dd',
    padding: '2px 0',
  },
};

/**
 * Convert Draft.js raw content to HTML with custom styles
 * @param {string} rawContentJSON - JSON string of Draft.js raw content
 * @returns {string} HTML string
 */
export const convertDraftToHtml = (rawContentJSON) => {
  try {
    // Parse the JSON string
    const rawContent = JSON.parse(rawContentJSON);
    
    // Convert to Draft.js ContentState
    const contentState = convertFromRaw(rawContent);
    
    // Convert to HTML with custom inline styles
    const options = {
      inlineStyles: customStyleMap,
      // Optional: customize block rendering
      blockRenderers: {
        'header-two': (block) => `<h2>${block.getText()}</h2>`,
        'header-three': (block) => `<h3>${block.getText()}</h3>`,
        'header-four': (block) => `<h4>${block.getText()}</h4>`,
        'header-five': (block) => `<h5>${block.getText()}</h5>`,
        'header-six': (block) => `<h6>${block.getText()}</h6>`,
      },
    };
    
    const html = stateToHTML(contentState, options);
    
    return html;
  } catch (error) {
    console.error('Error converting Draft.js to HTML:', error);
    return '<p>Error loading content</p>';
  }
};
```

### 2. Create an Article Content Component

Create a file: `components/ArticleContent.js` or `components/ArticleContent.jsx`

```javascript
import React from 'react';
import { convertDraftToHtml } from '../utils/draftToHtml';
import './ArticleContent.css'; // Import the CSS file

const ArticleContent = ({ content }) => {
  // Convert Draft.js content to HTML
  const htmlContent = convertDraftToHtml(content);
  
  return (
    <div 
      className="article-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default ArticleContent;
```

### 3. Create CSS for Article Content

Create a file: `components/ArticleContent.css` or add to your main CSS:

```css
/* Article content container */
.article-content {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

/* Ensure inline styles are properly displayed */
.article-content span[style*="font-weight"],
.article-content span[style*="background-color"] {
  display: inline !important;
}

/* Highlight styles */
.article-content span[style*="background-color"] {
  padding: 2px 0 !important;
  border-radius: 2px;
}

/* Headers */
.article-content h2 {
  font-size: 28px;
  margin: 24px 0 16px;
  font-weight: 600;
}

.article-content h3 {
  font-size: 24px;
  margin: 20px 0 14px;
  font-weight: 600;
}

.article-content h4 {
  font-size: 20px;
  margin: 18px 0 12px;
  font-weight: 600;
}

.article-content h5 {
  font-size: 18px;
  margin: 16px 0 10px;
  font-weight: 600;
}

.article-content h6 {
  font-size: 16px;
  margin: 14px 0 8px;
  font-weight: 600;
}

/* Paragraphs */
.article-content p {
  margin: 12px 0;
}

/* Lists */
.article-content ul,
.article-content ol {
  margin: 16px 0;
  padding-left: 32px;
}

.article-content li {
  margin: 8px 0;
}

/* Blockquotes */
.article-content blockquote {
  border-left: 4px solid #e0e0e0;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
  font-style: italic;
}

/* Images */
.article-content img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
}

/* Links */
.article-content a {
  color: #1890ff;
  text-decoration: none;
  transition: color 0.3s;
}

.article-content a:hover {
  color: #40a9ff;
  text-decoration: underline;
}

/* Code blocks */
.article-content code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.article-content pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.article-content pre code {
  background-color: transparent;
  padding: 0;
}
```

### 4. Usage Example

In your article detail page:

```javascript
import React, { useState, useEffect } from 'react';
import ArticleContent from '../components/ArticleContent';
import axios from 'axios';

const ArticleDetailPage = ({ articleId }) => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await axios.get(`/api/articles/${articleId}`);
        setArticle(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching article:', error);
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [articleId]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!article) {
    return <div>Article not found</div>;
  }
  
  return (
    <div className="article-page">
      <h1>{article.title}</h1>
      <div className="article-meta">
        <span>{article.author}</span>
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
      </div>
      
      {/* Render the article content with custom styles */}
      <ArticleContent content={article.content} />
    </div>
  );
};

export default ArticleDetailPage;
```

### 5. Alternative: Using React Component Instead of HTML

If you prefer to render using React components instead of HTML:

```javascript
import React from 'react';
import { convertFromRaw, CompositeDecorator } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const customStyleMap = {
  FONTWEIGHT_NORMAL: { fontWeight: 400 },
  FONTWEIGHT_SLIM: { fontWeight: 300 },
  FONTWEIGHT_MEDIUM: { fontWeight: 500 },
  FONTWEIGHT_SEMIBOLD: { fontWeight: 600 },
  FONTWEIGHT_BOLD: { fontWeight: 700 },
  FONTWEIGHT_EXTRABOLD: { fontWeight: 800 },
  HIGHLIGHT_YELLOW: { backgroundColor: '#ffff00', padding: '2px 0' },
  HIGHLIGHT_GREEN: { backgroundColor: '#90ee90', padding: '2px 0' },
  HIGHLIGHT_BLUE: { backgroundColor: '#add8e6', padding: '2px 0' },
  HIGHLIGHT_PINK: { backgroundColor: '#ffb6c1', padding: '2px 0' },
  HIGHLIGHT_ORANGE: { backgroundColor: '#ffa500', padding: '2px 0' },
  HIGHLIGHT_PURPLE: { backgroundColor: '#dda0dd', padding: '2px 0' },
};

const ArticleContentReadOnly = ({ content }) => {
  try {
    const rawContent = JSON.parse(content);
    const contentState = convertFromRaw(rawContent);
    const editorState = EditorState.createWithContent(contentState);
    
    return (
      <div className="article-content-readonly">
        <Editor
          editorState={editorState}
          readOnly={true}
          toolbarHidden={true}
          customStyleMap={customStyleMap}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering content:', error);
    return <p>Error loading content</p>;
  }
};

export default ArticleContentReadOnly;
```

## Important Notes

1. **Security**: The `dangerouslySetInnerHTML` approach requires sanitization if you're accepting user-generated content. Consider using a library like `DOMPurify`.

2. **Performance**: For better performance, you can convert and cache the HTML on your backend/API and serve pre-rendered HTML.

3. **Consistency**: Make sure the `customStyleMap` in your frontend exactly matches the one in your admin panel.

4. **Testing**: Always test with various combinations of styles to ensure proper rendering.

## Backend API Response Example

Your API should return the article with the content field containing the Draft.js raw content as a JSON string:

```json
{
  "_id": "12345",
  "title": "Sample Article",
  "content": "{\"blocks\":[{\"key\":\"abc\",\"text\":\"Hello World\",\"type\":\"unstyled\",\"inlineStyleRanges\":[{\"offset\":0,\"length\":5,\"style\":\"FONTWEIGHT_BOLD\"},{\"offset\":6,\"length\":5,\"style\":\"HIGHLIGHT_YELLOW\"}]}],\"entityMap\":{}}",
  "author": "John Doe",
  "publishedAt": "2025-11-07"
}
```

## Troubleshooting

If styles are not showing:

1. Check browser console for errors
2. Verify the content JSON is valid
3. Ensure CSS is loaded properly
4. Check that customStyleMap matches between admin and frontend
5. Inspect the rendered HTML to see if inline styles are applied
