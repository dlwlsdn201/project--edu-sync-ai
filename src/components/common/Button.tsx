import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

/**
 * 공통 버튼 — 고정 폭(w-60) 기본, className으로 `!w-auto` 등 오버라이드 가능
 */
interface ButtonProps extends PressableProps {
  label: string;
  /** primary: 채움 / outline: primary 테두리 / outlineNeutral: 회색 테두리(보조·로그아웃 등) */
  variant?: "primary" | "outline" | "outlineNeutral";
  isLoading?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isNeutralOutline = variant === "outlineNeutral";

  const variantClasses = isPrimary
    ? "bg-primary"
    : isNeutralOutline
      ? "border border-gray-300 bg-white"
      : "border border-primary bg-transparent";

  const textClasses = isPrimary
    ? "text-white"
    : isNeutralOutline
      ? "text-gray-700"
      : "text-primary";

  const spinnerColor = isPrimary ? "#fff" : isNeutralOutline ? "#6B7280" : "#3B82F6";

  return (
    <Pressable
      className={[
        "flex-row items-center justify-center rounded-xl px-6 py-3 w-60",
        variantClasses,
        disabled || isLoading ? "opacity-50" : "",
        className ?? "",
      ].join(" ")}
      disabled={disabled || isLoading}
      accessibilityRole='button'
      accessibilityLabel={label}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className={["text-base font-semibold", textClasses].join(" ")}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
