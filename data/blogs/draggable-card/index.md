middlefun 网站的吊牌效果，后续找到来自于 vercel 2024 ship 的网站效果。

> sdk 包含：fiber,drei,rapier

首先尝试制作拖拽效果，逻辑核心为 RigidBody 的状态切换，普通状态维持自然的下落物理效果（`RigidBodyType.Dynamic`），在点击拖拽时使用 `RigidBodyType.KinematicPositionBased`，并进行 `setNextKinematicTranslation` 移动。

## 解释

RigidBodyType 有 4 个状态：

* **Dynamic**

标准的、完全由物理模拟控制的刚体

* Fixed

完全静止、不可移动的物体。物理引擎认为它的质量是无穷大的。

* **KinematicPositionBased**（基于位置的运动学）

由用户手动控制位置的物体，但它在物理世界中拥有“无限质量”的碰撞响应能力。

* KinematicVelocityBased（基于速度的运动学）

另一种运动学模式，通过设置速度来控制运动。

## 移动监听

我这里直接监听物体上的 `pointermove` 事件，防止鼠标意外移出物体，绑定了事件传递 `setPointerCapture`。

让后开始移动时，建立当前相机角度的交互平面，在后续移动中，确认改移动的位置。

```tsx
camera.getWorldDirection(camNormal)
plane.setFromNormalAndCoplanarPoint(camNormal, e.point)
...

// 移动时
e.ray.intersectPlane(plane, _hit) // 存入当前交互点

// 减去抓取刚体中心偏移
const desired = drag._desired.copy(_hit).sub(grabOffset)
rb.setNextKinematicTranslation({ x: desired.x, y: desired.y, z: desired.z })

```

## Demo 演示

<iframe
	src='https://suni-3d.vercel.app/demo-05'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>

## 惯性

`KinematicPositionBased` 切换回 `Dynamic` 会自动保留物体的速度（线速度/角速度）。

KinematicPositionBased 刚体虽然没有被施加力，但引擎为了计算它与其他动态物体的碰撞，内部仍然会计算并存储一个速度值。

## 优化

1. `pointermove` 去除，逻辑放在 `useFrame`。这样减少事件挂载，还可以更实时地拖拽。

```tsx
useFrame(state => {
	if (!state.raycaster.ray.intersectPlane(drag.plane, drag._hit)) return

	const desired = drag._desired.copy(drag._hit).sub(drag.grabOffset)

	rb.setNextKinematicTranslation({ x: desired.x, y: desired.y, z: desired.z })
})
```

2. `pointerup`, `pointercancel` 挂载到 window，避免“沾手”现象

