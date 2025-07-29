<template>
  <div>
    <h2>지역별코스 리스트</h2>
    
    <!-- 지역 선택 -->
    <div style="margin-bottom: 20px;">
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <label for="sidoSelect">시도:</label>
        <select id="sidoSelect" v-model="selectedSido" @change="onSidoChange" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">전체</option>
          <option v-for="sido in sidoList" :key="sido.sidoCode" :value="sido.sidoCode">{{ sido.name }}</option>
        </select>
        
        <label for="sigunguSelect">시군구:</label>
        <select id="sigunguSelect" v-model="selectedSigungu" @change="searchByRegion" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="">전체</option>
          <option v-for="sigungu in sigunguList" :key="sigungu.sigunguCode" :value="sigungu.sigunguCode">{{ sigungu.name }}</option>
        </select>
        
        <button @click="searchByRegion" :disabled="loading" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          {{ loading ? '검색 중...' : '검색' }}
        </button>
      </div>
    </div>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <p>코스 데이터를 불러오는 중...</p>
    </div>
    
    <!-- 코스 목록 -->
    <ul v-if="regionCourses.length > 0" style="list-style: none; padding: 0;">
      <li v-for="course in regionCourses" :key="course.id" @click="selectCourse(course)" 
          style="cursor:pointer; padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; transition: all 0.2s;"
          :class="{ 'selected': selectedCourse && selectedCourse.id === course.id }">
        <strong>{{ course.name }}</strong> ({{ course.distance }}km)
        <span style="margin-left:8px; color:#888; font-size:13px;">난이도: {{ course.difficulty }}, 별점: {{ course.rating }}</span>
      </li>
    </ul>
    <div v-else-if="!loading" style="text-align: center; padding: 20px; color: #666;">
      해당 지역의 코스 데이터가 없습니다.
    </div>
    
    <!-- 상세 정보 영역 -->
    <div v-if="selectedCourse" style="margin-top:32px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; border-top: 2px solid #bbb; padding-top: 24px; max-width: 500px;">
      <div style="font-size: 2rem; font-weight: bold; margin-bottom: 18px;">코스 상세 정보</div>
      <div style="font-size: 1.2rem; margin-bottom: 10px;"><strong>코스명:</strong> {{ selectedCourse.name }}</div>
      <div style="font-size: 1.2rem; margin-bottom: 10px;"><strong>코스거리:</strong> {{ selectedCourse.distance }}km</div>
      <div style="font-size: 1.2rem; margin-bottom: 10px;"><strong>난이도:</strong> {{ selectedCourse.difficulty }}</div>
      <div style="font-size: 1.2rem; margin-bottom: 10px;"><strong>예상소요시간:</strong> {{ selectedCourse.reqTime }}</div>
      <div style="font-size: 1.2rem; margin-bottom: 10px;"><strong>별점:</strong> {{ selectedCourse.rating }} / 5.0</div>
      <div v-if="courseDetail && courseDetail.contents" style="font-size: 1.2rem; margin-bottom: 10px;"><strong>코스 설명:</strong> {{ courseDetail.contents }}</div>
      
      <!-- 지도 -->
      <div v-if="courseDetail && courseDetail.coords && courseDetail.coords.length > 0" style="margin-top: 24px; width: 100%;">
        <KakaoMap :pathPoints="courseDetail.coords" :courseId="selectedCourse.id" :attractions="attractionsWithEndPoint" />
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'

export default {
  name: 'CourseRegionTab',
  components: { KakaoMap },
  props: {
    coursesProp: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedCourse: null,
      courseDetail: null,
      attractions: [],
      loading: false,
      selectedSido: '',
      selectedSigungu: '',
      regionCourses: [],
      sidoList: [],
      sigunguList: []
    }
  },
  computed: {
    attractionsWithEndPoint() {
      if (!this.courseDetail || !this.courseDetail.coords || this.courseDetail.coords.length === 0) return this.attractions;
      const endCoord = this.courseDetail.coords[this.courseDetail.coords.length - 1];
      return [
        ...this.attractions,
        {
          attractionId: 'END',
          title: '도착점',
          latitude: endCoord.latitude,
          longitude: endCoord.longitude,
          isEndPoint: true
        }
      ];
    }
  },
  watch: {
    selectedCourse(newCourse) {
      if (newCourse && newCourse.id) {
        this.fetchCourseDetail(newCourse.id);
      } else {
        this.courseDetail = null;
        this.attractions = [];
      }
    }
  },
  async mounted() {
    // 컴포넌트 로드 시 시도 목록 조회
    await this.loadSidos();
  },
  methods: {
    selectCourse(course) {
      this.selectedCourse = course;
    },
    
    // 데이터 정규화 함수
    normalizeCourseData(rawData) {
      if (!rawData || !Array.isArray(rawData)) return [];
      
      return rawData.map(item => ({
        id: item.courseId || item.courseIdx || item.id,
        name: item.courseName || item.gilName || item.name,
        summary: item.gilName || item.summary || '',
        distance: item.distance || 0,
        difficulty: item.level || item.difficulty || '보통',
        reqTime: item.reqTime || '정보없음',
        rating: item.rating || 0,
        visited: item.visited || false,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        sidoCode: item.sidoCode || 1,
        sigunguCode: item.sigunguCode || 1,
        contentTypeId: item.contentTypeId || 21
      }));
    },
    
    // 시도 목록 로드
    async loadSidos() {
      try {
        const response = await courseApi.getSidos();
        console.log('시도 API 응답:', response);
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.sidoList = response.data.items;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.sidoList = response.data;
        }
        console.log('로드된 시도 목록:', this.sidoList);
        // API 응답이 없으면 기본 시도 목록 유지
      } catch (error) {
        console.error('시도 목록 조회 실패:', error);
        // 에러 발생 시 기본 시도 목록 유지
      }
    },
    async onSidoChange() {
      this.selectedSigungu = '';
      this.sigunguList = [];
      this.regionCourses = [];
      
      // 시도가 선택된 경우에만 시군구 목록 조회
      if (this.selectedSido) {
        try {
          const response = await courseApi.getSigungus(this.selectedSido);
          console.log('시군구 API 응답:', response);
          if (response && response.status === 'success' && response.data && response.data.items) {
            this.sigunguList = response.data.items;
          } else if (response && response.data && Array.isArray(response.data)) {
            this.sigunguList = response.data;
          } else {
            console.warn('시군구 API 응답이 예상과 다릅니다:', response);
            this.sigunguList = [];
          }
          console.log('로드된 시군구 목록:', this.sigunguList);
        } catch (error) {
          console.error('시군구 목록 조회 실패:', error);
          this.sigunguList = [];
        }
      }
    },
    async searchByRegion() {
      console.log('searchByRegion 호출됨');
      console.log('selectedSido:', this.selectedSido);
      console.log('selectedSigungu:', this.selectedSigungu);
      
      if (!this.selectedSido) {
        console.log('시도가 선택되지 않음');
        this.regionCourses = [];
        return;
      }
      
      this.loading = true;
      try {
        const response = await courseApi.searchByRegion(
          this.selectedSido, 
          this.selectedSigungu || null, 
          null, 
          0, 
          100
        );
        
        console.log('지역별 코스 API 응답:', response);
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.regionCourses = this.normalizeCourseData(response.data.items);
          console.log('로드된 지역 코스:', this.regionCourses);
        } else if (response && response.data && Array.isArray(response.data)) {
          this.regionCourses = this.normalizeCourseData(response.data);
          console.log('로드된 지역 코스 (배열):', this.regionCourses);
        } else {
          console.warn('지역별 코스 API 응답이 예상과 다릅니다:', response);
          this.regionCourses = [];
        }
      } catch (error) {
        console.error('지역별 코스 검색 실패:', error);
        this.regionCourses = [];
      } finally {
        this.loading = false;
      }
    },
    async fetchCourseDetail(courseId) {
      this.loading = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        console.log('코스 상세 API 응답:', response);
        if (response && response.status === 'success' && response.data) {
          this.courseDetail = response.data;
        } else if (response && response.data) {
          // 백엔드 응답 구조가 다른 경우
          this.courseDetail = response.data;
        } else {
          this.courseDetail = null;
        }
        console.log('로드된 코스 상세:', this.courseDetail);
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error);
        this.courseDetail = null;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
li:hover {
  background-color: #f8f9fa;
  border-color: #007bff !important;
}

li.selected {
  background-color: #e3f2fd;
  border-color: #007bff !important;
}

button:disabled {
  background: #6c757d !important;
  cursor: not-allowed;
}

select {
  min-width: 120px;
}
</style> 