import axios from 'axios';

// 환경변수로 API URL 관리 (개발/운영 환경 분리)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://3cdb06b2fdfd.ngrok-free.app/api';
const ngrokHeaders = { 'ngrok-skip-browser-warning': true };

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: ngrokHeaders,
  timeout: 10000,
  // 요청 중복 방지를 위한 설정
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  }
});

// 요청 중복 방지를 위한 캐시
const requestCache = new Map();
const pendingRequests = new Map();

// 새로고침 시 요청 정리를 위한 플래그
let isRefreshing = false;

// 요청 인터셉터 추가
apiClient.interceptors.request.use(
  config => {
    // 새로고침 중이면 요청 취소
    if (isRefreshing) {
      console.log('새로고침 중 - 요청 취소');
      return Promise.reject(new Error('새로고침 중 요청 취소'));
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 추가
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API 요청 실패:', error);
    return Promise.reject(error);
  }
);

// 새로고침 감지 및 요청 정리
const handleBeforeUnload = () => {
  isRefreshing = true;
  // 모든 진행 중인 요청 취소
  pendingRequests.clear();
  requestCache.clear();
  console.log('새로고침 감지 - 모든 요청 정리');
};

// 페이지 언로드 이벤트 리스너 등록
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
}

const courseApi = {
  // 요청 정리 함수
  clearAllRequests: () => {
    isRefreshing = true;
    pendingRequests.clear();
    requestCache.clear();
    console.log('모든 요청 정리 완료');
  },

  // 전체 코스 목록 조회
  getAllCourses: async (page = 0, size = 500) => {
    try {
      const response = await apiClient.get('/courses', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('전체 코스 조회 실패:', error);
      throw error;
    }
  },

  // 지역별 코스 검색
  searchByRegion: async (sidoCode, sigunguCode, email = null, page = 0, size = 10) => {
    try {
      const params = {
        sidoCode,
        sigunguCode,
        page,
        size
      };
      
      if (email) {
        params.email = email;
      }

      const response = await apiClient.get('/courses/region', { params });
      return response.data;
    } catch (error) {
      console.error('지역별 코스 검색 실패:', error);
      throw error;
    }
  },

  // 코스 상세 정보 조회
  getCourseDetail: async (courseId) => {
    try {
      const response = await apiClient.get('/courses/detail', { 
        params: { courseId } 
      });
      return response.data;
    } catch (error) {
      console.error('코스 상세 정보 조회 실패:', error);
      throw error;
    }
  },

  // 주변 명소 조회
  getNearbyAttractions: async (sidoCode, sigunguCode, contentTypeId = 21) => {
    const cacheKey = `attractions_${sidoCode}_${sigunguCode}_${contentTypeId}`;
    
    // 캐시된 응답이 있으면 반환
    if (requestCache.has(cacheKey)) {
      console.log('캐시된 데이터 사용:', cacheKey);
      return requestCache.get(cacheKey);
    }
    
    // 진행 중인 요청이 있으면 기다림
    if (pendingRequests.has(cacheKey)) {
      console.log('진행 중인 요청 대기:', cacheKey);
      return pendingRequests.get(cacheKey);
    }
    
    // 새로운 요청 생성
    const requestPromise = (async () => {
      try {
        const response = await apiClient.get('/attractions/region', {
          params: { sidoCode, sigunguCode, contentTypeId }
        });
        
        // 성공 시 캐시에 저장 (5분간 유효)
        requestCache.set(cacheKey, response.data);
        setTimeout(() => requestCache.delete(cacheKey), 5 * 60 * 1000);
        
        return response.data;
      } catch (error) {
        console.error('주변 명소 조회 실패:', error);
        throw error;
      } finally {
        // 요청 완료 후 pending에서 제거
        pendingRequests.delete(cacheKey);
      }
    })();
    
    // 진행 중인 요청으로 등록
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  },

  // 시도 코드 조회
  getSidos: async () => {
    try {
      const response = await apiClient.get('/regions/sido');
      return response.data;
    } catch (error) {
      console.error('시도 코드 조회 실패:', error);
      throw error;
    }
  },

  // 시군구 코드 조회
  getSigungus: async (sidoCode) => {
    try {
      const response = await apiClient.get('/regions/sigungu', {
        params: { sidoCode }
      });
      return response.data;
    } catch (error) {
      console.error('시군구 코드 조회 실패:', error);
      throw error;
    }
  },

  // 컨텐츠 타입 조회
  getContentTypes: async () => {
    try {
      const response = await apiClient.get('/attractions/contenttypes');
      return response.data;
    } catch (error) {
      console.error('컨텐츠 타입 조회 실패:', error);
      throw error;
    }
  },

  // 명소 상세 정보 조회
  getAttractionDetail: async (attractionId) => {
    try {
      const response = await apiClient.get('/attractions/detail', {
        params: { attrationId }
      });
      return response.data;
    } catch (error) {
      console.error('명소 상세 정보 조회 실패:', error);
      throw error;
    }
  }
};

export default courseApi; 