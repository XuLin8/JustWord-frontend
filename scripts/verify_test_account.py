# -*- coding: utf-8 -*-
"""JustWord 测试账号数据验收校验脚本.

配合 scripts/seed_test_data.py 使用：用种子脚本生成的账号登录后端，
校验个人页所需的统计数据是否可读、完整，供功能验收/回归使用。

运行（后端服务需已启动在 3000 端口；在 f:\\Dev\\JustWord-frontend 根目录执行）：
    F:\\Dev\\JustWord-backend\\venv\\Scripts\\python.exe scripts\\verify_test_account.py
    F:\\Dev\\JustWord-backend\\venv\\Scripts\\python.exe scripts\\verify_test_account.py --email xxx --password xxx

参数：
    --email     测试账号邮箱（默认 demo@justword.test）
    --password  登录密码（默认 Demo123456）
    --base      后端接口基址（默认 http://127.0.0.1:3000）
"""
import argparse
import json
import urllib.request
import urllib.error


def log(title, body):
    if isinstance(body, dict):
        body = json.dumps(body, ensure_ascii=False)[:500]
    print(f"      ↓ {title}: {body}")


def q(base, method, path, body=None, token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def main():
    parser = argparse.ArgumentParser(description="JustWord 测试账号数据验收")
    parser.add_argument("--email", default="demo@justword.test")
    parser.add_argument("--password", default="Demo123456")
    parser.add_argument("--base", default="http://127.0.0.1:3000")
    args = parser.parse_args()
    base = args.base.rstrip("/")

    ok, fail = [], []

    def check(name, cond, extra=""):
        (ok if cond else fail).append(name)
        tag = "PASS" if cond else "FAIL"
        print(f"  [{tag}] {name}" + (f" —— {extra}" if extra else ""))

    # 1) 登录
    s, body = q(base, "POST", "/api/auth/login",
                {"email": args.email, "password": args.password})
    if s != 200:
        print(f"[FAIL] 登录失败: {s} {body}")
        print("  请先运行 seed_test_data.py 生成该账号，并确认后端已启动。")
        raise SystemExit(1)
    token = body.get("access_token")
    check("登录 /api/auth/login", bool(token))

    # 2) 每日聚合统计（热力图/雷达数据源）
    s, body = q(base, "GET", "/api/learning/stats/daily?days=365", token=token)
    items = body.get("items", []) if s == 200 else []
    active_days = sum(1 for d in items if (d.get("attempts") or 0) > 0)
    today = next((d for d in items if d.get("attempts")), None)
    check("stats/daily 可读且返回活跃日",
          s == 200 and active_days > 0, f"活跃 {active_days} 天")
    if not (s == 200 and active_days > 0):
        log("stats/daily 响应", body)

    # 3) 打卡状态（日历数据源）
    s, body = q(base, "GET", "/api/learning/checkin/status", token=token)
    check("检查打卡状态", s == 200 and body.get("total_days"),
          f"total_days={body.get('total_days')} current_streak={body.get('current_streak')}")
    if not (s == 200 and body.get("total_days")):
        log("checkin/status 响应", body)

    # 4) 复习概览 / 待复习队列（学习主页数据源）
    s, rsum = q(base, "GET", "/api/learning/reviews/summary", token=token)
    check("复习概览 /reviews/summary",
          s == 200 and rsum.get("learned_count") is not None,
          f"learned={rsum.get('learned_count')} review={rsum.get('review_count')}")
    if not (s == 200 and rsum.get("learned_count") is not None):
        log("reviews/summary 响应", rsum)

    # 5) 记忆曲线快照（取一个已学词）
    s, due = q(base, "GET", "/api/learning/reviews/due?limit=20", token=token)
    due_words = due.get("items", []) if s == 200 else []
    snap_ok = False
    extra = "无待复习词"
    for w in due_words:
        ws, snap = q(base, "GET", f"/api/learning/stats/snapshots?word_id={w['id']}", token=token)
        if ws == 200 and snap.get("items"):
            snap_ok = True
            extra = f"词 {w['english']} 快照 {len(snap['items'])} 个时间点"
            break
    check("记忆曲线快照 /stats/snapshots", snap_ok, extra)
    if not snap_ok:
        log("reviews/due 响应", {"count": len(due_words),
                                 "sample": due_words[0] if due_words else None})

    print("\n========== 验收结果 ==========")
    print(f"  通过 {len(ok)} / {len(ok) + len(fail)} 项")
    if fail:
        print(f"  失败项: {fail}")
        raise SystemExit(2)
    print("  测试账号数据完整，可直接用于前端验收。")


if __name__ == "__main__":
    main()