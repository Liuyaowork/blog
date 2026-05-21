#!/bin/bash
# ============================================================
# 服务器手动部署脚本（阿里云 ACR 版）
# 用于在阿里云服务器上从阿里云 ACR 拉取镜像并重启容器
# 数据卷保留，数据不会丢失
# ============================================================

set -e

# ========== 配置区域（根据实际情况修改） ==========
# 阿里云 ACR 配置
ACR_REGISTRY="registry.cn-hangzhou.aliyuncs.com"  # 替换为你的 ACR 地域
ACR_NAMESPACE="my-namespace"                       # 替换为你的命名空间
# 应用配置
IMAGE_NAME="yysuni-blog"
CONTAINER_NAME="yysuni-blog"
VOLUME_NAME="yysuni-blog-data"
NETWORK_NAME="blog-network"
HOST_PORT=2025
CONTAINER_PORT=2025
MEMORY_LIMIT="512m"
CPU_LIMIT="1.0"
# =================================================

# 完整镜像地址
FULL_IMAGE="${ACR_REGISTRY}/${ACR_NAMESPACE}/${IMAGE_NAME}:latest"

echo "========================================"
echo "  YYsuni Blog 部署脚本（阿里云 ACR）"
echo "========================================"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查数据卷是否存在，如果不存在则创建
if ! docker volume inspect $VOLUME_NAME >/dev/null 2>&1; then
    echo "📦 创建数据卷: $VOLUME_NAME"
    docker volume create $VOLUME_NAME
else
    echo "✅ 数据卷 $VOLUME_NAME 已存在"
fi

# 确保 Docker 网络存在
if ! docker network inspect $NETWORK_NAME >/dev/null 2>&1; then
    echo "🌐 创建 Docker 网络: $NETWORK_NAME"
    docker network create $NETWORK_NAME
else
    echo "✅ 网络 $NETWORK_NAME 已存在"
fi

# 登录阿里云 ACR
echo ""
echo "🔑 登录阿里云 ACR..."
read -p "请输入 ACR 用户名: " ACR_USER
read -s -p "请输入 ACR 密码: " ACR_PASS
echo ""
echo "$ACR_PASS" | docker login $ACR_REGISTRY --username $ACR_USER --password-stdin

# 拉取最新镜像
echo ""
echo "📥 从阿里云 ACR 拉取镜像: $FULL_IMAGE"
docker pull $FULL_IMAGE

# 停止并删除旧容器
echo ""
echo "🛑 停止旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 启动新容器
echo ""
echo "🚀 启动新容器..."
docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    --restart unless-stopped \
    -p ${HOST_PORT}:${CONTAINER_PORT} \
    -v ${VOLUME_NAME}:/app/data \
    -e NODE_ENV=production \
    -e NEXT_TELEMETRY_DISABLED=1 \
    -e PORT=${CONTAINER_PORT} \
    -e HOSTNAME=0.0.0.0 \
    -e DATA_DIR=/app/data \
    --memory "${MEMORY_LIMIT}" \
    --cpus "${CPU_LIMIT}" \
    ${FULL_IMAGE}

# 登出 ACR
docker logout $ACR_REGISTRY

# 等待容器启动
echo ""
echo "⏳ 等待容器启动..."
sleep 5

# 检查容器状态
if [ "$(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME)" = "true" ]; then
    echo ""
    echo "========================================"
    echo "✅ 部署成功！"
    echo "========================================"
    echo "容器名称: $CONTAINER_NAME"
    echo "端口映射: ${HOST_PORT} -> ${CONTAINER_PORT}"
    echo "数据卷: $VOLUME_NAME -> /app/data"
    echo "内存限制: $MEMORY_LIMIT"
    echo "CPU 限制: $CPU_LIMIT"
    echo ""
    echo "查看日志: docker logs -f $CONTAINER_NAME"
    echo "停止容器: docker stop $CONTAINER_NAME"
    echo "========================================"

    # 显示最近日志
    echo ""
    echo "最近日志:"
    docker logs --tail 10 $CONTAINER_NAME
else
    echo ""
    echo "❌ 部署失败！请查看日志:"
    docker logs $CONTAINER_NAME
    exit 1
fi
