import React, { useEffect, useState } from "react";
import { Row, Col, Button, Avatar, Dropdown, Table, Menu, Tag } from "antd";
import StatisticWidget from "components/shared-components/StatisticWidget";
import ChartWidget from "components/shared-components/ChartWidget";
import AvatarStatus from "components/shared-components/AvatarStatus";
import GoalWidget from "components/shared-components/GoalWidget";
import Card from "components/shared-components/Card";
import Flex from "components/shared-components/Flex";
import {
  VisitorChartData,
  ActiveMembersData,
  NewMembersData,
  RecentTransactionData,
} from "./DefaultDashboardData";
import ApexChart from "react-apexcharts";
import { apexLineChartDefaultOption, COLOR_2 } from "constants/ChartConstant";
import { SPACER } from "constants/ThemeConstant";
import {
  UserAddOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  PlusOutlined,
  EllipsisOutlined,
  StopOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import utils from "utils";
import { useSelector } from "react-redux";

import { useDispatch } from "react-redux";
import { fetchAllPosts } from "store/slices/postSlice";
import { fetchUsersByRole } from "store/slices/userSlice";
import { Link } from "react-router-dom";

const MembersChart = (props) => <ApexChart {...props} />;

const memberChartOption = {
  ...apexLineChartDefaultOption,
  ...{
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    colors: [COLOR_2],
  },
};

const latestTransactionOption = [
  {
    key: "Refresh",
    label: (
      <Flex alignItems="center" gap={SPACER[2]}>
        <ReloadOutlined />
        <span className="ml-2">Refresh</span>
      </Flex>
    ),
  },
  {
    key: "Print",
    label: (
      <Flex alignItems="center" gap={SPACER[2]}>
        <PrinterOutlined />
        <span className="ml-2">Print</span>
      </Flex>
    ),
  },
  {
    key: "Export",
    label: (
      <Flex alignItems="center" gap={SPACER[2]}>
        <FileExcelOutlined />
        <span className="ml-2">Export</span>
      </Flex>
    ),
  },
];

const newJoinMemberOptions = [
  {
    key: "Add all",
    label: (
      <Link to="/admin/dashboards/authors/add-author">
        <Flex alignItems="center" gap={SPACER[2]}>
          <PlusOutlined />
          <span className="ml-2">Add Author</span>
        </Flex>
      </Link>
    ),
  },
  {
    key: "List all",
    label: (
      <Link to="/admin/dashboards/authors/listing">
        <Flex alignItems="center" gap={SPACER[2]}>
          <UnorderedListOutlined />
          <span className="ml-2">List all</span>
        </Flex>
      </Link>
    ),
  },
];

const CardDropdown = ({ items }) => {
  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <a
        href="/#"
        className="text-gray font-size-lg"
        onClick={(e) => e.preventDefault()}
      >
        <EllipsisOutlined />
      </a>
    </Dropdown>
  );
};

const tableColumns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    render: (text, record) => (
      <div className="d-flex align-items-center">
        <Avatar
          size={30}
          className="font-size-sm"
          style={{ backgroundColor: "#72849a" }}
        >
          {utils.getNameInitial(text)}
        </Avatar>
        <span className="ml-2">{text}</span>
      </div>
    ),
  },
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
  },
  {
    title: "Language",
    dataIndex: "language",
    key: "language",
  },
  {
    title: "Post Type",
    dataIndex: "posttype",
    key: "posttype",
  },
  {
    title: () => <div className="text-right">Status</div>,
    key: "status",
    render: (_, record) => (
      <div className="text-right">
        <Tag
          className="mr-0"
          color={
            record.status.includes("sendback")
              ? "volcano"
              : record.status === "draft"
              ? "blue"
              : "green"
          }
        >
          {record.status}
        </Tag>
      </div>
    ),
  },
];

export const DefaultDashboard = () => {
  const [visitorChartData] = useState(VisitorChartData);
  const [activeMembersData] = useState(ActiveMembersData);
  const [newMembersData] = useState(NewMembersData);
  const [recentTransactionData] = useState(RecentTransactionData);
  const { direction } = useSelector((state) => state.theme);

  const dispatch = useDispatch();

  useEffect(() => {
    // Dispatch the action to fetch Article posts
    dispatch(fetchAllPosts());
    dispatch(fetchUsersByRole({ roleId: "66d9ff16e8202c00309cf0e9" }));
  }, [dispatch]);

  const allPosts = useSelector((state) => state.post.posts);
  const authors_list = useSelector((state) => state.user.userList);
  // console.log(authors_list," listsssss");

  // Initialize an empty object to store the count of posts per postType.name
  const postCounts = {};

  // Iterate over each post and increment the count for its postType.name
  allPosts.forEach((post) => {
    // Check if the postType.name exists in the object, if not initialize it to 0
    if (!postCounts[post.postType.name]) {
      postCounts[post?.postType?.name] = { total: 0, published: 0 };
    }

    // Increment the total count for the current postType.name
    postCounts[post?.postType?.name].total++;

    // If the post status is 'published', increment the published count
    if (post.status === "published") {
      postCounts[post?.postType?.name].published++;
    }
  });

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  // Create an array of objects based on the counts, including the number of published posts in the subtitle
  const postStatisticData = Object.entries(postCounts).map(
    ([postTypeName, { total, published }]) => ({
      title: postTypeName,
      value: total,
      status: `${percentage(published, total).toFixed(2)}`,
      subtitle: `${published} post${
        published > 1 ? "s" : ""
      } has been published`,
    })
  );

  // Default profile picture URL
  const defaultProfilePic = "/img/avatars/default-avatar.jpg";

  // Transforming authors_list into NewMembersData format
  const transformedAuthors =
    authors_list &&
    authors_list.slice(0, 2).map((author) => ({
      img: author?.profile_pic || defaultProfilePic,
      title: "Author", // You might want to replace "Author" with a more descriptive title based on roles or other attributes
      name: `${author?.name} ${author?.surname}`,
    }));

  const transformedPosts =
    allPosts &&

    allPosts?.slice(0, 5).map((post) => ({
      id: post?._id, // Using _id as the identifier
      name: post?.author?.name, // Mapping the author's name
      title: post?.title, // Using the post title as the date
      language: post?.language.name, // Assuming Language is a direct property of the post
      status: post?.status, // Assuming all posts are approved for this example
      posttype: post?.postType?.name,
      avatarColor: post?.author?.profile_pic || defaultProfilePic, // Mapping the author's profile URL

    }));

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={24} lg={18}>
          <Row gutter={16}>
            {postStatisticData?.map((elm, i) => (
              <Col xs={24} sm={24} md={24} lg={24} xl={8} key={i}>
                <StatisticWidget
                  title={elm?.title}
                  value={String(elm?.value)} // Convert value to string
                  status={Number(elm?.status)} // Convert status to number
                  subtitle={elm?.subtitle}
                />
              </Col>
            ))}
          </Row>
          {/* <Row gutter={16}>
            <Col span={24}>
              <ChartWidget
                title="Unique Visitors"
                series={visitorChartData.series}
                xAxis={visitorChartData.categories}
                height={"400px"}
                direction={direction}
              />
            </Col>
          </Row> */}
        </Col>
        <Col xs={24} sm={24} md={24} lg={6}>
          <Card
            title="New Join Member"
            extra={<CardDropdown items={newJoinMemberOptions} />}
          >
            <div className="mt-3">
              {transformedAuthors?.map((elm, i) => (
                <div
                  key={i}
                  className={`d-flex align-items-center justify-content-between mb-4`}
                >
                  <AvatarStatus
                    id={i}
                    src={elm?.img}
                    name={elm?.name}
                    subTitle={elm?.title}
                  />
                  {/* <div>
                    <Button
                      icon={<UserAddOutlined />}
                      type="default"
                      size="small"
                    >
                      Add
                    </Button>
                  </div> */}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        {/* <Col xs={24} sm={24} md={24} lg={7}>
          <StatisticWidget
            title={
              <MembersChart
                options={memberChartOption}
                series={activeMembersData}
                height={145}
              />
            }
            value="17,329"
            status={3.7}
            subtitle="Active members"
          />
        </Col> */}
        <Col xs={24} sm={24} md={24} lg={24}>
          <Card
            title="Latest Post"
            // extra={<CardDropdown items={latestTransactionOption} />}
          >
            <Table
              className="Name"
              columns={tableColumns}
              dataSource={transformedPosts}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DefaultDashboard;
