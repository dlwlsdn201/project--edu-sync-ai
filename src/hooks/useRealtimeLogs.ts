import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';

/**
 * classroom의 student_logs INSERT 이벤트를 실시간 구독합니다.
 * 새 로그 발생 시 classroomStats 쿼리를 자동으로 갱신합니다.
 */
export function useRealtimeLogs(classroomId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!classroomId) return;

    const channel = supabase
      .channel(`classroom-logs-${classroomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'student_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['classroomStats', classroomId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, queryClient]);
}
