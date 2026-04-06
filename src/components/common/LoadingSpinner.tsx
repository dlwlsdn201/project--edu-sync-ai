import React from 'react';
import { ActivityIndicator, View } from 'react-native';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  color?: string;
}

export function LoadingSpinner({
  fullScreen = false,
  color = '#3B82F6',
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return <ActivityIndicator size="small" color={color} />;
}
