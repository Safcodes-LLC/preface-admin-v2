import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Tag,
  Space,
  message,
  Button,
  Select,
  Form,
  Divider,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import QuranService from "services/quranService";
import Flex from "components/shared-components/Flex";

// eslint-disable-next-line no-unused-vars
const { Title, Text } = Typography;

const ViewAyah = () => {
  const { surahId, ayahNumber } = useParams();
  const navigate = useNavigate();
  const [ayahData, setAyahData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [ayahInfo, setAyahInfo] = useState("");
  const [translationText, setTranslationText] = useState("");
  const [tafsirText, setTafsirText] = useState("");
  const [translations, setTranslations] = useState([]);
  const [tafsirs, setTafsirs] = useState([]);

  useEffect(() => {
    const fetchAyah = async () => {
      setLoading(true);
      try {
        const res = await QuranService.getAyahById(surahId, ayahNumber);
        const data = res.data;
        setAyahData(data);
        setAyahInfo(data.ayahInfo || "");
        setTranslations(data.translations || []);
        setTafsirs(data.tafsirs || []);
      } catch (err) {
        message.error("Failed to load Ayah details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAyah();
  }, [surahId, ayahNumber]);

  // Update translation and tafsir when language changes
  useEffect(() => {
    const currentTranslation = translations.find(t => t.languageCode === selectedLanguage);
    const currentTafsir = tafsirs.find(t => t.languageCode === selectedLanguage);
    
    setTranslationText(currentTranslation?.ayahText || "");
    setTafsirText(currentTafsir?.ayahText || "");
  }, [selectedLanguage, translations, tafsirs]);

  const languages = [
    { label: "English", value: "en" },
    { label: "Arabic", value: "ar" },
    { label: "Malayalam", value: "ml" },
  ];

  // eslint-disable-next-line no-unused-vars
  const currentTranslation = translations.find(t => t.languageCode === selectedLanguage);
  // eslint-disable-next-line no-unused-vars
  const currentTafsir = tafsirs.find(t => t.languageCode === selectedLanguage);

  const handleSave = () => {
    message.success("Ayah data saved as draft!");
  };

  const handlePublish = () => {
    message.success("Ayah data published!");
  };

  const handlePreviousAyah = () => {
    const prevAyahNumber = parseInt(ayahNumber) - 1;
    if (prevAyahNumber >= 1) {
      navigate(`/admin/dashboards/quran/view-surah/${surahId}/ayah/${prevAyahNumber}`);
    } else {
      message.warning("This is the first ayah of the surah");
    }
  };

  const handleNextAyah = () => {
    const nextAyahNumber = parseInt(ayahNumber) + 1;
    const totalAyahs = ayahData?.surah?.ayahCount || 0;
    if (nextAyahNumber <= totalAyahs) {
      navigate(`/admin/dashboards/quran/view-surah/${surahId}/ayah/${nextAyahNumber}`);
    } else {
      message.warning("This is the last ayah of the surah");
    }
  };

  if (loading) return <Card loading={true} />;

  return (
    <Card>
      <Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/admin/dashboards/quran/view-surah/${surahId}`)}
        >
          Back to Surah
        </Button>
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePreviousAyah}
            disabled={parseInt(ayahNumber) === 1}
          >
            Previous Ayah
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={handleNextAyah}
            disabled={parseInt(ayahNumber) >= (ayahData?.surah?.ayahCount || 0)}
          >
            Next Ayah
          </Button>
        </Space>
      </Flex>
      <Divider />

      {ayahData && (
        <>
          <Flex alignItems="center" justifyContent="space-between" mobileFlex={false}>
            <div>
              <Title level={3} style={{ marginBottom: 8 }}>
                {ayahData.surah?.nameComplex} ({ayahData.surah?.nameArabic}) - Ayah {ayahNumber}
              </Title>
              <Space>
                <Tag color="blue">Surah: {ayahData.surahId}</Tag>
                <Tag color="green">Ayah: {ayahData.ayahNumber}</Tag>
                <Tag>Page: {ayahData.pageNumber}</Tag>
                <Tag>Juz: {ayahData.juzNumber}</Tag>
                <Tag>Hizb: {ayahData.hizbNumber}</Tag>
              </Space>
            </div>
            <Space>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handlePublish}
              >
                Publish
              </Button>
            </Space>
          </Flex>

          <Divider />

          {/* Arabic Text Display */}
          <Form layout="vertical">
            <Form.Item label="Arabic Text (Uthmani)">
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  fontSize: "24px",
                  textAlign: "right",
                  minHeight: "60px",
                }}
              >
                {ayahData.textUthmani}
              </div>
            </Form.Item>

            <Form.Item label="Arabic Text (Imlaei)">
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  fontSize: "18px",
                  textAlign: "right",
                  minHeight: "50px",
                }}
              >
                {ayahData.textImlaei}
              </div>
            </Form.Item>
          </Form>

          <Divider />

          {/* Language Selection */}
          <Form layout="vertical">
            <Form.Item label="Language">
              <Select
                value={selectedLanguage}
                onChange={setSelectedLanguage}
                options={languages}
                style={{ width: "200px" }}
              />
            </Form.Item>
          </Form>

          {/* Ayah Info */}
          <Form layout="vertical">
            <Form.Item label="Ayah Information">
              <textarea
                value={ayahInfo}
                onChange={(e) => setAyahInfo(e.target.value)}
                rows={6}
                placeholder="Enter ayah information"
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

          <Divider />

          {/* Translation */}
          <Form layout="vertical">
            <Form.Item label={`Translation (${selectedLanguage.toUpperCase()})`} required>
              <textarea
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                rows={6}
                placeholder={`Enter translation for ${selectedLanguage}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d9d9d9",
                }}
              />
            </Form.Item>
          </Form>

          <Divider />

          {/* Tafsir */}
          <Form layout="vertical">
            <Form.Item label={`Tafsir (${selectedLanguage.toUpperCase()})`} required>
              <textarea
                value={tafsirText}
                onChange={(e) => setTafsirText(e.target.value)}
                rows={6}
                placeholder={`Enter tafsir for ${selectedLanguage}`}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d9d9d9",
                }}
              />
            </Form.Item>
          </Form>

          <Divider />

          <Flex alignItems="center" justifyContent="flex-end" mobileFlex={false}>
            <Space>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handlePublish}
              >
                Publish
              </Button>
            </Space>
          </Flex>
        </>
      )}
    </Card>
  );
};

export default ViewAyah;
