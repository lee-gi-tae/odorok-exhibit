<template>
  <div>
    <h2>추천코스 리스트</h2>
    
    <!-- 로딩 상태 -->
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <p>코스 상세 정보를 불러오는 중...</p>
    </div>
    
    <!-- 코스 목록 -->
    <ul v-if="pagedCourses.length > 0" style="list-style: none; padding: 0;">
      <li v-for="course in pagedCourses" :key="course.id" @click="selectCourse(course)" 
          style="cursor:pointer; padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; transition: all 0.2s;"
          :class="{ 'selected': selectedCourse && selectedCourse.id === course.id }">
        <strong>{{ course.name }}</strong> ({{ course.distance }}km)
        <span style="margin-left:8px; color:#888; font-size:13px;">난이도: {{ course.difficulty }}, 별점: {{ course.rating }}</span>
      </li>
    </ul>

      <!-- 페이지네이션 - 리스트트 밖으로 이동! -->
      <div v-if="totalPages > 1" style="margin-top: 20px; text-align: center;">
        <button @click="prevPage" :disabled="currentPage === 1" style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">이전</button>
        <span style="margin: 0 10px;">{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages" style="margin-left: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">다음</button>
      </div>
    <div v-else style="text-align: center; padding: 20px; color: #666;">
      코스 데이터가 없습니다.
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
      
      <!-- 주변 명소 버튼 -->
      <div v-if="$parent.selected === 'all'" style="display: flex; gap: 16px; margin: 24px 0 0 0; width: 100%; justify-content: flex-start;">
        <button @click="fetchAttractions" 
                :disabled="loadingAttractions"
                style="padding:8px 18px; background:#447cff; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; font-size:1.1rem;">
          {{ loadingAttractions ? '명소 불러오는 중...' : '주변 명소 보기 (2km 이내)' }}
        </button>
      </div>
      
      <!-- 명소 목록 -->
      <div v-if="attractions.length > 0" style="width: 100%;">
        <h3>주변 명소 ({{ attractions.length }}개)</h3>
        <ul style="list-style: none; padding: 0; max-height: 200px; overflow-y: auto;">
          <li v-for="attraction in attractions" :key="attraction.attractionId" 
              style="padding: 8px; margin-bottom: 4px; border: 1px solid #eee; border-radius: 4px;">
            <strong>{{ attraction.title }}</strong>
            <div style="font-size: 12px; color: #666;">{{ attraction.addr1 }}</div>
            <div v-if="attraction.tel" style="font-size: 12px; color: #007bff;">📞 {{ attraction.tel }}</div>
          </li>
        </ul>
      </div>
      
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
  name: 'CourseMainTab',
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
      currentPage: 1,
      pageSize: 5,
      loading: false,
      loadingAttractions: false
    }
  },
  computed: {
    sortedByDistance() {
      let sorted = [...this.coursesProp];
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    },
    pagedCourses() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.sortedByDistance.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.ceil(this.sortedByDistance.length / this.pageSize)
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
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
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
    },
    async fetchAttractions() {
      if (!this.selectedCourse) return;
      
      this.loadingAttractions = true;
      try {
        const params = {
          sidoCode: this.selectedCourse.sidoCode || 1,
          sigunguCode: this.selectedCourse.sigunguCode || 1,
          contentTypeId: this.selectedCourse.contentTypeId || 21
        };
        
        const response = await courseApi.getNearbyAttractions(
          params.sidoCode, 
          params.sigunguCode, 
          params.contentTypeId
        );
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          this.attractions = response.data.items;
        } else if (response && response.data && Array.isArray(response.data)) {
          this.attractions = response.data;
        } else {
          this.attractions = [];
        }
      } catch (error) {
        console.error('주변 명소 조회 실패:', error);
        this.attractions = [];
      } finally {
        this.loadingAttractions = false;
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