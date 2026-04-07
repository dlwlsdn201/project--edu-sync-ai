import { useQuery } from '@tanstack/react-query';
import { getMyConceptStats, getMyLogs } from '../api/logs';

export function useMyConceptStats(studentId: string) {
  return useQuery({
    queryKey: ['conceptStats', studentId],
    queryFn: () => getMyConceptStats(studentId),
    enabled: !!studentId,
  });
}

export function useMyLogs(studentId: string) {
  return useQuery({
    queryKey: ['myLogs', studentId],
    queryFn: () => getMyLogs(studentId),
    enabled: !!studentId,
  });
}
