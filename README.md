# 专注计时器应用

一个简洁优雅的专注计时器应用，帮助你记录和分析时间使用情况。

## 功能特点

- ⏱️ 精确计时：支持毫秒级精确计时
- 📊 数据统计：自动统计使用时长和频率
- 📝 历史记录：查看和管理所有计时记录
- 💾 本地存储：支持离线使用，数据不会丢失
- 🌐 后端同步：可选的数据同步功能
- 👤 个人信息管理：注册、登录、修改个人信息和密码

## 技术栈

### 前端
- React
- TypeScript
- Ant Design Mobile
- React Router
- LocalForage

### 后端
- Flask
- SQLAlchemy
- SQLite
- Flask-CORS

## 快速开始

### 环境要求
- Node.js >= 14
- Python >= 3.8
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <项目地址>
cd timer
```

2. 安装前端依赖
```bash
npm install
```

3. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

### 运行应用

1. 启动后端服务
```bash
cd backend
python app.py
```

2. 启动前端开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动

## 项目结构

```
timer/
├── src/                    # 前端源代码
│   ├── components/        # React 组件
│   ├── utils/            # 工具函数
│   └── styles/           # 样式文件
├── backend/              # 后端源代码
│   ├── app.py           # Flask 应用
│   └── requirements.txt  # Python 依赖
└── public/              # 静态资源
```

## 开发指南

### 前端开发
- 组件位于 `src/components`
- 全局样式在 `src/styles/global.css`
- API 请求和存储逻辑在 `src/utils`

### 后端开发
- API 端点定义在 `backend/app.py`
- 数据库模型使用 SQLAlchemy
- 支持 CORS 跨域请求

## 部署说明

1. 构建前端
```bash
npm run build
```

2. 配置后端
- 设置环境变量
- 配置数据库
- 设置 CORS 策略

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 个人信息管理

1. 点击"我的"标签页进入个人信息页面
2. 点击"编辑"按钮修改用户名和邮箱
3. 点击"修改密码"按钮更改登录密码
