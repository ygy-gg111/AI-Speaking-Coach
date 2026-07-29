"use client";

import { Button, Card, List, Space, Typography } from "antd";

import { Link } from "@/i18n/navigation";

const documents = [
  "01-Project-Overview.md",
  "02-System-Architecture.md",
  "03-Product-Architecture.md",
  "04-AI-Architecture.md",
  "05-Database-Design.md",
  "06-Backend-Architecture.md",
  "07-Frontend-Architecture.md",
  "08-Deployment.md",
  "09-Development-Guide.md",
  "10-RoadMap.md",
];

export default function DocsPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Link href="/">
          <Button>← Back / 返回</Button>
        </Link>
        <Typography.Title>Technical Documents / 技术文档</Typography.Title>
        <Card>
          <List
            dataSource={documents}
            renderItem={(name) => (
              <List.Item>
                <Typography.Text code>{`doc/${name}`}</Typography.Text>
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </main>
  );
}
