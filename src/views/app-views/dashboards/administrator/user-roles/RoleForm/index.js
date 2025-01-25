import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import { useDispatch, useSelector } from "react-redux";
import {
  createNewRole,
  fetchAllRoles,
  updateRole,
} from "store/slices/rolesSlice";

const ADD = "ADD";
const EDIT = "EDIT";

const RoleForm = (props) => {
  const dispatch = useDispatch();
  const { mode = ADD, param } = props;

  const [form] = Form.useForm();
  const [list, setList] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // check it is in global state
  const roles_list = useSelector((state) => state.roles.roles);
  useEffect(() => {
    if (!roles_list.length) {
      dispatch(fetchAllRoles());
    } else {
      setList(roles_list);
      setLoading(false);
    }
  }, [roles_list, dispatch]);

  useEffect(() => {
    if (mode === EDIT) {
      const { id } = param;
      const roleData = list.find((role) => role._id === id);
      if (roleData) {
        form.setFieldsValue({
          title: roleData.title,
          description: roleData.description,
        });
      }
    }
  }, [form, mode, param, props, list, loading]);

  const onFinish = () => {
    setSubmitLoading(true);
    form
      .validateFields()
      .then((values) => {
        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            // call API to create a Role
            dispatch(createNewRole({ roleData: values })).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
              } else {
                // reset the form and show the user created successfully
                message.success("Role Created successfully!");
                form.resetFields();
              }
            });
          }
          if (mode === EDIT) {
            // call API to Update a Role
            const { id } = param;
            dispatch(updateRole({ roleData: values, roleId: id })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                  console.log("promise rejected");
                  message.error(
                    `Something went wrong while updating Role please try again!`
                  );
                } else {
                  message.success("Author updated successfully!");
                }
              }
            );
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        console.log("info", info);
        // message.error('Please enter all required field ');
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
                {mode === "ADD" ? "Add New Role" : `Edit Role`}{" "}
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
                children: <GeneralField />,
              },
            ]}
          />
        </div>
      </Form>
    </>
  );
};

export default RoleForm;
