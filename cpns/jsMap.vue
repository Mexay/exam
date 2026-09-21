<template>
    <div id="jxtMap">
        <!-- 鼠标左右点击事件 -->
        <img class="el-icon-full-screen" src="../../../components/wgdjModel/images/全屏.png" @click.stop="mapMax('max')"
            v-show="mapSize == 'min'" />
        <img class="el-icon-minus" src="../../../components/wgdjModel/images/取消全屏.png" @click.stop="mapMax('min')"
            v-show="mapSize == 'max'" />
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
</template>
<script>
import WKT from 'terraformer-wkt-parser'
import * as layerController from '@/platformComponents/Maps/components/Map/Layer/index'
import mouseClick from '@/platformComponents/mouseClick/index.vue'
import { getAllGrids, getXlByGridId } from "@/api/pwgh/examIndex";
import common from '../../../common.js'
import { getWjByGrid } from '@/api/pwgh/examWjghNew'

export default {
    name: "tzgh",
    components: { mouseClick },
    props: {
        cjId: {
            default: '',
            type: String
        }
    },
    data() {
        return {
            common,
            lineInfo: {
                stationId: '',
                stationName: '',
                fid: '',
                name: '',
                ssds: '',
                yxdw: ''
            },
            lineList: [],
            //地图撒考题
            drawData: [],
            gridDialog: false,
            gridDetails: '',
            lineDialog: false,
            lineDetails: {},
            maxTp: false,
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
    beforeDestroy() {
        this.removeLayers('网格,选中元素,网架规划-draw-变电站')
        this.lineList.forEach((item) => {
            this.removeLayers(`网架规划-draw-点-${item.id},网架规划-draw-线-${item.id}`)
        })
        this.marker.forEach((item) => {
            item && item.remove()
        })
        this.marker = []
    },
    destroyed() {
        sgdps1.map.off('click', this.mapClick)
        window.sgdps1 = null
    },
    mounted() {
        this.drawLoading = this.$loading({
            lock: true,
            text: "加载中...",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.3)",
            target: document.querySelector('#app')
        });
        this.initMap()
    },
    methods: {
        fitFeatures(feature, isFit) {
            this.removeLayers('选中元素')
            let geom = feature.geometry
            if (geom.type == 'Polygon') {
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
                if (isFit) {
                    sgdps1.map.jumpTo({ center: common.getGeometryCenter(geom), zoom: 15 })
                }
            } else if (geom.type == 'LineString' || geom.type == 'MultiLineString') {
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
                if (isFit) {
                    sgdps1.map.jumpTo({ center: common.getGeometryCenter(geom), zoom: 17 })
                }
            } else if (geom.type == 'Point') {
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
                if (isFit) {
                    sgdps1.map.jumpTo({ center: geom.coordinates, zoom: 17 })
                }
            }
        },
        //撒考题
        drawFeatures() {
            this.removeLayers('网格')
            this.drawLoading && this.drawLoading.close()
            getAllGrids({ cjId: this.cjId }).then(res => {
                if (res.success) {
                    this.gridList = res.data
                    let data = res.data;
                    let features = [];
                    var coordinates = ''
                    data.forEach((list) => {
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
                                outline: list.no ? this.wgTypeOption.find(item => item.value == list.no).outline : 'rgba(218,112,214,1)',
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
            getXlByGridId({ versionId: this.cjId }).then(res => {
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
        getWj(year) {
            //绘制网架
            this.lineList.forEach((item) => {
                this.removeLayers(`网架规划-draw-点-${item.id},网架规划-draw-线-${item.id}`)
            })
            this.removeLayers('网架规划-draw-变电站')
            var param = {
                sswjId: this.cjId, year: year
            }
            setTimeout(() => {
                //撒点撒线
                getWjByGrid(param).then((res) => {
                    //193
                    if (res.success) {
                        if (res.data.length > 0) {
                            var drawData = res.data[0].ghWjghElementList ? res.data[0].ghWjghElementList : []
                            this.lineList.forEach((item) => {
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
                                            lineColor: '#ff4949',
                                            startType: drawData[i].startType,
                                            connection: drawData[i].connection,
                                            endType: drawData[i].endType,
                                            startPoint: drawData[i].startPoint,
                                            startMx: drawData[i].startMx,
                                            endPoint: drawData[i].endPoint,
                                            endMx: drawData[i].endMx,
                                            year: drawData[i].year,
                                            dasharray: drawData[i].type == 'jkxl' ? [2, 0] : [2, 2],
                                            dkxId: drawData[i].dkxId
                                        },
                                    })
                                    if (drawData[i].jsdzType) {
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
                                    if (['bdz10kv', 'bdz35kv', 'bdz110kv'].indexOf(drawData[i].type) != -1) {
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
                                    } else if (['gt2022'].indexOf(drawData[i].type) != -1) {
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
                                this.lineList.forEach((item) => {
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
                                                "line-width": 5,
                                                "line-opacity": 1
                                            },
                                            style: {
                                                textHaloColor: '#fff',
                                                textColor: '#7e8a9f',
                                                textHaloWidth: 1
                                            },
                                            layout: {
                                                visibility: 'visible'
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
                                                visibility: 'visible'
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
                                            visibility: 'visible'
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
        addMarker(features) {
            this.marker.forEach((item) => {
                item && item.remove()
            })
            this.marker = []
            features.forEach((item) => {
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
                        'fill-opacity': 0.8,
                        'fill-outline-color': ['get', 'outline']
                    },
                    issText: false
                },
            )
            sgdps1.map.jumpTo({ center: common.getGeometryCenter(features[0].geometry), zoom: 15 })
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
            this.gridDialog = false
            this.lineDialog = false
            var lines = []
            this.lineList.forEach((item) => {
                lines.push(`网架规划-draw-线-${item.id}`)
            })
            let features = sgdps1.map.queryRenderedFeatures(e.point, { layers: ['网格', ...lines] })
            this.removeLayers('选中元素')
            if (features && features.length > 0) {
                if (features[0].source == '网格') {
                    this.gridDetails = JSON.parse(features[0].properties.params)
                    this.gridDialog = true
                    var grid = this.gridList.find(item => item.fid == features[0].properties.id)
                    this.fitFeatures({ geometry: WKT.parse(grid.reshape) })
                } else {
                    var lineFea = sgdps1.map.getSource(`网架规划-draw-线-${features[0].properties.dkxId}`)._data
                    this.lineDetails = this.lineList.find(item => item.id == features[0].properties.dkxId)
                    this.lineDetails.grid = this.gridList.find(item => item.fid == this.lineDetails.gridId).name
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
        // 创建地图
        initMap() {
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
                    layerController.addPulsingDot(map, 'pulsing-dot-points')
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
                        "R_ExpressWay/label/name", "R_NationalRoad/label/RouteNO", "R_NationalRoad/label/name", "POI3", "POI4", "R_SecondaryRoad/Road/0", "R_SecondaryRoad/label/name",
                        "SubwayStation", "Railway/label/label", "POI5", "POI6", "POI7", "Green/label", "POI8", "POI9", "R_TownshipRoad/label/name", "R_CountyRoad/label/RouteNO",
                        "R_OrdinaryRoad/label/name", "Airport", "BuildingNO", "R_CountyRoad/label/name"
                    ]
                    hideLayer.forEach((layerId) => {
                        if (map.getLayer(layerId)) {
                            map.setLayoutProperty(layerId, "visibility", "none")
                        }
                    })
                })
                this.sgdps = window.sgdps1
                this.mapLoad = true
                setTimeout(() => {
                    this.drawFeatures()
                    sgdps1.map.resize()
                }, 100);
                sgdps1.map.on('click', this.mapClick)
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
                    width: '100%',
                    height: '100%',
                    position: 'relative',
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
        }
    }
}
</script>
<style lang="less" scoped>
#jxtMap {
    width: 45vw;
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
}
</style>
