<template>
  <div class="complete-container">
    <div class="complete-box">
      <h2>회원가입이 완료되었습니다!</h2>
      <p>이제 로그인을 통해 다양한 서비스를 이용해보세요.</p>
      <router-link to="/login"><button>로그인하러 가기</button></router-link>
    </div>
  </div>
</template>
<script setup>
</script>
<style scoped>
.complete-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f6ee; }
.complete-box { background: #fff; border-radius: 16px; box-shadow: 0 2px 16px #0001; padding: 40px 32px; min-width: 340px; display: flex; flex-direction: column; align-items: center; }
h2 { margin-bottom: 18px; }
p { color: #444; margin-bottom: 24px; }
button { background: #222; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 16px; cursor: pointer; }
</style> 