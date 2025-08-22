import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message, Modal, Select, Table, Input } from "antd";
import Flex from "components/shared-components/Flex";
import { convertFromRaw, convertToRaw, EditorState } from "draft-js";
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
import { fetchUserData } from "store/slices/userSlice";
import { useNavigate } from "react-router-dom";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";


const ADD = "ADD";
const EDIT = "EDIT";

const VideosForm = (props) => {
  const dispatch = useDispatch();

  const { mode = ADD, param, view } = props;

  const { Option } = Select;

  const [form] = Form.useForm();

  const [userRoles, setUserRoles] = useState([]);
  const user = useSelector((state) => state.user);
  const auth = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  // to track is form submitted
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const [direcAssign, setDirecAssign] = useState(false);
  const [approvalList, setApprovalList] = useState([]);
  const [modal1Open, setModal1Open] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentEditor, setCurrentEditor] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [approval, setApproval] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approvalText, setApprovalText] = useState("Approve it!");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [editOn, setEditOn] = useState(false);

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

  const [isPostsFetched, setIsPostsFetched] = useState(false);

  // For thumbnail
  const [uploadedThumbnailImg, setThumbnailImage] = useState("");
  const [allSelectedThumbnailImgs, setAllSelectedThumbnailImgs] = useState([]);
  const [uploadThumbnailImgLoading, setUploadThumbnailImgLoading] =
    useState(false);

  // For thumbnail image
  const [uploadedThumbnailImage, setThumbnailImageImage] = useState("");
  const [allSelectedThumbnailImageImgs, setAllSelectedThumbnailImageImgs] = useState([]);
  const [uploadThumbnailImageLoading, setUploadThumbnailImageLoading] = useState(false);

  // For more images
  const [uploadedMoreImgs, setMoreImgs] = useState([]);
  const [allSelectedMoreImgs, setAllSelectedMoreImgs] = useState([]);
  const [uploadMoreImgLoading, setUploadMoreImgsLoading] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // check it is in global state
  const videos_list = useSelector((state) => state.post.posts);

  useEffect(() => {
    if (!videos_list.length && mode === EDIT && !isPostsFetched) {
      dispatch(
        fetchAllPostsByPostType({ postTypeId: "66d9d564987787d3e3ff1314" })
      );
    } else {
      setList(videos_list);
      setLoading(false);
    }
    setIsPostsFetched(true);
  }, [dispatch]);

  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const videoId = id;
      const videoData = list.find((video) => video._id === videoId);
      setCurrentStatus(videoData.status);
      const mainContent =
      videoData?.editingSession?.draftContent &&
      user.userData._id === videoData.editingSession.id
        ? videoData?.editingSession?.draftContent
        : videoData.content;

  setEditorState(
    EditorState.createWithContent(convertFromRaw(JSON.parse(mainContent)))
  );
  console.log("videoData", videoData);
      form.setFieldsValue({
        title: videoData.title,
        sub_title: videoData.sub_title,
        short_desc: videoData.short_desc,
        content: videoData.content,
        language: videoData.language._id,
        categories: videoData.categories.map((category) => category._id),
        meta_title: videoData.meta_title,
        meta_desc: videoData.meta_desc,
        meta_tags: videoData.meta_tags,
        thumbnail: videoData.thumbnail,
      });

      // Approval list start
      let newItems = [];
      videoData.approvers.forEach((data, index) => {
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
      setCurrentEditor(videoData.editingSession);

      setThumbnailImage(videoData.video_file);
      setAllSelectedThumbnailImgs([videoData.video_file]);
      setThumbnailImageImage(videoData.thumbnail);
      setAllSelectedThumbnailImageImgs([videoData.thumbnail]);
      setMoreImgs(videoData.more_images);
      setAllSelectedMoreImgs(videoData.more_images);

      ApproveTextFun(videoData.status, videoData?.editingSession?.id);
      setSelectedStatus(videoData.status);
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

  // For thumbnail image
  const handleThumbnailImageUploadChange = (info) => {
    if (info.file.status === "uploading") {
      setUploadThumbnailImageLoading(true);
      return;
    }
    if (info.file.status === "done") {
      if (info.file.response.fileUrl) {
        setThumbnailImageImage(info.file.response.fileUrl);
        setAllSelectedThumbnailImageImgs((prev) => {
          return [...prev, info.file.response.fileUrl];
        });
        setUploadThumbnailImageLoading(false);
      }
    }
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

  // Reset the selected more_images
  const handleClearSelectedMoreImages = () => {
    setMoreImgs([]);
  };

  const onFinish = () => {
    setSubmitLoading(true);
    const rowContent = JSON.stringify(
      convertToRaw(editorState.getCurrentContent())
    );
    form
      .validateFields()
      .then((values) => {
        values.title = values.title.trim().replace(/\s+/g, ' ')
        values.postType = "66d9d564987787d3e3ff1314";
        values.video_file = uploadedThumbnailImg;
        values.allSelectedThumbnailImgs = allSelectedThumbnailImgs;
        values.thumbnail = uploadedThumbnailImage;
        values.allSelectedThumbnailImageImgs = allSelectedThumbnailImageImgs;
        values.more_images = uploadedMoreImgs;
        values.allSelectedMoreImgs = allSelectedMoreImgs;
        values.content = rowContent;

            // set setIsFormSubmitted as true
            setIsFormSubmitted(true);

        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            // call API to create a video
            dispatch(createPost({ postData: values })).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
              } else {
                // reset the form and show the user created successfully
                form.resetFields();
                setThumbnailImage("");
                setAllSelectedThumbnailImgs([]);
                setThumbnailImageImage("");
                setAllSelectedThumbnailImageImgs([]);
                setMoreImgs([]);
                setAllSelectedMoreImgs([]);
                 // Set is form submitted as a false because form is blank
                 setIsFormSubmitted(false);
                navigate(`/admin/dashboards/videos/listing`);
              }
            });
            message.success(`Video ${values.title} is created successfully`);
          }
          if (mode === EDIT) {
            // call API to Update a Video
            const { id } = param;
            dispatch(updatePost({ postData: values, postId: id })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                  console.log("promise rejected");
                  message.error(result.payload);
                } else {
                  setAllSelectedThumbnailImgs([result.payload.video_file]);
                  setAllSelectedMoreImgs(result.payload.more_images);
                  message.success("Video updated successfully!");
                  navigate(`/admin/dashboards/videos/listing`);
                }
              }
            );
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        console.log("info", info);
        message.error("Please enter all required field ");
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
            {(action === onApprove || action === onRejected) && (
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
                <h2 className="mb-3">View Video</h2>
              ) : (
                <>
                  <h2 className="mb-3">
                    {mode === "ADD" ? "Add New Video" : `Edit Video`}{" "}
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
                        onClick={() => onFinish()}
                        htmlType="submit"
                        loading={submitLoading}
                      >
                        {mode === "ADD" ? "Add" : "Save"}
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
                    uploadedThumbnailImage={uploadedThumbnailImage}
                    uploadThumbnailImageLoading={uploadThumbnailImageLoading}
                    handleThumbnailImageUploadChange={
                      handleThumbnailImageUploadChange
                    }
                    uploadedMoreImgs={uploadedMoreImgs}
                    uploadMoreImgLoading={uploadMoreImgLoading}
                    handleUploadMoreImagesChange={handleUploadMoreImagesChange}
                    handleClearSelectedMoreImages={
                      handleClearSelectedMoreImages
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

export default VideosForm;