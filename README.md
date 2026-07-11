# 嗦粉铺商家后台

Vue 3 + Vite + TypeScript + Element Plus 管理端。

当前功能：

- 工作台指标
- 订单列表、状态筛选、接单、制作、配送、完成、取消订单
- 菜品列表、新增菜品、编辑价格/库存/描述、上下架
- 门店设置页面骨架

开发环境默认通过 Vite 代理请求本地后端：`http://127.0.0.1:8080`。

## 本地运行

```sh
npm install
npm run dev
```

访问：`http://127.0.0.1:5174/`

后端需要先启动：

```sh
cd ../backend
./gradlew bootRun
```

## 构建

```sh
npm run build
```
