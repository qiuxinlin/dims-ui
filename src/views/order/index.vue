<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="就诊号" prop="visitNo">
        <el-input v-model="queryParams.visitNo" placeholder="请输入就诊号" clearable/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="createOrder">开单</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" @click="sendOutOrder" :disabled="single">发药</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" @click="sendBackOrder" :disabled="single">退药</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="就诊号" align="center" prop="visitNo"/>
      <el-table-column label="药品名称" align="center" prop="drugName"/>
      <el-table-column label="数量" align="center" prop="quantity"/>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <span v-if="scope.row.status=== 1">开单</span>
          <span v-else-if="scope.row.status=== 2">发药</span>
          <span v-else-if="scope.row.status=== 3">退药</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy"/>
      <el-table-column label="操作时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList"/>

    <el-dialog title="开单" v-model="createOrderOpen" width="500px" append-to-body>
      <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="就诊号" prop="visitNo">
          <el-input v-model="form.visitNo" placeholder="请输入就诊号"/>
        </el-form-item>
        <el-form-item label="药品名称" prop="name">
          <el-input v-model="queryDrugsParams.name" placeholder="请输入药品名称" clearable
                    @keyup.enter="queryAllDrugs"/>
        </el-form-item>
        <el-form-item label="药品简码" prop="simpleCode">
          <el-input v-model="queryDrugsParams.simpleCode" placeholder="请输入简码" clearable
                    @keyup.enter="queryAllDrugs"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="queryAllDrugs">搜索</el-button>
        </el-form-item>
        <el-form-item label="药品" prop="drugId">
          <el-select v-model="form.drugId" class="m-2" placeholder="选择药品" size="large">
            <el-option v-for="item in drugs" :key="item.id" :label="item.name" :value="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitCreateOrder">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Order">
import {create, queryDrugs, list, sendOut, sendBack} from "@/api/biz/order";

const {proxy} = getCurrentInstance();

const dataList = ref([]);
const createOrderOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const total = ref(0);
const drugs = ref([]);
const single = ref(true);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    visitNo: undefined
  },
  queryDrugsParams: {
    name: undefined,
    simpleCode: undefined
  },
  rules: {
    drugId: [{required: true, message: "药品不能为空", trigger: "blur"}],
    quantity: [{required: true, message: "数量不能为空", trigger: "blur"}],
  }
});

const {queryParams, form, rules, queryDrugsParams} = toRefs(data);

/** 查询所有药品 */
function queryAllDrugs() {
  queryDrugs(queryDrugsParams.value).then(response => {
    drugs.value = response.data;
  });
}

/** 查询列表 */
function getList() {
  loading.value = true;
  list(queryParams.value).then(response => {
    dataList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  createOrderOpen.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    drugId: undefined,
    quantity: undefined,
    visitNo: undefined
  };
  proxy.resetForm("postRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length == 0;
}

function createOrder() {
  reset();
  createOrderOpen.value = true;
}

function submitCreateOrder() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      create(form.value).then(response => {
        proxy.$modal.msgSuccess("创建成功");
        createOrderOpen.value = false;
        getList();
      });
    }
  });
}

function sendOutOrder() {
  sendOut(ids.value).then(response => {
    proxy.$modal.msgSuccess("发药成功");
    getList();
  });
}

function sendBackOrder() {
  sendBack(ids.value).then(response => {
    proxy.$modal.msgSuccess("退药成功");
    getList();
  });
}

getList();
</script>
