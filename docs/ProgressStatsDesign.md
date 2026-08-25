# 进度后端化 + 统一统计 · 详细设计

> 版本：v0.1　状态：待评审　更新日期：2026-08-25
> 本文档定义「进度条后端化、所有背诵模式统一进度、打卡门槛、数据可视化（雷达图/记忆曲线/热力图）、打卡日历、活动运营」的实现设计，供评审后再实施。

---

## 1. 背景与目标

- 现状：进度条基于前端本地统计（`learningStore.todayLearned`），刷新/重进会因数据源口径不一致而失真；**只有认识判定模式提交后端 SM-2**，听词默写 / 看词选意 / 表格背诵只写本地，后端无这些模式的任何数据。
- 目标：
  1. 所有背诵模式**共用同一批词、同一份进度**，进度持久化到后端，刷新 / 重进 / 换设备一致。
  2. 学习日边界：每日 **02:00–次日 02:00** 为一个学习日，过点刷新；换词本重置。
  3. 进度口径：今日已学 = 学习日内**答对次数**（result ∈ {correct, partial}）。
  4. 打卡门槛：今日答对 ≥ 每日目标 才可打卡。
  5. 收集数据支撑：六维雷达图、记忆曲线、GitHub 热力图、打卡日历、节假日勋章/彩蛋。

---

## 2. 核心语义（已与用户确认）

| 决策项 | 结论 |
|---|---|
| 统一进度 | 所有模式（认识/听音/选择/表格/两轮）共用一批词、一份进度 |
| 进度口径 | 今日已学 = 学习日内答对次数（复习重复词也累计） |
| 学习日边界 | 每日 02:00–次日 02:00；过凌晨2点刷新 |
| 重置规则 | 仅换词本时重置，其余不刷新 |
| 每日目标 | 同步到后端（服务端为准） |
| 打卡门槛 | 今日答对 ≥ 每日目标才可打卡；未达标提示还差几个 |
| 表格判定 | 英译中三档（不正确/部分正确>30%/完全正确）；中译英 ≥90% 正确否则错误；仅部分+完全正确计进度；完成一列显示正确答案 |
| 额外持久化 | 每日聚合统计 / 学习时长+反应耗时 / 历史调度快照 / 新学·复习分类（四类全选） |

---

## 3. 现状盘点（数据流缺口）

**前端判定流**

| 模式 | 组件 | 判定 | 是否提交后端 SM-2 |
|---|---|---|---|
| 认识判定 | `RecitationStage` | known/unknown → correct/wrong | ✅ 是（`submitReview`） |
| 听词默写 | `ListeningMode` | 规则比对 | ❌ 仅写本地 |
| 看词选意 | `ChoiceMode` | 选项比对 | ❌ 仅写本地 |
| 表格背诵 | `TableMode` | `checkChinese`/`checkEnglish` 两档 | ❌ 仅写本地 |
| 两轮学习 | `LearnMode`（复用） | 现有规则批改 | ❌ 走 `learningStore` 本地 |

**后端现有能力**
- `learning_records`：每次判定（mode/result/score/created_at UTC）→ 可算「今日答对」。
- `words`：SM-2 调度字段（interval/repetitions/next_review_at）→ 记忆曲线预测。
- `checkins`、`wrong_words`、`achievements`：打卡 / 错词 / 成就。
- **缺失**：偏好（daily_target）无后端存储；每日聚合表；调度快照；判定耗时；时长；表格模式提交。

---

## 4. 后端设计

### 4.1 数据模型变更（`app/models.py`）

**① 新增 `UserPreference`（偏好落库）**
```python
class UserPreference(Base):
    __tablename__ = "user_preferences"
    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    recitation_rule = Column(String(20), nullable=False, default="judge")  # 上次选择的背诵模式
    daily_target = Column(Integer, nullable=False, default=20)             # 每日目标（单词数）
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**② 新增 `DailyStat`（每日聚合，P1）**
```python
class DailyStat(Base):
    __tablename__ = "daily_stats"
    __table_args__ = (UniqueConstraint("user_id", "learning_date", name="uq_daily_user_date"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    learning_date = Column(Date, nullable=False)   # 学习日（02:00 边界归日）
    distinct_words = Column(Integer, default=0)     # 学词数（去重）
    attempts = Column(Integer, default=0)           # 判定数
    correct_count = Column(Integer, default=0)      # 答对数（correct + partial）
    partial_count = Column(Integer, default=0)      # 部分正确数
    wrong_count = Column(Integer, default=0)        # 错误数
    duration_seconds = Column(Integer, default=0)   # 学习时长
    avg_response_ms = Column(Integer, default=0)    # 平均判定反应耗时
    new_learned = Column(Integer, default=0)        # 新学答对数
    review_learned = Column(Integer, default=0)     # 复习答对数
```

**③ 新增 `WordSnapshot`（历史调度快照，P1·记忆曲线真实演变）**
```python
class WordSnapshot(Base):
    __tablename__ = "word_snapshots"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    word_id = Column(String(36), ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    repetitions = Column(Integer, default=0)
    interval_days = Column(Integer, default=0)
    ef = Column(Float, default=2.5)
    next_review_at = Column(DateTime, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow, index=True)  # 快照时间
```

**④ `LearningRecord` 增强（新增可空字段，兼容旧数据）**
```python
response_ms = Column(Integer, nullable=True)   # 该次判定反应耗时（毫秒）
```
- `mode` 语义扩展：现有 `en2zh/zh2en/review`，新增 `judge/listen/choose/table/tworound`。
- `is_new` **不加字段**：提交时由后端用 `word.repetitions == 0`（SM-2 应用前）判定「新学/复习」，写入 DailyStat。

### 4.2 学习日边界计算（`services/learning_common.py` 新增纯函数）

```python
def learning_date_of(utc_dt: datetime, offset: timedelta) -> date:
    """把 UTC 时间换算到学习日：本地时间减去 2 小时后取日期（02:00 边界归日）"""
    return (utc_dt + offset - timedelta(hours=2)).date()

def current_learning_date(offset: timedelta) -> date:
    return (datetime.now() - timedelta(hours=2)).date()
```

### 4.3 接口设计

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/progress` | GET | **今日进度**：`{ learning_date, daily_target, today_correct, progress_percent, checked_today, remaining }`（P0） |
| `/api/preferences` | GET | 读取偏好：`{ recitation_rule, daily_target }`（P0，替代前端 mock） |
| `/api/preferences` | PUT | 更新偏好（P0） |
| `/api/reviews` | POST | **增强**：mode 传规则标识（judge/listen/choose/table/tworound）；result 支持 `partial`；新增 `response_ms`；提交后写 `LearningRecord` + `WordSnapshot` + 聚合 `DailyStat`（P0） |
| `/api/sessions` | POST | **学习会话结束上报**：`{ duration_seconds, mode, date }` → 并入对应 DailyStat（P1 埋点） |
| `/api/stats/daily` | GET | 每日聚合列表（热力图/日历/趋势数据源）：`?days=365` 返回 `[{ date, attempts, correct_count, ... }]`（P1） |
| `/api/checkin` | POST | **变更**：校验「今日答对 ≥ daily_target」；不达标返回 403 `{ message, remaining }`；达标才落 Checkin（P0） |
| `/api/checkin/status` | GET | 复用；`progress_percent` 由前端合并或返回补齐 |

**说明**
- `/api/progress` 与打卡校验的「今日答对」直接从 `learning_records` 实时统计（单个学习日，量小、最准确）。
- `DailyStat` 采用**懒聚合（lazy upsert）**：访问 `/stats/daily`、`/sessions`、提交复习时，对缺失的学习日做一次性聚合回填，避免引入定时任务。

### 4.4 提交复习增强逻辑（`routers/reviews.py` POST /reviews）

```python
is_new = word.repetitions == 0  # SM-2 应用前判定新学/复习
schedule = apply_sm2(word, payload.result)
db.add(LearningRecord(
    word_id=word.id, user_id=user.id, mode=payload.mode or "review",
    user_answer=payload.user_answer or "", correct_answer=payload.correct_answer or "",
    result=payload.result, score=schedule["quality"],
    response_ms=payload.response_ms, feedback=payload.feedback,
))
db.add(WordSnapshot(user_id=user.id, word_id=word.id,
    repetitions=schedule["repetitions"], interval_days=schedule["interval_days"],
    ef=schedule["ef"], next_review_at=schedule["next_review_at"]))
# ... 错词 upsert 不变
# 聚合当日 DailyStat（correct/partial 计入 correct_count；is_new 分桶）
```

### 4.5 打卡门槛（`routers/checkin.py` POST /checkin 变更）

```python
today_correct = count(learning_records where user & learning_date==today & result in {correct, partial})
target = user_preference.daily_target (默认 20)
if today_correct < target:
    raise HTTPException(403, f"还差 {target - today_correct} 个词才能打卡")
# 达到门槛后再落 Checkin（幂等逻辑保留）
```

---

## 5. 前端设计

### 5.1 全模式统一提交流（核心改造）

新增共享提交助手，**所有模式统一走后端**，废弃「仅写本地」：

```ts
// src/store/reviewStore.ts 新增
submitAttempt: async (p: {
  word: PlanWord
  result: 'correct' | 'partial' | 'wrong'
  mode: string            // judge | listen | choose | table | tworound
  userAnswer?: string
  correctAnswer?: string
  responseMs?: number
}) => {
  await learningApi.submitReview({ word_id: p.word.id, result: p.result,
    mode: p.mode, user_answer: p.userAnswer, correct_answer: p.correctAnswer,
    response_ms: p.responseMs })
  // 保留本地 learningStore 记录（供现有复习队列/详情兜底），但进度以后端为准
}
```

各模式改造点：
- **`RecitationStage`**：`submitReview` → `submitAttempt`（mode='judge' + response_ms）。
- **`TableMode`**：判定后 `submitAttempt`（mode='table'，result 三档）。
- **`ListeningMode`** / **`ChoiceMode`**：补 `submitAttempt`（mode='listen'/'choose'）。
- **两轮 `LearnMode`**：按现有判定结果补 `submitAttempt`（mode='tworound'）。

### 5.2 进度条对接（`RecitationStage` + 新增 `progressStore`）

新增 `src/store/progressStore.ts`：
```ts
{ todayCorrect, dailyTarget, progressPercent, learningDate, checkedToday, remaining, load(): Promise<void> }
```
- `RecitationStage` / `TableMode` 顶部进度条改用 `progressStore`（替换现 `learningStore.stats.todayLearned`）。
- 每次 `submitAttempt` 成功后刷新 `progressStore.load()`（防抖）。
- 打卡按钮态：`todayCorrect >= dailyTarget` 才可点；否则提示「还差 N 个词」。

### 5.3 表格模式三档判定（`utils/compare.ts` 新增，不改旧函数）

```ts
/** 英译中·表格：三档（>30% 部分命中=partial，全中=correct，否则 wrong） */
export function checkChineseTable(userInput: string, correct: string): AnswerResult {
  const input = userInput.trim(), target = correct.trim()
  if (!input) return AnswerResult.WRONG
  if (input === target) return AnswerResult.CORRECT
  const words = target.split(/[，,、;；\s]+/).filter(Boolean)
  if (words.length === 0)
    return target.includes(input) || input.includes(target) ? AnswerResult.CORRECT : AnswerResult.WRONG
  const ratio = words.filter((w) => input.includes(w)).length / words.length
  if (ratio >= 1) return AnswerResult.CORRECT
  if (ratio > 0.3) return AnswerResult.PARTIAL
  return AnswerResult.WRONG
}

/** 中译英·表格：≥90% 相似=correct，否则 wrong */
export function checkEnglishTable(userInput: string, correct: string): AnswerResult {
  const similarity = 1 - levenshtein(userInput, correct) / Math.max(correct.length, 1)
  return similarity >= 0.9 ? AnswerResult.CORRECT : AnswerResult.WRONG
}
```

`TableMode` 改造：
- 判定用 `checkChineseTable` / `checkEnglishTable`；结果三档展示（正确=绿 / 部分=橙 / 错误=红）。
- **完成一列后显示正确答案**：阶段二反向默写结束（或错词复习结束时）增加「对照答案」区块：逐行显示 英文↔中文 正确答案，已对/部分/错的标记，便于比对。
- 进度计数：`result !== WRONG`（即 correct/partial）→ `submitAttempt` result 传 `correct`/`partial`；`WRONG` 不计数。

### 5.4 埋点（P1 随 P0 一并带）

- **反应耗时**：每次判定在用户开始作答/展示单词时记 `Date.now()`，判定完成算差 → 随 `submitAttempt` 的 `response_ms` 上报。
- **学习时长**：进入背诵模式记开始时间，退出/完成时 `POST /sessions { duration_seconds, mode }`。
- **新学/复习分类**：后端按 `word.repetitions` 自动判定，前端无需埋点（`PlanWord.source` 已带 new/review 可对齐展示）。

### 5.5 偏好同步（`preferenceStore` 切后端）

- `preferencesApi` 从 mock 切换为 `preferencesApiHttp`（`GET/PUT /api/preferences`），字段 `recitation_rule` / `daily_target`。
- 登录后 `loadPreferences()`；`setDailyTarget` 直接落后端。

### 5.6 打卡门槛 UI

- 完成页打卡按钮：`progressStore.remaining > 0` 时置灰并提示「还差 N 个词，继续学习」；达标后可点。
- 后端 403 兜底：打卡接口拒绝时 Toast 展示剩余数量。

---

## 6. 数据可视化（P2）

### 6.1 六维雷达图（`/api/stats/radar` 或前端组合）

| 维度 | 数据来源 | 说明 |
|---|---|---|
| 词汇量 | `words` 已学/总 | 掌握词数占比 |
| 记忆保持 | `word_retention` 均值 | 平均保持率 |
| 打卡坚持 | `checkins` | 连续天数 / 30 |
| 正确率 | 学习日 `correct/(correct+wrong)` | 当前学习日或近 7 天 |
| 专注/效率 | `avg_response_ms` + `duration_seconds` | 反应越快、时长越稳得分越高 |
| 新学/复习均衡 | `new_learned` / `review_learned` | 两者占比均衡度 |

### 6.2 记忆曲线

- 预测拟合：现有 `GET /forgetting-curve`（SM-2 间隔 + Ebbinghaus）保留。
- **真实演变**：`GET /stats/word-history?word_id=` 按 `word_snapshots` 时间序列重建「间隔天数 / 保持率」随复习次数的变化曲线。

### 6.3 GitHub 热力图

- 数据源：`GET /stats/daily?days=365` 的 `correct_count` / `attempts`，按周排列热力方格，颜色按当日答对数分级。

### 6.4 打卡日历（LeetCode 风格）

- 数据源：`GET /checkin/history?days=365`（已有）。
- 月历网格：已打卡日高亮 + 连续天数角标；今日未达标显示半透态。
- 节假日在日历/首页注入活动标记（P3 联动）。

---

## 7. 活动运营（P3）

- 节假日勋章：预置节假日表（元旦/春节/清明/劳动/端午/中秋/国庆等）→ 当天首次打卡解锁对应 `Achievement`（表已存在）。
- 彩蛋：节假日当天首页/日历出现彩蛋动效（粒子、猫咪限定装扮等，复用 `ParticleBackground` / 云养猫资产）。
- 优先级最低，先完成 P0–P2 数据底座再实施。

---

## 8. 实施步骤与模块划分（分模块本地提交）

| 模块 | 内容 | 里程碑 |
|---|---|---|
| S0 后端基座 | `UserPreference` + `DailyStat` + `WordSnapshot` 表；`GET/PUT /preferences`；`GET /progress`；`POST /reviews` 增强；学习日函数 | P0 |
| S1 前端统一提交 | `progressStore`；`submitAttempt` 助手；RecitationStage/Table/Listening/Choice/两轮 全部接入后端 | P0 |
| S2 表格判定 | `checkChineseTable`/`checkEnglishTable`；TableMode 三档 + 完成列显示正确答案 | P0 |
| S3 打卡门槛 | `POST /checkin` 校验；前端按钮态 + 提示 | P0 |
| S4 每日聚合 | lazy 聚合服务；`/stats/daily`；`/sessions` 时长上报；埋点（response_ms/时长） | P1 |
| S5 打卡日历 UI | LeetCode 风格月历 + 连续天数 + 达标态 | P2 |
| S6 数据可视化 | 雷达图 / 记忆曲线（真实）/ GitHub 热力图 | P2 |
| S7 活动运营 | 节假日勋章 + 彩蛋 | P3 |

---

## 9. 风险与开放问题

| # | 问题 | 处理 |
|---|---|---|
| 1 | 两轮 `LearnMode` 基于「我的词库」而非词书计划，接入 `submitAttempt` 后是否与统一队列冲突 | 仅补提交记录，不并入 due 队列；进度统一按后端计数 |
| 2 | 表格「>30% 部分命中」对**无分隔符单义**词无法表达部分命中 | 无分隔时退化为 包含即全对/否则错；如需更细粒度（如按字命中）后续再议 |
| 3 | 认识判定与表格等模式的 result 语义差异 | 统一映射：correct=认识/全对、partial=部分、wrong=不认识/错 |
| 4 | 懒聚合并发重复 upsert | `UniqueConstraint(user, date)` + 幂等 upsert（ON CONFLICT） |
| 5 | 历史学习记录（已存在本地、未入库） | 前端 `loadRecords` 一次性补报迁移，或仅从改造后开始统计（默认后者，避免污染） |
| 6 | 雷达图 6 维度个别数据不足 | 空维度显示 0 / 置灰提示，不阻断渲染 |
