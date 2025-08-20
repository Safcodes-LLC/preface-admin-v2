import React, { useState, useEffect, useRef } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import {
  Tabs,
  Form,
  Button,
  message,
  Modal,
  Select,
  Table,
  Input,
  Upload,
  Radio,
} from "antd";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import SeoField from "./SeoField";
import {
  createPost,
  editPost,
  fetchAllPostsByPostType,
  updatePost,
  updateStatus,
  updateStatusByAdmin,
} from "store/slices/postSlice";
import { useDispatch, useSelector } from "react-redux";
import FilesServices from "services/FilesServices";
import { fetchUserData } from "store/slices/userSlice";
import {
  CompositeDecorator,
  convertFromRaw,
  convertToRaw,
  EditorState,
  Modifier,
} from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";
import { useNavigate } from "react-router-dom";
import { AUTH_TOKEN } from "constants/AuthConstant";

const ADD = "ADD";
const EDIT = "EDIT";

const TooltipSpan = (props) => {
  const { contentState, entityKey, children } = props;
  const { tooltipContent } = contentState.getEntity(entityKey).getData();

  return (
    <span
      style={{
        borderBottom: "1px dotted blue",
        cursor: "help",
      }}
      title={tooltipContent}
    >
      {children}
    </span>
  );
};

// Find entities that have tooltips
function findTooltipEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "TOOLTIP"
    );
  }, callback);
}

// Find entities that have links with tooltips
function findLinkEntities(contentBlock, callback, contentState) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "LINK"
    );
  }, callback);
}

// Link component with tooltip support
const Link = (props) => {
  const { contentState, entityKey, children } = props;

  // Safely get entity data with fallbacks
  let url = "#";
  let target = "_self";
  let tooltipContent = "";
  let imageUrl = "";

  // Check if entityKey and contentState are valid before accessing
  if (entityKey && contentState) {
    try {
      const entityData = contentState.getEntity(entityKey).getData();
      url = entityData.url || "#";
      target = entityData.target || "_self";
      tooltipContent = entityData.tooltipContent || "";
      imageUrl = entityData.imageUrl || "";
    } catch (error) {
      console.error("Error accessing entity data:", error);
    }
  }

  // Render different UI based on whether there's an image
  if (imageUrl) {
    return (
      <a
        href={url}
        target={target}
        title={tooltipContent}
        style={
          tooltipContent
            ? { borderBottom: "1px dotted blue", display: "inline-block" }
            : { display: "inline-block" }
        }
      >
        <img
          src={imageUrl}
          alt={children[0]?.props?.text || "Link image"}
          style={{ maxWidth: "100%", height: "auto" }}
        />
        {tooltipContent && <span className="sr-only">{tooltipContent}</span>}
      </a>
    );
  }

  return (
    <a
      href={url}
      target={target}
      title={tooltipContent}
      style={tooltipContent ? { borderBottom: "1px dotted blue" } : {}}
    >
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

let initialContent = "";

const ArticleForm = (props) => {
  const dispatch = useDispatch();

  const { Option } = Select;

  const { mode = ADD, param, view } = props;

  const [form] = Form.useForm();

  const [userRoles, setUserRoles] = useState([]);
  const [direcAssign, setDirecAssign] = useState(false);
  const [approvalList, setApprovalList] = useState([]);
  const [currentEditor, setCurrentEditor] = useState("");
  const [modal1Open, setModal1Open] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      try {
        const contentState = convertFromRaw(JSON.parse(initialContent));
        return EditorState.createWithContent(contentState, createDecorator());
      } catch (error) {
        console.error("Error parsing initial content:", error);
        return EditorState.createEmpty(createDecorator());
      }
    }
    return EditorState.createEmpty(createDecorator());
  });

  const handleCustomLinkClick = () => {
    const selection = editorState.getSelection();

    // Check if text is selected
    if (selection.isCollapsed()) {
      message.info("Please select some text first before adding a link");
      return;
    }

    // Create modal with our custom form
    Modal.confirm({
      title: "Add Link with Tooltip",
      icon: null,
      width: 500,
      content: (
        <div style={{ marginTop: "15px" }}>
          <CustomLinkForm
            onSubmit={(linkData) => {
              // Create entity with the tooltip and image
              const contentState = editorState.getCurrentContent();
              const contentStateWithEntity = contentState.createEntity(
                "LINK",
                "MUTABLE",
                linkData
              );

              const entityKey =
                contentStateWithEntity.getLastCreatedEntityKey();

              // Apply entity to selection
              const newContentState = Modifier.applyEntity(
                contentStateWithEntity,
                selection,
                entityKey
              );

              const newEditorState = EditorState.push(
                editorState,
                newContentState,
                "apply-entity"
              );

              setEditorState(newEditorState);
              Modal.destroyAll();
            }}
            onCancel={() => Modal.destroyAll()}
          />
        </div>
      ),
      footer: null,
    });
  };

  const CustomLinkForm = ({ onSubmit, onCancel, initialData = {} }) => {
    const [url, setUrl] = useState(initialData?.url || "");
    const [tooltipContent, setTooltipContent] = useState(
      initialData?.tooltipContent || ""
    );
    const [linkType, setLinkType] = useState(
      initialData?.linkType || "external"
    );
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
    const [uploadImageLoading, setUploadImageLoading] = useState(false);
    const [showImageSection, setShowImageSection] = useState(false);
    const [target, setTarget] = useState(initialData?.target || "_blank");

    // Set the target based on the link type
    useEffect(() => {
      if (linkType === "internal") {
        setTarget("_self");
      } else {
        setTarget("_blank");
      }
    }, [linkType]);

    // Configure upload props with relative URL for proxy support
    const linkImageUploadProps = {
      name: "file",
      multiple: false,
      listType: "picture-card",
      showUploadList: false,
      action:
        "https://king-prawn-app-x9z27.ondigitalocean.app/api/fileupload/savefile/articles/linkimages", // Relative URL for proxy
      headers: {
        Authorization: localStorage.getItem(AUTH_TOKEN) || null,
      },
    };

    // Handle image upload
    const handleImageUpload = (info) => {
      if (info.file.status === "uploading") {
        setUploadImageLoading(true);
        return;
      }
      if (info.file.status === "done") {
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
        message.error("URL is required");
        return;
      }

      if (!tooltipContent.trim()) {
        message.error("Tooltip content is required");
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
      <div style={{ padding: "10px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Link Type
          </label>
          <Radio.Group
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            style={{ width: "100%" }}
          >
            <Radio value="internal">Internal Link (Same Window)</Radio>
            <Radio value="external">External Link (New Window)</Radio>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            URL <span style={{ color: "red" }}>*</span>
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            // required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Tooltip Content <span style={{ color: "red" }}>*</span>
          </label>
          <Input.TextArea
            value={tooltipContent}
            onChange={(e) => setTooltipContent(e.target.value)}
            placeholder="Enter tooltip text"
            rows={3}
            required
          />
          <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            Tooltip text will appear when users hover over the link
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <Button
            type="dashed"
            onClick={() => setShowImageSection(!showImageSection)}
            style={{ marginBottom: "10px" }}
          >
            {showImageSection ? "Hide Image Upload" : "Add Image (Optional)"}
          </Button>

          {showImageSection && (
            <div
              style={{
                padding: "10px",
                border: "1px dashed #d9d9d9",
                borderRadius: "4px",
              }}
            >
              <Upload {...linkImageUploadProps} onChange={handleImageUpload}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    style={{ width: "100%" }}
                  />
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
              <div
                style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
              >
                Image will be displayed with the linked text
              </div>

              {imageUrl && (
                <Button
                  danger
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl("");
                  }}
                  style={{ marginTop: "10px" }}
                >
                  Remove Image
                </Button>
              )}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", marginTop: "20px" }}>
          <Button style={{ marginRight: "10px" }} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            Add Link
          </Button>
        </div>
      </div>
    );
  };
  // Custom link plugin to include tooltip functionality
  const customLinkPlugin = {
    link: {
      // Override the default link component
      component: Link,
      // Extend the default link plugin's config to include tooltip
      config: {
        defaultTarget: "_blank",
        showOpenOptionOnHover: true,
        // Custom form component that adds tooltip field
        LinkForm: ({ initialData, onChange, onCancel, onSubmit }) => {
          const [url, setUrl] = useState(initialData?.url || "");
          const [target, setTarget] = useState(initialData?.target || "_blank");
          const [tooltipContent, setTooltipContent] = useState(
            initialData?.tooltipContent || ""
          );
          const [linkType, setLinkType] = useState(
            initialData?.linkType || "external"
          );
          const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
          const [uploadImageLoading, setUploadImageLoading] = useState(false);
          const [showImageSection, setShowImageSection] = useState(false);

          // Function to handle image upload
          const handleImageUpload = (info) => {
            if (info.file.status === "uploading") {
              setUploadImageLoading(true);
              return;
            }
            if (info.file.status === "done") {
              if (info.file.response && info.file.response.fileUrl) {
                setImageUrl(info.file.response.fileUrl);
                setUploadImageLoading(false);
              }
            }
          };

          // Set the target based on the link type
          useEffect(() => {
            if (linkType === "internal") {
              setTarget("_self");
            } else {
              setTarget("_blank");
            }
          }, [linkType]);

          return (
            <div style={{ padding: "15px", minWidth: "400px" }}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Link Type
                </label>
                <Radio.Group
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <Radio value="internal">Internal Link (Same Window)</Radio>
                  <Radio value="external">External Link (New Window)</Radio>
                </Radio.Group>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  URL
                </label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL"
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Tooltip Content
                </label>
                <Input.TextArea
                  value={tooltipContent}
                  onChange={(e) => setTooltipContent(e.target.value)}
                  placeholder="Enter tooltip text (optional)"
                  rows={3}
                />
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}
                >
                  Tooltip text will appear when users hover over the link
                </div>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <Button
                  type="dashed"
                  onClick={() => setShowImageSection(!showImageSection)}
                  style={{ marginBottom: "10px" }}
                >
                  {showImageSection
                    ? "Hide Image Upload"
                    : "Add Image (Optional)"}
                </Button>

                {showImageSection && (
                  <div
                    style={{
                      padding: "10px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <Upload
                      name="file"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      action="/api/upload" // Replace with your upload endpoint
                      onChange={handleImageUpload}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Uploaded"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <div>
                          {uploadImageLoading ? (
                            <LoadingOutlined />
                          ) : (
                            <PlusOutlined />
                          )}
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "5px",
                      }}
                    >
                      Image will be displayed with the linked text
                    </div>

                    {imageUrl && (
                      <Button
                        danger
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl("");
                        }}
                        style={{ marginTop: "10px" }}
                      >
                        Remove Image
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <Button style={{ marginRight: "10px" }} onClick={onCancel}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    onSubmit({
                      url,
                      target,
                      tooltipContent,
                      linkType,
                      imageUrl,
                    })
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          );
        },
      },
    },
  };

  const ApproveTextFun = (status, editingSession) => {
    const statusIsValid = [
      "content_review_1",
      "content_review_2",
      "content_review_3",
    ].includes(status);
    const roleIsValid = userRoles.some((role) =>
      [
        "Content Editor Level 1",
        "Content Editor Level 2",
        "Content Editor Level 3",
      ].includes(role)
    );
    if (statusIsValid && roleIsValid) {
      setApprovalText("Approve");
      setApproval(true);
      !editingSession && setEditOn(true);
    } else if (
      status === "language_review" &&
      userRoles.includes("Language Editor")
    ) {
      setApprovalText("Approve");
      setApproval(true);
      !editingSession && setEditOn(true);
    } else if (
      status === "chief_review" &&
      userRoles.includes("Chief Editor")
    ) {
      setApprovalText("Approve Final");
      setApproval(true);
      !editingSession && setEditOn(true);
    } else {
      setApproval(false);
    }
  };

  useEffect(() => {
    // Check if userData is not null in auth
    if (auth.roles) {
      setUserRoles(auth.userRoles);
      if (
        auth.userRoles.includes("Administrator") ||
        auth.userRoles.includes("Post Admin")
      ) {
        setDirecAssign(true);
      }
    } else {
      // Check if userData is null and there's a valid token
      if (!user.userRoles && auth.token) {
        // Dispatch the action to fetch user data
        dispatch(fetchUserData(auth.token));
      } else {
        setUserRoles(user.userRoles);
        if (
          user.userRoles.includes("Administrator") ||
          user.userRoles.includes("Post Admin")
        ) {
          setDirecAssign(true);
        }
      }
    }
  }, [dispatch, user.userRoles, auth.token, auth.userRoles, userRoles]);

  // For thumbnail
  const [uploadedThumbnailImg, setThumbnailImage] = useState("");
  const [allSelectedThumbnailImgs, setAllSelectedThumbnailImgs] = useState([]);
  const [uploadThumbnailImgLoading, setUploadThumbnailImgLoading] =
    useState(false);

  // For more images
  const [uploadedMoreImgs, setMoreImgs] = useState([]);
  const [allSelectedMoreImgs, setAllSelectedMoreImgs] = useState([]);
  const [uploadMoreImgLoading, setUploadMoreImgsLoading] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [approval, setApproval] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvalText, setApprovalText] = useState("Approve it!");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [editOn, setEditOn] = useState(false);

  // to track is form submitted
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isPostsFetched, setIsPostsFetched] = useState(false);

  // check it is in global state
  const articles_list = useSelector((state) => state.post.posts);
  useEffect(() => {
    if (!articles_list.length && mode === EDIT && !isPostsFetched) {
      dispatch(
        fetchAllPostsByPostType({ postTypeId: "66d9d564987787d3e3ff1315" })
      );
    } else {
      setList(articles_list);
      setLoading(false);
    }
    setIsPostsFetched(true);
  }, [articles_list, dispatch]);

  const columns = [
    {
      title: "User Email",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Approved Status",
      dataIndex: "approvedStatus",
      key: "approvedStatus",
    },
    {
      title: "Editor Message",
      dataIndex: "editorMsg",
      key: "editorMsg",
    },
  ];

  let articleDataforgeneral;

  if (mode === EDIT && !loading) {
    const { id } = param;
    const articleIdforGeneral = id;
    articleDataforgeneral = list.find(
      (article) => article._id === articleIdforGeneral
    );
  }

  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const articleId = id;
      const articleData = list.find((article) => article._id === articleId);
      if (articleData) {
        setCurrentStatus(articleData.status);
        const mainContent =
          articleData?.editingSession?.draftContent &&
          user.userData._id === articleData.editingSession.id
            ? articleData?.editingSession?.draftContent
            : articleData.content;

        setEditorState(
          EditorState.createWithContent(
            convertFromRaw(JSON.parse(mainContent)),
            createDecorator()
          )
        );
        form.setFieldsValue({
          title: articleData.title,
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
          ParentCategory: articleData.categories.map(
            (category) => category.parentCategory?.id
          ),
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
        setMoreImgs(articleData.more_images);
        setAllSelectedMoreImgs(articleData.more_images);

        ApproveTextFun(articleData.status, articleData?.editingSession?.id);
        setSelectedStatus(articleData.status);
      }
    }
  }, [form, mode, param, props, list, loading]);

  const handleThumbnailImgUploadChange = (info) => {
    if (info.file.status === "uploading") {
      setUploadThumbnailImgLoading(true);
      return;
    }
    if (info.file.status === "done") {
      if (info.file.response.fileUrl) {
        setThumbnailImage(info.file.response.fileUrl);
        setAllSelectedThumbnailImgs((prev) => {
          return [...prev, info.file.response.fileUrl];
        });
        setUploadThumbnailImgLoading(false);
      }
    }
  };

  const handleClearSelectedMoreImages = () => {
    setMoreImgs([]);
  };

  // For more images
  const handleUploadMoreImagesChange = (info) => {
    if (info.file.status === "uploading") {
      setUploadMoreImgsLoading(true);
      return;
    }
    if (info.file.status === "done") {
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

  // Clean the content to prevent serialization issues
  let cleanContent = JSON.stringify(rawEditorContent);
  try {
    // Attempt to clean complex objects from content
    const contentObj = JSON.parse(cleanContent);
    Object.keys(contentObj.entityMap || {}).forEach((key) => {
      const entity = contentObj.entityMap[key];
      if (entity.type === "LINK") {
        // Only keep primitive values
        entity.data = {
          url: entity.data?.url || "",
          target: entity.data?.target || "_blank",
          tooltipContent: entity.data?.tooltipContent || "",
          imageUrl: entity.data?.imageUrl || "",
          linkType: entity.data?.linkType || "external",
        };
      }
    });
    cleanContent = JSON.stringify(contentObj);
  } catch (error) {
    console.error("Error cleaning content:", error);
    // Keep using the original JSON stringified content
  }

  form
    .validateFields()
    .then((values) => {
      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Raw form values:", values);
      console.log("Categories field before processing:", values.categories);
      console.log("Categories type:", typeof values.categories);
      console.log("Categories is array:", Array.isArray(values.categories));

      values.title = values.title.trim().replace(/\s+/g, " ");
      values.postType = "66d9d564987787d3e3ff1312";
      values.thumbnail = uploadedThumbnailImg;
      values.allSelectedThumbnailImgs = allSelectedThumbnailImgs;
      values.more_images = uploadedMoreImgs;
      values.allSelectedMoreImgs = allSelectedMoreImgs;
      values.content = cleanContent;

      // UPDATED FIX FOR CATEGORIES: Handle both objects and strings
      if (values.categories && Array.isArray(values.categories)) {
        // Extract just the IDs from the category objects OR keep strings as-is
        values.categories = values.categories.map((category) => {
          if (typeof category === "object" && category.value) {
            return category.value; // For objects with value property
          } else if (typeof category === "string") {
            return category; // Sub-sub category IDs are already strings
          } else {
            return category; // Fallback
          }
        });
      }

      console.log("Categories field after processing:", values.categories);
      console.log("Final payload being sent:", values);

      // Clean up form fields that shouldn't be sent to backend
      delete values.finalParentCategory;

      // set setIsFormSubmitted as true
      setIsFormSubmitted(true);

      setTimeout(() => {
        setSubmitLoading(false);
        if (mode === ADD) {
          // call API to create a Article
          dispatch(createPost({ postData: values })).then((result) => {
            if (result.type.includes("rejected")) {
              console.error("Error creating article:", result.payload);
              message.error("Failed to create article");
            } else {
              // reset the form and show the user created successfully
              form.resetFields();
              setThumbnailImage("");
              setAllSelectedThumbnailImgs([]);
              setMoreImgs([]);
              setAllSelectedMoreImgs([]);
              // Set is form submitted as a false because form is blank
              setIsFormSubmitted(false);
              navigate(`/admin/dashboards/articles/listing`);
              message.success(
                `Article ${values.title} is created successfully`
              );
            }
          });
        }
        if (mode === EDIT) {
          // call API to Update a Article
          const { id } = param;
          const draftValue = { draftContent: cleanContent }; // Use cleaned content here too
          const updateValue =
            saveType === "draft" &&
            !user.userRoles.includes("Administrator") &&
            !user.userRoles.includes("Post Admin")
              ? draftValue
              : values;

          dispatch(updatePost({ postData: updateValue, postId: id })).then(
            (result) => {
              if (result.type.includes("rejected")) {
                console.error("Error updating article:", result.payload);
                message.error(result.payload || "Failed to update article");
              } else {
                setAllSelectedThumbnailImgs([result.payload.thumbnail]);
                setAllSelectedMoreImgs(result.payload.more_images);
                message.success("Article updated successfully!");
                navigate(`/admin/dashboards/articles/listing`);
              }
            }
          );
        }
      }, 1500);
    })
    .catch((error) => {
      setSubmitLoading(false);
      console.error("Form validation failed:", error);
      message.error("Please check all required fields");
    });
};

  // Forward declarations to fix reference issues
  let onApprove;
  let onRejected;

  // Function to handle confirmation before performing the action
  const handleConfirmAction = async (action) => {
    let tempMsg = "";
    try {
      const result = await Modal.confirm({
        title: "Confirmation",
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
        okText: "Yes",
        cancelText: "No",
        onOk() {
          action(tempMsg); // Proceed with the action if confirmed
        },
        onCancel() {
          console.log(result);
        },
      });
    } catch (errorInfo) {
      console.log("Failed:", errorInfo);
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
      if (result.type.includes("rejected")) {
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
    dispatch(
      updateStatusByAdmin({ postId: id, giveApproval: selectedStatus })
    ).then((result) => {
      if (result.type.includes("rejected")) {
        console.log(result);
      } else {
        console.log("done status change");
        setModal1Open(false);
      }
    });
  };

  onRejected = (tempMsg) => {
    const { id } = param;
    setRejectLoading(true);
    // call API to create a Article
    dispatch(
      updateStatus({ postId: id, giveApproval: 2, editorMessage: tempMsg })
    ).then((result) => {
      if (result.type.includes("rejected")) {
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
      if (result.type.includes("rejected")) {
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
          heightUnit: "cm",
          widthUnit: "cm",
          weightUnit: "kg",
        }}
      >
        <PageHeaderAlt className="border-bottom" overlap>
          <div className="container">
            <Flex
              className="py-2"
              mobileFlex={false}
              justifyContent="space-between"
              alignItems="center"
            >
              {view ? (
                <h2 className="mb-3">View Article</h2>
              ) : (
                <>
                  <h2 className="mb-3">
                    {mode === "ADD" ? "Add New Article" : `Edit Article`}{" "}
                  </h2>
                  <div className="mb-3">
                    {editOn ? (
                      <Button
                        type="primary"
                        onClick={() => handleConfirmAction(handleEditFun)}
                        style={{ marginRight: "10px" }}
                      >
                        Attend
                      </Button>
                    ) : (
                      mode === EDIT &&
                      userRoles &&
                      approval && (
                        <>
                          <Button
                            type="primary"
                            ghost
                            onClick={() => handleConfirmAction(handleEditFun)}
                            loading={approveLoading}
                            style={{ marginRight: "10px" }}
                          >
                            Cancel Edit
                          </Button>
                          <Button
                            type="primary"
                            onClick={() => handleConfirmAction(onApprove)}
                            loading={approveLoading}
                            style={{ marginRight: "10px" }}
                          >
                            {approvalText}
                          </Button>
                          <Button
                            type="primary"
                            danger
                            onClick={() => handleConfirmAction(onRejected)}
                            loading={rejectLoading}
                            style={{ marginRight: "10px" }}
                          >
                            Send Back
                          </Button>
                        </>
                      )
                    )}

                    {direcAssign && mode === EDIT && (
                      <>
                        <Button
                          type="primary"
                          className="mr-2"
                          onClick={() => setModal1Open(true)}
                        >
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
                          onCancel={() => setModal1Open(false)}
                        >
                          <div className="mt-3">
                            <Select
                              style={{ width: "100%" }}
                              onChange={(value) => {
                                setSelectedStatus(value);
                              }}
                              defaultValue={selectedStatus}
                            >
                              {currentStatus === "chief_editor_approved" ? (
                                <Option value="published">Publish</Option>
                              ) : (
                                <>
                                  <Option value="content_review_1">
                                    Content Editor Level 1
                                  </Option>
                                  <Option value="content_review_2">
                                    Content Editor Level 2
                                  </Option>
                                  <Option value="content_review_3">
                                    Content Editor Level 3
                                  </Option>
                                  <Option value="language_review">
                                    Language Editor
                                  </Option>
                                  <Option value="chief_review">
                                    Chief Editor
                                  </Option>
                                  <Option value="published">Publish</Option>
                                </>
                              )}
                            </Select>
                            <h2 style={{ marginTop: "20px" }}>
                              Approved User List
                            </h2>
                            <Table
                              dataSource={approvalList}
                              columns={columns}
                            />
                          </div>
                          {currentEditor && (
                            <>
                              <h2>Current Editor</h2>
                              <div style={{ display: "flex" }}>
                                <div style={{ marginRight: "100px" }}>
                                  <div>Email</div>
                                  <div>{currentEditor?.email}</div>
                                </div>
                                <div style={{ marginRight: "100px" }}>
                                  <div>Started Editing</div>
                                  <div>
                                    {new Date(
                                      currentEditor?.startedAt
                                    ).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <div>Last Editing</div>
                                  <div>
                                    {currentEditor?.lastEdit
                                      ? new Date(
                                          currentEditor?.lastEdit
                                        ).toLocaleString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "Not saved any draft yet"}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </Modal>
                      </>
                    )}
                    {(!editOn ||
                      userRoles.includes("Administrator") ||
                      mode === "ADD") && (
                      <Button
                        type="primary"
                        onClick={() => onFinish("draft")}
                        htmlType="submit"
                        loading={submitLoading}
                      >
                        {mode === "ADD"
                          ? "Add"
                          : user.userRoles.includes("Administrator") ||
                            user.userRoles.includes("Post Admin")
                          ? "Save"
                          : "Save Draft"}
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
                label: "General",
                key: "1",
                children: (
                  <GeneralField
                    uploadedThumbnailImg={uploadedThumbnailImg}
                    uploadThumbnailImgLoading={uploadThumbnailImgLoading}
                    handleThumbnailImgUploadChange={
                      handleThumbnailImgUploadChange
                    }
                    uploadedMoreImgs={uploadedMoreImgs}
                    uploadMoreImgLoading={uploadMoreImgLoading}
                    handleUploadMoreImagesChange={handleUploadMoreImagesChange}
                    handleClearSelectedMoreImages={
                      handleClearSelectedMoreImages
                    }
                    view={view}
                    mode={mode}
                    currentparentcategory={articleDataforgeneral?.categories?.map(
                      (category) => category.parentCategory?.id
                    )}
                  >
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={setEditorState}
                      wrapperClassName="wrapper-class"
                      editorClassName="editor-class"
                      toolbarClassName="toolbar-class"
                      toolbarCustomButtons={[
                        <Button
                          key="add-link-tooltip"
                          type="primary"
                          style={{ margin: "5px" }}
                          onClick={handleCustomLinkClick}
                        >
                          Add Link with Tooltip
                        </Button>,
                      ]}
                      toolbar={{
                        options: [
                          "inline",
                          "blockType",
                          "fontSize",
                          "list",
                          "textAlign",
                          "colorPicker",
                          "link",
                          "embedded",
                          "emoji",
                          "image",
                          "remove",
                          "history",
                        ],
                        inline: {
                          options: [
                            "bold",
                            "italic",
                            "underline",
                            "strikethrough",
                            "monospace",
                            "superscript",
                            "subscript",
                          ],
                          inDropdown: false,
                        },
                        blockType: {
                          inDropdown: true,
                        },
                        fontSize: {
                          inDropdown: true,
                        },
                        list: {
                          inDropdown: false,
                        },
                        textAlign: {
                          inDropdown: false,
                        },
                        link: {
                          inDropdown: false,
                          showOpenOptionOnHover: true,
                          defaultTargetOption: "_blank",
                          options: ["link", "unlink"],
                          // This is the key change - we'll customize the link component
                          // to include our tooltip functionality
                          component: customLinkPlugin.link.component,
                          config: customLinkPlugin.link.config,
                        },
                        image: {
                          // Configure the image upload here if needed
                          urlEnabled: true,
                          uploadEnabled: true,
                          uploadCallback: async (file) => {
                            try {
                              // Create form data for the file upload
                              const formData = new FormData();
                              formData.append("file", file);

                              // Send to your backend API
                              const response = await fetch("/api/upload", {
                                method: "POST",
                                body: formData,
                              });

                              if (!response.ok) {
                                throw new Error("Upload failed");
                              }

                              const data = await response.json();
                              return { data: { link: data.fileUrl } };
                            } catch (error) {
                              console.error("Error uploading image:", error);
                              message.error("Failed to upload image");
                              return { data: { link: "" } };
                            }
                          },
                          alignmentEnabled: true,
                          previewImage: true,
                          inputAccept:
                            "image/gif,image/jpeg,image/jpg,image/png,image/svg",
                          alt: { present: true, mandatory: false },
                        },
                      }}
                    />
                  </GeneralField>
                ),
              },
              {
                label: "SEO settings",
                key: "2",
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
