<template>
    <div class="whiteTheme">
        <div class="ghtz-border" style="position: relative;">
            <div class="ghtz-item">
                <div class="dljxt">
                    <div class="dialog-title" ref="draggable" style="position: absolute;top: 0;">
                        <img src="../../../images/47c0863b.png" style="width: 15px">
                        <span class="dialog-title-bg">地理接线图</span>
                    </div>
                    <div id="jxtMap">
                        <!-- <img class="el-icon-full-screen" src="../../../components/wgdjModel/images/全屏.png"
                            @click.stop="mapMax('max')" v-show="mapSize == 'min'" />
                        <img class="el-icon-minus" src="../../../components/wgdjModel/images/取消全屏.png"
                            @click.stop="mapMax('min')" v-show="mapSize == 'max'" /> -->
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
                    <!-- <jsMap :cjId="localCjId"></jsMap> -->
                    <el-button class="btn" size="mini" @click="drawTp">查看地理网架</el-button>
                </div>
                <div class="wjtpt">
                    <drawTp v-if="localCjId" :mode="mode" :rowCjId="localCjId" />
                </div>
            </div>
        </div>
        <div class="ghtz-border" style="margin-top: 10px;">
            <div class="dialog-title" ref="draggable">
                <img src="../../../images/47c0863b.png" style="width: 15px">
                <span class="dialog-title-bg">问题列表
<!--                  <em class="tip">（点击地图上的网格和线路获取设备信息并新增问题）</em>-->
                </span>
                <!-- <div class="top selects">
                    <div class="left">
                        <el-input v-model="xmmc" placeholder="项目名称" size="small" clearable></el-input>
                        <div>
                            <el-select v-model="xm_type_ghtz" size="small" placeholder="项目阶段" multiple collapse-tags
                                clearable>
                                <el-option v-for="(item, index) in selectXmpcList" :key="index" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </div>
                        <div>
                            <el-select v-model="activeSel" size="small" placeholder="投资类型" clearable>
                                <el-option v-for="(item, index) in tztypeList" :key="index" :label="item"
                                    :value="item"></el-option>
                            </el-select>
                        </div>
                        <div>
                            <el-select v-model="sbType" size="small" placeholder="设备类型" clearable>
                                <el-option v-for="(item, index) in sbList" :key="index" :value="item" :label="item.name"
                                    @click.native="getWtlx(item.id)"></el-option>
                            </el-select>
                        </div>
                        <div>
                            <el-date-picker v-model="ghYear" type="year" placeholder="解决年份" format="yyyy"
                                value-format="yyyy" clearable @change="changeYear"></el-date-picker>
                        </div>
                        <div>
                            <el-select v-model="wtlxs" size="small" placeholder="问题类型" clearable multiple
                                class="select-over">
                                <el-option v-for="(item, index) in wtlxList" :key="index" :label="item.value"
                                    :value="item.value"></el-option>
                            </el-select>
                        </div>
                        <el-input v-model="xmbm" placeholder="一图四态项目编码" size="small" clearable></el-input>
                        <el-input v-model="bm" placeholder="网上电网编码" size="small" clearable></el-input>
                        <div>
                            <el-button class="btn" size="mini" @click="seachGhtz">查询</el-button>
                            <el-button class="btn" size="mini" @click="resetGhtz">重置</el-button>
                        </div>
                    </div>
                </div> -->
                <div class="export" v-if="!mode">
                    <el-button class="btn" size="mini" @click="addProblem">新增问题</el-button>
                </div>
            </div>
            <div class="ghtz-item-two">
                <div class="context" style="padding: 0 10px 10px;overflow: hidden;">
                    <div class="tabletemp" ref="tableContainer" v-loading="loadingTableWt">
                        <el-table :data="dialogDataGl" style="width: 100%;" height="35vh" border stripe size="small" align="center">
                            <el-table-column type="index" label="序号" width="50">
                                <template #default="{ $index }">{{ (pageNo_wt - 1) * pageSize_wt + $index + 1 }}</template>
                            </el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="ssds" label="市公司"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="yxdw" label="县(分)公司">
                            </el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="gds" label="供电所"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="gridName" label="供电网格"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="bdzName" label="变电站"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="sbmc" label="线路名称">
                                <template slot-scope="scope">
                                    <span @click.stop="rowTable(scope.row)" style="color: #349bf7;">{{ scope.row.xlName
                                    }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="wtlx" label="问题类型"></el-table-column>
                            <!-- <el-table-column :show-overflow-tooltip="true" prop="tzlx" label="投资类型"
                                width="90"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="xmmc" label="项目名称"
                                width="240"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="xmbm" label="网上电网编码"
                                width="140"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="bm" label="一图四态项目编码"
                                width="160"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" width="80" prop="ghkgsj"
                                label="解决年份"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="xm_type" label="项目阶段" width="90">
                                <template slot-scope="scope">
                                    <span>{{ parseStatus(scope.row.xm_type) }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="xm_type" label="评审阶段" width="90">
                                <template slot-scope="scope">
                                    <span
                                        :class="parseFlag(scope.row.ps_flag, scope.row.ps_step) == '已退回' ? 'stateStatus2' : 'stateStatus1'"
                                        style=" ">{{ parseFlag(scope.row.ps_flag, scope.row.ps_step) }}</span>
                                </template>
                            </el-table-column> -->
                            <!-- <el-table-column :show-overflow-tooltip="true" prop="" label="工程属性(新建、改造)" width="100">
                            </el-table-column>
                            <el-table-column :show-overflow-tooltip="true" width="120" prop="建设(改造)规模" label="建设(改造)规模">
                                <el-table-column :show-overflow-tooltip="true" width="110" prop="zyjkxl"
                                    label="架空线路(km)"></el-table-column>
                                <el-table-column :show-overflow-tooltip="true" width="110" prop="zydlxl"
                                    label="电缆线路(km)"></el-table-column>
                                <el-table-column :show-overflow-tooltip="true" width="100" prop="num_zskg"
                                    label="柱上开关(台)"></el-table-column>
                                <el-table-column :show-overflow-tooltip="true" width="100" prop="num_kbs"
                                    label="开闭所(座)"></el-table-column>
                                <el-table-column :show-overflow-tooltip="true" width="100" prop="num_hwg"
                                    label="环网柜(座)"></el-table-column>
                            </el-table-column> -->
                            <!-- <el-table-column :show-overflow-tooltip="true" prop="tz"
                                label="项目投资(万元)"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" prop="zftz"
                                label="其中政府投资(万元)"></el-table-column> -->
                            <el-table-column :show-overflow-tooltip="true" prop="account" label="账户名称"></el-table-column>
                            <el-table-column :show-overflow-tooltip="true" label="操作" width="200" v-if="!mode">
                                <template slot-scope="scope">
                                    <div>
                                        <!-- <el-tag size="small" color="#1890FF" @click="editProblem(scope.row)">修改</el-tag> -->
                                        <el-tag size="small" color="#FF7A7A" @click="delProblem(scope.row)">删除</el-tag>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-pagination class="table-pagination" background small @current-change="handleCurrentChangeWt" :current-page="pageNo_wt"
                            :page-size="pageSize_wt" layout="prev, pager, next, jumper, total" :total="tableTotal_wt"
                            :pager-count="5">
                        </el-pagination>
                    </div>
                </div>
            </div>
        </div>
        <!-- 拓扑图片放大 -->
        <leftPopup class=" photoModel" v-if="imgShow">
            <template slot="content">
                <h1 class="title">
                    <span class="close" @click="imgShow = false"></span>{{ bigImg.fileName }}
                </h1>
                <div class="context contextImg">
                    <img :src="bigImg.fileUrl" class="bigImgSize" />
                </div>
            </template>
        </leftPopup>
        <!--绘制地理网架-->
        <Popup class="huituTk" v-if="drawTpShow">
            <template slot="content">
                <h1 class="title">
                    <span class="close" @click="closeDrawTp"></span>绘图组件
                </h1>
                <tpModel :regionId="regionId" :yxdwId="yxdwId" :activeRow="activeRow" :mode="mode" @close="closeDrawTp" :xlDatas="lineList"></tpModel>
            </template>
        </Popup>

        <leftPopup class="addWtModel" v-if="addWtModel">
            <template slot="content">
                <h1 class="title">
                    <span class="close" @click="addWtModel = false"></span>{{ modelTitle }}问题
                </h1>
                <div class="context">
                    <el-form ref="ywForm" label-width="130px" label-position="right" label-suffix="：" style="width: 100%;">
                        <el-form-item label="问题类型" required>
                            <el-select v-model="wtlx" size="small" placeholder="问题类型" clearable>
                                <el-option v-for="(item, index) in wtlxList1" :key="index" :label="item"
                                    :value="item"></el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item label="线路" required>
                            <el-select v-model="lineInfo.fid" size="small" placeholder="线路" @change="changeLine"
                                    clearable>
                                    <el-option v-for="(item, index) in lineList" :key="index" :label="item.name"
                                        :value="item.id"></el-option>
                                </el-select>
                        </el-form-item>
                      <template v-if="lineInfo.fid">
                        <el-form-item label="地市">
                          {{ lineInfo.ssds }}
                        </el-form-item>
                        <el-form-item label="单位">
                          {{ lineInfo.yxdw }}
                        </el-form-item>
                        <el-form-item label="变电站">
                          {{ lineInfo.stationName }}
                        </el-form-item>
                        <el-form-item label="线路">
                          {{ lineInfo.name }}
                        </el-form-item>
                      </template>
                    </el-form>
                </div>
                <div class="bottom">
                    <p class="btn1 save" @click="submitProblem" v-loading="loading">提交</p>
                    <p class="btn1" @click="addWtModel = false">取消</p>
                </div>
            </template>
        </leftPopup>

        <el-dialog v-if="codeDialog" append-to-body :visible="codeDialog" title="违规操作，请联系考官获取验证码解封" width="25%"
            :show-close="false" :close-on-click-modal="false">
            <div id="xlModify">
                <el-form ref="student" :model="student" label-position="right" label-width="120px" :rules="ruleForm" @submit.native.prevent="submitCode">
                    <!-- <div>违规操作，获取验证码解封：</div> -->
                    <el-form-item label="验证码：">
                        <el-input type="text" placeholder="请输入验证码" v-model="code"></el-input>

                    </el-form-item>
                    <div style="display: flex;justify-content: flex-end;">
                        <el-button size="small" type="primary" native-type="submit">确定</el-button>
                    </div>
                </el-form>
            </div>
        </el-dialog>
    </div>
</template>
<script>
import { getGhsjData, findEquipment, getDropdownItems, getLoginRole } from '@/api/pwgh/xqkNew'
import { saveOrUpdateWt, listWt, removeWt, wgjy, yzmjy, getExamTime, wgjl, finishExam, logout } from '@/api/pwgh/examCbPsk'
import WKT from 'terraformer-wkt-parser'
import leftPopup from '@/components/ghsjPanel/dragPopup/index.vue'
import * as layerController from '@/platformComponents/Maps/components/Map/Layer/index'
import mouseClick from '@/platformComponents/mouseClick/index.vue'
import TPMap from '@/components/ghsjPanel/components/tp/indexTzgh.vue'
import Popup from '@/components/ghsjPanel/components/wjghModel/popup.vue'
import tpModel from "../wj/drawTpExam.vue";
import { getAllGrids, getXlByGridId } from "@/api/pwgh/examIndex";
import drawTp from "./drawTp.vue"
import common from '../../../common.js'
import { createViolationGuard } from '../violationGuard.js'
import { getWjByGrid } from '@/api/pwgh/examWjghNew'
import jsMap from './jsMap.vue'

export default {
    name: "tzgh",
    components: {
        leftPopup, mouseClick, TPMap, Popup, tpModel, drawTp, jsMap
    },
    props: {
        mode: {
            type: String,
            default: ''
        },
        regionId: {
            type: String,
            default: ''
        },
        yxdwId: {
            type: String,
            default: ''
        }
    },
    directives: {
        'append-to-body': {
            inserted(el, binding) {
                if (binding.value !== false) {
                    document.body.appendChild(el)
                }
            },
            unbind(el) {
                if (el.parentNode === document.body) {
                    document.body.removeChild(el)
                }
            },
        }
    },
    data() {
        return {
            common,
            kscj: '',
            lineInfo: {
                stationId: '',
                stationName: '',
                fid: '',
                name: '',
                ssds: '',
                yxdw: ''
            },
            lineList: [],
            // mode: '',
            teacherInfo: localStorage.getItem('ks-user-info-teacher') && JSON.parse(localStorage.getItem('ks-user-info-teacher')) || {},
            studentInfo: localStorage.getItem('ks-user-info') && JSON.parse(localStorage.getItem('ks-user-info')) || {},
            code: '',
            codeDialog: false,
            violationGuard: null,
            modelTitle: '',
            loading: false,
            wtlx: '',
            addWtModel: false,
            wtlxList1: ['单辐射线路', '超大线路', '超大分支', '老旧线路', '站间联络不足', '未实现有效联络', '非标准接线', '供电半径过长'],
            //地图撒考题
            drawData: [],
            gridDialog: false,
            gridDetails: '',
            lineDialog: false,
            lineDetails: {},
            user: { userName: '' },
            maxTp: false,
            activeRow: {},
            drawTpShow: false,
            roleData: [],
            tpUrl: '',
            imgShow: false,
            bigImg: {
                fileName: '',
                fileUrl: '',
                gridId: '',
                id: ''
            },
            yearClass: '全量项目',
            tableHeight: 0,
            problemName: "",
            projectNumList: [],
            colorList: ['#FF9600', '#FF1E1E', '#BC0000', '#FF5353', '#FEB65A', '#00A6B2', '#5Bd3FF', '#B28DBF', '#BE4785', '#D9B8E4'],
            handledialogChangeLoading: false,
            xm_type: "",
            dialogDataGl: [],
            loadingTableWt: false,
            pageNo_wt: 1,
            pageSize_wt: 10,
            tableTotal_wt: 0,
            pageDialogNo: 1,
            dialogTotal: 0,
            map: null,
            sgdps: null,
            wtlxList: [],
            wtlx: '',
            wtlxs: [],
            mapLoad: false,
            mapSize: 'min',
            drawLoading: false,
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
            marker: []
        }
    },
    computed: {
      localCjId() {
        return localStorage.getItem('ks-active-paper') && JSON.parse(localStorage.getItem('ks-active-paper')).cjId || ''
      }
    },
    beforeDestroy() {
        document.getElementsByClassName('xzzd-box')[0] ? document.getElementsByClassName('xzzd-box')[0].style.background = '#ecf2fc' : ''
        document.getElementsByClassName('SearchIcon')[0].style.left = '34vw'
        window.removeEventListener('resize', this.setTableHeight)
        this.removeLayers('网格,选中元素,网架规划-draw-变电站')
        this.lineList.forEach((item)=> {
            this.removeLayers(`网架规划-draw-点-${item.id},网架规划-draw-线-${item.id}`)
        })
        this.marker.forEach((item)=> {
            item && item.remove()
        })
        this.marker = []
    },
    destroyed() {
        sgdps1.map.off('click', this.mapClick)
        window.sgdps1 = null
    },
    mounted() {
        document.getElementsByClassName('xzzd-box')[0] ? document.getElementsByClassName('xzzd-box')[0].style.background = 'none' : ''
        document.getElementsByClassName('SearchIcon')[0].style.left = '96vw'
        this.initMap()
        this.$nextTick(() => {
            getLoginRole({ userName: JSON.parse(sessionStorage.getItem('userInfo')).userName, userId: JSON.parse(sessionStorage.getItem('userInfo')).userId }).then((res) => {
                if (res.success) {
                    this.roleData = res.data.roles.map(r => r.role_code)
                }
            })
            this.get_wtsb('1');
            this.setTableHeight()
            this.getWtlx()
            window.addEventListener('resize', this.setTableHeight());
            // todo: 后续阅卷双身份，考官身份这里不用执行
            // if (!this.teacherInfo.id) {

            //     this.getTimeInfo();
            //     // this.mode = '';
            // } else {
            //     // this.mode = '阅卷中';
            // }
            this.getTimeInfo();
        })
    },
    beforeDestroy() {
        this.drawLoading && this.drawLoading.close()
        if (this.violationGuard) this.violationGuard.stop();
        window.removeEventListener('keydown', this.onKeyDown);
    },
    methods: {
        fitFeatures(feature, isFit) {
            this.removeLayers('选中元素')
            let geom = feature.geometry
            if(geom.type == 'Polygon') {
                // sgdps1.addGeometryPolygon(
                // '选中元素',
                // {
                //     type: 'FeatureCollection',
                //     features: [{
                //     type: 'Feature',
                //     geometry: geom
                //     }]
                // },
                // {
                //     style: {
                //     fillColor: '#d291e7',
                //     fillOpacity: 0.8,
                //     outline: '#8a00b7',
                //     textField: '{name}',
                //     textSize: 12,
                //     textColor: '#ffffff'
                //     },
                //     issText: false,
                // }
                // )
                // if(isFit) {
                // sgdps1.map.jumpTo({center: common.getGeometryCenter(geom), zoom: 15 })
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
                sgdps1.map.jumpTo({center: geom.coordinates, zoom: 15 })
                }
            }
        },
        changeLine(v) {
            const data = this.lineList.find(item => item.id === v) || {};
            data.fid = data.id;
            this.$set(this, 'lineInfo', v ? data : {})
        },
        getTimeInfo() {
            getExamTime({}).then(res => { // todo: 学生端
                const data = (res && res.data) || {};
                if (data.examStatus != null && String(data.examStatus).trim() !== '') {
                    this.$emit('exam-closed');
                    return;
                }
                this.kscj = data.kscj;
                if (data.wgcs > 3 && this.studentInfo.status < 2) {
                    finishExam().then(res => {
                        logout({
                            accountId: this.teacherInfo.id ? this.teacherInfo.id : this.studentInfo.id
                        }).then(res => {
                            localStorage.removeItem('ks-user-info');
                            this.$emit('needLogin');
                        })
                    })
                    this.$confirm('违规操作超过三次，考试结束！', '提示', {
                        type: "warning",
                        confirmButtonText: "确认",
                        showCancelButton: false
                    }).then(() => {
                        
                    })
                    return
                }
                if (data.sfwg && this.studentInfo.status < 2) {
                    this.openCodeDialog();
                }
            })
        },
        submitCode() {
            if (!this.code) {
                this.$message.error('请输入验证码!');
                return;
            }
            // todo: 解除违规
            yzmjy({
                code: this.code
            }).then(res => {
                if (res.success) {
                    this.codeDialog = false;
                    this.$message.success('已解除限制');
                    this.getTimeInfo();
                } else {
                    this.$message.error(res.msg);
                }
            })

        },
        onKeyDown(event) {
            if (this.violationGuard && this.violationGuard.handleKeyDown(event)) return;
        },
        openCodeDialog() {
            if (this.mode)return;
            return
            // todo: 通知服务器违规
            this.codeDialog = true;
            wgjl().then(res => {
                if (!res.success && res.msg.includes('禁止考试')) {
                    finishExam().then(res => {
                        logout({
                            accountId: this.teacherInfo.id ? this.teacherInfo.id : this.studentInfo.id
                        }).then(res => {
                            localStorage.removeItem('ks-user-info');
                            this.$emit('needLogin');
                        })
                    })
                    this.$confirm('违规操作超过三次，考试结束！', '提示', {
                        type: "warning",
                        confirmButtonText: "确认",
                        showCancelButton: false
                    }).then(() => {

                    })
                }
            })
        },
        submitProblem() {
            console.log(this.lineInfo);
            if (!this.wtlx) {
                this.$message.error('请选择问题类型！');
                return;
            }
            if (!this.lineInfo.fid) {
                this.$message.error('请选择线路！');
                return;
            }
            this.loading = true;
            const params = {
                bdzId: this.lineInfo.stationId,
                bdzName: this.lineInfo.stationName,
                sbId: this.lineInfo.fid,
                sbName: this.lineInfo.name,
                sblx: 'xl',
                wtlx: this.wtlx,
                xlId: this.lineInfo.fid,
                xlName: this.lineInfo.name,
            };
            if (this.modelTitle === '修改') {
                params.id = this.lineInfo.id
            }
            saveOrUpdateWt(params).then((res) => {
                console.log(res)
                if (res.success) {
                    this.wtlx = '';
                    this.addWtModel = false;
                    this.$message.success(`${this.modelTitle}成功！`)
                    this.get_wtsb('1');
                } else {
                    this.$message.error(`${this.modelTitle}失败！`)
                }

            }).catch(() => {
                this.$message.error(`${modelTitle}失败！`)
            }).finally(() => {
                this.loading = false;
            })
        },
        addProblem() {
            this.lineDetails = {};
            this.wtlx = '';
            this.modelTitle = '新增';
            this.addWtModel = true;
        },
        editProblem(row) {
            this.lineInfo = { ...row };
            this.lineInfo.stationName = row.bdzName;
            this.lineInfo.name = row.xlName;
            this.lineInfo.fid = row.xlId;
            this.wtlx = row.wtlx;
            this.modelTitle = '修改';
            this.addWtModel = true;
        },
        delProblem(row) {
            this.$confirm('确定要删除当前数据吗？').then(() => {
                removeWt({
                    id: row.id
                }).then(res => {
                    if (res.success) {
                        this.$message.success('删除成功!');
                        this.get_wtsb('1');
                    } else {
                        this.$message.error(res.msg);
                    }
                })
            })

        },
        //撒考题
        drawFeatures() {
            this.removeLayers('网格')
            this.drawLoading && this.drawLoading.close()
            getAllGrids({ cjId: JSON.parse(localStorage.getItem('ks-active-paper')).cjId || '20cbbb26-1a10-4c01-a09b-c3f38643de1c' }).then(res => {
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
            getXlByGridId({ versionId: JSON.parse(localStorage.getItem('ks-active-paper')).cjId || '20cbbb26-1a10-4c01-a09b-c3f38643de1c' }).then(res => {
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
                sswjId: JSON.parse(localStorage.getItem('ks-active-paper')).cjId || '20cbbb26-1a10-4c01-a09b-c3f38643de1c', year: year
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
                                        jsdzType: drawData[i].jsdzType,
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
                                            year: drawData[i].year,
                                            jsdzType: drawData[i].jsdzType
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
                                    minzoom: 0,
                                    maxzoom: 24,
                                    layout: {
                                        visibility:'visible',
                                        "icon-ignore-placement": true,
                                        "text-ignore-placement": true
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
                                        iconSize: 0.6,
                                        textHaloColor: '#fff',
                                        textColor: '#7e8a9f',
                                        textHaloWidth: 1,
                                        textOffset: [0, 1]
                                    },
                                    layout: {
                                        visibility:'visible',
                                       "icon-ignore-placement": true,
                                        //计算碰撞时忽略本图层文字
                                        "text-ignore-placement": true
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
        //撒线路
        drawLines(features) {
            sgdps1.addGeometryLine(
                '线路',
                {
                type: 'FeatureCollection',
                features: features,
                },
                {
                paint: {
                    "line-color": ["get", "lineColor"],
                    "line-width": 5,
                    "line-opacity": 1
                },
                style: {
                    textHaloColor: '#fff',
                    textColor: '#7e8a9f',
                    textHaloWidth: 1
                },
                issText: true,
                click: (e) => {
                    //添加弹窗
                    console.log(e.features[0]);
                }
                }
            )
        },
        //地图点击事件
        mapClick(e) {
            if (this.drawTpShow) {
                return
            }
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
        drawTp() {
            this.gridDialog = false
            this.lineDialog = false
            this.activeRow = { id: JSON.parse(localStorage.getItem('ks-active-paper')).cjId || '20cbbb26-1a10-4c01-a09b-c3f38643de1c', year: '2026' }
            this.mapMax('max')
            this.drawTpShow = true
        },
        closeDrawTp() {
            this.mapMax('min')
            this.drawTpShow = false
        },
        // 行点击事件
        rowTable(row) {
            console.log(row);
            
        },
        // 创建地图
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
        setTableHeight() {
            const viewportHeight = window.innerHeight;
            const containerOffsetTop = this.$refs.tableContainer.getBoundingClientRect().top;
            this.tableHeight = viewportHeight - containerOffsetTop - 60;
        },
        parseStatus(type) {
            return type == "0"
                ? "规划库"
                : type == "1"
                    ? "储备库"
                    : type == "2"
                        ? "下达库"
                        : "需求库";
        },
        parseFlag(val, step) { // 待提交 ，已评审， 已退回
            if (!val || val == 0) {
                // return '未提交'
            } else if (val == 1) {
                return '评审中'
            } else if (val == 2) {
                if (step == 6) {
                    return '已批复'
                } else if (step == 5) {
                    return '待批复'
                } else {
                    // '<span style="color: red">已退回</span>'
                    "已退回"
                }
            } else if (val == 3) {
                // return '<span style="color: red">已退回</span>'
                '已退回'
            }
        },
        get_wtsb(tys) {
            this.loadingTableWt = true;
            const params = {
                pageNum: this.pageNo_wt,
                pageSize: this.pageSize_wt
            };
            listWt(params).then((res) => {
                if (res.success) {
                    this.loadingTableWt = false;
                    this.dialogDataGl = res.data && res.data.records || [];
                    this.tableTotal_wt = res.data.total
                }
            })
        },
        handleCurrentChangeWt(val) {
            this.pageNo_wt = val;
            if (this.yearClass == '全量项目') {
                this.get_wtsb('2');
            } else {
                this.get_wtsb('1');
            }
        },
        getGhsjData() {
            this.handledialogChangeLoading = true
            let params = {
                pageNo: this.pageDialogNo,
                pageSize: 10,
                // xm_source: "5",
                bak3: this.problemName
            }
            getGhsjData(params).then((res) => {
                if (res.success) {
                    this.handledialogChangeLoading = false;
                    this.projectNumList = res.data;
                    this.dialogTotal = res.total
                }
            }).finally(() => {
                this.handledialogChangeLoading = false
            })
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
        getWtlx(type) {
            getDropdownItems({
                type: 'wtlx',
                groups: type ? type : ''
            }).then((res) => {
                if (res.success) {
                    this.wtlxList = res.data
                }
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
                    overflow: 'hidden',
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
        }
    }
}
</script>
<style lang="less">
    .pwgh-index-marker {
    background: #fff;
    padding: 0 5px;
    will-change: unset !important;
    z-index: 0;
    p {
        white-space: pre-wrap;
    }
    }
    .pwgh-index-marker::after {
    content: '';
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-style: solid;
    border-color: #fff transparent transparent transparent;
    border-width: 6px;  
    }
</style>
<style lang="less" scoped>
@import '../../../style/index.less';

/deep/ .eacharts-xzzl-tooltip {
    color: #9663fa;
}

/deep/ .el-dialog {
    //  margin: 0 !important;

    .el-dialog__headerbtn {
        // top: 5px;
    }
}

.el-pagination.is-background .el-pager li:not(.disabled).active {
    background: #5982dc;
}

.el-pagination__jump {
    margin-right: 24px;
    color: #666;

    .el-input__inner {
        border-radius: 0;
        background: transparent;
        color: #666;
        border: 1px solid #d9d9d9;
    }
}

.el-pagination {
    padding: 10px 5px 2px !important;
}

.el-pagination.is-background .el-pager li {
    color: #666;
    background-color: transparent;
    border: 1px solid #d9d9d9;
}

.dialog-title {
    z-index: 2;
    height: 40px;
    line-height: 40px;
    font-size: 16px;
    box-sizing: border-box;
    padding: 3px 10px;
    color: #262626;
    cursor: move;
    position: relative;

    &:before {
        position: absolute;
        content: '';
        width: 5px;
        height: 18px;
        top: 15px;
        left: 0px;
        background-color: var(--main-color);
    }

    .dialog-title-bg {
        display: inline-block;
        padding-left: 4px;
        font-weight: 600;
        font-size: 16px;
        height: 18px;
        line-height: 18px;
        // color: #262626!important;
        letter-spacing: 0;
        position: relative;
    }

    .dialog-title-bg.active {
        color: #1890ff;
    }

    .right {
        float: right;
        cursor: pointer;
        margin-right: 10px;
    }
}

.tabletemp {
    /deep/ .el-radio__label {
        color: #666;
    }

    /deep/ .el-tag {
        color: #fff;
    }
}

.huituTk {
    top: 55px;
    z-index: 1000;
    .title {
    font-size: 16px!important;
    }
}

.seach_cont {
    display: flex;
    align-items: center;
    padding-left: 30px;
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

.btn1 {
    cursor: pointer;
    margin: 0 2px;
    height: 32px;
    color: #666;
    border: 1px solid #d9d9d9;
    text-align: center;
    font-size: 14px;
    background: #fff;

    i::before {
        color: #fff !important;
    }
}

#wtDetails {
    // border: 1px solid #ccc;
    width: 100%;
    height: 250px;
    padding: 10px 0;
    margin: 0 auto;
}

#xxzd-tj-three {
    width: 21.4vw;
    height: 250px;
    padding: 10px 0;
    // margin: 0 auto;
}

.ghtz-item {
    display: flex;
}

.wtqk {
    width: 46%;
    min-height: 300px;
}

.wtqk-item {
    display: flex;
    align-items: center;
    min-height: 300px;
}

.ghwt-chart {
    width: 38%;
}

.ghwt-label {
    width: 62%;
    // position: absolute;
    // right: 0;
    // top: 100px;
    height: 270px;
    overflow: auto;
    z-index: 1;

    // width: 325px;
    .item+.item {
        margin-top: 4px;
    }

    span {
        font-size: 12px !important;
        font-family: LCDBQ-Italic, LCDBQ
    }

    p {
        display: inline-block;
    }

    .p1 {
        width: 61%;
    }
}

.tzqk {
    display: flex;
    justify-content: center;
}

.tzqk-bar-label {
    width: 20%;
}

.tzqk-bar {
    width: 60%;
    border-left: 1px solid #ccc;

    .chartsLegend {
        color: #666;

        // padding-right: 10px;
        .item {
            padding: 0 5px;
            margin-bottom: 5px;
            cursor: pointer;
            white-space: nowrap;
            display: inline-block;
            width: 145px;
        }

        .circle {
            width: 24px;
            height: 12px;
            border-radius: 3px;
            display: inline-block;
            margin-right: 5px;
        }

        .blue {
            font-family: LCDBQ-Italic;
            color: #3064d4;
        }
    }
}

.tzqk-count {
    width: 120px;
    text-align: center;
    // margin: 0 auto;
    padding: 10px;
    // margin-top: 0px;
    background: rgba(226, 238, 255);
}

.tzqk-count-p1 {
    margin-top: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
}

.tzqk-count-a1 {
    font-size: 14px;
}

.tzqk-count-p1 span {
    font-family: LCDBQ-Italic, LCDBQ;
    color: rgba(148, 169, 212);
    font-size: 14px;
}

.tzqk-count p {
    font-family: LCDBQ-Italic, LCDBQ;
    color: rgba(148, 169, 212);
}

.chartsLegend {
    color: #666;
    margin-top: 16px;

    // padding-right: 10px;
    .item {
        padding: 0 5px;
        margin-bottom: 5px;
        cursor: pointer;
        white-space: nowrap;
        display: inline-block;
        // width: 145px;
    }

    .circle {
        width: 24px;
        height: 12px;
        border-radius: 3px;
        display: inline-block;
        margin-right: 5px;
    }

    .blue {
        font-family: LCDBQ-Italic;
        color: #3064d4;
    }
}

.circle {
    width: 24px;
    height: 12px;
    border-radius: 3px;
    display: inline-block;
    margin-right: 5px;
}

.guxm-label {
    width: 15%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    justify-content: flex-start;
}

.guxm {
    width: 54%;
    min-height: 300px;
    border-left: 1px solid #ccc;

    .tzlx-year {
        display: flex;
        // margin-left: 41px;
        // margin-top: 5px;
        justify-content: flex-end;

        p {
            margin: 0 5px;
            cursor: pointer;
            height: 25px;
            width: 60px;
            line-height: 24px;
            color: #666;
            text-align: center;
            font-size: 14px;
            border: 1px solid #ccc;
            background: #fff;
        }

        p.active {
            color: #3064d4;
            border: 1px solid #3064d4;
        }
    }
}

.selects {
    display: inline-flex;
    justify-content: space-between;
    margin-left: 20px;
}

.ghtz-item-two {
    /deep/ .el-table .el-table__header-wrapper {
        height: auto !important;
    }

    /deep/ .el-table__fixed-body-wrapper {
        top: 70px !important;
        height: 233px !important;
    }
}

.left {
    display: flex;
    align-items: center;
}

/deep/ .guxm .el-tabs {
    width: 100%;

    .el-tabs__content {
        min-height: 306px;
        overflow: auto !important;
    }
}

/deep/ .left .el-input {
    margin-right: 5px;
    height: 24px;
    line-height: 24px;
    width: auto;
}

/deep/ input::-webkit-input-placeholder {
    font-size: 12px !important;
    color: #c0c4cc !important;
}

/deep/ input::-moz-input-placeholder {
    font-size: 12px !important;
    color: #c0c4cc !important;
}

/deep/ input::-ms-input-placeholder {
    font-size: 12px !important;
    color: #c0c4cc !important;
}

/deep/ .left .el-input--small .el-input__icon {
    line-height: 19px;
}

/deep/ .left .el-input__inner {
    height: 24px;
    line-height: 24px;
    border: 1px solid #d9d9d9 !important;
    border-radius: 0;
    background: #fff !important;
    color: #666 !important;
    width: 7vw;
}

/deep/ .tzlxModel .el-input__inner {
    height: 24px;
    line-height: 24px;
    border: 1px solid #d9d9d9 !important;
    border-radius: 0;
    background: #fff !important;
    color: #666 !important;
    width: 7vw;
}

/deep/ .tzlxModel .el-input {
    height: 24px;
    line-height: 24px;
    width: auto;
}

/deep/ .tzlxModel .el-input--small .el-input__icon {
    line-height: 19px;
}

.tabletemp {
    margin-top: 10px;
    overflow: hidden;
}

.ghtz-border {
    border: 1px solid #cccccc;
    border-radius: 5px;

    .dialog-title::before {
        content: none;
    }

    .export {
        position: absolute;
        top: 5px;
        right: 10px;
    }
}

.gh-dialog-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // margin-top: 18px;
    padding: 0 10px;
}

.tzqk-block {
    display: flex;
    align-items: center;
    padding: 0 10px;
}

.tzlx-year-block {
    display: flex;
    justify-content: space-evenly;

    .tzlx-year-chart {
        // width: 80%;
    }

    .tzlx-year-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .chartsLegend {
        display: flex;
        flex-direction: column;
        width: 196px;
    }
}

.tzlx-year {
    display: flex;
    margin-bottom: 12px;
    justify-content: flex-end;
    margin-top: 12px;

    p {
        margin: 0 5px;
        cursor: pointer;
        height: 25px;
        width: 60px;
        line-height: 24px;
        color: #666;
        text-align: center;
        font-size: 14px;
        border: 1px solid #ccc;
        background: #fff;
    }

    p.active {
        color: #3064d4;
        border: 1px solid #3064d4;
    }
}

.dbfx_cont {
    width: 100%;
    // height: 31vh;
    border: 1px solid #cccccc;
    border-radius: 5px;
    margin-top: 10px;

    .DBFX_left {
        width: 25%;
        padding: 0 10px;
        line-height: 1.5;
        overflow: auto;
        height: 249px;
        border-right: 1px solid #cccccc;

        .dian {
            padding: 5px;
            background: #000;
            border-radius: 50%;
            display: inline-block;
        }

        .name {
            color: #1890ff;
        }

        .fen {
            font-family: LCDBQ-Italic, LCDBQ;
            color: #1890ff;
            padding: 0 3px;
        }
    }
}

/deep/ .gh-dialog-title .el-tabs--card>.el-tabs__header .el-tabs__item.is-active {
    border-bottom-color: #FFFFFF;
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
}

/deep/ .gh-dialog-title .el-tabs--card>.el-tabs__header {
    border-bottom: none;
}

/deep/ .gh-dialog-title .el-tabs--card>.el-tabs__header .el-tabs__nav {
    border: 1px solid #dfe4ed;
    border-bottom: 1px solid #dfe4ed;
    border-radius: 4px 0 0 4px;
    box-sizing: border-box;
}

.dljxt {
    width: 46%;
    height: 44vh;

    #jxtMap {
        left: 0;
        width: 45vw;
        height: 44vh;
        position: absolute;
        overflow: hidden;
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

.tip {
    color: #FF5722;
    font-weight: bold;
    font-size: 14px;
    font-family: fangsong;
}

.wjtpt {
    width: 54%;
    height: 44vh;
    position: relative;
    border-left: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .file-view1 {
        // flex: 1;
        display: flex;
        height: 44vh;
        flex-direction: column;
        position: relative;
        overflow: hidden;
    }

    .file-view {
        width: 51vw;
        height: 44vh;
        // flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        // background: red;
        .empty-file {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            height: 44vh;

            .empty-file-icon {
                font-size: 4vw;
            }
        }

        .tp-style {
            width: 51vw;
            height: 36vh;
            top: 35px;
            position: absolute;
            left: 0;

            .screen-btn {
                position: absolute;
                z-index: 1000;
                right: 10px;
                top: 70px;
                width: 18px;
                cursor: pointer;
            }
        }

        .max-tp-style {
            width: 97vw;
            height: calc(100vh - 55px);
            position: fixed;
            top: 55px;
            left: 0;
            z-index: 1000;
            background: #fff;

            .screen-btn {
                position: absolute;
                z-index: 1000;
                right: 20px;
                top: 70px;
                width: 18px;
                cursor: pointer;
            }
        }
    }

}

.flie-button {
    text-align: center;
    display: flex;
    justify-content: center;
    margin-right: 10px;
}

.uploadBtn {
    position: absolute;
    bottom: 1px;
    left: 0;
    z-index: 10;
}

.ml20 {
    margin-left: 20px;
}

.yearActive,
.operate-active {
    background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%);
    color: #fff;
}

.yearDefault {
    background: #fff;
    color: #666;
}

.uploadBtn {
    button {
        position: relative;
        margin-right: 6px;
        border: 1px solid transparent;
        border-radius: 0px !important;

        &::before {
            content: '';
            background-clip: border-box;
            position: absolute;
            left: -2px;
            right: -2px;
            top: -2px;
            bottom: -2px;
            z-index: -1;
            border-radius: 3px;
        }

        &:nth-child(1)::before {
            background-image: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%);
        }

        &:nth-child(2)::before {
            background-image: linear-gradient(139deg, #d8980e 0%, #cf590a 100%);
        }

        &:nth-child(3)::before {
            background-image: linear-gradient(139deg, #0dad23 0%, #077003 100%);
        }

        &:nth-child(4)::before {
            background-image: linear-gradient(139deg, #2fc4f1 0%, #0b95b8 100%);
        }

        &:nth-child(5)::before {
            background-image: linear-gradient(139deg, #4e8da0 0%, #065f75 100%);
        }
    }

}

.yearActiveBlue {
    background: linear-gradient(139deg, #94b6ff 0%, #3064d4 100%);
    color: #fff;
}

.yearActiveOrange {
    background: linear-gradient(139deg, #d8980e 0%, #cf590a 100%);
    color: #fff;
}

.yearActiveGreen {
    background: linear-gradient(139deg, #0dad23 0%, #077003 100%);
    color: #fff;
}

.yearActiveBaby {
    background: linear-gradient(139deg, #2fc4f1 0%, #0b95b8 100%);
    color: #fff;
}

.yearActiveBaby1 {
    background: linear-gradient(139deg, #4e8da0 0%, #065f75 100%);
    color: #fff;
}

.yearDefaultBlue {
    background: #fff;
    color: #3064d4;
}

.yearDefaultOrange {
    background: #fff;
    color: #cf590a;
}

.yearDefaultGreen {
    background: #fff;
    color: #077003;
}

.yearDefaultBaby {
    background: #fff;
    color: #0b95b8;
}

.yearDefaultBaby1 {
    background: #fff;
    color: #4e8da0;
}


.pdf-item {
    position: relative;

    .name {
        padding-top: 2vh;
    }

    .img {
        text-align: center;
        height: 44vh;
        overflow: auto;

        iframe {
            width: 51vw;
            height: 44vh;
            resize: none;
        }

        img {
            width: 51vw;
        }
    }
}

.dialog-title1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dialog-right {
    display: flex;
    align-items: center;
}

.dialog-titless {
    position: absolute;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 10;
}

.ghTopologyModel {
    box-shadow: 0 1px 3px 0 rgba(3, 150, 253, 0.25) !important;
    width: 30vw;
    top: 19%;
    left: 48%;
    height: 34vh;
    background: #fff;
    border: 1px solid #efefef
}

// .addWtModel {
//     box-shadow: 0 1px 3px 0 rgba(3, 150, 253, 0.25) !important;
//     width: 30vw;
//     top: 19%;
//     left: 48%;
//     height: 34vh;
//     background: #fff;
//     border: 1px solid #efefef
// }
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

.photoModel {
    box-shadow: 0 1px 3px 0 rgba(3, 150, 253, 0.25) !important;
    width: 94vw;
    top: 5vh;
    left: 3vw;
    height: 90vh;
    background: #fff;
    border: 1px solid #efefef
}

.topology-puload {
    display: flex;
    align-items: center;
    padding-bottom: 2vh;

    .topology-puload-name {
        width: 3vw;
        text-align: right;
    }

    .topology-puload-arc {
        flex: 1;
    }
}

.topology-puload-tem {
    display: flex;
    flex-direction: column;
    height: 28vh;
    position: relative
}

.topology-sure {
    position: absolute;
    right: 5px;
    bottom: 5px;
}

.upload-demoGh {
    margin-left: 0.8vw;
}

/deep/.el-tabs__content {
    overflow: inherit !important;
}

.stateStatus1 {
    color: #666;
}

.stateStatus2 {
    color: red;
}

.bigImgSize {
    width: 93vw;
}

.contextImg {
    width: 100%;
    height: 84vh;
    overflow-y: scroll;
    text-align: center;
    overflow-x: hidden;
}

.select-over {
    /deep/ .el-select__tags {
        white-space: nowrap;
        overflow: hidden;
        flex-wrap: nowrap;
        text-overflow: ellipsis;
    }

    .el-select__tags-text {
        display: inline-block;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>
