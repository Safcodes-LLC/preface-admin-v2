import React, { useState, useEffect } from "react";
import PageHeaderAlt from "components/layout-components/PageHeaderAlt";
import { Tabs, Form, Button, message } from "antd";
import Flex from "components/shared-components/Flex";
import GeneralField from "./GeneralField";
import {
  createCategory,
  updateCategory,
  fetchAllCategories,
} from "store/slices/categoriesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ADD = "ADD";
const EDIT = "EDIT";

const CategoryForm = (props) => {
  const dispatch = useDispatch();
  const { mode = ADD, param, view } = props;
  const [form] = Form.useForm();
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredIcon, setFeaturedIcon] = useState(""); // New state for icon
  const [allSelectedFeaturedImages, SetAllSelectedFeaturedImages] = useState(
    []
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [iconUploadLoading, setIconUploadLoading] = useState(false); // New state for icon upload loading
  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // check it is in global state - use categories instead of categoriesByPostType for editing
  const articles_categories_list = useSelector(
    (state) => state.categories.categories
  );
  useEffect(() => {
    if (!articles_categories_list.length && loading) {
      // Fetch all categories if not available
      dispatch(fetchAllCategories());
    } else {
      setList(articles_categories_list);
    }
    setLoading(false);
  }, [articles_categories_list, dispatch]);

  useEffect(() => {
    if ((mode === EDIT || view) && !loading) {
      const { id } = param;
      const categoryId = id;
      const categoryData = list.find((category) => category._id === categoryId);
      console.log(categoryData, "lkll");
      
      // Add null check to prevent undefined error
      if (categoryData) {
        form.setFieldsValue({
          name: categoryData.name,
          shortDescription: categoryData.shortDescription,
          featuredImage: categoryData.featuredImage,
          featuredIcon: categoryData.featuredIcon, // Set icon value
          parentCategory: categoryData.parentCategory?.id || undefined, // FIXED: use .id
          language: categoryData.language?._id || categoryData.language,
        });
        setFeaturedImage(categoryData.featuredImage);
        setFeaturedIcon(categoryData.featuredIcon || ""); // Set icon state
        SetAllSelectedFeaturedImages([categoryData.featuredImage]);
      }
    }
  }, [form, mode, param, props, list, loading, view]);

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

  // New handler for icon upload
  const handleIconUploadChange = (info) => {
    if (info.file.status === "uploading") {
      setIconUploadLoading(true);
      return;
    }
    if (info.file.status === "done") {
      if (info.file.response.fileUrl) {
        setFeaturedIcon(info.file.response.fileUrl);
        setIconUploadLoading(false);
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
        values.featuredIcon = featuredIcon; // Include icon in form values
        values.allSelectedFeaturedImages = allSelectedFeaturedImages;
        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            // call API to create a category
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
                  setFeaturedIcon(""); // Reset icon
                  SetAllSelectedFeaturedImages([]);
                  // Navigate back to category list page
                  navigate(`/admin/dashboards/categories/category-list`);
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
                // Navigate back to category list page after successful update
                navigate(`/admin/dashboards/categories/category-list`);
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
              {view ? (
                <h2 className="mb-3">View Category</h2>
              ) : (
                <>
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
                    featuredImage={featuredImage}
                    featuredIcon={featuredIcon} // Pass icon props
                    uploadLoading={uploadLoading}
                    iconUploadLoading={iconUploadLoading} // Pass icon loading state
                    handleUploadChange={handleUploadChange}
                    handleIconUploadChange={handleIconUploadChange} // Pass icon handler
                    view={view} // Pass view prop to GeneralField
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