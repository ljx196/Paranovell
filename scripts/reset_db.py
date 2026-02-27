#!/usr/bin/env python3
"""
数据库重置脚本 - 清空测试数据
用法: python scripts/reset_db.py [--confirm]
"""

import argparse
import sys

try:
    import psycopg2
    import redis
except ImportError:
    print("请先安装依赖: pip install psycopg2-binary redis")
    sys.exit(1)


# 数据库配置 (与 bff/config.yaml 保持一致)
DB_CONFIG = {
    "host": "172.27.129.200",
    "port": 5432,
    "user": "postgres",
    "password": "",
    "dbname": "postgres",
}

REDIS_CONFIG = {
    "host": "localhost",
    "port": 6379,
    "password": "",
    "db": 0,
}

# 要清空的表 (按依赖顺序，先清外键依赖的表)
TABLES_TO_TRUNCATE = [
    "bff_schema.token_usage",
    "bff_schema.system_messages",
    "bff_schema.referrals",
    "bff_schema.user_preferences",
    "bff_schema.users",
]

# Redis 键前缀
REDIS_KEY_PATTERNS = [
    "email_verify:*",
    "password_reset:*",
]


def reset_postgres():
    """清空 PostgreSQL 数据库表"""
    print("\n[PostgreSQL] 连接数据库...")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()

        print("[PostgreSQL] 连接成功")

        for table in TABLES_TO_TRUNCATE:
            try:
                # 使用 TRUNCATE CASCADE 清空表并重置自增ID
                cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
                print(f"  ✓ 已清空: {table}")
            except psycopg2.Error as e:
                if "does not exist" in str(e):
                    print(f"  - 跳过 (不存在): {table}")
                else:
                    print(f"  ✗ 失败: {table} - {e}")

        cursor.close()
        conn.close()
        print("[PostgreSQL] 完成")
        return True

    except psycopg2.Error as e:
        print(f"[PostgreSQL] 连接失败: {e}")
        return False


def reset_redis():
    """清空 Redis 中的相关键"""
    print("\n[Redis] 连接...")

    try:
        r = redis.Redis(
            host=REDIS_CONFIG["host"],
            port=REDIS_CONFIG["port"],
            password=REDIS_CONFIG["password"] or None,
            db=REDIS_CONFIG["db"],
            decode_responses=True,
        )

        # 测试连接
        r.ping()
        print("[Redis] 连接成功")

        total_deleted = 0
        for pattern in REDIS_KEY_PATTERNS:
            keys = r.keys(pattern)
            if keys:
                deleted = r.delete(*keys)
                total_deleted += deleted
                print(f"  ✓ 已删除 {deleted} 个键: {pattern}")
            else:
                print(f"  - 无匹配键: {pattern}")

        print(f"[Redis] 完成，共删除 {total_deleted} 个键")
        return True

    except redis.ConnectionError as e:
        print(f"[Redis] 连接失败: {e}")
        return False
    except Exception as e:
        print(f"[Redis] 错误: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="重置数据库测试数据")
    parser.add_argument(
        "--confirm", "-y",
        action="store_true",
        help="跳过确认提示"
    )
    parser.add_argument(
        "--postgres-only",
        action="store_true",
        help="只清空 PostgreSQL"
    )
    parser.add_argument(
        "--redis-only",
        action="store_true",
        help="只清空 Redis"
    )
    args = parser.parse_args()

    print("=" * 50)
    print("GenNovelWeb 数据库重置工具")
    print("=" * 50)
    print("\n警告: 此操作将清空以下数据:")
    print("  - PostgreSQL: bff_schema 中的所有用户数据")
    print("  - Redis: 邮箱验证和密码重置的 Token")

    if not args.confirm:
        response = input("\n确认执行? (输入 'yes' 继续): ")
        if response.lower() != "yes":
            print("已取消")
            sys.exit(0)

    print("\n开始重置...")

    success = True

    if not args.redis_only:
        if not reset_postgres():
            success = False

    if not args.postgres_only:
        if not reset_redis():
            success = False

    print("\n" + "=" * 50)
    if success:
        print("重置完成!")
    else:
        print("部分操作失败，请检查上方日志")
    print("=" * 50)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
