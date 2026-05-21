#!/bin/bash
# ============================================================
# 本地 Docker 测试脚本
# 在推送到远程仓库前，先在本地 Docker 中测试项目
# ============================================================

set -e

# 配置
TEST_CONTAINER_NAME="yysuni-blog-test"
TEST_VOLUME_NAME="yysuni-blog-test-data"
TEST_NETWORK_NAME="blog-test-network"
TEST_PORT=3025  # 测试端口（不与生产冲突）

echo "========================================"
echo "  本地 Docker 测试脚本"
echo "========================================"

# 清理旧的测试环境
echo ""
echo "🧹 清理旧的测试环境..."
docker stop $TEST_CONTAINER_NAME 2>/dev/null || true
docker rm $TEST_CONTAINER_NAME 2>/dev/null || true
docker volume rm $TEST_VOLUME_NAME 2>/dev/null || true
docker network rm $TEST_NETWORK_NAME 2>/dev/null || true

# 创建测试网络和卷
echo ""
echo "📦 创建测试网络和数据卷..."
docker network create $TEST_NETWORK_NAME
docker volume create $TEST_VOLUME_NAME

# 构建镜像
echo ""
echo "🔨 构建 Docker 镜像（根据 Dockerfile）..."
docker build -t yysuni-blog:test .

# 启动测试容器
echo ""
echo "🚀 启动测试容器..."
docker run -d \
  --name $TEST_CONTAINER_NAME \
  --network $TEST_NETWORK_NAME \
  -p ${TEST_PORT}:2025 \
  -v ${TEST_VOLUME_NAME}:/app/data \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e PORT=2025 \
  -e HOSTNAME=0.0.0.0 \
  -e DATA_DIR=/app/data \
  --memory "512m" \
  --cpus "1.0" \
  yysuni-blog:test

# 等待容器启动
echo ""
echo "⏳ 等待容器启动（10秒）..."
sleep 10

# 检查容器状态
echo ""
echo "🔍 检查容器状态..."
if ! docker inspect -f '{{.State.Running}}' $TEST_CONTAINER_NAME | grep -q true; then
  echo "❌ 容器未能正常启动！"
  echo ""
  echo "容器日志："
  docker logs $TEST_CONTAINER_NAME
  echo ""
  echo "清理测试环境..."
  docker stop $TEST_CONTAINER_NAME 2>/dev/null || true
  docker rm $TEST_CONTAINER_NAME 2>/dev/null || true
  docker volume rm $TEST_VOLUME_NAME 2>/dev/null || true
  docker network rm $TEST_NETWORK_NAME 2>/dev/null || true
  exit 1
fi

echo "✅ 容器成功启动！"

# 测试 HTTP 连接
echo ""
echo "📡 测试 HTTP 连接..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s -f http://localhost:${TEST_PORT}/ > /dev/null; then
    echo "✅ HTTP 连接成功！"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "⏳ 等待应用启动... (${RETRY_COUNT}/${MAX_RETRIES})"
    sleep 3
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ HTTP 连接失败！"
  echo ""
  echo "容器日志："
  docker logs $TEST_CONTAINER_NAME
  echo ""
  echo "清理测试环境..."
  docker stop $TEST_CONTAINER_NAME 2>/dev/null || true
  docker rm $TEST_CONTAINER_NAME 2>/dev/null || true
  docker volume rm $TEST_VOLUME_NAME 2>/dev/null || true
  docker network rm $TEST_NETWORK_NAME 2>/dev/null || true
  exit 1
fi

# 测试 API
echo ""
echo "🧪 测试关键 API..."

# 测试 GET /
echo -n "  测试首页... "
if curl -s -f http://localhost:${TEST_PORT}/ > /dev/null; then
  echo "✅"
else
  echo "❌"
fi

# 测试 GET /api/setup（检查初始化状态）
echo -n "  测试 /api/setup... "
RESPONSE=$(curl -s http://localhost:${TEST_PORT}/api/setup)
if echo $RESPONSE | grep -q "initialized"; then
  echo "✅"
else
  echo "❌ (响应: $RESPONSE)"
fi

# 测试 GET /api/blogs
echo -n "  测试 /api/blogs... "
if curl -s -f http://localhost:${TEST_PORT}/api/blogs 2>/dev/null | grep -q '\[' || curl -s -f http://localhost:${TEST_PORT}/api/blogs 2>/dev/null | grep -q '{}'; then
  echo "✅"
else
  echo "⚠️ (可能需要初始化)"
fi

echo ""
echo "========================================"
echo "✅ 本地测试完成！"
echo "========================================"
echo ""
echo "测试容器运行中，以下命令可用："
echo ""
echo "  查看日志:"
echo "    docker logs -f $TEST_CONTAINER_NAME"
echo ""
echo "  访问应用:"
echo "    http://localhost:${TEST_PORT}"
echo ""
echo "  进入容器:"
echo "    docker exec -it $TEST_CONTAINER_NAME /bin/sh"
echo ""
echo "  停止测试容器:"
echo "    docker stop $TEST_CONTAINER_NAME"
echo ""
echo "  完全清理测试环境:"
echo "    docker stop $TEST_CONTAINER_NAME && docker rm $TEST_CONTAINER_NAME && docker volume rm $TEST_VOLUME_NAME && docker network rm $TEST_NETWORK_NAME"
echo ""
echo "========================================"
