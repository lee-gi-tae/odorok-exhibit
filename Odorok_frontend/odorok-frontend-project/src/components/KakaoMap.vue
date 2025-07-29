<template>
  <div v-if="pathPoints && pathPoints.length > 0" :id="mapId" style="width: 100%; height: 100%;"></div>
  <div v-else style="color:#888; margin-top:16px;">경로 정보가 없습니다.</div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const KAKAO_MAP_KEY = '0b27ae4cd1f6d5855f45311d8cecb15f'

let kakaoMapScriptLoading = false
let kakaoMapScriptLoaded = false
let kakaoMapScriptPromise = null

export default {
  name: 'KakaoMap',
  props: {
    pathPoints: {
      type: Array,
      required: true
    },
    courseId: {
      type: [String, Number],
      required: true
    },
    attractions: {
      type: Array,
      default: () => []
    },
    showAttractionMarkers: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const mapId = computed(() => 'map-' + props.courseId)

    const loadKakaoMapScript = () => {
      if (kakaoMapScriptLoaded) return Promise.resolve()
      if (kakaoMapScriptLoading) return kakaoMapScriptPromise
      
      kakaoMapScriptLoading = true
      kakaoMapScriptPromise = new Promise((resolve, reject) => {
        if (window.kakao && window.kakao.maps) {
          kakaoMapScriptLoaded = true
          resolve()
          return
        }
        
        const script = document.createElement('script')
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_KEY}&autoload=false`
        script.onload = () => {
          window.kakao.maps.load(() => {
            kakaoMapScriptLoaded = true
            resolve()
          })
        }
        script.onerror = reject
        document.head.appendChild(script)
      })
      return kakaoMapScriptPromise
    }

    const getMarkerColor = (contentTypeId) => {
      const colorMap = {
        12: '#FF6B6B', // 관광지
        14: '#4ECDC4', // 문화시설
        15: '#45B7D1', // 축제공연행사
        25: '#96CEB4', // 여행코스
        28: '#FFEAA7', // 레포츠
        32: '#DDA0DD', // 숙박
        38: '#98D8C8', // 쇼핑
        39: '#F7DC6F'  // 음식점
      }
      return colorMap[contentTypeId] || '#FF6B6B'
    }

    const getContentTypeName = (contentTypeId) => {
      const typeMap = {
        12: '관광지',
        14: '문화시설',
        15: '축제공연행사',
        25: '여행코스',
        28: '레포츠',
        32: '숙박',
        38: '쇼핑',
        39: '음식점'
      }
      return typeMap[contentTypeId] || '기타'
    }

    const createMarkerImage = (color) => {
      const svg = `
        <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="15" cy="15" r="6" fill="white"/>
        </svg>
      `
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
    }

    const initMap = async () => {
      if (!props.pathPoints || props.pathPoints.length === 0) return
      
      // DOM이 렌더링될 때까지 대기
      await nextTick()
      
      const mapContainer = document.getElementById(mapId.value)
      if (!mapContainer) {
        console.error('지도 div를 찾을 수 없습니다:', mapId.value)
        return
      }

      const mapOption = {
        center: new window.kakao.maps.LatLng(props.pathPoints[0].latitude, props.pathPoints[0].longitude),
        level: 5,
      }
      
      const map = new window.kakao.maps.Map(mapContainer, mapOption)
      const linePath = props.pathPoints.map(p => new window.kakao.maps.LatLng(p.latitude, p.longitude))
      
      new window.kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 5,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
        map: map,
      })
      
      // 시작점 마커
      new window.kakao.maps.Marker({
        position: linePath[0],
        map: map,
      })
      
      // 명소 마커들 추가 (showAttractionMarkers가 true일 때만)
      if (props.showAttractionMarkers && props.attractions.length > 0) {
        props.attractions.forEach(attraction => {
          if (attraction.latitude && attraction.longitude) {
            const markerColor = getMarkerColor(attraction.contentTypeId)
            
            const marker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(attraction.latitude, attraction.longitude),
              map: map,
            })
            
            // 마커 이미지 설정 (커스텀 마커)
            const markerImage = new window.kakao.maps.MarkerImage(
              createMarkerImage(markerColor),
              new window.kakao.maps.Size(30, 30)
            )
            marker.setImage(markerImage)
            
            // 명소 정보창
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `
                <div style="padding:10px; min-width:200px;">
                  <h4 style="margin:0 0 5px 0; color:#333;">${attraction.title}</h4>
                  <p style="margin:0; font-size:12px; color:#666;">${attraction.addr1 || ''}</p>
                  ${attraction.tel ? `<p style="margin:5px 0 0 0; font-size:12px; color:#007bff;">📞 ${attraction.tel}</p>` : ''}
                  ${attraction.contentTypeId ? `<p style="margin:3px 0 0 0; font-size:11px; color:#28a745;">🏛️ ${getContentTypeName(attraction.contentTypeId)}</p>` : ''}
                </div>
              `
            })
            
            // 마커 클릭 시 정보창 표시
            window.kakao.maps.event.addListener(marker, 'click', function() {
              infowindow.open(map, marker)
            })
          }
        })
      }
      
      map.setCenter(linePath[0])
    }

    onMounted(async () => {
      try {
        await loadKakaoMapScript()
        await initMap()
      } catch (e) {
        console.error('카카오맵 초기화 실패:', e)
      }
    })

    // props 변경 감지
    watch(() => props.pathPoints, async (newVal) => {
      if (newVal && newVal.length > 0 && kakaoMapScriptLoaded) {
        await initMap()
      }
    })

    watch(() => props.attractions, async (newVal) => {
      if (newVal && newVal.length > 0 && kakaoMapScriptLoaded) {
        await initMap()
      }
    })

    return {
      mapId
    }
  }
}
</script> 