<iframe
	src='https://suni-3d.vercel.app/demo-10'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>

## 桥接逻辑

绳子节点后续会使用曲线逻辑，所以只使用少数 4 个模拟绳子晃动。

4 个节点，加一个小碰撞体，模拟出下落，且**关闭碰撞**。

自然的落体比较轻跳，需要加上 linearDamping、angularDamping，模拟绳子感觉。

```tsx
const ref1 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>
const ref2 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>
const ref3 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>
const ref4 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>

const cardRef = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>

<RigidBody position={[0, y, 0]} ref={ref1} type='fixed' colliders={false}>
	<BallCollider args={[0.1]} />
</RigidBody>
<RigidBody position={[distance, y, 0]} ref={ref2} type='dynamic' colliders={false} linearDamping={linearDamping} angularDamping={angularDamping}>
	<BallCollider args={[0.1]} />
</RigidBody>
<RigidBody position={[distance * 2, y, 0]} ref={ref3} type='dynamic' colliders={false} linearDamping={linearDamping} angularDamping={angularDamping}>
	<BallCollider args={[0.1]} />
</RigidBody>
<RigidBody position={[distance * 3, y, 0]} ref={ref4} type='dynamic' colliders={false} linearDamping={linearDamping} angularDamping={angularDamping}>
	<BallCollider args={[0.1]} />
</RigidBody>
<DraggableCard
	position={[distance * 3, y - distance, 0]}
	rigidBodyRef={cardRef}
	onDraggingChange={setDragging}
	size={[1, 1.5, 0.05]}
	linearDamping={linearDamping}
	angularDamping={angularDamping}
/>
```

### 桥接
4 个节点模拟绳子，卡片节点只旋转，并固定距离。
```tsx
useRopeJoint(ref1, ref2, [zeroVec, zeroVec, distance])
useRopeJoint(ref2, ref3, [zeroVec, zeroVec, distance])
useRopeJoint(ref3, ref4, [zeroVec, zeroVec, distance])
useSphericalJoint(ref4, cardRef, [zeroVec, [0, cardDistance, 0]])
```

### 修正方向

自由下坠，卡片朝向会有问题。简单可以直接锁定 y 轴旋转。更好的是施加角速度、旋转力。

我这里就施加的 **反向旋转力**，vercel 项目使用了改变角速度。

```tsx
// 自动修正 Card y 轴旋转
useFrame(() => {
	const card = cardRef.current
	if (!card) return

	const q = card.rotation()
	const current = new THREE.Quaternion(q.x, q.y, q.z, q.w)

	const euler = new THREE.Euler().setFromQuaternion(current)

	// Y 偏移量
	const error = euler.y

	// 施加反向扭矩（类似弹簧）
	card.applyTorqueImpulse({ x: 0, y: -error * 0.0005, z: 0 }, true)
})
```


## 曲线

折线到曲线，使用 threejs 自身的 `THREE.CatmullRomCurve3`。

显示方面，vercel 项目使用的 `MeshLine`，使用会比较局限。1.  MeshLine 使用 shader 拓宽 ，不好设置彩色图案，只能单色图案；2. 尾部会有闪烁 bug。

vercel 用黑白色掩盖了这些缺点。我习惯明亮空间，这里就不好处理。

我这里就使用点，生成实体长条面。

```tsx
const geometry = useMemo(() => {
	const geo = new THREE.BufferGeometry()

	const positions = new Float32Array((segments + 1) * 2 * 3)
	const uvs = new Float32Array((segments + 1) * 2 * 2)
	const indices: number[] = []

	for (let i = 0; i < segments; i++) {
		const a = i * 2
		const b = i * 2 + 1
		const c = i * 2 + 2
		const d = i * 2 + 3

		indices.push(a, b, c)
		indices.push(b, d, c)
	}

	const positionAttr = new THREE.BufferAttribute(positions, 3)
	positionAttr.setUsage(THREE.DynamicDrawUsage)

	const uvAttr = new THREE.BufferAttribute(uvs, 2)
	for (let i = 0; i <= segments; i++) {
		const i2 = i * 2
		const v = i / segments
		
		uvAttr.setXY(i2, 1, v)
		uvAttr.setXY(i2 + 1, 0, v)
	}

	geo.setAttribute('position', positionAttr)
	geo.setAttribute('uv', uvAttr)
	geo.setIndex(indices)

	return geo
	},  [segments])

// 这里使用 4 个节点的 translation
useFrame(() => {
	// ...
	curve.points[0].copy(last[0])
	curve.points[1].copy(last[1])
	curve.points[2].copy(last[2])
	curve.points[3].copy(last[3])
	
	// ...
	const pos = geometry.attributes.position as THREE.BufferAttribute
	const halfWidth = bandWidth / 2

	for (let i = 0; i <= segments; i++) {
		curve.getPoint(i / segments, tmpPoint)
		const i2 = i * 2

		pos.setXYZ(i2, tmpPoint.x - halfWidth, tmpPoint.y, tmpPoint.z)
		pos.setXYZ(i2 + 1, tmpPoint.x + halfWidth, tmpPoint.y, tmpPoint.z)
	}

	pos.needsUpdate = true
	geometry.computeVertexNormals()
})
```

### 曲线尾部

为了更真实表现，尾部做了一个收尾。逻辑为在尾部加 3 个点，然后 curve 自然形成一个扁圆。

### 吊带材质

图片正确放位置，使用 leva 去调控：repeatX、repeatY、offsetX、offsetY、rotation，就差不多了。

吊带是手写的 geometry，所以调整 uv 的时候，需要在 geometry 生成时调整好。

mesh 设置 `frustumCulled = false` 防止突然消失。 

## 卡片

卡片建模要注意材质需要单个，不然在 threejs 使用会有问题。

色彩方面，设置高一点的金属度，饱和度会更高。

材质叠加、玻璃材质都不适合新手，需要谨慎。

方案可以先做好正反面，然后 uv 放置合适位置。

![](/blogs/draggable-card-3/18279e0cb89feb83.webp)

## AI

3D 方面，AI 容易写得不对。但是 AI 帮了很大的忙，比如 曲线生成 geometry , 这不是我能短时间能写出来的，学习知识加应用方面，至少又是半天时间。

## 两条线的版本

<iframe
	src='https://suni-3d.vercel.app/demo-11'
	style={{ border: 0 }}
	allowfullscreen
	width="100%"
	height="600px"
	loading='lazy'></iframe>
