<template>
  <aside class="exam-sidebar">
    <el-menu :default-active="active" class="exam-element-menu" aria-label="考试系统菜单" @select="$emit('select', $event)">
      <el-menu-item-group v-for="group in groups" :key="group.label">
        <template slot="title">{{ group.label }}</template>
        <el-menu-item v-for="item in group.items" :key="item.key" :index="item.key" :disabled="item.disabled">
          <i :class="item.icon"></i>
          <span slot="title" class="menu-item-title"><span class="menu-item-label">{{ item.label }}</span><el-badge
              v-if="item.badge" :value="item.badge" class="menu-element-badge"></el-badge></span>
        </el-menu-item>
      </el-menu-item-group>
    </el-menu>
  </aside>
</template>

<script>
export default {
  name: 'ExamSidebar',
  props: {
    groups: { type: Array, required: true },
    active: { type: String, required: true }
  }
};
</script>
