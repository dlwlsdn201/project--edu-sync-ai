import React from 'react';
import { View } from 'react-native';

export interface ScreenContentProps {
  children: React.ReactNode;
  /** 바깥 영역 배경 (기본: bg-gray-50) */
  outerClassName?: string;
  /** 안쪽 컬럼에 추가 className (예: justify-center, pb-8) */
  innerClassName?: string;
}

/**
 * 탭·스택 화면 공통 레이아웃 — max-width와 좌우 패딩으로 웹·태블릿에서 콘텐츠를 가운데로 모읍니다.
 */
export function ScreenContent({ children, outerClassName, innerClassName }: ScreenContentProps) {
  return (
    <View className={['flex-1 bg-gray-50', outerClassName ?? ''].filter(Boolean).join(' ')}>
      <View
        className={['flex-1 w-full max-w-2xl self-center px-5', innerClassName ?? '']
          .filter(Boolean)
          .join(' ')}>
        {children}
      </View>
    </View>
  );
}
