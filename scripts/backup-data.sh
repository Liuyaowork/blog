#!/bin/bash
# ============================================================
# 数据卷备份脚本
# 定期备份 Docker 数据卷中的重要数据
# ============================================================

set -e

# ========== 配置区域 ==========
VOLUME_NAME="yysuni-blog-data"
BACKUP_DIR="/var/backups/yysuni-blog"
RETENTION_DAYS=30
DATE_SUFFIX=$(date +'%Y%m%d_%H%M%S')
BACKUP_FILE="blog-data-${DATE_SUFFIX}.tar.gz"
# =============================

# 创建备份目录
mkdir -p $BACKUP_DIR

echo "📦 开始备份数据卷: $VOLUME_NAME"
echo "目标: $BACKUP_DIR/$BACKUP_FILE"

# 使用临时容器备份数据卷
docker run --rm \
    -v ${VOLUME_NAME}:/data \
    -v ${BACKUP_DIR}:/backup \
    alpine \
    tar czf /backup/${BACKUP_FILE} -C /data .

echo "✅ 备份完成: $BACKUP_DIR/$BACKUP_FILE"

# 清理旧备份（保留最近 N 天）
echo "🧹 清理 ${RETENTION_DAYS} 天前的旧备份..."
find $BACKUP_DIR -name "blog-data-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete

# 显示备份文件大小
ls -lh $BACKUP_DIR/$BACKUP_FILE

echo ""
echo "📋 当前备份列表:"
ls -lh $BACKUP_DIR/ | grep blog-data

echo ""
echo "恢复命令: docker run --rm -v ${VOLUME_NAME}:/data -v ${BACKUP_DIR}:/backup alpine sh -c 'cd /data && tar xzf /backup/${BACKUP_FILE}'"
