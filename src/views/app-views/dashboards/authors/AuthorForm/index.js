import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import { useDispatch, useSelector } from "react-redux";
import {
  createUser,
  fetchUsersByRole,
  updateUser,
} from "store/slices/userSlice";
import { useNavigate } from "react-router-dom";

const ADD = "ADD";
const EDIT = "EDIT";

const AuthorForm = (props) => {
  const dispatch = useDispatch();
  const { mode = ADD, param } = props;
  const [form] = Form.useForm();
  const [profilePic, setProfilePic] = useState("");
  const [allSelectedPics, setAllSelectedPics] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  const navigate = useNavigate();

  
  // check it is in global state
  const authors_list = useSelector((state) => state.user.userList);
  useEffect(() => {
    if (!authors_list.length && mode === EDIT) {
      dispatch(fetchUsersByRole({ roleId: "66d9ff16e8202c00309cf0ec" }));
    } else {
      setList(authors_list);
      setLoading(false);
    }
  }, [authors_list]);

  // Set form values when authors_list is available and in EDIT mode
  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const authorData = list.find((author) => author._id === id); // Use find() to match the exact ID

      if (authorData) {
        form.setFieldsValue({
          username: authorData.username,
          email: authorData.email,
          bio: authorData.bio,
          name: authorData.name,
          surname: authorData.surname,
          languages: authorData.languages.map((language) => language._id),
        });
        setProfilePic(authorData.profile_pic);
        setAllSelectedPics((prev) => {
          return [...prev, authorData.profile_pic];
        });
      }
    }
  }, [form, mode, param, list, loading]);

  // Rest of your component code...

  const handleUploadChange = (info) => {
    // console.log("info" , info);
    if (info.file.status === "uploading") {
      setUploadLoading(true);
      return;
    }
    if (info.file.status === "done") {
      if (info.file.response.fileUrl) {
        setProfilePic(info.file.response.fileUrl);
        setAllSelectedPics((prev) => {
          return [...prev, info.file.response.fileUrl];
        });
        setUploadLoading(false);
      }
    }
  };

  const onFinish = () => {
    setSubmitLoading(true);

    form
      .validateFields()
      .then((values) => { 
        setTimeout(() => {
          setSubmitLoading(false);
          values.roles = ["66d9ff16e8202c00309cf0ec"];
          values.profile_pic = profilePic;
          values.all_selected_pics = allSelectedPics;

          if (mode === ADD) {
            // call API to create a author
            dispatch(createUser({ userData: values })).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
              } else {
                // reset the form and show the user created successfully
                form.resetFields();
                setProfilePic("");
                setAllSelectedPics([]);
                navigate(`/admin/dashboards/authors/listing`);
                // console.log(result.payload);
              }
            });
          }
          if (mode === EDIT) {
            // call API to Update a author
            const { id } = param;
            dispatch(updateUser({ userData: values, userId: id })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                  console.log("promise rejected");
                  message.error(
                    `Something went wrong while updating Author please try again!`
                  );
                } else {
                  setAllSelectedPics([result.payload.profile_pic]);
                  message.success("Author updated successfully!");
                  navigate(`/admin/dashboards/authors/listing`);
                }
              }
            );
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        // console.log('info', info)
        // message.error("Please enter all required field ");
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
              <h2 className="mb-3">
                {mode === "ADD" ? "Add New Author" : `Edit Author`}{" "}
              </h2>
              <div className="mb-3">
                <Button className="mr-2">Discard</Button>
                <Button
                  type="primary"
                  onClick={() => onFinish()}
                  htmlType="submit"
                  loading={submitLoading}
                >
                  {mode === "ADD" ? "Add" : `Save`}
                </Button>
              </div>
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
                    profilePic={profilePic}
                    uploadLoading={uploadLoading}
                    handleUploadChange={handleUploadChange}
                  />
                ),
              },
            ]}
          />
        </div>
      </Form>
    </>
  );
};

export default AuthorForm;
