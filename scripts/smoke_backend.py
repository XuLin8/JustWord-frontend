# -*- coding: utf-8 -*-
"""后端接口冒烟测试：preferences / progress / checkin 门槛"""
import json
import urllib.request

BASE = "http://127.0.0.1:3000"


def req(method, path, body=None, token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))


def main():
    import time
    email = f"progtest_{int(time.time())}@test.com"
    s, reg = req("POST", "/api/auth/register", {"email": email, "password": "pass1234", "username": "进度测试"})
    print("register", s)
    s, login = req("POST", "/api/auth/login", {"email": email, "password": "pass1234"})
    print("login", s)
    if s != 200:
        print(login)
        return
    token = login.get("access_token")
    print("token-ok", bool(token))

    s, prefs = req("GET", "/api/preferences", token=token)
    print("GET /preferences", s, prefs)
    s, prefs2 = req("PUT", "/api/preferences", {"daily_target": 25, "recitation_rule": "table"}, token=token)
    print("PUT /preferences", s, prefs2)
    s, prog = req("GET", "/api/progress", token=token)
    print("GET /progress", s, prog)
    s, ck = req("POST", "/api/learning/checkin", token=token)
    print("POST /checkin (未达标应403)", s, ck)


main()
