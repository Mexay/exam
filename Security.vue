<template>
  <section class="page-section verification-page">
    <article class="surface verification-card">
      <span class="verification-icon"><i class="el-icon-unlock"></i></span>
      <h2>考生解封验证码</h2>
      <p>将当前验证码发送给违规锁定的考生，用于解除考试限制。</p>
      <div class="verification-code" :aria-label="`当前验证码 ${verificationCode}`">
        <strong v-for="(digit, index) in verificationCode" :key="index">{{ digit }}</strong>
      </div>
      <span class="verification-time">更新时间：{{ updatedAt }}</span>
      <el-button type="primary" class="verification-update" icon="el-icon-refresh"
        :loading="updating" @click="updateVerificationCode">更新验证码</el-button>
    </article>
  </section>
</template>

<script>
import { getVerifyCode, updateVerifyCode } from '@/api/pwgh/examIndex';

export default {
  name: 'ExamSecurity',
  data() { return { verificationId: '', verificationCode: '------', updatedAt: '-', updating: false }; },
  mounted() { this.loadVerificationCode(); },
  methods: {
    async loadVerificationCode() {
      try {
        const response = await getVerifyCode();
        if (!response.success) throw new Error(response.msg || '验证码加载失败');
        const data = response.data || {};
        this.verificationId = data.id || '';
        this.verificationCode = String(data.verifyCode || '').padStart(6, '0');
        this.updatedAt = data.updateTime || data.updatedAt || this.formatDateTime(new Date());
      } catch (error) {
        this.$message.error(error.message || '验证码加载失败');
      }
    },
    async updateVerificationCode() {
      const nextCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      this.updating = true;
      try {
        const response = await updateVerifyCode({ id: this.verificationId, verifyCode: nextCode });
        if (!response.success) throw new Error(response.msg || '验证码更新失败');
        this.$message.success('验证码已更新');
        await this.loadVerificationCode();
      } catch (error) {
        this.$message.error(error.message || '验证码更新失败');
      } finally {
        this.updating = false;
      }
    },
    formatDateTime(date) {
      const pad = value => String(value).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
  }
};
</script>
