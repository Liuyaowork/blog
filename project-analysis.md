# 项目分析报告

## 开发语言
- **TypeScript**：通过 `tsconfig.json` 和 `typescript` 依赖确认。
- **JavaScript**：支持 `allowJs`，并在部分脚本中使用。
- **CSS**：通过 `tailwindcss` 和 `postcss` 相关配置确认。
- **HTML**：通过 `React` 和 `Next.js` 的模板渲染确认。

## 前后端
- **前端**：
  - 使用 `React` 和 `Next.js` 框架。
  - 集成了 `TailwindCSS` 用于样式设计。
  - 依赖如 `zustand` 和 `swr` 提供状态管理和数据请求功能。
- **后端**：
  - 使用 `Next.js` 的 API 路由功能。
  - 部署到 Cloudflare Workers，通过 `@opennextjs/cloudflare` 和 `wrangler` 进行配置和管理。

## 数据库
- 当前未发现显式的数据库依赖，可能使用文件（如 JSON）或外部 API 作为数据源。

## 文件工作树
```
global.d.ts
LICENSE
next.config.ts
open-next.config.ts
package.json
pnpm-lock.yaml
postcss.config.mjs
README.md
tsconfig.json
wrangler.toml
public/
	manifest.json
	blogs/
		...
	images/
		...
	live2d/
		...
	music/
scripts/
	gen-svgs-index.js
src/
	consts.ts
	app/
		...
	components/
		...
	config/
	hooks/
	layout/
	lib/
	styles/
	svgs/
```