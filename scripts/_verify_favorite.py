# -*- coding: utf-8 -*-
"""生词本/收藏功能 —— 后端接口闭环验证。"""
import httpx

BASE = "http://127.0.0.1:8000/api"
EMAIL = "demo@justword.test"
PASSWORD = "Demo123456"

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(("PASS" if ok else "FAIL"), "-", name, ("| " + detail if detail else ""))


def main():
    with httpx.Client(base_url=BASE, timeout=20) as c:
        # 1) 登录
        r = c.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
        if r.status_code != 200:
            print("登录失败:", r.status_code, r.text)
            return
        token = r.json()["access_token"]
        H = {"Authorization": f"Bearer {token}"}

        # 2) 获取单词列表
        r = c.get("/words/", headers=H, params={"limit": 5})
        check("GET /words/", r.status_code == 200, f"count={len(r.json())}")
        words = r.json()
        if not words:
            print("无单词，需先导入词库")
            return
        wid = words[0]["id"]
        wen = words[0]["english"]
        check("单词含 favorited_at 字段", "favorited_at" in words[0], words[0].get("favorited_at"))

        # 3) 收藏
        r = c.put(f"/words/{wid}/favorite", headers=H, json={"favorited": True})
        check("PUT /words/{id}/favorite 收藏", r.status_code == 200 and r.json()["favorited_at"] is not None,
              f"favorited_at={r.json().get('favorited_at')}")

        # 4) 按收藏筛选
        r = c.get("/words/", headers=H, params={"favorited": "true"})
        fav_list = r.json()
        check("GET /words?favorited=true", r.status_code == 200 and any(w["id"] == wid for w in fav_list),
              f"fav_count={len(fav_list)}")
        r = c.get("/words/", headers=H, params={"favorited": "false"})
        unfav_list = r.json()
        check("GET /words?favorited=false 排除已收藏", r.status_code == 200 and all(w["id"] != wid for w in unfav_list),
              f"unfav_count={len(unfav_list)}")

        # 5) 复习队列 favorited_only
        r = c.get("/learning/reviews/due", headers=H, params={"favorited_only": "true", "limit": 50})
        due = r.json()
        check("GET /learning/reviews/due?favorited_only=true", r.status_code == 200,
              f"total={due.get('total')} items={[i['english'] for i in due.get('items', [])[:3]]}")
        items = due.get("items", [])
        if items:
            check("复习条目含 favorited 字段", all("favorited" in i for i in items))
            check("复习条目 favorited=true", all(i["favorited"] for i in items))

        # 6) 取消收藏
        r = c.put(f"/words/{wid}/favorite", headers=H, json={"favorited": False})
        check("PUT /words/{id}/favorite 取消收藏", r.status_code == 200 and r.json()["favorited_at"] is None)
        r = c.get("/words/", headers=H, params={"favorited": "true"})
        check("取消后 favorited=true 列表不含该词", all(w["id"] != wid for w in r.json()))

    failed = [x for x in results if not x[1]]
    print("\n=== 汇总:", f"{len(results)-len(failed)}/{len(results)} 通过 ===")
    if failed:
        print("失败项:", [x[0] for x in failed])


if __name__ == "__main__":
    main()
