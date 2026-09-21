<template>
  <div>
    <!--负荷计算-->
    <leftPopup class="fh-dialog">
      <template slot="content">
        <h1 class="title">
          <span class="close" @click="close()"></span>{{ sbData.dkxName.split('-')[0] }}
        </h1>
        <div class="message">
          <div>
            <p>负荷时间： </p>{{ sbData.time[0] + ' 至 ' + sbData.time[1] }}
          </div>
          <div>
            <p>最大负荷： </p>{{ fhMax }}(kW)
          </div>
          <!-- <div>
            <p>B相电流最大负荷： </p>{{ bfhMax }}(MW)
          </div>
          <div>
            <p>C相电流最大负荷： </p>{{ cfhMax }}(MW)
          </div> -->
        </div>
        <div class="context">
          <Charts id="sbll-fhqx-pb" :options="opts"/>
        </div>
      </template>
    </leftPopup>
  </div>
</template>

<script>
import leftPopup from "@/components/ghsjPanel/dragPopup/index.vue";
import { getFenduanPbLineChart } from '@/api/pwgh/xuanCheng'
import Charts from '@/components/ghsjPanel/charts/index.vue'
import {fhxAxis, initPbfh} from '@/components/pwqjModules/popover/ywjxPbInfoPop/component/js/fhqx'

export default {
  components: { leftPopup, Charts },
  props: ['vm', 'sbData'],
  data() {
    return {
      opts: {},
      afhMax: '',
      bfhMax: '',
      cfhMax: '',
      fhMax: ''
    }
  },
  computed: {
    
  },
  mounted() {
    this.initData()
  },
  methods: {
    close() {
      document.body.removeChild(this.vm.$el)
    },
    initData() {
      console.log(this.sbData.time);
      
      this.getQxData(this.sbData.dkxId)
    },
    getQxData (dkxId) {
      let params = {
        dkxId: dkxId,
        endTime: this.sbData.time[1] + ' 23:59:59',
        fenduanId: this.sbData.fenduanId,
        startTime: this.sbData.time[0] + ' 00:00:00'
      }
      getFenduanPbLineChart(params).then((res) => {
        if(res.success && Object.keys(res.data).length > 0) {
          let xAxisData = fhxAxis
          let axDl = [] //A相电流  A_phsA
          let bxDl = [] //B相电流  A_phsB
          let cxDl = [] //C相电流  A_phsC
          let axDy = [] //A相电压  PhV_phsA
          let bxDy = [] //B相电压  PhV_phsB
          let cxDy = [] //C相电压  PhV_phsC
          let PData = [] //有功功率  TotW
          let QData = [] //无功功率  TotVar
          
          axDl = res.data['A_phsA'].map(item => Number(item.measValue))
          bxDl = res.data['A_phsB'].map(item => Number(item.measValue))
          cxDl = res.data['A_phsC'].map(item => Number(item.measValue))
          axDy = res.data['PhV_phsA'].map(item => Number(item.measValue))
          bxDy = res.data['PhV_phsB'].map(item => Number(item.measValue))
          cxDy = res.data['PhV_phsC'].map(item => Number(item.measValue))
          PData = res.data['TotW'].map(item => Number(item.measValue))
          QData = res.data['TotVar'].map(item => Number(item.measValue))

          this.afhMax = Math.max(...axDl).toFixed(2)
          this.bfhMax = Math.max(...bxDl).toFixed(2)
          this.cfhMax = Math.max(...cxDl).toFixed(2)
          this.fhMax = Math.max(...PData).toFixed(2)

          let options = {
            xAxisData: xAxisData,
            axDl: axDl,
            bxDl: bxDl,
            cxDl: cxDl,
            axDy: axDy,
            bxDy: bxDy,
            cxDy: cxDy,
            Yg: PData,
            Wg: QData,
            connectNulls: true
          }
          this.opts = initPbfh(options)
        }
      })
    }
  },
  destroyed() {

  }
}
</script>

<style scoped lang="less">
.fh-dialog {
  width: 40vw;
  top: 25vh;
  left: 55vw;
  height: 52vh;
  .message {
    display: flex;
    padding: 10px 20px 10px;
    line-height: 24px;
    justify-content: space-around;
    flex-wrap: wrap;
    > div {
      display: flex;
      width: 50%;
    }
    p {
      font-weight: 600;
    }
    /deep/ .el-input__inner {
      height: 24px;
      line-height: 24px;
      border: 1px solid #d9d9d9;
      border-radius: 0;
      color: #666;
      background: #fff;
      width: 250px;
    }
    /deep/ .el-range__icon {
      display: none;
    }
    /deep/ .el-range-editor.el-input__inner {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
    }
    /deep/.datemax.el-date-editor {
      .el-input__icon {
        line-height: 18px;
      }
      .el-range-separator {
        line-height: 18px;
      }
    }
  }
  .context {
    height: 39vh;
  }
}
.cartItemContainTheme .title {
  height: fit-content!important;
}
</style>