/**
 * 파일 업로드 API (프로필 이미지, 운동 사진 등)
 * - FormData multipart 업로드
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';

/** 로컬 파일 URI 여부 */
export function isLocalFileUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || !uri.startsWith('http');
}

/**
 * 파일 업로드 헬퍼 함수 - 백엔드 API v1 스펙
 */
async function uploadFile(endpoint: string, localUri: string): Promise<string> {
  const baseUrl = config.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL not configured');

  const token = await AsyncStorage.getItem(config.AUTH_TOKEN_KEY);

  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'image.jpg';
  const match = /\.(jpg|jpeg|png|gif|webp)$/i.exec(filename);
  const mimeType = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

  formData.append('file', {
    uri: localUri,
    name: filename,
    type: mimeType,
  } as any);

  const res = await fetch(`${baseUrl}/files/upload/${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      /* Content-Type 생략 - FormData가 boundary 자동 설정 */
    },
    body: formData,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json().catch(() => ({}));
      message = (data as { message?: string }).message ?? (data as { error?: string }).error ?? message;
    } catch {}
    throw new Error(message || `HTTP ${res.status}`);
  }

  const response = await res.json();

  // 백엔드 응답 형식 처리
  if (response.success && response.data) {
    return response.data.fileUrl || response.data.url || '';
  }

  const url = response.fileUrl || response.url || response.data?.url;
  if (!url) throw new Error('업로드 응답에 URL이 없습니다.');
  return url;
}

/**
 * 프로필 이미지 업로드 - 백엔드 API v1 스펙
 */
export async function uploadProfileImage(localUri: string): Promise<string> {
  return uploadFile('profile', localUri);
}

/**
 * 피드 이미지 업로드 (다중 이미지) - 백엔드 API v1 스펙
 */
export async function uploadFeedImages(localUris: string[]): Promise<string[]> {
  const baseUrl = config.API_BASE_URL;
  if (!baseUrl) throw new Error('API_BASE_URL not configured');

  const token = await AsyncStorage.getItem(config.AUTH_TOKEN_KEY);

  const formData = new FormData();

  localUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() || `feed-${index}.jpg`;
    const match = /\.(jpg|jpeg|png|gif|webp)$/i.exec(filename);
    const mimeType = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('files', {
      uri,
      name: filename,
      type: mimeType,
    } as any);
  });

  const res = await fetch(`${baseUrl}/files/upload/feed`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`이미지 업로드 실패: ${res.statusText}`);
  }

  const response = await res.json();

  if (response.success && response.data) {
    return response.data.fileUrls || [];
  }

  return response.fileUrls || response.urls || [];
}

/**
 * 운동 이미지 업로드 - 백엔드 API v1 스펙
 */
export async function uploadWorkoutImage(localUri: string): Promise<string> {
  return uploadFile('workout', localUri);
}

/**
 * 그룹 이미지 업로드 - 백엔드 API v1 스펙
 */
export async function uploadGroupImage(localUri: string): Promise<string> {
  return uploadFile('group', localUri);
}
