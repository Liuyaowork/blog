浏览器中的 3d 作品，好看的有许多。有完整平台化，规模大的，我觉得不错的是 Spline，色彩效果多样，总体很舒服。

## 研究

Spline 的材质用了多层的效果，材质一般设置了两层，一层 color，一层 lighting，采用 overlay 方式。

但是 Threejs 本身不能实现多层材质。通过寻找，找到了一个叫 lamina 的 sdk，但是已经多年不维护了，使用体验和效果都不好。

然后，就希望自己通过学习它的方案尝试这种多层效果，或者只实现两层叠加的效果。多番尝试下，还是不行。

## 接近

无法通过以它的方案实现它的效果，那就以结果为导向，尝试弄出与他类似的风格。

然后得出差不多的方案是 emissive + postprocessing

```tsx
<mesh geometry={tri.geometry} castShadow receiveShadow>
	<meshStandardMaterial color='#889FC6' emissive='#889FC6' emissiveIntensity={0.75} />
</mesh>

<ambientLight intensity={0.75} color='#ccc' />
<directionalLight position={initialPosition} intensity={1.4} color='#fff' castShadow />

<EffectComposer>
	<HueSaturation saturation={0} opacity={1} blendFunction={BlendFunction.OVERLAY} />
	<BrightnessContrast brightness={-0.01} contrast={0.1} />
</EffectComposer>
```
这样的效果能够接近，但是色彩效果还是差不少。

但对于普通情况下的渲染，还是好很多，不会那么泛白，暗淡。


## 渲染笔记

* GizmoHelper 和 EffectComposer 同时设置会出现互斥 bug，需要设置 `renderPriority` 先后关系

* shadow 要设置 `THREE.PCFSoftShadowMap`，效果会好一点


## 物理笔记

* Rapier 物理在遇到很**薄**的物体时，碰撞会出问题。

比如薄物体之间很容易穿过，所以可以给地面设置一个有**厚度**的平面，然后物体可以设置 **ccd**

* 平面无法实现动态物理下落，建模时必须设置厚度，或者关闭物理
 
* 多个 mesh 组合的物体设置 `colliders` 为 `hull` 外壳

* 通过设置物理 `paused`，让物理逻辑延迟启动，避免快速下坠


## Demo

<iframe
	src='https://suni-3d.vercel.app/rendering-01'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>