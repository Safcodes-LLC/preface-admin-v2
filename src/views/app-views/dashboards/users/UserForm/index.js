import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import { useDispatch, useSelector } from "react-redux";
import { createUser, fetchAllUsers, updateUser } from "store/slices/userSlice";
import Password from "antd/es/input/Password";
import { useNavigate } from "react-router-dom";

const ADD = "ADD";
const EDIT = "EDIT";

const UserForm = (props) => {
  const dispatch = useDispatch();
  const { mode = ADD, param, view } = props;
  const [form] = Form.useForm();
  const [profilePic, setProfilePic] = useState("");
  const [allSelectedPics, setAllSelectedPics] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [currentAdminRole, setCurrentAdminRole] = useState(false);
  const [samplePassword, setSamplePassword] = useState("");
  const [adminRole, setAdminRole] = useState(false);

  const navigate = useNavigate();
  // check it is in global state
  const users_list = useSelector((state) => state.user.userList);

  useEffect(() => {
    if (!users_list.length) {
      dispatch(fetchAllUsers());
    } else {
      setList(users_list);
      setLoading(false);
    }
  }, [users_list, dispatch]);

  // Set form values when users_list is available and in EDIT mode
  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const userData = list.find((user) => user._id === id); // Use find() to match the exact ID
      console.log(userData, "admin user data");

      if (userData) {
        form.setFieldsValue({
          username: userData.username,
          email: userData.email,
          bio: userData.bio,
          name: userData.name,
          surname: userData.surname,
          languages: userData.languages.map((language) => language._id),
          roles: userData.roles.map((role) => role._id),
        });

        const isAdminOrPostAdmin = userData.roles.some(
          (role) =>
            role.title === "Administrator" || role.title === "Post Admin"
        );
        setAdminRole(isAdminOrPostAdmin);

        if (userData?.samplePassword) {
          setSamplePassword(userData?.samplePassword);
        }

        const hasAdminRole = userData.roles.some(
          (role) =>
            role.title === "Administrator" || role.title === "Post Admin"
        );
        setCurrentAdminRole(hasAdminRole);

        setProfilePic(userData.profile_pic);
        setAllSelectedPics((prev) => {
          return [...prev, userData.profile_pic];
        });
      }
    }
}, [mode, param, list, loading, form]);

  // Rest of your component code...

  const handleUploadChange = (info) => {
    console.log("info", info);
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
        // Normalize the username: convert to lowercase and remove spaces
        if (values.username) {
          values.username = values.username.toLowerCase().replace(/\s+/g, "");
        }
        setTimeout(() => {
          setSubmitLoading(false);
          values.profile_pic = profilePic;
          values.all_selected_pics = allSelectedPics;
          console.log("values", values);
          if (mode === ADD) {
            // call API to create a user
            dispatch(createUser({ userData: values })).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
              } else {
                // reset the form and show the user created successfully
                form.resetFields();
                setProfilePic("");
                setAllSelectedPics([]);
                if (props.type === "admin") {
                  navigate(`/admin/dashboards/administrator/users`);
                } else {
                  navigate(`/admin/dashboards/users/listing`);
                }
                // console.log(result.payload);
              }
            });
          }
          if (mode === EDIT) {
            // call API to Update a user
            const { id } = param;
            dispatch(updateUser({ userData: values, userId: id })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                  console.log("promise rejected");
                  message.error(
                    `Something went wrong while updating User please try again!`
                  );
                } else {
                  setAllSelectedPics([result.payload.profile_pic]);

                  if (adminRole) {
                    navigate(`/admin/dashboards/administrator/users`);
                  } else {
                    navigate(`/admin/dashboards/users/listing`);
                  }
                  message.success("User updated successfully!");
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
              {view ? (
                <h2 className="mb-3">View Article</h2>
              ) : (
                <>
                  <h2 className="mb-3">
                    {mode === "ADD" ? "Add New User" : `Edit User`}{" "}
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
                    profilePic={profilePic}
                    uploadLoading={uploadLoading}
                    handleUploadChange={handleUploadChange}
                    type={currentAdminRole ? "admin" : props.type}
                    view={view}
                    samplePassword={samplePassword}
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

export default UserForm;
