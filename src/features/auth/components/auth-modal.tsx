"use client";

import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, Modal, Tabs } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  AuthApiError,
  login,
  register,
  type AuthCredentials,
  type CurrentUser,
  type RegistrationInput,
} from "@/features/auth";

import styles from "./auth-modal.module.css";

type AuthMode = "login" | "register";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: (user: CurrentUser) => void;
};

export function AuthModal({
  open,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const locale = useLocale();
  const t = useTranslations("Auth");
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>("login");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loginForm] = Form.useForm<AuthCredentials>();
  const [registerForm] = Form.useForm<
    Omit<RegistrationInput, "locale"> & { confirmPassword: string }
  >();

  const finishAuthentication = (user: CurrentUser) => {
    queryClient.setQueryData(["current-user"], user);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== "current-user",
    });
    onAuthenticated?.(user);
    closeModal();
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: finishAuthentication,
    onError: handleError,
  });
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: finishAuthentication,
    onError: handleError,
  });
  const isPending = loginMutation.isPending || registerMutation.isPending;

  function handleError(error: unknown) {
    setErrorCode(
      error instanceof AuthApiError ? error.code : "AUTH_REQUEST_FAILED",
    );
  }

  function closeModal() {
    setMode("login");
    setErrorCode(null);
    loginForm.resetFields();
    registerForm.resetFields();
    onClose();
  }

  function changeMode(key: string) {
    setMode(key as AuthMode);
    setErrorCode(null);
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
    <Modal
      open={open}
      onCancel={closeModal}
      footer={null}
      width={460}
      centered
      destroyOnHidden
      title={t(mode === "login" ? "loginTitle" : "registerTitle")}
      className={styles.modal}
    >
      <p className={styles.subtitle}>
        {t(mode === "login" ? "loginSubtitle" : "registerSubtitle")}
      </p>
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
          form={loginForm}
          layout="vertical"
          requiredMark={false}
          disabled={isPending}
          onFinish={(values) => {
            setErrorCode(null);
            loginMutation.mutate(values);
          }}
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
          form={registerForm}
          layout="vertical"
          requiredMark={false}
          disabled={isPending}
          onFinish={submitRegistration}
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
    </Modal>
  );
}

function getErrorMessage(
  code: string,
  t: ReturnType<typeof useTranslations<"Auth">>,
) {
  const keys: Record<
    string,
    | "errors.userExists"
    | "errors.credentials"
    | "errors.unavailable"
    | "errors.generic"
  > = {
    AUTH_USER_EXISTS: "errors.userExists",
    AUTH_INVALID_CREDENTIALS: "errors.credentials",
    AUTH_SERVICE_UNAVAILABLE: "errors.unavailable",
    AUTH_REQUEST_FAILED: "errors.generic",
  };
  return t(keys[code] ?? "errors.generic");
}
