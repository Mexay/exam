<template>
  <section class="page-section exam-user-page">
    <div class="page-actions user-management-toolbar">
      <el-input size="small" v-model.trim="studentName" class="user-list-search" prefix-icon="el-icon-search" clearable
                placeholder="搜索考生姓名" @keyup.enter.native="searchStudents"></el-input>
      <el-button size="small" icon="el-icon-search" @click="searchStudents">查询</el-button>
      <div class="action-spacer"></div>
<!--      <span class="exam-time-summary">竞赛时间：{{ examTime || '暂未设置' }}</span>-->
<!--      <el-button icon="el-icon-setting" @click="timeDialogVisible = true">设置竞赛时间</el-button>-->
      <el-button size="small" icon="el-icon-lock" @click="openPwdDialog">设置密码</el-button>
      <el-button size="small" icon="el-icon-download" @click="downloadImportTemplate">下载模板</el-button>
      <el-upload action="" :show-file-list="false" accept=".xlsx" :http-request="importStudents">
        <el-button size="small" icon="el-icon-upload2">批量导入</el-button>
      </el-upload>
      <el-button size="small" type="primary" icon="el-icon-plus" @click="openStudentEditor()">新增考生</el-button>
    </div>

    <article class="surface table-surface element-table-surface">
      <el-table border stripe size="small" v-loading="loading" :data="students" class="exam-element-table" height="77vh"
                empty-text="暂无考生数据">
        <el-table-column type="index" label="序号" width="70" align="center">
          <template slot-scope="scope">{{ (pageNo - 1) * pageSize + scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="考生姓名" min-width="170" prop="userName" align="center">
        </el-table-column>
        <el-table-column label="考生账号" min-width="170" prop="userId" align="center">
        </el-table-column>
        <el-table-column label="准考证号" min-width="160" prop="zkzNum" align="center" show-overflow-tooltip>
        </el-table-column>
        <el-table-column prop="ssds" label="地市" min-width="110"></el-table-column>
        <el-table-column prop="yxdw" label="单位" min-width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="dept" label="部门" min-width="120" show-overflow-tooltip></el-table-column>
<!--        <el-table-column label="考试状态" width="110" align="center">-->
<!--          <template slot-scope="scope">-->
<!--            <span :class="['status-chip', statusMeta(scope.row.status).className]">{{-->
<!--                statusMeta(scope.row.status).label-->
<!--              }}</span>-->
<!--          </template>-->
<!--        </el-table-column>-->
<!--        <el-table-column label="得分" width="90" align="center">-->
<!--          <template slot-scope="scope">-->
<!--            <strong>{{ scope.row.score == null || scope.row.score === '' ? '-' : `${scope.row.score} 分` }}</strong>-->
<!--          </template>-->
<!--        </el-table-column>-->
        <el-table-column label="操作" width="230" align="center" header-align="center">
          <template slot-scope="scope">
            <el-button type="text" @click="openStudentEditor(scope.row)">编辑</el-button>
<!--            <el-button v-if="Number(scope.row.status) > 1" type="text" class="success-text-button"-->
<!--                       @click="setScoreDialog(scope.row)">阅卷打分-->
<!--            </el-button>-->
            <el-button type="text" class="danger-text-button" @click="removeStudent(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="total" class="element-pagination-wrap">
        <el-pagination background layout="prev, pager, next, jumper, total" small :current-page="pageNo"
                       :page-size="pageSize" :total="total"
                       :disabled="loading" @current-change="changePage"></el-pagination>
      </div>
    </article>

    <el-dialog :title="studentForm.id ? '编辑考生' : '新增考生'" :visible.sync="studentDialogVisible" width="560px" :modal="false"
               @closed="resetStudentForm">
      <el-form ref="studentForm" :model="studentForm" :rules="rules" label-width="110px">
        <el-form-item label="姓名" prop="userName">
          <el-input v-model.trim="studentForm.userName"
                    placeholder="请输入考生姓名"></el-input>
        </el-form-item>
        <el-form-item label="身份证号码" prop="idNumber">
          <el-input v-model.trim="studentForm.idNumber"
                    :disabled="Boolean(studentForm.id)" placeholder="请输入18位身份证号码"></el-input>
        </el-form-item>
        <el-form-item label="账号" prop="userId">
          <el-input v-model.trim="studentForm.userId"
                    placeholder="请输入登录账号"></el-input>
        </el-form-item>
        <el-form-item label="准考证号" prop="zkzNum">
          <el-input v-model.trim="studentForm.zkzNum"
                    placeholder="请输入准考证号"></el-input>
        </el-form-item>
        <el-form-item label="地市" prop="ssdsId">
          <el-select v-model="studentForm.ssdsId" class="full-control"
                     placeholder="请选择地市" @change="changeCity">
            <el-option v-for="item in cityOptions" :key="item.ssds_id"
                       :label="`${item.key}市`" :value="item.ssds_id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="县（分）公司" prop="yxdw">
          <el-input v-model.trim="studentForm.yxdw"
                    placeholder="请输入单位名称"></el-input>
          <!-- <el-select v-model="studentForm.yxdwId" class="full-control"
                     placeholder="请选择单位">
            <el-option v-for="item in companyOptions" :key="item.yxdw"
                       :label="item.yxdw" :value="item.yxdw_id"></el-option>
          </el-select> -->
        </el-form-item>
        <el-form-item label="部门" prop="dept">
          <el-input v-model.trim="studentForm.dept"
                    placeholder="请输入部门"></el-input>
          <!-- <el-select v-model="studentForm.dept" class="full-control"
                     placeholder="请选择部门">
            <el-option v-for="item in ['配电所', '用电所']" :key="item" :label="item"
                       :value="item"></el-option>
          </el-select> -->
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="studentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveStudent">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="设置密码" :visible.sync="pwdDialogVisible" width="420px" :modal="false" @closed="resetPwdForm">
      <el-form ref="pwdForm" :model="pwdForm" :rules="pwdRules" label-width="90px">
        <el-form-item label="初始密码" prop="password">
          <el-input v-model.trim="pwdForm.password" type="password" show-password
                    placeholder="请输入初始密码" @keyup.enter.native="savePwd"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPwd" @click="savePwd">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="设置竞赛时间" :visible.sync="timeDialogVisible" width="560px">
      <el-date-picker v-model="examTimeRange" type="datetimerange" class="full-control" range-separator="至"
                      value-format="yyyy-MM-dd HH:mm:ss" start-placeholder="开始时间"
                      end-placeholder="结束时间"></el-date-picker>
      <span slot="footer"><el-button @click="timeDialogVisible = false">取消</el-button><el-button type="primary"
                                                                                                   :loading="savingTime"
                                                                                                   @click="saveExamTime">保存</el-button></span>
    </el-dialog>

    <leftPopup class="addWtModel" v-if="dialogShow" style="width: 35vw;top: 25vh;left: 38vw;">
      <template slot="content">
        <h1 class="title">
          <span class="close" @click="dialogShow = false"></span>设置
        </h1>
        <div class="context">
          <el-table v-loading="loading" :data="exams" class="exam-element-table" empty-text="暂无符合条件的考试" border
                    stripe size="small"
                    >
            <el-table-column label="考试名称" min-width="240">
              <template slot-scope="scope">
                <div class="exam-name"><strong>{{ scope.row.name }}</strong><span>考试编号：{{ scope.row.id }}</span></div>
              </template>
            </el-table-column>
            <el-table-column label="试题类型" width="130">
              <template slot-scope="scope"><span
                  :class="['exam-type-chip', 'scene']"><i
                  :class="'el-icon-picture-outline-round'"></i>{{
                  '场景'
                }}</span></template>
            </el-table-column>
            <el-table-column label="试卷总分" width="100">
              <template slot-scope="scope">{{ scope.row.totalScore }}
                分
              </template>
            </el-table-column>
            <el-table-column label="及格分数" width="100">
              <template slot-scope="scope">{{ scope.row.passScore }}
                分
              </template>
            </el-table-column>
            <el-table-column label="考试时间" width="210">
              <template slot-scope="scope"><div>
                <div>
                  {{ scope.row.startTime }} ~
                </div>
                <div>{{ scope.row.endTime }}</div>
              </div>
              </template>
            </el-table-column>
            <el-table-column label="考试时长" width="110">
              <template slot-scope="scope">{{ scope.row.duration }}
                分钟
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" align="center" header-align="center">
              <template
                  slot-scope="scope">
                <el-button type="text" @click="openDetail(scope.row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="bottom">
        </div>
      </template>
    </leftPopup>
  </section>
</template>

<script>
import {getDishiAreaListAdd} from '@/api/pwgh/examXqkNew';
import {
  saveOrUpdateAccount, listAccount, removeAccount, downloadTemplate, importAccount
} from '@/api/pwgh/examIndex';
import {setExamTime, getExamTime, getExamPaperList, updatePwd} from '@/api/pwgh/examCbPsk';
import leftPopup from "@/components/ghsjPanel/dragPopup/index.vue";

function emptyStudent() {
  return {id: '', userName: '', idNumber: '', userId: '', zkzNum: '', ssds: '', ssdsId: '', yxdw: '', yxdwId: '', dept: ''};
}

export default {
  name: 'ExamUsers',
  components: {leftPopup},
  data() {
    const validateIdNumber = (rule, value, callback) => {
      if (this.studentForm.id && !value) {
        callback();
        return;
      }
      if (!/^\d{17}[\dXx]$/.test(value || '')) callback(new Error('请输入正确的18位身份证号码'));
      else callback();
    };
    return {
      dialogShow: false,
      dialogData: {},
      exams: [],
      studentName: '', students: [], pageNo: 1, pageSize: 20, total: 0, loading: false,
      cityOptions: [], companyOptions: [], studentDialogVisible: false, studentForm: emptyStudent(), saving: false,
      examTime: '', examTimeRange: [], timeDialogVisible: false, savingTime: false,
      pwdDialogVisible: false, savingPwd: false, pwdForm: {password: ''},
      pwdRules: {
        password: [{required: true, message: '请输入初始密码', trigger: 'blur'}]
      },
      rules: {
        userName: [{required: true, message: '请输入姓名', trigger: 'blur'}],
        idNumber: [{required: true, message: '请输入身份证号', trigger: 'blur'}],
        userId: [{required: true, message: '请输入账号', trigger: 'blur'}],
        ssdsId: [{required: true, message: '请选择地市', trigger: 'change'}],
        yxdw: [{required: true, message: '请输入单位名称', trigger: 'blur'}],
        dept: [{required: true, message: '请选择部门', trigger: 'change'}],
      }
    };
  },
  mounted() {
    this.loadCities();
    this.loadExamTime();
    this.loadStudents();
  },
  methods: {
    setScoreDialog(row) {
      this.$emit('change-student', row);
      return;
      this.dialogData = {...row};
      this.dialogShow = true;
      getExamPaperList({accountId: row.id}).then(res => {
        if (res.success) {
          this.exams = res.data || [];
        } else {
          this.$message.error(res.msg);
        }
      })
      // this.$emit('change-student', scope.row)
    },
    statusMeta(status) {
      return {
        0: {label: '未开始', className: 'pending'}, 1: {label: '进行中', className: 'running'},
        2: {label: '待评分', className: 'pending'}, 3: {label: '已评分', className: 'finished'}
      }[Number(status)] || {label: '未开始', className: 'pending'};
    },
    async loadCities() {
      try {
        const response = await getDishiAreaListAdd();
        this.cityOptions = Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        this.$message.error(error.message || '地市数据加载失败');
      }
    },
    changeCity(cityId) {
      const city = this.cityOptions.find(item => item.ssds_id === cityId);
      this.companyOptions = city && Array.isArray(city.value) ? city.value : [];
      if (!this.companyOptions.some(item => item.yxdw_id === this.studentForm.yxdwId)) this.studentForm.yxdwId = '';
    },
    searchStudents() {
      this.pageNo = 1;
      this.loadStudents();
    },
    async loadStudents() {
      this.loading = true;
      try {
        const response = await listAccount({pageNo: this.pageNo, pageSize: this.pageSize, username: this.studentName});
        if (!response.success) throw new Error(response.msg || '考生列表加载失败');
        const page = response.data || {};
        this.students = Array.isArray(page.records) ? page.records : [];
        this.total = Number(page.total) || 0;
      } catch (error) {
        this.students = [];
        this.total = 0;
        this.$message.error(error.message || '考生列表加载失败');
      } finally {
        this.loading = false;
      }
    },
    changePage(page) {
      this.pageNo = page;
      this.loadStudents();
    },
    openStudentEditor(student) {
      this.studentForm = student ? {...emptyStudent(), ...student} : emptyStudent();
      if (this.studentForm.ssdsId) this.changeCity(this.studentForm.ssdsId);
      this.studentDialogVisible = true;
    },
    resetStudentForm() {
      this.studentForm = emptyStudent();
      this.companyOptions = [];
      if (this.$refs.studentForm) this.$refs.studentForm.clearValidate();
    },
    openPwdDialog() {
      this.pwdForm = {password: ''};
      this.pwdDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.pwdForm) this.$refs.pwdForm.clearValidate();
      });
    },
    resetPwdForm() {
      this.pwdForm = {password: ''};
      if (this.$refs.pwdForm) this.$refs.pwdForm.clearValidate();
    },
    savePwd() {
      this.$refs.pwdForm.validate(async valid => {
        if (!valid) return;
        this.savingPwd = true;
        try {
          const response = await updatePwd({pwd: this.pwdForm.password});
          if (!response.success) throw new Error(response.msg || '密码设置失败');
          this.$message.success('初始密码已设置');
          this.pwdDialogVisible = false;
        } catch (error) {
          this.$message.error(error.message || '密码设置失败');
        } finally {
          this.savingPwd = false;
        }
      });
    },
    saveStudent() {
      this.$refs.studentForm.validate(async valid => {
        if (!valid) return;
        const city = this.cityOptions.find(item => item.ssds_id === this.studentForm.ssdsId) || {};
        const company = this.companyOptions.find(item => item.yxdw_id === this.studentForm.yxdwId) || {};
        const payload = {
          id: this.studentForm.id || '', 
          userName: this.studentForm.userName, 
          userId: this.studentForm.userId,
          zkzNum: this.studentForm.zkzNum || '',
          ssds: city.key || '', 
          ssdsId: this.studentForm.ssdsId, 
          yxdw: this.studentForm.yxdw,
          dept: this.studentForm.dept
        };
        if (!this.studentForm.id) payload.idNumber = this.studentForm.idNumber;
        this.saving = true;
        try {
          const response = await saveOrUpdateAccount(payload);
          if (!response.success) throw new Error(response.msg || '考生保存失败');
          this.$message.success('考生信息已保存');
          this.studentDialogVisible = false;
          await this.loadStudents();
        } catch (error) {
          this.$message.error(error.message || '考生保存失败');
        } finally {
          this.saving = false;
        }
      });
    },
    async removeStudent(student) {
      try {
        await this.$confirm(`确认删除考生“${student.userName}”吗？`, '删除考生', {type: 'warning'});
        const response = await removeAccount({ids: student.id});
        if (!response.success) throw new Error(response.msg || '删除失败');
        this.$message.success('考生已删除');
        if (this.students.length === 1 && this.pageNo > 1) this.pageNo -= 1;
        await this.loadStudents();
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') this.$message.error(error.message || '删除失败');
      }
    },
    async loadExamTime() {
      try {
        const response = await getExamTime();
        const data = response.data || {};
        if (data.startTime && data.endTime) {
          this.examTimeRange = [data.startTime, data.endTime];
          this.examTime = `${data.startTime} ~ ${data.endTime}`;
        }
      } catch (error) {
        this.$message.error(error.message || '竞赛时间加载失败');
      }
    },
    async saveExamTime() {
      if (!this.examTimeRange || this.examTimeRange.length !== 2) {
        this.$message.warning('请选择完整竞赛时间');
        return;
      }
      this.savingTime = true;
      try {
        const response = await setExamTime({startTime: this.examTimeRange[0], endTime: this.examTimeRange[1]});
        if (!response.success) throw new Error(response.msg || '竞赛时间保存失败');
        this.$message.success('竞赛时间已保存');
        this.timeDialogVisible = false;
        await this.loadExamTime();
      } catch (error) {
        this.$message.error(error.message || '竞赛时间保存失败');
      } finally {
        this.savingTime = false;
      }
    },
    async downloadImportTemplate() {
      try {
        const response = await downloadTemplate();
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.download = '考生导入模板.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        this.$message.error(error.message || '模板下载失败');
      }
    },
    async importStudents(item) {
      const form = new FormData();
      form.append('file', item.file);
      try {
        const response = await importAccount(form);
        if (!response.success) throw new Error(response.msg || '导入失败');
        this.$message.success('考生导入成功');
        this.pageNo = 1;
        await this.loadStudents();
      } catch (error) {
        this.$message.error(error.message || '导入失败');
      }
    }
  }
};
</script>
<style scoped lang="less">
@import '../../style/index.less';
</style>
