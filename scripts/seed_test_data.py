# -*- coding: utf-8 -*-
"""可复用测试数据种子脚本（JustWord）.

在本地 MySQL 生成一个有「学习历史」的测试账号，覆盖个人页所有可视化组件所需
数据：订阅内置词库、导入词到用户词本、跨天学习记录、打卡、词 SM-2 快照
（记忆曲线）、每日聚合统计（热力图/雷达/日历）。用于开发、回归验收与演示。

运行（在 f:\\Dev\\JustWord-frontend 根目录，使用后端 venv）：
    F:\\Dev\\JustWord-backend\\venv\\Scripts\\python.exe scripts\\seed_test_data.py
    F:\\Dev\\JustWord-backend\\venv\\Scripts\\python.exe scripts\\seed_test_data.py --days 40 --reset 1

参数：
    --email      测试账号邮箱（默认 demo@justword.test）
    --password   登录密码（默认 Demo123456）
    --days       生成学习历史天数 1..365（默认 30）
    --words      导入用户词本的词数（默认 120）
    --reset      1 表示清空该账号旧数据后重建（默认 0，幂等追加）
    --backend    后端项目目录（默认自动定位 ..\\..\\JustWord-backend）

说明：
    - 需先启动/确保本机 MySQL（justword 库）与后端依赖安装。
    - 相同 --email 重复运行会复用已订阅词库与已导入词，追加新学习记录；
      想完全重置加 --reset 1。
"""
import argparse
import asyncio
import random
import sys
import uuid
from datetime import date, datetime, timedelta

from pathlib import Path


def _locate_backend(explicit: str) -> Path:
    if explicit:
        p = Path(explicit).resolve()
    else:
        p = Path(__file__).resolve().parents[1].parent / "JustWord-backend"
    if not (p / "app").is_dir():
        print(f"[错误] 找不到后端项目目录: {p}（请用 --backend 指定）")
        sys.exit(2)
    return p


BACKEND = _locate_backend("")
sys.path.insert(0, str(BACKEND))

from sqlalchemy import select, delete  # noqa: E402

from app.database import AsyncSessionLocal  # noqa: E402
from app.models import (  # noqa: E402
    User, Word, WordLibrary, LibraryWord, LearningRecord, Checkin,
    UserPreference, UserLibrarySubscription, WrongWord, DailyStat, WordSnapshot,
)
from app.services import daily_stats  # noqa: E402
from app.services.learning_common import local_offset  # noqa: E402
from app.routers.auth import hash_password  # noqa: E402
from app.services import srs  # noqa: E402


def _apply_sm2_at(word: Word, result: str, at: datetime) -> dict:
    """SM-2 更新调度字段，时间点回填到 `at`（复刻 app/services/srs.apply_sm2 的逻辑）。"""
    quality, _ = srs.RESULT_QUALITY.get(result, (2, False))
    ef = word.ef if word.ef is not None else 2.5
    interval = word.review_interval if word.review_interval is not None else 0
    reps = word.repetitions if word.repetitions is not None else 0

    if quality < 3:
        reps, interval = 0, 1
    else:
        reps += 1
        interval = 1 if reps == 1 else (6 if reps == 2 else round(interval * ef))

    new_ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if new_ef < 1.3:
        new_ef = 1.3

    word.ef = round(new_ef, 2)
    word.review_interval = interval
    word.repetitions = reps
    word.last_reviewed_at = at
    word.next_review_at = at + timedelta(days=interval)
    return {"quality": quality, "interval_days": interval, "repetitions": reps,
            "easiness_factor": word.ef}


def _pick_day_times(learning_date: date, offset, n: int) -> list:
    """在学习日 [L 02:00, L+1 02:00) 的 UTC 区间内随机取 n 个时间点。"""
    start, end = daily_stats.learning_day_bounds(learning_date, offset)
    span = int((end - start).total_seconds())
    return [start + timedelta(seconds=random.randint(0, span - 1)) for _ in range(n)]


async def _ensure_user(session, email, password, username) -> User:
    res = await session.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if user is None:
        user = User(id=str(uuid.uuid4()), email=email, username=username,
                    password_hash=hash_password(password), created_at=datetime.utcnow())
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return user


async def _clear_user_data(session, user_id: str) -> None:
    for model in (WordSnapshot, DailyStat, WrongWord, LearningRecord, Checkin,
                  UserPreference, UserLibrarySubscription):
        await session.execute(delete(model).where(model.user_id == user_id))
    await session.execute(delete(Word).where(Word.user_id == user_id))
    await session.commit()


async def seed(args) -> dict:
    offset = local_offset()
    today = daily_stats.current_learning_date(offset)
    days = max(1, min(args.days, 365))
    email, password = args.email, args.password
    target = 6  # 每日目标（打卡门槛），过小则几乎每天都能打卡，日历更饱满

    async with AsyncSessionLocal() as db:
        user = await _ensure_user(db, email, password, "测试用户")
        if args.reset:
            await _clear_user_data(db, user.id)
            print(f"[重置] 已清空 {email} 的历史数据")

        # 1) 订阅内置词库
        lib = (await db.execute(select(WordLibrary).order_by(WordLibrary.id.asc())
                                .limit(1))).scalar_one_or_none()
        if not lib:
            raise RuntimeError("未找到内置词库，请先执行 migrations/010-011 词库导入")
        sub = (await db.execute(select(UserLibrarySubscription).where(
            UserLibrarySubscription.user_id == user.id,
            UserLibrarySubscription.library_id == lib.id))).scalar_one_or_none()
        if not sub:
            db.add(UserLibrarySubscription(user_id=user.id, library_id=lib.id))

        # 2) 从词库导入 N 个词（幂等，按英文去重）
        lib_words = (await db.execute(
            select(LibraryWord).where(LibraryWord.library_id == lib.id)
            .order_by(LibraryWord.id.asc()).limit(max(args.words, 50)))).scalars().all()
        existing = set((await db.execute(
            select(Word.english).where(Word.user_id == user.id))).scalars().all())
        imported = 0
        for lw in lib_words:
            if lw.english in existing:
                continue
            db.add(Word(id=str(uuid.uuid4()), user_id=user.id, english=lw.english,
                        chinese=lw.chinese, phonetic=lw.phonetic,
                        part_of_speech=lw.part_of_speech))
            imported += 1
        await db.commit()

        user_words = list((await db.execute(
            select(Word).where(Word.user_id == user.id).order_by(Word.english))
            ).scalars().all())
        if not user_words:
            raise RuntimeError("导入词数为 0，无法生成学习数据")
        print(f"[词库] 订阅《{lib.name}》，用户词本 {len(user_words)} 词（本次新增 {imported}）")

        # 3) 每日目标
        pref = (await db.execute(select(UserPreference).where(
            UserPreference.user_id == user.id))).scalar_one_or_none()
        if not pref:
            db.add(UserPreference(user_id=user.id, recitation_rule="judge",
                                  daily_target=target))
        else:
            pref.daily_target = target
            pref.recitation_rule = pref.recitation_rule or "judge"

        # 4) 跨天生成学习记录 / 打卡 / 快照 / 每日聚合
        total_records = total_checkins = 0
        cursor = 0
        pool_size = len(user_words)

        def next_in_day(n):
            nonlocal cursor
            picked = []
            for _ in range(n):
                picked.append(user_words[cursor % pool_size])
                cursor += 1
            seen, dedup = set(), []
            for w in picked:
                if w.id not in seen:
                    seen.add(w.id)
                    dedup.append(w)
            return dedup

        for i in range(days - 1, -1, -1):
            learning_date = today - timedelta(days=i)
            n_words = 6 + ((i * 7 + 3) % 7)          # 6..12 波动，制造热力深浅
            words_for_day = next_in_day(n_words)
            times = _pick_day_times(learning_date, offset, len(words_for_day))
            day_correct = 0
            for w, at in zip(words_for_day, times):
                is_new = 1 if (w.repetitions or 0) == 0 else 0
                r = random.choices(["correct", "partial", "wrong"],
                                   weights=[70, 15, 15])[0]
                q = srs.RESULT_QUALITY[r][0]
                sch = _apply_sm2_at(w, r, at)
                db.add(LearningRecord(
                    word_id=w.id, user_id=user.id, mode="judge",
                    user_answer="", correct_answer=f"{w.english} {w.chinese}",
                    result=r, score=q, response_ms=random.randint(1200, 4500),
                    is_new=is_new, created_at=at))
                db.add(WordSnapshot(
                    user_id=user.id, word_id=w.id,
                    repetitions=sch["repetitions"], interval_days=sch["interval_days"],
                    ef=sch["easiness_factor"], next_review_at=w.next_review_at,
                    captured_at=at))
                if r in ("correct", "partial"):
                    day_correct += 1
                total_records += 1
                await db.flush()

            duration = sum(random.randint(4, 9) for _ in words_for_day) * 6
            await daily_stats.add_session_duration(db, user.id, learning_date, duration)
            if day_correct >= target:
                total_checkins += 1
                db.add(Checkin(user_id=user.id, date=learning_date))
            await db.commit()
            await daily_stats.recompute_day(db, user.id, learning_date, offset)
            await db.commit()

    return {"email": email, "password": password, "user": user,
            "words": len(user_words), "records": total_records,
            "checkins": total_checkins, "days": days}


def main() -> None:
    parser = argparse.ArgumentParser(description="JustWord 测试数据种子脚本")
    parser.add_argument("--email", default="demo@justword.test")
    parser.add_argument("--password", default="Demo123456")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--words", type=int, default=120)
    parser.add_argument("--reset", type=int, default=0)
    parser.add_argument("--backend", default=str(BACKEND))
    args = parser.parse_args()
    BACKEND_D = _locate_backend(args.backend)

    result = asyncio.run(seed(args))
    print("\n========== 测试账号已就绪 ==========")
    print(f"  邮箱    : {result['email']}")
    print(f"  密码    : {result['password']}")
    print(f"  用户ID  : {result['user'].id}")
    print(f"  学习词  : {result['words']} 个")
    print(f"  学习记录: {result['records']} 条")
    print(f"  打卡    : {result['checkins']} 天 / {result['days']} 天")
    print("  ==================================")
    print("  在 JustWord 前端用以上账号登录即可看到已填充的学习历史与可视化。")
    print("  如需清空该账号数据重新生成，请执行：")
    print(f"    python scripts\\seed_test_data.py --email {result['email']} --reset 1")


if __name__ == "__main__":
    main()