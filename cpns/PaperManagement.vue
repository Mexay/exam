<template>
  <div class="v11-page">
    <aside class="v11-sidebar">
      <nav class="sidebar-menu" aria-label="管理菜单">
        <button v-for="item in menuItems" :key="item.key" type="button" class="menu-item"
          :class="{ active: activeMenu === item.key }" @click="switchMenu(item.key)">
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <i v-if="activeMenu === item.key" class="el-icon-arrow-right menu-arrow"></i>
        </button>
      </nav>
    </aside>

    <main class="v11-main">
      <!-- <header class="page-header">
        <div>
          <h1>{{ activeMenuItem.label }}</h1>
          <p>{{ activeMenuItem.description }}</p>
        </div>
        <div class="header-actions">
          <span class="update-time">数据更新于 {{ updateTime }}</span>
          <button type="button" class="refresh-btn" title="刷新数据" @click="refreshDashboard">
            <i class="el-icon-refresh"></i>
          </button>
        </div>
      </header> -->

      <section v-show="activeMenu === 'overview'" class="overview-page">
        <div class="metric-grid">
          <article v-for="metric in metrics" :key="metric.key" :class="['metric-card', `metric-card-${metric.tone}`]">
            <div class="metric-head">
              <span class="metric-icon" :class="`metric-${metric.tone}`">
                <i :class="metric.icon"></i>
              </span>
              <span class="metric-label">{{ metric.label }}</span>
            </div>
            <div class="metric-value">
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.unit }}</span>
            </div>
          </article>
        </div>

        <div class="chart-grid chart-grid-secondary">
          <article class="data-panel unit-panel">
            <div class="panel-header">
              <div>
                <h2>各单位参赛情况</h2>
                <p>报名人数与已完成人数对比</p>
              </div>
              <!-- <button type="button" class="text-btn">查看全部</button> -->
            </div>
            <div ref="unitChart" class="chart chart-medium"></div>
          </article>

          <article class="data-panel score-panel">
            <div class="panel-header">
              <div>
                <h2>成绩区间分布</h2>
                <p>已完成参赛人员成绩</p>
              </div>
            </div>
            <div ref="scoreChart" class="chart chart-medium"></div>
          </article>
        </div>

      </section>

      <div class="papers-map-panel" v-show="activeMenu === 'questions'">
        <div id="examMap" v-show="showMap">
          <Popup class="huituTk" v-if="mapSize == 'max'">
            <template slot="content">
              <h1 class="title">绘图组件</h1>
              <tpModel regionId="" yxdwId="" :activeRow="activeRow" :scene-description="activeRow.desp || ''" @close="showMap = false"></tpModel>
            </template>
          </Popup>
          <mouseClick ref="mouse_click" :sgdps="sgdps" v-if="mapLoad"></mouseClick>
        </div>
        <SceneQuestion @openMap="openMap" v-show="!showMap"/>
      </div>

      <drawTp style="width: 100%;" ref="topology" v-show="activeMenu === 'topology'" :mode="'出题'" />

      <div class="papers-vcode-panel" v-show="activeMenu === 'security'">
        <div class="vcode-header-row">
          <div class="vcode-title-area">
            <i class="el-icon-lock vcode-lock-icon"></i>
            <span class="vcode-title-text">验证码管理</span>
          </div>
          <el-switch v-model="vcodeEnabled" active-color="#00a86b" inactive-color="#dcdfe6" />
        </div>
        <p class="vcode-desc">验证码认证可有效防止竞赛期间不当操作导致的页面锁定</p>
        <div class="vcode-card">
          <div class="vcode-card-bg"></div>
          <div class="vcode-card-content">
            <div class="vcode-card-label">当前验证码</div>
            <div class="vcode-display">
              <span v-if="vcodeEnabled" v-for="(ch, i) in verifyCode.split('')" :key="i" class="vcode-char">{{ ch
              }}</span>
              <span v-if="!vcodeEnabled" v-for="(ch, i) in vcodeHidden.split('')" :key="i" class="vcode-char">{{ ch
              }}</span>
            </div>
          </div>
        </div>
        <div class="vcode-input-row">
          <el-input v-model="vcodeInput" placeholder="修改验证码(请输入6位数字)" size="small" class="vcode-input-field"
            maxlength="6"></el-input>
          <el-button type="primary" size="small" @click="submitVCode" :disabled="!vcodeInput">提交修改</el-button>
        </div>
      </div>

      <div class="papers-table-area" v-show="activeMenu === 'people'">
        <!-- 标签栏 + 搜索 -->
        <div class="table-toolbar">
          <div class="toolbar-tabs">
            <el-input v-model="studentName" placeholder="搜索姓名" prefix-icon="el-icon-search" size="small"
              style="width:220px;" clearable />
            <el-button type="primary" size="small" @click="getStudents" icon="el-icon-search">搜索</el-button>
          </div>
          <div class="toolbar-tabs">
            <span style="display: flex;align-items: center;margin-right: 20px;">竞赛时间：{{ ksTime }}</span>
            <el-button type="primary" size="small" @click="settingTime" icon="el-icon-setting">设置竞赛时间</el-button>
            <el-button type="primary" size="small" @click="openAddStudent" icon="el-icon-plus">新增考生</el-button>
            <el-button type="primary" size="small" @click="downloadMb" icon="el-icon-download">下载导入模板</el-button>
            <el-upload action style="display: inline-block;" :http-request="(file) => importStudent(file)"
              :show-file-list="false" accept=".xlsx" onclick="(function(e){e.stopPropagation()}(event))">
              <el-button type="primary" size="small" icon="el-icon-upload2">导入</el-button>
            </el-upload>
          </div>
        </div>

        <!-- 表格 -->
        <el-table :data="studentList" border stripe size="small" style="width:100%">
          <el-table-column type="index" label="序号" width="60">
            <template #default="{ $index }">{{ (pageNo - 1) * pageSize + $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="userName" label="姓名" min-width="100" />
          <el-table-column prop="ssds" label="地市" min-width="100" />
          <el-table-column prop="yxdw" label="单位" min-width="100" show-overflow-tooltip />
          <el-table-column prop="dept" label="部门" min-width="100" show-overflow-tooltip />
          <el-table-column label="考试状态" min-width="90" align="center">
            <template slot-scope="scope">
              <span v-if="scope.row.status == 3" class="status-tag status-done">已评分</span>
              <span v-else-if="scope.row.status == 1" class="status-tag status-doing">进行中</span>
              <span v-else-if="scope.row.status == 2" class="status-tag status-doing">待评分</span>
              <span v-else class="status-tag">未开始</span>
            </template>
          </el-table-column>
          <el-table-column label="得分" min-width="70" align="center">
            <template slot-scope="scope">
              <span class="score-text">{{ scope.row.score }}</span>
              <!-- <span v-else class="score-empty">--</span> -->
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" align="center">
            <template slot-scope="scope">
              <el-tag color="#7da3f5" size="small" @click.stop="openAddStudent(scope.row)">修改信息</el-tag>
              <el-tag v-if="scope.row.status > 1" color="#ff9800" size="small"
                @click.stop="openKs(scope.row)">阅卷打分</el-tag>
              <!-- <el-tag color="#ff9800" size="small" @click.stop="openKs(scope.row)">阅卷打分</el-tag> -->
              <el-tag color="#ff857c" size="small" @click.stop="delStudent(scope.row)">删除</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="table-pagination">
          <el-pagination background layout="prev,pager,next,jumper,total" :total="total" :page-size="pageSize"
            :current-page.sync="pageNo" small @current-change="onPaperPageChange" />
        </div>
      </div>
    </main>

    <!-- 新增学生弹窗 -->
    <el-dialog v-if="addStudent" :visible="addStudent" title="保存数据" append-to-body width="25%" @close="closeStudent">
      <div id="xlModify">
        <el-form ref="student" :model="student" label-position="right" label-width="120px" :rules="ruleForm">
          <el-form-item label="姓名：" required prop="userName">
            <el-input v-model="student.userName" placeholder="请输入" size="small" clearable></el-input>
          </el-form-item>
          <el-form-item label="身份证号码：" prop="idNumber" required>
            <el-input v-model="student.idNumber" placeholder="请输入" size="small" clearable
              @focus="idChange = true"></el-input>
          </el-form-item>
          <el-form-item label="账号：" required prop="userId">
            <el-input v-model="student.userId" placeholder="请输入" size="small" clearable></el-input>
          </el-form-item>
          <el-form-item label="地市：" required prop="ssdsId">
            <el-select placeholder="请选择" v-model="student.ssdsId" size="small" clearable>
              <el-option v-for="(item, index) in dishiAreaList" :key="index" :label="item.key + '市'" :value="item.ssds_id"
                @click.native="getXianList(index)"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="县(分)公司：" required prop="yxdwId">
            <el-select placeholder="请选择" v-model="student.yxdwId" size="small" clearable>
              <el-option v-for="(item, index) in xianAreaList" :key="index" :label="item.yxdwmc"
                :value="item.yxdw"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="部门：" required prop="dept">
            <el-select placeholder="请选择" v-model="student.dept" size="small" clearable>
              <el-option v-for="(item, index) in ['配电所', '用电所']" :key="index" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button size="small" type="primary" @click="saveStudent">保存</el-button>
            <el-button size="small" @click="closeStudent">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <leftPopup class="addWtModel" v-if="ksTimeModel" style="width: 35vw;top: 25vh;left: 38vw;">
      <template slot="content">
        <h1 class="title">
          <span class="close" @click="ksTimeModel = false"></span>设置
        </h1>
        <div class="context">
          <el-form ref="ywForm" label-width="130px" label-position="right" label-suffix="：" style="width: 90%;">
            <el-form-item label="竞赛时间">
              <el-date-picker v-model="ksTimeArr" size="small" type="datetimerange" style="width:453px;"
                range-separator="至" value-format="yyyy-MM-dd HH:mm:ss" start-placeholder="开始时间"
                end-placeholder="结束时间"></el-date-picker>
            </el-form-item>
          </el-form>
        </div>
        <div class="bottom">
          <p class="btn1 save" @click="submitKsTime">提交</p>
          <p class="btn1" @click="ksTimeModel = false">取消</p>
        </div>
      </template>
    </leftPopup>
  </div>
</template>

<script>
import * as echarts from 'echarts';

const AXIS_COLOR = '#8691a6';
const GRID_LINE = '#edf0f5';

import { setToken, PublicKey } from '@/utils/auth'
import * as layerController from '@/platformComponents/Maps/components/Map/Layer/index'
import { addDwLayer } from '@/components/ghsjPanel/components/wgdjModel/modules/map/unit'
import mouseClick from '@/platformComponents/mouseClick/index.vue'
import leftPopup from "@/components/ghsjPanel/dragPopup/index.vue"
import { getDishiAreaListAdd, findEquipment } from '@/api/pwgh/xqkNew'
import WKT from "terraformer-wkt-parser";
import { shiOption } from '@/components/ghsjPanel/json'
import {
  updateGrid, getAllGrids, deleteThirdLevelGrid, addOrModifyXl, removeGridXl, getXlByGridId, getVerifyCode, updateVerifyCode,
  saveOrUpdateAccount, listAccount, removeAccount, downloadTemplate, importAccount
} from "@/api/pwgh/examIndex";
import { setExamTime, getExamTime, queryCount, countByScore, countByDs } from '@/api/pwgh/examCbPsk'
import Popup from '@/components/ghsjPanel/components/wjghModel/popup.vue'
import drawTp from "./drawTp.vue"
import tpModel from "../wj/drawTp.vue";
import SceneQuestion from './SceneQuestion.vue'

export default {
  name: 'PaperManagement',
  components: { mouseClick, leftPopup, Popup, tpModel, drawTp, SceneQuestion },
  props: {
    papers: {
      type: Array,
      default: () => []
    }
  },
  data() {
    var validatorNumber = (rule, value, callback) => {
      const reg = /(^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$)|(^[1-9]\d{7}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}$)/
      if (value === '') {
        callback(new Error('内容不能为空'))
      } else if (!this.idChange || reg.test(value)) {
        callback()
      } else {
        callback(new Error('身份证号码格式有误'))
      }
    }
    return {
      activeMenu: 'overview',
      updateTime: '2026-07-29 10:30',
      charts: {},
      menuItems: [
        { key: 'overview', label: '总览', icon: 'el-icon-data-analysis', description: '竞赛运行数据与核心指标总览' },
        { key: 'questions', label: '试题管理', icon: 'el-icon-document', description: '试题、题库与组卷管理' },
        { key: 'topology', label: '拓扑图管理', icon: 'el-icon-share', description: '竞赛拓扑图配置与版本管理' },
        { key: 'security', label: '验证码管理', icon: 'el-icon-lock', description: '竞赛过程监控与异常预警' },
        { key: 'people', label: '人员管理', icon: 'el-icon-user-solid', description: '参赛人员、教师与权限管理' }
      ],
      metrics: [
        { key: 'people', label: '参赛人数', value: '0', unit: '人', icon: 'el-icon-user-solid', tone: 'blue' },
        { key: 'finished', label: '已完成竞赛', value: '0', unit: '场', icon: 'el-icon-circle-check', tone: 'green' },
        { key: 'running', label: '进行中', value: '0', unit: '场', icon: 'el-icon-video-play', tone: 'orange' },
        { key: 'rate', label: '平均完成率', value: '0', unit: '%', icon: 'el-icon-s-data', tone: 'red' }
      ],
      ksTime: '',
      ksTimeModel: false,
      ksTimeArr: ['', ''],
      //统计
      paperStats: {
        total: 55,
        completed: 23,
        doing: 22,
        pending: 12
      },
      //验证码
      vcodeEnabled: false,
      verifyCode: '',
      verifyId: '',
      vcodeInput: '',
      vcodeHidden: '******',
      mapFullscreen: false,
      //加载地图
      showMap: false,
      activeRow: {},
      map: null,
      sgdps: null,
      mapSize: 'min',
      mapLoad: false,
      dishiAreaList: [],//地市下拉框
      xianAreaList: [],//县下拉框
      gdsList: [],//供电所下拉,
      bdzList: [],//变电站下拉
      drawPolygon: '',
      drawPolyline: '',
      geometryUtil: {},
      drawLoading: {},
      features: '',
      loading: false,
      areaTypeOption: ['A+', 'A', 'B', 'C', 'D', 'E'],
      shiOption: shiOption,
      gridList: [],
      //学生列表
      addStudent: false,
      student: {
        userName: '',
        userId: '',
        ssds: '',
        ssdsId: '',
        yxdw: '',
        yxdwId: '',
        dept: '',
        idNumber: ''
      },
      pageNo: 1,
      pageSize: 10,
      studentList: [],
      total: 0,
      studentName: '',
      ruleForm: {
        userName: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
        idNumber: [{ validator: validatorNumber, trigger: 'blur' }],
        userId: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
        ssdsId: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
        yxdwId: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
        dept: [{ required: true, message: '内容不能为空', trigger: 'blur' }]
      },
      idChange: false
    };
  },
  watch: {
    activeMenu(v) {
      if (v === 'questions') {
        this.$nextTick(() => {
          sgdps2.map.resize();
        })
      } else if (v === 'topology') {
        this.$nextTick(() => {
          // this.$refs.topology && this.$refs.topology.fitContentToView();
          this.$refs.topology && this.$refs.topology.renderTopologyData();
        })
      } else if (v === 'overview') {
        this.renderCharts();
        this.queryShowData();
      }
    }
  },
  computed: {
    activeMenuItem() {
      return this.menuItems.find(item => item.key === this.activeMenu) || this.menuItems[0];
    },
    placeholderMenus() {
      return this.menuItems.filter(item => item.key !== 'overview');
    }
  },
  mounted() {
    this.$nextTick(this.renderCharts);
    window.addEventListener('resize', this.resizeCharts);
    this.drawLoading = this.$loading({
      lock: true,
      text: "加载中...",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.3)",
      target: document.querySelector('#app')
    })
    this.initMap()
    this.generateVCode()
    this.initData()
  },
  activated() {
    window.addEventListener('resize', this.resizeCharts);
    this.$nextTick(this.resizeCharts);
  },
  deactivated() {
    window.removeEventListener('resize', this.resizeCharts);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts);
    Object.values(this.charts).forEach(chart => chart.dispose());
    this.charts = {};
    this.removeLayers('网格')
    this.drawLoading && this.drawLoading.close()
  },
  methods: {
    openKs(row) {
      this.$emit('changeStudent', row);
    },
    getExamTime() {
      getExamTime().then(res => {
        if (res.success && res.data.startTime && res.data.endTime) {
          this.ksTime = res.data.startTime + ' ~ ' + res.data.endTime;
          this.ksTimeArr = [res.data.startTime, res.data.endTime];
        }
      })
    },
    submitKsTime() {
      if (!this.ksTimeArr || this.ksTimeArr && this.ksTimeArr.length < 2) {
        this.$message.error('请补充竞赛时间 ！')
        return;
      }
      setExamTime({
        startTime: this.ksTimeArr[0],
        endTime: this.ksTimeArr[1]
      }).then(res => {
        if (res.success) {
          this.$message.success('设置成功!');
          this.ksTimeArr = ['', ''];
          this.ksTimeModel = false;
          this.getExamTime();
        } else {
          this.$message.error(res.msg);
        }
      })
    },
    settingTime() {
      this.ksTimeModel = true;
    },
    initMap() {
      window.sgdps2 = new window.SgdpsMap({
        msServiceUrl: "http://20.51.6.45:17771/dwqskScgk/v2/dwqsk/api",//TODO 根据现场情况修改
        staticUrl: "/sgdps/",
        //公共配置
        config: {
          SGMapLayerUrl: {
            jsurl: "http://map-ah.sgcc.com.cn/maps?v=3.0.0",//TODO 根据现场情况修改【咨询实施人员改地址】
            // jsurl: "http://map.sgcc.com.cn/maps?v=3.0.0",//TODO 根据现场情况修改【咨询实施人员改地址】
            // key: 'c6ce35798ac03f2da863265136dc673b', //TODO 根据现场情况修改【需要申请向思极地图申请】
            // sn: 'b732fcf2cbce3d178331d878a3e7ac4f', //TODO 根据现场情况修改【需要申请向思极地图申请】
            publicKey: PublicKey,//一张图publickey
          },
          mapOptions: {
            zoom: 6.556763424479864,
            center: [117.28576073561942, 32.11579868644401], //[117.71148159502775, 32.01452854740424]
            unit: 'metric', //默认是m
            container: 'examMap', //地图dom
            style: 'aegis://styles/aegis/StreetsLight',
          },
        },
        TOKENKEY: "SGDPS_TOKEN",
      })
      window.sgdps2.load.then((map) => {
        this.map = map
        // 地图加载完毕事件
        map.on('load', () => {
          layerController.addPulsingDot(map, 'pulsing-dot-points')
          //加载工具组件
          new window.narimap.Require(['Measure', "Marker"], () => {
            window.psrmap = new window.narimap.PSRMap(sgdps2.nariMap, {
              distribution: true,// 处理过滤不闪烁
              tmsLayerVisibility: false, // 控制是否初始化时显示光缆设备
              pipeLayerVisibility: false // 控制是否初始化时显示管廊设备
            })
            window.psrmap.addPSR()
            // 保存设备选择模式
            window.selectMode = window.psrmap.clickMode;
            window.measure = new window.narimap.Measure(sgdps2.nariMap);
            //初始化图层控制组件
            window.psrmap.on("load", () => {
              let map = sgdps2.nariMap
              window.layerControl = new window.narimap.AhComponents.LayerControl({ map, psrMap: map.psrMap });
              window.layerControl.init({
                // 容器id
                // dom: "#jxtMap",
                dom: "#global-wrapper",
                // 是否显示UI组件
                visible: false,
                // 图层配置，图层项配置，不传默认展示全部
                // mode: ['电网图层'],
                // 初始化图层控制，自定义图层的初始化状态，不传会按电网一张图默认配置初始化
                checkedVoltages: {
                  // 电网图层
                  psrCheckedNodes: [
                    { title: '>=500kV', checked: false },
                    { title: '220kV', checked: false },
                    { title: '110kV', checked: false }
                  ]
                }
              }).then(res => console.log(res));
              window.psrmap.filterByVoltage(['10000', '400', '35000', '110000'], {
                mode: 'only',
                visiable: JSON.parse('false')
              });
            })
            // addDwLayer()
          })
          //添加安徽边界
          sgdps2.addCityBorder('安徽省', {
            "line-width": 2,
            "line-color": "#2c4f74",
            "line-opacity": 1,
            "line-gap-width": 1
          });
          // 添加区划边框线，地市和县区边框线
          sgdps2.addQhBk({
            ds: {
              minZoom: 0,
              maxZoom: 9,
              line: {
                //设置边框线的颜色、透明度、宽度
                color: '#370b9e',
                opacity: 0.5,
                width: 1,
              },
              text: {
                //设置文字的颜色和大小
                color: 'rgba(55,11,158,0.5)',
                size: 12,
              },
            },
            xq: {
              minZoom: 9,
              maxZoom: 24,
              line: {
                color: 'rgba(55,11,158,0.5)',
                opacity: 0.5,
                width: 1,
              },
              text: {
                color: 'rgba(55,11,158,0.5)',
                size: 12,
              },
            },
          }) //添加地市县区边框线

          // nariweather && nariweather.config.load(map)
        })
        // 地图点击事件
        map.on('click', (e) => {
          this.$refs.mouse_click.hideRightMenu()
          if (sgdps.getdwLayerClickFeature) {
            // 左键菜单
            let event = sgdps.getdwLayerClickFeature(e)
            if (event && event.features.length > 0) {
              let leftMouseStyle = {
                top: e.point.y + 20 + 'px',
                left: e.point.x + 'px',
              }
              this.$refs.mouse_click.setPup(leftMouseStyle, event)
            } else {
              this.$refs.mouse_click.hideLeftMenu()
            }
          }
        })
      })
      this.sgdps = window.sgdps2
      this.mapLoad = true
      setTimeout(() => {
        this.drawLoading && this.drawLoading.close()
      }, 4000);
    },
    initData() {
      this.queryShowData();
      this.getExamTime();
      getDishiAreaListAdd().then((res) => {
        this.dishiAreaList = res.data
      })
      this.pageNo = 1
      this.getStudents()
    },
    queryShowData() {
      queryCount().then(res => {
        const data = res.data || {};
        this.paperStats.total = data.total || 0;
        this.paperStats.completed = data.ywc || 0;
        this.paperStats.doing = data.ksz || 0;
        this.paperStats.pending = data.dcl || 0;
        this.$set(this.metrics[0], 'value', data.total);
        this.$set(this.metrics[1], 'value', data.ywc);
        this.$set(this.metrics[2], 'value', data.ksz);
        this.$set(this.metrics[3], 'value', ( 100 * data.ywc / (data.total || 1)).toFixed(2));
      })
    },
    mapMax(type) {
      this.mapSize = type
      setTimeout(() => {
        sgdps2.map.resize()
      }, 100);
    },
    onPaperPageChange(page) {
      this.paperPage = page;
      this.getStudents();
    },
    generateVCode() {
      getVerifyCode().then((res) => {
        if (res.success) {
          this.verifyCode = res.data.verifyCode
          this.verifyId = res.data.id
        }
      })
    },
    //修改验证码
    submitVCode() {
      if (!this.vcodeInput) {
        this.$message.warning('请输入验证码')
        return
      }
      if (!/^\d{6}$/.test(this.vcodeInput)) {
        this.vcodeInput = ''
        this.$message.error('请输入6位数字！')
        return
      }
      updateVerifyCode({ id: this.verifyId, verifyCode: this.vcodeInput }).then((res) => {
        if (res.success) {
          this.$message.success('修改成功！')
          this.vcodeInput = ''
          this.generateVCode()
        } else {
          this.$message.error('修改失败！')
        }
      })
    },
    //市县联动
    getXianList(index) {
      this.xianAreaList = this.dishiAreaList[index].value
    },
    fitGeometry(geom, zoom) {
      sgdps2.map.setZoom(zoom)
      setTimeout(() => {
        if (geom.type == "Point") {
          sgdps2.map.flyTo({ center: geom.coordinates })
        } else if (geom.type == "LineString") {
          sgdps2.map.flyTo({ center: geom.coordinates[0] })
        } else if (geom.type == "MultiLineString") {
          sgdps2.map.flyTo({ center: geom.coordinates[0][0] })
        } else if (geom.type == "Polygon") {
          sgdps2.map.flyTo({ center: this.computeCoordinates(geom.coordinates) })
        }
      }, 100);
    },
    computeCoordinates(coordinates) {
      let xSum = 0;
      let ySum = 0;
      for (let i = 0; i < coordinates[0].length; i++) {
        xSum = coordinates[0][i][0] + xSum;
        ySum = coordinates[0][i][1] + ySum;
      }
      return [xSum / coordinates[0].length, ySum / coordinates[0].length]
    },
    formatLabel(val) {
      let label = ''
      this.shiOption.forEach((item) => {
        if (item.id == val) {
          label = item.label
          return
        }
      })
      return label
    },
    removeLayers(str) {
      if (!(typeof sgdps2 != 'undefined' && sgdps2)) { return }
      let layers = str.split(',');
      layers.forEach(item => {
        if (typeof sgdps2.map.getSource(item) != 'undefined') {
          sgdps2.removeLayerById(item);
        }
      })
    },
    //学生管理模块
    openAddStudent(student) {
      if (student) {
        this.idChange = false
        this.student = {
          ...student
        }
        var index = this.dishiAreaList.map(item => item.ssds_id).indexOf(this.student.ssdsId)
        if (index > -1) {
          this.getXianList(index)
        }
      } else {
        this.idChange = true
        this.student = {
          userName: '',
          userId: '',
          ssds: '',
          ssdsId: '',
          yxdw: '',
          yxdwId: '',
          dept: '',
          idNumber: ''
        }
      }
      this.addStudent = true
    },
    saveStudent() {
      this.$refs.student.validate((valid) => {
        if (valid) {
          let yxdw = ''
          this.xianAreaList.forEach((item) => {
            if (item.yxdw == this.student.yxdwId) {
              yxdw = item.yxdwmc
            }
          })
          var param = {
            id: this.student.id ? this.student.id : '',
            userName: this.student.userName,
            userId: this.student.userId,
            ssds: this.formatLabel(this.student.ssdsId),
            ssdsId: this.student.ssdsId,
            yxdw: yxdw,
            yxdwId: this.student.yxdwId,
            dept: this.student.dept
          }
          if (this.idChange == true) {
            param.idNumber = this.student.idNumber
          }
          saveOrUpdateAccount(param).then(res => {
            if (res.success) {
              this.addStudent = false
              this.$message.success('保存成功！')
              this.getStudents()
            } else {
              this.$message.error('保存失败！')
            }
          })
        } else {
          this.$message.error('有信息验证不通过！')
          return false
        }
      })
    },
    getStudents() {
      this.studentList = []
      const params = {
        pageNo: this.pageNo,
        pageSize: this.pageSize,
        username: this.studentName
      }
      listAccount(params).then(res => {
        if (res.success) {
          this.studentList = res.data.records || []
          this.total = res.data.total
        }
      })
    },
    delStudent(student) {
      this.$confirm("是否确认删除该考生信息？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        removeAccount({
          ids: student.id
        }).then((res) => {
          if (res.success) {
            this.$message.success("删除成功!");
            this.getStudents()
          } else {
            this.$message.error("删除失败!");
          }
        })
      })
    },
    closeStudent() {
      this.addStudent = false
    },
    downloadMb() {
      downloadTemplate().then((res) => {
        var a = document.createElement("a");
        var blob = new Blob([res]);
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = `导入模板.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
    },
    importStudent(item) {
      var form = new FormData();
      form.append("file", item.file);
      importAccount(form).then(res => {
        if (res.success) {
          this.$message.success('导入成功！');
          this.getStudents()
        } else {
          this.$message.error(res.msg);
        }
      })
    },
    switchMenu(key) {
      this.activeMenu = key;
      if (key === 'overview') this.$nextTick(this.resizeCharts);
      if (key === 'questions') {
        this.showMap = false
      }
    },
    refreshDashboard() {
      const now = new Date();
      const pad = value => String(value).padStart(2, '0');
      this.updateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      Object.values(this.charts).forEach(chart => chart.resize());
    },
    renderCharts() {
      countByDs().then(res => {
        this.setChart('unit', this.$refs.unitChart, this.unitOption(res.data));
      });
      countByScore().then(res => {
        const scoreList = res.data || [];
        const list = [0, 0, 0, 0, 0];
        scoreList.forEach(a => {
          if (a < 60) {
            list[0]++
          } else if (a >= 60 && a < 70) {
            list[1]++
          } else if (a >= 70 && a < 80) {
            list[2]++
          } else if (a >= 80 && a < 90) {
            list[3]++
          } else if (a >= 90 && a <= 100) {
            list[4]++
          }
        });
        this.setChart('score', this.$refs.scoreChart, this.scoreOption(list));
      });
    },
    setChart(key, element, option) {
      if (!element) return;
      const chart = this.charts[key] || echarts.init(element);
      chart.setOption(option, true);
      this.$set(this.charts, key, chart);
    },
    resizeCharts() {
      Object.values(this.charts).forEach(chart => chart.resize());
    },
    baseAxis() {
      return {
        axisLine: { lineStyle: { color: '#dce2ec' } },
        axisTick: { show: false },
        axisLabel: { color: AXIS_COLOR, fontSize: 11 }
      };
    },
    unitOption(data) {
      return {
        color: ['#3b82f6', '#16a085'],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, right: 8, itemWidth: 10, itemHeight: 10, textStyle: { color: '#59657a' } },
        grid: { left: 48, right: 14, top: 42, bottom: 42 },
        xAxis: { type: 'category', data: data.map(item => item.ssds), ...this.baseAxis() },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: GRID_LINE } }, ...this.baseAxis() },
        series: [
          { name: '报名人数', type: 'bar', barMaxWidth: 18, data: data.map(item => (item.bmrs || 0)), itemStyle: { borderRadius: [3, 3, 0, 0] } },
          { name: '已完人数', type: 'bar', barMaxWidth: 18, data: data.map(item => (item.wcrs || 0)), itemStyle: { borderRadius: [3, 3, 0, 0] } }
        ]
      };
    },
    scoreOption(data) {
      return {
        color: ['#6f7ee8'],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：{c} 人' },
        grid: { left: 48, right: 18, top: 18, bottom: 40 },
        xAxis: { type: 'category', data: ['60分以下', '60-69', '70-79', '80-89', '90-100'], ...this.baseAxis(), axisLabel: { color: AXIS_COLOR, fontSize: 10, interval: 0 } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: GRID_LINE } }, ...this.baseAxis() },
        series: [{
          type: 'bar', barWidth: '44%', data: data,
          label: { show: true, position: 'top', color: '#59657a', fontSize: 11 },
          itemStyle: { borderRadius: [4, 4, 0, 0], color: params => ['#ef6f6c', '#f2a93b', '#5b8ff9', '#36a2ae', '#4caf7d'][params.dataIndex] }
        }]
      };
    },
    openMap(row) {
      console.log(row);
      
      this.activeRow = { id: row.id, desp: row.desp || '' }
      this.showMap = true
      this.mapMax('max')
      setTimeout(() => {
        sgdps2.map.resize();
      }, 100);
    }
  }
};
</script>

<style lang="less" scoped>
.v11-page {
  display: flex;
  min-height: calc(100vh - 52px);
  color: #202938;
  background: #f4f6fa;
}

.v11-sidebar {
  position: sticky;
  // top: 52px;
  display: flex;
  flex: 0 0 220px;
  flex-direction: column;
  height: calc(100vh - 52px);
  padding: 18px 12px;
  color: #59657a;
  background: #fff;
  border-right: 1px solid #e1e6ee;
}

.sidebar-menu {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.menu-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 16px;
  align-items: center;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  color: #667085;
  font-size: 14px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.18s, color 0.18s;
}

.menu-item>i:first-child {
  font-size: 17px;
}

.menu-item:hover {
  color: #273142;
  background: #f3f6fa;
}

.menu-item.active {
  color: #2563eb;
  font-weight: 600;
  background: #eaf2ff;
  box-shadow: inset 3px 0 #2563eb;
}

.menu-arrow {
  font-size: 12px;
}

.v11-main {
  min-width: 0;
  flex: 1;
  padding: 0 24px 28px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  gap: 20px;
}

.page-header h1 {
  font-size: 22px;
  line-height: 1.3;
}

.page-header p {
  margin-top: 5px;
  color: #7a8598;
  font-size: 13px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.update-time {
  color: #8a94a6;
  font-size: 12px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #4d596d;
  font-size: 16px;
  background: #fff;
  border: 1px solid #dce2eb;
  border-radius: 5px;
  cursor: pointer;
}

.refresh-btn:hover {
  color: #2563eb;
  border-color: #7eaaed;
}

.overview-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.metric-card,
.data-panel {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(31, 42, 68, 0.04);
}

.metric-card {
  display: flex;
  min-height: 174px;
  justify-content: center;
  flex-direction: column;
  padding: 24px 26px;
  border-top-width: 4px;
}

.metric-card-blue {
  border-top-color: #3b82f6;
}

.metric-card-green {
  border-top-color: #16a085;
}

.metric-card-orange {
  border-top-color: #f0a126;
}

.metric-card-red {
  border-top-color: #ef6f6c;
}

.metric-head {
  display: flex;
  align-items: center;
  gap: 13px;
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  font-size: 21px;
  border-radius: 6px;
}

.metric-blue {
  color: #2563eb;
  background: #eaf2ff;
}

.metric-green {
  color: #14866d;
  background: #e7f6f1;
}

.metric-orange {
  color: #d57a06;
  background: #fff3df;
}

.metric-red {
  color: #dc5b58;
  background: #ffeded;
}

.metric-label {
  color: #687386;
  font-size: 14px;
  font-weight: 500;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 20px;
}

.metric-value strong {
  color: #1e2735;
  font-size: 38px;
  line-height: 1;
}

.metric-value span {
  color: #7d8798;
  font-size: 14px;
}

.chart-grid {
  display: grid;
  gap: 16px;
}

.chart-grid-secondary {
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 0.65fr);
}

.data-panel {
  min-width: 0;
  padding: 17px 18px 12px;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 44px;
  gap: 12px;
}

.panel-header h2 {
  color: #273142;
  font-size: 15px;
  line-height: 1.4;
}

.panel-header p {
  margin-top: 4px;
  color: #929baa;
  font-size: 11px;
}

.panel-tag {
  flex: 0 0 auto;
  padding: 4px 8px;
  color: #5072a7;
  font-size: 11px;
  background: #edf4ff;
  border-radius: 4px;
}

.text-btn {
  flex: 0 0 auto;
  padding: 3px 0;
  color: #2563eb;
  font-size: 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.chart {
  width: 100%;
}

.chart-medium {
  height: 410px;
}

.placeholder-page {
  display: flex;
  min-height: calc(100vh - 100px);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #7f899a;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 6px;
}

.placeholder-page>i {
  margin-bottom: 18px;
  color: #93a2ba;
  font-size: 42px;
}

.placeholder-page h2 {
  color: #344054;
  font-size: 20px;
}

.placeholder-page p {
  margin-top: 10px;
  font-size: 13px;
}

@media (max-width: 1180px) {
  .v11-sidebar {
    flex-basis: 200px;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .chart-grid-secondary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .v11-sidebar {
    flex-basis: 70px;
    padding-right: 9px;
    padding-left: 9px;
  }

  .menu-item span,
  .menu-arrow {
    display: none;
  }

  .menu-item {
    display: flex;
    justify-content: center;
    padding: 0;
  }

  .v11-main {
    padding-right: 14px;
    padding-left: 14px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px 0;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .update-time {
    display: none;
  }


}

@import '../../../style/index.less';

#examMap {
  height: 100%;
  width: 100%;
  position: absolute;
  overflow: initial;

  .map-close-btn {
    margin-left: auto;
    font-size: 13px;
    z-index: 1000;
    position: absolute;
    right: 20px;
    top: 10px;
  }

  .check-btn {
    background: linear-gradient(180deg, #f7fbff, #f4f8fe) !important;
    box-shadow: 0 1px 3px 0 rgba(3, 150, 253, .25) !important;
    border-radius: 3px;
    z-index: 1000;
    position: absolute;
    padding: 10px;
    top: 2vh;
    left: 2vw;
    width: 12vw;

    p {
      padding-bottom: 15px;
      padding-left: 15px;
      font-weight: 600;
      font-size: 14px;
    }

    p::before {
      position: absolute;
      content: "";
      width: 5px;
      height: 18px;
      top: 12px;
      left: 14px;
      background-color: #3064d4;
    }

    .operaMapTitle {
      padding: 10px;
      color: #fff;
    }

    .operateBtn {
      display: flex;
      position: relative;

      .active {
        color: #fff;
        background: #3064d4;
      }
    }

    .delete-text {
      color: #666;
      padding: 10px 15px;
      font-size: 14px;
      display: inline-block;
    }
  }
}

.papers-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f6fa;
  padding: 16px;

  .grid {
    max-height: 390px;
    width: 600px;
    top: 20vh;
    left: 2vw;

    .area_context {
      padding: 20px;
    }

    .el-form-item {
      margin-bottom: 0px;
    }

    .btn {
      display: inline-block;
      margin: 10px 20px 0 0;
      cursor: pointer;
      height: 32px;
      width: 80px;
      line-height: 32px;
      color: #fff;
      text-align: center;
      font-size: 14px;
      border: 1px solid #d9d9d9;
      background: linear-gradient(139deg, #94b6ff, #3064d4);
    }

    .del {
      background: #ff746a;
    }
  }
}

// 统计卡片行
.papers-stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;

  .paper-stat-card {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;

      &.stat-icon-users {
        background: #e8f4fc;
        color: #2980b9;
      }

      &.stat-icon-done {
        background: #e8f8ee;
        color: #00a86b;
      }

      &.stat-icon-doing {
        background: #fef8e8;
        color: #e6a23c;
      }

      &.stat-icon-pending {
        background: #fef0ef;
        color: #ff4d4f;
      }
    }

    .stat-body {
      .stat-num {
        font-size: 26px;
        font-weight: 700;
        color: #1a1a2e;
        line-height: 1.2;

        &.text-danger {
          color: #ff4d4f;
        }
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }
    }
  }
}

// 中间区域：地图 + 验证码
.papers-middle-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

// 地图面板
.papers-map-panel {
  height: 100%;
  width: 100%;
  flex: 4;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  .vcode-title-area {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .vcode-lock-icon {
    font-size: 16px;
    color: #00a86b;
  }

  .map-container {
    border-radius: 6px;
    overflow: hidden;

    .map-svg {
      width: 100%;
      height: auto;
      display: block;
      min-height: 140px;
    }
  }

  // 全屏模式
  &.map-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
    padding: 20px;
    background: #1a1a2e;
    box-shadow: none;

    .map-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100% - 60px);
      border-radius: 8px;

      .map-svg {
        min-height: auto;
        max-height: 100%;
        width: auto;
        max-width: 100%;
        border-radius: 8px;

        rect {
          fill: #1e3a5f;
        }

        text {
          fill: #8aa3b5;
        }
      }
    }
  }
}

// 验证码面板
.papers-vcode-panel {
  flex: 2;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  min-width: 0;

  .vcode-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .vcode-title-area {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .vcode-lock-icon {
      font-size: 16px;
      color: #00a86b;
    }

    .vcode-title-text {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
  }

  .vcode-desc {
    font-size: 11px;
    color: #999;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  // 验证码卡片
  .vcode-card {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 12px;
    min-height: 100px;

    .vcode-card-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #e8f8ee 0%, #d4edda 50%, #c3e6cb 100%);

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 20% 30%, rgba(0, 168, 107, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(0, 168, 107, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(0, 168, 107, 0.04) 0%, transparent 70%);
      }
    }

    .vcode-card-content {
      position: relative;
      z-index: 1;
      padding: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .vcode-card-label {
      font-size: 11px;
      color: #00a86b;
      font-weight: 500;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }

    .vcode-display {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;

      .vcode-char {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 44px;
        background: #fff;
        border: 2px solid #00a86b;
        border-radius: 6px;
        font-size: 22px;
        font-weight: 700;
        font-family: 'Consolas', 'Monaco', monospace;
        color: #00a86b;
        user-select: none;
        text-shadow: 0 1px 2px rgba(0, 168, 107, 0.3);
        box-shadow: 0 2px 6px rgba(0, 168, 107, 0.15);
      }
    }

    .vcode-refresh-btn {
      position: absolute;
      right: 14px;
      top: 14px;
      z-index: 2;
      background: #fff !important;
      border-color: #00a86b !important;
      color: #00a86b !important;

      &:hover {
        background: #00a86b !important;
        color: #fff !important;
      }
    }
  }

  .vcode-input-row {
    display: flex;
    align-items: center;
    gap: 8px;

    .vcode-input-field {
      flex: 1;
    }
  }
}

// 表格区域
.papers-table-area {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-shrink: 0;

    .toolbar-tabs {
      display: flex;
      gap: 5px;
    }
  }

  .status-tag {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 3px;
    font-weight: 500;

    &.status-done {
      color: #00a86b;
      background: #e8f8ee;
    }

    &.status-doing {
      color: #2980b9;
      background: #ecf5ff;
    }

    &.status-pending {
      color: #ff4d4f;
      background: #fef0ef;
    }
  }

  .score-text {
    color: #00a86b;
    font-weight: 600;
    font-size: 14px;
  }

  .score-empty {
    color: #c0c4cc;
  }

  .op-btn-export {
    color: #2980b9;
  }

  .op-btn-export:hover {
    color: #1a6bb5;
  }

  .table-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    flex-shrink: 0;

    .pagination-info {
      font-size: 12px;
      color: #909399;
    }
  }

  /deep/ .el-tag {
    color: #fff;
  }
}

.bottom {
  display: flex;
  justify-content: center;

  .btn1 {
    margin: 10px;
    cursor: pointer;
    height: 32px;
    width: 100px;
    line-height: 32px;
    color: #3064d4 !important;
    text-align: center;
    font-size: 14px;
    border: 1px solid #3064d4 !important;
    background: #fff !important;
  }

  .save {
    background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%) !important;
    color: #fff !important;
    border: 1px solid #d9d9d9 !important;
  }
}

.addWtModel {
  width: 25vw;
  top: 25vh;
  left: 38vw;

  .context {
    padding: 10px;
    display: flex;

    span {
      white-space: nowrap;
    }
  }

  /deep/ .el-input__inner {
    width: 15vw;
  }

  .bottom {
    display: flex;
    justify-content: center;

    .btn1 {
      margin: 10px;
      cursor: pointer;
      height: 32px;
      width: 100px;
      line-height: 32px;
      color: #3064d4 !important;
      text-align: center;
      font-size: 14px;
      border: 1px solid #3064d4 !important;
      background: #fff !important;
    }

    .save {
      background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%) !important;
      color: #fff !important;
      border: 1px solid #d9d9d9 !important;
    }
  }
}

/deep/ .el-pagination {
  padding: 10px 5px 0;
}

/deep/ .el-pagination.is-background .btn-prev,
/deep/ .el-pagination.is-background .btn-next,
/deep/ .el-pagination.is-background .el-pager li {
  min-width: 20px;
  background-color: transparent;
  border: 1px solid #d9d9d9;
  color: #666;
}

/deep/ .el-pagination.is-background .btn-prev,
/deep/ .el-pagination.is-background .btn-next {
  border: none !important;
}

/deep/ .el-pagination.is-background .el-pager li:not(.disabled).active {
  background: #fff;
}

/deep/ .el-pagination__jump {
  color: #666;

  .el-input__inner {
    border-radius: 0;
    background: transparent;
    color: #666;
    border: 1px solid #d9d9d9;
  }
}

/deep/ .el-radio__label {
  color: #666;
}

/deep/ .el-pagination.is-background .btn-prev,
/deep/ .el-pagination.is-background .btn-next,
/deep/ .el-pagination.is-background .el-pager li {
  min-width: 20px;
  background-color: transparent;
  border: 1px solid #d9d9d9;
  color: #666;
}

/deep/ .el-pagination.is-background .btn-prev,
/deep/ .el-pagination.is-background .btn-next {
  border: none !important;
}

/deep/ .el-pagination.is-background .el-pager li:not(.disabled).active {
  background: #5982dc;
  color: #fff;
}

/deep/ .el-pagination__jump {
  color: #666;
  margin-right: 24px;

  .el-input__inner {
    border-radius: 0;
    background: transparent;
    color: #666;
    border: 1px solid #d9d9d9;
  }
}
</style>
