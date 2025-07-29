<template>
  <div class="login-container">
    <div class="login-box">
      <h2>로그인</h2>
      <form @submit.prevent="onLogin">
        <input v-model="email" type="email" placeholder="이메일" required />
        <input v-model="password" type="password" placeholder="비밀번호" required />
        <button type="submit">로그인</button>
      </form>
      <div class="login-links">
        <router-link to="/signup">회원가입</router-link>
        <span>|</span>
        <a href="#">아이디 비번 찾기</a>
      </div>
      <div class="social-login">
        <button class="kakao">카카오로 로그인</button>
        <button class="google">구글로 로그인</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const email = ref('');
const password = ref('');
function onLogin() {
  alert('로그인 기능은 추후 구현됩니다.');
}
</script>
<style scoped>
.login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f6ee; }
.login-box { background: #fff; border-radius: 16px; box-shadow: 0 2px 16px #0001; padding: 40px 32px; min-width: 320px; display: flex; flex-direction: column; align-items: center; }
h2 { margin-bottom: 24px; }
form { width: 100%; display: flex; flex-direction: column; gap: 12px; }
input { padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
button[type="submit"] { background: #222; color: #fff; border: none; border-radius: 6px; padding: 10px; font-size: 16px; cursor: pointer; margin-top: 8px; }
.login-links { margin: 16px 0 8px 0; font-size: 14px; color: #888; display: flex; gap: 8px; align-items: center; }
.social-login { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 8px; }
.kakao { background: #fee500; color: #3c1e1e; border: none; }
.google { background: #fff; color: #222; border: 1px solid #ddd; }
button.kakao, button.google { border-radius: 6px; padding: 10px; font-size: 16px; cursor: pointer; }
</style> 