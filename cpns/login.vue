<template>
  <div class="v9-page">
    <span class="close-icon" @click="closeLogin"></span>
    <section class="v9-hero">
      <header class="v9-brand">
        <!-- <div class="brand-mark">
          <div class="brand-globe"></div>
        </div>
        <div class="brand-name">
          <div class="brand-main">国家电网</div>
          <div class="brand-en">STATE GRID</div>
        </div>
        <div class="brand-divider"></div>
        <div class="brand-company">
          <div>安徽电网公司</div>
          <span>ANHUI ELECTRIC POWER COMPANY</span>
        </div> -->
      </header>

      <main class="v9-main">
        <div class="v9-copy">
          <div class="v9-copy-title">
            <img class="v9-copy-logo" src="../imgs/ah_logo.jpg" alt="国网安徽电力" />
            <h1>国网安徽电力2026年新型配电系统配电网规划设计竞赛</h1>
          </div>
          <p>科学规划配电网 智能测评促提升</p>
        </div>

        <form class="login-card" @submit.prevent>
          <div class="login-title">
            <div class="login-avatar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 12.5c2.35 0 4.25-1.9 4.25-4.25S14.35 4 12 4 7.75 5.9 7.75 8.25 9.65 12.5 12 12.5Zm0 2c-3.15 0-6.2 1.6-6.2 3.6V20h12.4v-1.9c0-2-3.05-3.6-6.2-3.6Z" />
              </svg>
            </div>
            <span>账号密码登录</span>
          </div>

          <!-- <div class="role-switch" aria-label="身份选择">
            <button v-for="role in roles" :key="role.value" type="button" :class="{ active: loginRole === role.value }"
              @click="loginRole = role.value">
              {{ role.label }}
            </button>
          </div> -->

          <label class="login-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-3.55 0-7.2 1.9-7.2 4.7v1.3h2v-1.3c0-1.28 2.42-2.7 5.2-2.7s5.2 1.42 5.2 2.7v1.3h2v-1.3c0-2.8-3.65-4.7-7.2-4.7Z" />
            </svg>
            <input type="text" placeholder="请输入账号" v-model="userId" />
          </label>

          <label class="login-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18.3 9.4h-1.1V7.2a5.2 5.2 0 0 0-10.4 0v2.2H5.7c-.72 0-1.3.58-1.3 1.3v8c0 .72.58 1.3 1.3 1.3h12.6c.72 0 1.3-.58 1.3-1.3v-8c0-.72-.58-1.3-1.3-1.3ZM8.8 7.2a3.2 3.2 0 0 1 6.4 0v2.2H8.8V7.2Zm8.8 10.8H6.4v-6.6h11.2V18Z" />
            </svg>
            <input type="password" placeholder="请输入密码" v-model="password" />
            <button class="eye-btn" type="button" aria-label="显示密码">
              <!-- <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.6 12s3.3-5.7 9.4-5.7 9.4 5.7 9.4 5.7-3.3 5.7-9.4 5.7S2.6 12 2.6 12Zm9.4 3.7a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Zm0-2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
              </svg> -->
            </button>
          </label>

          <button class="login-submit" @click="login">登录</button>

        </form>
      </main>

    </section>

    <section class="notice-card">
      <div class="notice-title">
        <div class="notice-shield">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2.6 20 5.5v6.1c0 5-3.34 8.56-8 9.8-4.66-1.24-8-4.8-8-9.8V5.5l8-2.9Zm3.82 7.06-4.65 4.65-2-2-1.42 1.42 3.42 3.42 6.07-6.07-1.42-1.42Z" />
          </svg>
        </div>
        <h2>机考测评注意事项</h2>
      </div>

      <div class="notice-grid">
        <article v-for="item in notices" :key="item.title" class="notice-item">
          <div class="notice-icon">
            <svg v-if="item.icon === 'screen'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v11H4V5Zm2 2v7h12V7H6Zm4 12v-2h4v2h3v2H7v-2h3Z" />
            </svg>
            <svg v-else-if="item.icon === 'ban'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4.6 3.2 20.8 19.4l-1.4 1.4-2-2H4.5v-13l-1.3-1.2 1.4-1.4Zm1.9 4.2v9.4h8.9l-8.9-9.4ZM19.5 5.5v10.44l-2-2V7.5H11.1l-2-2h10.4ZM8 19h8v2H8v-2Z" />
            </svg>
            <svg v-else-if="item.icon === 'monitor'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 5h16v10H4V5Zm2 2v6h12V7H6Zm6 9.2c.66 0 1.2.54 1.2 1.2s-.54 1.2-1.2 1.2-1.2-.54-1.2-1.2.54-1.2 1.2-1.2ZM8 19h8v2H8v-2Z" />
            </svg>
            <svg v-else-if="item.icon === 'alert'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M11 5h2v9h-2V5Zm0 11h2v2h-2v-2Zm1-14a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z" />
            </svg>
            <svg v-else-if="item.icon === 'clock'" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M11 6h2v6.05l4 2.35-1 1.72-5-2.95V6Zm1-4a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3h9l4 4v14H6V3Zm8 2v4h3l-3-4ZM8 5v14h9V11h-5V5H8Zm2 8h5v2h-5v-2Zm0 3h5v2h-5v-2Z" />
            </svg>
          </div>
          <div>
            <h3>{{ item.index }}. {{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </div>
    </section>

    <footer class="v9-tip">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2a4.6 4.6 0 0 0-2.5-4.1v8.2a4.6 4.6 0 0 0 2.5-4.1Zm-2.5-9v2.1a7.8 7.8 0 0 1 0 13.8V21a9.8 9.8 0 0 0 0-18Z" />
      </svg>
      <span>温馨提示：本系统仅支持在当前页面操作，请勿刷新或关闭浏览器。</span>
    </footer>
  </div>
</template>

<script>
import { login, logout, getExamTime, startExam, teacherLogin } from '@/api/pwgh/examCbPsk'
export default {
  name: 'DashboardV9',
  data() {
    return {
      password: '',
      userId: '',
      loginRole: 'student',
      roles: [
        { value: 'student', label: '学生' },
        { value: 'teacher', label: '考官' }
      ],
      notices: [
        { index: 1, title: '严格遵守考试纪律', text: '考试过程中请严格遵守考试纪律，独立完成所有考试内容。', icon: 'screen' },
        { index: 2, title: '不允许切换屏幕', text: '不允许切换屏幕、打开其他网页、使用外部工具或与他人交流。', icon: 'ban' },
        { index: 3, title: '系统实时监控', text: '系统将实时监控考试过程，违规操作将影响考试成绩。', icon: 'monitor' },
        { index: 4, title: '网络稳定', text: '请确保网络稳定，考试过程中如遇异常，请及时联系监考人员。', icon: 'alert' },
        { index: 5, title: '考试时间', text: '考试时间以系统计时为准，请合理安排答题时间。', icon: 'clock' },
        { index: 6, title: '成绩评定', text: '考试成绩将由系统自动记录并提交评审，完成后请等待结果。', icon: 'doc' }
      ]
    };
  },
  mounted() {
    // logout({userId: '123456789'})
  },
  methods: {
    closeLogin() {
      this.password = '';
      this.userId = '';
      this.loginRole = 'student';
      this.$emit('closeLogin');
    },
    compareDateTime(firstTime, secondTime) {
      const first = this.$moment(firstTime, 'YYYY-MM-DD HH:mm:ss');
      const second = this.$moment(secondTime, 'YYYY-MM-DD HH:mm:ss');
      if (!first.isValid() || !second.isValid()) {
        this.$message.error('时间异常!');
        return 0;
      };
      return first.diff(second);
    },
    login() {
      // 学生端
      if (!this.userId || !this.password) {
        this.$message.error('请输入账户或密码!');
        return
      }
      login({
        // roleType: this.loginRole === 'student' ? 0 : 1,
        userId: this.userId,
        password: this.password
      }).then(res => {
        if (res.success) {
          if (res.data.roleType) {
            localStorage.setItem('ks-user-info', JSON.stringify(res.data))
            localStorage.setItem('ks-user-info-teacher', JSON.stringify(res.data))
            this.$emit('login', {
              role: 'teacher',
            })
          } else {
            // res.data.status < 2 && startExam({});
            localStorage.setItem('ks-user-info', JSON.stringify(res.data))
            this.$emit('login', {
              role: 'student',
              status: res.data.status
            })
          }

        } else {
          this.$message.error(res.msg)
        }
      })
      return;
      if (this.loginRole !== 'student') { // 考官端
        teacherLogin({
          roleType: this.loginRole === 'student' ? 0 : 1,
          userId: this.userId,
          password: this.password
        }).then(res => {
          if (res.success) {
            localStorage.setItem('ks-user-info', JSON.stringify(res.data))
            localStorage.setItem('ks-user-info-teacher', JSON.stringify(res.data))
            this.$emit('login', {
              role: this.loginRole
            })
          } else {
            this.$message.error(res.msg)
          }
        })
        return
      }
      getExamTime({}).then(res => {
        const { currentTime, startTime, endTime } = res.data || {};
        const result1 = this.compareDateTime(currentTime, startTime);
        const result2 = this.compareDateTime(currentTime, endTime);
        if (result1 < 0) { // 早于考试时间
          this.$message.error('还未到考试时间!');
          return
        }
        if (result2 > 0 || result2 === 0) { // 晚于考试时间
          this.$message.error('考试已结束!');
          return
        }
        login({
          roleType: this.loginRole === 'student' ? 0 : 1,
          userId: this.userId,
          password: this.password
        }).then(res => {
          if (res.success) {
            // startExam({});
            localStorage.setItem('ks-user-info', JSON.stringify(res.data))
            this.$emit('login', {
              role: this.loginRole
            })
          } else {
            this.$message.error(res.msg)
          }
        })
      })
    }
  }
};
</script>

<style scoped>
.v9-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background:
    radial-gradient(circle at 12% 6%, rgba(255, 255, 255, 0.95), transparent 28%),
    linear-gradient(180deg, #eaf7ff 0%, #f7fbff 60%, #eef7ff 100%);
  color: #10244a;
  /* overflow: hidden; */
  overflow: auto;
  /* transform: scale(.8); */
}

.v9-hero {
  position: relative;
  min-height: 512;
  padding: 50px 9.8vw 50px;
  background:
    linear-gradient(180deg, rgba(239, 249, 255, 0.5) 0%, rgba(239, 249, 255, 0.18) 48%, rgba(235, 248, 255, 0.64) 100%),
    url('../imgs/login-bg.png') center bottom / cover no-repeat;
  overflow: hidden;
}

.v9-brand {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  color: #075d69;
}

.brand-mark {
  width: 54px;
  height: 54px;
  border: 3px solid #0e7d89;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-right: 12px;
  box-shadow: inset 0 0 0 3px rgba(14, 125, 137, 0.12);
}

.brand-globe {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent 44%, #0e7d89 45%, #0e7d89 55%, transparent 56%),
    linear-gradient(0deg, transparent 44%, #0e7d89 45%, #0e7d89 55%, transparent 56%),
    radial-gradient(circle at center, #d8fbff 0 42%, #0e7d89 43% 54%, transparent 55%);
}

.brand-main {
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
}

.brand-en {
  margin-top: 3px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  line-height: 1;
  font-weight: 800;
}

.brand-divider {
  width: 1px;
  height: 42px;
  margin: 0 19px;
  background: rgba(7, 93, 105, 0.55);
}

.brand-company {
  font-weight: 800;
  font-size: 18px;
  line-height: 1.15;
}

.brand-company span {
  display: block;
  margin-top: 7px;
  font-size: 11px;
  transform-origin: left center;
}

.v9-main {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: minmax(620px, 1fr) 470px;
  align-items: start;
  gap: 72px;
  max-width: 1320px;
  margin: 0 auto;
}

.v9-copy {
  /* padding-top: 103px; */
  text-align: center;
}

.v9-copy-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 18px;
  text-align: left;
}

.v9-copy-logo {
  width: auto;
  height: 64px;
  flex: 0 0 auto;
  object-fit: contain;
}

.v9-copy h1 {
  margin: 0;
  min-width: 0;
  color: #1263de;
  font-size: clamp(34px, 3.3vw, 50px);
  line-height: 1.05;
  font-weight: 800;
  text-shadow: 0 6px 16px rgba(18, 99, 222, 0.08);
  text-align: center;
}

.v9-copy p {
  margin: 28px 0 0;
  color: #394d70;
  font-size: 21px;
  font-weight: 600;
}

.login-card {
  width: 370px;
  min-height: 380px;
  /* margin-top: 20px; */
  padding: 42px 39px 34px;
  border: 1px solid rgba(132, 184, 235, 0.42);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 22px 54px rgba(44, 118, 201, 0.16);
  backdrop-filter: blur(10px);
}

.login-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #0769ed;
  font-size: 21px;
  font-weight: 800;
}

.login-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(180deg, #eaf5ff, #d8ebff);
  border: 1px solid #c6ddf7;
}

.login-avatar svg {
  width: 31px;
  height: 31px;
  fill: #0c73ed;
}

.role-switch {
  height: 34px;
  margin-top: 24px;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  border: 1px solid #c8d9ef;
  border-radius: 6px;
  background: rgba(232, 243, 255, 0.72);
}

.role-switch button {
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #50627d;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.role-switch button.active {
  background: linear-gradient(180deg, #ffffff, #eaf4ff);
  color: #0769ed;
  box-shadow: 0 4px 12px rgba(31, 107, 213, 0.16);
}

.login-field {
  height: 46px;
  margin-top: 22px;
  border: 1px solid #b5c8e2;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  padding: 0 17px;
}

.login-field+.login-field {
  margin-top: 18px;
}

.login-field>svg {
  width: 24px;
  height: 24px;
  fill: #0769ed;
  flex: 0 0 auto;
}

.login-field input {
  min-width: 0;
  flex: 1;
  height: 100%;
  border: 0;
  outline: 0;
  padding: 0 14px;
  background: transparent;
  color: #172b4d;
  font-size: 15px;
}

.login-field input::placeholder {
  color: #7c879a;
}

.eye-btn {
  width: 26px;
  height: 26px;
  border: 0;
  background: transparent;
  padding: 3px;
  cursor: pointer;
}

.eye-btn svg {
  width: 20px;
  height: 20px;
  fill: #8b96a8;
}

.login-submit {
  width: 100%;
  height: 46px;
  margin-top: 28px;
  border: 0;
  border-radius: 7px;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
  background: linear-gradient(180deg, #086fff, #075de0);
  box-shadow: 0 10px 20px rgba(8, 104, 239, 0.18);
  cursor: pointer;
}

.notice-card {
  position: relative;
  z-index: 5;
  max-width: 1204px;
  min-height: 296px;
  margin: 28px auto 0;
  padding: 23px 54px 22px;
  border: 1px solid rgba(86, 163, 231, 0.38);
  border-radius: 12px;
  background: rgba(247, 252, 255, 0.84);
  box-shadow: inset 0 0 42px rgba(84, 158, 226, 0.08);
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notice-title h2 {
  margin: 0;
  color: #075dd2;
  font-size: 22px;
  font-weight: 800;
}

.notice-shield,
.notice-icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
}

.notice-shield svg,
.notice-icon svg {
  width: 34px;
  height: 34px;
  fill: #0874ed;
}

.notice-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 82px;
  row-gap: 18px;
  margin-top: 22px;
}

.notice-grid::before {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 50%;
  width: 1px;
  background: rgba(67, 141, 219, 0.22);
}

.notice-item {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 14px;
  align-items: center;
}

.notice-item h3 {
  margin: 0 0 7px;
  color: #0a4eb7;
  font-size: 17px;
  line-height: 1.2;
  font-weight: 800;
}

.notice-item p {
  margin: 0;
  color: #4a5a73;
  font-size: 15px;
  line-height: 1.45;
}

.v9-tip {
  max-width: 960px;
  height: 38px;
  margin: 16px auto 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-radius: 9px;
  color: #0769ed;
  font-size: 13px;
  font-weight: 700;
  background: rgba(226, 243, 255, 0.86);
}

.v9-tip svg {
  width: 18px;
  height: 18px;
  fill: #0769ed;
}

@media (max-width: 1280px) {
  .v9-hero {
    padding-left: 5vw;
    padding-right: 5vw;
  }

  .v9-main {
    grid-template-columns: minmax(415px, 1fr) 340px;
    gap: 34px;
  }

  .login-card {
    width: 340px;
  }
}

@media (max-width: 980px) {
  .v9-hero {
    min-height: auto;
    padding: 24px 20px 120px;
  }

  .v9-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
  }

  .v9-copy {
    padding-top: 52px;
  }

  .v9-copy-logo {
    height: 52px;
  }

  .v9-copy h1 {
    font-size: 42px;
  }

  .v9-copy p {
    font-size: 22px;
  }

  .login-card {
    width: min(470px, 100%);
    margin-top: 0;
  }

  .notice-card,
  .v9-tip {
    margin-left: 20px;
    margin-right: 20px;
  }

  .notice-grid {
    grid-template-columns: 1fr;
    row-gap: 16px;
  }

  .notice-grid::before {
    display: none;
  }
}

@media (max-width: 640px) {
  .v9-brand {
    transform: scale(0.8);
    transform-origin: left top;
  }

  .v9-copy-title {
    gap: 12px;
  }

  .v9-copy-logo {
    height: 42px;
  }

  .v9-copy h1 {
    font-size: 33px;
  }

  .v9-copy p {
    font-size: 18px;
  }

  .login-card {
    padding: 30px 20px;
  }

  .notice-card {
    padding: 20px;
  }

  .notice-title h2 {
    font-size: 20px;
  }

  .notice-item {
    grid-template-columns: 52px 1fr;
  }

  .notice-icon,
  .notice-shield {
    width: 48px;
    height: 48px;
  }

  .v9-tip {
    height: auto;
    min-height: 47px;
    padding: 12px 16px;
    font-size: 14px;
    text-align: center;
  }
}

.close-icon {
  position: absolute !important;
  right: 15px;
  top: 4px;
  cursor: pointer;
  z-index: 9;
}

.close-icon::before {
  content: "✖";
  font-weight: 100;
  color: #000;
}
</style>
