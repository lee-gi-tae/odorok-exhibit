<template>
  <div class="consent-container">
    <div class="consent-box">
      <h2>건강정보 입력 동의</h2>
      <div class="consent-text">
        건강 정보 설문 조사에 응하시겠습니까?<br />
        저장된 정보는 추천코스 알고리즘에 활용됩니다.
      </div>
      <div class="consent-check">
        <input type="checkbox" id="agree" v-model="agree" />
        <label for="agree">약관 동의</label>
        <a href="#" class="terms-link">약관 보기</a>
      </div>
      <div class="consent-actions">
        <button :disabled="!agree" @click="onYes">예</button>
        <button @click="onNo">아니오</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const agree = ref(false);
function onYes() {
  router.push('/signup/health');
}
function onNo() {
  router.push('/signup/complete');
}
</script>
<style scoped>
.consent-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f6ee; }
.consent-box { background: #fff; border-radius: 16px; box-shadow: 0 2px 16px #0001; padding: 40px 32px; min-width: 340px; display: flex; flex-direction: column; align-items: center; }
h2 { margin-bottom: 18px; }
.consent-text { margin-bottom: 18px; text-align: center; color: #444; }
.consent-check { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
.terms-link { color: #888; font-size: 13px; text-decoration: underline; cursor: pointer; }
.consent-actions { display: flex; gap: 16px; }
button { background: #222; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 16px; cursor: pointer; }
button[disabled] { opacity: 0.5; cursor: not-allowed; }
</style> 