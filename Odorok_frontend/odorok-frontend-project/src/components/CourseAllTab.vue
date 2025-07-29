<template>
  <div>
    <h2>전체코스 리스트</h2>
    
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
    <div v-else style="text-align: center; padding: 20px; color: #666;">
      코스 데이터가 없습니다.
    </div>
    
    <!-- 페이지네이션 - 리스트 아래에만 표시 -->
    <div v-if="totalPages > 1" style="margin-top: 20px; text-align: center;">
      <button @click="prevPage" :disabled="currentPage === 1" style="margin-right: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">이전</button>
      <span style="margin: 0 10px;">{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" style="margin-left: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">다음</button>
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
      <div style="margin-top: 20px;">
        <button 
          @click="goToNearbyAttractions" 
          style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: all 0.2s;">
          🗺️ 주변명소보기
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import KakaoMap from './KakaoMap.vue'
import courseApi from '../api/courseApi.js'

export default {
  name: 'CourseAllTab',
  components: { KakaoMap },
  props: {
    coursesProp: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    
    const selectedCourse = ref(null)
    const courseDetail = ref(null)
    const attractions = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const loading = ref(false)
    const loadingAttractions = ref(false)

    const pagedCourses = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return props.coursesProp.slice(start, start + pageSize.value);
    })

    const totalPages = computed(() => {
      return Math.ceil(props.coursesProp.length / pageSize.value);
    })

    const attractionsWithEndPoint = computed(() => {
      if (!courseDetail.value || !courseDetail.value.coords || courseDetail.value.coords.length === 0) return attractions.value;
      const endCoord = courseDetail.value.coords[courseDetail.value.coords.length - 1];
      return [
        ...attractions.value,
        {
          attractionId: 'END',
          title: '도착점',
          latitude: endCoord.latitude,
          longitude: endCoord.longitude,
          isEndPoint: true
        }
      ];
    })

    watch(selectedCourse, (newCourse) => {
      if (newCourse && newCourse.id) {
        fetchCourseDetail(newCourse.id);
      } else {
        courseDetail.value = null;
        attractions.value = [];
      }
    })

    const selectCourse = (course) => {
      selectedCourse.value = course;
    }

    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    }

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    }

    const fetchCourseDetail = async (courseId) => {
      loading.value = true;
      try {
        const response = await courseApi.getCourseDetail(courseId);
        if (response && response.status === 'success' && response.data) {
          courseDetail.value = response.data;
        } else if (response && response.data) {
          courseDetail.value = response.data;
        } else {
          courseDetail.value = null;
        }
      } catch (error) {
        console.error('코스 상세 정보 조회 실패:', error);
        courseDetail.value = null;
      } finally {
        loading.value = false;
      }
    }

    const goToNearbyAttractions = () => {
      if (selectedCourse.value && courseDetail.value) {
        // 좌표 데이터를 로컬 스토리지에 저장
        const coordsKey = `course_coords_${selectedCourse.value.id}`
        if (courseDetail.value.coords && courseDetail.value.coords.length > 0) {
          localStorage.setItem(coordsKey, JSON.stringify(courseDetail.value.coords))
        }
        
        router.push({
          name: 'nearby-attractions',
          params: { 
            courseId: selectedCourse.value.id,
            courseName: selectedCourse.value.name
          },
          query: {
            sidoCode: selectedCourse.value.sidoCode,
            sigunguCode: selectedCourse.value.sigunguCode
            // coords는 URL에서 제거하고 로컬 스토리지에서 가져오도록 변경
          }
        });
      }
    }

    return {
      selectedCourse,
      courseDetail,
      attractions,
      currentPage,
      pageSize,
      loading,
      loadingAttractions,
      pagedCourses,
      totalPages,
      attractionsWithEndPoint,
      selectCourse,
      prevPage,
      nextPage,
      fetchCourseDetail,
      goToNearbyAttractions
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