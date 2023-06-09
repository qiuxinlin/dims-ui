<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="药品名称" prop="name">
        <el-input v-model="queryDrugsParams.name" placeholder="请输入药品名称" clearable
                  @keyup.enter="queryAllDrugs"/>
      </el-form-item>
      <el-form-item label="药品简码" prop="simpleCode">
        <el-input v-model="queryDrugsParams.simpleCode" placeholder="请输入简码" clearable
                  @keyup.enter="queryAllDrugs"/>
      </el-form-item>
      <el-form-item label="药品" prop="drugId">
        <el-select v-model="queryParams.drugId" class="m-2" placeholder="选择药品" clearable size="large">
          <el-option v-for="item in drugs" :key="item.id" :label="item.name" :value="item.id"/>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="stockIn"
                   v-hasPermi="['system:post:add']">入库
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" @click="stockOut"
                   v-hasPermi="['system:post:edit']">出库
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column label="药品名称" align="center" prop="drugName"/>
      <el-table-column label="操作类型" align="center" prop="operationName"/>
      <el-table-column label="数量" align="center" prop="quantity"/>
      <el-table-column label="出库至" align="center" prop="outbound"/>
      <el-table-column label="操作人" align="center" prop="createBy"/>
      <el-table-column label="操作时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList"/>

    <!-- 入库 -->
    <el-dialog title="入库" v-model="stockInOpen" width="500px" append-to-body>
      <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
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
          <el-button type="primary" @click="submitStockInForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 出库 -->
    <el-dialog title="出库" v-model="stockOutOpen" width="500px" append-to-body>
      <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
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
        <el-form-item label="出库至" prop="outbound">
          <el-input v-model="form.outbound" placeholder="请输入名称"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitStockOutForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Stock">
import {list, queryDrugs, submitStockIn, submitStockOut} from "@/api/biz/stock";

const {proxy} = getCurrentInstance();

const dataList = ref([]);
const stockInOpen = ref(false);
const stockOutOpen = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const multiple = ref(true);
const total = ref(0);
const drugs = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    drugId: undefined
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
  stockInOpen.value = false;
  stockOutOpen.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    drugId: undefined,
    quantity: undefined,
    outbound: undefined
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
  multiple.value = !selection.length;
}

/** 入库 */
function stockIn() {
  reset();
  stockInOpen.value = true;
}

/** 出库 */
function stockOut() {
  reset();
  stockOutOpen.value = true;
}

/** 提交入库 */
function submitStockInForm() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      submitStockIn(form.value).then(response => {
        proxy.$modal.msgSuccess("入库成功");
        stockInOpen.value = false;
        getList();
      });
    }
  });
}

/** 提交出库 */
function submitStockOutForm() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      submitStockOut(form.value).then(response => {
        proxy.$modal.msgSuccess("出库成功");
        stockInOpen.value = false;
        getList();
      });
    }
  });
}

getList();
</script>
