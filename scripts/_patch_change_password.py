# -*- coding: utf-8 -*-
"""给后端 auth.py 注入「修改密码」端点（会话仅读前端目录，故用补丁脚本）。
目标：JustWord-backend/app/routers/auth.py
"""
from pathlib import Path

BACKEND_ROUTERS = Path(__file__).resolve().parents[2] / "JustWord-backend" / "app" / "routers"
AUTH_PATH = BACKEND_ROUTERS / "auth.py"

MODEL_ANCHOR = "class LoginRequest(BaseModel):\n    email: str\n    password: str\n"

MODEL_INSERT = """class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
"""

ENDPOINT_ANCHOR = '@router.get("/me", response_model=UserResponse)'

ENDPOINT_INSERT = '''@router.put("/password", response_model=dict)
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改密码：校验原密码，更新为新密码哈希"""
    if not verify_password(req.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="原密码错误")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="新密码至少 6 位")
    if verify_password(req.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="新密码不能与原密码相同")
    current_user.password_hash = hash_password(req.new_password)
    await db.commit()
    return {"message": "密码修改成功"}

@router.get("/me", response_model=UserResponse)'''


def main():
    if not AUTH_PATH.exists():
        raise SystemExit(f"后端文件不存在: {AUTH_PATH}")
    src = AUTH_PATH.read_text(encoding="utf-8")

    if "ChangePasswordRequest" in src:
        print("已存在 ChangePasswordRequest，跳过")
        return

    if (MODEL_ANCHOR in src) and (src.count(MODEL_ANCHOR) == 1):
        src = src.replace(MODEL_ANCHOR, MODEL_INSERT, 1)
    else:
        raise SystemExit("模型锚点不唯一/缺失")

    if (ENDPOINT_ANCHOR in src) and (src.count(ENDPOINT_ANCHOR) == 1):
        src = src.replace(ENDPOINT_ANCHOR, ENDPOINT_INSERT, 1)
    else:
        raise SystemExit("端点锚点不唯一/缺失")

    AUTH_PATH.write_text(src, encoding="utf-8")
    print("auth.py 已注入修改密码端点")


if __name__ == "__main__":
    main()