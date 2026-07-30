"use client";

import {
  LockOutlined,
  MailOutlined,
  SoundFilled,
  UserOutlined,
} from "@ant-design/icons";
import { Alert, Button, Form, Input, Tabs } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  AuthApiError,
  login,
  register,
  type AuthCredentials,
  type RegistrationInput,
} from "@/features/auth";
import { Link, useRouter } from "@/i18n/navigation";

import styles from "./login.module.css";

type AuthMode = "login" | "register";

export default function LoginPage() {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>("login");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(["current-user"], user);
      router.push("/settings");
    },
    onError: (error) => {
      setErrorCode(
        error instanceof AuthApiError ? error.code : "AUTH_REQUEST_FAILED",
      );
    },
  });
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      queryClient.setQueryData(["current-user"], user);
      router.push("/settings");
    },
    onError: (error) => {
      setErrorCode(
        error instanceof AuthApiError ? error.code : "AUTH_REQUEST_FAILED",
      );
    },
  });
  const isPending = loginMutation.isPending || registerMutation.isPending;

  function changeMode(key: string) {
    setMode(key as AuthMode);
    setErrorCode(null);
  }

  function submitLogin(values: AuthCredentials) {
    setErrorCode(null);
    loginMutation.mutate(values);
  }

  function submitRegistration(
    values: Omit<RegistrationInput, "locale"> & { confirmPassword: string },
  ) {
    setErrorCode(null);
    registerMutation.mutate({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
      locale,
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <Link href="/" className={styles.logo}>
          <span>
            <SoundFilled />
          </span>
          <strong>AI Speaking Coach</strong>
        </Link>
        <div className={styles.brandCopy}>
          <span>{t("eyebrow")}</span>
          <h1>{t("brandTitle")}</h1>
          <p>{t("brandSubtitle")}</p>
          <ul>
            <li>{t("benefitRealtime")}</li>
            <li>{t("benefitFeedback")}</li>
            <li>{t("benefitProgress")}</li>
          </ul>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <Link href="/" className={styles.logo}>
            <span>
              <SoundFilled />
            </span>
            <strong>AI Speaking Coach</strong>
          </Link>
        </div>
        <div className={styles.formCard}>
          <header>
            <span>{t("welcome")}</span>
            <h2>{t(mode === "login" ? "loginTitle" : "registerTitle")}</h2>
            <p>{t(mode === "login" ? "loginSubtitle" : "registerSubtitle")}</p>
          </header>

          <Tabs
            activeKey={mode}
            onChange={changeMode}
            items={[
              { key: "login", label: t("loginTab") },
              { key: "register", label: t("registerTab") },
            ]}
          />

          {errorCode && (
            <Alert
              className={styles.alert}
              type="error"
              showIcon
              message={getErrorMessage(errorCode, t)}
            />
          )}

          {mode === "login" ? (
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={submitLogin}
              disabled={isPending}
            >
              <Form.Item
                name="email"
                label={t("email")}
                rules={[
                  { required: true, message: t("validation.emailRequired") },
                  { type: "email", message: t("validation.emailInvalid") },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label={t("password")}
                rules={[
                  { required: true, message: t("validation.passwordRequired") },
                  { min: 8, message: t("validation.passwordLength") },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loginMutation.isPending}
              >
                {t("loginAction")}
              </Button>
            </Form>
          ) : (
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={submitRegistration}
              disabled={isPending}
            >
              <Form.Item
                name="displayName"
                label={t("displayName")}
                rules={[
                  { required: true, message: t("validation.nameRequired") },
                  { max: 40, message: t("validation.nameLength") },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder={t("namePlaceholder")}
                  autoComplete="name"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={t("email")}
                rules={[
                  { required: true, message: t("validation.emailRequired") },
                  { type: "email", message: t("validation.emailInvalid") },
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label={t("password")}
                rules={[
                  { required: true, message: t("validation.passwordRequired") },
                  { min: 8, message: t("validation.passwordLength") },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={t("confirmPassword")}
                dependencies={["password"]}
                rules={[
                  { required: true, message: t("validation.confirmRequired") },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return !value || getFieldValue("password") === value
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(t("validation.passwordMismatch")),
                          );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder={t("confirmPlaceholder")}
                  autoComplete="new-password"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={registerMutation.isPending}
              >
                {t("registerAction")}
              </Button>
            </Form>
          )}

          <p className={styles.terms}>{t("terms")}</p>
          <Link href="/" className={styles.guestLink}>
            {t("continueAsGuest")}
          </Link>
        </div>
      </section>
    </main>
  );
}

function getErrorMessage(
  code: string,
  t: ReturnType<typeof useTranslations<"Auth">>,
) {
  const keys: Record<string, "errors.userExists" | "errors.credentials" | "errors.unavailable" | "errors.generic"> = {
    AUTH_USER_EXISTS: "errors.userExists",
    AUTH_INVALID_CREDENTIALS: "errors.credentials",
    AUTH_SERVICE_UNAVAILABLE: "errors.unavailable",
    AUTH_REQUEST_FAILED: "errors.generic",
  };
  return t(keys[code] ?? "errors.generic");
}
