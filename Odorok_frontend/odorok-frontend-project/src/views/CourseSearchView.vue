<template>
  <div style="display: flex; gap: 32px; align-items: flex-start;">
    <div style="flex:1; min-width: 350px; max-width: 500px;">
      <KakaoMap
        :pathPoints="selectedCourse && courseDetail && courseDetail.coords ? courseDetail.coords : []"
        :courseId="selectedCourse ? selectedCourse.id : 'all'"
        :attractions="attractionsWithEndPoint"
      />
    </div>
    <!-- 리스트/상세 영역 -->
    <div style="flex:2; min-width: 350px;">
      <h1>코스검색</h1>
      
      <!-- 로딩 상태 표시 -->
      <div v-if="loading" style="text-align: center; padding: 20px;">
        <p>코스 데이터를 불러오는 중...</p>
      </div>
      
      <!-- 에러 상태 표시 -->
      <div v-else-if="error" style="text-align: center; padding: 20px; color: red;">
        <p>{{ error }}</p>
        <button @click="loadCourses" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          다시 시도
        </button>
      </div>
      
      <!-- 정상 상태 -->
      <div v-else>
        <div style="margin-bottom: 16px;">
          <button @click="selected = 'main'" :class="{ active: selected === 'main' }">메인</button>
          <button @click="selected = 'custom'" :qclass="{ active: selected === 'custom' }">맞춤</button>
          <button @click="selected = 'region'" :class="{ active: selected === 'region' }">지역</button>
          <button @click="selected = 'all'" :class="{ active: selected === 'all' }">전체</button>
        </div>
        
        <!-- 모든 코스 전달 -->
        <CourseMainTab v-if="selected === 'main'" :courses-prop="courses" />
        <CourseCustomTab v-if="selected === 'custom'" :courses-prop="courses" />
        <CourseRegionTab v-if="selected === 'region'" :courses-prop="courses" />
        <CourseAllTab v-if="selected === 'all'" :courses-prop="courses" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import courseApi from '../api/courseApi.js'
import KakaoMap from '../components/KakaoMap.vue'
import CourseMainTab from '../components/CourseMainTab.vue'
import CourseCustomTab from '../components/CourseCustomTab.vue'
import CourseRegionTab from '../components/CourseRegionTab.vue'
import CourseAllTab from '../components/CourseAllTab.vue'

const selected = ref('main')
const courses = ref([])
const selectedCourse = ref(null)
const courseDetail = ref(null)
const attractions = ref([])
const loading = ref(false)
const error = ref(null)

// 데이터 정규화 함수
function normalizeCourseData(rawData) {
  if (!rawData || !Array.isArray(rawData)) return []
  
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
  }))
}

async function loadCourses() {
  loading.value = true
  error.value = null
  
  try {
    const response = await courseApi.getAllCourses(0, 500)
    
    if (response && response.status === 'success' && response.data && response.data.items) {
      courses.value = normalizeCourseData(response.data.items)
    } else if (response && response.data && Array.isArray(response.data)) {
      // 백엔드 응답 구조가 다른 경우
      courses.value = normalizeCourseData(response.data)
    } else {
      throw new Error('올바르지 않은 데이터 형식입니다.')
    }
    
    console.log('로드된 코스 수:', courses.value.length)
  } catch (err) {
    console.error('코스 데이터 불러오기 실패:', err)
    error.value = '코스 데이터를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.'
    
    // 폴백: 로컬 데이터 사용
    try {
      const localData = await import('../data/courses.json')
      courses.value = normalizeCourseData(localData.default)
      console.log('로컬 데이터로 폴백, 코스 수:', courses.value.length)
    } catch (localErr) {
      console.error('로컬 데이터 로드도 실패:', localErr)
      courses.value = []
    }
  } finally {
    loading.value = false
  }
}

// attractionsWithEndPoint 계산 (도착점 추가)
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
});

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
button {
  margin-right: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background: #e9ecef;
}

button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

button:disabled {
  background: #6c757d;
  color: white;
  cursor: not-allowed;
}
</style> 