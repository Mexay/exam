<template>
  <div class="ranking-scroll">
    <div v-for="(item, index) in items" :key="item.name" :class="['ranking-row', `rank-${index + 1}`]">
      <div class="ranking-position"><i v-if="index < 3" class="el-icon-trophy"></i><span v-else>{{ index + 1 }}</span>
      </div>
      <div class="ranking-content">
        <div><strong>{{ item.name }}</strong><small>{{ item.detail }}</small></div>
        <span class="ranking-track"><i :style="{ width: barWidth(item.score) }"></i></span>
      </div>
      <strong class="ranking-score">{{ item.score }}<small>分</small></strong>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RankingBars',
  props: { items: { type: Array, required: true } },
  methods: {
    barWidth(score) { return `${Math.max(0, Math.min(100, Number(score) || 0))}%`; }
  }
};
</script>
