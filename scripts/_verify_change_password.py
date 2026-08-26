# -*- coding: utf-8 -*-
"""修改密码接口闭环验证：原密码错误 / 新密码过短 / 新旧相同 / 成功 / 新旧密码登录校验。"""
import uuid
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:3000"


def req(method, path, body=None, token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    if body is not None:
        r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return e.code, {}


results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond)))
    print(("PASS" if cond else "FAIL"), "-", name, ("| " + detail if detail else ""))


def main():
    email = f"pw_{uuid.uuid4().hex[:8]}@test.com"
    username = f"改密{uuid.uuid4().hex[:6]}"
    old_pw = "OldPass123"; new_pw = "NewPass456"

    s, _ = req("POST", "/api/auth/register", {"email": email, "username": username, "password": old_pw})
    check("注册", s in (200, 201), f"status={s}")

    s, login = req("POST", "/api/auth/login", {"email": email, "password": old_pw})
    token = login.get("access_token", "")
    check("旧密码登录", s == 200 and bool(token))

    H = {"Authorization": f"Bearer {token}"}

    s, body = req("PUT", "/api/auth/password", {"old_password": "WrongOld", "new_password": new_pw}, token=token)
    msg = (body.get("error") or {}).get("message") or ""
    check("原密码错误 → 400", s == 400 and "原密码错误" in msg, f"msg={msg}")

    s, body = req("PUT", "/api/auth/password", {"old_password": old_pw, "new_password": "123"}, token=token)
    msg = (body.get("error") or {}).get("message") or ""
    check("新密码过短 → 400", s == 400 and "至少" in msg, f"msg={msg}")

    s, body = req("PUT", "/api/auth/password", {"old_password": old_pw, "new_password": old_pw}, token=token)
    msg = (body.get("error") or {}).get("message") or ""
    check("新旧相同 → 400", s == 400 and "不能与原密码相同" in msg, f"msg={msg}")

    s, body = req("PUT", "/api/auth/password", {"old_password": old_pw, "new_password": new_pw}, token=token)
    check("修改成功 → 200", s == 200 and "成功" in (body.get("message") or ""), f"status={s}")

    s, _ = req("POST", "/api/auth/login", {"email": email, "password": old_pw})
    check("旧密码登录应失败 401", s == 401)

    s, login2 = req("POST", "/api/auth/login", {"email": email, "password": new_pw})
    check("新密码登录成功", s == 200 and bool(login2.get("access_token")))

    failed = [x[0] for x in results if not x[1]]
    print("\n=== 汇总:", f"{len(results)-len(failed)}/{len(results)} 通过 ===")
    if failed:
        print("失败项:", failed)


if __name__ == "__main__":
    main()