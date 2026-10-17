# 个人 OpenGym 与健身卡册

这是 OpenGym 的非商业 fork，保留 AGPL 和所有第三方声明，原样使用上游 180px 媒体。上游基线：e348fc17c42c7e9a211c5972e573ad3698190ee2。

## 功能

- 完整 OpenGym 功能保留；增加「我的卡册」标签和个人版默认入口。
- 5,632 个内置动作默认与用户收藏同池，支持中文搜索、部位筛选、随机最多 8 项、自定义勾选和卡册跟练。原「腹部／手臂／腿部」与内置「腰腹／上臂／大腿」筛选兼容。
- 个人卡册保留多图每 2 秒轮播、可选名字／备注、自动标签、上传后预览最新照片、四角触摸裁剪、同组比例复用、按次数／时间训练、组间休息、训练恢复、历史和完整旧格式备份。
- 内置示范使用随 fork 部署的 still 和 MP4，不热链。保持上游原文件与版权声明。

## 存档与架构

卡册作为同源独立文档嵌入 React 路由。保留原 `fitness-cardbook` IndexedDB（cards/images/sessions/settings）及 `fitness-cardbook.active`。部署继续使用原 `https://chinheki.github.io/fitness-cardbook/`，同一浏览器／同一安装环境直接读取原存档，无数据库重建或清空。

桥接在设备内将收藏建立为 OpenGym 的 `folio:<原ID>` 自定义动作，并把旧历史建立为同前缀的原生训练记录。完成时间／次数、未完成状态和原记录内容保留，重复打开不增加重复项。OpenGym 原生媒体库保存首张展示图，完整多图继续留在原 IndexedDB，并可通过卡册完整备份导出。桥接错误会显示且可重试；原存储不删除。OpenGym 新建的自定义动作也进入卡册共同筛选与随机。

GitHub Pages 是静态本地模式，无登录、后台、远程同步、演示训练数据。数据、照片和备份不会上传到仓库。不同浏览器／不同设备／本地地址与线上地址是不同存储；请在原环境导出卡册 JSON，再在「我的卡册 → 设置 → 导入旧卡册（合并）」导入，现有数据保留且重复 ID 不重复添加。不要通过清理网站数据处理更新问题。

本次已将原标签页的双图草稿保存为本机收藏，并在同源整合预览确认 1 张卡片、2 张照片。跨本地／线上迁移可打开本地 `cardbook/transfer.html`，点击迁移到线上个人版；以限定来源、opener 与一次性随机标记校验，在浏览器页面间合并传递，保留两端存档，不上传数据到 GitHub。

## 构建与部署

Node 22，`npm ci --prefix frontend --registry=https://registry.npmjs.org`，`node scripts/catalogue/cardbook.mjs`，`VITE_PERSONAL=1 npm run build --prefix frontend`，`node scripts/catalogue/stage-media.mjs frontend/dist`。

源码位于 `chinheki/openGym`。这个仓库的 Actions 运行测试并构建产物。原 `chinheki/fitness-cardbook` 仓库的 Pages 工作流检出此 fork 的指定 ref（默认 main），自行构建并发布到原地址。以后可从原仓库 Actions → Publish personal OpenGym → Run workflow 更新；回滚时使用已知良好的源码 SHA。

离线缓存包括卡册文档、脚本、裁剪库和动作目录；示范媒体随浏览按需缓存。未缓存的内置示范首次需要联网，个人照片仍从 IndexedDB 读取。

## 验证

2026-10-17：完整前端 Vitest 在 UTC 下 5,064 项通过（上游日期测试包含 UTC 假设）。浏览器以旧格式 fixture 验证原照片、标签、备注、历史、进行中训练恢复；混合勾选开练；最新照片预览、四角裁剪、比例复用、无滑条、保存时自动标签；重复迁移和刷新持久化通过。真实手机跨天存储和触控手感仍需设备验证。
