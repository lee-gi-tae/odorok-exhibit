<template>
  <div>
    <h2>맞춤코스 리스트</h2>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <p>코스 상세 정보를 불러오는 중...</p>
    </div>
    
    <!-- 코스 목록 -->
    <ul v-if="sortedCourses.length > 0" style="list-style: none; padding: 0;">
      <li v-for="course in sortedCourses" :key="course.id" @click="selectCourse(course)" 
          style="cursor:pointer; padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; transition: all 0.2s;"
          :class="{ 'selected': selectedCourse && selectedCourse.id === course.id }">
        <strong>{{ course.name }}</strong> ({{ course.distance }}km)
        <span style="margin-left:8px; color:#888; font-size:13px;">난이도: {{ course.difficulty }}, 별점: {{ course.rating }}</span>
      </li>
    </ul>
    <div v-else style="text-align: center; padding: 20px; color: #666;">
      맞춤 코스 데이터가 없습니다.
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
  name: 'CourseCustomTab',
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
      loading: false
    }
  },
  computed: {
    // 맞춤 코스는 거리순으로 정렬
    sortedCourses() {
      return [...this.coursesProp].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    },
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
  methods: {
    selectCourse(course) {
      this.selectedCourse = course;
    },
    async fetchCourseDetail(courseId) {
      this.loading = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        if (response && response.status === 'success' && response.data) {
          this.courseDetail = response.data;
        } else if (response && response.data) {
          // 백엔드 응답 구조가 다른 경우
          this.courseDetail = response.data;
        } else {
          this.courseDetail = null;
        }
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
</style> 