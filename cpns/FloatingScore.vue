<template>
  <div class="score-root" :style="rootStyle">
    <div class="score-ball" :class="{ 'score-ball--active': panelVisible }" @mousedown="onDragStart" @click="onBallClick">
      <i class="el-icon-edit-outline"></i>
      <span class="score-ball-text">评分</span>
    </div>

    <transition name="score-panel">
      <div v-show="panelVisible" class="score-panel">
        <div class="score-panel-hd">
          <span class="score-panel-title">测评评分</span>
          <div class="score-total-mini">
            <strong>{{ totalScore }}</strong>
            <span>/100</span>
          </div>
          <i class="el-icon-close score-panel-close" @click="panelVisible = false"></i>
        </div>

        <div class="score-panel-body">
          <div v-for="(item, index) in scoreItems" :key="item.key" class="score-item">
            <div class="score-item-info">
              <span class="score-index">{{ index + 1 }}</span>
              <span class="score-name">{{ item.name }}</span>
            </div>
            <el-input-number :key="`${item.key}-${inputKeys[index]}`" :disabled="modeType !== 'edit'" v-model="item.score" size="mini" :min="0" :max="100" :step="1"
              :precision="0" controls-position="right" @change="changeScore(item, index)"/>
          </div>
        </div>

        <div class="score-panel-footer" v-if="modeType === 'edit'">
          <el-button size="mini" @click="resetScores">重置</el-button>
          <el-button size="mini" type="primary" @click="submitScores">提交评分</el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
const SCORE_ITEMS = [
  { key: 'wtypzqx', name: '问题研判准确性' },
  { key: 'dlwjzqx', name: '绘制拓扑完整性' },
  { key: 'wgtpzqx', name: '措施建立准确性' },
  { key: 'ssfazqx', name: '实施方案准确性' },
  { key: 'pszlwzx', name: '评审资料完整性' },
  { key: 'xmjlzqx', name: '储备库是否排序' },
  { key: 'xmlcwzx', name: '下达库是否下达' }
];

import { setScore, getCjScore } from '@/api/pwgh/examCbPsk'

export default {
  name: 'FloatingScore',
  props: {
    modeType: {}
  },
  data() {
    return {
      studentInfo: localStorage.getItem('ks-user-info') && JSON.parse(localStorage.getItem('ks-user-info')) || {},
      panelVisible: false,
      position: {
        left: 20,
        top: 4 * window.innerHeight / 5
      },
      dragState: null,
      inputKeys: SCORE_ITEMS.map((item, index)=> index),
      scoreItems: SCORE_ITEMS.map(item => ({ ...item, score: 0 }))
    };
  },
  computed: {
    totalScore() {
      return this.scoreItems.reduce((sum, item) => sum + Number(item.score || 0), 0);
    },
    rootStyle() {
      return {
        left: `${this.position.left}px`,
        top: `${this.position.top}px`
      };
    }
  },
  beforeDestroy() {
    this.removeDragListeners();
  },
  mounted() {
    // this.scoreItems = SCORE_ITEMS.map(item => ({ ...item, score: this.studentInfo[item.key] }))
    this.getScore()
  },
  methods: {
    changeScore(item, index) {
      const othersTotal = this.scoreItems.reduce((sum, i ,idx) => {
        return idx === index ? sum : sum + Number(i.score || 0)
      }, 0)
      const maxVal = Math.max(0, 100 - othersTotal)
      const score = Math.min(Number(item.score || 0), maxVal)
      if(score !== Number(item.score || 0)) {
        item.score = score;
        this.$set(this.inputKeys, index, this.inputKeys[index] + 1)
      }
    },
    onDragStart(event) {
      event.preventDefault();
      this.dragState = {
        startX: event.clientX,
        startY: event.clientY,
        startLeft: this.position.left,
        startTop: this.position.top,
        moved: false
      };
      window.addEventListener('mousemove', this.onDragging);
      window.addEventListener('mouseup', this.onDragEnd);
    },
    onDragging(event) {
      if (!this.dragState) return;
      const deltaX = event.clientX - this.dragState.startX;
      const deltaY = event.clientY - this.dragState.startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        this.dragState.moved = true;
      }

      const ballSize = 52;
      const maxLeft = Math.max(0, window.innerWidth - ballSize);
      const maxTop = Math.max(0, window.innerHeight - ballSize);
      this.position.left = Math.min(Math.max(this.dragState.startLeft + deltaX, 0), maxLeft);
      this.position.top = Math.min(Math.max(this.dragState.startTop + deltaY, 0), maxTop);
    },
    onDragEnd() {
      this.removeDragListeners();
    },
    removeDragListeners() {
      window.removeEventListener('mousemove', this.onDragging);
      window.removeEventListener('mouseup', this.onDragEnd);
    },
    onBallClick() {
      if (this.dragState && this.dragState.moved) {
        this.dragState = null;
        return;
      }
      this.dragState = null;
      this.panelVisible = !this.panelVisible;
    },
    resetScores() {
      this.scoreItems = SCORE_ITEMS.map(item => ({ ...item, score: 0 }));
    },
    getScore() {
      getCjScore({
        paperId: localStorage.getItem('paperId')
      }).then(res => {
        if (res.success) {
          this.scoreItems = SCORE_ITEMS.map(item => ({ ...item, score: res.data[item.key] }))
        }
      })
    },
    submitScores() {
      const result = {
        totalScore: this.totalScore,
        dimensions: this.scoreItems.map(item => ({
          key: item.key,
          name: item.name,
          score: item.score
        }))
      };
      setScore({
        paperId: localStorage.getItem('paperId'),
        teacherId: localStorage.getItem('ks-user-info-teacher') && JSON.parse(localStorage.getItem('ks-user-info-teacher')) && JSON.parse(localStorage.getItem('ks-user-info-teacher')).id,
        score: this.totalScore,
        dlwjzqx: this.scoreItems.find(i => i.key === 'dlwjzqx').score,
        wgtpzqx: this.scoreItems.find(i => i.key === 'wgtpzqx').score,
        wtypzqx: this.scoreItems.find(i => i.key === 'wtypzqx').score,
        xmjlzqx: this.scoreItems.find(i => i.key === 'xmjlzqx').score,
        xmlcwzx: this.scoreItems.find(i => i.key === 'xmlcwzx').score,
        ssfazqx: this.scoreItems.find(i => i.key === 'ssfazqx').score,
        pszlwzx: this.scoreItems.find(i => i.key === 'pszlwzx').score,
      }).then(res => {
        if (res.success) {
          this.$message.success(`评分已提交，总分 ${this.totalScore} 分`);
          this.panelVisible = false;
          this.$emit('close');
        }
      })
      console.log('测评评分：', result);
      // this.$message.success(`评分已提交，总分 ${this.totalScore} 分`);
      // this.panelVisible = false;
    }
  }
};
</script>

<style scoped>
.score-root {
  position: fixed;
  z-index: 2100;
}

.score-ball {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  color: #fff;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.score-ball:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(22, 119, 255, 0.55);
}

.score-ball--active {
  background: linear-gradient(135deg, #0958d9, #003eb3);
}

.score-ball i {
  font-size: 19px;
  line-height: 1;
}

.score-ball-text {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.score-panel {
  position: absolute;
  left: 62px;
  top: 50%;
  transform: translateY(-65%);
  width: 318px;
  background: #fff;
  border: 1px solid #dcdfe6;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.score-panel-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #1677ff;
  color: #fff;
}

.score-panel-title {
  font-size: 14px;
  font-weight: 700;
}

.score-total-mini {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 2px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
}

.score-total-mini strong {
  font-size: 16px;
}

.score-total-mini span {
  font-size: 12px;
}

.score-panel-close {
  cursor: pointer;
  font-size: 14px;
  opacity: 0.85;
}

.score-panel-close:hover {
  opacity: 1;
}

.score-panel-body {
  padding: 10px 12px;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-item {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.score-item:last-child {
  border-bottom: none;
}

.score-item-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1b2f52;
  font-size: 13px;
  font-weight: 700;
}

.score-index {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #e8f2ff;
  color: #1677ff;
  font-size: 13px;
}

.score-name {
  white-space: nowrap;
}

.score-panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid #edf2fb;
  background: #f8faff;
}

.score-panel-enter-active,
.score-panel-leave-active {
  transition: all 0.22s ease;
}

.score-panel-enter,
.score-panel-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px);
}
</style>
