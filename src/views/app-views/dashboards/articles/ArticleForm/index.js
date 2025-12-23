import React, { useState, useEffect, useCallback } from 'react';
import PageHeaderAlt from 'components/layout-components/PageHeaderAlt';
import { Tabs, Form, Button, message, Modal, Select, Table, Input, Upload, Radio } from 'antd';
import { PlusOutlined, LoadingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Flex from 'components/shared-components/Flex';
import GeneralField from './GeneralField';
import SeoField from './SeoField';
import { createPost, editPost, fetchAllPostsByPostType, fetchPostById, updatePost, updateStatus, updateStatusByAdmin } from 'store/slices/postSlice';
import { useDispatch, useSelector } from 'react-redux';
// import FilesServices from "services/FilesServices";
import { fetchUserData } from 'store/slices/userSlice';
import { CompositeDecorator, convertFromRaw, convertToRaw, EditorState, Modifier, RichUtils } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Editor } from 'react-draft-wysiwyg';
import { useNavigate } from 'react-router-dom';
import { AUTH_TOKEN } from 'constants/AuthConstant';

const ADD = 'ADD';
const EDIT = 'EDIT';

const TooltipSpan = (props) => {
	const { contentState, entityKey, children } = props;
	const { tooltipContent } = contentState.getEntity(entityKey).getData();

	return (
		<span
			style={{
				borderBottom: '1px dotted blue',
				cursor: 'help',
			}}
			title={tooltipContent}>
			{children}
		</span>
	);
};

// Find entities that have tooltips
function findTooltipEntities(contentBlock, callback, contentState) {
	contentBlock.findEntityRanges((character) => {
		const entityKey = character.getEntity();
		return entityKey !== null && contentState.getEntity(entityKey).getType() === 'TOOLTIP';
	}, callback);
}

// Find entities that have links with tooltips
function findLinkEntities(contentBlock, callback, contentState) {
	contentBlock.findEntityRanges((character) => {
		const entityKey = character.getEntity();
		return entityKey !== null && contentState.getEntity(entityKey).getType() === 'LINK';
	}, callback);
}

// Link component with tooltip support
const Link = (props) => {
	const { contentState, entityKey, children } = props;

	// Safely get entity data with fallbacks
	let url = '#';
	let target = '_self';
	let tooltipContent = '';
	let imageUrl = '';

	// Check if entityKey and contentState are valid before accessing
	if (entityKey && contentState) {
		try {
			const entityData = contentState.getEntity(entityKey).getData();
			url = entityData.url || '#';
			target = entityData.target || '_self';
			tooltipContent = entityData.tooltipContent || '';
			imageUrl = entityData.imageUrl || '';
		} catch (error) {
			console.error('Error accessing entity data:', error);
		}
	}

	// Render different UI based on whether there's an image
	if (imageUrl) {
		return (
			<a href={url} target={target} title={tooltipContent} style={tooltipContent ? { borderBottom: '1px dotted blue', display: 'inline-block' } : { display: 'inline-block' }}>
				<img src={imageUrl} alt={children[0]?.props?.text || 'Link image'} style={{ maxWidth: '100%', height: 'auto' }} />
				{tooltipContent && <span className="sr-only">{tooltipContent}</span>}
			</a>
		);
	}

	return (
		<a href={url} target={target} title={tooltipContent} style={tooltipContent ? { borderBottom: '1px dotted blue' } : {}}>
			{children}
		</a>
	);
};

// Create decorator for tooltip entities
const createDecorator = () =>
	new CompositeDecorator([
		{
			strategy: findTooltipEntities,
			component: TooltipSpan,
		},
		{
			strategy: findLinkEntities,
			component: Link,
		},
	]);

let initialContent = '';

// Custom style map for font weights
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
	// Highlight colors
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
	// Subscript and Superscript
	SUBSCRIPT: {
		fontSize: '0.75em',
		verticalAlign: 'sub',
	},
	SUPERSCRIPT: {
		fontSize: '0.75em',
		verticalAlign: 'super',
	},
	// Text transformations
	UPPERCASE: {
		textTransform: 'uppercase',
	},
	LOWERCASE: {
		textTransform: 'lowercase',
	},
	CAPITALIZE: {
		textTransform: 'capitalize',
	},
};

// Block style function to handle text alignment and indentationnd line spacing
const blockStyleFn = (contentBlock) => {
	const textAlign = contentBlock.getData().get('text-align');
	const indentLevel = contentBlock.getData().get('indent-level') || 0;
	const textDirection = contentBlock.getData().get('text-direction');
	const lineSpacing = contentBlock.getData().get('line-spacing');

	let classNames = [];

	if (textAlign) {
		classNames.push(`text-align-${textAlign}`);
	}

	if (indentLevel > 0) {
		if (textDirection === 'rtl') {
			classNames.push(`indent-level-${indentLevel}-rtl`);
		} else {
			classNames.push(`indent-level-${indentLevel}`);
		}
	}

	if (textDirection) {
		classNames.push(`dir-${textDirection}`);
	}

	if (lineSpacing) {
		classNames.push(`line-spacing-${lineSpacing}`);
	}

	const finalClasses = classNames.join(' ');

	// Debug logging
	if (indentLevel > 0 || textDirection) {
		console.log('Block Style - Text:', contentBlock.getText().substring(0, 50));
		console.log('Block Style - Direction:', textDirection);
		console.log('Block Style - Indent Level:', indentLevel);
		console.log('Block Style - Classes:', finalClasses);
	}

	return finalClasses;
};

const ArticleForm = (props) => {
	const dispatch = useDispatch();

	const { Option } = Select;

	const { mode = ADD, param, view } = props;

	const [form] = Form.useForm();

	const [userRoles, setUserRoles] = useState([]);
	const [direcAssign, setDirecAssign] = useState(false);
	const [approvalList, setApprovalList] = useState([]);
	const [currentEditor, setCurrentEditor] = useState('');
	const [modal1Open, setModal1Open] = useState(false);
	const [currentStatus, setCurrentStatus] = useState('');
	const [selectedStatus, setSelectedStatus] = useState('');

	const user = useSelector((state) => state.user);
	const auth = useSelector((state) => state.auth);

	const navigate = useNavigate();

	const STORAGE_KEY = 'articleListFilters';
	const getListingPathWithFilters = () => {
		let search = '';
		try {
			const raw = sessionStorage.getItem(STORAGE_KEY);
			if (raw) {
				const { searchValue, selectedLanguage, selectedCategory, currentPage } = JSON.parse(raw);
				const params = new URLSearchParams();
				if (searchValue) params.set('search', searchValue);
				if (selectedLanguage && selectedLanguage !== 'all') params.set('lang', selectedLanguage);
				if (selectedCategory && selectedCategory !== 'all') params.set('cat', selectedCategory);
				if (currentPage && Number(currentPage) !== 1) params.set('page', currentPage);
				search = params.toString();
			}
		} catch (e) {}
		return `/admin/dashboards/articles/listing${search ? `?${search}` : ''}`;
	};

	const [editorState, setEditorState] = useState(() => {
		if (initialContent) {
			try {
				const contentState = convertFromRaw(JSON.parse(initialContent));
				return EditorState.createWithContent(contentState, createDecorator());
			} catch (error) {
				console.error('Error parsing initial content:', error);
				return EditorState.createEmpty(createDecorator());
			}
		}
		return EditorState.createEmpty(createDecorator());
	});

	// Font weight toggle handlers
	const toggleFontWeight = (fontWeight) => {
		const selection = editorState.getSelection();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select some text first');
			return;
		}

		const currentContent = editorState.getCurrentContent();

		// Remove all existing font weight styles first
		const fontWeightStyles = ['FONTWEIGHT_NORMAL', 'FONTWEIGHT_SLIM', 'FONTWEIGHT_MEDIUM', 'FONTWEIGHT_SEMIBOLD', 'FONTWEIGHT_BOLD', 'FONTWEIGHT_EXTRABOLD'];
		let contentState = currentContent;
		fontWeightStyles.forEach((style) => {
			contentState = Modifier.removeInlineStyle(contentState, selection, style);
		});

		// Apply the new font weight if not 'NONE'
		if (fontWeight !== 'NONE') {
			contentState = Modifier.applyInlineStyle(contentState, selection, fontWeight);
			message.success(`Font weight applied: ${fontWeight}`);
		} else {
			message.info('Font weight removed');
		}

		const newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
		setEditorState(EditorState.forceSelection(newEditorState, selection));
	};

	// Helper function to detect RTL (Right-to-Left) text
	const isRTLText = (text) => {
		if (!text || text.trim().length === 0) return null; // Return null for empty text

		// Arabic, Hebrew, Persian, Urdu Unicode ranges
		const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/g;

		// Count RTL characters using global match
		const matches = text.match(rtlChars);
		const rtlCount = matches ? matches.length : 0;
		const totalChars = text.replace(/\s/g, '').length; // Exclude spaces

		console.log('RTL Detection - Text:', text);
		console.log('RTL Detection - RTL chars found:', rtlCount);
		console.log('RTL Detection - Total chars:', totalChars);
		console.log('RTL Detection - Percentage:', totalChars > 0 ? ((rtlCount / totalChars) * 100).toFixed(2) + '%' : '0%');

		// If more than 30% of text is RTL, consider it RTL
		const isRTL = totalChars > 0 && rtlCount / totalChars > 0.3;
		console.log('RTL Detection - Result:', isRTL);

		return isRTL;
	};

	// Custom indent handler
	const handleIndent = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();
		const startKey = selection.getStartKey();
		const endKey = selection.getEndKey();
		const blockMap = currentContent.getBlockMap();

		let newContentState = currentContent;
		let inSelection = false;

		blockMap.forEach((block, key) => {
			if (key === startKey) inSelection = true;

			if (inSelection) {
				const currentIndent = block.getData().get('indent-level') || 0;
				const existingDirection = block.getData().get('text-direction');
				const blockText = block.getText();
				const detectedRTL = isRTLText(blockText);

				// Determine direction: detect from text first, then use existing, default to LTR
				let textDirection;
				if (detectedRTL !== null) {
					textDirection = detectedRTL ? 'rtl' : 'ltr';
				} else if (existingDirection) {
					textDirection = existingDirection;
				} else {
					textDirection = 'ltr'; // Default to LTR for empty blocks
				}

				// Debug logging
				console.log('Indent - Block text:', blockText);
				console.log('Indent - Detected RTL:', detectedRTL);
				console.log('Indent - Text direction:', textDirection);
				console.log('Indent - Current indent:', currentIndent);

				if (currentIndent < 8) {
					// Max indent level of 8
					const newBlock = block.set(
						'data',
						block
							.getData()
							.set('indent-level', currentIndent + 1)
							.set('text-direction', textDirection)
					);
					newContentState = newContentState.merge({
						blockMap: newContentState.getBlockMap().set(key, newBlock),
					});

					console.log('Indent - New block data:', newBlock.getData().toJS());
				}
			}

			if (key === endKey) inSelection = false;
		});

		const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
		setEditorState(EditorState.forceSelection(newEditorState, selection));

		// Show message based on direction
		const firstBlock = newContentState.getBlockForKey(startKey);
		const direction = firstBlock.getData().get('text-direction');
		const indentLevel = firstBlock.getData().get('indent-level');
		message.success(`Indent applied: Level ${indentLevel} (${direction?.toUpperCase() || 'LTR'})`);
	};

	// Custom outdent handler
	const handleOutdent = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();
		const startKey = selection.getStartKey();
		const endKey = selection.getEndKey();
		const blockMap = currentContent.getBlockMap();

		let newContentState = currentContent;
		let inSelection = false;

		blockMap.forEach((block, key) => {
			if (key === startKey) inSelection = true;

			if (inSelection) {
				const currentIndent = block.getData().get('indent-level') || 0;
				const existingDirection = block.getData().get('text-direction');
				const blockText = block.getText();
				const detectedRTL = isRTLText(blockText);

				// Determine direction: detect from text first, then use existing, default to LTR
				let textDirection;
				if (detectedRTL !== null) {
					textDirection = detectedRTL ? 'rtl' : 'ltr';
				} else if (existingDirection) {
					textDirection = existingDirection;
				} else {
					textDirection = 'ltr'; // Default to LTR for empty blocks
				}

				// Debug logging
				console.log('Outdent - Block text:', blockText);
				console.log('Outdent - Detected RTL:', detectedRTL);
				console.log('Outdent - Text direction:', textDirection);
				console.log('Outdent - Current indent:', currentIndent);

				if (currentIndent > 0) {
					const newBlock = block.set(
						'data',
						block
							.getData()
							.set('indent-level', currentIndent - 1)
							.set('text-direction', textDirection)
					);
					newContentState = newContentState.merge({
						blockMap: newContentState.getBlockMap().set(key, newBlock),
					});

					console.log('Outdent - New block data:', newBlock.getData().toJS());
				}
			}

			if (key === endKey) inSelection = false;
		});

		const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
		setEditorState(EditorState.forceSelection(newEditorState, selection));

		// Show message based on direction
		const firstBlock = newContentState.getBlockForKey(startKey);
		const direction = firstBlock.getData().get('text-direction');
		const indentLevel = firstBlock.getData().get('indent-level');
		message.success(`Outdent applied: Level ${indentLevel} (${direction?.toUpperCase() || 'LTR'})`);
	};

	// Toggle subscript
	const toggleSubscript = () => {
		const selection = editorState.getSelection();
		if (selection.isCollapsed()) {
			message.warning('Please select text to apply subscript');
			return;
		}

		const currentContent = editorState.getCurrentContent();
		// Remove superscript if it exists
		let contentState = Modifier.removeInlineStyle(currentContent, selection, 'SUPERSCRIPT');
		// Toggle subscript
		const newEditorState = RichUtils.toggleInlineStyle(EditorState.push(editorState, contentState, 'change-inline-style'), 'SUBSCRIPT');
		setEditorState(newEditorState);
	};

	// Toggle superscript
	const toggleSuperscript = () => {
		const selection = editorState.getSelection();
		if (selection.isCollapsed()) {
			message.warning('Please select text to apply superscript');
			return;
		}

		const currentContent = editorState.getCurrentContent();
		// Remove subscript if it exists
		let contentState = Modifier.removeInlineStyle(currentContent, selection, 'SUBSCRIPT');
		// Toggle superscript
		const newEditorState = RichUtils.toggleInlineStyle(EditorState.push(editorState, contentState, 'change-inline-style'), 'SUPERSCRIPT');
		setEditorState(newEditorState);
	};

	// Toggle text transformation
	const toggleTextTransform = (transform) => {
		const selection = editorState.getSelection();
		if (selection.isCollapsed()) {
			message.warning('Please select text to apply text transformation');
			return;
		}

		const currentContent = editorState.getCurrentContent();
		const transforms = ['UPPERCASE', 'LOWERCASE', 'CAPITALIZE'];

		// Remove all text transform styles first
		let contentState = currentContent;
		transforms.forEach((style) => {
			contentState = Modifier.removeInlineStyle(contentState, selection, style);
		});

		// Apply the new transform if not 'NONE'
		if (transform !== 'NONE') {
			contentState = Modifier.applyInlineStyle(contentState, selection, transform);
		}

		const newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
		setEditorState(EditorState.forceSelection(newEditorState, selection));
	};

	// Set line spacing
	const setLineSpacing = (spacing) => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();
		const startKey = selection.getStartKey();
		const endKey = selection.getEndKey();
		const blockMap = currentContent.getBlockMap();

		let newContentState = currentContent;
		let inSelection = false;

		blockMap.forEach((block, key) => {
			if (key === startKey) inSelection = true;

			if (inSelection) {
				let newBlockData = block.getData();

				// If spacing is 'NORMAL_SPACING', remove the line-spacing data to use default
				if (spacing === 'NORMAL_SPACING') {
					newBlockData = newBlockData.delete('line-spacing');
				} else {
					newBlockData = newBlockData.set('line-spacing', spacing);
				}

				const newBlock = block.set('data', newBlockData);
				newContentState = newContentState.merge({
					blockMap: newContentState.getBlockMap().set(key, newBlock),
				});
			}

			if (key === endKey) inSelection = false;
		});

		const newEditorState = EditorState.push(editorState, newContentState, 'change-block-data');
		setEditorState(EditorState.forceSelection(newEditorState, selection));

		if (spacing === 'NORMAL_SPACING') {
			message.success('Line spacing reset to normal');
		} else {
			message.success(`Line spacing set to ${spacing}`);
		}
	};

	// Undo handler
	const handleUndo = () => {
		const newEditorState = EditorState.undo(editorState);
		setEditorState(newEditorState);
	};

	// Redo handler
	const handleRedo = () => {
		const newEditorState = EditorState.redo(editorState);
		setEditorState(newEditorState);
	};

	// Reset editor: remove all styles, links, tooltips, indentation, line height, highlight, font size, etc., but keep content
	const resetEditor = () => {
		// const emptyContentState = EditorState.createEmpty(createDecorator());
		// setEditorState(emptyContentState);
		// message.success('Editor has been fully reset.');

		const currentContent = editorState.getCurrentContent();
		let contentState = currentContent;
		const selection = editorState.getSelection();

		// Remove all inline styles from the entire content
		const inlineStyles = [
			'BOLD',
			'ITALIC',
			'UNDERLINE',
			'STRIKETHROUGH',
			'FONTWEIGHT_NORMAL',
			'FONTWEIGHT_SLIM',
			'FONTWEIGHT_MEDIUM',
			'FONTWEIGHT_SEMIBOLD',
			'FONTWEIGHT_BOLD',
			'FONTWEIGHT_EXTRABOLD',
			'HIGHLIGHT_YELLOW',
			'HIGHLIGHT_GREEN',
			'HIGHLIGHT_BLUE',
			'HIGHLIGHT_PINK',
			'HIGHLIGHT_ORANGE',
			'HIGHLIGHT_PURPLE',
			'SUBSCRIPT',
			'SUPERSCRIPT',
			'UPPERCASE',
			'LOWERCASE',
			'CAPITALIZE',
		];
		// Remove all inline styles from all blocks
		currentContent.getBlockMap().forEach((block) => {
			let blockSelection = selection.merge({
				anchorKey: block.getKey(),
				anchorOffset: 0,
				focusKey: block.getKey(),
				focusOffset: block.getLength(),
				isBackward: false,
			});
			inlineStyles.forEach((style) => {
				contentState = Modifier.removeInlineStyle(contentState, blockSelection, style);
			});
		});

		// Remove all entities (links, tooltips) from all blocks
		contentState.getBlockMap().forEach((block) => {
			let blockSelection = selection.merge({
				anchorKey: block.getKey(),
				anchorOffset: 0,
				focusKey: block.getKey(),
				focusOffset: block.getLength(),
				isBackward: false,
			});
			contentState = Modifier.applyEntity(contentState, blockSelection, null);
		});

		// Remove block data (indent, alignment, line-spacing, etc.) and set type to 'unstyled'
		let newBlockMap = contentState.getBlockMap().map((block) => {
			return block.merge({
				type: 'unstyled',
				data: block.getData().clear(),
			});
		});
		contentState = contentState.merge({ blockMap: newBlockMap });

		// Push the cleaned content state to the editor
		const newEditorState = EditorState.push(editorState, contentState, 'change-block-data');
		setEditorState(EditorState.forceSelection(newEditorState, newEditorState.getSelection()));
		message.success('All formatting and styles have been reset, content preserved.');
	};

	// Highlight toggle handler
	const toggleHighlight = (highlightColor) => {
		const selection = editorState.getSelection();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select some text to highlight');
			return;
		}

		const currentContent = editorState.getCurrentContent();

		// Remove all existing highlight styles first
		const highlightStyles = ['HIGHLIGHT_YELLOW', 'HIGHLIGHT_GREEN', 'HIGHLIGHT_BLUE', 'HIGHLIGHT_PINK', 'HIGHLIGHT_ORANGE', 'HIGHLIGHT_PURPLE'];
		let contentState = currentContent;
		highlightStyles.forEach((style) => {
			contentState = Modifier.removeInlineStyle(contentState, selection, style);
		});

		// Apply the new highlight color
		if (highlightColor !== 'NONE') {
			contentState = Modifier.applyInlineStyle(contentState, selection, highlightColor);
			message.success(`Highlight applied: ${highlightColor}`);
		} else {
			message.info('Highlight removed');
		}

		const newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
		setEditorState(EditorState.forceSelection(newEditorState, selection));
	};

	// Simple hyperlink handler
	const handleSimpleLinkClick = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select some text first before adding a link');
			return;
		}

		// Get the selected text
		const startKey = selection.getStartKey();
		const startOffset = selection.getStartOffset();
		const endOffset = selection.getEndOffset();
		const blockWithSelection = currentContent.getBlockForKey(startKey);
		const selectedText = blockWithSelection.getText().slice(startOffset, endOffset);

		// Create a simple modal for URL input
		Modal.confirm({
			title: 'Add Hyperlink',
			icon: null,
			width: 450,
			content: (
				<SimpleLinkForm
					selectedText={selectedText}
					onSubmit={(linkData) => {
						// Create entity with the link data
						const contentState = editorState.getCurrentContent();
						const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', linkData);
						const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

						// Apply entity to selection
						const newContentState = Modifier.applyEntity(contentStateWithEntity, selection, entityKey);
						const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');

						setEditorState(newEditorState);
						message.success('Link added successfully!');
						Modal.destroyAll();
					}}
					onCancel={() => Modal.destroyAll()}
				/>
			),
			footer: null,
			okButtonProps: { style: { display: 'none' } },
			cancelButtonProps: { style: { display: 'none' } },
		});
	};

	// Remove link handler
	const handleRemoveLink = () => {
		const selection = editorState.getSelection();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select linked text to remove the link');
			return;
		}

		const currentContent = editorState.getCurrentContent();

		// Remove entity (link) from selection
		const newContentState = Modifier.applyEntity(currentContent, selection, null);
		const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');

		setEditorState(EditorState.forceSelection(newEditorState, selection));
		message.success('Link removed successfully!');
	};

	// Edit link handler
	const handleEditLink = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select a link to edit');
			return;
		}

		// Get the entity at the selection
		const startKey = selection.getStartKey();
		const startOffset = selection.getStartOffset();
		const blockWithSelection = currentContent.getBlockForKey(startKey);
		const entityKey = blockWithSelection.getEntityAt(startOffset);

		if (!entityKey) {
			message.warning('No link found at selection. Please select text with a link.');
			return;
		}

		const entity = currentContent.getEntity(entityKey);
		const entityType = entity.getType();

		if (entityType !== 'LINK') {
			message.warning('Selected text is not a link');
			return;
		}

		// Get existing link data
		const entityData = entity.getData();
		const selectedText = blockWithSelection.getText().slice(selection.getStartOffset(), selection.getEndOffset());

		// Determine if it's a simple link or advanced link
		const hasTooltip = entityData.tooltipContent && entityData.tooltipContent.trim() !== '';
		const hasImage = entityData.imageUrl && entityData.imageUrl.trim() !== '';

		if (hasTooltip || hasImage) {
			// Open advanced link form
			Modal.confirm({
				title: 'Edit Link with Tooltip',
				icon: null,
				width: 500,
				content: (
					<div style={{ marginTop: '15px' }}>
						<CustomLinkForm
							selectedText={selectedText}
							initialData={entityData}
							onSubmit={(linkData) => {
								// Create new entity with updated data
								const contentState = editorState.getCurrentContent();
								const contentStateWithEntity = contentState.replaceEntityData(entityKey, linkData);
								const newEditorState = EditorState.push(editorState, contentStateWithEntity, 'apply-entity');

								setEditorState(newEditorState);
								message.success('Link updated successfully!');
								Modal.destroyAll();
							}}
							onCancel={() => Modal.destroyAll()}
						/>
					</div>
				),
				footer: null,
				okButtonProps: { style: { display: 'none' } },
				cancelButtonProps: { style: { display: 'none' } },
			});
		} else {
			// Open simple link form
			Modal.confirm({
				title: 'Edit Hyperlink',
				icon: null,
				width: 450,
				content: (
					<SimpleLinkForm
						selectedText={selectedText}
						initialData={entityData}
						onSubmit={(linkData) => {
							// Create new entity with updated data
							const contentState = editorState.getCurrentContent();
							const contentStateWithEntity = contentState.replaceEntityData(entityKey, linkData);
							const newEditorState = EditorState.push(editorState, contentStateWithEntity, 'apply-entity');

							setEditorState(newEditorState);
							message.success('Link updated successfully!');
							Modal.destroyAll();
						}}
						onCancel={() => Modal.destroyAll()}
					/>
				),
				footer: null,
				okButtonProps: { style: { display: 'none' } },
				cancelButtonProps: { style: { display: 'none' } },
			});
		}
	};

	// Simple Link Form Component
	const SimpleLinkForm = ({ onSubmit, onCancel, selectedText, initialData = {} }) => {
		const [url, setUrl] = useState(initialData?.url || '');
		const [openInNewTab, setOpenInNewTab] = useState(initialData?.target === '_blank' || !initialData?.target);

		const handleSubmit = () => {
			if (!url.trim()) {
				message.error('URL is required');
				return;
			}

			// Basic URL validation
			let finalUrl = url.trim();
			if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
				finalUrl = 'https://' + finalUrl;
			}

			onSubmit({
				url: finalUrl,
				target: openInNewTab ? '_blank' : '_self',
				tooltipContent: '', // Empty tooltip for simple links
				linkType: openInNewTab ? 'external' : 'internal',
				imageUrl: '',
			});
		};

		return (
			<div style={{ padding: '15px' }}>
				{selectedText && (
					<div
						style={{
							marginBottom: '15px',
							padding: '10px',
							background: '#f0f7ff',
							border: '1px solid #91d5ff',
							borderRadius: '4px',
						}}>
						<div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1890ff' }}>Selected Text:</div>
						<div style={{ fontStyle: 'italic' }}>"{selectedText}"</div>
					</div>
				)}

				<div style={{ marginBottom: '15px' }}>
					<label
						style={{
							display: 'block',
							marginBottom: '5px',
							fontWeight: 'bold',
						}}>
						URL <span style={{ color: 'red' }}>*</span>
					</label>
					<Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com or /internal-page" onPressEnter={handleSubmit} autoFocus />
					<div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Enter full URL (https://...) or relative path (/page)</div>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
						<input type="checkbox" checked={openInNewTab} onChange={(e) => setOpenInNewTab(e.target.checked)} style={{ marginRight: '8px' }} />
						<span>Open link in new tab</span>
					</label>
				</div>

				<div style={{ textAlign: 'right', marginTop: '20px' }}>
					<Button style={{ marginRight: '10px' }} onClick={onCancel}>
						Cancel
					</Button>
					<Button type="primary" onClick={handleSubmit}>
						Add Link
					</Button>
				</div>
			</div>
		);
	};

	const handleCustomLinkClick = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();

		// Check if text is selected
		if (selection.isCollapsed()) {
			message.warning('Please select some text first before adding a link');
			return;
		}

		// Get the selected text
		const startKey = selection.getStartKey();
		const startOffset = selection.getStartOffset();
		const endOffset = selection.getEndOffset();
		const blockWithSelection = currentContent.getBlockForKey(startKey);
		const selectedText = blockWithSelection.getText().slice(startOffset, endOffset);

		console.log('Selected text:', selectedText);
		console.log('Selection:', selection.toJS());

		// Create modal with our custom form
		Modal.confirm({
			title: 'Add Link with Tooltip',
			icon: null,
			width: 500,
			content: (
				<div style={{ marginTop: '15px' }}>
					<CustomLinkForm
						selectedText={selectedText}
						onSubmit={(linkData) => {
							console.log('Submitting link data:', linkData);

							// Create entity with the tooltip and image
							const contentState = editorState.getCurrentContent();
							const contentStateWithEntity = contentState.createEntity('LINK', 'MUTABLE', linkData);

							const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

							// Apply entity to selection
							const newContentState = Modifier.applyEntity(contentStateWithEntity, selection, entityKey);

							const newEditorState = EditorState.push(editorState, newContentState, 'apply-entity');

							setEditorState(newEditorState);
							message.success('Link added successfully!');
							Modal.destroyAll();
						}}
						onCancel={() => Modal.destroyAll()}
					/>
				</div>
			),
			footer: null,
			okButtonProps: { style: { display: 'none' } },
			cancelButtonProps: { style: { display: 'none' } },
		});
	};

	const CustomLinkForm = ({ onSubmit, onCancel, initialData = {}, selectedText }) => {
		const [url, setUrl] = useState(initialData?.url || '');
		const [tooltipContent, setTooltipContent] = useState(initialData?.tooltipContent || '');
		const [linkType, setLinkType] = useState(initialData?.linkType || 'external');
		const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
		const [uploadImageLoading, setUploadImageLoading] = useState(false);
		const [showImageSection, setShowImageSection] = useState(initialData?.imageUrl ? true : false);
		const [target, setTarget] = useState(initialData?.target || '_blank');

		// Set the target based on the link type
		useEffect(() => {
			if (linkType === 'internal') {
				setTarget('_self');
			} else {
				setTarget('_blank');
			}
		}, [linkType]);

		// Configure upload props with relative URL for proxy support
		const linkImageUploadProps = {
			name: 'file',
			multiple: false,
			listType: 'picture-card',
			showUploadList: false,
			action: 'https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/articles/linkimages', // Relative URL for proxy
			headers: {
				Authorization: localStorage.getItem(AUTH_TOKEN) || null,
			},
		};

		// Handle image upload
		const handleImageUpload = (info) => {
			if (info.file.status === 'uploading') {
				setUploadImageLoading(true);
				return;
			}
			if (info.file.status === 'done') {
				if (info.file.response && info.file.response.fileUrl) {
					setImageUrl(info.file.response.fileUrl);
					setUploadImageLoading(false);
				}
			}
		};

		// Validate and submit form
		const handleSubmit = () => {
			// Check required fields
			if (!url.trim()) {
				message.error('URL is required');
				return;
			}

			if (!tooltipContent.trim()) {
				message.error('Tooltip content is required');
				return;
			}

			// Submit if validation passes
			onSubmit({
				url,
				target,
				tooltipContent,
				linkType,
				imageUrl,
			});
		};

		return (
			<div style={{ padding: '10px' }}>
				{selectedText && (
					<div
						style={{
							marginBottom: '15px',
							padding: '10px',
							background: '#f0f7ff',
							border: '1px solid #91d5ff',
							borderRadius: '4px',
						}}>
						<div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#1890ff' }}>Selected Text:</div>
						<div style={{ fontStyle: 'italic' }}>"{selectedText}"</div>
					</div>
				)}

				<div style={{ marginBottom: '15px' }}>
					<label
						style={{
							display: 'block',
							marginBottom: '5px',
							fontWeight: 'bold',
						}}>
						Link Type
					</label>
					<Radio.Group value={linkType} onChange={(e) => setLinkType(e.target.value)} style={{ width: '100%' }}>
						<Radio value="internal">Internal Link (Same Window)</Radio>
						<Radio value="external">External Link (New Window)</Radio>
					</Radio.Group>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label
						style={{
							display: 'block',
							marginBottom: '5px',
							fontWeight: 'bold',
						}}>
						URL <span style={{ color: 'red' }}>*</span>
					</label>
					<Input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="Enter URL"
						// required
					/>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<label
						style={{
							display: 'block',
							marginBottom: '5px',
							fontWeight: 'bold',
						}}>
						Tooltip Content <span style={{ color: 'red' }}>*</span>
					</label>
					<Input.TextArea value={tooltipContent} onChange={(e) => setTooltipContent(e.target.value)} placeholder="Enter tooltip text" rows={3} required />
					<div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Tooltip text will appear when users hover over the link</div>
				</div>

				<div style={{ marginBottom: '15px' }}>
					<Button type="dashed" onClick={() => setShowImageSection(!showImageSection)} style={{ marginBottom: '10px' }}>
						{showImageSection ? 'Hide Image Upload' : 'Add Image (Optional)'}
					</Button>

					{showImageSection && (
						<div
							style={{
								padding: '10px',
								border: '1px dashed #d9d9d9',
								borderRadius: '4px',
							}}>
							<Upload {...linkImageUploadProps} onChange={handleImageUpload}>
								{imageUrl ? (
									<img src={imageUrl} alt="Uploaded" style={{ width: '100%' }} />
								) : (
									<div>
										{uploadImageLoading ? (
											<div>
												<LoadingOutlined className="font-size-xxl text-primary" />
												<div className="mt-3">Uploading</div>
											</div>
										) : (
											<div>
												<PlusOutlined />
												<div style={{ marginTop: 8 }}>Upload</div>
											</div>
										)}
									</div>
								)}
							</Upload>
							<div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Image will be displayed with the linked text</div>

							{imageUrl && (
								<Button
									danger
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setImageUrl('');
									}}
									style={{ marginTop: '10px' }}>
									Remove Image
								</Button>
							)}
						</div>
					)}
				</div>

				<div style={{ textAlign: 'right', marginTop: '20px' }}>
					<Button style={{ marginRight: '10px' }} onClick={onCancel}>
						Cancel
					</Button>
					<Button type="primary" onClick={handleSubmit}>
						Add Link
					</Button>
				</div>
			</div>
		);
	};

	const ApproveTextFun = useCallback(
		(status, editingSession) => {
			const statusIsValid = ['content_review_1', 'content_review_2', 'content_review_3'].includes(status);
			const roleIsValid = userRoles.some((role) => ['Content Editor Level 1', 'Content Editor Level 2', 'Content Editor Level 3'].includes(role));
			if (statusIsValid && roleIsValid) {
				setApprovalText('Approve');
				setApproval(true);
				!editingSession && setEditOn(true);
			} else if (status === 'language_review' && userRoles.includes('Language Editor')) {
				setApprovalText('Approve');
				setApproval(true);
				!editingSession && setEditOn(true);
			} else if (status === 'chief_review' && userRoles.includes('Chief Editor')) {
				setApprovalText('Approve Final');
				setApproval(true);
				!editingSession && setEditOn(true);
			} else {
				setApproval(false);
			}
		},
		[userRoles]
	);
	const removeAllStyles = () => {
		const selection = editorState.getSelection();
		const currentContent = editorState.getCurrentContent();

		// Check if there's a selection
		if (selection.isCollapsed()) {
			message.warning('Please select some text first');
			return;
		}

		// Get all possible inline styles
		const inlineStyles = [
			'BOLD',
			'ITALIC',
			'UNDERLINE',
			'STRIKETHROUGH',
			'FONTWEIGHT_NORMAL',
			'FONTWEIGHT_SLIM',
			'FONTWEIGHT_MEDIUM',
			'FONTWEIGHT_SEMIBOLD',
			'FONTWEIGHT_BOLD',
			'FONTWEIGHT_EXTRABOLD',
			'HIGHLIGHT_YELLOW',
			'HIGHLIGHT_GREEN',
			'HIGHLIGHT_BLUE',
			'HIGHLIGHT_PINK',
			'HIGHLIGHT_ORANGE',
			'HIGHLIGHT_PURPLE',
			'SUBSCRIPT',
			'SUPERSCRIPT',
			'UPPERCASE',
			'LOWERCASE',
			'CAPITALIZE',
		];

		// Remove all inline styles from selection
		let contentState = currentContent;
		inlineStyles.forEach((style) => {
			contentState = Modifier.removeInlineStyle(contentState, selection, style);
		});

		// Get the selected blocks
		const startKey = selection.getStartKey();
		const endKey = selection.getEndKey();
		const blockMap = contentState.getBlockMap();

		// Convert all block types to 'unstyled' (NORMAL_SPACING paragraph)
		const blocks = [];
		let inSelection = false;
		blockMap.forEach((block, key) => {
			if (key === startKey) inSelection = true;

			if (inSelection) {
				// Change block type to 'unstyled' and remove alignment
				const newBlock = block.merge({
					type: 'unstyled',
					data: block.getData().delete('text-align'),
				});
				blocks.push([key, newBlock]);
			}

			if (key === endKey) inSelection = false;
		});

		// Apply block type changes
		blocks.forEach(([key, block]) => {
			contentState = contentState.merge({
				blockMap: contentState.getBlockMap().set(key, block),
			});
		});

		// Remove line-spacing data from all selected blocks
		let clearedBlockMap = contentState.getBlockMap();
		let clearedBlocks = [];
		inSelection = false;
		clearedBlockMap.forEach((block, key) => {
			if (key === startKey) inSelection = true;
			if (inSelection) {
				// Remove line-spacing and alignment
				const newBlock = block.merge({
					type: 'unstyled',
					data: block.getData().delete('text-align').delete('line-spacing'),
				});
				clearedBlocks.push([key, newBlock]);
			}
			if (key === endKey) inSelection = false;
		});
		// Apply block type and data changes
		clearedBlocks.forEach(([key, block]) => {
			contentState = contentState.merge({
				blockMap: contentState.getBlockMap().set(key, block),
			});
		});

		// Remove link entity from the selection in the updated contentState
		const newContentState = Modifier.applyEntity(contentState, selection, null);
		const newEditorState = EditorState.push(editorState, newContentState, 'change-block-type');
		setEditorState(EditorState.forceSelection(newEditorState, selection));
		message.success('All styles, formatting, and line spacing removed');
	};
	useEffect(() => {
		// Check if userData is not null in auth
		if (auth.roles) {
			setUserRoles(auth.userRoles);
			if (auth.userRoles.includes('Administrator') || auth.userRoles.includes('Post Admin')) {
				setDirecAssign(true);
			}
		} else {
			// Check if userData is null and there's a valid token
			if (!user.userRoles && auth.token) {
				// Dispatch the action to fetch user data
				dispatch(fetchUserData(auth.token));
			} else {
				setUserRoles(user.userRoles);
				if (user.userRoles.includes('Administrator') || user.userRoles.includes('Post Admin')) {
					setDirecAssign(true);
				}
			}
		}
	}, [dispatch, user.userRoles, auth.token, auth.userRoles, auth.roles]);

	// For thumbnail
	const [uploadedThumbnailImg, setThumbnailImage] = useState('');
	const [allSelectedThumbnailImgs, setAllSelectedThumbnailImgs] = useState([]);
	const [uploadThumbnailImgLoading, setUploadThumbnailImgLoading] = useState(false);

	// For featured image
	const [uploadedFeaturedImg, setFeaturedImage] = useState('');
	const [allSelectedFeaturedImgs, setAllSelectedFeaturedImgs] = useState([]);
	const [uploadFeaturedImgLoading, setUploadFeaturedImgLoading] = useState(false);

	// For image
	const [uploadedImage, setImage] = useState('');
	const [allSelectedImages, setAllSelectedImages] = useState([]);
	const [uploadImageLoading, setUploadImageLoading] = useState(false);

	// For more images
	const [uploadedMoreImgs, setMoreImgs] = useState([]);
	const [allSelectedMoreImgs, setAllSelectedMoreImgs] = useState([]);
	const [uploadMoreImgLoading, setUploadMoreImgsLoading] = useState(false);

	const [submitLoading, setSubmitLoading] = useState(false);
	const [list, setList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [singleFetchAttempted, setSingleFetchAttempted] = useState(false);

	const [approval, setApproval] = useState(false);
	const [approveLoading, setApproveLoading] = useState(false);
	const [approvalText, setApprovalText] = useState('Approve it!');
	const [rejectLoading, setRejectLoading] = useState(false);
	const [editOn, setEditOn] = useState(false);

	// to track is form submitted
	// const [isFormSubmitted, setIsFormSubmitted] = useState(false);
	const [isPostsFetched, setIsPostsFetched] = useState(false);

	// check it is in global state
	const articles_list = useSelector((state) => state.post.posts);
	const selectedPost = useSelector((state) => state.post.selectedPost);
	useEffect(() => {
		if (!articles_list.length && mode === EDIT && !isPostsFetched) {
			dispatch(fetchAllPostsByPostType({ postTypeId: '66d9d564987787d3e3ff1315' }));
		} else {
			setList(articles_list);
			setLoading(false);
		}
		setIsPostsFetched(true);
	}, [articles_list, dispatch, mode, isPostsFetched]);

	// Fallback: fetch single article by id if list doesn't contain it (e.g., on hard refresh with pagination)
	useEffect(() => {
		if (mode === EDIT && !loading) {
			const { id } = param || {};
			const existsInList = list.find((article) => article._id === id);
			if (!existsInList && !selectedPost && !singleFetchAttempted && id) {
				setSingleFetchAttempted(true);
				dispatch(fetchPostById({ postId: id }));
			}
		}
	}, [mode, loading, list, selectedPost, singleFetchAttempted, param, dispatch]);

	const columns = [
		{
			title: 'User Email',
			dataIndex: 'userId',
			key: 'userId',
		},
		{
			title: 'Approved Status',
			dataIndex: 'approvedStatus',
			key: 'approvedStatus',
		},
		{
			title: 'Editor Message',
			dataIndex: 'editorMsg',
			key: 'editorMsg',
		},
	];

	let articleDataforgeneral;

	if (mode === EDIT && !loading) {
		const { id } = param;
		const articleIdforGeneral = id;
		articleDataforgeneral = list.find((article) => article._id === articleIdforGeneral);
	}

	useEffect(() => {
		// When in edit/view mode, hydrate form once data is available (from list or single fetch).
		if (mode === EDIT && !loading) {
			const { id } = param || {};
			const articleId = id;
			const articleData = list.find((article) => article._id === articleId) || (selectedPost && selectedPost._id === articleId ? selectedPost : null);
			if (articleData) {
				setCurrentStatus(articleData.status);
				const mainContent =
					articleData?.editingSession?.draftContent && user?.userData?._id === articleData.editingSession.id
						? articleData?.editingSession?.draftContent
						: articleData.content;

				setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(mainContent)), createDecorator()));
				form.setFieldsValue({
					title: articleData.title,
					slug: articleData.slug,
					sub_title: articleData.sub_title,
					short_desc: articleData.short_desc,
					language: articleData.language._id,
					categories: articleData.categories.map((category) => ({
						label: category.name,
						value: category._id,
					})),
					meta_title: articleData.meta_title,
					meta_desc: articleData.meta_desc,
					meta_tags: articleData.meta_tags,
					ParentCategory: articleData.categories.map((category) => ({
						label: category.parentCategory?.name,
						value: category.parentCategory?.id,
					})),
				});

				// Approval list start
				let newItems = [];
				articleData.approvers.forEach((data, index) => {
					const temp = {
						key: index + 1,
						userId: data.email ? data.email : data.id,
						approvedStatus: data.approved,
						editorMsg: data.editorMessage,
					};
					newItems.push(temp);
				});
				setApprovalList((prevState) => [...prevState, ...newItems]);
				//approval list end
				setCurrentEditor(articleData.editingSession);

				setThumbnailImage(articleData.thumbnail);
				setAllSelectedThumbnailImgs([articleData.thumbnail]);

				setFeaturedImage(articleData.featured_image);
				setAllSelectedFeaturedImgs([articleData.featured_image]);

				setImage(articleData.image);
				setAllSelectedImages([articleData.image]);

				setMoreImgs(articleData.more_images);
				setAllSelectedMoreImgs(articleData.more_images);

				ApproveTextFun(articleData.status, articleData?.editingSession?.id);
				setSelectedStatus(articleData.status);
			}
		}
	}, [form, mode, param, props, list, selectedPost, loading, ApproveTextFun, user]);

	const handleThumbnailImgUploadChange = (info) => {
		if (info.file.status === 'uploading') {
			setUploadThumbnailImgLoading(true);
			return;
		}
		if (info.file.status === 'done') {
			if (info.file.response.fileUrl) {
				setThumbnailImage(info.file.response.fileUrl);
				setAllSelectedThumbnailImgs((prev) => {
					return [...prev, info.file.response.fileUrl];
				});
				setUploadThumbnailImgLoading(false);
			}
		}
	};

	const handleFeaturedImgUploadChange = (info) => {
		if (info.file.status === 'uploading') {
			setUploadFeaturedImgLoading(true);
			return;
		}
		if (info.file.status === 'done') {
			if (info.file.response.fileUrl) {
				setFeaturedImage(info.file.response.fileUrl);
				setAllSelectedFeaturedImgs((prev) => {
					return [...prev, info.file.response.fileUrl];
				});
				setUploadFeaturedImgLoading(false);
			}
		}
	};

	const handleImageUploadChange = (info) => {
		if (info.file.status === 'uploading') {
			setUploadImageLoading(true);
			return;
		}
		if (info.file.status === 'done') {
			if (info.file.response.fileUrl) {
				setImage(info.file.response.fileUrl);
				setAllSelectedImages((prev) => {
					return [...prev, info.file.response.fileUrl];
				});
				setUploadImageLoading(false);
			}
		}
	};

	const handleClearSelectedMoreImages = () => {
		setMoreImgs([]);
	};

	// Handle remove thumbnail image
	const handleRemoveThumbnailImg = () => {
		setThumbnailImage('');
		message.success('Thumbnail image removed');
	};

	// Handle remove featured image
	const handleRemoveFeaturedImg = () => {
		setFeaturedImage('');
		message.success('Featured image removed');
	};

	// Handle remove image
	const handleRemoveImg = () => {
		setImage('');
		message.success('Image removed');
	};

	// For more images
	const handleUploadMoreImagesChange = (info) => {
		if (info.file.status === 'uploading') {
			setUploadMoreImgsLoading(true);
			return;
		}
		if (info.file.status === 'done') {
			if (info.file.response.fileUrl) {
				setMoreImgs((prev) => {
					return [...prev, info.file.response.fileUrl];
				});

				setAllSelectedMoreImgs((prev) => {
					return [...prev, info.file.response.fileUrl];
				});

				setUploadMoreImgsLoading(false);
			}
		}
	};

	const onFinish = (saveType) => {
		setSubmitLoading(true);

		// Get raw content from editor and properly clean it for saving
		const rawEditorContent = convertToRaw(editorState.getCurrentContent());

		// DEBUG: Log the raw content to verify alignment data is present
		console.log('=== RAW EDITOR CONTENT ===');
		console.log(
			'Blocks:',
			rawEditorContent.blocks.map((block) => ({
				text: block.text,
				type: block.type,
				data: block.data,
			}))
		);

		// Clean the content to prevent serialization issues
		let cleanContent = JSON.stringify(rawEditorContent);
		try {
			// Attempt to clean complex objects from content
			const contentObj = JSON.parse(cleanContent);
			Object.keys(contentObj.entityMap || {}).forEach((key) => {
				const entity = contentObj.entityMap[key];
				if (entity.type === 'LINK') {
					// Only keep primitive values
					entity.data = {
						url: entity.data?.url || '',
						target: entity.data?.target || '_blank',
						tooltipContent: entity.data?.tooltipContent || '',
						imageUrl: entity.data?.imageUrl || '',
						linkType: entity.data?.linkType || 'external',
					};
				}
			});
			cleanContent = JSON.stringify(contentObj);

			// DEBUG: Log final content being saved
			console.log('=== FINAL CONTENT TO BE SAVED ===');
			console.log(
				JSON.parse(cleanContent).blocks.map((block) => ({
					text: block.text,
					type: block.type,
					data: block.data,
				}))
			);
		} catch (error) {
			console.error('Error cleaning content:', error);
			// Keep using the original JSON stringified content
		}

		form
			.validateFields()
			.then((values) => {
				console.log('=== FORM SUBMISSION DEBUG ===');
				console.log('Raw form values:', values);
				console.log('Categories field before processing:', values.categories);
				console.log('Categories type:', typeof values.categories);
				console.log('Categories is array:', Array.isArray(values.categories));

				values.title = values.title.trim().replace(/\s+/g, ' ');
				// values.slug = values.slug.trim().replace(/\s+/g, " ");
				values.postType = '66d9d564987787d3e3ff1312';
				values.thumbnail = uploadedThumbnailImg;
				values.featured_image = uploadedFeaturedImg;
				values.image = uploadedImage;
				values.allSelectedThumbnailImgs = allSelectedThumbnailImgs;
				values.allSelectedFeaturedImgs = allSelectedFeaturedImgs;
				values.allSelectedImages = allSelectedImages;
				values.more_images = uploadedMoreImgs;
				values.allSelectedMoreImgs = allSelectedMoreImgs;
				values.content = cleanContent;

				// UPDATED FIX FOR CATEGORIES: Handle both objects and strings
				if (values.categories && Array.isArray(values.categories)) {
					// Extract just the IDs from the category objects OR keep strings as-is
					values.categories = values.categories.map((category) => {
						if (typeof category === 'object' && category.value) {
							return category.value; // For objects with value property
						} else if (typeof category === 'string') {
							return category; // Sub-sub category IDs are already strings
						} else {
							return category; // Fallback
						}
					});
				}

				console.log('Categories field after processing:', values.categories);
				console.log('Final payload being sent:', values);

				// Clean up form fields that shouldn't be sent to backend
				delete values.finalParentCategory;

				// set setIsFormSubmitted as true
				// setIsFormSubmitted(true);

				setTimeout(() => {
					setSubmitLoading(false);
					if (mode === ADD) {
						// call API to create a Article
						dispatch(createPost({ postData: values })).then((result) => {
							if (result.type.includes('rejected')) {
								console.error('Error creating article:', result.payload);
								message.error('Failed to create article');
							} else {
								// reset the form and show the user created successfully
								form.resetFields();
								setThumbnailImage('');
								setAllSelectedThumbnailImgs([]);
								setFeaturedImage('');
								setAllSelectedFeaturedImgs([]);
								setImage('');
								setAllSelectedImages([]);
								setMoreImgs([]);
								setAllSelectedMoreImgs([]);
								// Set is form submitted as a false because form is blank
								// setIsFormSubmitted(false);
								navigate(getListingPathWithFilters());
								message.success(`Article ${values.title} is created successfully`);
							}
						});
					}
					if (mode === EDIT) {
						// call API to Update a Article
						const { id } = param;
						const draftValue = { draftContent: cleanContent }; // Use cleaned content here too
						const updateValue = saveType === 'draft' && !user.userRoles.includes('Administrator') && !user.userRoles.includes('Post Admin') ? draftValue : values;

						dispatch(updatePost({ postData: updateValue, postId: id })).then((result) => {
							if (result.type.includes('rejected')) {
								console.error('Error updating article:', result.payload);
								message.error(result.payload || 'Failed to update article');
							} else {
								setAllSelectedThumbnailImgs([result.payload.thumbnail]);
								setAllSelectedFeaturedImgs([result.payload.featured_image]);
								setImage(result.payload.image);
								setAllSelectedImages([result.payload.image]);
								setAllSelectedMoreImgs(result.payload.more_images);
								message.success('Article updated successfully!');
								navigate(getListingPathWithFilters());
							}
						});
					}
				}, 1500);
			})
			.catch((error) => {
				setSubmitLoading(false);
				console.error('Form validation failed:', error);
				message.error('Please check all required fields');
			});
	};

	// Forward declarations to fix reference issues
	let onApprove;
	let onRejected;

	// Function to handle confirmation before performing the action
	const handleConfirmAction = async (action) => {
		let tempMsg = '';
		try {
			const result = await Modal.confirm({
				title: 'Confirmation',
				content: (
					<div>
						<p>Are you sure you want to proceed?</p>
						{(action === onApprove || action === onRejected) && (
							<Input.TextArea
								rows={4}
								onChange={(e) => {
									tempMsg = e.target.value;
								}}
								placeholder="Enter your message here"
							/>
						)}
					</div>
				),
				okText: 'Yes',
				cancelText: 'No',
				onOk() {
					action(tempMsg); // Proceed with the action if confirmed
				},
				onCancel() {
					console.log(result);
				},
			});
		} catch (errorInfo) {
			console.log('Failed:', errorInfo);
		}
	};

	// for approve process
	onApprove = (tempMsg) => {
		onFinish();
		const { id } = param;
		setApproveLoading(true);
		// call API to create a Article
		dispatch(
			updateStatus({
				postId: id,
				giveApproval: 1,
				editorMessage: tempMsg,
			})
		).then((result) => {
			if (result.type.includes('rejected')) {
				console.log(result);
			} else {
				setApproveLoading(false);
				setApproval(false);
			}
		});
	};

	const directAssignFun = () => {
		const { id } = param;
		// call API to create a Article
		dispatch(updateStatusByAdmin({ postId: id, giveApproval: selectedStatus })).then((result) => {
			if (result.type.includes('rejected')) {
				console.log(result);
			} else {
				console.log('done status change');
				setModal1Open(false);
			}
		});
	};

	onRejected = (tempMsg) => {
		const { id } = param;
		setRejectLoading(true);
		// call API to create a Article
		dispatch(updateStatus({ postId: id, giveApproval: 2, editorMessage: tempMsg })).then((result) => {
			if (result.type.includes('rejected')) {
				console.log(result);
			} else {
				setRejectLoading(false);
				setApproval(false);
			}
		});
	};

	const handleEditFun = () => {
		const { id } = param;
		dispatch(editPost({ postId: id })).then((result) => {
			if (result.type.includes('rejected')) {
				console.log(result);
			} else {
				setEditOn(false);
			}
		});
	};

	return (
		<>
			<Form
				layout="vertical"
				form={form}
				name="advanced_search"
				className="ant-advanced-search-form"
				initialValues={{
					heightUnit: 'cm',
					widthUnit: 'cm',
					weightUnit: 'kg',
				}}>
				<PageHeaderAlt className="border-bottom" overlap>
					<div className="container">
						<Flex className="py-2" mobileFlex={false} justifyContent="space-between" alignItems="center">
							{view ? (
								<h2 className="mb-3">View Article</h2>
							) : (
								<>
									<h2 className="mb-3">{mode === 'ADD' ? 'Add New Article' : `Edit Article`} </h2>
									<div className="mb-3">
										{editOn ? (
											<Button type="primary" onClick={() => handleConfirmAction(handleEditFun)} style={{ marginRight: '10px' }}>
												Attend
											</Button>
										) : (
											mode === EDIT &&
											userRoles &&
											approval && (
												<>
													<Button type="primary" ghost onClick={() => handleConfirmAction(handleEditFun)} loading={approveLoading} style={{ marginRight: '10px' }}>
														Cancel Edit
													</Button>
													<Button type="primary" onClick={() => handleConfirmAction(onApprove)} loading={approveLoading} style={{ marginRight: '10px' }}>
														{approvalText}
													</Button>
													<Button type="primary" danger onClick={() => handleConfirmAction(onRejected)} loading={rejectLoading} style={{ marginRight: '10px' }}>
														Send Back
													</Button>
												</>
											)
										)}

										{direcAssign && mode === EDIT && (
											<>
												<Button type="primary" className="mr-2" onClick={() => setModal1Open(true)}>
													Change Status
												</Button>
												<Modal
													title="Assign the Post"
													style={{
														top: 20,
													}}
													className="statusModal"
													open={modal1Open}
													onOk={() => handleConfirmAction(directAssignFun)}
													// onOk={() => directAssignFun()}
													onCancel={() => setModal1Open(false)}>
													<div className="mt-3">
														<Select
															style={{ width: '100%' }}
															onChange={(value) => {
																setSelectedStatus(value);
															}}
															defaultValue={selectedStatus}>
															{currentStatus === 'chief_editor_approved' ? (
																<Option value="published">Publish</Option>
															) : (
																<>
																	<Option value="content_review_1">Content Editor Level 1</Option>
																	<Option value="content_review_2">Content Editor Level 2</Option>
																	<Option value="content_review_3">Content Editor Level 3</Option>
																	<Option value="language_review">Language Editor</Option>
																	<Option value="chief_review">Chief Editor</Option>
																	<Option value="published">Publish</Option>
																</>
															)}
														</Select>
														<h2 style={{ marginTop: '20px' }}>Approved User List</h2>
														<Table dataSource={approvalList} columns={columns} />
													</div>
													{currentEditor && (
														<>
															<h2>Current Editor</h2>
															<div style={{ display: 'flex' }}>
																<div style={{ marginRight: '100px' }}>
																	<div>Email</div>
																	<div>{currentEditor?.email}</div>
																</div>
																<div style={{ marginRight: '100px' }}>
																	<div>Started Editing</div>
																	<div>
																		{new Date(currentEditor?.startedAt).toLocaleString('en-US', {
																			year: 'numeric',
																			month: 'long',
																			day: 'numeric',
																			hour: '2-digit',
																			minute: '2-digit',
																			hour12: true,
																		})}
																	</div>
																</div>
																<div>
																	<div>Last Editing</div>
																	<div>
																		{currentEditor?.lastEdit
																			? new Date(currentEditor?.lastEdit).toLocaleString('en-US', {
																					year: 'numeric',
																					month: 'long',
																					day: 'numeric',
																					hour: '2-digit',
																					minute: '2-digit',
																					hour12: true,
																			  })
																			: 'Not saved any draft yet'}
																	</div>
																</div>
															</div>
														</>
													)}
												</Modal>
											</>
										)}
										{(!editOn || userRoles.includes('Administrator') || mode === 'ADD') && (
											<Button type="primary" onClick={() => onFinish('draft')} htmlType="submit" loading={submitLoading}>
												{mode === 'ADD' ? 'Add' : user.userRoles.includes('Administrator') || user.userRoles.includes('Post Admin') ? 'Save' : 'Save Draft'}
											</Button>
										)}
									</div>
								</>
							)}
						</Flex>
					</div>
				</PageHeaderAlt>
				<div className="container">
					<Tabs
						defaultActiveKey="1"
						style={{ marginTop: 30 }}
						items={[
							{
								label: 'General',
								key: '1',
								children: (
									<GeneralField
										uploadedThumbnailImg={uploadedThumbnailImg}
										uploadedFeaturedImg={uploadedFeaturedImg}
										uploadedImage={uploadedImage}
										uploadThumbnailImgLoading={uploadThumbnailImgLoading}
										uploadFeaturedImgLoading={uploadFeaturedImgLoading}
										uploadImageLoading={uploadImageLoading}
										handleThumbnailImgUploadChange={handleThumbnailImgUploadChange}
										handleFeaturedImgUploadChange={handleFeaturedImgUploadChange}
										handleImageUploadChange={handleImageUploadChange}
										handleRemoveThumbnailImg={handleRemoveThumbnailImg}
										handleRemoveFeaturedImg={handleRemoveFeaturedImg}
										handleRemoveImg={handleRemoveImg}
										uploadedMoreImgs={uploadedMoreImgs}
										uploadMoreImgLoading={uploadMoreImgLoading}
										handleUploadMoreImagesChange={handleUploadMoreImagesChange}
										handleClearSelectedMoreImages={handleClearSelectedMoreImages}
										view={view}
										mode={mode}
										currentparentcategory={articleDataforgeneral?.categories?.map((category) => category.parentCategory?.id)}>
										<Editor
											editorState={editorState}
											onEditorStateChange={setEditorState}
											wrapperClassName="demo-wrapper"
											editorClassName="demo-editor"
											toolbarClassName="demo-toolbar"
											customStyleMap={customStyleMap}
											blockStyleFn={blockStyleFn}
											toolbarCustomButtons={[
												<div key="custom-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '5px', paddingRight: '5px', alignItems: 'center' }}>
													{/* Custom Indent/Outdent Buttons */}
													<Button key="indent-btn"  onClick={handleIndent} title="Increase indent" style={{ borderColor: '#d9d9d9' }}>
														<MenuUnfoldOutlined /> Indent
													</Button>
													<Button key="outdent-btn"  onClick={handleOutdent} title="Decrease indent" style={{ borderColor: '#d9d9d9' }}>
														<MenuFoldOutlined /> Outdent
													</Button>
													{/* Subscript and Superscript Buttons */}
													<Button key="subscript-btn"  onClick={toggleSubscript} title="Subscript" style={{ borderColor: '#d9d9d9' }}>
														X<sub>2</sub>
													</Button>
													<Button key="superscript-btn"  onClick={toggleSuperscript} title="Superscript" style={{ borderColor: '#d9d9d9' }}>
														X<sup>2</sup>
													</Button>
													{/* Text Transformation Dropdown */}
													<Select
														placeholder="Capitalization"
														style={{ width: 140, padding: '0px', borderRadius: '0px !important' }}
														// size="small"
														onChange={(value) => toggleTextTransform(value)}
														allowClear
														onClear={() => toggleTextTransform('NONE')}>
														<Option value="UPPERCASE">UPPERCASE</Option>
														<Option value="LOWERCASE">lowercase</Option>
														<Option value="CAPITALIZE">Capitalize</Option>
													</Select>
													{/* Line Spacing Dropdown */}
													<Select
														placeholder="Line Spacing"
														style={{ width: 130 }}
														// size="small"
														onChange={(value) => setLineSpacing(value)}
														allowClear
														onClear={() => setLineSpacing('NORMAL_SPACING')}>
														<Option value="NORMAL_SPACING">Normal</Option>
														<Option value="1">1.0</Option>
														<Option value="1-15">1.15</Option>
														<Option value="1-25">1.25</Option>
														<Option value="1-5">1.5</Option>
														<Option value="2">2.0</Option>
														<Option value="2-5">2.5</Option>
														<Option value="3">3.0</Option>
													</Select>{' '}
													{/* Font Weight Dropdown */}
													<Select
														placeholder="Font Weight"
														style={{ width: 150 }}
														// size="small"
														onChange={(value) => toggleFontWeight(value)}
														allowClear
														onClear={() => toggleFontWeight('NONE')}>
														{/* <Option value="FONTWEIGHT_SLIM" style={{ fontWeight: 300 }}>
															Slim (300)
														</Option> */}
														<Option value="FONTWEIGHT_NORMAL" style={{ fontWeight: 400 }}>
															Normal (400)
														</Option>
														<Option value="FONTWEIGHT_MEDIUM" style={{ fontWeight: 500 }}>
															Medium (500)
														</Option>
														<Option value="FONTWEIGHT_SEMIBOLD" style={{ fontWeight: 600 }}>
															Semibold (600)
														</Option>
														<Option value="FONTWEIGHT_BOLD" style={{ fontWeight: 700 }}>
															Bold (700)
														</Option>
														<Option value="FONTWEIGHT_EXTRABOLD" style={{ fontWeight: 800 }}>
															Extra Bold (800)
														</Option>
													</Select>
													{/* Highlight Color Dropdown */}
													<Select
														placeholder="Highlight"
														style={{ width: 130 }}
														// size="small"
														onChange={(value) => toggleHighlight(value)}
														allowClear
														onClear={() => toggleHighlight('NONE')}>
														<Option value="HIGHLIGHT_YELLOW">
															<span style={{ backgroundColor: '#ffff00', padding: '2px 8px', borderRadius: '2px' }}>Yellow</span>
														</Option>
														<Option value="HIGHLIGHT_GREEN">
															<span style={{ backgroundColor: '#90ee90', padding: '2px 8px', borderRadius: '2px' }}>Green</span>
														</Option>
														<Option value="HIGHLIGHT_BLUE">
															<span style={{ backgroundColor: '#add8e6', padding: '2px 8px', borderRadius: '2px' }}>Blue</span>
														</Option>
														<Option value="HIGHLIGHT_PINK">
															<span style={{ backgroundColor: '#ffb6c1', padding: '2px 8px', borderRadius: '2px' }}>Pink</span>
														</Option>
														<Option value="HIGHLIGHT_ORANGE">
															<span style={{ backgroundColor: '#ffa500', padding: '2px 8px', borderRadius: '2px' }}>Orange</span>
														</Option>
														<Option value="HIGHLIGHT_PURPLE">
															<span style={{ backgroundColor: '#dda0dd', padding: '2px 8px', borderRadius: '2px' }}>Purple</span>
														</Option>
													</Select>
													{/* Simple Hyperlink Button */}
													<Button key="add-link" type="default" style={{ borderColor: '#3e79f7', color: '#3e79f7' }} onClick={handleSimpleLinkClick}>
														Add Link
													</Button>
													{/* Advanced Custom Link Button */}
													<Button key="add-link-tooltip" type="primary" onClick={handleCustomLinkClick}>
														Tooltip Link
													</Button>
													{/* Edit Link Button */}
													<Button key="edit-link" type="default" style={{ borderColor: '#52c41a', color: '#52c41a' }} onClick={handleEditLink}>
														Edit Link
													</Button>
													{/* Remove Link Button */}
													<Button key="remove-link"  danger onClick={handleRemoveLink}>
														Remove Link
													</Button>
													{/* Undo Button */}
													<Button key="undo-btn" onClick={handleUndo} disabled={editorState.getUndoStack().size === 0}>
														Undo
													</Button>
													{/* Redo Button */}
													<Button key="redo-btn" onClick={handleRedo} disabled={editorState.getRedoStack().size === 0}>
														Redo
													</Button>
													{/* Remove All Styles Button */}
													<Button key="remove-styles" danger onClick={removeAllStyles}>
														Remove Styles
													</Button>
													{/* Reset Editor Styles Button */}
													<Button key="reset-editor"  onClick={resetEditor} style={{backgroundColor:"gray", color:"white", borderColor:"gray"}}>
														Reset
													</Button>
												</div>,
											]}
											toolbar={{
												options: ['inline', 'blockType', 'list', 'textAlign'],
												inline: {
													inDropdown: false,
													options: ['bold', 'italic', 'underline', 'strikethrough'],
												},
												blockType: {
													inDropdown: false,
													options: [
														'Normal',
														'H2',
														'H3',
														'H4',
														'H5',
														'H6',
														// 'Blockquote'
													],
												},
												list: {
													inDropdown: false,
													options: ['unordered', 'ordered'],
													// options: ['unordered', 'ordered', 'indent', 'outdent'],
												},
												textAlign: {
													inDropdown: false,
													options: ['left', 'center', 'right', 'justify'],
												},
												// embedded: {
												// 	defaultSize: {
												// 		height: 'auto',
												// 		width: 'auto',
												// 	},
												// },
												// image: {
												// 	urlEnabled: true,
												// 	uploadEnabled: true,
												// 	alignmentEnabled: true,
												// 	uploadCallback: async (file) => {
												// 		try {
												// 			const formData = new FormData();
												// 			formData.append('file', file);

												// 			const response = await fetch('https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/articles/content', {
												// 				method: 'POST',
												// 				headers: {
												// 					Authorization: localStorage.getItem(AUTH_TOKEN) || '',
												// 				},
												// 				body: formData,
												// 			});

												// 			if (!response.ok) {
												// 				throw new Error('Upload failed');
												// 			}

												// 			const data = await response.json();
												// 			return { data: { link: data.fileUrl } };
												// 		} catch (error) {
												// 			console.error('Error uploading image:', error);
												// 			message.error('Failed to upload image');
												// 			return { data: { link: '' } };
												// 		}
												// 	},
												// 	previewImage: true,
												// 	inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
												// 	alt: { present: true, mandatory: false },
												// 	defaultSize: {
												// 		height: 'auto',
												// 		width: 'auto',
												// 	},
												// },
												// remove: {},
												// history: {
												// 	inDropdown: false,
												// 	options: ['undo', 'redo'],
												// },
											}}
										/>
									</GeneralField>
								),
							},
							{
								label: 'SEO settings',
								key: '2',
								children: <SeoField />,
							},
						]}
					/>
				</div>
			</Form>
		</>
	);
};

export default ArticleForm;
