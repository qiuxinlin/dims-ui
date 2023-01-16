<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入药品名称" clearable style="width: 200px"
                  @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item label="简码" prop="simpleCode">
        <el-input v-model="queryParams.simpleCode" placeholder="请输入简码" clearable style="width: 200px"
                  @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd"
                   v-hasPermi="['system:post:add']">新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
                   v-hasPermi="['system:post:edit']">修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
                   v-hasPermi="['system:post:remove']">删除
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="drugList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"/>
      <el-table-column label="名称" align="center" prop="name"/>
      <el-table-column label="简码" align="center" prop="simpleCode"/>
      <el-table-column label="规格" align="center" prop="specification"/>
      <el-table-column label="生产商" align="center" prop="manufacturerName"/>
      <el-table-column label="生产日期" align="center" prop="manufactureDate">
        <template #default="scope">
          <span>{{ parseTime(scope.row.manufactureDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期至" align="center" prop="exp">
        <template #default="scope">
          <span>{{ parseTime(scope.row.exp, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品批号" align="center" prop="lot"/>
      <el-table-column label="库存" align="center" prop="stock"/>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                     v-hasPermi="['system:post:edit']">修改
          </el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                     v-hasPermi="['system:post:remove']">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList"/>

    <!-- 添加或修改对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称"/>
        </el-form-item>
        <el-form-item label="简码" prop="simpleCode">
          <el-input v-model="form.simpleCode" placeholder="请输入简码"/>
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入规格"/>
        </el-form-item>
        <el-form-item label="生产商" prop="manufacturerId">
          <el-select v-model="form.manufacturerId" class="m-2" placeholder="选择生产商" size="large">
            <el-option v-for="item in manufacturers" :key="item.id" :label="item.name" :value="item.id"/>
          </el-select>
        </el-form-item>
        <el-form-item label="生产日期" prop="manufactureDate">
          <el-date-picker v-model="form.manufactureDate" type="date" placeholder="选择日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="有效期至" prop="exp">
          <el-date-picker v-model="form.exp" type="date" placeholder="选择日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="产品批号" prop="lot">
          <el-input-number v-model="form.lot" controls-position="right" :min="0"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Drug">
import {list, add, del, get, update, getManufacturers} from "@/api/biz/drug";

const {proxy} = getCurrentInstance();

const drugList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const manufacturers = ref([]);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: undefined,
    simpleCode: undefined
  },
  rules: {
    name: [{required: true, message: "名称不能为空", trigger: "blur"}],
    simpleCode: [{required: true, message: "简码不能为空", trigger: "blur"}],
    specification: [{required: true, message: "规格不能为空", trigger: "blur"}],
    manufacturerId: [{required: true, message: "生产商不能为空", trigger: "blur"}],
    manufactureDate: [{required: true, message: "生产日期不能为空", trigger: "blur"}],
    exp: [{required: true, message: "有效期不能为空", trigger: "blur"}],
    lot: [{required: true, message: "产品批号不能为空", trigger: "blur"}],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询所有生产商 */
function getAllManufacturers() {
  getManufacturers().then(response => {
    manufacturers.value = response.data;
  });
}

/** 查询列表 */
function getList() {
  loading.value = true;
  list(queryParams.value).then(response => {
    drugList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    name: undefined,
    simpleCode: undefined,
    specification: undefined,
    manufacturerId: undefined,
    manufactureDate: undefined,
    exp: undefined,
    lot: undefined
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
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加";
  getAllManufacturers();
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  getAllManufacturers();
  const id = row.id || ids.value;
  get(id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        update(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        add(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  let deleteIds;
  if (row.id != undefined) {
    deleteIds = [row.id];
  } else {
    deleteIds = ids.value;
  }
  proxy.$modal.confirm('是否确认删除编号为"' + deleteIds + '"的数据项？').then(function () {
    del(deleteIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
  });
}

getList();
</script>
