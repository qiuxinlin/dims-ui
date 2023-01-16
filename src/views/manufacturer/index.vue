<template>
   <div class="app-container">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
         <el-form-item label="名称" prop="name">
            <el-input v-model="queryParams.name" placeholder="请输入生产商名称" clearable style="width: 200px"
               @keyup.enter="handleQuery" />
         </el-form-item>
         <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
         </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
         <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd"
               v-hasPermi="['system:post:add']">新增</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
               v-hasPermi="['system:post:edit']">修改</el-button>
         </el-col>
         <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
               v-hasPermi="['system:post:remove']">删除</el-button>
         </el-col>
         <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
         <el-table-column type="selection" width="55" align="center" />
         <el-table-column label="名称" align="center" prop="name" />
         <el-table-column label="地址" align="center" prop="address" />
         <el-table-column label="邮编" align="center" prop="postCode" />
         <el-table-column label="联系电话" align="center" prop="phone" />
         <el-table-column label="创建时间" align="center" prop="createTime" width="180">
            <template #default="scope">
               <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
         </el-table-column>
         <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
            <template #default="scope">
               <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:post:edit']">修改</el-button>
               <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
                  v-hasPermi="['system:post:remove']">删除</el-button>
            </template>
         </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
         v-model:limit="queryParams.pageSize" @pagination="getList" />

      <!-- 添加或修改对话框 -->
      <el-dialog :title="title" v-model="open" width="500px" append-to-body>
         <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="名称" prop="name">
               <el-input v-model="form.name" placeholder="请输入名称" />
            </el-form-item>
            <el-form-item label="地址" prop="address">
               <el-input v-model="form.address" placeholder="请输入地址" />
            </el-form-item>
            <el-form-item label="邮编" prop="postCode">
               <el-input-number v-model="form.postCode" />
            </el-form-item>
            <el-form-item label="联系电话" prop="phone">
               <el-input v-model="form.phone" placeholder="请输入联系电话" />
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

<script setup name="Manufacturer">
import { list, add, del, get, update } from "@/api/biz/manufacturer";

const { proxy } = getCurrentInstance();

const dataList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const manufacturerId = ref(0);
const options = ref([]);

const data = reactive({
   form: {},
   queryParams: {
      pageNum: 1,
      pageSize: 10,
      name: undefined
   },
   rules: {
      name: [{ required: true, message: "名称不能为空", trigger: "blur" }],
      address: [{ required: true, message: "地址不能为空", trigger: "blur" }],
   }
});

const { queryParams, form, rules } = toRefs(data);

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
   open.value = false;
   reset();
}
/** 表单重置 */
function reset() {
   form.value = {
      id: undefined,
      name: undefined,
      address: undefined,
      postCode: undefined,
      phone: undefined
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
}
/** 修改按钮操作 */
function handleUpdate(row) {
   reset();
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
   }).catch(() => { });
}

getList();
</script>
