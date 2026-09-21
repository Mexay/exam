var that, timeId = new Date().getTime()
var listeners = {
  'draw.line.start':function(e) {},
  'draw.line.addPoint':function(e) {},
  'draw.line.end':function(e) {},
}
var event = {
  dispatch:function(eventKey) {
    var args = Array.prototype.slice.call(arguments, 1);
    listeners[eventKey].apply(this, args)
    return this
  },
  listener: function(eventKey, callback) {
    if(typeof eventKey === 'string' && typeof callback === 'function') {
      listeners[eventKey] = callback
    }
    return this
  }
}

export default class DrawTpLine {
  map // 地图实例
  canvasDOM // 画布元素
  features = [] // 线转折点数据
  lineLayerId = 'shier_draw_line_' + timeId // 线图层id
  listeners = listeners
  constructor(map) {
    this.map = map
    this.canvasDOM = this.map.getCanvasContainer();
    this.on = event.listener
    this.dispatch = event.dispatch
    that = this
  }

  /**
   * 开始绘制
   */
  startDraw() {
    // 将鼠标样式改为可框选状态
    this.changeCursorStyleonMove('crosshair')
    this.map.on('click', this.getCoordinateOnMapClick)
    this.map.on('dblclick', this.endDrawing)
    this.dispatch('draw.line.start', {msg:'开始绘制...'})
  }

  /**
   * 获取点击坐标点并添加点图层
   */
  getCoordinateOnMapClick(e) {
    const { lat, lng } = e.lngLat
    that.addPoint([lng, lat])
    that.dispatch('draw.line.addPoint', {currentPoint:[lng, lat]})
  }

  /**
   * 结束绘制
   */
  endDrawing() {
    // 将鼠标样式改为抓手
    that.changeCursorStyleonMove()
    // 销毁监听
    that.map.off('click', that.getCoordinateOnMapClick)
    that.map.off('dblclick', that.endDrawing)
    that.map.off('mousemove', that.addAnimateDashline)
    // 清除点和虚线图层
    that.clear()
    // 显示最终绘制的线图层
    console.log('that.features', that.features);
    
    if(that.features.length > 1) {
      const coordinates = that.features.map(item => item.geometry.coordinates)
      that.addLine(coordinates, that.lineLayerId, false)
    }
    setTimeout(()=>{
      const sourceObj = that.map.getSource(that.lineLayerId)
      if(!sourceObj) return
      that.dispatch('draw.line.end', sourceObj._data)
    },500)
  }

  /**
   * 清除画布
   */
  clear(){
    this.removeLayer('shier_draw_point')
    this.removeLayer('animation_dash_line')
    this.removeLayer('dashline_between_points')
    this.removeLayer(this.lineLayerId)
  }

  /**
   * 删除实例
   */
  remove() {
    this.endDrawing()
    this.clear()
    this.features = [] // 清除数据 避免二次绘制时造成脏数据
  }

  /**
   * 鼠标在地图移动时更改鼠标样式
   * @param {String} cursorStyle 
   */
  changeCursorStyleonMove(cursorStyle = 'grab') {
    this.map.on('mousemove', () => {
      this.canvasDOM.style.cursor = cursorStyle
    })
  }
  /**
   * 添加点图层
   * @param {Array<Number>} coordinates 经纬度坐标 [lat,lng]
   */
  addPoint(coordinates = []) {
    this.features.push({
      type: "Feature",
      geometry: {
        type: 'Point',
        coordinates
      },
      properties: {
      }
    })
    if (!this.map.getLayer("shier_draw_point")) {
      this.map.addLayer({
        id: "shier_draw_point",
        type: "circle",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates,
                },
              },
            ],
          },
        },
        paint: {
          "circle-radius": 6,
          "circle-color": "#4aabf7",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 3,
        },
      });
    }
    // 设置图层数据
    this.map.getSource('shier_draw_point').setData({
      type: "FeatureCollection",
      features: this.features
    });
    this.map.off('mousemove', this.addAnimateDashline).on('mousemove', this.addAnimateDashline)
    // 将已确定的点连起来
    if(this.features.length > 1) {
      const coordinates = this.features.map(item => item.geometry.coordinates)
      this.addLine(coordinates, 'dashline_between_points', true)
    }
  }

  /**
   * 添加起点后 鼠标移动事件中添加连线动画
   */
  addAnimateDashline(e){
    if (that.features.length > 0) {
      const lastFeature = that.features[that.features.length - 1]
      const startCoordinates = lastFeature.geometry.coordinates
      const { lng, lat } = e.lngLat
      const coordinates = [startCoordinates, [lng, lat]]
      that.addLine(coordinates, 'animation_dash_line', true)
    }
  }

  /**
   * 
   * @param {Array<Array<Number>>} coordinates 线的坐标数据
   * @param {String} lineLayerId 线图层id
   * @param {Boolean} isDash 是否是虚线图层
   */
  addLine(coordinates = [], lineLayerId, isDash=false) {
    if (!this.map.getLayer(lineLayerId)) {
      const option = {
        id: lineLayerId,
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates //两层数组
                },
                properties:{
                  id:lineLayerId
                }
              }
            ]
          }
        },
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          'line-dasharray': [1, 3],
          'line-color': '#4aabf7',
          'line-width': 3
        }
      }
      if(isDash) option.paint['line-dasharray'] = [3, 3] // 控制虚线的密度
      this.map.addLayer(option)
    }
    // 设置图层数据
    this.map.getSource(lineLayerId).setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates //两层数组
          }
        }
      ]
    });
  }

  /**
   * 移除图层
   * @param {String} layerId 移除图层的id
   */
  removeLayer(layerId) {
    if (this.map.getLayer(layerId)) {
      // 先移除图层，再移除数据源
      this.map.removeLayer(layerId);
      this.map.removeSource(layerId);
    }
  }

}