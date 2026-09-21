<template>
    <div class="scene-question whiteTheme">
        <div class="table-toolbar">
            <div class="toolbar-tabs">
                <el-input v-model.trim="kscj" placeholder="输入场景名称" prefix-icon="el-icon-search"
                    size="small" style="width:220px;" clearable />
                <el-button type="primary" size="small" icon="el-icon-search" @click="searchCj">搜索</el-button>
            </div>
            <div class="toolbar-tabs">
                <el-button type="primary" size="small" icon="el-icon-add" @click="addDesc">新增场景</el-button>
            </div>
        </div>
        <el-table :data="questionList" border stripe size="small" style="width:100%" height="69vh">
            <el-table-column type="index" label="序号" width="60">
                <template #default="{ $index }">{{ (pageNo - 1) * pageSize + $index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="desp" label="场景描述" show-overflow-tooltip />
<!--            <el-table-column label="考试状态" width="140" align="center">-->
<!--                <template slot-scope="scope">-->
<!--                    <span v-if="scope.row.status == 3" class="status-tag status-done">已评分</span>-->
<!--                    <span v-else-if="scope.row.status == 1" class="status-tag status-doing">进行中</span>-->
<!--                    <span v-else-if="scope.row.status == 2" class="status-tag status-doing">待评分</span>-->
<!--                    <span v-else class="status-tag">未开始</span>-->
<!--                </template>-->
<!--            </el-table-column>-->
            <el-table-column label="启动状态" width="140" align="center">
                <template slot-scope="scope">
                    <span v-if="scope.row.releaseStatus == 1" class="status-tag status-done">已启动</span>
                    <span v-else class="status-tag status-doing">未启动</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="520" align="center">
                <template slot-scope="scope">
                    <el-tag color="#ff9800" size="small" @click.stop="openMap(scope.row)">试题</el-tag>
                    <el-tag color="#1890ff" size="small" @click.stop="openTp(scope.row)">拓扑图</el-tag>
                    <el-upload
                        class="scene-upload"
                        action=""
                        :show-file-list="false"
                        accept=".zip,.rar,.7z"
                        :disabled="uploadingId === scope.row.id"
                        :before-upload="beforeUploadKscj"
                        :http-request="(item) => uploadKscjArchive(item, scope.row)"
                    >
                        <el-tag color="#8e44ad" size="small">{{ uploadingId === scope.row.id ? '上传中' : '上传资料包' }}</el-tag>
                    </el-upload>
                    <el-tag color="#409EFF" size="small" @click.stop="downloadKscjArchive(scope.row)">{{ downloadingId === scope.row.id ? '下载中' : '下载资料包' }}</el-tag>
                    <el-tag color="#7da3f5" size="small" @click.stop="editCj(scope.row)">修改</el-tag>
                    <el-tag color="#16a085" size="small" @click.stop="releaseKsCj(scope.row)">启用</el-tag>
                    <el-tag color="#ff857c" size="small" @click.stop="delCj(scope.row)">删除</el-tag>
                    <!-- <el-tag v-if="scope.row.status > 1" color="#ff9800" size="small"
                        @click.stop="openKs(scope.row)">阅卷打分</el-tag> -->
                    <!-- <el-tag color="#ff857c" size="small" @click.stop="delStudent(scope.row)">删除</el-tag> -->
                </template>
            </el-table-column>
        </el-table>
        <!-- 绘制地理网架 -->
        <div id="examMap" v-show="showMap" v-append-to-body>
          <Popup class="huituTk" v-if="mapSize == 'max'">
            <template slot="content">
              <h1 class="title">绘图组件</h1>
              <tpModel regionId="" yxdwId="" :activeRow="activeRow" :scene-description="activeRow.desp || ''" @close="showMap = false;mapSize='min'"></tpModel>
            </template>
          </Popup>
          <mouseClick ref="mouse_click" :sgdps="sgdps" v-if="mapLoad"></mouseClick>
        </div>

        <!-- 分页 -->
        <div class="table-pagination">
            <el-pagination background layout="prev,pager,next,jumper,total" :total="total" :page-size="pageSize"
                :current-page.sync="pageNo" small @current-change="onPaperPageChange" />
        </div>

        <el-dialog
            title="选择考试批次"
            :visible.sync="releaseVisible"
            width="420px"
            append-to-body
        >
            <el-form label-width="90px" size="small">
                <el-form-item label="考试批次" required>
                    <el-select v-model="releasePcId" placeholder="请选择考试批次" filterable style="width:100%"
                               :loading="batchLoading">
                        <el-option v-for="item in batchOptions" :key="item.value" :label="item.label"
                                   :value="item.value" />
                    </el-select>
                </el-form-item>
            </el-form>
            <span slot="footer">
                <el-button size="small" @click="releaseVisible = false">取消</el-button>
                <el-button type="primary" size="small" :loading="releasing" @click="confirmRelease">确定启动</el-button>
            </span>
        </el-dialog>
        <leftPopup class="addModel" v-if="descModel" style="height: 45vh;">
            <template slot="content">
                <h1 class="title">
                    <span class="close" @click="descModel = false"></span>新增场景
                </h1>
                <div class="context">
                    <el-form ref="ywForm" label-width="130px" label-position="right" label-suffix="：" style="width: 90%;">
                        <el-form-item label="场景描述">
                            <el-input type="textarea" v-model="desc" placeholder="请输入场景描述" :rows="10"></el-input>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="bottom">
                    <p class="btn1 save" @click="confimDesc">确定</p>
                    <p class="btn1" @click="descModel = false">取消</p>
                </div>
            </template>
        </leftPopup>
      <leftPopup class="draw-tp" v-if="drawTp">
        <template slot="content">
          <h1 class="title">
            <span class="close" @click="drawTp = false"></span>拓扑图
          </h1>
          <div class="context">
            <DrawTp style="width: 100%;" ref="topology" :mode="'出题'" :rowCjId="cjId" />
          </div>
        </template>
      </leftPopup>
    </div>
</template>
<script>
import leftPopup from "@/components/ghsjPanel/dragPopup/index.vue"
import { saveOrUpdateKscj, listKscj, removeKscj, releaseCj, getExamBatchOptions, uploadKscjFile, downloadKscjFile } from '@/api/pwgh/examCbPsk'
import Popup from '@/components/ghsjPanel/components/wjghModel/popup.vue'
import tpModel from "../wj/drawTp.vue";
import mouseClick from '@/platformComponents/mouseClick/index.vue'
import DrawTp from "./drawTp.vue";

export default {
    name: 'SceneQuestion',
    components: { leftPopup, Popup, tpModel, mouseClick, DrawTp },
    directives: {
        'append-to-body': {
        inserted(el, binding) {
            if(binding.value !== false) {
            document.body.appendChild(el)
            }
        },
        unbind(el) {
            if(el.parentNode === document.body) {
            document.body.removeChild(el)
            }
        },
        }
    },
    data() {
        return {
            cjId: '',
            drawTp: false,
            dialogId: undefined,
            kscj: '',
            desc: '',
            descModel: false,
            questionList: [],
            pageNo: 1,
            pageSize: 20,
            total: 0,
            paperPage: 0,
            mapSize: 'min',
            showMap: false,
            activeRow: {},
            map: null,
            sgdps: null,
            mapLoad: false,
            batchOptions: [],
            batchLoading: false,
            releaseVisible: false,
            releasePcId: '',
            releaseRow: null,
            releasing: false,
            uploadingId: '',
            downloadingId: ''
        }
    },
    created() {
        this.getList();
        this.loadBatchOptions();
    },
    methods: {
        openTp(row) {
          this.cjId = row.id;
          this.drawTp = true;
        },
        searchCj() {
            this.pageNo = 1;
            this.getList();
        },
        confimDesc() {
            if (!this.desc) {
                this.$message.error('请输入描述');
                return;
            }
            saveOrUpdateKscj({
                desp: this.desc,
                id: this.dialogId
            }).then(res => {
                if (res.success) {
                    this.$message.success(`${this.dialogId ? '保存' : '新增'}成功`);
                    this.descModel = false;
                    this.pageNo = 1;
                    this.getList();
                } else {
                    this.$message.error(res.msg);
                }
            });
        },
        getList() {
            listKscj({
                pageNo: this.pageNo,
                pageSize: this.pageSize,
                kscj: this.kscj
            }).then(res => {
                this.questionList = res.data && res.data.records || [];
                this.total = Number(res.data && res.data.total) || 0;
            })
        },
        addDesc() {
            this.descModel = true;
            this.desc = '';
            this.dialogId = undefined;
        },
        beforeUploadKscj(file) {
            const name = (file && file.name || '').toLowerCase();
            if (!/\.(zip|rar|7z)$/.test(name)) {
                this.$message.error('请上传 zip / rar / 7z 压缩包');
                return false;
            }
            return true;
        },
        uploadKscjArchive(item, row) {
            const file = item && item.file;
            const cjId = row && row.id;
            if (!file) {
                this.$message.error('请选择资料包');
                return;
            }
            if (!cjId) {
                this.$message.error('未找到对应场景');
                return;
            }
            this.uploadingId = cjId;
            uploadKscjFile({ file, cjId }).then(res => {
                if (res && res.success) {
                    this.$message.success(res.msg || '资料包上传成功');
                    this.getList();
                } else {
                    this.$message.error((res && res.msg) || '上传失败');
                }
            }).catch(error => {
                this.$message.error((error && error.message) || '上传失败');
            }).finally(() => {
                this.uploadingId = '';
            });
        },
        downloadKscjArchive(row) {
            const cjId = row && row.id;
            if (!cjId) {
                this.$message.error('未找到对应场景');
                return;
            }
            this.downloadingId = cjId;
            downloadKscjFile({ cjId }).then(res => {
                if (res && res.success === false) {
                    this.$message.error(res.msg || '下载失败');
                    return;
                }
                const data = res && res.msg;
                const url = typeof data === 'string'
                    ? data
                    : (data && (data.url || data.fileUrl || data.path || data.filePath)) || '';
                if (!url) {
                    this.$message.error((res && res.msg) || '暂无资料包');
                    return;
                }
                window.open(url);
            }).catch(error => {
                this.$message.error((error && error.message) || '下载失败');
            }).finally(() => {
                this.downloadingId = '';
            });
        },
        editCj(row) {
            this.dialogId = row.id;
            this.descModel = true;
            this.desc = row.desp;
        },
        delCj(row) {
            this.$confirm(`请问是否确定删除，删除后不可恢复？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                removeKscj({
                    cjId: row.id
                }).then(res => {
                    if (res.success) {
                        this.$message.success('删除成功');
                        this.getList();
                    } else {
                        this.$message.error(res.msg);
                    }
                })
            })
        },
        loadBatchOptions() {
            this.batchLoading = true;
            getExamBatchOptions().then(list => {
                this.batchOptions = list || [];
            }).catch(error => {
                this.batchOptions = [];
                this.$message.error((error && error.message) || '考试批次加载失败');
            }).finally(() => {
                this.batchLoading = false;
            });
        },
        releaseKsCj(row) {
            this.releaseRow = row;
            this.releasePcId = '';
            this.releaseVisible = true;
            if (!this.batchOptions.length) this.loadBatchOptions();
        },
        confirmRelease() {
            if (!this.releasePcId) {
                this.$message.warning('请选择考试批次');
                return;
            }
            if (!this.releaseRow || !this.releaseRow.id) {
                this.$message.warning('未找到要启动的场景');
                return;
            }
            this.releasing = true;
            releaseCj({
                cjId: this.releaseRow.id,
                pcId: this.releasePcId
            }).then(res => {
                if (res.success) {
                    this.$message.success('启动成功,请前往考试管理查看!');
                    this.releaseVisible = false;
                    this.getList();
                } else {
                    this.$message.error(res.msg);
                }
            }).catch(error => {
                this.$message.error((error && error.message) || '启动失败');
            }).finally(() => {
                this.releasing = false;
            });
        },
        onPaperPageChange(page) {
            this.pageNo = page;
            this.getList();
        },
        openMap(row) {
            this.drawLoading = this.$loading({
                lock: true,
                text: "加载中...",
                spinner: "el-icon-loading",
                background: "rgba(0, 0, 0, 0.3)",
                target: document.querySelector('#app')
            })
            this.initMap(row)
        },
        initMap(row) {
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
                    // publicKey: PublicKey,//一张图publickey
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
                    window.psrmap.filterByVoltage(['10000', '400', '35000', '110000', '220000', '20000', '0', '-1'], {
                        mode: 'only',
                        visiable: JSON.parse('false')
                    });
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
                // //添加安徽边界
                // sgdps2.addCityBorder('安徽省', {
                //     "line-width": 2,
                //     "line-color": "#2c4f74",
                //     "line-opacity": 1,
                //     "line-gap-width": 1
                // });
                // // 添加区划边框线，地市和县区边框线
                // sgdps2.addQhBk({
                //     ds: {
                //     minZoom: 0,
                //     maxZoom: 9,
                //     line: {
                //         //设置边框线的颜色、透明度、宽度
                //         color: '#370b9e',
                //         opacity: 0.5,
                //         width: 1,
                //     },
                //     text: {
                //         //设置文字的颜色和大小
                //         color: 'rgba(55,11,158,0.5)',
                //         size: 12,
                //     },
                //     },
                //     xq: {
                //     minZoom: 9,
                //     maxZoom: 24,
                //     line: {
                //         color: 'rgba(55,11,158,0.5)',
                //         opacity: 0.5,
                //         width: 1,
                //     },
                //     text: {
                //         color: 'rgba(55,11,158,0.5)',
                //         size: 12,
                //     },
                //     },
                // }) //添加地市县区边框线
                })
                this.sgdps = window.sgdps2
                this.mapLoad = true
                this.drawLoading && this.drawLoading.close()
                this.activeRow = { id: row.id, desp: row.desp || '' }
                this.showMap = true
                this.mapSize = 'max'
                setTimeout(() => {
                    sgdps2.map.resize();
                }, 100);
            })
        },
    }
}
</script>

<style scoped lang="less">
@import '../../../style/index.less';
.draw-tp {
  width: 100%;
  height: calc(100vh - 55px);
  left: 0;
  top: 55px;
}
.addModel {
    width: 65vw;
    top: 25vh;
    left: 18vw;

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

.scene-question {
    width: 100%;
    height: 100%;
}
#examMap {
  height: 100%;
  width: 100%;
  position: fixed;
  overflow: hidden;
  top: 55px;
  z-index: 1000;

  .map-close-btn {
    margin-left: auto;
    font-size: 13px;
    z-index: 1000;
    position: absolute;
    right: 20px;
    top: 10px;
  }
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

.el-tag {
    color: #fff !important;
}

.scene-upload {
    display: inline-block;
    margin: 0 5px;

    /deep/ .el-upload {
        display: inline-block;
        line-height: 1;
    }
}
</style>
