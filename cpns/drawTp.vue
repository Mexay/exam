<template>
  <div class="v10-page" :class="{ expanded: isPageExpanded, 'is-readonly': isCurrentYear }"
    :style="{ minHeight: mode === '出题' ? 'calc(100vh - 100px)' : 'calc(50vh - 52px)' }">
    <div class="topology-toolbar">
      <div class="year-group" aria-label="年份选择">
        <button v-for="year in years" :key="year.value" type="button" class="year-pill"
          :class="['year-' + year.value, { active: activeYear === year.value }]" @click="changeYear(year.value)">
          {{ year.label }}
        </button>
      </div>

      <div class="icon-group" aria-label="工具选择">
        <button v-for="tool in tools" :key="tool.key" type="button" class="icon-btn"
          :disabled="mode === '阅卷中' || isCurrentYear"
          :class="{ active: !isCurrentYear && activeTool === tool.key }" :title="tool.label" @click="selectTool(tool.key)">
          <img v-if="tool.src" :src="tool.src" :alt="tool.label" draggable="false" @dragstart.prevent />
        </button>
      </div>

      <div class="action-group" aria-label="画布操作">
        <el-button class="btn" size="mini" @click="updateTopology" v-if="mode === '出题' && !isCurrentYear">更新</el-button>
        <el-button class="btn" size="mini" @click="saveTopology" v-if="mode !== '阅卷中' && !isCurrentYear">保存</el-button>
        <!-- <el-button class="btn" size="mini" @click="clearTopology" v-if="mode !== '阅卷中' && !isCurrentYear">清空</el-button> -->
        <span v-if="saveMessage" class="save-message">{{ saveMessage }}</span>
      </div>
    </div>
    <div class="content" :style="{ height: mode === '出题' ? '87vh' : '93vh' }">
      <div class="map" v-show="mode == '出题' && !isPageExpanded">
        <div id="jxtMap">
          <img class="el-icon-full-screen" src="../../../components/wgdjModel/images/全屏.png"
              @click.stop="mapMax('max')" v-show="mapSize == 'min'" />
          <img class="el-icon-minus" src="../../../components/wgdjModel/images/取消全屏.png"
              @click.stop="mapMax('min')" v-show="mapSize == 'max'" />
          <mouseClick ref="mouse_click" :sgdps="sgdps" v-if="mapLoad"></mouseClick>
          <div v-if="gridDialog" class="fea-desc">
              <h1 class="title">
                  <span class="close" @click="closeDialog()"></span>详情
              </h1>
              <ul>
                  <li><label>名称：</label><span>{{ gridDetails.name }}</span></li>
                  <li><label>编号：</label><span>{{ gridDetails.no }}</span></li>
                  <li><label>地市：</label><span>{{ gridDetails.ssds }}</span></li>
                  <li><label>单位：</label><span>{{ gridDetails.yxdw }}</span></li>
                  <li><label>供电所：</label><span>{{ gridDetails.gds }}</span></li>
                  <li><label>面积：</label><span>{{ Number(gridDetails.area).toFixed(2) }}</span></li>
                  <li><label>等级：</label><span>{{ gridDetails.qydj }}</span></li>
                  <li><label>饱和负荷：</label><span>{{ gridDetails.duration }}</span></li>
                  <li><label>描述：</label><span>{{ gridDetails.remark }}</span></li>
              </ul>
          </div>
          <div v-if="lineDialog" class="fea-desc">
              <h1 class="title">
                  <span class="close" @click="closeDialog()"></span>详情
              </h1>
              <ul>
                  <li><label>名称：</label><span>{{ lineDetails.name }}</span></li>
                  <li><label>地市：</label><span>{{ lineDetails.ssds }}</span></li>
                  <li><label>单位：</label><span>{{ lineDetails.yxdw }}</span></li>
                  <li><label>变电站：</label><span>{{ lineDetails.stationName }}</span></li>
                  <li><label>描述：</label><span>{{ lineDetails.remark }}</span></li>
              </ul>
          </div>
      </div>
        <!-- <jsMap :cjId="rowCjId"></jsMap> -->
      </div>
      <div ref="flow" class="flow-root" :class="{ connecting: !!connection }" @wheel.prevent="onWheel"
        @mousedown="onPaneMouseDown" @mousemove="onFlowMouseMove" @mouseup="onFlowMouseUp" @mouseleave="onFlowMouseUp">
        <div class="flow-hint">{{ hintText }}</div>
        <button type="button" class="expand-btn" :title="isPageExpanded ? '还原' : '放大'"
          :aria-label="isPageExpanded ? '还原画布' : '放大画布'" @mousedown.stop @click.stop="togglePageExpanded">
          <svg v-if="!isPageExpanded" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
          </svg>
        </button>
        <div class="flow-transform" :style="transformStyle">
          <svg class="edge-layer" :width="canvas.width" :height="canvas.height">
            <defs>
              <marker id="edge-arrow-blue" markerWidth="5" markerHeight="5" refX="4.4" refY="2" orient="auto">
                <path d="M0,0 L4.4,2 L0,4 Z" fill="#2f63d5" />
              </marker>
            </defs>

            <g class="bus-layer">
              <g v-for="bus in buses" :key="bus.id">
                <line class="bus-line" :class="{ selected: isSelected('bus', bus.id) }" :x1="bus.start.x" :y1="bus.start.y"
                  :x2="bus.end.x" :y2="bus.end.y" @click.stop="selectElement('bus', bus.id)"
                  @dblclick.stop.prevent="beginEditBusName(bus)" />
                <line class="bus-hit" :class="{ draggable: !isCurrentYear && activeTool === 'select' }" :x1="bus.start.x" :y1="bus.start.y"
                  :x2="bus.end.x" :y2="bus.end.y" @mousedown.stop.prevent="onBusMouseDown(bus, $event)"
                  @click.stop="selectElement('bus', bus.id)" @dblclick.stop.prevent="beginEditBusName(bus)" />
              </g>
              <line v-if="busDraft" class="bus-line edge-preview" :x1="busDraft.start.x" :y1="busDraft.start.y"
                :x2="busDraft.end.x" :y2="busDraft.end.y" />
              <circle v-for="tap in busTapPoints" :key="tap.id" class="bus-tap" :cx="tap.x" :cy="tap.y" r="5" />
            </g>

            <g v-for="edge in edges" :key="edge.id">
              <path class="flow-edge-hit" :d="edgePath(edge)" @click.stop="selectElement('edge', edge.id)"
                @dblclick.stop.prevent="beginEditEdgeLabel(edge)" />
              <path class="flow-edge" :class="['edge-' + edge.type, { selected: isSelected('edge', edge.id) }]"
                :d="edgePath(edge)" @click.stop="selectElement('edge', edge.id)"
                @dblclick.stop.prevent="beginEditEdgeLabel(edge)" />
            </g>
            <path v-if="connection" class="flow-edge edge-preview" :class="'edge-' + activeLineType" :d="previewEdgePath" />
          </svg>

          <div v-for="bus in buses" :key="'bus-name-' + bus.id" class="bus-name-wrap" :style="busNameStyle(bus)">
            <input v-if="!isCurrentYear && editingBusId === bus.id" :ref="'busNameInput-' + bus.id" class="bus-name-input"
              :value="editingBusName" @input="editingBusName = $event.target.value" @mousedown.stop @mouseup.stop
              @click.stop @dblclick.stop @keydown.enter.stop.prevent="finishEditBusName(bus)"
              @keydown.esc.stop.prevent="cancelEditBusName" @blur="finishEditBusName(bus)" />
            <span v-else class="bus-name" @mousedown.stop @click.stop="selectElement('bus', bus.id)"
              @dblclick.stop.prevent="beginEditBusName(bus)">
              {{ bus.name }}
            </span>
          </div>

          <div v-for="node in nodes" :key="node.id" class="flow-node"
            :class="{ selected: !isCurrentYear && selectedNodeId === node.id, connectable: !isCurrentYear && activeToolConfig.group === 'line' && activeTool !== 'bus' }"
            :style="nodeStyle(node)" @mousedown.stop="startNodeDrag(node, $event)"
            @mouseup.stop="onNodeMouseUp(node, $event)" @dblclick.stop.prevent="beginEditNodeName(node)">
            <input v-if="!isCurrentYear && editingNodeId === node.id" :ref="'nodeNameInput-' + node.id" class="node-name-input"
              :value="editingNodeName" @input="editingNodeName = $event.target.value" @mousedown.stop @mouseup.stop
              @click.stop @dblclick.stop @keydown.enter.stop.prevent="finishEditNodeName(node)"
              @keydown.esc.stop.prevent="cancelEditNodeName" @blur="finishEditNodeName(node)" />
            <span v-else class="node-name">{{ node.data.name }}</span>
            <img :src="node.data.src" :alt="node.data.label" draggable="false" @dragstart.prevent
              :class="{ 'flow-node-img--t': isTNode(node) }" />
          </div>
          <div v-for="edge in editableEdges" :key="'edge-label-' + edge.id" class="edge-label-wrap"
            :style="edgeLabelStyle(edge)">
            <input v-if="!isCurrentYear && editingEdgeId === edge.id" :ref="'edgeLabelInput-' + edge.id"
              class="edge-label-input" :value="editingEdgeLabel" @input="editingEdgeLabel = $event.target.value"
              @mousedown.stop @mouseup.stop @click.stop @dblclick.stop @keydown.enter.stop.prevent="finishEditEdgeLabel(edge)"
              @keydown.esc.stop.prevent="cancelEditEdgeLabel" @blur="finishEditEdgeLabel(edge)" />
            <span v-else-if="edge.label" class="edge-label" :title="edge.label"
              @dblclick.stop.prevent="beginEditEdgeLabel(edge)">{{ edge.label }}</span>
          </div>
          <button v-if="!isCurrentYear && selectedDeletePosition" type="button" class="element-delete-btn" :style="selectedDeletePosition"
            title="删除" aria-label="删除选中元素" @mousedown.stop.prevent @mouseup.stop @click.stop="deleteSelectedElement">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div class="flow-controls">
          <button type="button" @click="zoomIn">+</button>
          <button type="button" @click="zoomOut">-</button>
          <button type="button" @click="fitView">适配</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import solidLineIcon from '../imgs/mx.png';
import breakerIcon from '../imgs/rdq.png';
import breakerGhIcon from '../imgs/rdq-gh.png';
import overheadLineIcon from '../imgs/jkx.png';
import cableLineIcon from '../imgs/dld.png';
import overheadLineGhIcon from '../imgs/jkx-gh.png';
import cableLineGhIcon from '../imgs/dld-gh.png';
import branchLineIcon from '../imgs/fzx.png';
import hwIcon from '../imgs/HW.png';
import dfIcon from '../imgs/DF.png';
import kgIcon from '../imgs/KG.png';
import pdIcon from '../imgs/T.png';
import { getWjByGrid } from '@/api/pwgh/examWjghNew'
import { getAllGrids, getXlByGridId } from "@/api/pwgh/examIndex";
import common from '../../../common.js'

import { saveTopology, getTopology, saveWjData } from '@/api/pwgh/examCbPsk'
import jsMap from './jsMap.vue'
import mouseClick from '@/platformComponents/mouseClick/index.vue'
import WKT from 'terraformer-wkt-parser'

const NODE_SIZE = 30;
const STORAGE_KEY = 'dashboard-v10-topology';
const LINE_TYPES = ['overhead', 'cable', 'overhead-gh', 'cable-gh', 'branch'];


export default {
  name: 'drawTp',
  components: { jsMap, mouseClick },
  props: {
    mode: {
      default: '',
      type: String
    },
    rowCjId: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      //地图撒考题
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
      marker: [],
      lineList: [],
      drawData: [],
      gridDialog: false,
      gridDetails: '',
      lineDialog: false,
      lineDetails: {},
      mapLoad: false,
      mapSize: 'min',
      map: null,
      sgdps: null,
      drawLoading: false,
      activeYear: 2026,
      activeTool: 'select',
      activeLineType: 'bus',
      selectedNodeId: '',
      selectedElement: null,
      editingNodeId: '',
      editingNodeName: '',
      editingBusId: '',
      editingBusName: '',
      editingEdgeId: '',
      editingEdgeLabel: '',
      saveMessage: '',
      saveMessageTimer: null,
      isPageExpanded: false,
      viewportBeforeExpanded: null,
      violationGuard: null,
      pageRuntimeActive: false,
      nextNodeIndex: 5,
      nextEdgeIndex: 4,
      nextBusIndex: 3,
      canvas: { width: 5000, height: 3000 },
      viewport: { x: 0, y: 0, zoom: 1 },
      panState: null,
      dragState: null,
      busDragState: null,
      connection: null,
      busDraft: null,
      years: [
        { value: 2026, label: '现状年' },
        { value: 2027, label: '规划年' }
      ],
      tools: [
        { key: 'select', group: 'none', label: '取消选中', src: '' },
        { key: 'bus', group: 'line', label: '母线', src: solidLineIcon },
        { key: 'breaker', group: 'node', label: '断路器', src: breakerIcon },
        { key: 'overhead', group: 'line', label: '架空线-现状年', src: overheadLineIcon },
        { key: 'cable', group: 'line', label: '电缆线-现状年', src: cableLineIcon },
        { key: 'breaker-gh', group: 'node', label: '断路器-规划年', src: breakerGhIcon },
        { key: 'overhead-gh', group: 'line', label: '架空线-规划年', src: overheadLineGhIcon },
        { key: 'cable-gh', group: 'line', label: '电缆线-规划年', src: cableLineGhIcon },
        { key: 'branch', group: 'line', label: '分支线', src: branchLineIcon },
        { key: 'hw', group: 'node', label: '环网柜', src: hwIcon },
        { key: 'df', group: 'node', label: '电缆分支箱', src: dfIcon },
        { key: 'kg', group: 'node', label: '开闭所', src: kgIcon },
        { key: 'pd', group: 'node', label: 'T节点', src: pdIcon }
      ],
      nodes: [],
      buses: [],
      edges: []
    };
  },
  mounted() {
    this.renderTopologyData();
    if(this.mode == '出题') {
      this.initMap()
    }
  },
  activated() {
  },
  deactivated() {
  },
  beforeDestroy() {
    this.removeLayers('网格,选中元素,网架规划-draw-变电站')
    this.lineList.forEach((item)=> {
        this.removeLayers(`网架规划-draw-点-${item.id},网架规划-draw-线-${item.id}`)
    })
    this.marker.forEach((item)=> {
        item && item.remove()
    })
    this.marker = []
    sgdps1.map.off('click', this.mapClick)
    window.sgdps1 = null
  },
  computed: {
    isCurrentYear() {
      const year = this.years.find(item => item.value === this.activeYear);
      return Boolean(year && year.label === '现状年');
    },
    selectedDeletePosition() {
      const selected = this.selectedElement;
      if (!selected) return null;

      if (selected.type === 'node') {
        const node = this.nodes.find(item => item.id === selected.id);
        if (!node) return null;

        return this.positionStyle({
          x: node.position.x + NODE_SIZE,
          y: node.position.y - 6
        });
      }

      if (selected.type === 'bus') {
        const bus = this.buses.find(item => item.id === selected.id);
        if (!bus) return null;

        const topPoint = bus.start.y <= bus.end.y ? bus.start : bus.end;
        return this.positionStyle({
          x: topPoint.x,
          y: topPoint.y - 8
        });
      }

      if (selected.type === 'edge') {
        const edge = this.edges.find(item => item.id === selected.id);
        const midpoint = edge ? this.edgeMidpoint(edge) : null;

        return midpoint
          ? this.positionStyle({ x: midpoint.x, y: midpoint.y - 8 })
          : null;
      }

      return null;
    },
    activeToolConfig() {
      return this.tools.find(tool => tool.key === this.activeTool) || this.tools[0];
    },
    transformStyle() {
      return {
        width: `${this.canvas.width}px`,
        height: `${this.canvas.height}px`,
        transform: `translate(${this.viewport.x}px, ${this.viewport.y}px) scale(${this.viewport.zoom})`
      };
    },
    hintText() {
      if (this.isCurrentYear) return '现状年仅支持查看，不可编辑';
      if (this.activeToolConfig.group === 'node') return '点击画布添加节点，拖拽节点可移动';
      if (this.activeToolConfig.group === 'none') return '取消选中状态：可拖动画布、节点或母线';
      if (this.activeTool === 'bus') return '上下拖拽绘制竖直母线';
      return '从母线或设备开始连线，连线自动横平竖直，并接到设备四边中点';
    },
    previewEdgePath() {
      if (!this.connection) return '';
      return this.makePolylinePath(this.orthogonalizePoints([
        this.connection.from,
        ...(this.connection.waypoints || []),
        this.connection.to
      ]));
    },
    busTapPoints() {
      return this.edges
        .filter(edge => edge.sourceType === 'bus' && edge.sourcePoint)
        .map(edge => ({ id: `tap-${edge.id}`, ...edge.sourcePoint }));
    },
    editableEdges() {
      return this.edges.filter(edge => LINE_TYPES.includes(edge.type));
    }
  },
  methods: {
    initMap() {
      this.drawLoading = this.$loading({
          lock: true,
          text: "加载中...",
          spinner: "el-icon-loading",
          background: "rgba(0, 0, 0, 0.3)",
          target: document.querySelector('#app')
      })
      window.sgdps1 = new window.SgdpsMap({
          msServiceUrl: "http://20.51.6.45:17771/dwqskScgk/v2/dwqsk/api",//TODO 根据现场情况修改
          staticUrl: "/sgdps/",
          //公共配置
          config: {
          SGMapLayerUrl: {
              jsurl: "http://map-ah.sgcc.com.cn/maps?v=3.0.0",//TODO 根据现场情况修改【咨询实施人员改地址】
              // jsurl: "http://map.sgcc.com.cn/maps?v=3.0.0",//TODO 根据现场情况修改【咨询实施人员改地址】
              // key: 'c6ce35798ac03f2da863265136dc673b', //TODO 根据现场情况修改【需要申请向思极地图申请】
              // sn: 'b732fcf2cbce3d178331d878a3e7ac4f', //TODO 根据现场情况修改【需要申请向思极地图申请】
              // publicKey: PublicKey,//一张图publickey
          },
          mapOptions: {
              zoom: 6.556763424479864,
              center: [117.28576073561942, 32.11579868644401], //[117.71148159502775, 32.01452854740424]
              unit: 'metric', //默认是m
              container: 'jxtMap', //地图dom
              style: 'aegis://styles/aegis/StreetsLight',
          },
          },
          TOKENKEY: "SGDPS_TOKEN",
      })
      window.sgdps1.load.then((map) => {
          this.map = map
          // 地图加载完毕事件
          map.on('load', () => {
          //加载工具组件
          new window.narimap.Require(['Measure', "Marker"], () => {
              window.psrmap = new window.narimap.PSRMap(sgdps1.nariMap, {
              distribution: true,// 处理过滤不闪烁
              tmsLayerVisibility: false, // 控制是否初始化时显示光缆设备
              pipeLayerVisibility: false // 控制是否初始化时显示管廊设备
              })
              // 保存设备选择模式
              window.selectMode = window.psrmap.clickMode;
              window.measure = new window.narimap.Measure(sgdps1.nariMap);
              //初始化图层控制组件
              window.psrmap.on("load", () => {
                
              })
          })
          const hideLayer = ["Capital", "ProvincialCapital", "City", "County", "Town", "Village", "R_ExpressWay/label/RouteNO", "RailwayStation", "POI1", "POI2", "Government",
              "R_UrbanHighway/label/name", "SubwayLine/label/label", "R_PrimaryRoad/label/name", "R_ProvincialRoad/label/RouteNO", "Water/label", "R_ProvincialRoad/label/name",
              "R_ExpressWay/label/name", "R_NationalRoad/label/RouteNO", "R_NationalRoad/label/name", "POI3", "POI4","R_SecondaryRoad/Road/0","R_SecondaryRoad/label/name",
              "SubwayStation", "Railway/label/label", "POI5", "POI6", "POI7", "Green/label", "POI8", "POI9","R_TownshipRoad/label/name", "R_CountyRoad/label/RouteNO",
              "R_OrdinaryRoad/label/name", "Airport", "BuildingNO", "R_CountyRoad/label/name"
          ]
          hideLayer.forEach((layerId)=> {
              if (map.getLayer(layerId)) {
                  map.setLayoutProperty(layerId, "visibility", "none")
              }
          })
          })
          this.sgdps = window.sgdps1
          this.drawLoading && this.drawLoading.close()
          this.mapLoad = true
          setTimeout(() => {
            this.drawFeatures()
            sgdps1.map.resize();
          }, 1000);
          sgdps1.map.on('click', this.mapClick)
      })
    },
    //地图缩放
    mapMax(type) {
      this.mapSize = type
      var eleElemt = document.getElementById('jxtMap')
      if (type == 'max') {
          var styleObj = {
              left: 0,
              position: 'fixed',
              top: '55px',
              width: '100vw',
              height: 'calc(100vh - 55px)',
              zIndex: 1000
          }
      } else {
          var styleObj = {
              left: 0,
              width: '45vw',
              height: '44vh',
              position: 'absolute',
              overflow: 'initial',
              zIndex: '',
              top: ''
          }
      }
      Object.assign(eleElemt.style, styleObj)
      setTimeout(() => {
          sgdps1.map.resize()
      }, 100);
    },
    closeDialog() {
      this.lineDialog = false
      this.gridDialog = false
      this.removeLayers('选中元素')
    },
    //撒考题
    drawFeatures() {
      this.removeLayers('网格')
      this.drawLoading && this.drawLoading.close()
      getAllGrids({ cjId: this.rowCjId }).then(res => {
          if (res.success) {
              this.gridList = res.data
              let data = res.data;
              let features = [];
              var coordinates = ''
              data.forEach((list)=> {
                  coordinates = WKT.parse(list.reshape).coordinates;
                  features.push({
                      type: 'Feature',
                      geometry: {
                          type: WKT.parse(list.reshape).type,
                          coordinates,
                      },
                      properties: {
                          id: list.fid,
                          name: list.name,
                          no: list.no ? list.no : 'rgba(218,112,214,.6)',
                          outline: list.no ? this.wgTypeOption.find( item => item.value == list.no).outline : 'rgba(218,112,214,1)',
                          params: {
                              fid: list.fid,
                              area: list.area,
                              duration: list.duration,
                              charger: list.charger,
                              name: list.name,
                              no: list.no,
                              remark: list.remark,
                              qydj: list.qydj,
                              ssds: list.ssds,
                              ssdsId: list.ssdsId,
                              yxdw: list.yxdw,
                              yxdwId: list.yxdwId,
                              gds: list.gds,
                              gdsId: list.gdsId,
                              remark: list.remark
                          }
                      }
                  })
              })
              if (features.length > 0) {
                  this.drawGrid(features)
              }
          }
      })
      getXlByGridId({ versionId: this.rowCjId }).then(res => {
          if (res.success) {
              this.lineList = res.data || [];
              this.lineList.forEach(item => {
                  item.fid = item.id;
              })
              this.getWj('考官')
          }
      })
    },
    //查询绘制网架
    getWj (year) {
        //绘制网架
        this.lineList.forEach((item)=> {
            this.removeLayers(`网架规划-draw-点-${item.id},网架规划-draw-线-${item.id}`)
        })
        this.removeLayers('网架规划-draw-变电站')
        var param = {
            sswjId: this.rowCjId, year: year
        }
        setTimeout(() => {
            //撒点撒线
            getWjByGrid(param).then((res) => {
            //193
            if (res.success) {
                if (res.data.length > 0) {
                    var drawData = res.data[0].ghWjghElementList ? res.data[0].ghWjghElementList : []
                    this.lineList.forEach((item)=> {
                        item.wjData = { featuresPoint: [], featuresLine: [] }
                    })
                    var bdzFeatures = [], markerFeatures = []
                    for (var i = 0; i < drawData.length; i++) {
                        var index = this.lineList.findIndex(item => drawData[i].dkxId && item.id == drawData[i].dkxId)
                        var geojson = WKT.parse(drawData[i].geom)
                        if (drawData[i].type == 'jkxl' || drawData[i].type == 'dlxl') {
                            this.lineList[index].wjData.featuresLine.push({
                                type: 'Feature',
                                geometry: {
                                type: 'LineString',
                                coordinates: geojson.coordinates,
                                },
                                properties: {
                                  id: drawData[i].id,
                                  name: drawData[i].name,
                                  type: drawData[i].type,
                                  lineColor: drawData[i].rotationAngle == '分支线' ? '#ffdf7e' : '#ff4949',
                                  startType: drawData[i].startType,
                                  connection: drawData[i].connection,
                                  endType: drawData[i].endType,
                                  startPoint: drawData[i].startPoint,
                                  startMx: drawData[i].startMx,
                                  endPoint: drawData[i].endPoint,
                                  endMx: drawData[i].endMx,
                                  year: drawData[i].year,
                                  dasharray: drawData[i].type == 'jkxl' ? [2, 0] : [2, 2],
                                  dkxId: drawData[i].dkxId,
                                  rotationAngle: drawData[i].rotationAngle,
                                  area: drawData[i].area
                                },
                            })
                            if(drawData[i].jsdzType && drawData[i].area == '是') {
                                markerFeatures.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: common.getGeometryCenter(geojson),
                                    },
                                    properties: {
                                        id: drawData[i].id,
                                        name: drawData[i].jsdzType
                                    }
                                })
                            }
                        } else if (['llkg', 'fdkg', 'fzkg', 'bdz10kv', 'bdz35kv', 'bdz110kv', 'zsb', 'pds', 'hwk', 'kbs', 'gt2022'].indexOf(drawData[i].type) != -1) {
                            if(['bdz10kv', 'bdz35kv', 'bdz110kv'].indexOf(drawData[i].type) != -1) {
                              bdzFeatures.push({
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
                              if(drawData[i].jsdzType && drawData[i].area == '是') {
                                markerFeatures.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: common.getGeometryCenter(geojson),
                                    },
                                    properties: {
                                        id: drawData[i].id,
                                        name: drawData[i].jsdzType
                                    }
                                })
                              }
                            } else if(['gt2022'].indexOf(drawData[i].type) != -1) {
                                this.lineList[index].wjData.featuresPoint.push({
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
                                this.lineList[index].wjData.featuresPoint.push({
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: geojson.coordinates,
                                },
                                properties: {
                                    id: drawData[i].id,
                                    name: drawData[i].name,
                                    type: drawData[i].type,
                                    url: require(`../../../components/wgdjModel/images/wjgh/${drawData[i].imgUrl + '2022'}.png`),
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
                        this.lineList.forEach((item)=> {
                            sgdps1.addGeometryLine(
                                `网架规划-draw-线-${item.id}`,
                                {
                                type: 'FeatureCollection',
                                features: item.wjData.featuresLine,
                                },
                                {
                                paint: {
                                    'line-dasharray': ["get", "dasharray"],
                                    "line-color": ["get", "lineColor"],
                                    "line-width": 3,
                                    "line-opacity": 1
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
                                `网架规划-draw-点-${item.id}`,
                                {
                                type: 'FeatureCollection',
                                features: item.wjData.featuresPoint,
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
                        })
                        console.log(bdzFeatures);
                        
                        sgdps1.addGeometryPoint(
                            `网架规划-draw-变电站`,
                            {
                                type: 'FeatureCollection',
                                features: bdzFeatures,
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
                        this.addMarker(markerFeatures)
                    }, 200)
                }
            }
            })
        }, 1000)
    },
    addMarker (features) {
        this.marker.forEach((item)=> {
            item && item.remove()
        })
        this.marker = []
        features.forEach((item)=> {
            var name = item.properties.name
            var el = document.createElement('div')
            el.style.top = "-15px"
            el.className = "pwgh-index-marker"
            el.innerHTML = `<p>${name}</p>`
            var elMarker = new SGMap.Marker({ element: el, anchor: "bottom" }).setLngLat(item.geometry.coordinates).addTo(sgdps1.map)
            this.marker.push(elMarker)
        })
    },
    //撒网格
    drawGrid(features) {
        sgdps1.addGeometryPolygon(
            '网格',
            {
                type: 'FeatureCollection',
                features: features,
            },
            {
                paint: {
                    'fill-color': ['get', 'no'],
                    'fill-opacity': 0.3,
                    'fill-outline-color': ['get', 'outline']
                },
                issText: false
            },
        )
        sgdps1.map.jumpTo({center: common.getGeometryCenter(features[0].geometry), zoom: 10 })
    },
    //地图点击事件
    mapClick(e) {
      this.gridDialog = false
      this.lineDialog = false
      var lines = []
      this.lineList.forEach((item)=> {
          lines.push(`网架规划-draw-线-${item.id}`)
      })
      let features = sgdps1.map.queryRenderedFeatures(e.point, { layers: ['网格', ...lines] })
      this.removeLayers('选中元素')
      if (features && features.length > 0) {
          if (features[0].source == '网格') {
              this.gridDetails = JSON.parse(features[0].properties.params)
              this.gridDialog = true
              var grid = this.gridList.find(item=> item.fid == features[0].properties.id)
              this.fitFeatures({ geometry: WKT.parse(grid.reshape) })
          } else {
              var lineFea = sgdps1.map.getSource(`网架规划-draw-线-${features[0].properties.dkxId}`)._data
              this.lineDetails = this.lineList.find(item=> item.id == features[0].properties.dkxId)
              this.lineDetails.grid = this.gridList.find(item=> item.fid == this.lineDetails.gridId).name
              sgdps1.addGeometryLine(
                  '选中元素',
                  lineFea,
                  {
                  style: {
                      lineColor: '#8a00b7',
                      lineOpacity: 1,
                      lineWidth: 5,
                      textField: this.lineDetails.name,
                      textSize: 18,
                      textColor: '#0099ff',
                      textHaloWidth: 10,
                  }
                  }
              )
              this.lineDialog = true
          }
      }
    },
    fitFeatures(feature, isFit) {
      this.removeLayers('选中元素')
      let geom = feature.geometry
      if(geom.type == 'Polygon') {
          sgdps1.addGeometryPolygon(
          '选中元素',
          {
              type: 'FeatureCollection',
              features: [{
              type: 'Feature',
              geometry: geom
              }]
          },
          {
              style: {
              fillColor: '#d291e7',
              fillOpacity: 0.8,
              outline: '#8a00b7',
              textField: '{name}',
              textSize: 12,
              textColor: '#ffffff'
              },
              issText: false,
          }
          )
          if(isFit) {
          sgdps1.map.jumpTo({center: common.getGeometryCenter(geom), zoom: 15 })
          }
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
          sgdps1.map.jumpTo({center: common.getGeometryCenter(geom), zoom: 17 })
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
          sgdps1.map.jumpTo({center: geom.coordinates, zoom: 17 })
          }
      }
    },
    removeLayers(str) {
      if (!(typeof sgdps1 != 'undefined' && sgdps1)) { return }
      let layers = str.split(',');
      layers.forEach(item => {
        if (typeof sgdps1.map.getSource(item) != 'undefined') {
          sgdps1.removeLayerById(item);
        }
      })
    },
    isBlankCanvasTarget(target) {
      if (!target) return false;
      if (target === this.$refs.flow) return true;
      return target.classList
        && (target.classList.contains('flow-transform')
          || target.classList.contains('edge-layer'));
    },
    changeYear(v) {
      this.activeYear = v;
      this.activeTool = 'select';
      this.resetInteractionState();
      this.renderTopologyData();
    },
    togglePageExpanded() {
      if (!this.isPageExpanded) {
        this.viewportBeforeExpanded = { ...this.viewport };
        this.isPageExpanded = true;
        document.getElementById('jxtMap') ? document.getElementById('jxtMap').style.display = 'none' : ''
        this.$nextTick(() => this.fitContentToView());
        return;
      }

      this.isPageExpanded = false;
      document.getElementById('jxtMap') ? document.getElementById('jxtMap').style.display = 'unset' : ''
      this.$nextTick(() => {
        if (this.hasTopologyContent()) {
          this.fitContentToView();
        } else if (this.viewportBeforeExpanded) {
          this.viewport = { ...this.viewportBeforeExpanded };
        }
        this.viewportBeforeExpanded = null;
      });
    },
    updateTopology() {
      if (this.isCurrentYear) return;
      this.$confirm('是否使用最新地图数据覆盖当前拓扑数据？', '提示', {
        type: "warning",
        confirmButtonText: "确认",
        showCancelButton: false
      }).then(() => {
        var form = new FormData()
        form.append("cjId", this.rowCjId || '');
        saveWjData(form).then(res => {
          this.hanldeData(res.data);
          const payload = this.getTopologyPayload();
          saveTopology({
            topology: payload,
            cjId: this.rowCjId,
          }).then(r => {
            if (r.success) {
              this.$message.success('更新成功!');
            } else {
              this.$message.error(r.msg);
            }
            
          }).catch(() => {
            this.$message.error('更新失败!');
          }).finally(() => {
            this.loading = false;
          })
        })
      })

    },
    saveTopology() {
      if (this.isCurrentYear) return;
      const payload = this.getTopologyPayload();
      console.log('DashboardV10 画布数据:', payload);
      this.loading = true;
      try {
        saveTopology({
          cjId: this.rowCjId,
          topology: payload
        }).then(res => {
          if (res.success) {
            this.$message.success('保存成功!');
          } else {
            this.$message.error(res.msg);
          }
        }).catch(() => {
          this.$message.error('保存失败!');
        }).finally(() => {
          this.loading = false;
        })
      } catch (error) {
        console.error('DashboardV10 保存失败:', error);
        this.$message.error('保存失败!');
      }
    },
    getTopologyPayload() {
      return {
        activeYear: this.activeYear,
        viewport: { ...this.viewport },
        nodes: this.serializeNodes(),
        buses: this.clonePlain(this.buses),
        edges: this.clonePlain(this.edges),
        nextNodeIndex: this.nextNodeIndex,
        nextEdgeIndex: this.nextEdgeIndex,
        nextBusIndex: this.nextBusIndex
      };
    },
    hanldeData(payload) {
      const topology = this.isReadyTopologyPayload(payload)
        ? this.normalizeReadyTopology(payload)
        : this.normalizeBackendTopology(payload);
      // this.activeYear = topology.activeYear;
      this.viewport = topology.viewport;
      this.nodes = topology.nodes;
      this.buses = topology.buses;
      this.edges = topology.edges;
      this.nextNodeIndex = topology.nextNodeIndex;
      this.nextEdgeIndex = topology.nextEdgeIndex;
      this.nextBusIndex = topology.nextBusIndex;
      this.resetInteractionState();
      this.$nextTick(() => this.fitContentToView());
    },
    renderTopologyData() {
      try {
        getTopology({
          // id: 1
          cjId: this.rowCjId,
          year: this.activeYear
        }).then(res => {
          let msg = res.msg && res.msg.replace(/\\"/g, '"') || '';
          let data = msg ? JSON.parse(msg) : null;
          if (!data) { // 考生没有保存过拓扑图，使用考官的地理网架拓扑图
            var form = new FormData()
            form.append("cjId", this.rowCjId || '');
            saveWjData(form).then(res => {
              this.hanldeData(res.data);
            })
          } else {
            this.hanldeData(data);
          }
        })
      } catch (error) {
        console.log(error);
        // localStorage.removeItem(STORAGE_KEY);
        // this.showSaveMessage('数据恢复失败，已重置');
      }
      // const payload = response && response.data ? response.data : response;
      // if (!payload) return;

      // const topology = this.isReadyTopologyPayload(payload)
      //   ? this.normalizeReadyTopology(payload)
      //   : this.normalizeBackendTopology(payload);
      // this.activeYear = topology.activeYear;
      // this.viewport = topology.viewport;
      // this.nodes = topology.nodes;
      // this.buses = topology.buses;
      // this.edges = topology.edges;
      // this.nextNodeIndex = topology.nextNodeIndex;
      // this.nextEdgeIndex = topology.nextEdgeIndex;
      // this.nextBusIndex = topology.nextBusIndex;
      // this.resetInteractionState();
      // this.$nextTick(() => this.fitContentToView());
    },
    isReadyTopologyPayload(payload) {
      const nodes = payload.nodes || [];
      const buses = payload.buses || [];
      const edges = payload.edges || [];
      return nodes.every(node => node.position && node.data)
        && buses.every(bus => bus.start && bus.end)
        && edges.every(edge => edge.sourcePoint && edge.targetPoint && (edge.type || edge.type2));
    },
    normalizeReadyTopology(payload) {
      const nodes = this.hydrateNodes(payload.nodes || []);
      const buses = this.clonePlain(payload.buses || []).map(bus => this.makeVerticalBus(bus));
      const nodeById = new Map(nodes.map(node => [node.id, node]));
      const busById = new Map(buses.map(bus => [bus.id, bus]));
      const edges = this.clonePlain(payload.edges || []).map(edge => this.buildOrthogonalEdge({
        sourceType: edge.sourceType || 'node',
        ...edge,
        type: LINE_TYPES.includes(edge.type) ? edge.type : this.frontendLineType(edge.type2),
        relationType: edge.relationType || (LINE_TYPES.includes(edge.type) ? edge.relationType : edge.type),
        rawLineType: edge.rawLineType || edge.type2
      }, nodeById, busById));

      return {
        activeYear: payload.activeYear || this.activeYear,
        viewport: payload.viewport || { x: 0, y: 0, zoom: 1 },
        nodes,
        buses,
        edges,
        nextNodeIndex: payload.nextNodeIndex || this.inferNextIndex(nodes, 'node'),
        nextEdgeIndex: payload.nextEdgeIndex || this.inferNextIndex(edges, 'edge'),
        nextBusIndex: payload.nextBusIndex || this.inferNextIndex(buses, 'bus')
      };
    },
    normalizeBackendTopology(payload) {
      const backendNodes = payload.nodes || [];
      const backendBusNodes = backendNodes.filter(node => this.isBackendBusType(node.type));
      const mergedBuses = this.mergeBackendBuses(payload.buses || [], backendBusNodes);
      const buses = this.normalizeBackendBuses(mergedBuses);
      const busIds = new Set(buses.map(bus => bus.id));
      const backendEdges = this.distributeBackendBusEdges(payload.edges || [], buses);
      const referencedNodeIds = this.getReferencedNodeIds(backendEdges, busIds);
      const drawableNodes = backendNodes.filter(node => {
        if (this.isBackendBusType(node.type)) return false;
        return !referencedNodeIds.size || referencedNodeIds.has(node.id);
      });
      const layoutPositions = this.makeAutoLayoutPositions(drawableNodes, backendEdges, buses);
      const nodes = this.normalizeBackendNodes(drawableNodes, layoutPositions);
      const edges = this.normalizeBackendEdges(backendEdges, nodes, buses, { freshLayout: true });

      return {
        activeYear: payload.activeYear || this.activeYear,
        viewport: payload.viewport || { x: 0, y: 0, zoom: 1 },
        nodes,
        buses,
        edges,
        nextNodeIndex: payload.nextNodeIndex || nodes.length + 1,
        nextEdgeIndex: payload.nextEdgeIndex || edges.length + 1,
        nextBusIndex: payload.nextBusIndex || buses.length + 1
      };
    },
    distributeBackendBusEdges(edges, buses) {
      const busesByVoltage = buses.reduce((map, bus) => {
        const voltage = this.busVoltage(bus);
        if (!voltage) return map;
        if (!map[voltage]) map[voltage] = [];
        map[voltage].push(bus);
        return map;
      }, {});
      const voltageIndex = {};
      const nextBusId = voltage => {
        const voltageBuses = busesByVoltage[voltage] || [];
        if (!voltageBuses.length) return '';
        const index = voltageIndex[voltage] || 0;
        voltageIndex[voltage] = index + 1;
        return voltageBuses[index % voltageBuses.length].id;
      };

      return edges.map(edge => {
        const normalizedEdge = { ...edge };
        const [relationSource, relationTarget] = String(edge.type || '').split('-to-');
        const sourceVoltage = this.busVoltageByRelationType(relationSource);
        const targetVoltage = this.busVoltageByRelationType(relationTarget);
        const sourceIsBus = buses.some(bus => bus.id === normalizedEdge.source);
        const targetIsBus = buses.some(bus => bus.id === normalizedEdge.target);

        if (sourceVoltage && !sourceIsBus) {
          normalizedEdge.source = nextBusId(sourceVoltage) || normalizedEdge.source;
        }
        if (targetVoltage && !targetIsBus) {
          normalizedEdge.target = nextBusId(targetVoltage) || normalizedEdge.target;
        }

        return normalizedEdge;
      });
    },
    getReferencedNodeIds(edges, busIds) {
      const ids = new Set();
      edges.forEach(edge => {
        if (edge.source && !busIds.has(edge.source)) ids.add(edge.source);
        if (edge.target && !busIds.has(edge.target)) ids.add(edge.target);
      });
      return ids;
    },
    mergeBackendBuses(buses, busNodes) {
      const busMap = new Map((buses || []).map(bus => [bus.id, { ...bus }]));

      const incomingBusNodes = busNodes.filter(node => !busMap.has(node.id));
      const existingCount = busMap.size;
      incomingBusNodes.forEach((node, index) => {
        const totalBuses = existingCount + incomingBusNodes.length;
        const isRight = totalBuses === 2 && (existingCount + index) === 1;
        const position = this.normalizePoint(node.position, {
          x: isRight ? 1900 : 180,
          y: 220
        });
        busMap.set(node.id, {
          id: node.id,
          name: this.backendBusName(node),
          start: position,
          end: {
            x: position.x,
            y: position.y + 10
          },
          backendType: node.type
        });
      });

      return Array.from(busMap.values());
    },
    normalizeBackendBuses(buses) {
      const sortedIds = [...buses]
        .sort((a, b) => this.busSideWeight(a) - this.busSideWeight(b))
        .map(bus => bus.id);
      return buses.map((bus, index) => {
        const isPair = buses.length === 2;
        const isRight = isPair && sortedIds.indexOf(bus.id) === 1;
        const groupTop = isPair ? 220 : (220 + index * 680);
        const defaultX = isRight ? 1900 : 180;
        const start = this.normalizePoint(bus.start, { x: defaultX, y: groupTop });
        const end = this.normalizePoint(bus.end, { x: defaultX, y: groupTop + 500 });
        const length = Math.hypot(end.x - start.x, end.y - start.y);

        if (length < 80) {
          return {
            id: bus.id || `bus-${index + 1}`,
            name: bus.name || this.defaultBusName(index + 1),
            start: { x: defaultX, y: groupTop },
            end: { x: defaultX, y: groupTop + 500 }
          };
        }

        return this.makeVerticalBus({
          id: bus.id || `bus-${index + 1}`,
          name: bus.name || this.defaultBusName(index + 1),
          start,
          end
        });
      });
    },
    normalizeBackendNodes(nodes, layoutPositions) {
      return nodes.map((node, index) => {
        const type = this.frontendNodeType(node.type);
        const data = node.data || {};
        return {
          id: node.id || `node-${index + 1}`,
          type,
          position: this.normalizePoint(node.position, layoutPositions[node.id] || { x: 820 + index * 260, y: 260 }),
          data: {
            label: data.label || this.nodeLabelByType(type),
            name: data.name || this.backendNodeName(node.type, index + 1),
            backendType: node.type
          }
        };
      }).map(node => ({
        ...node,
        data: {
          ...node.data,
          src: this.nodeIconByType(node.type)
        }
      }));
    },
    normalizeBackendEdges(edges, nodes, buses, options = {}) {
      const nodeById = new Map(nodes.map(node => [node.id, node]));
      const busById = new Map(buses.map(bus => [bus.id, bus]));

      const seenEdgeKeys = new Set();
      const normalizedEdges = edges.reduce((result, edge, index) => {
        const sourceIsBus = busById.has(edge.source);
        const targetIsBus = busById.has(edge.target);
        const normalizedSource = targetIsBus && !sourceIsBus ? edge.target : edge.source;
        const normalizedTarget = targetIsBus && !sourceIsBus ? edge.source : edge.target;
        const sourceType = edge.sourceType || (busById.has(normalizedSource) ? 'bus' : 'node');
        const sourceNode = nodeById.get(normalizedSource);
        const targetNode = nodeById.get(normalizedTarget);
        const sourceBus = busById.get(normalizedSource);
        const hasValidSource = sourceType === 'bus' ? !!sourceBus : !!sourceNode;
        if (!hasValidSource || !targetNode) {
          console.warn('DashboardV10 跳过无效拓扑连线:', edge);
          return result;
        }
        const sourcePoint = options.freshLayout
          ? null
          : this.normalizeEdgeSourcePoint(edge, sourceType, sourceNode, sourceBus, targetNode);
        const targetPoint = options.freshLayout
          ? null
          : this.normalizeEdgeTargetPoint(edge, targetNode, sourcePoint);
        const edgeKey = [
          `${sourceType === 'bus' ? 'bus' : 'node'}:${normalizedSource}`,
          `node:${normalizedTarget}`
        ].sort().join('|');
        if (seenEdgeKeys.has(edgeKey)) return result;
        seenEdgeKeys.add(edgeKey);

        result.push({
          id: edge.id || `edge-${index + 1}`,
          sourceType,
          source: normalizedSource,
          target: normalizedTarget,
          sourcePoint,
          targetPoint,
          type: this.frontendLineType(edge.type2),
          relationType: edge.type,
          rawLineType: edge.type2,
          rawSource: edge.source,
          rawTarget: edge.target,
          reversedFromBackend: targetIsBus && !sourceIsBus,
          waypoints: options.freshLayout
            ? []
            : (Array.isArray(edge.waypoints)
              ? edge.waypoints.map(point => this.normalizePoint(point))
              : [])
        });
        return result;
      }, []);

      return this.routeBackendEdges(normalizedEdges, nodeById, busById);
    },
    routeBackendEdges(edges, nodeById, busById) {
      const routed = edges.map(edge => this.buildOrthogonalEdge(edge, nodeById, busById));
      return this.straightenAlignedDeviceEdges(routed, nodeById, busById);
    },
    makeAutoLayoutPositions(nodes, edges, buses) {
      const nodeIds = new Set(nodes.map(node => node.id));
      const busIds = new Set(buses.map(bus => bus.id));
      const childrenBySource = new Map();
      const nodeNeighbors = new Map();
      const rootsByBus = new Map();
      const busIdsByRoot = new Map();
      const nodeIncomingFromNode = new Set();
      const assignedNodes = new Set();

      edges.forEach(edge => {
        const sourceIsBus = busIds.has(edge.source);
        const targetIsBus = busIds.has(edge.target);
        const busId = sourceIsBus ? edge.source : (targetIsBus ? edge.target : '');
        const nodeId = sourceIsBus ? edge.target : (targetIsBus ? edge.source : '');

        if (busId && nodeIds.has(nodeId)) {
          if (!rootsByBus.has(busId)) rootsByBus.set(busId, []);
          const roots = rootsByBus.get(busId);
          if (!roots.includes(nodeId)) roots.push(nodeId);
          if (!busIdsByRoot.has(nodeId)) busIdsByRoot.set(nodeId, []);
          const rootBusIds = busIdsByRoot.get(nodeId);
          if (!rootBusIds.includes(busId)) rootBusIds.push(busId);
          return;
        }

        if (!nodeIds.has(edge.target)) return;
        if (!nodeIds.has(edge.source)) return;
        if (!childrenBySource.has(edge.source)) childrenBySource.set(edge.source, []);
        const children = childrenBySource.get(edge.source);
        if (!children.includes(edge.target)) children.push(edge.target);
        if (!nodeNeighbors.has(edge.source)) nodeNeighbors.set(edge.source, []);
        if (!nodeNeighbors.has(edge.target)) nodeNeighbors.set(edge.target, []);
        if (!nodeNeighbors.get(edge.source).includes(edge.target)) nodeNeighbors.get(edge.source).push(edge.target);
        if (!nodeNeighbors.get(edge.target).includes(edge.source)) nodeNeighbors.get(edge.target).push(edge.source);
        nodeIncomingFromNode.add(edge.target);
      });

      const levelGap = 360;
      const rootGap = 220;
      const branchGap = 170;
      const componentGap = 320;
      const baseBusSideGap = 760;
      const busHeight = 620;
      const gridTopPadding = 90;
      const positions = {};
      const busLayoutMap = new Map();
      const graph = new Map();
      const addGraphLink = (from, to) => {
        if (!from || !to) return;
        if (!graph.has(from)) graph.set(from, []);
        if (!graph.has(to)) graph.set(to, []);
        graph.get(from).push(to);
        graph.get(to).push(from);
      };

      edges.forEach(edge => {
        const sourceKnown = busIds.has(edge.source) || nodeIds.has(edge.source);
        const targetKnown = busIds.has(edge.target) || nodeIds.has(edge.target);
        if (sourceKnown && targetKnown) addGraphLink(edge.source, edge.target);
      });

      const components = [];
      const visitedComponentIds = new Set();
      [...busIds, ...nodeIds].forEach(id => {
        if (visitedComponentIds.has(id)) return;
        const component = { ids: [], buses: [], nodes: [] };
        const queue = [id];
        visitedComponentIds.add(id);

        while (queue.length) {
          const current = queue.shift();
          component.ids.push(current);
          if (busIds.has(current)) component.buses.push(current);
          if (nodeIds.has(current)) component.nodes.push(current);
          (graph.get(current) || []).forEach(nextId => {
            if (visitedComponentIds.has(nextId)) return;
            visitedComponentIds.add(nextId);
            queue.push(nextId);
          });
        }

        components.push(component);
      });

      const busById = new Map(buses.map(bus => [bus.id, bus]));

      const leftX = 180;
      const rightX = 1900;
      const busLinkedNodeCount = busId => {
        const roots = rootsByBus.get(busId) || [];
        const visited = new Set();
        const queue = [...roots];

        while (queue.length) {
          const current = queue.shift();
          if (visited.has(current) || !nodeIds.has(current)) continue;
          visited.add(current);
          (nodeNeighbors.get(current) || []).forEach(nextId => {
            if (nodeIds.has(nextId) && !visited.has(nextId)) queue.push(nextId);
          });
        }

        return visited.size || roots.length || 1;
      };
      const busVerticalGap = busId => {
        const roots = rootsByBus.get(busId) || [];
        const linkedCount = busLinkedNodeCount(busId);
        return Math.max(baseBusSideGap, busHeight + roots.length * 90 + linkedCount * 18);
      };
      const shouldPlaceBusOnRight = (busIdsInGroup, sortedBusIds, bus, index) => {
        if (busIdsInGroup.length <= 1) return false;
        if (busIdsInGroup.length === 2 || buses.length === 2) return index === 1;
        const sides = sortedBusIds.map(id => this.isRightSideBus(busById.get(id)));
        if (sides.some(Boolean) && sides.some(value => !value)) return this.isRightSideBus(bus);
        return index % 2 === 1;
      };
      const placeBus = (bus, isRightSide, groupTop, sideIndex) => {
        const busX = isRightSide ? rightX : leftX;
        const busTop = groupTop;
        bus.start = { x: busX, y: busTop };
        bus.end = { x: busX, y: busTop + busHeight };
        busLayoutMap.set(bus.id, {
          startX: busX + (isRightSide ? -300 : 300),
          startY: busTop + 110,
          groupTop,
          sideIndex,
          direction: isRightSide ? -1 : 1
        });
      };

      if (buses.length === 2) {
        const sortedBuses = [...buses].sort((a, b) => this.busSideWeight(a) - this.busSideWeight(b));
        sortedBuses.forEach((bus, index) => {
          placeBus(bus, index === 1, 220, index);
        });
      } else {
        let busGroupOffsetY = 0;
        components.forEach(component => {
          if (!component.buses.length) return;
          const groupTop = 220 + busGroupOffsetY;
          let leftCount = 0;
          let rightCount = 0;
          let leftOffsetY = 0;
          let rightOffsetY = 0;
          const sortedBusIds = [...component.buses].sort((a, b) => {
            const busA = busById.get(a);
            const busB = busById.get(b);
            return this.busSideWeight(busA) - this.busSideWeight(busB);
          });

          sortedBusIds.forEach((busId, index) => {
            const bus = busById.get(busId);
            if (!bus) return;
            const isRightSide = shouldPlaceBusOnRight(component.buses, sortedBusIds, bus, index);
            const sideIndex = isRightSide ? rightCount++ : leftCount++;
            const busTop = groupTop + (isRightSide ? rightOffsetY : leftOffsetY);
            placeBus(bus, isRightSide, busTop, sideIndex);
            if (isRightSide) {
              rightOffsetY += busVerticalGap(busId);
            } else {
              leftOffsetY += busVerticalGap(busId);
            }
          });
          busGroupOffsetY += Math.max(leftOffsetY, rightOffsetY, baseBusSideGap) + componentGap;
        });
      }

      components.forEach(component => {
        if (!component.nodes.length) return;
        const componentBusLayouts = component.buses
          .map(busId => busLayoutMap.get(busId))
          .filter(Boolean);
        const groupTop = componentBusLayouts.length
          ? Math.min(...componentBusLayouts.map(layout => layout.groupTop))
          : 220;
        const componentBuses = component.buses
          .map(busId => busById.get(busId))
          .filter(Boolean);
        const minBusY = componentBuses.length
          ? Math.min(...componentBuses.map(bus => Math.min(bus.start.y, bus.end.y)))
          : groupTop;
        const maxBusY = componentBuses.length
          ? Math.max(...componentBuses.map(bus => Math.max(bus.start.y, bus.end.y)))
          : groupTop + busHeight;
        const nodeMinY = minBusY + 70;
        const nodeMaxY = Math.max(nodeMinY, maxBusY - 70);
        const minBusX = componentBuses.length
          ? Math.min(...componentBuses.map(bus => Math.min(bus.start.x, bus.end.x)))
          : 180;
        const maxBusX = componentBuses.length
          ? Math.max(...componentBuses.map(bus => Math.max(bus.start.x, bus.end.x)))
          : minBusX + 1700;
        const nodeMinX = minBusX + 260;
        const nodeMaxX = Math.max(nodeMinX, maxBusX - 260);
        const leftRoots = component.buses
          .filter(busId => {
            const layout = busLayoutMap.get(busId);
            return layout && layout.direction > 0;
          })
          .flatMap(busId => rootsByBus.get(busId) || []);
        const rightRoots = component.buses
          .filter(busId => {
            const layout = busLayoutMap.get(busId);
            return layout && layout.direction < 0;
          })
          .flatMap(busId => rootsByBus.get(busId) || []);
        const fallbackRoots = component.nodes.filter(id => !nodeIncomingFromNode.has(id));
        const uniqueLeftRoots = [...new Set(leftRoots.length ? leftRoots : fallbackRoots)];
        const uniqueRightRoots = [...new Set(rightRoots)];
        const distanceFrom = starts => {
          const distances = new Map();
          const queue = starts
            .filter(id => component.nodes.includes(id))
            .map(id => ({ id, distance: 0 }));

          queue.forEach(item => distances.set(item.id, 0));
          while (queue.length) {
            const current = queue.shift();
            (nodeNeighbors.get(current.id) || []).forEach(nextId => {
              if (!component.nodes.includes(nextId)) return;
              if (distances.has(nextId)) return;
              distances.set(nextId, current.distance + 1);
              queue.push({ id: nextId, distance: current.distance + 1 });
            });
          }
          return distances;
        };
        const leftDistances = distanceFrom(uniqueLeftRoots);
        const rightDistances = distanceFrom(uniqueRightRoots);
        const yPositions = new Map();
        const rootLaneY = new Map();
        const rootsByComponentBus = component.buses.map(busId => ({
          busId,
          layout: busLayoutMap.get(busId),
          roots: rootsByBus.get(busId) || []
        })).filter(item => item.layout);
        const bridgeRoots = component.nodes.filter(id => (busIdsByRoot.get(id) || []).length > 1);

        bridgeRoots.forEach((id, index) => {
          const connectedBusLayouts = (busIdsByRoot.get(id) || [])
            .map(busId => busLayoutMap.get(busId))
            .filter(Boolean);
          const baseY = connectedBusLayouts.length
            ? connectedBusLayouts.reduce((sum, layout) => sum + layout.startY, 0) / connectedBusLayouts.length
            : nodeMinY + 45;
          rootLaneY.set(id, this.clamp(baseY + index * 90, nodeMinY, nodeMaxY));
        });
        rootsByComponentBus.forEach(({ layout, roots }) => {
          const sideRoots = roots.filter(id => !rootLaneY.has(id));
          const bridgeCount = roots.length - sideRoots.length;
          const rootOffsetY = bridgeCount ? Math.min(220, 130 + bridgeCount * 35) : 0;
          const rootGapY = Math.max(140, Math.min(190, 120 + sideRoots.length * 15));
          const rootStartY = layout.startY + rootOffsetY;
          sideRoots.forEach((id, index) => {
            rootLaneY.set(id, this.clamp(rootStartY + index * rootGapY, nodeMinY, nodeMaxY));
          });
        });
        fallbackRoots.forEach((id, index) => {
          if (!rootLaneY.has(id)) {
            rootLaneY.set(id, this.clamp(nodeMinY + 170 + index * 150, nodeMinY, nodeMaxY));
          }
        });

        component.nodes.forEach((id, index) => {
          const leftDistance = leftDistances.has(id) ? leftDistances.get(id) : Infinity;
          const rightDistance = rightDistances.has(id) ? rightDistances.get(id) : Infinity;
          const connectedBusLayouts = (busIdsByRoot.get(id) || [])
            .map(busId => busLayoutMap.get(busId))
            .filter(Boolean);
          let x;

          if (connectedBusLayouts.length > 1) {
            x = connectedBusLayouts.reduce((sum, layout) => sum + layout.startX, 0) / connectedBusLayouts.length;
          } else if (Number.isFinite(leftDistance) && Number.isFinite(rightDistance)) {
            const totalDistance = leftDistance + rightDistance;
            const ratio = totalDistance === 0 ? 0.5 : leftDistance / totalDistance;
            x = nodeMinX + (nodeMaxX - nodeMinX) * ratio;
          } else if (Number.isFinite(leftDistance)) {
            x = nodeMinX + leftDistance * levelGap;
          } else if (Number.isFinite(rightDistance)) {
            x = nodeMaxX - rightDistance * levelGap;
          } else {
            x = nodeMinX + (index % 4) * levelGap;
          }

          const anchorY = rootLaneY.has(id)
            ? rootLaneY.get(id)
            : (connectedBusLayouts.length
              ? connectedBusLayouts.reduce((sum, layout) => sum + layout.startY, 0) / connectedBusLayouts.length
              : groupTop + gridTopPadding + index * branchGap);
          positions[id] = {
            x: Math.round(this.clamp(x, nodeMinX, nodeMaxX)),
            y: Math.round(this.clamp(anchorY, nodeMinY, nodeMaxY))
          };
          yPositions.set(id, positions[id].y);
          assignedNodes.add(id);
        });

        const parentsByTarget = new Map();
        childrenBySource.forEach((children, sourceId) => {
          children.forEach((childId, index) => {
            if (!parentsByTarget.has(childId)) parentsByTarget.set(childId, []);
            parentsByTarget.get(childId).push({ sourceId, index, count: children.length });
          });
        });

        for (let i = 0; i < 12; i += 1) {
          component.nodes.forEach(id => {
            if (rootLaneY.has(id)) {
              yPositions.set(id, rootLaneY.get(id));
              return;
            }
            const parents = (parentsByTarget.get(id) || [])
              .filter(parent => component.nodes.includes(parent.sourceId) && yPositions.has(parent.sourceId));
            if (!parents.length) return;
            const parentY = parents.reduce((sum, parent) => {
              const siblingGap = Math.max(110, Math.min(150, 100 + parent.count * 15));
              const siblingOffset = (parent.index - (parent.count - 1) / 2) * siblingGap;
              return sum + (yPositions.get(parent.sourceId) || positions[id].y) + siblingOffset;
            }, 0) / parents.length;
            yPositions.set(id, this.clamp(parentY, nodeMinY, nodeMaxY));
          });
        }

        const columnGroups = {};
        component.nodes.forEach(id => {
          const column = Math.round(positions[id].x / 120);
          if (!columnGroups[column]) columnGroups[column] = [];
          columnGroups[column].push(id);
        });

        Object.keys(columnGroups).forEach(column => {
          const ids = columnGroups[column].sort((a, b) => (yPositions.get(a) || 0) - (yPositions.get(b) || 0));
          const minGap = 96;
          ids.forEach((id, index) => {
            const minY = index === 0 ? nodeMinY : positions[ids[index - 1]].y + minGap;
            positions[id].y = Math.round(this.clamp(yPositions.get(id) || positions[id].y, minY, nodeMaxY));
          });
          for (let index = ids.length - 2; index >= 0; index -= 1) {
            const id = ids[index];
            const maxY = positions[ids[index + 1]].y - minGap;
            positions[id].y = Math.round(this.clamp(positions[id].y, nodeMinY, maxY));
          }
        });

        this.spreadCrowdedNodes(component.nodes, positions, {
          minX: nodeMinX,
          maxX: nodeMaxX,
          minY: nodeMinY,
          maxY: nodeMaxY
        });
        this.reduceLineCrossings(component.nodes, component.buses, positions, edges, busById, {
          minY: nodeMinY,
          maxY: nodeMaxY
        });
        this.spreadCrowdedNodes(component.nodes, positions, {
          minX: nodeMinX,
          maxX: nodeMaxX,
          minY: nodeMinY,
          maxY: nodeMaxY
        });
        this.reduceLineCrossings(component.nodes, component.buses, positions, edges, busById, {
          minY: nodeMinY,
          maxY: nodeMaxY
        });
      });

      const unassignedRoots = nodes
        .filter(node => !assignedNodes.has(node.id) && !nodeIncomingFromNode.has(node.id))
        .map(node => node.id);
      const unassignedChildren = nodes
        .filter(node => !assignedNodes.has(node.id) && nodeIncomingFromNode.has(node.id))
        .map(node => node.id);
      const unassigned = [...unassignedRoots, ...unassignedChildren];
      const fallbackTop = buses.length ? Math.max(...buses.map(bus => Math.max(bus.start.y, bus.end.y))) + 180 : 300;

      unassigned.forEach((id, index) => {
        positions[id] = {
          x: 480 + (index % 4) * levelGap,
          y: fallbackTop + Math.floor(index / 4) * rootGap
        };
      });

      nodes.forEach((node, index) => {
        if (!positions[node.id]) {
          positions[node.id] = {
            x: 480 + (index % 4) * levelGap,
            y: fallbackTop + Math.floor(index / 4) * rootGap
          }
        }
      });

      this.alignConnectedNodesHorizontally(nodes, edges, buses, positions);
      return positions;
    },
    alignConnectedNodesHorizontally(nodes, edges, buses, positions) {
      const nodeIds = new Set(nodes.map(node => node.id));
      const parent = {};
      const find = id => {
        if (parent[id] !== id) parent[id] = find(parent[id]);
        return parent[id];
      };
      const union = (first, second) => {
        parent[find(first)] = find(second);
      };
      nodeIds.forEach(id => { parent[id] = id; });

      const snapY = 72;
      const minDx = 80;
      edges.forEach(edge => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
        const first = positions[edge.source];
        const second = positions[edge.target];
        if (!first || !second) return;
        const dx = Math.abs(first.x - second.x);
        const dy = Math.abs(first.y - second.y);
        if (dx < minDx || dx < dy || dy > snapY) return;
        union(edge.source, edge.target);
      });

      const groups = new Map();
      nodeIds.forEach(id => {
        if (!positions[id]) return;
        const root = find(id);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(id);
      });

      groups.forEach(ids => {
        if (ids.length < 2) return;
        const sortedY = ids.map(id => positions[id].y).sort((a, b) => a - b);
        const alignedY = Math.round(sortedY[Math.floor(sortedY.length / 2)]);
        ids.forEach(id => {
          positions[id].y = alignedY;
        });
      });

      const ordered = [...nodeIds].filter(id => positions[id]).sort((a, b) => {
        const first = positions[a];
        const second = positions[b];
        return first.y - second.y || first.x - second.x;
      });
      for (let i = 0; i < ordered.length; i += 1) {
        for (let j = i + 1; j < ordered.length; j += 1) {
          const first = positions[ordered[i]];
          const second = positions[ordered[j]];
          if (Math.abs(first.y - second.y) > 4) break;
          const gap = 130 - Math.abs(first.x - second.x);
          if (gap <= 0) continue;
          const direction = first.x <= second.x ? -1 : 1;
          first.x -= direction * Math.ceil(gap / 2);
          second.x += direction * Math.ceil(gap / 2);
        }
      }
    },
    straightenAlignedDeviceEdges(edges, nodeById, busById) {
      return edges.map(edge => {
        if (edge.manualPath) return edge;
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        const sourceBus = busById.get(edge.source);
        if (sourceNode && targetNode) {
          const sourceCenter = this.nodeCenter(sourceNode);
          const targetCenter = this.nodeCenter(targetNode);
          if (Math.abs(sourceCenter.y - targetCenter.y) <= 2) {
            const goingRight = sourceCenter.x <= targetCenter.x;
            const sourceSide = goingRight ? 'right' : 'left';
            const targetSide = goingRight ? 'left' : 'right';
            return {
              ...edge,
              sourceSide,
              targetSide,
              sourcePoint: this.nodeSidePoint(sourceNode, sourceSide),
              targetPoint: this.nodeSidePoint(targetNode, targetSide),
              waypoints: []
            };
          }
          if (Math.abs(sourceCenter.x - targetCenter.x) <= 2) {
            const goingDown = sourceCenter.y <= targetCenter.y;
            const sourceSide = goingDown ? 'bottom' : 'top';
            const targetSide = goingDown ? 'top' : 'bottom';
            return {
              ...edge,
              sourceSide,
              targetSide,
              sourcePoint: this.nodeSidePoint(sourceNode, sourceSide),
              targetPoint: this.nodeSidePoint(targetNode, targetSide),
              waypoints: []
            };
          }
        }
        if (sourceBus && targetNode) {
          const center = this.nodeCenter(targetNode);
          const tap = this.projectPointToVerticalBus(center, sourceBus);
          if (Math.abs(tap.y - center.y) <= 2) {
            const targetSide = center.x >= sourceBus.start.x ? 'left' : 'right';
            return {
              ...edge,
              targetSide,
              sourcePoint: tap,
              targetPoint: this.nodeSidePoint(targetNode, targetSide),
              waypoints: []
            };
          }
        }
        return edge;
      });
    },
    spreadCrowdedNodes(nodeIds, positions, bounds) {
      const minGapX = 130;
      const minGapY = 108;

      for (let round = 0; round < 6; round += 1) {
        nodeIds.forEach((sourceId, sourceIndex) => {
          nodeIds.slice(sourceIndex + 1).forEach((targetId, targetIndex) => {
            const source = positions[sourceId];
            const target = positions[targetId];
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const overlapX = minGapX - Math.abs(dx);
            const overlapY = minGapY - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) return;

            const directionX = dx === 0 ? (targetIndex % 2 ? 1 : -1) : Math.sign(dx);
            const directionY = dy === 0 ? (sourceIndex % 2 ? 1 : -1) : Math.sign(dy);
            const yPush = overlapY / 2;
            const xPush = Math.min(overlapX / 2, 28);

            source.y = this.clamp(Math.round(source.y - directionY * yPush), bounds.minY, bounds.maxY);
            target.y = this.clamp(Math.round(target.y + directionY * yPush), bounds.minY, bounds.maxY);
            source.x = this.clamp(Math.round(source.x - directionX * xPush), bounds.minX, bounds.maxX);
            target.x = this.clamp(Math.round(target.x + directionX * xPush), bounds.minX, bounds.maxX);
          });
        });
      }
    },
    reduceLineCrossings(nodeIds, busIds, positions, edges, busById, bounds) {
      const nodeSet = new Set(nodeIds);
      const busSet = new Set(busIds);
      const layoutEdges = edges.filter(edge => {
        const sourceKnown = nodeSet.has(edge.source) || busSet.has(edge.source);
        const targetKnown = nodeSet.has(edge.target) || busSet.has(edge.target);
        return sourceKnown && targetKnown;
      });
      let bestCrossings = this.countLayoutCrossings(layoutEdges, nodeSet, positions, busById);
      if (!bestCrossings) return;

      for (let round = 0; round < 8; round += 1) {
        let improved = false;
        const orderedIds = [...nodeIds].sort((a, b) => {
          const pointA = positions[a] || { x: 0, y: 0 };
          const pointB = positions[b] || { x: 0, y: 0 };
          return pointA.x - pointB.x || pointA.y - pointB.y;
        });

        for (let i = 0; i < orderedIds.length; i += 1) {
          for (let j = i + 1; j < orderedIds.length; j += 1) {
            const first = positions[orderedIds[i]];
            const second = positions[orderedIds[j]];
            if (!first || !second) continue;

            const firstY = first.y;
            const secondY = second.y;
            if (Math.abs(firstY - secondY) > 520) continue;

            first.y = this.clamp(secondY, bounds.minY, bounds.maxY);
            second.y = this.clamp(firstY, bounds.minY, bounds.maxY);

            const crossingCount = this.countLayoutCrossings(layoutEdges, nodeSet, positions, busById);
            if (crossingCount < bestCrossings) {
              bestCrossings = crossingCount;
              improved = true;
              if (!bestCrossings) return;
            } else {
              first.y = firstY;
              second.y = secondY;
            }
          }
        }

        if (!improved) return;
      }
    },
    countLayoutCrossings(edges, nodeSet, positions, busById) {
      const segments = edges
        .map(edge => this.layoutEdgeSegment(edge, nodeSet, positions, busById))
        .filter(Boolean);
      let count = 0;

      for (let i = 0; i < segments.length; i += 1) {
        for (let j = i + 1; j < segments.length; j += 1) {
          const first = segments[i];
          const second = segments[j];
          if (this.segmentsShareEndpoint(first, second)) continue;
          if (this.segmentsCross(first.from, first.to, second.from, second.to)) count += 1;
        }
      }

      return count;
    },
    layoutEdgeSegment(edge, nodeSet, positions, busById) {
      const sourceIsNode = nodeSet.has(edge.source);
      const targetIsNode = nodeSet.has(edge.target);
      const sourcePoint = sourceIsNode ? this.layoutNodeCenter(edge.source, positions) : null;
      const targetPoint = targetIsNode ? this.layoutNodeCenter(edge.target, positions) : null;
      const sourceBus = busById.get(edge.source);
      const targetBus = busById.get(edge.target);

      if (sourcePoint && targetPoint) {
        return { source: edge.source, target: edge.target, from: sourcePoint, to: targetPoint };
      }
      if (sourceBus && targetPoint) {
        return {
          source: edge.source,
          target: edge.target,
          from: this.layoutBusPoint(sourceBus, targetPoint),
          to: targetPoint
        };
      }
      if (sourcePoint && targetBus) {
        return {
          source: edge.source,
          target: edge.target,
          from: sourcePoint,
          to: this.layoutBusPoint(targetBus, sourcePoint)
        };
      }
      return null;
    },
    layoutNodeCenter(id, positions) {
      const position = positions[id];
      if (!position) return null;
      return {
        x: position.x + NODE_SIZE / 2,
        y: position.y + NODE_SIZE / 2
      };
    },
    layoutBusPoint(bus, toward) {
      const minY = Math.min(bus.start.y, bus.end.y);
      const maxY = Math.max(bus.start.y, bus.end.y);
      return {
        x: bus.start.x,
        y: this.clamp(toward.y, minY, maxY)
      };
    },
    segmentsShareEndpoint(first, second) {
      return first.source === second.source
        || first.source === second.target
        || first.target === second.source
        || first.target === second.target;
    },
    segmentsCross(a, b, c, d) {
      const abC = this.segmentOrientation(a, b, c);
      const abD = this.segmentOrientation(a, b, d);
      const cdA = this.segmentOrientation(c, d, a);
      const cdB = this.segmentOrientation(c, d, b);
      return abC * abD < 0 && cdA * cdB < 0;
    },
    segmentOrientation(a, b, c) {
      const value = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(value) < 0.001) return 0;
      return value > 0 ? 1 : -1;
    },
    normalizeEdgeSourcePoint(edge, sourceType, sourceNode, sourceBus, targetNode) {
      if (edge.sourcePoint) return this.normalizePoint(edge.sourcePoint);
      if (!targetNode) return { x: 0, y: 0 };

      const targetCenter = this.nodeCenter(targetNode);
      if (sourceType === 'bus' && sourceBus) {
        return this.projectPointToBus(targetCenter, sourceBus);
      }
      if (sourceNode) {
        return this.nodeBoundaryPoint(sourceNode, targetCenter);
      }
      return targetCenter;
    },
    normalizeEdgeTargetPoint(edge, targetNode, sourcePoint) {
      if (edge.targetPoint) return this.normalizePoint(edge.targetPoint);
      if (!targetNode) return { x: 0, y: 0 };
      return this.nodeBoundaryPoint(targetNode, sourcePoint);
    },
    normalizePoint(point, fallback = { x: 0, y: 0 }) {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        return { ...fallback };
      }
      return {
        x: Math.round(point.x),
        y: Math.round(point.y)
      };
    },
    frontendNodeType(type) {
      const typeMap = {
        fdkg: 'breaker',
        fzkg: 'breaker',
        hwk: 'hw',
        pds: 'pd',
        llkg: 'breaker',
        kbs: 'kg'
      };
      return typeMap[type] || type;
    },
    isBackendBusType(type) {
      return ['bdz110kv', 'bdz35kv'].includes(type);
    },
    isRightSideBus(bus) {
      return this.busVoltage(bus) === '35kv';
    },
    busSideWeight(bus) {
      return this.isRightSideBus(bus) ? 2 : 1;
    },
    busVoltage(bus) {
      const text = `${bus && bus.name || ''}${bus && bus.backendType || ''}`.toLowerCase();
      if (text.includes('110kv') || text.includes('bdz110kv')) return '110kv';
      if (text.includes('35kv') || text.includes('bdz35kv')) return '35kv';
      return '';
    },
    busVoltageByRelationType(type) {
      const text = String(type || '').toLowerCase();
      if (text === 'bdz110kv') return '110kv';
      if (text === 'bdz35kv') return '35kv';
      return '';
    },
    backendBusName(node) {
      const data = node.data || {};
      const nameMap = {
        bdz110kv: '110kV变电站',
        bdz35kv: '35kV变电站'
      };
      return data.name || data.label || nameMap[node.type] || '变电站';
    },
    frontendLineType(type) {
      const typeMap = {
        jkxl: 'overhead',
        dlxl: 'cable'
      };
      return typeMap[type] || type || 'overhead';
    },
    backendNodeName(type, index) {
      const nameMap = {
        fdkg: '分段开关',
        fzkg: '分支开关',
        hwk: '环网柜',
        pds: 'T节点',
        llkg: '联络开关',
        kbs: '开闭所'
      };
      return `${nameMap[type] || '节点'}${index}`;
    },
    clearTopology() {
      if (this.isCurrentYear) return;
      if (!window.confirm('确定要清空当前拓扑图吗？')) return;
      this.nodes = [];
      this.buses = [];
      this.edges = [];
      this.nextNodeIndex = 1;
      this.nextEdgeIndex = 1;
      this.nextBusIndex = 1;
      this.resetInteractionState();
      localStorage.removeItem(STORAGE_KEY);
      this.showSaveMessage('已清空');
    },
    resetInteractionState() {
      this.selectedNodeId = '';
      this.selectedElement = null;
      this.editingNodeId = '';
      this.editingNodeName = '';
      this.editingBusId = '';
      this.editingBusName = '';
      this.editingEdgeId = '';
      this.editingEdgeLabel = '';
      this.resetTransientState();
    },
    resetTransientState() {
      this.dragState = null;
      this.busDragState = null;
      this.panState = null;
      this.connection = null;
      this.busDraft = null;
    },
    showSaveMessage(message) {
      this.saveMessage = message;
      window.clearTimeout(this.saveMessageTimer);
      this.saveMessageTimer = window.setTimeout(() => {
        this.saveMessage = '';
      }, 1800);
    },
    serializeNodes() {
      return this.nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: { ...node.position },
        data: {
          label: node.data.label,
          name: node.data.name,
          backendType: node.data.backendType
        }
      }));
    },
    clonePlain(value) {
      return JSON.parse(JSON.stringify(value));
    },
    inferNextIndex(items, prefix) {
      const maxIndex = items.reduce((max, item) => {
        const match = String(item.id || '').match(new RegExp(`^${prefix}-(\\d+)$`));
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      return maxIndex + 1;
    },
    hydrateNodes(nodes) {
      return nodes.map(node => ({
        ...node,
        data: {
          ...(node.data || {}),
          label: node.data && node.data.label ? node.data.label : this.nodeLabelByType(node.type),
          src: this.nodeIconByType(node.type)
        }
      }));
    },
    nodeIconByType(type) {
      const tool = this.tools.find(item => item.key === type);
      return tool ? tool.src : '';
    },
    nodeLabelByType(type) {
      const labelMap = {
        breaker: '断路器',
        'breaker-gh': '断路器-规划年',
        hw: 'HW',
        df: 'DF',
        kg: 'KG',
        pd: 'PD'
      };
      return labelMap[type] || type;
    },
    selectTool(key) {
      if (this.isCurrentYear) return;
      this.activeTool = key;
      const tool = this.tools.find(item => item.key === key);
      if (tool && tool.group === 'line') {
        this.activeLineType = key;
      }
      if (tool && tool.group === 'none') {
        this.selectedNodeId = '';
        this.selectedElement = null;
      }
      this.connection = null;
    },
    onPaneMouseDown(event) {
      if (event.button !== 0) return;
      if (this.connection) return;
      const point = this.toFlowPoint(event);
      this.selectedElement = null;
      this.selectedNodeId = '';
      if (this.isCurrentYear) {
        this.panState = {
          startClient: { x: event.clientX, y: event.clientY },
          startViewport: { ...this.viewport },
          startFlowPoint: point,
          moved: false
        };
        return;
      }
      if (this.activeTool === 'bus') {
        const start = { x: Math.round(point.x), y: Math.round(point.y) };
        this.busDraft = { start, end: { ...start } };
        return;
      }
      this.panState = {
        startClient: { x: event.clientX, y: event.clientY },
        startViewport: { ...this.viewport },
        startFlowPoint: point,
        moved: false
      };
    },
    onFlowMouseMove(event) {
      if (this.busDraft) {
        const point = this.toFlowPoint(event);
        this.busDraft.end = { x: this.busDraft.start.x, y: Math.round(point.y) };
        return;
      }

      if (this.connection) {
        const raw = this.toFlowPoint(event);
        const last = this.connection.waypoints && this.connection.waypoints.length
          ? this.connection.waypoints[this.connection.waypoints.length - 1]
          : this.connection.from;
        this.connection.to = this.snapOrthogonal(last, raw);
        return;
      }

      if (this.busDragState) {
        const point = this.toFlowPoint(event);
        const dx = Math.round(point.x - this.busDragState.lastPoint.x);
        const dy = Math.round(point.y - this.busDragState.lastPoint.y);
        if (dx || dy) {
          const { bus } = this.busDragState;
          bus.start = { x: bus.start.x + dx, y: bus.start.y + dy };
          bus.end = { x: bus.start.x, y: bus.end.y + dy };
          this.applyVerticalBus(bus);
          this.rerouteConnectedEdges(bus.id);
          this.busDragState.lastPoint = point;
        }
        return;
      }

      if (this.dragState) {
        const point = this.toFlowPoint(event);
        const nextPosition = {
          x: Math.round(point.x - this.dragState.offset.x),
          y: Math.round(point.y - this.dragState.offset.y)
        };
        this.dragState.node.position.x = nextPosition.x;
        this.dragState.node.position.y = nextPosition.y;
        this.rerouteConnectedEdges(this.dragState.node.id);
        return;
      }

      if (this.panState) {
        const dx = event.clientX - this.panState.startClient.x;
        const dy = event.clientY - this.panState.startClient.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.panState.moved = true;
        this.viewport.x = this.panState.startViewport.x + dx;
        this.viewport.y = this.panState.startViewport.y + dy;
      }
    },
    onFlowMouseUp() {
      if (this.busDraft) {
        const vertical = this.makeVerticalBus({
          start: this.busDraft.start,
          end: this.busDraft.end
        });
        if (Math.abs(vertical.end.y - vertical.start.y) > 12) {
          this.buses.push({
            id: `bus-${this.nextBusIndex++}`,
            name: this.defaultBusName(this.nextBusIndex - 1),
            start: vertical.start,
            end: vertical.end
          });
        }
        this.busDraft = null;
        return;
      }

      if (this.dragState) {
        this.dragState = null;
        return;
      }

      if (this.busDragState) {
        this.busDragState = null;
        return;
      }

      if (this.connection) {
        if (!event || event.type === 'mouseleave') {
          this.connection = null;
          return;
        }
        if (!this.isBlankCanvasTarget(event.target)) return;

        const point = this.toFlowPoint(event);
        const waypoints = this.connection.waypoints;
        const previousPoint = waypoints.length
          ? waypoints[waypoints.length - 1]
          : this.connection.from;
        const snapped = this.snapOrthogonal(previousPoint, point);

        if (Math.hypot(snapped.x - previousPoint.x, snapped.y - previousPoint.y) > 4) {
          waypoints.push(snapped);
        }

        this.connection.to = snapped;
        this.connection.justStarted = false;
        event.stopPropagation();
        return;
      }

      if (!this.panState) return;
      const shouldAddNode = !this.panState.moved && this.activeToolConfig.group === 'node';
      const addPoint = this.panState.startFlowPoint;
      this.panState = null;

      if (shouldAddNode) {
        this.addNode(addPoint);
      }
    },
    onNodeMouseUp(node, event) {
      if (this.connection) {
        this.finishNodeConnection(node, event);
      }
      this.dragState = null;
    },
    onWindowMouseUp(event) {
      if (this.connection && event && this.$refs.flow
        && this.$refs.flow.contains(event.target)) return;
      this.resetTransientState();
    },
    startNodeDrag(node, event) {
      if (this.isCurrentYear) return;
      if (this.activeToolConfig.group === 'line' && this.activeTool !== 'bus') {
        if (!this.connection) this.startNodeConnection(node, event);
        return;
      }
      this.selectedNodeId = node.id;
      this.selectedElement = { type: 'node', id: node.id };
      const point = this.toFlowPoint(event);
      this.dragState = {
        node,
        offset: {
          x: point.x - node.position.x,
          y: point.y - node.position.y
        }
      };
    },
    startNodeConnection(node, event) {
      if (this.isCurrentYear) return;
      const toward = this.toFlowPoint(event);
      const side = this.pickNodeSideByClick(node, toward);
      const from = this.nodeSidePoint(node, side);
      this.connection = {
        sourceType: 'node',
        source: node.id,
        sourceSide: side,
        sourcePoint: from,
        from,
        to: this.snapOrthogonal(from, toward),
        waypoints: [],
        type: this.activeLineType,
        justStarted: true
      };
    },
    finishNodeConnection(node, event) {
      if (!this.connection) return;

      if (this.connection.sourceType === 'node'
        && node.id === this.connection.source) {
        if (this.connection.justStarted) {
          this.connection.justStarted = false;
          this.connection.to = this.connection.from;
          return;
        }
        this.connection = null;
        return;
      }

      const midPoints = this.normalizeWaypoints(this.connection.waypoints);
      const targetSide = midPoints.length
        ? ''
        : this.pickNodeSideByClick(node, this.toFlowPoint(event));
      const edge = this.buildOrthogonalEdge({
        id: `edge-${this.nextEdgeIndex++}`,
        source: this.connection.source,
        target: node.id,
        sourceType: this.connection.sourceType,
        sourceSide: this.connection.sourceSide,
        targetSide,
        waypoints: midPoints,
        manualPath: midPoints.length > 0,
        type: this.connection.type
      });
      this.edges.push(edge);
      this.connection = null;
    },
    startBusConnection(bus, event) {
      if (this.isCurrentYear) return;
      if (!LINE_TYPES.includes(this.activeTool)) return;
      const raw = this.toFlowPoint(event);
      const point = this.projectPointToVerticalBus(raw, bus);
      this.connection = {
        sourceType: 'bus',
        source: bus.id,
        sourcePoint: point,
        from: point,
        to: this.snapOrthogonal(point, raw),
        waypoints: [],
        type: this.activeLineType,
        justStarted: true
      };
    },
    finishBusConnection(bus, event) {
      if (!this.connection) return;
      if (this.connection.sourceType === 'bus') {
        this.connection = null;
        return;
      }

      const sourceNode = this.nodes.find(node => node.id === this.connection.source);
      if (!sourceNode) {
        this.connection = null;
        return;
      }

      const midPoints = this.normalizeWaypoints(this.connection.waypoints).reverse();
      this.edges.push(this.buildOrthogonalEdge({
        id: `edge-${this.nextEdgeIndex++}`,
        sourceType: 'bus',
        source: bus.id,
        target: sourceNode.id,
        targetSide: this.connection.sourceSide,
        waypoints: midPoints,
        manualPath: midPoints.length > 0,
        type: this.connection.type
      }));
      this.connection = null;
    },
    onBusMouseDown(bus, event) {
      if (this.isCurrentYear) return;
      if (LINE_TYPES.includes(this.activeTool)) {
        if (this.connection) this.finishBusConnection(bus, event);
        else this.startBusConnection(bus, event);
        return;
      }
      this.selectElement('bus', bus.id);
      this.busDragState = {
        bus,
        lastPoint: this.toFlowPoint(event)
      };
    },
    addNode(point) {
      if (this.isCurrentYear) return;
      const tool = this.activeToolConfig;
      const node = {
        id: `node-${this.nextNodeIndex++}`,
        type: tool.key,
        position: {
          x: Math.round(point.x - NODE_SIZE / 2),
          y: Math.round(point.y - NODE_SIZE / 2)
        },
        data: {
          label: tool.label,
          name: this.defaultNodeName(tool.key, this.nextNodeIndex - 1),
          src: tool.src
        }
      };
      this.nodes.push(node);
      this.selectedNodeId = node.id;
      this.selectedElement = { type: 'node', id: node.id };
    },
    defaultNodeName(type, index) {
      const nameMap = {
        breaker: '断路器',
        'breaker-gh': '断路器-规划年',
        hw: '环网柜',
        df: '电缆分支箱',
        kg: '开闭所',
        pd: 'T节点'
      };
      return `${nameMap[type] || '节点'}${index}`;
    },
    defaultBusName(index) {
      return `母线${index}`;
    },
    beginEditNodeName(node) {
      if (this.isCurrentYear) return;
      this.selectElement('node', node.id);
      this.editingNodeId = node.id;
      this.editingNodeName = node.data.name || '';
      this.$nextTick(() => {
        const inputRef = this.$refs[`nodeNameInput-${node.id}`];
        const input = Array.isArray(inputRef) ? inputRef[0] : inputRef;
        if (input) {
          input.focus();
          input.select();
        }
      });
    },
    finishEditNodeName(node) {
      if (this.editingNodeId !== node.id) return;
      node.data.name = this.editingNodeName.trim();
      this.editingNodeId = '';
      this.editingNodeName = '';
    },
    cancelEditNodeName() {
      this.editingNodeId = '';
      this.editingNodeName = '';
    },
    beginEditBusName(bus) {
      if (this.isCurrentYear) return;
      this.selectElement('bus', bus.id);
      this.editingBusId = bus.id;
      this.editingBusName = bus.name || '';
      this.$nextTick(() => {
        const inputRef = this.$refs[`busNameInput-${bus.id}`];
        const input = Array.isArray(inputRef) ? inputRef[0] : inputRef;
        if (input) {
          input.focus();
          input.select();
        }
      });
    },
    finishEditBusName(bus) {
      if (this.editingBusId !== bus.id) return;
      bus.name = this.editingBusName.trim();
      this.editingBusId = '';
      this.editingBusName = '';
    },
    cancelEditBusName() {
      this.editingBusId = '';
      this.editingBusName = '';
    },
    beginEditEdgeLabel(edge) {
      if (this.isCurrentYear) return;
      this.selectElement('edge', edge.id);
      this.editingEdgeId = edge.id;
      this.editingEdgeLabel = edge.label || '';
      this.$nextTick(() => {
        const inputRef = this.$refs[`edgeLabelInput-${edge.id}`];
        const input = Array.isArray(inputRef) ? inputRef[0] : inputRef;
        if (input) {
          input.focus();
          input.select();
        }
      });
    },
    finishEditEdgeLabel(edge) {
      if (this.editingEdgeId !== edge.id) return;
      const label = this.editingEdgeLabel.trim();
      if (label) {
        this.$set(edge, 'label', label);
      } else {
        this.$delete(edge, 'label');
      }
      this.editingEdgeId = '';
      this.editingEdgeLabel = '';
    },
    cancelEditEdgeLabel() {
      this.editingEdgeId = '';
      this.editingEdgeLabel = '';
    },
    edgeLabelStyle(edge) {
      const endpoints = this.edgeEndpoints(edge);
      if (!endpoints) return { display: 'none' };
      const mid = this.edgeMidpoint(edge) || endpoints.from;
      const isHorizontal = Math.abs(endpoints.to.x - endpoints.from.x) >= Math.abs(endpoints.to.y - endpoints.from.y);
      if (isHorizontal) {
        return {
          left: `${Math.round(mid.x)}px`,
          top: `${Math.round(mid.y - 16)}px`,
          transform: 'translate(-50%, -100%)'
        };
      }
      return {
        left: `${Math.round(mid.x - 16)}px`,
        top: `${Math.round(mid.y)}px`,
        transform: 'translate(-100%, -50%)'
      };
    },
    selectElement(type, id) {
      if (this.isCurrentYear) return;
      this.selectedElement = { type, id };
      this.selectedNodeId = type === 'node' ? id : '';
    },
    isSelected(type, id) {
      return !!this.selectedElement && this.selectedElement.type === type && this.selectedElement.id === id;
    },
    onKeyDown(event) {
      if (this.violationGuard && this.violationGuard.handleKeyDown(event)) return;
      if (this.isTextEditing(event.target)) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (!this.selectedElement) return;
      event.preventDefault();
      this.deleteSelectedElement();
    },
    isTextEditing(target) {
      if (!target) return false;
      const tagName = target.tagName;
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
    },
    deleteSelectedElement() {
      if (this.isCurrentYear) return;
      const selected = this.selectedElement;
      if (!selected) return;
      if (selected.type === 'edge') {
        this.edges = this.edges.filter(edge => edge.id !== selected.id);
      } else if (selected.type === 'bus') {
        this.buses = this.buses.filter(bus => bus.id !== selected.id);
        this.edges = this.edges.filter(edge => !(edge.sourceType === 'bus' && edge.source === selected.id));
      } else if (selected.type === 'node') {
        this.nodes = this.nodes.filter(node => node.id !== selected.id);
        this.edges = this.edges.filter(edge => edge.source !== selected.id && edge.target !== selected.id);
        this.selectedNodeId = '';
      }
      this.selectedElement = null;
    },
    moveConnectedEdgePoints(nodeId) {
      this.rerouteConnectedEdges(nodeId);
    },
    moveBusEdgePoints(busId) {
      this.rerouteConnectedEdges(busId);
    },
    rerouteConnectedEdges(id) {
      if (!id) return;
      this.edges.forEach((edge, index) => {
        if (edge.source === id || edge.target === id) {
          this.$set(this.edges, index, this.buildOrthogonalEdge(edge));
        }
      });
    },
    onWheel(event) {
      const oldZoom = this.viewport.zoom;
      const nextZoom = this.clamp(oldZoom + (event.deltaY > 0 ? -0.04 : 0.04), 0.18, 1.2);
      const rect = this.$refs.flow.getBoundingClientRect();
      const mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const before = {
        x: (mouse.x - this.viewport.x) / oldZoom,
        y: (mouse.y - this.viewport.y) / oldZoom
      };
      this.viewport.zoom = nextZoom;
      this.viewport.x = mouse.x - before.x * nextZoom;
      this.viewport.y = mouse.y - before.y * nextZoom;
    },
    zoomIn() {
      this.viewport.zoom = this.clamp(this.viewport.zoom + 0.08, 0.18, 1.2);
    },
    zoomOut() {
      this.viewport.zoom = this.clamp(this.viewport.zoom - 0.08, 0.18, 1.2);
    },
    fitView() {
      this.fitContentToView();
    },
    fitContentToView() {
      const bounds = this.getTopologyBounds();
      if (!bounds || !this.$refs.flow) {
        this.viewport = { x: 0, y: 0, zoom: 1 };
        return;
      }

      const rect = this.$refs.flow.getBoundingClientRect();
      const padding = 80;
      const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
      const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
      const zoom = this.clamp(
        Math.min(
          (rect.width - padding * 2) / contentWidth,
          (rect.height - padding * 2) / contentHeight
        ),
        0.18,
        1.2
      );

      this.viewport = {
        zoom,
        x: (rect.width - contentWidth * zoom) / 2 - bounds.minX * zoom,
        y: (rect.height - contentHeight * zoom) / 2 - bounds.minY * zoom
      };
    },
    getTopologyBounds() {
      const points = [];

      this.nodes.forEach(node => {
        points.push(node.position);
        points.push({
          x: node.position.x + NODE_SIZE,
          y: node.position.y + NODE_SIZE
        });
      });

      this.buses.forEach(bus => {
        points.push(bus.start, bus.end);
      });

      this.edges.forEach(edge => {
        if (edge.sourcePoint) points.push(edge.sourcePoint);
        if (edge.targetPoint) points.push(edge.targetPoint);
        if (Array.isArray(edge.waypoints)) points.push(...edge.waypoints);
      });

      if (!points.length) return null;

      return points.reduce((bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y)
      }), {
        minX: points[0].x,
        minY: points[0].y,
        maxX: points[0].x,
        maxY: points[0].y
      });
    },
    hasTopologyContent() {
      return !!(this.nodes.length || this.buses.length || this.edges.length);
    },
    toFlowPoint(event) {
      const rect = this.$refs.flow.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom,
        y: (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom
      };
    },
    nodeCenter(node) {
      return {
        x: node.position.x + NODE_SIZE / 2,
        y: node.position.y + NODE_SIZE / 2
      };
    },
    nodeBoundaryPoint(node, oppositePoint) {
      return this.nodeSidePoint(node, this.pickNodeSideToward(node, oppositePoint || this.nodeCenter(node)));
    },
    handlePoint(node, handle) {
      const center = this.nodeCenter(node);
      if (handle === 'top') {
        return { x: center.x, y: center.y - NODE_SIZE / 2 };
      }
      if (handle === 'bottom') {
        return { x: center.x, y: center.y + NODE_SIZE / 2 };
      }
      return {
        x: center.x + (handle === 'right' ? NODE_SIZE / 2 : -NODE_SIZE / 2),
        y: center.y
      };
    },
    nodePointFromEvent(node, event) {
      const point = this.toFlowPoint(event);
      return {
        x: this.clamp(Math.round(point.x), node.position.x, node.position.x + NODE_SIZE),
        y: this.clamp(Math.round(point.y), node.position.y, node.position.y + NODE_SIZE)
      };
    },
    // edgePath(edge) {
    //   const source = edge.sourceType === 'bus' ? null : this.nodes.find(node => node.id === edge.source);
    //   const target = this.nodes.find(node => node.id === edge.target);
    //   if ((!source && edge.sourceType !== 'bus') || !target) return '';
    //   const rawFrom = edge.sourceType === 'bus'
    //     ? edge.sourcePoint
    //     : this.constrainPointToNode(source, edge.sourcePoint || this.nodeCenter(source));
    //   const rawTo = this.constrainPointToNode(target, edge.targetPoint || this.nodeCenter(target));
    //   const from = source ? this.clipPointToNodeBoundary(source, rawFrom, rawTo) : rawFrom;
    //   const to = this.clipPointToNodeBoundary(target, rawTo, from);
    //   return this.makePath(
    //     from,
    //     to,
    //     edge.type,
    //     edge
    //   );
    // },
    edgePath(edge) {
      const endpoints = this.edgeEndpoints(edge);
      if (!endpoints) return '';
      const points = Array.isArray(edge.waypoints) && edge.waypoints.length
        ? [endpoints.from, ...edge.waypoints, endpoints.to]
        : [endpoints.from, endpoints.to];
      return this.makePolylinePath(this.orthogonalizePoints(points));
    },
    edgeEndpoints(edge) {
      const source = edge.sourceType === 'bus'
        ? null
        : this.nodes.find(node => node.id === edge.source);
      const target = this.nodes.find(node => node.id === edge.target);
      const sourceBus = edge.sourceType === 'bus'
        ? this.buses.find(bus => bus.id === edge.source)
        : null;
      if ((!source && !sourceBus) || !target) return null;

      const from = sourceBus
        ? this.projectPointToVerticalBus(edge.sourcePoint || this.nodeCenter(target), sourceBus)
        : this.nodeSidePoint(
          source,
          this.nearestNodeSideByPoint(source, edge.sourcePoint || this.nodeCenter(target))
        );
      const to = this.nodeSidePoint(
        target,
        this.nearestNodeSideByPoint(target, edge.targetPoint || from)
      );
      return { from, to };
    },
    makePolylinePath(points) {
      const validPoints = points.filter(point => point
        && Number.isFinite(point.x)
        && Number.isFinite(point.y));
      if (validPoints.length < 2) return '';
      return validPoints
        .map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`)
        .join(' ');
    },
    edgeMidpoint(edge) {
      const endpoints = this.edgeEndpoints(edge);
      if (!endpoints) return null;

      const { from, to } = endpoints;
      const midpoint = {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2
      };

      if (Array.isArray(edge.waypoints) && edge.waypoints.length) {
        return this.polylineMidpoint([from, ...edge.waypoints, to]);
      }
      const offset = this.edgeRouteOffset(edge);
      if (!offset) return midpoint;

      if (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)) {
        midpoint.y += offset;
      } else {
        midpoint.x += offset;
      }

      return midpoint;
    },
    polylineMidpoint(points) {
      const segments = points.slice(1).map((point, index) => {
        const from = points[index];
        return {
          from,
          to: point,
          length: Math.hypot(point.x - from.x, point.y - from.y)
        };
      });
      const total = segments.reduce((sum, segment) => sum + segment.length, 0);
      if (!total) return points[0] || null;

      let traveled = 0;
      for (const segment of segments) {
        if (traveled + segment.length >= total / 2) {
          const ratio = (total / 2 - traveled) / segment.length;
          return {
            x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
            y: segment.from.y + (segment.to.y - segment.from.y) * ratio
          };
        }
        traveled += segment.length;
      }
      return points[points.length - 1];
    },
    isTNode(node) {
      return Boolean(node && node.type === 'pd');
    },
    positionStyle(point) {
      return {
        left: `${Math.round(point.x)}px`,
        top: `${Math.round(point.y)}px`
      };
    },
    makePath(from, to, type, edge = null) {
      if (type === 'bus') {
        return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      }
      if (type === 'overhead' || type === 'cable') {
        return this.makeOrthogonalPath(from, to, edge);
      }
      const dx = Math.max(Math.abs(to.x - from.x) * 0.45, 80);
      return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
    },
    makeOrthogonalPath(from, to) {
      return this.makePolylinePath(this.orthogonalizePoints([from, to]));
    },
    edgeRouteOffset(edge) {
      if (!edge) return 0;
      const pairKey = this.edgePairKey(edge);
      const samePairEdges = this.edges.filter(item => this.edgePairKey(item) === pairKey);
      if (samePairEdges.length > 1) {
        const index = samePairEdges.findIndex(item => item.id === edge.id);
        return (index - (samePairEdges.length - 1) / 2) * 18;
      }
      return 0;
    },
    edgePairKey(edge) {
      const source = `${edge.sourceType === 'bus' ? 'bus' : 'node'}:${edge.source}`;
      const target = `node:${edge.target}`;
      return [source, target].sort().join('|');
    },
    autoHandleForNode(node, point) {
      const center = this.nodeCenter(node);
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx >= 0 ? 'right' : 'left';
      }
      return dy >= 0 ? 'bottom' : 'top';
    },
    edgeMarker(type) {
      if (type === 'bus') return null;
      return 'url(#edge-arrow-blue)';
    },
    projectPointToBus(point, bus) {
      return this.projectPointToVerticalBus(point, bus);
    },
    projectPointToVerticalBus(point, bus) {
      const x = Math.round((bus.start && bus.start.x) || 0);
      const minY = Math.min(bus.start.y, bus.end.y);
      const maxY = Math.max(bus.start.y, bus.end.y);
      return {
        x,
        y: this.clamp(Math.round(point && point.y), minY, maxY)
      };
    },
    makeVerticalBus(bus = {}) {
      const start = this.normalizePoint(bus.start);
      const end = this.normalizePoint(bus.end, start);
      const x = Math.round(start.x);
      let y1 = start.y;
      let y2 = end.y;
      if (y1 === y2) {
        y2 = y1 + Math.max(Math.abs(end.x - start.x), 80);
      }
      return {
        ...bus,
        start: { x, y: y1 },
        end: { x, y: y2 }
      };
    },
    applyVerticalBus(bus) {
      const vertical = this.makeVerticalBus(bus);
      bus.start = vertical.start;
      bus.end = vertical.end;
      return bus;
    },
    isHorizontalSide(side) {
      return side === 'left' || side === 'right';
    },
    nodeSidePoint(node, side) {
      return this.handlePoint(node, side || 'right');
    },
    pickNodeSideToward(node, toward) {
      const center = this.nodeCenter(node);
      const target = toward || center;
      const dx = target.x - center.x;
      const dy = target.y - center.y;
      if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
      return dy >= 0 ? 'bottom' : 'top';
    },
    pickNodeSideFromApproach(node, fromPoint) {
      if (!fromPoint) return this.pickNodeSideToward(node, this.nodeCenter(node));
      const left = node.position.x;
      const right = node.position.x + NODE_SIZE;
      const top = node.position.y;
      const bottom = node.position.y + NODE_SIZE;
      const x = fromPoint.x;
      const y = fromPoint.y;
      const outsideLeft = x < left - 1;
      const outsideRight = x > right + 1;
      const outsideTop = y < top - 1;
      const outsideBottom = y > bottom + 1;
      if (outsideBottom && !outsideLeft && !outsideRight) return 'bottom';
      if (outsideTop && !outsideLeft && !outsideRight) return 'top';
      if (outsideLeft && !outsideTop && !outsideBottom) return 'left';
      if (outsideRight && !outsideTop && !outsideBottom) return 'right';
      if (outsideBottom || outsideTop || outsideLeft || outsideRight) {
        const dy = outsideBottom ? y - bottom : (outsideTop ? top - y : 0);
        const dx = outsideLeft ? left - x : (outsideRight ? x - right : 0);
        if (dy >= dx && outsideBottom) return 'bottom';
        if (dy >= dx && outsideTop) return 'top';
        if (outsideLeft) return 'left';
        if (outsideRight) return 'right';
      }
      return this.pickNodeSideToward(node, fromPoint);
    },
    normalizeWaypoints(points) {
      return (points || [])
        .filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y))
        .map(point => ({ x: Math.round(point.x), y: Math.round(point.y) }))
        .filter((point, index, list) => {
          if (!index) return true;
          const prev = list[index - 1];
          return Math.abs(point.x - prev.x) > 0 || Math.abs(point.y - prev.y) > 0;
        });
    },
    buildPathWaypoints(sourcePoint, midPoints, targetPoint) {
      const points = this.orthogonalizePoints([sourcePoint, ...midPoints, targetPoint]);
      if (points.length <= 2) return [];
      return points.slice(1, -1).filter(point => {
        const sameAsSource = Math.abs(point.x - sourcePoint.x) < 1 && Math.abs(point.y - sourcePoint.y) < 1;
        const sameAsTarget = Math.abs(point.x - targetPoint.x) < 1 && Math.abs(point.y - targetPoint.y) < 1;
        return !sameAsSource && !sameAsTarget;
      });
    },
    pickNodeSideByClick(node, point) {
      if (!point) return this.pickNodeSideToward(node, this.nodeCenter(node));
      const left = node.position.x;
      const right = node.position.x + NODE_SIZE;
      const top = node.position.y;
      const bottom = node.position.y + NODE_SIZE;
      const x = this.clamp(point.x, left, right);
      const y = this.clamp(point.y, top, bottom);
      const distLeft = x - left;
      const distRight = right - x;
      const distTop = y - top;
      const distBottom = bottom - y;
      const min = Math.min(distLeft, distRight, distTop, distBottom);
      if (min === distBottom) return 'bottom';
      if (min === distTop) return 'top';
      if (min === distLeft) return 'left';
      return 'right';
    },
    nearestNodeSideByPoint(node, point) {
      if (!point) return this.pickNodeSideToward(node, this.nodeCenter(node));
      const sides = ['top', 'right', 'bottom', 'left'];
      let best = 'right';
      let bestDist = Infinity;
      sides.forEach(side => {
        const sidePoint = this.nodeSidePoint(node, side);
        const dist = Math.hypot((point.x - sidePoint.x), (point.y - sidePoint.y));
        if (dist < bestDist) {
          bestDist = dist;
          best = side;
        }
      });
      return best;
    },
    snapOrthogonal(from, to) {
      if (!from || !to) return to;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        return { x: Math.round(to.x), y: Math.round(from.y) };
      }
      return { x: Math.round(from.x), y: Math.round(to.y) };
    },
    orthogonalizePoints(points) {
      const valid = (points || [])
        .filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y))
        .map(point => ({ x: Math.round(point.x), y: Math.round(point.y) }));
      if (valid.length < 2) return valid;
      const result = [valid[0]];
      for (let index = 1; index < valid.length; index += 1) {
        const prev = result[result.length - 1];
        const next = valid[index];
        if (Math.abs(prev.x - next.x) < 1 && Math.abs(prev.y - next.y) < 1) continue;
        if (Math.abs(prev.x - next.x) >= 1 && Math.abs(prev.y - next.y) >= 1) {
          result.push(this.snapOrthogonal(prev, next));
        }
        result.push(next);
      }
      return result;
    },
    routeBetweenPorts(from, fromSide, to, toSide) {
      const alignedX = Math.abs(from.x - to.x) < 1;
      const alignedY = Math.abs(from.y - to.y) < 1;
      if (alignedX || alignedY) return [];

      const fromH = this.isHorizontalSide(fromSide);
      const toH = this.isHorizontalSide(toSide);

      if (fromH && toH) {
        if (fromSide !== toSide) {
          const midX = Math.round((from.x + to.x) / 2);
          return [{ x: midX, y: from.y }, { x: midX, y: to.y }];
        }
        const outX = fromSide === 'right'
          ? Math.max(from.x, to.x) + 24
          : Math.min(from.x, to.x) - 24;
        return [{ x: outX, y: from.y }, { x: outX, y: to.y }];
      }

      if (!fromH && !toH) {
        if (fromSide !== toSide) {
          const midY = Math.round((from.y + to.y) / 2);
          return [{ x: from.x, y: midY }, { x: to.x, y: midY }];
        }
        const outY = fromSide === 'bottom'
          ? Math.max(from.y, to.y) + 24
          : Math.min(from.y, to.y) - 24;
        return [{ x: from.x, y: outY }, { x: to.x, y: outY }];
      }

      if (fromH) return [{ x: to.x, y: from.y }];
      return [{ x: from.x, y: to.y }];
    },
    routeNodeToNode(sourceNode, targetNode, sourceSide, targetSide) {
      const sourceCenter = this.nodeCenter(sourceNode);
      const targetCenter = this.nodeCenter(targetNode);
      const dx = targetCenter.x - sourceCenter.x;
      const dy = targetCenter.y - sourceCenter.y;
      let resolvedSourceSide = sourceSide;
      let resolvedTargetSide = targetSide;
      if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dy) <= 2) {
        resolvedSourceSide = dx >= 0 ? 'right' : 'left';
        resolvedTargetSide = dx >= 0 ? 'left' : 'right';
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) <= 2) {
        resolvedSourceSide = dy >= 0 ? 'bottom' : 'top';
        resolvedTargetSide = dy >= 0 ? 'top' : 'bottom';
      } else {
        resolvedSourceSide = resolvedSourceSide || this.pickNodeSideToward(sourceNode, targetCenter);
        resolvedTargetSide = resolvedTargetSide || this.pickNodeSideToward(targetNode, sourceCenter);
      }
      const sourcePoint = this.nodeSidePoint(sourceNode, resolvedSourceSide);
      const targetPoint = this.nodeSidePoint(targetNode, resolvedTargetSide);
      return {
        sourceSide: resolvedSourceSide,
        targetSide: resolvedTargetSide,
        sourcePoint,
        targetPoint,
        waypoints: this.routeBetweenPorts(sourcePoint, resolvedSourceSide, targetPoint, resolvedTargetSide)
      };
    },
    routeBusToNode(bus, node, targetSide) {
      const busX = bus.start.x;
      const minY = Math.min(bus.start.y, bus.end.y);
      const maxY = Math.max(bus.start.y, bus.end.y);
      const center = this.nodeCenter(node);
      const resolvedTargetSide = targetSide || (center.x >= busX ? 'left' : 'right');
      const targetPoint = this.nodeSidePoint(node, resolvedTargetSide);
      const tapY = this.clamp(
        this.isHorizontalSide(resolvedTargetSide) ? targetPoint.y : center.y,
        minY,
        maxY
      );
      const sourcePoint = { x: busX, y: tapY };
      const fromSide = center.x >= busX ? 'right' : 'left';
      return {
        targetSide: resolvedTargetSide,
        sourcePoint,
        targetPoint,
        waypoints: this.routeBetweenPorts(sourcePoint, fromSide, targetPoint, resolvedTargetSide)
      };
    },
    buildOrthogonalEdge(edge, nodeById, busById) {
      const nodeMap = nodeById || new Map(this.nodes.map(node => [node.id, node]));
      const busMap = busById || new Map(this.buses.map(bus => [bus.id, bus]));
      const sourceType = edge.sourceType === 'bus' || busMap.has(edge.source) ? 'bus' : 'node';
      const sourceNode = nodeMap.get(edge.source);
      const sourceBus = busMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (!targetNode || (sourceType === 'bus' ? !sourceBus : !sourceNode)) {
        return {
          ...edge,
          sourceType,
          waypoints: this.normalizeWaypoints(edge.waypoints)
        };
      }

      const midPoints = this.normalizeWaypoints(edge.waypoints);
      const usePath = Boolean(edge.manualPath && midPoints.length);
      let sourceSide = edge.sourceSide || '';
      let targetSide = edge.targetSide || '';

      if (usePath) {
        if (sourceNode) {
          sourceSide = this.pickNodeSideFromApproach(sourceNode, midPoints[0]);
        }
        targetSide = this.pickNodeSideFromApproach(targetNode, midPoints[midPoints.length - 1]);
      } else {
        if (sourceNode && !sourceSide && edge.sourcePoint) {
          sourceSide = this.nearestNodeSideByPoint(sourceNode, edge.sourcePoint);
        }
        if (!targetSide && edge.targetPoint) {
          targetSide = this.nearestNodeSideByPoint(targetNode, edge.targetPoint);
        }
      }

      if (!usePath) {
        const route = sourceType === 'bus'
          ? this.routeBusToNode(sourceBus, targetNode, targetSide)
          : this.routeNodeToNode(sourceNode, targetNode, sourceSide, targetSide);
        return {
          ...edge,
          sourceType,
          manualPath: false,
          sourceSide: route.sourceSide || sourceSide,
          targetSide: route.targetSide || targetSide,
          sourcePoint: route.sourcePoint,
          targetPoint: route.targetPoint,
          waypoints: route.waypoints
        };
      }

      const sourcePoint = sourceBus
        ? this.projectPointToVerticalBus(midPoints[0], sourceBus)
        : this.nodeSidePoint(
          sourceNode,
          sourceSide || this.pickNodeSideFromApproach(sourceNode, midPoints[0])
        );
      const targetPoint = this.nodeSidePoint(targetNode, targetSide);
      return {
        ...edge,
        sourceType,
        manualPath: true,
        sourceSide: sourceNode ? sourceSide : edge.sourceSide,
        targetSide,
        sourcePoint,
        targetPoint,
        waypoints: this.buildPathWaypoints(sourcePoint, midPoints, targetPoint)
      };
    },
    nodeStyle(node) {
      return {
        left: `${node.position.x}px`,
        top: `${node.position.y}px`
      };
    },
    constrainPointToNode(node, point) {
      return {
        x: this.clamp(Math.round(point.x), node.position.x, node.position.x + NODE_SIZE),
        y: this.clamp(Math.round(point.y), node.position.y, node.position.y + NODE_SIZE)
      };
    },
    clipPointToNodeBoundary(node, point, oppositePoint) {
      const rect = {
        left: node.position.x,
        right: node.position.x + NODE_SIZE,
        top: node.position.y,
        bottom: node.position.y + NODE_SIZE
      };
      const inside = this.constrainPointToNode(node, point);
      if (!oppositePoint) return inside;

      const dx = inside.x - oppositePoint.x;
      const dy = inside.y - oppositePoint.y;
      const hits = [];

      if (Math.abs(dx) > 0.001) {
        const leftT = (rect.left - oppositePoint.x) / dx;
        const leftY = oppositePoint.y + leftT * dy;
        if (leftT >= 0 && leftT <= 1 && leftY >= rect.top && leftY <= rect.bottom) {
          hits.push({ t: leftT, x: rect.left, y: leftY });
        }

        const rightT = (rect.right - oppositePoint.x) / dx;
        const rightY = oppositePoint.y + rightT * dy;
        if (rightT >= 0 && rightT <= 1 && rightY >= rect.top && rightY <= rect.bottom) {
          hits.push({ t: rightT, x: rect.right, y: rightY });
        }
      }

      if (Math.abs(dy) > 0.001) {
        const topT = (rect.top - oppositePoint.y) / dy;
        const topX = oppositePoint.x + topT * dx;
        if (topT >= 0 && topT <= 1 && topX >= rect.left && topX <= rect.right) {
          hits.push({ t: topT, x: topX, y: rect.top });
        }

        const bottomT = (rect.bottom - oppositePoint.y) / dy;
        const bottomX = oppositePoint.x + bottomT * dx;
        if (bottomT >= 0 && bottomT <= 1 && bottomX >= rect.left && bottomX <= rect.right) {
          hits.push({ t: bottomT, x: bottomX, y: rect.bottom });
        }
      }

      if (hits.length) {
        const nearest = hits.sort((a, b) => a.t - b.t)[0];
        return { x: Math.round(nearest.x), y: Math.round(nearest.y) };
      }

      return this.nearestNodeBoundaryPoint(node, inside);
    },
    nearestNodeBoundaryPoint(node, point) {
      const left = Math.abs(point.x - node.position.x);
      const right = Math.abs(node.position.x + NODE_SIZE - point.x);
      const top = Math.abs(point.y - node.position.y);
      const bottom = Math.abs(node.position.y + NODE_SIZE - point.y);
      const min = Math.min(left, right, top, bottom);

      if (min === left) return { x: node.position.x, y: point.y };
      if (min === right) return { x: node.position.x + NODE_SIZE, y: point.y };
      if (min === top) return { x: point.x, y: node.position.y };
      return { x: point.x, y: node.position.y + NODE_SIZE };
    },
    busNameStyle(bus) {
      const dx = bus.end.x - bus.start.x;
      const dy = bus.end.y - bus.start.y;
      const isVertical = Math.abs(dy) >= Math.abs(dx);
      const x = isVertical ? bus.start.x : (bus.start.x + bus.end.x) / 2;
      const y = isVertical
        ? Math.min(bus.start.y, bus.end.y) - 28
        : (bus.start.y + bus.end.y) / 2 - 28;
      return {
        left: `${x}px`,
        top: `${y}px`
      };
    },
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
  }
};
</script>

<style lang="less" scoped>
.v10-page {
  min-height: calc(50vh - 52px);
  /* width: 50vw; */
  background: #f2f5fb;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.v10-page.expanded {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100vw;
  min-height: 100vh;
}

.topology-toolbar {
  height: 64px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  background: #f7fbff;
  border-bottom: 1px solid #d2dae8;
}

.year-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.year-pill {
  min-width: 62px;
  height: 31px;
  padding: 0 16px;
  border: 1px solid currentColor;
  border-radius: 18px;
  background: #fff;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s, background 0.15s;
}

.year-pill:hover,
.icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.year-pill.active {
  box-shadow: inset 0 0 0 999px rgb(197 219 251);
  border-width: 2px;
}

.year-2025 {
  color: #71809b;
}

.year-2026 {
  color: #2f63d5;
}

.year-2027 {
  color: #d94730;
}

.year-2030 {
  color: #1974df;
}

.icon-group {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 7px 15px;
  border: 1px solid #2a7bd4;
  border-radius: 3px;
  background: #eaf2fc;
}

.icon-btn {
  position: relative;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* border: 1px solid #b9c3d2; */
  border-radius: 3px;
  /* background: linear-gradient(180deg, #eeeeee, #dedede); */
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.icon-btn img {
  max-width: 31px;
  max-height: 31px;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.icon-btn:empty::before {
  content: '';
  width: 24px;
  height: 28px;
  border: 1px solid #2f63d5;
  /* background: #fff; */
}

.icon-btn:disabled {
  opacity: 0.38;
  filter: grayscale(1);
  cursor: not-allowed;
  box-shadow: none;
}

.icon-btn.active {
  border-color: #2a72d9;
  box-shadow: 0 0 0 2px rgba(42, 114, 217, 0.18);
}

.icon-btn.active::before {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -13px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 13px solid #ff3a2d;
  transform: translateX(-50%);
}

.icon-btn.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -31px;
  width: 1px;
  height: 24px;
  background: #ff3a2d;
  transform: translateX(-50%);
}

.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-btn {
  height: 32px;
  padding: 0 18px;
  border: 1px solid #2a72d9;
  border-radius: 3px;
  background: #fff;
  color: #155ac4;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: #1d6fe8;
  color: #fff;
}

.action-btn.danger {
  border-color: #ff4d3d;
  color: #d93025;
}

.action-btn:hover {
  box-shadow: 0 0 0 2px rgba(42, 114, 217, 0.16);
}

.save-message {
  min-width: 54px;
  color: #2367c9;
  font-size: 13px;
  font-weight: 700;
}

.expand-btn {
  position: absolute;
  right: 18px;
  top: 14px;
  z-index: 6;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #c4d2e5;
  border-radius: 3px;
  background: rgba(247, 251, 255, 0.94);
  color: #245aa8;
  cursor: pointer;
  box-shadow: 0 2px 7px rgba(31, 62, 116, 0.12);
}

.expand-btn svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.expand-btn:hover {
  border-color: #2f63d5;
  color: #155ac4;
  box-shadow: 0 0 0 2px rgba(42, 114, 217, 0.16);
}

.content {
  display: flex;
  width: 100%;
  height: 83vh;
  .map {
    width: 40%;
    border-right: 1px solid #eee;
    #jxtMap {
      width: 40vw;
      height: 100%;
    }

    .btn {
        position: absolute;
        bottom: 5px;
        left: 38vw;
        z-index: 10;
    }

    /deep/ .el-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .el-icon-full-screen,
    .el-icon-minus {
        z-index: 10;
        position: absolute;
        right: 15px;
        top: 10px;
        width: 18px;
        font-weight: 600;
        cursor: pointer;
    }

    .title {
        z-index: 2;
        font-size: 14px;
        box-sizing: border-box;
        padding: 0 10px 3px 10px;
        color: #262626;
        cursor: move;
        font-weight: 600;
        height: 24px;
        line-height: 24px;

        .close {
            position: absolute !important;
            right: 15px;
            top: 4px;
            cursor: pointer;
        }

        .close::before {
            content: "✖";
            font-weight: 100;
            color: #000;
        }
    }

    .title::before {
        position: absolute;
        content: "";
        width: 4px;
        height: 15px;
        top: 13px;
        left: 10px;
        background-color: var(--main-color);
    }

    .fea-desc {
        z-index: 1;
        position: absolute;
        border: 1px solid #dadada;
        border-radius: 5px;
        background: linear-gradient(180deg, #f7fbff, #f4f8fe) !important;
        padding: 10px;
        top: 4vh;
        width: 12vw;

        ul {}
    }
  }
}
.flow-root {
  position: relative;
  flex: 1;
  overflow: hidden;
  background:
    linear-gradient(#e6edf7 1px, transparent 1px),
    linear-gradient(90deg, #e6edf7 1px, transparent 1px),
    #f8fafc;
  background-size: 24px 24px;
  cursor: grab;
}

.flow-root:active {
  cursor: grabbing;
}

.v10-page.is-readonly .flow-node,
.v10-page.is-readonly .bus-hit,
.v10-page.is-readonly .bus-line,
.v10-page.is-readonly .flow-edge,
.v10-page.is-readonly .flow-edge-hit,
.v10-page.is-readonly .bus-name {
  cursor: default;
}

.v10-page.is-readonly .flow-node:hover {
  box-shadow: none;
}

.flow-transform {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  background: transparent;
}

.edge-layer {
  position: absolute;
  inset: 0;
  width: 5000px;
  height: 3000px;
  overflow: visible;
}

.edge-layer {
  z-index: 1;
  pointer-events: auto;
}

.bus-line {
  stroke: #111;
  stroke-width: 9;
  stroke-linecap: butt;
  cursor: pointer;
}

.bus-line.selected {
  stroke: #ff1717;
}

.bus-hit {
  stroke: transparent;
  stroke-width: 22;
  cursor: crosshair;
}

.bus-hit.draggable {
  cursor: move;
}

.bus-tap {
  fill: #ff1717;
  stroke: #fff;
  stroke-width: 1.5;
  pointer-events: none;
}

.bus-name-wrap {
  position: absolute;
  z-index: 3;
  transform: translateX(-50%);
  min-width: 64px;
  max-width: 180px;
  text-align: center;
  user-select: none;
}

.bus-name,
.bus-name-input {
  display: block;
  width: 100%;
  color: #111;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  white-space: nowrap;
}

.bus-name {
  cursor: text;
}

.bus-name-input {
  height: 22px;
  padding: 1px 6px;
  border: 1px solid #111;
  border-radius: 2px;
  outline: none;
  background: #fff;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.12);
}

.flow-edge {
  fill: none;
  stroke-linecap: butt;
  stroke-linejoin: miter;
  pointer-events: stroke;
  cursor: pointer;
}

.flow-edge-hit {
  fill: none;
  stroke: transparent;
  stroke-width: 18;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: stroke;
  cursor: pointer;
}

.flow-edge.selected {
  stroke: #ff1717;
  filter: drop-shadow(0 0 3px rgba(255, 23, 23, 0.45));
}

.edge-bus {
  stroke: #111;
  stroke-width: 9;
}

.edge-overhead {
  stroke: #2f63d5;
  stroke-width: 2.2;
}

.edge-cable {
  stroke: #2f63d5;
  stroke-width: 2.2;
  stroke-dasharray: 7 5;
}

.edge-overhead-gh {
  stroke: #e0483e;
  stroke-width: 2.2;
}

.edge-cable-gh {
  stroke: #e0483e;
  stroke-width: 2.2;
  stroke-dasharray: 7 5;
}

.edge-branch {
  stroke: #35a545;
  stroke-width: 2.2;
}

.edge-preview {
  opacity: 0.55;
}

.edge-label-wrap {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.edge-label {
  display: block;
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  overflow: visible;
  text-shadow: 0 0 2px #fff, 0 0 2px #fff;
  pointer-events: none;
}

.edge-label-input {
  display: block;
  z-index: 4;
  height: 22px;
  padding: 1px 6px;
  border: 1px solid #ff4d4f;
  border-radius: 2px;
  outline: none;
  background: #fff;
  color: #ff4d4f;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  box-shadow: 0 2px 7px rgba(255, 77, 79, 0.16);
  pointer-events: auto;
}

.flow-node {
  position: absolute;
  z-index: 2;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  /* border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 6px rgba(31, 62, 116, 0.14); */
  cursor: move;
  user-select: none;
}

.flow-node.selected,
.flow-node:hover {
  border-color: #2f63d5;
  box-shadow: 0 0 0 3px rgba(47, 99, 213, 0.16);
}

.flow-node.connectable {
  cursor: crosshair;
}

.flow-node img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.flow-node img.flow-node-img--t {
  width: 16px;
  height: 16px;
}

.node-name,
.node-name-input {
  position: absolute;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  min-width: 72px;
  max-width: 180px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  color: #111;
  white-space: nowrap;
}

.node-name {
  overflow: visible;
  pointer-events: none;
}

.node-name-input {
  z-index: 4;
  height: 22px;
  padding: 1px 6px;
  border: 1px solid #2f63d5;
  border-radius: 2px;
  outline: none;
  background: #fff;
  box-shadow: 0 2px 7px rgba(47, 99, 213, 0.16);
  pointer-events: auto;
}

.flow-hint {
  position: absolute;
  left: 18px;
  top: 14px;
  z-index: 5;
  padding: 7px 12px;
  border: 1px solid #d7e2f2;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  color: #40516d;
  font-size: 13px;
  pointer-events: none;
}

.flow-controls {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 5;
  display: flex;
  gap: 6px;
  padding: 6px;
  border: 1px solid #d7e2f2;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
}

.flow-controls button {
  min-width: 34px;
  height: 30px;
  border: 1px solid #c4d2e5;
  border-radius: 3px;
  background: #f7fbff;
  color: #245aa8;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 980px) {
  .topology-toolbar {
    height: auto;
    padding: 12px;
    flex-direction: column;
    align-items: flex-start;
  }

  .icon-group {
    width: 100%;
    overflow-x: auto;
  }
}

.btn {
  cursor: pointer;
  margin: 0 2px;
  height: 32px;
  color: #fff;
  border: 1px solid #d9d9d9;
  text-align: center;
  font-size: 14px;
  background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%);

  i::before {
    color: #fff !important;
  }
}

.element-delete-btn {
  position: absolute;
  z-index: 6;
  width: 22px;
  height: 22px;
  padding: 3px;
  border: 1px solid #e5484d;
  border-radius: 50%;
  background: #fff;
  color: #d92d34;
  box-shadow: 0 2px 6px rgba(120, 22, 26, 0.2);
  transform: translate(-50%, -100%);
  cursor: pointer;
}

.element-delete-btn:hover {
  background: #fff1f1;
}

.element-delete-btn svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.flow-root.connecting,
.flow-root.connecting:active {
  cursor: crosshair;
}

.flow-root.connecting .flow-edge,
.flow-root.connecting .flow-edge-hit {
  pointer-events: none;
}
</style>
