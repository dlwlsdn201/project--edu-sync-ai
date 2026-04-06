import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from 'react-native';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'outline';
  isLoading?: boolean;
  className?: string;
}

export function Button({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      className={[
        'flex-row items-center justify-center rounded-xl px-6 py-3',
        isPrimary ? 'bg-primary' : 'border border-primary bg-transparent',
        disabled || isLoading ? 'opacity-50' : '',
      ].join(' ')}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : '#3B82F6'} />
      ) : (
        <Text
          className={[
            'text-base font-semibold',
            isPrimary ? 'text-white' : 'text-primary',
          ].join(' ')}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
