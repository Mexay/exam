<template>
  <div class="cartItemContainTheme">
    <div class="top-bar">
      <div class="line-group">
        <button type="primary" class="year-pill" :class="[{ active2026: saveYear === '2026' }]" @click="changeYear('2026')">现状年</button>
        <!-- <button type="primary" class="year-pill" :class="[{ active2027: saveYear === '2027' }]" @click="changeYear('2027')">规划年</button> -->
      </div>
      <div class="icon-group">
        <ul>
          <li v-for="(item, index) in huituList" :key="index" @click="huituClick(item)" :class="{ active: item.name == activeHuitu.name }" 
            :title="item.name">
            <img :src="require(`../../../components/wgdjModel/images/wjgh/${item.src}.png`)" />
          </li>
        </ul>
      </div>
      <div class="btn-group"> 
        <p class="btn" @click="close">退出</p>
      </div>
    </div>
    <div class="tool-pill" @click="operateBtnClick({title: '选择',class: 'thumb'})" style="left: 79vw;cursor: pointer;" v-show="activeOperate.title == '绘制'">
      <i class="el-icon-error" style="font-size: 14px;"></i>
      <span>取消绘制</span>
    </div>
    <div class="tool-pill" v-if="activeOperate.title == '绘制'" style="top: 87vh;left: 34vw;">
      <i class="el-icon-warning-outline"></i>
      <span>{{ ['jkxl', 'dlxl'].includes(activeHuitu.type) ? '双击结束绘制，请连接一个设备到两外一个设备上' : '单击绘制设备'}}</span>
    </div>
    <div class="tool-pill" v-if="activeOperate.title">
      <span class="dot"></span>
      <span>{{ activeOperate.title == '选择' ? '选择模式' : '绘制模式' }}</span>
      <span v-if="activeOperate.title == '选择'">{{ saveDialog ? '选中设备：' + saveTitle : '' }}</span>
      <span v-if="activeOperate.title == '绘制'">{{ '正在绘制：'+ activeHuitu.name }}</span>
    </div>
    <div class="main-step">
      <aside class="distribution-grid-sidebar">
        <section class="sidebar-panel steps-panel">
          <h2 class="panel-title">绘制步骤</h2>
          <p class="panel-hint">点击步骤可展开对应层级</p>
 
          <div class="steps-list">
            <div
              v-for="step in steps"
              :key="step.level"
              class="step-row"
              :class="{ active: activeStep === step.level }"
              @click="handleStepClick(step.level)"
            >
              <span class="step-badge">{{ step.level }}</span>
              <span class="step-text">
                <strong class="step-name">{{ step.name }}</strong>
                <span class="step-desc">{{ step.description }}</span>
              </span>
            </div>
          </div>
        </section>
 
        <section class="sidebar-panel relation-panel">
          <div>
            <h2 class="panel-title">层级关系</h2>
            <p class="panel-hint">网格 / 变电站 / 线路 / 分类 / 设备</p>
          </div>
        </section>
 
        <div class="sidebar-tree">
          <p v-if="!gridData.length" class="empty-hint">暂无数据</p>
          <div v-for="grid in gridData" :key="grid.fid" class="tree-node">
            <div class="tree-row" @click="toggleNode('grid', grid, 'grid-' + grid.fid)">
              <span class="tree-arrow" :class="{ expanded: expandedKeys['grid-' + grid.fid] }">›</span>
              <img width="14" height="14" :src="require(`../../../components/wgdjModel/images/wjgh/wg.png`)" />
              <span class="tree-name" :title="grid.name" @click.stop="selectFeature(grid, '', '', '', 'grid')">{{ grid.name }}</span>
              <span class="tree-tag grid-tag">网格</span>
            </div>
            <div v-show="expandedKeys['grid-' + grid.fid]" class="tree-children">
              <div v-for="station in grid.bdzEl || []" :key="station.id" class="tree-node">
                <div class="tree-row" @click="toggleNode('substation', station, 'substation-' + station.id)">
                  <span class="tree-arrow" :class="{ expanded: expandedKeys['substation-' + station.id]}">›</span>
                  <img width="14" height="14" :src="require(`../../../components/wgdjModel/images/wjgh/${station.type}.png`)" />
                  <span class="tree-name" :title="station.name" @click.stop="selectFeature(grid, station, '', '', 'bdz')">{{ station.name }}</span>
                  <span class="tree-tag station-tag">变电站</span>
                </div>
                <div v-show="expandedKeys['substation-' + station.id]" class="tree-children">
                  <div v-for="line in station.xlEls || []" :key="line.id" class="tree-node">
                    <div class="tree-row" @click="toggleNode('line', line, 'line-' + line.id)">
                      <span class="tree-arrow" :class="{ expanded: expandedKeys['line-' + line.id] }">›</span>
                      <img width="14" height="14" :src="require(`../../../components/wgdjModel/images/wjgh/xl.png`)" />
                      <span class="tree-name" :title="line.name" @click.stop="selectFeature(grid, station, line, '', 'xl')">{{ line.name }}</span>
                      <span class="tree-tag line-tag">线路</span>
                    </div>
                    <div v-show="expandedKeys['line-' + line.id]" class="tree-children">
                      <div v-for="(devices, group) in line.childs || {}" :key="group" class="tree-node">
                        <div class="tree-row" @click="toggleDeviceGroup(group, devices, 'device-group-' + line.id + '-' + group)">
                          <span class="tree-arrow" :class="{ expanded: expandedKeys['device-group-' + line.id + '-' + group] }">›</span>
                          <img width="14" :src="require(`../../../components/wgdjModel/images/wjgh/${group}.png`)" />
                          <span class="tree-name" :title="huituList.find(item => item.src == group).name">{{ huituList.find(item => item.src == group).name }}</span>
                          <span class="tree-tag" 
                          :style="{ color: deviceColors[group] || '#6B7686', background: (deviceColors[group] || '#6B7686') + '1A'}">
                            {{ huituList.find(item => item.src == group).name }}
                          </span>
                        </div>
                        <div v-show="expandedKeys['device-group-' + line.id + '-' + group]" class="tree-children">
                          <div v-for="device in devices" :key="group + '-' + device.id" class="tree-row device-row" @click="handleDeviceClick(device)">
                            <span class="tree-arrow"></span>
                            <img width="14" :src="require(`../../../components/wgdjModel/images/wjgh/${device.type}.png`)" />
                            <span class="tree-name" :title="device.name" @click.stop="selectFeature(grid, station, line, device, device.type)">{{ device.name }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
    <div class="main">
      <!-- <div class="tab-item" style="border-bottom: 1px solid #e3e8ef;">
        <div class="right-title">绘制与编辑的注意事项</div>
        <div class="help-text">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">「网格」是绘制面，「架空线路」、「电缆线路」是绘制线路，其他组件均为绘制点</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">请先绘制点，再绘制线路去连接点</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">绘制线路双击结束绘制</div>
          </div>
          <div class="step">
            <div class="step-num">4</div>
            <div class="step-text">绘制线路首尾必须落在点上，否则会导致绘制失败</div>
          </div>
        </div>
      </div> -->
      <div class="tab-item">
        <div class="right-title">对象信息</div>
        <div class="tip" v-show="!saveDialog && !saveLineDialog"> <i class="el-icon-warning-outline"></i> 提示：未选中对象，点击地图要素或左侧层级关系，查看属性</div>
        <div class="context" v-if="saveDialog">
          <el-form ref="form" disabled>
            <div v-if="activeData.type.indexOf('bdz') > -1">
              <el-form-item label="变电站名称">
                <el-input v-model="saveData.name" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <el-form-item label="电压等级" v-if="activeData.type != 'bdz-del'">
                <el-input v-model="saveData.dydj" disabled size="small"></el-input>
              </el-form-item>
              <el-form-item label="投运日期">
                <el-date-picker
                  v-model="saveData.startTime"
                  type="date"
                  placeholder="选择日期"
                  format="yyyy-MM-dd"
                  value-format="yyyy-MM-dd"
                  size="small">
                </el-date-picker>
              </el-form-item>
              <el-form-item label="出线母线">
                <el-select v-model="saveData.startMx" size="small" placeholder="请选择">
                  <el-option v-for="(item, index) in ['母线一', '母线二']" :key="index" :label="item" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="占地面积">
                <el-input v-model="saveData.area" size="small"></el-input>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="saveData.jsdzType" size="small"></el-input>
              </el-form-item>
            </div>
            <div v-else-if="activeData.type.indexOf('xl') > -1">
              <el-form-item label="线路名称">
                <el-input v-model="saveData.name" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <el-form-item label="起始站点">
                <el-input v-model="saveData.startPoint" disabled size="small"></el-input>
              </el-form-item>
              <el-form-item label="结束站点">
                <el-input v-model="saveData.endPoint" disabled size="small"></el-input>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="saveData.jsdzType" size="small"></el-input>
              </el-form-item>
            </div>
            <div v-else-if="activeData.type.indexOf('wg') > -1">
              <el-form-item label="网格名称" class="is-required">
                <el-input v-model="gridForm.name" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <el-form-item label="区域等级" class="is-required">
                <el-select placeholder="请选择" v-model="gridForm.qydj" size="small">
                  <el-option :label="item" :value="item" v-for="(item, index) in areaTypeOption" :key="index">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="网格等级" class="is-required">
                <el-select placeholder="请选择" v-model="gridForm.no" size="small">
                  <el-option :label="item.name" :value="item.value" v-for="(item, index) in wgTypeOption" :key="index">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="所属地市" class="is-required">
                <el-select placeholder="请选择" v-model="gridForm.ssdsId" :popper-append-to-body="false" size="small">
                  <el-option v-for="(item, index) in dishiAreaList" :key="index" :label="item.key + '市'"
                    :value="item.ssds_id" @click.native="getXianList(index)"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="县(分)公司" class="is-required">
                <el-input v-model="gridForm.yxdw" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <el-form-item label="供电所" class="is-required">
                <el-input v-model="gridForm.gds" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="gridForm.remark" type="textarea" size="small" :autosize="{ minRows: 3 }" placeholder="请输入内容"></el-input>
              </el-form-item>
            </div>
            <div v-else>
              <el-form-item label="名称">
                <el-input v-model="saveData.name" placeholder="请输入名称" size="small"></el-input>
              </el-form-item>
              <!-- <el-form-item label="出线母线数">
                <el-input v-model="saveData.startMxNum" size="small"></el-input>
              </el-form-item>
              <el-form-item label="进线母线数">
                <el-input v-model="saveData.endMxNum" size="small"></el-input>
              </el-form-item> -->
            </div>
          </el-form>
          <div class="bottom" v-if="false">
            <p class="btn1" @click="deleteItem()" v-if="saveType == 'update'">删除</p>
            <p class="btn1 save" @click="addOrUpdate()" v-loading="loading">保存</p>
          </div>
        </div>
        <div class="context" v-if="saveLineDialog">
          <el-form ref="form" disabled>
            <el-form-item label="名称" class="is-required">
              <el-input v-model="lineForm.name" placeholder="请输入名称" size="small"></el-input>
            </el-form-item>
            <el-form-item label="所属地市" class="is-required">
              <el-select placeholder="请选择" v-model="lineForm.ssdsId" size="small">
                <el-option v-for="(item, index) in dishiAreaList" :key="index" :label="item.key + '市'"
                  :value="item.ssds_id" @click.native="getXianList(index)"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="县(分)公司" class="is-required">
              <el-select placeholder="请选择" v-model="lineForm.yxdwId" size="small">
                <el-option v-for="(item, index) in xianAreaList" :key="index" :label="item.yxdwmc" :value="item.yxdw"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="lineForm.remark" type="textarea" size="small" :autosize="{ minRows: 3 }"
                placeholder="请输入内容"></el-input>
            </el-form-item>
          </el-form>
          <div class="bottom" v-if="false">
            <p class="btn1" v-if="lineForm.id" @click="deleteLine()">删除</p>
            <p class="btn1" v-if="!lineForm.id" @click="cancelLine()">取消</p>
            <p class="btn1 save" @click="saveLine()">{{ lineForm.id ? '保存修改' : '保存新增' }}</p>
          </div>
        </div>
      </div>
    </div>
    <leftPopupTuli class="tuliZgx" :title="'图例'" @closeTuli="closeTuli">
      <template slot="content">
        <div class="context">
          <div class="legend" v-for="(legend, index) in tuliList2" :key="index" :class="legend.isActive ? 'active' : ''" @click="changeDraw(legend)">
            <span class="tip">{{ legend.tip }}</span>
            <el-switch v-model="legend.isActive"  @change="changeDraw(legend)" size="mini" active-color="#6b95ed"></el-switch>
          </div>
        </div>
      </template>
    </leftPopupTuli>
  </div>
</template>

<script>
import Popup from '../../../components/wjghModel/popup.vue'
import leftPopup from '../../../dragPopup/index.vue'
import selectMx from '../../../components/wjghModel/selectMx.vue'
import QueryPointOnMove from './useMoveQueryPoint.js'
import DrawTpLine from './drawLine.js'
import { getWjByGrid, createWjMl, addPoint, deletePoint2, replacePoint, getElementTree } from '@/api/pwgh/examWjghNew'
import WKT from 'terraformer-wkt-parser'
import { getDishiAreaListAdd } from '@/api/pwgh/xqkNew'
import { shiOption } from '@/components/ghsjPanel/json'
import leftPopupTuli from "@/components/ghsjPanel/dragPopup/indexTuli.vue";
import { getAllGrids, getLineByDkxId } from "@/api/pwgh/examIndex";
import common from '../../../common.js'
import { getGdsWjfx } from '@/api/pwgh/xzfxNewMonth'

export default {
  props: {
    regionId: {
      type: String,
      default: '8a0a8b8c4cf9f689014cf9f6babe060c'
    },
    yxdwId: {
      type: String,
      default: ''
    },
    activeRow: {
      type: Object
    },
    xlDatas: {
      type: Array,
      default: []
    },
    mode: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      common,
      addWtModel: false,
      //绘图
      huituList: [
        {
          name: '架空线路',
          src: 'jkxl',
          type: 'jkxl',
        },
        {
          name: '电缆线路',
          src: 'dlxl',
          type: 'dlxl',
        },
        {
          name: '联络开关',
          src: 'llkg',
          type: 'llkg',
        },
        {
          name: '分段开关',
          src: 'fdkg',
          type: 'fdkg',
        },
        {
          name: '分支开关',
          src: 'fzkg',
          type: 'fzkg',
        },
        // {
        //   name: '10kV变电站',
        //   src: 'bdz10kv',
        //   type: 'bdz10kv',
        // },
        {
          name: '35kV变电站',
          src: 'bdz35kv',
          type: 'bdz35kv',
        },
        {
          name: '110kV变电站',
          src: 'bdz110kv',
          type: 'bdz110kv',
        },
        {
          name: '杆塔',
          src: 'gt2022',
          type: 'gt2022',
        },
        {
          name: '柱上变',
          src: 'zsb',
          type: 'zsb',
        },
        {
          name: '配电室',
          src: 'pds',
          type: 'pds',
        },
        {
          name: '环网框',
          src: 'hwk',
          type: 'hwk',
        },
        {
          name: '开闭所',
          src: 'kbs',
          type: 'kbs',
        },
        // {
        //   name: '删除架空线路',
        //   src: 'jkxl-del',
        //   type: 'jkxl-del',
        // },
        // {
        //   name: '删除电缆线路',
        //   src: 'dlxl-del',
        //   type: 'dlxl-del',
        // },
        // {
        //   name: '删除联络开关',
        //   src: 'llkg-del',
        //   type: 'llkg-del',
        // },
        // {
        //   name: '删除分段开关',
        //   src: 'fdkg-del',
        //   type: 'fdkg-del',
        // },
        // {
        //   name: '删除分支开关',
        //   src: 'fzkg-del',
        //   type: 'fzkg-del',
        // },
        // {
        //   name: '删除柱上变',
        //   src: 'zsb-del',
        //   type: 'zsb-del',
        // },
        // {
        //   name: '删除配电室',
        //   src: 'pds-del',
        //   type: 'pds-del',
        // },
        // {
        //   name: '删除环网框',
        //   src: 'hwk-del',
        //   type: 'hwk-del',
        // },
        // {
        //   name: '删除开闭所',
        //   src: 'kbs-del',
        //   type: 'kbs-del',
        // },
        // {
        //   name: '删除变电站',
        //   src: 'bdz-del',
        //   type: 'bdz-del',
        // }
      ],
      activeHuitu: '',
      drawPoint: {},
      clickFeatureLayer: [],
      operateBtn: [
        {
          title: '选择',
          class: 'thumb',
        },
        {
          title: '绘制',
          class: 'edit',
        },
      ],
      activeOperate: {
        title: '选择',
        class: 'thumb',
      },
      //绘图对象
      drawPolyline: '',
      editFeatureStart: {},
      editFeatureChange: {},
      loading: false,
      loadingDraw: false,
      tuliList: [
        {
          color: '#ffba00',
          active: false,
          name: "2026",
        },
        {
          color: '#13ce66',
          active: false,
          name: "2027",
        },
        {
          color: '#0396fd',
          active: true,
          name: "2028",
        }
      ],
      featuresText: [],
      saveYear: '2026',
      wjMlList: '',
      //修改线条名称
      lineName: '',
      //新版绘制
      startPoint: {},
      endPoint: {},
      queryPoint: {},
      startId: '',
      endId: '',
      vm: {},
      startMx: '',
      endMx: '',
      saveDialog: false,
      drawFeatureEnd: '',//绘制结束时保存的数据
      saveData: {},
      activeData: {},
      saveType: 'add',
      layers: [],
      addPointList: [],
      gridForm: {
        duration: '',
        name: '',
        no: '',
        area: '',
        charger: '',
        remark: '',
        ssdsId: '',
        parentarea: '',
        yxdw: '',
        yxdwId: '',
        qydj: '',//区域等级
        gds: '',
        gdsId: ''
      },
      areaTypeOption: ['A+', 'A', 'B', 'C', 'D', 'E'],
      dishiAreaList: [],//地市下拉框
      xianAreaList: [],//县下拉框
      gdsList: [],//供电所下拉,
      features: '',
      shiOption: shiOption,
      //线路信息
      lineForm: {
        name: '',
        remark: '',
        yxdw: '',
        yxdwId: '',
        ssdsId: '',
        gridId: '',
        stationId: '',
        stationName: ''
      },
      //控制图例
      tuliList2: [],
      wgTypeOption: [{
        name: '蓝色',
        value: '#b7ceff',
        outline: '#2196f3'
      }, {
        name: '黄色',
        value: '#ffedb1',
        outline: '#fbcc3f'
      }, {
        name: '红色',
        value: '#ff8d81',
        outline: '#f44336'
      }],
      gridList: [],
      //树形结构
      gridData: [],
      activeStep: 4,
      expandedKeys: {},
      steps: [
        { level: 1, name: '网格（面）', description: '勾勒供电网格区域' },
        { level: 2, name: '变电站', description: '在网格内放置变电站' },
        { level: 3, name: '线路', description: '由变电站引出配电线路' },
        {
          level: 4,
          name: '线路设备',
          description: '沿线路挂接环网柜/开关等'
        }
      ],
      deviceColors: {
        hwk: '#10B981',
        kbs: '#8B5CF6',
        fdkg: '#06B6D4',
        gt2022: '#EF4444',
        dlxl: '#2563EB',
        jkxl: '#2563EB',
        pds: '#F59E0B',
        llkg: '#14B8A6',
        fzkg: '#84cc16',
        zsb: '#EC4899'
      },
      saveLineDialog: false
    }
  },
  components: { Popup, leftPopup, selectMx, leftPopupTuli },
  mounted () {
    this.initData()
    this.getElementTree()
    let that = this
    sgdps1.map.on('click', function (e, f) {
      //绘制点
      if (that.activeOperate.title == '绘制' && that.activeHuitu && that.activeHuitu.type != 'jkxl' && that.activeHuitu.type != 'dlxl' && that.activeHuitu.type != 'wg') {
        var data = {features: []}
        data.features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [e.lngLat.lng, e.lngLat.lat]
          }
        })
        that.drawFeatureEnd = data
        // that.saveDialog = true
        if(that.activeHuitu.type.indexOf('bdz') > -1) {
          that.saveData = {
            name: that.activeHuitu.name,
            dydj: that.activeHuitu.type.split('bdz')[1] == '-del' ? '' : that.activeHuitu.type.split('bdz')[1],
            startTime: '',
            startMx: '母线一',
            area: ''
          }
        } else {
          that.saveData = {
            name: that.activeHuitu.name,
            startMxNum: '',
            endMxNum: ''
          }
        }
        that.saveType = 'add'
        that.activeData = {
          type: that.activeHuitu.type
        }
        that.clickFeatureLayer = []
        that.addOrUpdate()
      }
      //选择模式
      if (that.activeOperate.title == '选择') {
        //监控点击了网架规划-draw-点  设置选中状态
        let feature1 = [], feature2 = [], wgFeature = []
        if (typeof sgdps1.map.getSource('网架规划-draw-点') != 'undefined') {
          feature1 = sgdps1.map.queryRenderedFeatures(e.point, {
            layers: ['网架规划-draw-点'],
          })
        }
        if (typeof sgdps1.map.getSource(`网架规划-draw-变电站`) != 'undefined') {
          let feature = sgdps1.map.queryRenderedFeatures(e.point, {
            layers: [`网架规划-draw-变电站`],
          })
          feature1.push(...feature)
        }
        if (typeof sgdps1.map.getSource('网架规划-draw-线') != 'undefined') {
          feature2 = sgdps1.map.queryRenderedFeatures(e.point, {
            layers: ['网架规划-draw-线'],
          })
        }
        that.xlDatas.forEach((item)=> {
          if (typeof sgdps1.map.getSource(`网架规划-draw-点-${item.id}`) != 'undefined') {
            let feature = sgdps1.map.queryRenderedFeatures(e.point, {
              layers: [`网架规划-draw-点-${item.id}`],
            })
            feature1.push(...feature)
          }
          if (typeof sgdps1.map.getSource(`网架规划-draw-线-${item.id}`) != 'undefined') {
            let feature = sgdps1.map.queryRenderedFeatures(e.point, {
              layers: [`网架规划-draw-线-${item.id}`],
            })
            feature2.push(...feature)
          }
        })
        if (typeof sgdps1.map.getSource('网格') != 'undefined') {
          wgFeature = sgdps1.map.queryRenderedFeatures(e.point, {
            layers: ['网格'],
          })
        }

        that.clearSelectState()
        if (feature1.length > 0) {
          if(feature1[0].properties.year == '考官') {
            that.saveType = 'view'
          } else {
            that.saveType = 'update'
          }
          that.removeLayers('选中元素')
          that.activeData = feature1[0].properties
          that.clickFeatureLayer = feature1
          //点击线路，打开详情  修改线路名称
          that.saveDialog = true
          if(feature1[0].properties.type.indexOf('bdz') > -1) {
            that.saveData = {
              name: feature1[0].properties.name,
              dydj: feature1[0].properties.type.split('bdz')[1] == '-del' ? '' : feature1[0].properties.type.split('bdz')[1],
              startTime: feature1[0].properties.startTime,
              startMx: feature1[0].properties.startMx,
              area: feature1[0].properties.area,
              jsdzType: feature1[0].properties.jsdzType
            }
          } else {
            that.saveData = {
              name: feature1[0].properties.name,
              startMxNum: feature1[0].properties.startMxNum,
              endMxNum: feature1[0].properties.endMxNum
            }
          }
          that.fitFeatures(feature1[0])
          return
        } else if (feature2.length > 0) {
          if(feature2[0].properties.year == '考官') {
            that.saveType = 'view'
          } else {
            that.saveType = 'update'
          }
          that.activeData = feature2[0].properties
          that.clickFeatureLayer = feature2
          //点击线路，打开详情  修改线路名称
          that.saveDialog = true
          that.saveData = {
            name: feature2[0].properties.name,
            startPoint: feature2[0].properties.startPoint && feature2[0].properties.startPoint != 'null' ? feature2[0].properties.startPoint : '',
            startMx: feature2[0].properties.startMx && feature2[0].properties.startMx != 'null' ? feature2[0].properties.startMx : '',
            endPoint: feature2[0].properties.endPoint && feature2[0].properties.endPoint != 'null' ? feature2[0].properties.endPoint : '',
            endMx: feature2[0].properties.endMx && feature2[0].properties.endMx != 'null' ? feature2[0].properties.endMx : '',
            jsdzType: feature2[0].properties.jsdzType
          }
          //做选中效果
          that.removeLayers('选中元素')
          sgdps1.addGeometryLine(
            '选中元素',
            {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: feature2[0].geometry.type,
                  coordinates: feature2[0].geometry.coordinates,
                },
                properties: {
                  id: feature2[0].properties.id,
                  name: feature2[0].properties.name,
                }
              }],
            },
            {
              style: {
                lineColor: '#8a00b7',
                lineOpacity: 1,
                lineWidth: 5,
                textField: '{name}',
                textSize: 18,
                textColor: '#0099ff',
                textHaloWidth: 10,
              }
            }
          )
          that.fitFeatures(feature2[0])
          return
        } else if (wgFeature.length > 0) {
          var grid = that.gridList.find(item=> item.fid == wgFeature[0].properties.id)
          that.saveType = 'view'
          var params = JSON.parse(wgFeature[0].properties.params)
          that.features = wgFeature[0].geometry

          that.gridForm = {
            duration: params.duration,
            name: params.name,
            no: params.no,
            area: params.area,
            charger: params.charger,
            remark: params.remark,
            ssdsId: params.ssdsId,
            fid: params.fid,
            yxdw: params.yxdw,
            yxdwId: params.yxdwId,
            qydj: params.qydj,
            gds: params.gds,
            gdsId: params.gdsId,
            remark: params.remark ? params.remark : ''
          }
          that.activeData = { type: 'wg' }
          that.saveDialog = true
          let fea = { geometry: WKT.parse(grid.reshape) }
          that.fitFeatures(fea)
        }
      }
    })
  },
  methods: {
    fitFeatures(feature, isFit) {
      this.removeLayers('选中元素')
      let geom = feature.geometry
      if(geom.type == 'Polygon') {
          // sgdps1.addGeometryPolygon(
          //   '选中元素',
          //   {
          //     type: 'FeatureCollection',
          //     features: [{
          //       type: 'Feature',
          //       geometry: geom
          //     }]
          //   },
          //   {
          //     style: {
          //       fillColor: '#d291e7',
          //       fillOpacity: 0.8,
          //       outline: '#8a00b7',
          //       textField: '{name}',
          //       textSize: 12,
          //       textColor: '#ffffff'
          //     },
          //     issText: false,
          //   }
          // )
          // if(isFit) {
          //   sgdps1.map.jumpTo({center: common.getGeometryCenter(geom), zoom: 15 })
          // }
      } else if(geom.type == 'LineString' || geom.type == 'MultiLineString') {
        sgdps1.addGeometryLine(
          '选中元素',
          {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: geom,
              properties: {
                name: feature.properties.name
              }
            }],
          },
          {
            style: {
              lineColor: '#8a00b7',
              lineOpacity: 1,
              lineWidth: 5,
              textField: '{name}',
              textSize: 18,
              textColor: '#0099ff',
              textHaloWidth: 10,
            }
          }
        )
        if(isFit) {
          sgdps1.map.jumpTo({center: common.getGeometryCenter(geom), zoom: 11 })
        }
      } else if(geom.type == 'Point') {
        sgdps1.addGeometryPoint(
          '选中元素',
          {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: geom,
              properties: {
                url: `./static/ztImg/pwgh/active_wj.png`
              }
            }]
          },
          {
            style: {
              iconOffset: [0, 0],
              iconAnchor: 'center',
              iconSize: 0.6
            },
            issText: false,
          }
        )
        if(isFit) {
          sgdps1.map.jumpTo({center: geom.coordinates, zoom: 14 })
        }
      }
    },
    initData () {
      getDishiAreaListAdd().then((res) => {
        this.dishiAreaList = res.data
        // setTimeout(() => {
        //   this.getWj(this.saveYear)
        // }, 100);
      })
      this.tuliList2 = this.xlDatas.map(item => {
        return {
          tip: item.name,
          id: item.id,
          isActive: true
        }
      })
      getAllGrids({ cjId: JSON.parse(localStorage.getItem('ks-active-paper')).cjId || '20cbbb26-1a10-4c01-a09b-c3f38643de1c' }).then(res => {
        if (res.success) {
          this.gridList = res.data
        }
      })
    },
    getLineColor (type, year) {
      if (type == 'jkxl-del' || type == 'dlxl-del') {
        return '#999'
      } else {
        let index = this.tuliList.findIndex(item => item.name == year)
        return this.tuliList[index].color
      }
    },
    //查询绘制网架
    getWj (year, flag) {
      if(year == this.saveYear && !flag) {
        this.loadingDraw = this.$loading({
          lock: true,
          text: "加载中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.3)",
          target: document.querySelector('#app')
        });
      }
      //绘制网架
      this.removeLayers(`网架规划-draw-点,网架规划-draw-线`)
      if (this.drawPolyline) {
        this.drawPolyline.remove()
      }
      var param = {
        sswjId: this.activeRow.id, year: year
      }
      setTimeout(() => {
        //撒点撒线
        getWjByGrid(param).then((res) => {
          if (res.success) {
            //判断有没有年份目录 没有的要新建目录
            var mlYear = []
            res.data.forEach(item => {
              mlYear.push(item.year)
            })
            if (mlYear.indexOf(year) == -1) {
              let param = {
                id: this.activeRow.id,
                year: year,
                createUser:JSON.parse(localStorage.getItem('ks-user-info')).id,
              }
              createWjMl(param).then((res) => {
                if (res.success) {
                  if(year == this.saveYear) {
                    this.wjMlList = {
                      year: year,
                      id: res.data.id
                    }
                  }
                }
              })
            }
            let featuresPoint = []
            let featuresLine = []
            if (res.data.length > 0) {
              if(year == this.saveYear) {
                this.wjMlList = {
                  year: res.data[0].year,
                  id: res.data[0].id
                }
              }
              var drawData = res.data[0].ghWjghElementList ? res.data[0].ghWjghElementList : []
              for (var i = 0; i < drawData.length; i++) {
                var geojson = WKT.parse(drawData[i].geom)
                if (drawData[i].type == 'jkxl' || drawData[i].type == 'dlxl') {
                  featuresLine.push({
                    type: 'Feature',
                    geometry: {
                      type: 'LineString',
                      coordinates: geojson.coordinates,
                    },
                    properties: {
                      id: drawData[i].id,
                      name: drawData[i].name,
                      type: drawData[i].type,
                      lineColor: this.getLineColor(drawData[i].type, res.data[0].year),
                      // startId: drawData[i].startId,
                      startType: drawData[i].startType,
                      // endId: drawData[i].endId,
                      connection: drawData[i].connection,
                      endType: drawData[i].endType,
                      startPoint: drawData[i].startPoint,
                      startMx: drawData[i].startMx,
                      endPoint: drawData[i].endPoint,
                      endMx: drawData[i].endMx,
                      year: drawData[i].year,
                      dasharray: drawData[i].type == 'jkxl' ? [2, 0] : [2, 2]
                    },
                  })
                } else if (['llkg', 'fdkg', 'fzkg', 'bdz10kv', 'bdz35kv', 'bdz110kv', 'zsb', 'pds', 'hwk', 'kbs', 'gt2022'].indexOf(drawData[i].type) != -1) {
                  if(['bdz10kv', 'bdz35kv', 'bdz110kv', 'gt2022'].indexOf(drawData[i].type) != -1) {
                    featuresPoint.push({
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: geojson.coordinates,
                      },
                      properties: {
                        id: drawData[i].id,
                        name: drawData[i].name,
                        type: drawData[i].type,
                        url: require(`../../../components/wgdjModel/images/wjgh/${drawData[i].imgUrl}.png`),
                        // startId: drawData[i].startId,
                        startType: drawData[i].startType,
                        // endId: drawData[i].endId,
                        endType: drawData[i].endType,
                        startTime: drawData[i].startTime,
                        startMx: drawData[i].startMx,
                        area: drawData[i].area,
                        connection: drawData[i].connection,
                        year: drawData[i].year
                      },
                    })
                  } else {
                    featuresPoint.push({
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: geojson.coordinates,
                      },
                      properties: {
                        id: drawData[i].id,
                        name: drawData[i].name,
                        type: drawData[i].type,
                        url: require(`../../../components/wgdjModel/images/wjgh/${drawData[i].imgUrl + drawData[i].year}.png`),
                        // startId: drawData[i].startId,
                        startType: drawData[i].startType,
                        // endId: drawData[i].endId,
                        endType: drawData[i].endType,
                        startMxNum: drawData[i].startMxNum,
                        endMxNum: drawData[i].endMxNum,
                        connection: drawData[i].connection,
                        year: drawData[i].year
                      },
                    })
                  }
                }
              }
              setTimeout(() => {
                sgdps1.addGeometryLine(
                  `网架规划-draw-线`,
                  {
                    type: 'FeatureCollection',
                    features: featuresLine
                  },
                  {
                    paint: {
                      "line-color": ["get", "lineColor"],
                      "line-width": 3,
                      "line-opacity": 1,
                      'line-dasharray': ["get", "dasharray"]
                    },
                    style: {
                        textHaloColor: '#fff',
                        textColor: '#7e8a9f',
                        textHaloWidth: 1
                    },
                    layout: {
                      visibility:'visible'
                    },
                    issText: true
                  }
                )
                sgdps1.addGeometryPoint(
                  `网架规划-draw-点`,
                  {
                    type: 'FeatureCollection',
                    features: featuresPoint,
                  },
                  {
                    style: {
                      iconOffset: [0, 0],
                      iconAnchor: 'center',
                      iconSize: 0.4,
                      textHaloColor: '#fff',
                      textColor: '#7e8a9f',
                      textHaloWidth: 1,
                      textOffset: [0, 1]
                    },
                    layout: {
                      visibility:'visible'
                    },
                    issText: true,
                    click: (e) => { },
                  }
                )
              }, 200)
            } else {
              this.loadingDraw.close()
            }
            //初始化线条画笔
            this.initDraw().then(()=> {
              this.loadingDraw.close()
            });
            this.activeHuitu = ''
            this.activeOperate = {
              title: '选择',
              class: 'thumb',
            }
          } else {
            this.loadingDraw.close()
          }
        }).catch(()=> {
          console.log('进catch了===');
          
          //初始化线条画笔
          this.initDraw().then(()=> {
            this.loadingDraw.close()
          });
          this.activeHuitu = ''
          this.activeOperate = {
            title: '选择',
            class: 'thumb',
          }
          this.loadingDraw.close()
        })
      }, 1000)
    },
    //关闭拓扑弹窗
    closeAllTpDialog () {
      this.allTpShow = false;
    },
    //关闭保存信息弹窗
    closeSave() {
      this.removeLayers('选中元素')
      this.saveDialog = false
      this.activeHuitu = ''

      this.startPoint = {}
      this.endPoint = {}
      this.gridForm = {
        duration: '',
        name: '',
        no: '',
        area: '',
        charger: '',
        remark: '',
        ssdsId: '',
        yxdw: '',
        yxdwId: '',
        qydj: '',
        gds: '',
        gdsId: ''
      }
      this.activeOperate = {
        title: '选择',
        class: 'thumb',
      }
      if (this.drawPolyline) {
        this.drawPolyline.remove()
      }
    },
    //绘图
    //初始化绘图工具
    initDraw () {
      var isFirst = false
      var that = this
      return new Promise(function (resolve, reject) {
        that.drawPolyline = new DrawTpLine(sgdps1.map)
        that.drawPolyline.on('draw.line.start', data => {
          console.log('开始绘制的监听...', data);
          //获取第一个绘制的点 开启获取地图设备地图监听
          isFirst = true
          that.addPointList = []
          that.layers = []
          if (typeof sgdps1.map.getSource('网架规划-draw-点') != 'undefined') {
            that.layers.push('网架规划-draw-点')
          }
          that.xlDatas.forEach((item)=> {
            if (typeof sgdps1.map.getSource(`网架规划-draw-点-${item.id}`) != 'undefined') {
              that.layers.push(`网架规划-draw-点-${item.id}`)
            }
          })
          that.queryPoint = new QueryPointOnMove({layers: that.layers, map: sgdps1.map})
        })
        that.drawPolyline.on('draw.line.addPoint', data => {
          if(that.queryPoint.feature) {
            that.addPointList.push(that.queryPoint.feature)
          }
          console.log('添加节点的监听...', data);
          if(isFirst) {
            isFirst = false
            if(that.queryPoint.feature) {
              that.startPoint = that.queryPoint.feature
            } else {
              that.$message.warning('当前选择设备无效!');
              that.activeHuitu = ''
              that.activeOperate = {
                title: '选择',
                class: 'thumb',
              }
              that.queryPoint.destroy()
              if (that.drawPolyline) {
                that.drawPolyline.remove()
              }
            }
          }
        })
        that.drawPolyline.on('draw.line.end', data => {
          console.log('结束绘制的监听...', data);
          that.saveType = 'add'
          console.log(that.queryPoint);
          
          if(that.queryPoint.feature) {
            that.endPoint = that.queryPoint.feature
            console.log('that.endPoint==================', that.endPoint);
            //打开保存弹窗 保存数据
            that.drawFeatureEnd = data
            // that.saveDialog = true
            that.activeData = that.activeHuitu
            that.saveData = {
              name: that.activeHuitu.name,
              startPoint: that.startPoint.properties.name,
              startMx: that.startMx.name,
              endPoint: Object.keys(that.endPoint).length === 0 ? '' : that.endPoint.properties.name,
              endMx: that.endMx.name
            }
            that.addOrUpdate()
          } else {
            that.$message.warning('当前选择设备无效!');
              that.activeHuitu = ''
              that.activeOperate = {
                title: '选择',
                class: 'thumb',
              }
              that.queryPoint.destroy()
              if (that.drawPolyline) {
                that.drawPolyline.remove()
              }
          }
          //删除地图移动事件
          that.queryPoint.destroy()
        })
        resolve(true)
      })
    },
    //wll
    addOrUpdate() {
      this.loadingDraw = this.$loading({
        lock: true,
        text: "加载中...",
        spinner: "el-icon-loading",
        background: "rgba(0, 0, 0, 0.3)",
        target: document.querySelector('#app')
      });
      if(this.saveType == 'update') {
        var param = {
          geom: WKT.convert(
            this.clickFeatureLayer[0].geometry
          ),
          id: this.clickFeatureLayer[0].properties.id,
          imgUrl: this.clickFeatureLayer[0].properties.type,
          type: this.clickFeatureLayer[0].properties.type,
          year: this.clickFeatureLayer[0].properties.year,
          sswjId: this.wjMlList.id,
          createUser:JSON.parse(localStorage.getItem('ks-user-info')).id,
          startId: this.clickFeatureLayer[0].properties.startId,
          startType: this.clickFeatureLayer[0].properties.startType,
          endId: this.clickFeatureLayer[0].properties.endId,
          endType: this.clickFeatureLayer[0].properties.endType,
          ...this.saveData
        }
        addPoint(param).then((res) => {
          if (res.success) {
            this.saveDialog = false
            this.removeLayers('选中元素')
            this.$message({ type: 'success', message: '保存成功!' })
          }
        }).then(()=> {
          this.getWj(this.saveYear, true)
        })
      } else {
        //删除地图移动搜索设备事件
        if (Object.keys(this.queryPoint).length > 0) this.queryPoint.destroy()
  
        var point = ''
        var data = this.drawFeatureEnd
        var coordinates = ''
        //绘制点
        var drawType = ''
        if(data.features[data.features.length - 1].geometry.type == 'Point') {
          coordinates = data.features[data.features.length - 1].geometry.coordinates
          drawType = 'Point'
        } else {
          //绘制线
          coordinates = data.features[data.features.length - 1].geometry.coordinates[0]
          drawType = 'Line'
          //绘制前获取初始替换点 如果选择的是点  就不需要请求拿点了
          if(Object.keys(this.startPoint).length > 0) {
            let searchFrom = ''
            if(this.startPoint.source == 'wangjia_source') {
              searchFrom = '系统'
            } else {
              searchFrom = '绘图'
            }
            if(searchFrom == '系统' && this.startPoint.geometry.type == 'Point') {
              point = this.startPoint.geometry
              data.features[data.features.length - 1].geometry.coordinates[0] = point.coordinates
            } else if(searchFrom == '绘图' && this.startPoint.geometry.type == 'Point') {
              point = this.startPoint.geometry
              data.features[data.features.length - 1].geometry.coordinates[0] = point.coordinates
            } else {
              replacePoint({
                lineGeom: WKT.convert(this.startPoint.geometry),
                pointGeom: WKT.convert({type: 'Point', coordinates: coordinates})
              }).then((res) => {
                if (res.success) {
                  point = WKT.parse(res.msg)
                  data.features[data.features.length - 1].geometry.coordinates[0] = point.coordinates
                }
              })
            }
          }
          //绘制前获取结束替换点 如果选择的是点  就不需要请求拿点了
          if(Object.keys(this.endPoint).length > 0) {
            let searchFrom = ''
            if(this.endPoint.source == 'wangjia_source') {
              searchFrom = '系统'
            } else {
              searchFrom = '绘图'
            }
            console.log(searchFrom, '-----------', this.endPoint);
            if(searchFrom == '系统' && this.endPoint.geometry.type == 'Point') {
              point = this.endPoint.geometry
              data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 1] = point.coordinates
              data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 2] = point.coordinates
            } else if(searchFrom == '绘图' && this.endPoint.geometry.type == 'Point') {
              point = this.endPoint.geometry
              data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 1] = point.coordinates
              //双击结束-最后两个点相同-也要一起替换
              data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 2] = point.coordinates
            } else {
              replacePoint({
                lineGeom: WKT.convert(this.endPoint.geometry),
                pointGeom: WKT.convert({type: 'Point', coordinates: coordinates})
              }).then((res) => {
                if (res.success) {
                  point = WKT.parse(res.msg)
                  //判断 双击导致的最后两个点相同  则 最后两个点都要替换问题
                  if(data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 1][0] == data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 2][0]) {
                    data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 2] = point.coordinates
                    data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 1] = point.coordinates
                  } else {
                    data.features[data.features.length - 1].geometry.coordinates[data.features[data.features.length - 1].geometry.coordinates.length - 1] = point.coordinates
                  }
                }
              })
            }
          }
        }
  
        setTimeout(() => {
          /**
           * this.searchFrom == '系统'
           * 绘制线路的时候 如果选择的初始点是系统网架  则只需要startId，startType
           * 如果选择的初始点是绘制网架 则需要保存  两外一条数据的endId， endType
           * 
           * 绘制的点  分段开关 两端要连接线路  startId 和 endID 都是线路id 
           * 其他的点  startID 和 endID 都是本身
           */
          //endId 系统自动生成
          var param = {
            geom: WKT.convert(
              data.features[data.features.length - 1].geometry
            ),
            imgUrl: this.activeHuitu.type,
            type: this.activeHuitu.type,
            year: this.saveYear,
            name: this.saveData.name,
            sswjId: this.wjMlList.id,
            createUser: JSON.parse(localStorage.getItem('ks-user-info')).id,
            ...this.saveData,
          }
          if(drawType == 'Point') {
            param.connection = ''
          } else {
            
            if(Object.keys(this.startPoint).length != 0) {
              // if(this.startMx) {
              //   param.startId = this.startMx.psr_id
              //   param.startType = 'mx'
              // } else if(this.startPoint.source == 'wangjia_source') {
              //   param.startId = this.startPoint.properties.sbid
              //   param.startType = this.startPoint.sourceLayer.split('_')[2]
              // } else {
                param.startId = this.startPoint.properties.connection
              // }
            }
            if(Object.keys(this.endPoint).length != 0) {
              // if(this.endMx) {
              //   param.endId = this.endMx.psr_id
              //   param.endType = 'mx'
              // } else if(this.endPoint.source == 'wangjia_source') {
              //   param.endId = this.endPoint.properties.sbid
              //   param.endType = this.endPoint.sourceLayer.split('_')[2]
              // } else {
                param.endId = this.endPoint.properties.connection
              // }
            }
            param.pointIds = this.addPointList.map(item=> item.properties.id).join(',')
          }
          addPoint(param).then((res) => {
            this.loading = false
            if (res.success) {
              this.saveDialog = false
              this.removeLayers('选中元素')
              this.startPoint = {}
              this.endPoint = {}
              this.$message({ type: 'success', message: '保存成功!' })
            }
          }).then(()=> {
            this.getWj(this.saveYear, true)
          })
        }, 2000);
      }
    },
    //点击绘图ICON
    huituClick (item) {
      return
      if(this.mode) return
      this.activeOperate = {
        title: '绘制',
        class: 'edit',
      }
      this.activeHuitu = item

      //判断是绘制线 则需要选择和判断起点 
      if (item.type == 'jkxl' || item.type == 'dlxl' || item.type == 'jkxl-del' || item.type == 'dlxl-del') {
        this.drawPolyline.startDraw()
      }
    },
    //点击绘图操作按钮
    operateBtnClick (item) {
      this.activeHuitu = ''
      this.activeOperate = item
      this.removeLayers('选中元素')
      switch (item.title) {
        case '选择':
          if (Object.keys(this.queryPoint).length > 0) this.queryPoint.destroy()
          if (this.drawPolyline) {
            this.drawPolyline.remove()
          }
          break
        case '绘制':
          break
        default:
          break
      }
    },
    changeYear (val) {
      return
      this.saveYear = val
      this.saveDialog = false
      this.removeLayers('选中元素')
      this.getWj(val)
    },
    removeLayers(str) {
      if(!(typeof sgdps1 != 'undefined' && sgdps1)) { return }
      let layers = str.split(',');
      layers.forEach(item => {
        if (typeof sgdps1.map.getSource(item) != 'undefined') {
          sgdps1.removeLayerById(item);
        }
      })
    },
    deleteItem() {
      this.$confirm('请问是否确定删除，删除后不可恢复？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        deletePoint2({
          elementId: this.clickFeatureLayer[0].properties.id,
          operateUser: JSON.parse(localStorage.getItem('ks-user-info')).id
        }).then((res) => {
          if (res.success) {
            this.$message({ type: 'success', message: '删除成功!' })
            this.saveDialog = false
          }
          this.removeLayers('选中元素')
          this.getWj(this.saveYear)
        })
      })
    },
    closeTuli() {

    },
    close() {
      this.$emit('close')
    },
    changeDraw(legend) {
      legend.isActive = !legend.isActive
      if(typeof sgdps1.map.getSource(`网架规划-draw-点-${legend.id}`) != 'undefined') {
        sgdps1.map.setLayoutProperty(`网架规划-draw-点-${legend.id}`, 'visibility', legend.isActive ? 'visible' : 'none')
        sgdps1.map.setLayoutProperty(`网架规划-draw-点-${legend.id}-sgdps-text`, 'visibility', legend.isActive ? 'visible' : 'none')
      }
      if(typeof sgdps1.map.getSource(`网架规划-draw-线-${legend.id}`) != 'undefined') {
        sgdps1.map.setLayoutProperty(`网架规划-draw-线-${legend.id}`, 'visibility', legend.isActive ? 'visible' : 'none')
        sgdps1.map.setLayoutProperty(`网架规划-draw-线-${legend.id}-sgdps-text`, 'visibility', legend.isActive ? 'visible' : 'none')
      }
    },
    //左侧功能
    getElementTree(){
      this.activeStep = 4
      getElementTree({cjId: this.activeRow.id}).then(res=>{
        if(res.success){
          this.gridData = res.data || []
          this.setExpandedLevel(4)
        }else{
          this.$message.warning(res.msg)
        }
      })
    },
    handleStepClick(level) {
      this.activeStep = level
      this.setExpandedLevel(level)
    },
    setExpandedLevel(level) {
      this.gridData.forEach((grid) => {
        this.$set(this.expandedKeys, 'grid-' + grid.fid, level >= 2)
        const stations = grid.bdzEl || []

        stations.forEach((station) => {
          this.$set(
            this.expandedKeys,
            'substation-' + station.id,
            level >= 3
          )
          const lines = station.xlEls || []

          lines.forEach((line) => {
            this.$set(this.expandedKeys, 'line-' + line.id, level >= 4)
            const groups = Object.keys(line.childs || {})

            groups.forEach((group) => {
              const key = 'device-group-' + line.id + '-' + group
              this.$set(this.expandedKeys, key, level >= 4)
            })
          })
        })
      })
    },
    toggleDeviceGroup(group, devices, key) {
      this.$set(this.expandedKeys, key, !this.expandedKeys[key])
    },
    toggleNode(type, node, key) {
      this.$set(this.expandedKeys, key, !this.expandedKeys[key])
      console.log(type, node, key)
    },
    handleDeviceClick(device) {
      console.log(device)
    },
    //选中
    selectFeature(grid, station, line, device, type) {      
      this.clearSelectState()
      this.saveType = 'update'
      if(type == 'grid') {
        this.saveDialog = true
        var index = this.dishiAreaList.map(item => item.ssds_id).indexOf(grid.ssdsId)
        if (index > -1) {
          this.getXianList(index)
        }
        this.features = WKT.parse(grid.shape)
        this.gridForm = {
          duration: grid.duration,
          name: grid.name,
          no: grid.no,
          area: grid.area,
          charger: grid.charger,
          remark: grid.remark,
          ssdsId: grid.ssdsId,
          fid: grid.fid,
          yxdw: grid.yxdw,
          yxdwId: grid.yxdwId,
          qydj: grid.qydj,
          gds: grid.gds,
          gdsId: grid.gdsId,
          remark: grid.remark ? grid.remark : ''
        }
        this.activeData = { type: 'wg' }
        this.getGdsList()
        if(grid.shape) {
          this.fitFeatures({ geometry: WKT.parse(grid.shape) }, true)
        }
      } else if(type == 'bdz') {
        this.saveDialog = true
        this.activeData = station
        this.clickFeatureLayer = [{ properties: {...station} }]
        this.saveData = {
          name: station.name,
          dydj: station.type.split('bdz')[1],
          startTime: station.startTime,
          startMx: station.startMx,
          area: station.area,
          jsdzType: station.jsdzType
        }
        if(station.geom) {
          this.fitFeatures({ geometry:WKT.parse(station.geom), properties: { name: station.name } }, true)
        }
      } else if(type == 'xl') {
        this.saveLineDialog = true
        this.addLine(grid, '', line, 'update')
        getLineByDkxId({lineId: line.id}).then((res)=> {
          if(res.success) {
            if(res.data[0] && res.data[0].geom) {
              this.fitFeatures({ geometry: WKT.parse(res.data[0].geom), properties: { name: line.name }}, true)
            }
          }
        })
      } else if(type == 'jkxl' || type == 'dlxl') {
        this.saveDialog = true
        this.activeData = device
        this.clickFeatureLayer = [{ properties: {...device} }]
        this.saveData = {
          name: device.name,
          startPoint: device.startPoint && device.startPoint != 'null' ? device.startPoint : '',
          startMx: device.startMx && device.startMx != 'null' ? device.startMx : '',
          endPoint: device.endPoint && device.endPoint != 'null' ? device.endPoint : '',
          endMx: device.endMx && device.endMx != 'null' ? device.endMx : '',
          jsdzType: device.jsdzType
        }
        if(device.geom) {
          this.fitFeatures({ geometry:WKT.parse(device.geom), properties: { name: device.name }}, true)
        }
      } else {
        this.saveDialog = true
        this.activeData = device
        this.clickFeatureLayer = [{ properties: {...device} }]
        this.saveData = {
          name: device.name,
          startMxNum: device.startMxNum,
          endMxNum: device.endMxNum
        }
        if(device.geom) {
          this.fitFeatures({ geometry:WKT.parse(device.geom) }, true)
        }
      }
    },
    //市县联动
    getXianList (index) {
      this.gridForm.yxdwId = ''
      this.lineForm.yxdwId = ''
      this.xianAreaList = this.dishiAreaList[index].value
    },
    //获取供电所
    getGdsList() {
      this.gdsList = []
      getGdsWjfx({ ssdsId: this.gridForm.ssdsId, yxdwId: this.gridForm.yxdwId }).then(res=> {
        if(res.success) {
          this.gdsList = res.data
        }
      })
    },
    formatLabel (val) {
      let label = ''
      this.shiOption.forEach((item) => {
        if (item.id == val) {
          label = item.label
          return
        }
      })
      return label
    },
    clearSelectState() {
      this.saveDialog = false
      this.saveLineDialog = false
      this.removeLayers('选中元素')
    },
    addLine(grid, station, data, type) {
      this.clearSelectState()
      this.saveLineDialog = true
      var index = this.dishiAreaList.map(item => item.ssds_id).indexOf(data.ssdsId)
      if (index > -1) {
        this.getXianList(index)
      }
      this.lineForm = {
        id: data.id,
        name: data.name,
        remark: data.remark,
        yxdw: data.yxdw,
        yxdwId: data.yxdwId,
        ssdsId: data.ssdsId,
        stationId: data.id,
        stationName: data.name,
        gridId: data.gridId
      }
    }
  },
  watch: {
    activeOperate(val) {
      if (val && val.title == '绘制') {
        sgdps1.map.doubleClickZoom.disable()
      } else {
        sgdps1.map.doubleClickZoom.enable()
      }
    }
  },
  destroyed () {
    this.removeLayers('网架规划-draw-点,网架规划-draw-线')
    this.removeLayers('选中元素')

    //删除绘制事件
    if (this.drawPolyline) this.drawPolyline.remove()

    //删除地图移动事件
    if (Object.keys(this.queryPoint).length > 0) this.queryPoint.destroy()
    sgdps1.map.off('click');
  },
  computed: {
    theme: {
      get () {
        return this.$store.state.pwmode.theme
      }
    },
    saveTitle() {
      let name = ''
      this.huituList.forEach((item)=> {
        if(item.type == this.activeData.type) {
          name = item.name
        }
      })
      return name ? name : '网格'
    }
  }
}
</script>

<style lang="less" scoped>
.huituTk {
  width: 280px;
  top: 65px;
  right: 34px;
  .top-bar {
    position: fixed;
    top: 55px;
    width: 100%;
    background: #fff;
    border-bottom: 1px solid #d2dae8;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 22px;
    left: 0;
    .icon-group {
      position: relative;
      display: flex;
      align-items: center;
      padding: 6px 15px;
      border: 1px solid #2a7bd4;
      border-radius: 3px;
      background: #eaf2fc;
      ul {
        display: flex;
        width: 100%;
        gap: 7px;
      }
      li {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        background: #fff;
        cursor: pointer;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
        padding: 5px;
      }
      li.active {
        border: 2px solid #2563eb;
      }
      img {
        width: 30px;
      }
      i {
        width: 26px;
        font-size: 18px;
        text-align: center;
      }
    }

    .line-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .year-pill {
      min-width: 62px;
      height: 31px;
      padding: 0 16px;
      border: 1px solid #d9d9d9;
      color: #666;
      border-radius: 18px;
      background: #fff;
      font-size: 14px;
      font-weight: 800;
      line-height: 1;
      cursor: pointer;
      transition: box-shadow 0.15s, transform 0.15s, background 0.15s;
    }
    .year-pill.active2026 {
      color: #fff;
      background: #ffba00;
      border: 1px solid #ffba00;
    }
    .year-pill.active2027 {
      color: #fff;
      background: #13ce66;
      border: 1px solid #13ce66;
    }
    .year-pill.active2028 {
      color: #fff;
      background: #0396fd;
      border: 1px solid #0396fd;
    }
    .btn-group {
      .btn {
        height: 34px;
        width: 80px;
        cursor: pointer;
        color: #fff;
        line-height: 34px;
        text-align: center;
        border-radius: 4px;
        background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%) !important;
        color: #fff !important;
        border: 1px solid #d9d9d9 !important;
      }
    }
  }
  .tool-pill {
    position: absolute;
    left: 260px;
    top: 70px;
    background: #fff;
    border: 1px solid #e5e7eb;
    gap: 6px;
    border-radius:16px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    height: 32px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    color: #666;
    font-size: 12px;
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #52c41a;
    }
    span {
      white-space: nowrap;
    }
  }
  .bottom {
    display: flex;
    justify-content: center;
    padding: 10px 0;
    gap: 5px;
    .btn1 {
      height: 30px;
      width: 80px;
      cursor: pointer;
      color: #fff;
      background: #f56c6c;
      line-height: 30px;
      text-align: center;
      border-radius: 4px;
    }
    .save {
      background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%) !important;
      color: #fff !important;
      border: 1px solid #d9d9d9 !important;
    }
  }
  .main {
    position: fixed;
    width: 280px;
    top: 120px;
    right: 0;
    width: 280px;
    bottom: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-left: 1px solid #e5e7eb;
    .tabs {
      display: inline-flex;
      color: #666;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      position: relative;
      left: 0;
      top: 0;
      z-index: 99;
      div {
        display: inline-block;
        border-bottom: 1px solid #c5d2ea;
        font-size: 14px;
        width: 100%;
        text-align: center;
        padding: 9px 0;
      }
      div:hover {
        cursor: pointer;
        background: #c5d2ea;
      }
      div.on {
        color: #5982DC;
        border-bottom: 2px solid #5982DC;
        position: relative;
        font-weight: 600;
      }
    }
    .tab-item {
      padding: 14px;
    }
    .right-title {
      font-size: 15px;
      color: #595959;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .tip {
      line-height: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      background: #e8f1ff;
      padding: 10px;
      color: #155fe0;
    }
    .help-text {
      .step {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        align-items: flex-start;
      }
      .step-num {
        width: 22px;
        height: 22px;
        border-radius: 11px;
        background: #e6f0ff;
        color: #1677ff;
        font-size: 11px;
        font-weight: 600;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .step-text {
        font-size: 12.5px;
        color: #666;
        line-height: 18px;
      }
    }
    .el-form-item {
      margin-bottom: 5px;
    }

    /deep/ .el-form-item__label {
      color: #6b7280;
      float: none;
      line-height: 24px;
    }

    /deep/ .el-input--small .el-input__inner {
      height: 28px;
      line-height: 28px;
      border: 1px solid #d9d9d9;
      border-radius: 5px;
      background-color: #fff;
      color: #666;
    }

    /deep/ .el-input--small .el-input__icon {
      line-height: 24px;
    }

    /deep/ .el-form-item {
      margin-bottom: 0;
    }
    /deep/ .el-date-editor.el-input, .el-date-editor.el-input__inner {
      width: 160px;
    }
  }
  .sidebar {
    width: 320px;
    background: #fff;
    border-right: 1px solid #dcdfe6;
    padding: 16px;
    overflow-y: auto;
    position: fixed;
    left: 254px;
    bottom: 40px;
  }

  .sidebar-title {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
  }
}
.tuliZgx {
  position: fixed;
  left: 290px;
  bottom: 10px;
  width: 200px;
  .tip {
    text-align: center;
    margin-bottom: 0;
    background: none;
    color: #c0c4cc;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .icon {
    width: 20px;
    height: 4px;
    display: inline-block;
    vertical-align: middle;
    margin-right: 8px;
  }
  .context {
    padding: 0 10px 10px;
    display: flex;
    flex-flow: wrap;
    flex-direction: column;
    .legend {
      margin-top: 10px;
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      width: 100%;
      display: flex;
      justify-content: space-between;
    }
    ul li {
      display: flex;
      line-height: 1vw;
      color: #797979;
      margin: 0.7vw 0;
      opacity: 0.5;
      padding: 0.25vw 1vh 0;
      cursor: pointer;
      user-select: none;
      span {
        display: inline-block;
        width: 16px;
        height: 16px;
      }
    }
    .legend.active {
      span {
        color: #666;
        opacity: 1;
        font-weight: 600;
      }
      
    }
  }
}

/deep/ .el-button--mini {
  padding: 7px 10px;
}
/deep/ .el-button {
  margin: 0;
}

.cartItemContainTheme {
  box-shadow: none !important;
  .title {
    position: relative;
  }
  .context .pwDrawIcon ul li p {
    color: #666;
  }
  .dialog-title {
    z-index: 2;
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    box-sizing: border-box;
    padding: 3px 10px;
    cursor: move;
    ::before {
      position: absolute;
      content: '';
      width: 5px;
      height: 18px;
      top: 16px;
      left: 10px;
      background-color: var(--main-color);
    }
    .dialog-title-bg {
      display: inline-block;
      padding-left: 16px;
      font-weight: 600;
      font-size: 16px;
      height: 18px;
      line-height: 18px;
      color: #262626!important;
      letter-spacing: 0;
    }
  }
  .selects {
    flex: 1;
    border-right: 0;
    border: none;
    display: inline-block;
    padding: 10px;
    /deep/ .el-input__inner {
      height: 24px;
      line-height: 24px;
      border: 1px solid #d9d9d9;
      border-radius: 0;
      background: #fff;
      color: #666;
      width: 8vw;  
      padding: 0 0 0 8px;    
    }
    /deep/ .el-input--small .el-input__icon {
      line-height: 24px;
    }
    /deep/ .el-input {
      height: 24px;
      line-height: 24px;
      width: auto;
    }
    .line {
      width: 1px;
      height: 21px;
      background: #c2c8db;
      display: inline-block;
      line-height: 34px;
      vertical-align: middle;
    }

    /deep/ input::-webkit-input-placeholder {
      font-size: 12px !important;
    }
    /deep/ input::-moz-input-placeholder {
      font-size: 12px !important;
    }
    /deep/ input::-ms-input-placeholder {
      font-size: 12px !important;
    }
  }
  .top {
    p {
      font-size: 14px;
      white-space: nowrap;
      line-height: 28px;
      display: inline-block;
      color: #666;
    }
  }
}
.main-step{
  left: 0;
  position: fixed;
  top: 120px;
  right: 0;
  bottom: 0;
  width: 280px;
  .distribution-grid-sidebar {
    --primary: #1e6fff;
    --primary-soft: #e8f1ff;
    --text: #1a2230;
    --text-2: #6b7686;
    --text-3: #9aa4b2;
    --border: #e3e8ef;
    height: 100%;
    min-height: 0;
    display: flex;
    flex: 0 0 300px;
    flex-direction: column;
    overflow: hidden;
    color: var(--text);
    background: #fff;
    border-right: 1px solid var(--border);
    font-family: "PingFang SC", "Microsoft YaHei", "Sarasa Gothic SC",
      "Noto Sans SC", sans-serif;
    font-size: 13px;
    box-sizing: border-box;
  }

  .distribution-grid-sidebar *,
  .distribution-grid-sidebar *::before,
  .distribution-grid-sidebar *::after {
    box-sizing: border-box;
  }

  .sidebar-panel {
    padding: 16px;
  }

  .sidebar-panel + .sidebar-panel {
    border-top: 1px solid var(--border);
  }

  .panel-title {
    margin: 0;
    color: var(--text);
    font-size: 14px;
    font-weight: 700;
    line-height: 20px;
  }

  .panel-hint {
    margin: 2px 0 0;
    color: var(--text-3);
    font-size: 11px;
    line-height: 16px;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    margin-top: 12px;
  }

  .step-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 54px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    user-select: none;
  }

  .step-row:not(:last-child)::after {
    content: "";
    position: absolute;
    z-index: 0;
    top: 36px;
    bottom: -8px;
    left: 21.5px;
    width: 1px;
    background: #d8e0eb;
  }

  .step-row:hover {
    background: #f6f8fb;
  }

  .step-row.active {
    background: var(--primary-soft);
  }

  .step-badge {
    position: relative;
    z-index: 1;
    width: 24px;
    height: 24px;
    display: flex;
    flex: 0 0 24px;
    align-items: center;
    justify-content: center;
    color: var(--text-2);
    background: #f2f5f9;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
  }

  .step-row.active .step-badge {
    color: #fff;
    background: var(--primary);
  }

  .step-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .step-name {
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
    line-height: 18px;
  }

  .step-row.active .step-name {
    color: var(--primary);
  }

  .step-desc {
    color: var(--text-2);
    font-size: 11px;
    line-height: 16px;
  }

  .relation-panel {
    display: flex;
    flex: 0 0 auto;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }

  .add-grid-button {
    height: 30px;
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 5px;
    padding: 0 10px;
    color: #fff;
    background: var(--primary);
    border: 0;
    border-radius: 7px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
  }

  .add-grid-button:hover {
    background: #155fe0;
  }

  .sidebar-tree {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 8px 8px 20px;
  }

  .tree-row {
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
  }

  .tree-row:hover {
    background: #f6f8fb;
  }

  .tree-row > svg {
    display: block;
    flex: 0 0 14px;
  }

  .tree-arrow {
    width: 10px;
    flex: 0 0 10px;
    color: #8793a4;
    font-size: 14px;
    line-height: 14px;
    text-align: center;
    transform: rotate(0deg);
    transition: transform 0.15s ease;
  }

  .tree-arrow.expanded {
    transform: rotate(90deg);
  }

  .tree-name {
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
    color: var(--text);
    font-size: 13px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tree-name:hover {
    color: #1e6fff;
    text-decoration: underline;
  }

  .tree-tag {
    flex: 0 0 auto;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    line-height: 14px;
  }

  .grid-tag {
    color: #2d6b30;
    background: #f2fae7;
  }

  .station-tag {
    color: #f59e0b;
    background: #fef3e2;
  }

  .line-tag {
    color: #2563eb;
    background: #e6edfd;
  }

  .tree-children {
    margin-left: 19px;
    padding-left: 10px;
    border-left: 1px solid #edf1f5;
  }

  .device-row .tree-arrow {
    visibility: hidden;
  }

  .empty-hint {
    margin: 0;
    padding: 8px;
    color: var(--text-3);
    font-size: 12px;
    line-height: 18px;
  }
}
</style>
