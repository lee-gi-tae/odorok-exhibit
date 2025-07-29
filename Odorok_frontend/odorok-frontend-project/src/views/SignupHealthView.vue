<template>
  <div class="health-container">
    <div class="health-box">
      <h2>건강정보 입력</h2>
      <form @submit.prevent="onSubmit">
        <div class="row">
          <label>성별</label>
          <label><input type="radio" value="male" v-model="gender" required /> 남자</label>
          <label><input type="radio" value="female" v-model="gender" required /> 여자</label>
        </div>
        <div class="row">
          <input v-model.number="age" type="number" min="0" placeholder="나이" required />
          <input v-model.number="height" type="number" min="0" placeholder="키(cm)" required />
          <input v-model.number="weight" type="number" min="0" placeholder="몸무게(kg)" required />
        </div>
        <div class="row">
          <label>흡연여부</label>
          <label><input type="radio" value="yes" v-model="smoking" required /> 흡연자</label>
          <label><input type="radio" value="no" v-model="smoking" required /> 비흡연자</label>
        </div>
        <div class="row">
          <input v-model.number="drinking" type="number" min="0" placeholder="일주일 음주 횟수" required />
          <input v-model.number="exercise" type="number" min="0" placeholder="일주일 운동 횟수" required />
        </div>
        <div class="row disease-row">
          <label>질병(중복선택)</label>
          <label v-for="d in diseases" :key="d">
            <input type="checkbox" :value="d" v-model="selectedDiseases" /> {{ d }}
          </label>
        </div>
        <button type="submit">제출</button>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const gender = ref('');
const age = ref('');
const height = ref('');
const weight = ref('');
const smoking = ref('');
const drinking = ref('');
const exercise = ref('');
const diseases = [
  '고혈압', '당뇨', '비만', '허리디스크', '관절염', '고지혈증'
];
const selectedDiseases = ref([]);
function onSubmit() {
  // 실제로는 상태 저장 및 API 전송
  alert('건강정보가 저장되었습니다.');
  router.push('/signup/complete');
}
</script>
<style scoped>
.health-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f6ee; }
.health-box { background: #fff; border-radius: 16px; box-shadow: 0 2px 16px #0001; padding: 40px 32px; min-width: 340px; display: flex; flex-direction: column; align-items: center; }
h2 { margin-bottom: 18px; }
form { width: 100%; display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.disease-row { flex-direction: column; align-items: flex-start; gap: 4px; }
input[type="number"], input[type="text"] { padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 15px; width: 100px; }
button[type="submit"] { background: #222; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 16px; cursor: pointer; margin-top: 8px; }
</style> 