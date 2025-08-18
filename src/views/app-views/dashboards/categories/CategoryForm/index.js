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
  const [featuredIcon, setFeaturedIcon] = useState("");
  const [allSelectedFeaturedImages, SetAllSelectedFeaturedImages] = useState([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [iconUploadLoading, setIconUploadLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const articles_categories_list = useSelector(
    (state) => state.categories.categories
  );

  useEffect(() => {
    if (!articles_categories_list.length && loading) {
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
      console.log(categoryData, "categoryData");
      
      if (categoryData) {
        // Determine if this category has a parent and if that parent is a main category or sub-category
        let parentCategoryValue = undefined;
        let subCategoryValue = undefined;

        if (categoryData.parentCategory) {
          const parentId = categoryData.parentCategory.id;
          const parentCategory = list.find(cat => cat._id === parentId);
          
          if (parentCategory) {
            if (parentCategory.parentCategory) {
              // The parent has a parent, so it's a sub-category
              subCategoryValue = parentId;
              parentCategoryValue = parentCategory.parentCategory.id;
            } else {
              // The parent has no parent, so it's a main category
              parentCategoryValue = parentId;
            }
          }
        }

        form.setFieldsValue({
          name: categoryData.name,
          shortDescription: categoryData.shortDescription,
          featuredImage: categoryData.featuredImage,
          featuredIcon: categoryData.featuredIcon,
          parentCategory: parentCategoryValue,
          subCategory: subCategoryValue,
          language: categoryData.language?._id || categoryData.language,
          isTrending: categoryData.isTrending || false,
        });
        
        setFeaturedImage(categoryData.featuredImage || "");
        setFeaturedIcon(categoryData.featuredIcon || "");
        SetAllSelectedFeaturedImages([categoryData.featuredImage]);
      }
    }
  }, [form, mode, param, props, list, loading, view]);

  const handleUploadChange = (info) => {
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
      .then(async (values) => {
        values.name = values.name.trim().replace(/\s+/g, ' ');
        
        // FIXED: Handle the new two-level dropdown structure
        const categoryData = {
          name: values.name,
          shortDescription: values.shortDescription,
          language: values.language,
          featuredImage: featuredImage,
          featuredIcon: featuredIcon,
          allSelectedFeaturedImages: allSelectedFeaturedImages,
        };

        // Only include isTrending if it exists in values (edit mode)
        if (values.isTrending !== undefined) {
          categoryData.isTrending = values.isTrending;
        }

        // Determine the actual parent category
        if (values.subCategory) {
          // If sub-category is selected, the new category will be under the sub-category
          categoryData.parentCategory = values.subCategory;
        } else if (values.parentCategory) {
          // If only parent category is selected, the new category will be under the parent
          categoryData.parentCategory = values.parentCategory;
        }
        // If neither is selected, it's a main category (no parentCategory field)
        
        setTimeout(() => {
          setSubmitLoading(false);
          if (mode === ADD) {
            console.log("Creating category with data:", categoryData);
            dispatch(createCategory({ categoryData })).then(
              (result) => {
                if (result.type.includes("rejected")) {
                  message.error("Failed to create category");
                } else {
                  message.success(`Created ${values.name} successfully`);
                  form.resetFields();
                  setFeaturedImage("");
                  setFeaturedIcon("");
                  SetAllSelectedFeaturedImages([]);
                  navigate(`/admin/dashboards/categories/category-list`);
                }
              }
            );
          }
          
          if (mode === EDIT) {
            const { id } = param;
            console.log("Updating category with data:", categoryData);
            dispatch(
              updateCategory({ categoryData, categoryId: id })
            ).then((result) => {
              if (result.type.includes("rejected")) {
                console.log("Update rejected:", result.payload);
                message.error(result.payload || "Failed to update category");
              } else {
                message.success("Category updated successfully!");
                navigate(`/admin/dashboards/categories/category-list`);
              }
            });
          }
        }, 1500);
      })
      .catch((info) => {
        setSubmitLoading(false);
        console.log("Validation failed:", info);
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
                    featuredIcon={featuredIcon}
                    uploadLoading={uploadLoading}
                    iconUploadLoading={iconUploadLoading}
                    handleUploadChange={handleUploadChange}
                    handleIconUploadChange={handleIconUploadChange}
                    view={view}
                    mode={mode}
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