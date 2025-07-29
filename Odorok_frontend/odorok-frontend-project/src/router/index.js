import { createRouter, createWebHistory } from 'vue-router'
import CourseSearchView from '../views/CourseSearchView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/course-search'
    },
    {
      path: '/course-search',
      name: 'CourseSearch',
      component: CourseSearchView,
    },
    {
      path: '/nearby-attractions/:courseId',
      name: 'nearby-attractions',
      component: () => import('../views/NearbyAttractionsView.vue'),
      beforeEnter: (to, from, next) => {
        // URL에서 coords 파라미터가 있으면 제거
        if (to.query.coords) {
          const newQuery = { ...to.query }
          delete newQuery.coords
          
          next({
            name: 'nearby-attractions',
            params: to.params,
            query: newQuery,
            replace: true
          })
        } else {
          next()
        }
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/SignupView.vue')
    },
    {
      path: '/signup/consent',
      name: 'SignupConsent',
      component: () => import('../views/SignupConsentView.vue')
    },
    {
      path: '/signup/health',
      name: 'SignupHealth',
      component: () => import('../views/SignupHealthView.vue')
    },
    {
      path: '/signup/complete',
      name: 'SignupComplete',
      component: () => import('../views/SignupCompleteView.vue')
    },
  ],
})

export default router
