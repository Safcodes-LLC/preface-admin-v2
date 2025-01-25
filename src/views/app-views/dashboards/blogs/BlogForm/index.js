import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message, Modal, Select, Table, Input } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import ProductListData from "assets/data/product-list.data.json";
import SeoField from "./SeoField";
import { useDispatch, useSelector } from "react-redux";
import {
  createPost,
  editPost,
  fetchAllPostsByPostType,
  updatePost,
  updateStatus,
  updateStatusByAdmin,
} from "store/slices/postSlice";
import { fetchUserData } from "store/slices/userSlice";
import { convertFromRaw, convertToRaw, EditorState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";
import { useNavigate } from "react-router-dom";

const ADD = "ADD";
const EDIT = "EDIT";

const BlogForm = (props) => {
  const dispatch = useDispatch();

  const { Option } = Select;

  const { mode = ADD, param, view } = props;
  const navigate = useNavigate();

  const [form] = Form.useForm();
  const [userRoles, setUserRoles] = useState([]);
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  const [direcAssign, setDirecAssign] = useState(false);
  const [approvalList, setApprovalList] = useState([]);
  const [modal1Open, setModal1Open] = useState(false);
  const [currentEditor, setCurrentEditor] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [isPostsFetched, setIsPostsFetched] = useState(false);

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

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

  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [approval, setApproval] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvalText, setApprovalText] = useState("Approve it!");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [editOn, setEditOn] = useState(false);

  // check it is in global state
  const blogs_list = useSelector((state) => state.post.posts);
  useEffect(() => {
    if (!blogs_list.length && mode === EDIT && !isPostsFetched) {
      dispatch(
        fetchAllPostsByPostType({ postTypeId: "66d9d564987787d3e3ff1316" })
      );
    } else {
      setList(blogs_list);
      setLoading(false);
    }
    setIsPostsFetched(true);
  }, [blogs_list, dispatch]);

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

  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const blogId = id;
      const blogData = list.find((blog) => blog._id === blogId);
      const mainContent =
        blogData?.editingSession?.draftContent &&
        user.userData._id === blogData.editingSession.id
          ? blogData?.editingSession?.draftContent
          : blogData.content;
      setEditorState(
        EditorState.createWithContent(convertFromRaw(JSON.parse(mainContent)))
      );

      setCurrentStatus(blogData.status);
      form.setFieldsValue({
        title: blogData.title,
        sub_title: blogData.sub_title,
        short_desc: blogData.short_desc,
        language: blogData.language._id,
        categories: blogData.categories.map((category) => category._id),
        meta_title: blogData.meta_title,
        meta_desc: blogData.meta_desc,
        meta_tags: blogData.meta_tags,
      });

      // Approval list start
      let newItems = [];
      blogData.approvers.forEach((data, index) => {
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
      setCurrentEditor(blogData.editingSession);

      setThumbnailImage(blogData.thumbnail);
      setAllSelectedThumbnailImgs([blogData.thumbnail]);

      ApproveTextFun(blogData.status, blogData?.editingSession?.id);
      setSelectedStatus(blogData.status);
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

  const onFinish = (saveType) => {
    setSubmitLoading(true);
    const rowContent = JSON.stringify(
      convertToRaw(editorState.getCurrentContent())
    );
    form
      .validateFields()
      .then((values) => {
        values.postType = "66d9d564987787d3e3ff1316";
        values.thumbnail = uploadedThumbnailImg;
        values.allSelectedThumbnailImgs = allSelectedThumbnailImgs;
        values.content = rowContent;

        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            // call API to create a Blog
            dispatch(createPost({ postData: values })).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
              } else {
                // reset the form and show the user created successfully
                form.resetFields();
                setThumbnailImage("");
                setAllSelectedThumbnailImgs([]);
                navigate(`/admin/dashboards/blogs/listing`);
              }
            });
            message.success(`Blog ${values.title} is created successfully`);
          }
          if (mode === EDIT) {
            // call API to Update a Blog
            const { id } = param;
            const draftValue = { draftContent: rowContent };
            const updateValue =
              saveType === "draft" &&
              !user.userRoles.includes("Administrator") &&
              !user.userRoles.includes("Post Admin")
                ? draftValue
                : values;
            dispatch(updatePost({ postData: updateValue, postId: id })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                  console.log("promise rejected");
                  message.error(result.payload);
                } else {
                  setAllSelectedThumbnailImgs([result.payload.thumbnail]);
                  message.success("Blog updated successfully!");
                  navigate(`/admin/dashboards/blogs/listing`);
                }
              }
            );
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        console.log("info", info);
        // message.error("Please enter all required field ");
      });
  };

  // Function to handle confirmation before performing the action
  const handleConfirmAction = async (action) => {
    let tempMsg = "";
    try {
      const result = await Modal.confirm({
        title: "Confirmation",
        content: (
          <div>
            <p>Are you sure you want to proceed?</p>
            {(action == onApprove || action == onRejected) && (
              <Input.TextArea
                rows={4}
                // value={editorMessage}
                onChange={(e) => {
                  console.log("Input changed:", tempMsg); // Debug log
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
  const onApprove = (tempMsg) => {
    onFinish();
    const { id } = param;
    setApproveLoading(true);
    // call API to create a Article
    dispatch(
      updateStatus({ postId: id, giveApproval: 1, editorMessage: tempMsg })
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

  const onRejected = (tempMsg) => {
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
                <h2 className="mb-3">View Blog</h2>
              ) : (
                <>
                  <h2 className="mb-3">
                    {mode === "ADD" ? "Add New Blog" : `Edit Blog`}{" "}
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
                          onOk={() => directAssignFun()}
                          onCancel={() => setModal1Open(false)}
                        >
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
                                {/* <Option value="published">Publish</Option> */}
                              </>
                            )}
                          </Select>
                          <h2 style={{ marginTop: "20px" }}>
                            Approved User List
                          </h2>
                          <Table dataSource={approvalList} columns={columns} />
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
                    view={view}
                  >
                    <Editor
                      editorState={editorState}
                      onEditorStateChange={setEditorState}
                      wrapperClassName="wrapper-class"
                      editorClassName="editor-class"
                      toolbarClassName="toolbar-class"
                      readOnly={view}
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

export default BlogForm;
