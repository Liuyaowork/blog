吊链需要用关节约束，rapier 方面提供 7 个枚举类型：
1. Fixed
2. Generic，自定义
3. Prismatic，滑轨
4. Revolute，铰链
5. Rope，绳索
6. Spherical，球窝关节
7. Spring，弹簧

## Hooks

fiber 中使用 hook ,提供 6 种 hook

* Fixed Joint（固定关节）

```tsx
const joint = useFixedJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点位置
  [0, 0, 0, 1],    // bodyA 局部锚点朝向（四元数）
  [0, 0, 0],       // bodyB 局部锚点位置
  [0, 0, 0, 1]     // bodyB 局部锚点朝向
])
```

* Spherical Joint（球关节）

```tsx
const joint = useSphericalJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点
  [0, 1, 0]        // 偏移量，[0,1,0] 代表 y 向下1
])
```

* Revolute Joint（旋转关节）

```tsx
const joint = useRevoluteJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点
  [0, 0, 0],       // bodyB 局部锚点
  [0, 1, 0]        // 旋转轴（局部 Y 轴）
])
```

* Prismatic Joint（移动关节）

```tsx
const joint = usePrismaticJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点
  [0, 0, 0],       // bodyB 局部锚点
  [0, 1, 0]        // 平移轴（局部 Y 轴）
])
```
* Rope Joint（绳索关节）
```tsx
const joint = useRopeJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点
  [0, 0, 0],       // bodyB 局部锚点
  1.5              // 最大距离
])
```

* Spring Joint（弹簧关节）
```tsx
const joint = useSpringJoint(bodyA, bodyB, [
  [0, 0, 0],       // bodyA 局部锚点
  [0, 0, 0],       // bodyB 局部锚点
  restLength,   // 弹簧原长
  stiffness,      // 刚度
  damping       // 阻尼
])
```

## Demo 讲解

<iframe
	src='https://suni-3d.vercel.app/demo-09'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>

左边三个更能表现为绳子，所以顶部固定。右边三个，固定的话，会容易崩坏。

`useRopeJoint` 拉长后会产生拉力，形成紧绷效果

`useSpringJoint` 弹簧，拉长会有拉力，收紧会有推力。并产生衰减的弹性振荡

`useSphericalJoint` 没有弹性，固定限制距离。拉伸会直接异常偏移，只能相互旋转

`useRevoluteJoint` 就像一个算盘，只能直杆子上转动，但不能滑动。

`usePrismaticJoint` 只能线性滑动，也像算盘，但不能旋转。（可以尝试在demo 里面端起来“盘”）

`useFixedJoint` 完全连接成一个固态整体

