<template>
  <div class="nearby-attractions-container">
    <!-- 헤더 영역 -->
    <div class="header-section">
      <div class="header-component">
        <h1>주변명소 보기</h1>
        <p>{{ courseName }} 코스 주변의 명소들을 확인해보세요</p>
      </div>
      <div class="navigation-component">
        <button @click="goBack" class="back-button">← 코스로 돌아가기</button>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content">
      <!-- 왼쪽: 지도 영역 -->
      <div class="map-section">
        <div class="map-container">
          <KakaoMap 
            :pathPoints="courseCoords" 
            :courseId="courseId" 
            :attractions="filteredAttractions"
            :showAttractionMarkers="true"
          />
        </div>
      </div>

      <!-- 오른쪽: 명소 상세 정보 영역 -->
      <div class="attractions-section">
        <!-- 컨텐츠 타입 필터 -->
        <div class="filter-section">
          <h3>명소 종류 선택</h3>
          <div class="content-type-filters">
            <button 
              v-for="type in contentTypes" 
              :key="type.contentTypeId"
              @click="selectContentType(type.contentTypeId)"
              :class="{ active: selectedContentType === type.contentTypeId }"
              class="filter-button"
            >
              {{ type.name }}
            </button>
          </div>
        </div>

        <!-- 선택된 명소 상세 정보 -->
        <div v-if="selectedAttraction" class="attraction-detail">
          <h3>선택된 명소 정보</h3>
          
          <!-- 명소 이름 -->
          <div class="detail-item">
            <h4>명소 이름</h4>
            <p>{{ selectedAttraction.title }}</p>
          </div>

          <!-- 명소 종류 -->
          <div class="detail-item">
            <h4>명소 종류</h4>
            <p>{{ getContentTypeName(selectedAttraction.contentTypeId) }}</p>
          </div>

          <!-- 명소 사진 -->
          <div v-if="selectedAttraction.firstImage1" class="detail-item">
            <h4>명소 사진</h4>
            <img :src="selectedAttraction.firstImage1" :alt="selectedAttraction.title" class="attraction-image" />
          </div>

          <!-- 전화번호 -->
          <div v-if="selectedAttraction.tel" class="detail-item">
            <h4>전화번호</h4>
            <p>📞 {{ selectedAttraction.tel }}</p>
          </div>

          <!-- 홈페이지 -->
          <div v-if="selectedAttraction.homepage" class="detail-item">
            <h4>홈페이지</h4>
            <a :href="selectedAttraction.homepage" target="_blank" class="homepage-link">
              🌐 홈페이지 방문하기
            </a>
          </div>

          <!-- 주소 -->
          <div v-if="selectedAttraction.addr1" class="detail-item">
            <h4>주소</h4>
            <p>{{ selectedAttraction.addr1 }}</p>
            <p v-if="selectedAttraction.addr2">{{ selectedAttraction.addr2 }}</p>
          </div>

          <!-- 상세 설명 -->
          <div v-if="attractionDetail && attractionDetail.overview" class="detail-item">
            <h4>상세 설명</h4>
            <p>{{ attractionDetail.overview }}</p>
          </div>
        </div>

        <!-- 명소 목록 -->
        <div v-else class="attractions-list">
          <h3>주변 명소 목록 ({{ filteredAttractions.length }}개)</h3>
          <div v-if="loading" class="loading">
            명소 정보를 불러오는 중...
          </div>
          <div v-else-if="error" class="error">
            {{ error }}
          </div>
          <div v-else-if="filteredAttractions.length === 0" class="no-attractions">
            선택한 종류의 명소가 없습니다.
          </div>
          <div v-else class="attraction-items">
            <div 
              v-for="attraction in filteredAttractions" 
              :key="attraction.attractionId"
              @click="selectAttraction(attraction)"
              class="attraction-item"
              :class="{ selected: selectedAttraction && selectedAttraction.attractionId === attraction.attractionId }"
            >
              <div class="attraction-info">
                <h4>{{ attraction.title }}</h4>
                <p class="attraction-type">{{ getContentTypeName(attraction.contentTypeId) }}</p>
                <p class="attraction-address">{{ attraction.addr1 }}</p>
                <p v-if="attraction.tel" class="attraction-phone">📞 {{ attraction.tel }}</p>
              </div>
              <div v-if="attraction.firstImage1" class="attraction-thumbnail">
                <img :src="attraction.firstImage1" :alt="attraction.title" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import KakaoMap from '../components/KakaoMap.vue'
import courseApi from '../api/courseApi.js'

export default {
  name: 'NearbyAttractionsView',
  components: { KakaoMap },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const courseId = ref(route.params.courseId)
    const courseName = ref(route.params.courseName || '선택된 코스')
    const courseCoords = ref([])
    const attractions = ref([])
    const contentTypes = ref([])
    const selectedContentType = ref(12) // 기본값: 관광지
    const selectedAttraction = ref(null)
    const attractionDetail = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // URL 쿼리에서 데이터 파싱 (좌표는 로컬 스토리지에서 가져오기)
    const parseQueryData = () => {
      try {
        // courseId를 키로 사용하여 로컬 스토리지에서 좌표 데이터 가져오기
        const coordsKey = `course_coords_${courseId.value}`
        const storedCoords = localStorage.getItem(coordsKey)
        
        if (storedCoords) {
          courseCoords.value = JSON.parse(storedCoords)
          console.log('로컬 스토리지에서 좌표 로드:', courseCoords.value.length, '개')
        } else if (route.query.coords) {
          // URL에 좌표가 있으면 로컬 스토리지에 저장하고 사용
          const coords = JSON.parse(route.query.coords)
          courseCoords.value = coords
          localStorage.setItem(coordsKey, JSON.stringify(coords))
          console.log('URL에서 좌표 로드 및 저장:', coords.length, '개')
        }
      } catch (e) {
        console.error('좌표 데이터 파싱 실패:', e)
        courseCoords.value = []
      }
    }

    // 컨텐츠 타입 조회 - 하드코딩된 기본 타입만 사용
    const loadContentTypes = () => {
      contentTypes.value = [
        { contentTypeId: 12, name: '관광지' },
        { contentTypeId: 14, name: '문화시설' },
        { contentTypeId: 15, name: '축제공연행사' },
        { contentTypeId: 25, name: '여행코스' },
        { contentTypeId: 28, name: '레포츠' },
        { contentTypeId: 32, name: '숙박' },
        { contentTypeId: 38, name: '쇼핑' },
        { contentTypeId: 39, name: '음식점' }
      ]
    }

    // 주변 명소 조회
    const loadAttractions = async () => {
      loading.value = true
      error.value = null
      
      try {
        const sidoCode = parseInt(route.query.sidoCode) || 1
        const sigunguCode = parseInt(route.query.sigunguCode) || 1
        
        console.log('주변명소 조회 파라미터:', { sidoCode, sigunguCode })
        
        // 로컬 스토리지에서 캐시된 데이터 확인
        const cacheKey = `attractions_${sidoCode}_${sigunguCode}_12`
        const cachedData = localStorage.getItem(cacheKey)
        
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData)
            const cacheTime = parsedData.timestamp
            const now = Date.now()
            
            // 10분 이내의 캐시된 데이터라면 사용
            if (now - cacheTime < 10 * 60 * 1000) {
              console.log('로컬 캐시 사용:', cacheKey)
              attractions.value = parsedData.data
              loading.value = false
              return
            }
          } catch (e) {
            console.log('캐시 파싱 실패, 새로 로드')
          }
        }
        
        // 기본 컨텐츠 타입만 먼저 로드 (관광지)
        const defaultContentTypeId = 12
        const response = await courseApi.getNearbyAttractions(sidoCode, sigunguCode, defaultContentTypeId)
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          // 기본 타입의 명소들에 contentTypeId 추가
          const attractionsWithType = response.data.items.map(attraction => ({
            ...attraction,
            contentTypeId: defaultContentTypeId
          }))
          attractions.value = attractionsWithType
          
          // 로컬 스토리지에 캐시 저장
          localStorage.setItem(cacheKey, JSON.stringify({
            data: attractionsWithType,
            timestamp: Date.now()
          }))
          
          console.log('기본 명소 로드 완료:', attractions.value.length, '개')
        } else {
          attractions.value = []
          error.value = '해당 지역에 주변 명소가 없습니다.'
        }
        
      } catch (err) {
        console.error('주변 명소 조회 실패:', err)
        error.value = '주변 명소 정보를 불러오는데 실패했습니다.'
        attractions.value = []
      } finally {
        loading.value = false
      }
    }

    // 선택된 컨텐츠 타입의 명소만 로드
    const loadAttractionsByType = async (contentTypeId) => {
      try {
        const sidoCode = parseInt(route.query.sidoCode) || 1
        const sigunguCode = parseInt(route.query.sigunguCode) || 1
        
        const response = await courseApi.getNearbyAttractions(sidoCode, sigunguCode, contentTypeId)
        
        if (response && response.status === 'success' && response.data && response.data.items) {
          const newAttractions = response.data.items.map(attraction => ({
            ...attraction,
            contentTypeId: contentTypeId
          }))
          
          // 기존 명소 목록에 새로 로드한 명소들 추가
          attractions.value = [...attractions.value, ...newAttractions]
          console.log(`컨텐츠 타입 ${contentTypeId} 추가 로드 완료:`, newAttractions.length, '개')
        }
      } catch (err) {
        console.error(`컨텐츠 타입 ${contentTypeId} 조회 실패:`, err)
      }
    }

    // 필터링된 명소 목록 (선택된 타입만 표시)
    const filteredAttractions = computed(() => {
      if (!attractions.value || attractions.value.length === 0) {
        return []
      }
      
      const filtered = attractions.value.filter(attraction => 
        attraction.contentTypeId === selectedContentType.value
      )
      
      console.log(`컨텐츠 타입 ${selectedContentType.value} 필터링 결과:`, filtered.length, '개')
      return filtered
    })

    // 컨텐츠 타입 이름 가져오기
    const getContentTypeName = (contentTypeId) => {
      const defaultTypes = {
        12: '관광지',
        14: '문화시설', 
        15: '축제공연행사',
        25: '여행코스',
        28: '레포츠',
        32: '숙박',
        38: '쇼핑',
        39: '음식점'
      }
      
      return defaultTypes[contentTypeId] || '기타'
    }

    // 명소 선택
    const selectAttraction = async (attraction) => {
      console.log('attraction', attraction.attrationId)
      
      selectedAttraction.value = attraction
      attractionDetail.value = null
      
      // 명소 상세 정보 조회
      try {
        const response = await courseApi.getAttractionDetail(attraction.attrationId)
        if (response && response.status === 'success' && response.data) {
          attractionDetail.value = response.data
        } else {
          console.warn('명소 상세 정보가 없습니다:', attraction.title)
        }
      } catch (error) {
        console.error('명소 상세 정보 조회 실패:', error)
        console.log('기본 명소 정보로 표시합니다:', attraction.title)
      }
    }

    // 컨텐츠 타입 선택
    const selectContentType = async (contentTypeId) => {
      selectedContentType.value = contentTypeId
      selectedAttraction.value = null
      attractionDetail.value = null
      
      // 이미 해당 타입의 명소가 로드되어 있는지 확인
      const existingAttractions = attractions.value.filter(attraction => 
        attraction.contentTypeId === contentTypeId
      )
      
      // 해당 타입의 명소가 없으면 API 호출
      if (existingAttractions.length === 0) {
        await loadAttractionsByType(contentTypeId)
      }
    }

    // 뒤로 가기
    const goBack = () => {
      router.go(-1)
    }

    onMounted(() => {
      // URL에서 coords 파라미터가 있으면 즉시 제거
      if (route.query.coords) {
        console.log('URL에서 coords 파라미터 자동 제거 중...')
        
        // 즉시 URL에서 coords 제거
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.delete('coords')
        
        // 브라우저 히스토리에서도 제거 (뒤로가기 버튼에서도 사라짐)
        window.history.replaceState(null, '', currentUrl.toString())
        
        // 라우터 상태도 업데이트
        const newQuery = { ...route.query }
        delete newQuery.coords
        
        router.replace({
          name: 'nearby-attractions',
          params: route.params,
          query: newQuery
        })
        
        // 잠시 후 다시 마운트 (URL 정리 후)
        setTimeout(() => {
          parseQueryData()
          loadContentTypes()
          loadAttractions()
        }, 100)
        return
      }
      
      parseQueryData()
      loadContentTypes() // 동기 함수로 변경
      
      // 약간의 지연을 두고 로드하여 중복 요청 방지
      setTimeout(() => {
        loadAttractions()
      }, 100)
    })

    onUnmounted(() => {
      // 컴포넌트 언마운트 시 요청 정리
      courseApi.clearAllRequests()
      
      // 로컬 스토리지 캐시도 정리 (선택적)
      // localStorage.removeItem(`attractions_${parseInt(route.query.sidoCode) || 1}_${parseInt(route.query.sigunguCode) || 1}_12`)
    })

    return {
      courseId,
      courseName,
      courseCoords,
      attractions,
      contentTypes,
      selectedContentType,
      selectedAttraction,
      attractionDetail,
      filteredAttractions,
      loading,
      error,
      getContentTypeName,
      selectAttraction,
      selectContentType,
      loadAttractionsByType,
      goBack
    }
  }
}
</script>

<style scoped>
.nearby-attractions-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  width: 100%;
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  width: 100%;
}

.header-component h1 {
  margin: 0 0 10px 0;
  font-size: 2rem;
}

.header-component p {
  margin: 0;
  opacity: 0.9;
}

.navigation-component {
  margin-top: 15px;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  display: flex;
  gap: 20px;
  padding: 20px;
  width: 100%;
  height: calc(100vh - 120px);
  box-sizing: border-box;
}

.map-section {
  flex: 2;
  min-height: 600px;
  height: 100%;
}

.map-container {
  background: #e3f2fd;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
  width: 100%;
}

.attractions-section {
  flex: 1;
  min-width: 400px;
  background: #2e7d32;
  border-radius: 12px;
  padding: 20px;
  color: white;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-section {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.filter-section h3 {
  margin: 0 0 15px 0;
  color: white;
}

.content-type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-button {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.filter-button.active {
  background: #4caf50;
  border-color: #4caf50;
}

.attraction-detail {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.attraction-detail h3 {
  margin: 0 0 15px 0;
  color: white;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-item h4 {
  margin: 0 0 5px 0;
  color: #81c784;
  font-size: 0.9rem;
}

.detail-item p {
  margin: 0;
  line-height: 1.4;
}

.attraction-image {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  margin-top: 5px;
}

.homepage-link {
  color: #81c784;
  text-decoration: none;
  display: inline-block;
  margin-top: 5px;
}

.homepage-link:hover {
  text-decoration: underline;
}

.attractions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.attractions-list h3 {
  margin: 0 0 15px 0;
  color: white;
  flex-shrink: 0;
}

.loading, .error, .no-attractions {
  text-align: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  flex-shrink: 0;
}

.error {
  color: #ffcdd2;
}

.attraction-items {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.attraction-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 12px;
}

.attraction-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.attraction-item.selected {
  background: #4caf50;
  border: 2px solid #81c784;
}

.attraction-info {
  flex: 1;
}

.attraction-info h4 {
  margin: 0 0 5px 0;
  color: white;
  font-size: 1rem;
}

.attraction-type {
  margin: 0 0 3px 0;
  color: #81c784;
  font-size: 0.8rem;
}

.attraction-address {
  margin: 0 0 3px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.attraction-phone {
  margin: 0;
  color: #81c784;
  font-size: 0.8rem;
}

.attraction-thumbnail {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.attraction-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .map-section {
    min-height: 400px;
    height: 400px;
  }
  
  .attractions-section {
    min-width: auto;
    height: auto;
  }
}
</style> 