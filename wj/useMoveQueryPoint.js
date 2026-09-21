

var that // this指向暂存
export default class QueryPointOnMove {
  width = 10 // 缓冲区宽度基数
  height = 10 // 缓冲区高度基数
  layers = [] // 要查询的图层id列表
  map = null // 地图实例
  filterLayerKeyword = '' // 默认过滤网架关键字
  feature = null // 选中要素点
  lastFeature = null // 上次选中的要素点 注意：只有取到新的要素点才会覆盖
  geometryUtil = null // 地图几何计算工具
  circlePaint={
    "circle-radius": 10,
    "circle-color": "#fff",
    "circle-stroke-color": "#4aabf7",
    "circle-stroke-width": 5,
  } // 点要素默认样式
  linePaint={
    "line-color":"#8a00b7",
    "line-width":4
  } // 线要素默认样式
  /**
   * @param {Object} prop 基本配置
   * @constructor 鼠标移动到指定图层时添加标注
   */
  constructor(prop) {
    that = this
    this.map = prop.map
    this.geometryUtil = new SGMap.GeometryUtil();
    if (prop && typeof prop === 'object') {
      const { width, height, layers, filterLayerKeyword, circlePaint, linePaint } = prop
      if (width && typeof width === 'number') this.width = width
      if (height && typeof height === 'number') this.height = height
      if (filterLayerKeyword) this.filterLayerKeyword = filterLayerKeyword
      if (Array.isArray(layers) && layers.length > 0) this.layers = layers
      if (circlePaint && typeof circlePaint === 'object') this.circlePaint = circlePaint
      if (linePaint && typeof linePaint === 'object') this.linePaint = linePaint
    }
    this.moving()
  }

  moving() {
    this.map.off('mousemove', this.onMouseMoveEvent).on('mousemove', this.onMouseMoveEvent)
  }
  onMouseMoveEvent({ point }){
    const layers = that.layers.length > 0 ? that.layers : []
    const features = that.map.queryRenderedFeatures([
      [point.x - that.width / 2, point.y - that.height / 2],
      [point.x + that.width / 2, point.y + that.height / 2]
    ], { layers });
    if (features && features.length > 0) {
      const feature = features.find(f => layers.includes(f.layer.id))
      if(!feature) {
        console.error('要素图层过滤失败！', {features, layers});
        return
      }
      if(that.map.getLayer("dwwj_hcq_demo")) {
        return
      }
      const type = feature.geometry.type.toLocaleLowerCase()
      const layerType = type === 'point' ? 'circle' : 'line'
      that.addLayer(feature, layerType)
      // if(type === 'point') that.addLayer(feature)
      // if(type === 'multilinestring') that.addMultiLine(feature)
      // if(type === 'linestring') that.addLine(feature)
      
    } else {
      that.removeLayer()
    }
    if(this.lastFeature) this.calcDistance(point)
  }
  calcDistance(point){
    console.log(this.lastFeature, point, 'calc');
  }
  /**
   * 添加已捕获的要素图层
   * @param {Object} feature 要素实例 
   * @param {String} type // 图层类型
   */
  addLayer(feature, type='circle') {
    const paint = type === 'circle' ? this.circlePaint : this.linePaint
    if (!this.map.getLayer("dwwj_hcq_demo")) {
      this.feature = feature
      this.lastFeature = feature
      this.map.addLayer({
        id: "dwwj_hcq_demo",
        type,
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: feature.geometry,
              },
            ],
          },
        },
        paint,
      });
    }
  }

  removeLayer() {
    if (this.map.getLayer("dwwj_hcq_demo")) {
      // 先移除图层，再移除数据源
      this.map.removeLayer("dwwj_hcq_demo");
      this.map.removeSource("dwwj_hcq_demo");
    }
    this.feature = null
  }

  destroy() {
    this.removeLayer()
    this.map.off('mousemove', this.onMouseMoveEvent)
  }
}