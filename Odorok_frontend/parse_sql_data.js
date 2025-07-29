const fs = require('fs');
const path = require('path');

// SQL 덤프 파일 경로
const sqlFilePath = path.join(__dirname, 'Odorok_backend-main', 'odorok_dump_0625.sql');

// SQL 파일 읽기
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// 데이터 파싱 함수들
function parseInsertStatement(sql, tableName) {
  // INSERT문 전체를 찾음
  const regex = new RegExp(`INSERT INTO \`${tableName}\` VALUES ([^;]+);`, 'g');
  const matches = [...sql.matchAll(regex)];
  let allRows = [];
  matches.forEach(match => {
    // 괄호로 감싸진 데이터 덩어리 모두 추출
    const valuesRegex = /\(([^()]+)\)/g;
    let rowMatch;
    while ((rowMatch = valuesRegex.exec(match[1])) !== null) {
      const values = rowMatch[1].split(',').map(val => {
        val = val.trim();
        // 따옴표 제거
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1);
        }
        // NULL 값 처리
        if (val === 'NULL') {
          return null;
        }
        // 숫자 변환
        if (!isNaN(val) && val !== '') {
          return Number(val);
        }
        return val;
      });
      allRows.push(values);
    }
  });
  return allRows;
}

// 테이블별 컬럼명 정의
const tableColumns = {
  courses: ['id', 'route_id', 'course_code', 'route_code', 'name', 'distance', 'duration', 'difficulty', 'visited_count', 'description'],
  routes: ['id', 'route_code', 'name', 'description', 'content'],
  attractions: ['id', 'content_id', 'name', 'image1', 'image2', 'content_type_id', 'latitude', 'longitude', 'tel', 'address', 'overview', 'homepage', 'zipcode', 'sido_code', 'sigungu_code', 'theme_id'],
  themes: ['id', 'name'],
  sidos: ['id', 'name'],
  sigungus: ['id', 'name', 'sido_id']
};

// 데이터 파싱
const parsedData = {};

Object.keys(tableColumns).forEach(tableName => {
  const data = parseInsertStatement(sqlContent, tableName);
  const columns = tableColumns[tableName];
  
  parsedData[tableName] = data.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
});

// 경로 좌표 데이터 파싱 (별도 함수로 분리)
function parsePathCoords(sql) {
  const regex = /INSERT INTO `path_coords` VALUES ([^;]+);/g;
  const matches = [...sql.matchAll(regex)];
  let allRows = [];
  matches.forEach(match => {
    const valuesRegex = /\(([^()]+)\)/g;
    let rowMatch;
    while ((rowMatch = valuesRegex.exec(match[1])) !== null) {
      const values = rowMatch[1].split(',').map(val => {
        val = val.trim();
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1);
        }
        if (val === 'NULL') return null;
        if (!isNaN(val) && val !== '') return Number(val);
        return val;
      });
      allRows.push({
        id: values[0],
        course_id: values[1],
        latitude: values[2],
        longitude: values[3],
        sequence: values[4]
      });
    }
  });
  return allRows;
}

// path_coords 데이터 파싱
parsedData.path_coords = parsePathCoords(sqlContent);

console.log('파싱된 데이터 개수:');
console.log(`- courses: ${parsedData.courses.length}개`);
console.log(`- routes: ${parsedData.routes.length}개`);
console.log(`- themes: ${parsedData.themes.length}개`);
console.log(`- path_coords: ${parsedData.path_coords.length}개`);

// 지역 정보 추출 함수
function getRegionFromRoute(routeName) {
  if (routeName && routeName.includes('남파랑길')) return '부산';
  if (routeName && routeName.includes('북파랑길')) return '강원';
  if (routeName && routeName.includes('동파랑길')) return '경북';
  if (routeName && routeName.includes('서파랑길')) return '전남';
  return '전국';
}

// 코스별 좌표 데이터 가공
function getCoordinatesForCourse(courseId, pathCoords) {
  if (!pathCoords || pathCoords.length === 0) {
    return null;
  }
  
  const coords = pathCoords
    .filter(coord => coord.course_id === courseId)
    .sort((a, b) => a.sequence - b.sequence)
    .map(coord => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
      ordering: coord.sequence
    }));
  
  return coords.length > 0 ? coords : null;
}

// 코스 데이터 가공 (API 명세서에 맞는 형태로)
const processedCourses = parsedData.courses.map(course => {
  return {
    courseId: course.id,
    courseIdx: String(course.id),
    gilName: course.name, // 임시로 name 사용
    courseName: course.name,
    sidoCode: 1, // 샘플, 실제 매핑 필요
    sigunguCode: 1, // 샘플, 실제 매핑 필요
    distance: course.distance,
    reqTime: course.duration,
    level: course.difficulty,
    cycle: true, // 샘플
    brdDiv: false, // 샘플
    createdAt: '2023-12-31', // 샘플
    modifiedAt: '2024-03-01', // 샘플
    reward: 300, // 샘플
    visited: Math.random() > 0.7,
    avgStars: Math.floor(Math.random() * 30) / 10 + 3, // 3.0~6.0
    reviewCount: Math.floor(Math.random() * 200),
    coords: getCoordinatesForCourse(course.id, parsedData.path_coords)
  };
});

// 1. 전체 코스 리스트
fs.writeFileSync(
  path.join(__dirname, 'odorok-frontend-project', 'src', 'data', 'courses_all.json'),
  JSON.stringify({ status: 'success', message: '', data: { items: processedCourses } }, null, 2)
);

// 2. 지역별 코스 리스트 (sidoCode, sigunguCode 기준)
const regionGroups = {};
processedCourses.forEach(course => {
  const key = `sido${course.sidoCode}_sigungu${course.sigunguCode}`;
  if (!regionGroups[key]) regionGroups[key] = [];
  regionGroups[key].push(course);
});
Object.entries(regionGroups).forEach(([key, items]) => {
  fs.writeFileSync(
    path.join(__dirname, 'odorok-frontend-project', 'src', 'data', `courses_region_${key}.json`),
    JSON.stringify({ status: 'success', message: '', data: { items } }, null, 2)
  );
});

// 3. 별점 TOP5
const topStars = [...processedCourses].sort((a, b) => b.avgStars - a.avgStars).slice(0, 5);
fs.writeFileSync(
  path.join(__dirname, 'odorok-frontend-project', 'src', 'data', 'courses_top_stars.json'),
  JSON.stringify({ status: 'success', message: '', data: { items: topStars } }, null, 2)
);

// 4. 방문수 TOP5 (reviewCount 기준)
const topVisited = [...processedCourses].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
fs.writeFileSync(
  path.join(__dirname, 'odorok-frontend-project', 'src', 'data', 'courses_top_visited.json'),
  JSON.stringify({ status: 'success', message: '', data: { items: topVisited } }, null, 2)
);

// 5. 각 코스 상세 (courseId별로)
processedCourses.forEach(course => {
  fs.writeFileSync(
    path.join(__dirname, 'odorok-frontend-project', 'src', 'data', `course_detail_${course.courseId}.json`),
    JSON.stringify({
      status: 'success',
      message: '',
      data: {
        summary: course.gilName + ' 소개',
        comments: '전체 소개',
        travelerInfo: '여행자 정보 글',
        avgStars: course.avgStars,
        reviewCount: course.reviewCount,
        coords: course.coords
      }
    }, null, 2)
  );
});

console.log('\n분류별 JSON 파일 생성 완료!'); 