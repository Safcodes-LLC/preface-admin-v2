import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Tag,
  Table,
  Input,
  Space,
  message,
  Button,
  Modal,
  Select,
  Form,
  Divider,
  Tooltip,
} from "antd";
import { ArrowLeftOutlined, EyeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import QuranService from "services/quranService";
import Flex from "components/shared-components/Flex";

// eslint-disable-next-line no-unused-vars
const { Title, Text } = Typography;

const ViewSurah = () => {
  const { surahId } = useParams();
  const navigate = useNavigate();
  const [surahInfo, setSurahInfo] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [surahModalVisible, setSurahModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      try {
        const res = await QuranService.getSurahById(surahId);
        const data = Array.isArray(res.data) ? res.data : [];
        setAyahs(data);
        if (data.length > 0 && data[0].surah) {
          setSurahInfo(data[0].surah);
        }
      } catch (err) {
        message.error("Failed to load Surah details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSurah();
  }, [surahId]);

  const onSearchChange = (e) => setSearchValue(e.target.value);

  const languages = [
    { label: "English", value: "en" },
    { label: "Arabic", value: "ar" },
    { label: "Malayalam", value: "ml" },
  ];

  const handleViewAyah = (record) => {
    navigate(`/admin/dashboards/quran/view-surah/${surahId}/ayah/${record.ayahNumber}`);
  };

  const filteredAyahs = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    if (!search) return ayahs;
    return ayahs.filter((a) => {
      return (
        String(a.ayahNumber).includes(search) ||
        (a.textUthmani || "").toLowerCase().includes(search) ||
        (a.textImlaei || "").toLowerCase().includes(search)
      );
    });
  }, [ayahs, searchValue]);

  const columns = [
    {
      title: "#",
      dataIndex: "ayahNumber",
      key: "ayahNumber",
      width: 70,
      sorter: (a, b) => a.ayahNumber - b.ayahNumber,
    },
    {
      title: "Ayah",
      dataIndex: "textUthmani",
      key: "textUthmani",
      render: (text) => <span style={{ fontSize: 18 }}>{text}</span>,
    },
    // {
    //   title: "Arabic (Imlaei)",
    //   dataIndex: "textImlaei",
    //   key: "textImlaei",
    // },
    {
      title: "Page",
      dataIndex: "pageNumber",
      key: "pageNumber",
      width: 90,
    },
    {
      title: "Juz",
      dataIndex: "juzNumber",
      key: "juzNumber",
      width: 90,
    },
    {
      title: "Hizb",
      dataIndex: "hizbNumber",
      key: "hizbNumber",
      width: 90,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewAyah(record)}
          >
            View
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card loading={loading}>
      <Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/dashboards/quran/listing")}
        >
          Back to Quran List
        </Button>
      </Flex>
      <Divider />
      <Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
        <div>
          <Title level={3} style={{ marginBottom: 0 }}>
            {surahInfo?.nameComplex} ({surahInfo?.nameArabic}) 
            {/* {surahInfo?.nameArabic && (
              <Text type="primary" style={{ marginLeft: 8, fontSize: 22 }}>
                ({surahInfo?.nameArabic})
              </Text>
            )} */}
          </Title>
          {surahInfo && (
            <Space size={12} style={{ marginTop: 8 }}>
              <Tag color="blue">ID: {surahInfo.surahId}</Tag>
              <Tag color="green">Ayahs: {surahInfo.ayahCount}</Tag>
              <Tag color={surahInfo.revelationPlace === "makkah" ? "gold" : "cyan"}>
                {surahInfo.revelationPlace?.[0]?.toUpperCase() + surahInfo.revelationPlace?.slice(1)}
              </Tag>
              {surahInfo.pages && (
                <Tag>Pages: {surahInfo.pages[0]} - {surahInfo.pages[1]}</Tag>
              )}
              {typeof surahInfo.bismillahPre === "boolean" && (
                <Tag color={surahInfo.bismillahPre ? "purple" : "default"}>
                  Bismillah: {surahInfo.bismillahPre ? "Shown" : "Not shown"}
                </Tag>
              )}
            </Space>
          )}
        </div>
        <Space size="large">
          <Tooltip title="View Surah Info">
            <Button
              type="primary"
              icon={<InfoCircleOutlined />}
              onClick={() => setSurahModalVisible(true)}
            >
              Surah Info
            </Button>
          </Tooltip>
          <Input
            placeholder="Search ayahs"
            value={searchValue}
            onChange={onSearchChange}
            style={{ width: 250 }}
          />
        </Space>
      </Flex>

      <div className="table-responsive" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={filteredAyahs}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </div>

      {/* Surah Info Modal */}
      <Modal
        title="Surah Information"
        open={surahModalVisible}
        onCancel={() => setSurahModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setSurahModalVisible(false)}>
            Close
          </Button>,
          <Button key="publish" type="primary" onClick={() => message.success("Surah info published!")}>
            Publish
          </Button>,
          <Button key="save" onClick={() => message.success("Surah info saved!")}>
            Save Draft
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Language">
            <Select
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              options={languages}
            />
          </Form.Item>
          <Form.Item label="Surah Description">
            <textarea
              rows={6}
              placeholder="Enter surah description"
              defaultValue={surahInfo?.surahinfo || ""}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #d9d9d9",
                fontFamily: "monospace",
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ViewSurah;
