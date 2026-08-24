// src/api/mock/textbooks.mock.ts
// 内置词书 mock 数据源（前端先行 · 后端实现后切换 textbooksApiHttp）
// 词条为真实大纲词汇示例，作为 M2 词书选择/订阅页的种子数据。
import type { Textbook, TextbookWord, TextbookWordsResponse } from '../endpoints/textbooks.api'

const TEXTBOOKS: Textbook[] = [
  {
    id: 1,
    name: '大学英语四级 · 核心词汇',
    level: 'CET4',
    word_count: 30,
    description: '覆盖四级高频核心词汇，含音标、释义与例句。',
    created_at: '2026-08-24T00:00:00Z',
  },
  {
    id: 2,
    name: '大学英语六级 · 核心词汇',
    level: 'CET6',
    word_count: 20,
    description: '覆盖六级高频核心词汇，进阶备考首选。',
    created_at: '2026-08-24T00:00:00Z',
  },
  {
    id: 3,
    name: '考研英语 · 大纲核心词',
    level: 'KAOYAN',
    word_count: 20,
    description: '考研英语大纲核心词，适合集中攻坚。',
    created_at: '2026-08-24T00:00:00Z',
  },
]

function w(
  word: string,
  phonetic: string,
  meaning: string,
  example: string,
  extra?: { similarWords?: string[]; synonyms?: string[]; antonyms?: string[] },
): TextbookWord {
  return { id: word, word, phonetic, meaning, example, level: 'CET4', ...extra }
}

const WORDS_BY_BOOK: Record<number, TextbookWord[]> = {
  1: [
    w('abandon', '/əˈbændən/', 'v. 放弃；抛弃', 'He abandoned his plan to study abroad.', {
      similarWords: ['abandoned', 'abandonment'],
      synonyms: ['give up', 'desert'],
      antonyms: ['keep', 'retain'],
    }),
    w('ability', '/əˈbɪləti/', 'n. 能力；才能', 'She has the ability to solve complex problems.', {
      similarWords: ['capability', 'possibility'],
      synonyms: ['capacity', 'competence'],
      antonyms: ['inability', 'incompetence'],
    }),
    w('abroad', '/əˈbrɔːd/', 'adv. 在国外；到国外', 'Many students choose to study abroad.', {
      similarWords: ['aboard', 'broad'],
      synonyms: ['overseas'],
      antonyms: ['home', 'domestic'],
    }),
    w('abrupt', '/əˈbrʌpt/', 'adj. 突然的；唐突的', 'The meeting came to an abrupt end.', {
      similarWords: ['abruptly', 'erupt'],
      synonyms: ['sudden', 'unexpected'],
      antonyms: ['gradual', 'gentle'],
    }),
    w('absence', '/ˈæbsəns/', 'n. 缺席；缺乏', 'His absence from class was noticed.', {
      similarWords: ['absent', 'presence'],
      synonyms: ['lack', 'deficiency'],
      antonyms: ['presence', 'attendance'],
    }),
    w('absolute', '/ˈæbsəluːt/', 'adj. 绝对的；完全的', 'It takes absolute trust to cooperate.', {
      similarWords: ['absolutely', 'absorb'],
      synonyms: ['complete', 'total'],
      antonyms: ['relative', 'partial'],
    }),
    w('absorb', '/əbˈzɔːb/', 'v. 吸收；吸引', 'Plants absorb water through their roots.', {
      similarWords: ['absorbing', 'abrupt'],
      synonyms: ['take in', 'soak up'],
      antonyms: ['release', 'emit'],
    }),
    w('abstract', '/ˈæbstrækt/', 'adj. 抽象的', 'The theory is too abstract to understand.', {
      similarWords: ['absorb', 'attract'],
      synonyms: ['theoretical', 'conceptual'],
      antonyms: ['concrete', 'specific'],
    }),
    w('abundant', '/əˈbʌndənt/', 'adj. 丰富的；充裕的', 'The region is abundant in natural resources.', {
      similarWords: ['abundance', 'bound'],
      synonyms: ['plentiful', 'ample'],
      antonyms: ['scarce', 'rare'],
    }),
    w('academic', '/ˌækəˈdemɪk/', 'adj. 学术的', 'His academic performance is excellent.', {
      similarWords: ['academy', 'academia'],
      synonyms: ['scholarly', 'educational'],
      antonyms: ['practical', 'vocational'],
    }),
    w('accelerate', '/əkˈseləreɪt/', 'v. 加速；促进', 'The car accelerated to overtake the truck.', {
      similarWords: ['accelerator', 'celebrate'],
      synonyms: ['speed up', 'hasten'],
      antonyms: ['decelerate', 'slow down'],
    }),
    w('accept', '/əkˈsept/', 'v. 接受；同意', 'She accepted the job offer happily.', {
      similarWords: ['except', 'expect'],
      synonyms: ['receive', 'approve'],
      antonyms: ['reject', 'refuse'],
    }),
    w('access', '/ˈækses/', 'n. 通道；机会 v. 访问', 'Students have free access to the library.'),
    w('accident', '/ˈæksɪdənt/', 'n. 事故；意外', 'He was injured in a car accident.'),
    w('accompany', '/əˈkʌmpəni/', 'v. 陪伴；伴随', 'I will accompany you to the station.'),
    w('accomplish', '/əˈkʌmplɪʃ/', 'v. 完成；实现', 'We accomplished the task ahead of schedule.'),
    w('account', '/əˈkaʊnt/', 'n. 账户；描述', 'Please transfer the money to my account.'),
    w('accurate', '/ˈækjərət/', 'adj. 准确的', 'The report gives an accurate description.'),
    w('accuse', '/əˈkjuːz/', 'v. 指控；指责', 'He was accused of stealing the money.'),
    w('achieve', '/əˈtʃiːv/', 'v. 实现；达到', 'She achieved her goal through hard work.'),
    w('acknowledge', '/əkˈnɒlɪdʒ/', 'v. 承认；致谢', 'He acknowledged his mistake bravely.'),
    w('acquire', '/əˈkwaɪə(r)/', 'v. 获得；学到', 'It takes years to acquire a language.'),
    w('adapt', '/əˈdæpt/', 'v. 适应；改编', 'You must adapt to the new environment.'),
    w('adequate', '/ˈædɪkwət/', 'adj. 足够的；适当的', 'We have adequate time to finish the work.'),
    w('adjust', '/əˈdʒʌst/', 'v. 调整；适应', 'Please adjust the volume of the speaker.'),
    w('admire', '/ədˈmaɪə(r)/', 'v. 钦佩；欣赏', 'I admire her courage and honesty.'),
    w('admit', '/ədˈmɪt/', 'v. 承认；准许进入', 'He admitted that he had made a mistake.'),
    w('adopt', '/əˈdɒpt/', 'v. 采用；收养', 'The company adopted a new policy.'),
    w('advance', '/ədˈvɑːns/', 'v. 前进；进展 n. 进步', 'Science has advanced greatly in recent years.'),
    w('advantage', '/ədˈvɑːntɪdʒ/', 'n. 优势；有利条件', 'Speaking English is a great advantage.'),
  ],
  2: [
    w('abolish', '/əˈbɒlɪʃ/', 'v. 废除；取消', 'The law was abolished last year.'),
    w('absurd', '/əbˈsɜːd/', 'adj. 荒谬的；可笑的', 'It is absurd to make such a claim.'),
    w('accessory', '/əkˈsesəri/', 'n. 附件；配饰', 'She bought a bag to match her accessories.'),
    w('acclaim', '/əˈkleɪm/', 'v. 称赞；喝彩', 'The film was acclaimed by critics.'),
    w('accommodate', '/əˈkɒmədeɪt/', 'v. 容纳；适应', 'The hotel can accommodate 500 guests.'),
    w('accumulate', '/əˈkjuːmjəleɪt/', 'v. 积累；积聚', 'He accumulated a fortune over the years.'),
    w('adhere', '/ədˈhɪə(r)/', 'v. 坚持；粘附', 'You should adhere to the rules.'),
    w('advocate', '/ˈædvəkeɪt/', 'v. 提倡；拥护', 'Many experts advocate a healthy diet.'),
    w('aesthetic', '/iːsˈθetɪk/', 'adj. 审美的；美学的', 'The building has great aesthetic value.'),
    w('aggravate', '/ˈæɡrəveɪt/', 'v. 加重；恶化', 'Smoking can aggravate the illness.'),
    w('alleviate', '/əˈliːvieɪt/', 'v. 减轻；缓解', 'The medicine helped alleviate the pain.'),
    w('ambiguous', '/æmˈbɪɡjuəs/', 'adj. 模棱两可的', 'His answer was ambiguous and unclear.'),
    w('amend', '/əˈmend/', 'v. 修改；修订', 'The committee voted to amend the bill.'),
    w('ample', '/ˈæmpl/', 'adj. 充足的；宽敞的', 'There is ample room for everyone.'),
    w('analogy', '/əˈnælədʒi/', 'n. 类比；类推', 'He drew an analogy between the two cases.'),
    w('anticipate', '/ænˈtɪsɪpeɪt/', 'v. 预期；期待', 'We anticipate a rise in prices.'),
    w('apprehend', '/ˌæprɪˈhend/', 'v. 理解；逮捕', 'She failed to apprehend the true meaning.'),
    w('arbitrary', '/ˈɑːbɪtrəri/', 'adj. 任意的；专断的', 'The choice seemed completely arbitrary.'),
    w('articulate', '/ɑːˈtɪkjuleɪt/', 'v. 清楚表达 adj. 口齿伶俐的', 'He articulated his ideas clearly.'),
    w('ascertain', '/ˌæsəˈteɪn/', 'v. 查明；确定', 'We must ascertain the facts first.'),
  ],
  3: [
    w('abide', '/əˈbaɪd/', 'v. 遵守；忍受', 'You must abide by the school regulations.'),
    w('abolish', '/əˈbɒlɪʃ/', 'v. 废除；取消', 'The outdated system was abolished.'),
    w('abound', '/əˈbaʊnd/', 'v. 大量存在；充满', 'The forest abounds with wildlife.'),
    w('abolition', '/ˌæbəˈlɪʃn/', 'n. 废除；废止', 'They campaigned for the abolition of slavery.'),
    w('abstain', '/əbˈsteɪn/', 'v. 戒绝；弃权', 'Doctors advised him to abstain from alcohol.'),
    w('absurdity', '/əbˈsɜːdəti/', 'n. 荒谬；荒唐', 'The absurdity of the idea made everyone laugh.'),
    w('abundance', '/əˈbʌndəns/', 'n. 丰富；充裕', 'The valley has an abundance of water.'),
    w('abuse', '/əˈbjuːz/', 'v./n. 滥用；虐待', 'He was accused of abusing his power.'),
    w('accede', '/əkˈsiːd/', 'v. 同意；就任', 'She acceded to their request.'),
    w('accentuate', '/əkˈsentʃueɪt/', 'v. 强调；突出', 'The lighting accentuated the beauty of the hall.'),
    w('accommodation', '/əˌkɒməˈdeɪʃn/', 'n. 住宿；适应', 'The hotel provides comfortable accommodation.'),
    w('accord', '/əˈkɔːd/', 'n. 一致 v. 给予', 'His actions are in accord with his words.'),
    w('accountable', '/əˈkaʊntəbl/', 'adj. 负有责任的', 'The manager is accountable to the board.'),
    w('accredit', '/əˈkredɪt/', 'v. 认可；委任', 'The school is accredited by the government.'),
    w('accumulation', '/əˌkjuːmjəˈleɪʃn/', 'n. 积累；堆积', 'The accumulation of wealth took decades.'),
    w('acupuncture', '/ˈækjupʌŋktʃə(r)/', 'n. 针灸', 'Acupuncture is a traditional Chinese therapy.'),
    w('acute', '/əˈkjuːt/', 'adj. 严重的；敏锐的', 'There is an acute shortage of water.'),
    w('adept', '/əˈdept/', 'adj. 熟练的；擅长的', 'She is adept at solving puzzles.'),
    w('adherent', '/ədˈhɪərənt/', 'n. 拥护者', 'The idea gained many adherents.'),
    w('adjacent', '/əˈdʒeɪsnt/', 'adj. 邻近的', 'The hotel is adjacent to the station.'),
  ],
}

// 模块级订阅状态（模拟服务端持久化）
let enrolledIds = new Set<number>()

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export const textbooksMock = {
  list: () => delay(TEXTBOOKS),

  getWords: (id: number, params?: { page?: number; size?: number; keyword?: string }) => {
    const all = WORDS_BY_BOOK[id] ?? []
    const page = params?.page ?? 1
    const size = params?.size ?? 20
    const keyword = params?.keyword?.trim().toLowerCase()

    let filtered = all
    if (keyword) {
      filtered = all.filter(
        (it) => it.word.toLowerCase().includes(keyword) || it.meaning.toLowerCase().includes(keyword),
      )
    }

    const start = (page - 1) * size
    const items = filtered.slice(start, start + size)
    const res: TextbookWordsResponse = {
      items,
      total: filtered.length,
      page,
      size,
    }
    return delay(res)
  },

  enroll: (id: number) => {
    const book = TEXTBOOKS.find((it) => it.id === id)
    if (!book) return delay({ enrolled: false, textbook_id: id, subscribed: 0 })
    if (!enrolledIds.has(id)) enrolledIds.add(id)
    return delay({ enrolled: true, textbook_id: id, subscribed: enrolledIds.size })
  },
}
