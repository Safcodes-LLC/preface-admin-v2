import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import {
  createCategory,
  fetchAllCategoriesByPostType,
  updateCategory,
} from "store/slices/categoriesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ADD = "ADD";
const EDIT = "EDIT";

const CategoryForm = (props) => {
  const dispatch = useDispatch();
  const { mode = ADD, param } = props;
  const [form] = Form.useForm();
  const [featuredImage, setFeaturedImage] = useState("");
  const [allSelectedFeaturedImages, SetAllSelectedFeaturedImages] = useState(
    []
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // check it is in global state
  const articles_categories_list = useSelector(
    (state) => state.categories.categoriesByPostType
  );
  useEffect(() => {
    if (!articles_categories_list.length && loading) {
      dispatch(
        fetchAllCategoriesByPostType({ postTypeId: "66d9d564987787d3e3ff1312" })
      );
    } else {
      setList(articles_categories_list);
    }
    setLoading(false);
  }, [articles_categories_list, dispatch]);

  useEffect(() => {
    if (mode === EDIT && !loading) {
      const { id } = param;
      const categoryId = id;
      const categoryData = list.find((category) => category._id === categoryId);
      console.log(categoryData, "lkll");
      form.setFieldsValue({
        name: categoryData.name,
        shortDescription: categoryData.shortDescription,
        featuredImage: categoryData.featuredImage,
        postType: categoryData.postType._id,
        parentCategory: categoryData.parentCategory,
      });
      setFeaturedImage(categoryData.featuredImage);
      SetAllSelectedFeaturedImages([categoryData.featuredImage]);
    }
  }, [form, mode, param, props, list, loading]);

  const handleUploadChange = (info) => {
    // console.log("info" , info);
    if (info.file.status === "uploading") {
      setUploadLoading(true);
      return;
    }
    if (info.file.status === "done") {
      if (info.file.response.fileUrl) {
        setFeaturedImage(info.file.response.fileUrl);
        SetAllSelectedFeaturedImages((prev) => {
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
        values.name = values.name.trim().replace(/\s+/g, ' ')
        values.featuredImage = featuredImage;
        values.allSelectedFeaturedImages = allSelectedFeaturedImages;
        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            // call API to create a author
            console.log("values", values);
            dispatch(createCategory({ categoryData: values })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  // console.log(result.payload);
                } else {
                  // reset the form and show the user created successfully
                  // message.success(`Created ${values.name} to categories list`);
                  form.resetFields();
                  setFeaturedImage("");
                  SetAllSelectedFeaturedImages([]);
                  if (values.postType === "66d9d564987787d3e3ff1314") {
                    navigate(`/admin/dashboards/categories/videos`);
                  } else if (values.postType === "66d9d564987787d3e3ff1312") {
                    navigate(`/admin/dashboards/categories/articles`);
                  } else if (values.postType === "66d9d564987787d3e3ff1315") {
                    navigate(`/admin/dashboards/categories/ebooks`);
                  } else if (values.postType === "66d9d564987787d3e3ff1316") {
                    navigate(`/admin/dashboards/categories/blogs`);
                  } else if (values.postType === "66d9d564987787d3e3ff1313") {
                    navigate(`/admin/dashboards/categories/podcasts`);
                  }
                  // console.log(result.payload);
                }
              }
            );
          }
          if (mode === EDIT) {
            // call API to Update a category
            const { id } = param;
            dispatch(
              updateCategory({ categoryData: values, categoryId: id })
            ).then((result) => {
              if (result.type.includes("rejected")) {
                // console.log(result.payload);
                console.log("promise rejected");
                message.error(result.payload);
              } else {
                SetAllSelectedFeaturedImages([result.payload.profile_pic]);
                message.success("Category updated successfully!");
              }
            });
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        console.log("info", info);
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
                {mode === "ADD" ? "Add New Category" : `Edit Category`}{" "}
              </h2>
              <div className="mb-3">
                {/* <Button className="mr-2">Discard</Button> */}
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
                    featuredImage={featuredImage}
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

export default CategoryForm;
