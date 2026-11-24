# 麻明 Ming Ma · 个人网站

线上地址：<https://jeffmaing.github.io/>

整站是一块“活的仪表盘”：滚动是油门，章节是挡位，数字是滚轮里程表。
职业主线来自简历本身：辅导 → 标准 → 工具 → AI，四次换挡。

## 目录

```
src/            源文件
  index.html    页面结构与全部文案
  css/main.css  日 / 夜两套主题、排版、各区块布局
  js/           滚动、仪表盘、点阵人像、时间线、档案堆叠、方法四态
  assets/       图片、已裁剪的字体
.github/workflows/pages.yml   推送后自动构建并发布
tools/          构建、字体裁剪、图片处理脚本
dist/           构建产物（不提交，由 GitHub Actions 在云端生成）
```

## 本地预览

```bash
npm install
npm run build     # 生成 dist/
npm run serve     # 打开 http://127.0.0.1:8787/
```

## 修改内容后发布

```bash
git add -A
git commit -m "说明改了什么"
git push
```

推送后 GitHub Actions 会自动构建，通常两三分钟内上线。发布记录在仓库的 Actions 页面。

## 改文案时要注意

字体只包含页面实际用到的汉字。**新增或修改中文文案后**，要重新裁剪字体，否则新字会回退到系统字体：

```bash
python3 -m venv tools/.venv
tools/.venv/bin/pip install brotli fonttools
# 把 D-DIN 和 Noto Sans SC 的原始字体放进 tools/fonts-src/（见 tools/subset_fonts.py 里的路径）
npm run build:fonts
```

## 说明

- 首屏人像是一张真实的照片，用系统自带的人像分割抠出轮廓，再由 WebGL 逐点亮起。
- 日 / 夜切换在右上角。访客的系统外观决定默认值，手动选择会被记住。
- 没有 WebGL、关掉脚本、或系统开启“减弱动态效果”时，页面退回静态版，内容完整可读。
- 简历 PDF 默认不随网站发布。
- 第三方字体与库的许可说明会随构建输出为 `THIRD-PARTY-LICENSES.txt`。
