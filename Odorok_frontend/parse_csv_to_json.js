const fs = require('fs');
const path = require('path');

// 코스 index(숫자) → course_id(문자열) 매핑
function getIndexToCourseId(tsvFilePath) {
  const lines = fs.readFileSync(tsvFilePath, 'utf-8').split('\n').filter(Boolean);
  const map = {};
  lines.forEach(line => {
    const values = line.split('\t');
    const index = values[0];
    const course_id = values[2];
    map[index] = course_id;
  });
  return map;
}

// 코스별 전체 경로 좌표 추출 (course_id 기준)
function getCoursePaths(pathCsv, indexToCourseId) {
  const lines = fs.readFileSync(pathCsv, 'utf-8').split('\n').filter(Boolean);
  const paths = {};
  lines.forEach(line => {
    const [ , courseIndex, lat, lng ] = line.split('\t');
    const course_id = indexToCourseId[courseIndex];
    if (course_id && lat && lng) {
      if (!paths[course_id]) paths[course_id] = [];
      paths[course_id].push({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
    }
  });
  return paths;
}

// TSV(탭 구분) 파일을 JSON으로 변환하는 함수
function tsvToJson(tsvFilePath, pathCsv, jsonFilePath) {
  const tsv = fs.readFileSync(tsvFilePath, 'utf-8');
  const lines = tsv.split('\n').filter(Boolean);
  // 샘플 데이터에 헤더가 없으므로, 직접 필드명 지정
  const headers = [
    'index', 'unknown1', 'course_id', 'route_id', 'name', 'section_count', 'distance', 'difficulty', 'unknown2',
    'summary', 'description', 'info', 'unknown3', 'unknown4', 'unknown5', 'created_at', 'updated_at', 'time'
  ];

  const indexToCourseId = getIndexToCourseId(tsvFilePath);
  const paths = getCoursePaths(pathCsv, indexToCourseId);

  const data = lines.map(line => {
    const values = line.split('\t');
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] ? values[idx].trim() : '';
    });
    const pathArr = paths[obj['course_id']] || [];
    // 주요 필드만 추출해서 보기 좋게 리턴
    return {
      id: obj['course_id'],
      name: obj['name'],
      description: obj['description'],
      summary: obj['summary'],
      info: obj['info'],
      sectionCount: obj['section_count'],
      distance: obj['distance'],
      difficulty: obj['difficulty'],
      createdAt: obj['created_at'],
      updatedAt: obj['updated_at'],
      pathPoints: pathArr
    };
  });

  fs.mkdirSync(path.dirname(jsonFilePath), { recursive: true });
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`변환 완료: ${jsonFilePath}`);
}

// 사용 예시
tsvToJson(
  path.join(__dirname, 'sample data/courese_list_sample.csv'),
  path.join(__dirname, 'sample data/courese_path.csv'),
  path.join(__dirname, 'odorok-frontend-project/src/data/courses.json')
); 