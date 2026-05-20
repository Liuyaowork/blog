刷**X**刷到一个特效，使用 AI 复刻学习。

跳转 [demo](https://suni-demos.vercel.app/electric-border)

<iframe
	src='https://suni-demos.vercel.app/electric-border'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>

Demo 中分别展示了 svg filter 的制作过程

## 简单解析

使用连续的横竖的噪波，置换本身 border 效果

```tsx
<filter	colorInterpolationFilters='sRGB'>
	<feTurbulence type='turbulence' baseFrequency={baseFrequency} numOctaves={numOctaves} result='noise1' seed={1} />
	<feOffset in='noise1' dx='0' dy='0' result='offsetNoise1'>
		<animate attributeName='dy' values={`${calculatedVerticalRange}; 0`} dur={`${animationDuration}s`} repeatCount='indefinite' calcMode='linear' />
	</feOffset>
	<feTurbulence type='turbulence' baseFrequency={baseFrequency} numOctaves={numOctaves} result='noise2' seed={1} />
	<feOffset in='noise2' dx='0' dy='0' result='offsetNoise2'>
		<animate attributeName='dy' values={`0; -${calculatedVerticalRange}`} dur={`${animationDuration}s`} repeatCount='indefinite' calcMode='linear' />
	</feOffset>

	<feTurbulence type='turbulence' baseFrequency={baseFrequency} numOctaves={numOctaves} result='noise3' seed={2} />
	<feOffset in='noise3' dx='0' dy='0' result='offsetNoise3'>
		<animate attributeName='dx' values={`${calculatedHorizontalRange}; 0`} dur={`${animationDuration}s`} repeatCount='indefinite' calcMode='linear' />
	</feOffset>
	<feTurbulence type='turbulence' baseFrequency={baseFrequency} numOctaves={numOctaves} result='noise4' seed={2} />
	<feOffset in='noise4' dx='0' dy='0' result='offsetNoise4'>
		<animate attributeName='dx' values={`0; -${calculatedHorizontalRange}`} dur={`${animationDuration}s`} repeatCount='indefinite' calcMode='linear' />
	</feOffset>

	<feComposite in='offsetNoise1' in2='offsetNoise2' result='part1' />
	<feComposite in='offsetNoise3' in2='offsetNoise4' result='part2' />
	<feBlend in='part1' in2='part2' mode={blendMode} result='combinedNoise' />
	<feDisplacementMap in='SourceGraphic' in2='combinedNoise' scale={displacementScale} xChannelSelector='R' yChannelSelector='B' />
</filter>
```

## 额外发现

**渐变border**，平时写 渐变border 的时候，通常我都是叠加一层 `div`，而这里的做法是直接 一个 css 行为搞定，这就很棒。

```css
.scrollbarGlass::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 1px;
	border-radius: inherit;
	pointer-events: none;

	background: linear-gradient(
		150deg,
		rgba(255, 255, 255, 0.48) 16.73%,
		rgba(255, 255, 255, 0.08) 30.2%,
		rgba(255, 255, 255, 0.08) 68.2%,
		rgba(255, 255, 255, 0.6) 81.89%
	);

	mask:
		linear-gradient(#fff 0 0) content-box,
		linear-gradient(#fff 0 0);
	mask-composite: xor;
	-webkit-mask-composite: xor;
}

```

这里的 `content-box` 巧妙过滤出 `border` 范围。