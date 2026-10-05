import { DimensionCode } from './dimensions'

export interface QuestionOption {
  /** 选项 id，格式 Q01-A */
  id: string
  /** 用户可见的选项文字 */
  text: string
  /** 开发计分：两个相关维度各 0-3 分，不向用户展示 */
  scores: Partial<Record<DimensionCode, number>>
}

export interface Question {
  id: string
  /** 题号，从 1 开始 */
  index: number
  text: string
  /** 本题影响的两个维度 */
  dimensions: [DimensionCode, DimensionCode]
  options: QuestionOption[]
}

/** 24 道 V2.0 题目：描述最近一个月的生活状态，不显示维度和分数。 */
export const QUESTIONS: Question[] = [
  {
    id: 'Q01',
    index: 1,
    text: '朋友临时放你鸽子，周六下午突然空出来了。你更可能？',
    dimensions: ['R', 'S'],
    options: [
      { id: 'Q01-A', text: '正好，回宿舍躺会儿，今天就不折腾了。', scores: { R: 0, S: 0 } },
      { id: 'Q01-B', text: '在群里问一句：“有人晚上吃饭吗？”', scores: { R: 1, S: 3 } },
      { id: 'Q01-C', text: '自己下楼买点东西，顺便在附近走走。', scores: { R: 3, S: 0 } },
      { id: 'Q01-D', text: '想到一个最近没见的人，直接问他有没有空。', scores: { R: 3, S: 3 } },
    ],
  },
  {
    id: 'Q02',
    index: 2,
    text: '晚上十点，群里突然有人问：“下楼吃宵夜吗？”你第一反应？',
    dimensions: ['S', 'P'],
    options: [
      { id: 'Q02-A', text: '先问都有谁、去哪，再决定。', scores: { S: 2, P: 1 } },
      { id: 'Q02-B', text: '看到了但先不回，等他们把地方定下来。', scores: { S: 0, P: 1 } },
      { id: 'Q02-C', text: '回一句“走”，穿鞋下楼，吃什么路上再说。', scores: { S: 3, P: 3 } },
      { id: 'Q02-D', text: '太晚不想跑远，但如果就在楼下可以去。', scores: { S: 2, P: 2 } },
    ],
  },
  {
    id: 'Q03',
    index: 3,
    text: '上午下课，离下一节课还有三个小时。你通常会？',
    dimensions: ['P', 'E'],
    options: [
      { id: 'Q03-A', text: '去最熟悉的地方坐着，做作业、睡觉或者刷手机。', scores: { P: 0, E: 0 } },
      { id: 'Q03-B', text: '不设目的，在校园里随便走走再决定。', scores: { P: 3, E: 2 } },
      { id: 'Q03-C', text: '搜一家没去过的店或者附近的小活动，过去看看。', scores: { P: 2, E: 3 } },
      { id: 'Q03-D', text: '跟着朋友走，他们准备去哪我就去哪。', scores: { P: 2, E: 0 } },
    ],
  },
  {
    id: 'Q04',
    index: 4,
    text: '下课路过一个社团摊位，他们正在做你没见过的小东西。你会？',
    dimensions: ['E', 'F'],
    options: [
      { id: 'Q04-A', text: '过去试一下，做得丑也无所谓。', scores: { E: 3, F: 2 } },
      { id: 'Q04-B', text: '拍一下摊位介绍，想着以后有空再看。', scores: { E: 1, F: 1 } },
      { id: 'Q04-C', text: '看两眼，发现不是自己的菜就继续走。', scores: { E: 0, F: 1 } },
      { id: 'Q04-D', text: '问摊主：“这个最好玩的地方是什么？”', scores: { E: 3, F: 3 } },
    ],
  },
  {
    id: 'Q05',
    index: 5,
    text: '室友都说一部电影很难看，但你看预告还挺喜欢。你会？',
    dimensions: ['F', 'A'],
    options: [
      { id: 'Q05-A', text: '再看一点简介和片段，最后自己决定。', scores: { F: 2, A: 3 } },
      { id: 'Q05-B', text: '大家都这么说，那就先算了。', scores: { F: 1, A: 0 } },
      { id: 'Q05-C', text: '这个题材就是戳我，今晚自己看。', scores: { F: 3, A: 3 } },
      { id: 'Q05-D', text: '我确实想看，但今天不想花两个小时，先收藏。', scores: { F: 2, A: 3 } },
    ],
  },
  {
    id: 'Q06',
    index: 6,
    text: '周末睡到中午，今天完全没安排。你醒来后最可能？',
    dimensions: ['A', 'R'],
    options: [
      { id: 'Q06-A', text: '洗漱换衣服，挑个地方直接出门。', scores: { A: 3, R: 3 } },
      { id: 'Q06-B', text: '继续躺着，等饿了或者有人叫我。', scores: { A: 0, R: 0 } },
      { id: 'Q06-C', text: '先处理一件一直拖着的事情，之后再决定去哪。', scores: { A: 3, R: 1 } },
      { id: 'Q06-D', text: '问朋友今天干什么，有合适的就加入。', scores: { A: 1, R: 2 } },
    ],
  },
  {
    id: 'Q07',
    index: 7,
    text: '在食堂碰见一个不太熟的同学，他正一个人吃饭。你会？',
    dimensions: ['R', 'S'],
    options: [
      { id: 'Q07-A', text: '点头打个招呼，然后自己找位置。', scores: { R: 1, S: 1 } },
      { id: 'Q07-B', text: '端着饭过去问一句：“一起吃吗？”', scores: { R: 2, S: 3 } },
      { id: 'Q07-C', text: '没对上眼神就算了，各吃各的也挺正常。', scores: { R: 1, S: 0 } },
      { id: 'Q07-D', text: '主动打招呼，如果身边还有朋友就顺手介绍一下。', scores: { R: 3, S: 3 } },
    ],
  },
  {
    id: 'Q08',
    index: 8,
    text: '朋友群已经安静好几天了，你刷到附近今晚有个活动。你会？',
    dimensions: ['S', 'P'],
    options: [
      { id: 'Q08-A', text: '直接说：“我今晚去，想来的跟上。”', scores: { S: 3, P: 3 } },
      { id: 'Q08-B', text: '把海报丢进群里，不额外说什么。', scores: { S: 1, P: 2 } },
      { id: 'Q08-C', text: '问一句：“这个看起来还行，有人想一起吗？”', scores: { S: 3, P: 2 } },
      { id: 'Q08-D', text: '自己先收藏，等别人哪天提起再说。', scores: { S: 0, P: 0 } },
    ],
  },
  {
    id: 'Q09',
    index: 9,
    text: '回宿舍最熟悉的路突然封了。你会？',
    dimensions: ['P', 'E'],
    options: [
      { id: 'Q09-A', text: '跟着人多的方向走，大概率不会错。', scores: { P: 2, E: 0 } },
      { id: 'Q09-B', text: '打开导航，找最稳的备用路线。', scores: { P: 1, E: 0 } },
      { id: 'Q09-C', text: '试试旁边一条以前没走过的小路。', scores: { P: 2, E: 2 } },
      { id: 'Q09-D', text: '反正都绕路了，干脆多走一点看看附近有什么。', scores: { P: 3, E: 3 } },
    ],
  },
  {
    id: 'Q10',
    index: 10,
    text: '朋友很兴奋地给你安利一个你完全没听过的兴趣。你会？',
    dimensions: ['E', 'F'],
    options: [
      { id: 'Q10-A', text: '问他：“你最喜欢它的地方是什么？”', scores: { E: 2, F: 3 } },
      { id: 'Q10-B', text: '听着挺有意思，但暂时不会去试。', scores: { E: 1, F: 2 } },
      { id: 'Q10-C', text: '记下来，哪天找机会自己体验一次。', scores: { E: 3, F: 3 } },
      { id: 'Q10-D', text: '听完就算了，我大概率不会再研究。', scores: { E: 0, F: 1 } },
    ],
  },
  {
    id: 'Q11',
    index: 11,
    text: '今天心情很差，但你自己也说不清为什么。你通常先做什么？',
    dimensions: ['F', 'A'],
    options: [
      { id: 'Q11-A', text: '洗澡、收拾桌面或者下楼走一下，先改变状态。', scores: { F: 2, A: 3 } },
      { id: 'Q11-B', text: '继续刷手机，等这个感觉自己过去。', scores: { F: 0, A: 0 } },
      { id: 'Q11-C', text: '想一下今天到底发生了什么，找找是哪一刻开始不舒服。', scores: { F: 3, A: 2 } },
      { id: 'Q11-D', text: '找熟人吐槽几句，先把想说的话说出来。', scores: { F: 3, A: 1 } },
    ],
  },
  {
    id: 'Q12',
    index: 12,
    text: '想喝的奶茶店离宿舍大约 600 米。你会？',
    dimensions: ['A', 'R'],
    options: [
      { id: 'Q12-A', text: '等室友出门时让他顺便带。', scores: { A: 1, R: 0 } },
      { id: 'Q12-B', text: '自己走过去，买完直接回来。', scores: { A: 3, R: 2 } },
      { id: 'Q12-C', text: '点外卖，省下这二十分钟干别的。', scores: { A: 2, R: 0 } },
      { id: 'Q12-D', text: '把它当一个出门理由，买完再多走一圈。', scores: { A: 3, R: 3 } },
    ],
  },
  {
    id: 'Q13',
    index: 13,
    text: '第一次参加一个社团活动，走到门口发现里面全是生面孔。你会？',
    dimensions: ['R', 'S'],
    options: [
      { id: 'Q13-A', text: '先接一个小任务，让自己有事情做。', scores: { R: 3, S: 2 } },
      { id: 'Q13-B', text: '正常参加，但先坐在边上看看情况。', scores: { R: 2, S: 1 } },
      { id: 'Q13-C', text: '找旁边的人随便聊一句。', scores: { R: 2, S: 3 } },
      { id: 'Q13-D', text: '今天状态不太适合，就先离开，下次再参加。', scores: { R: 0, S: 0 } },
    ],
  },
  {
    id: 'Q14',
    index: 14,
    text: '和朋友吃完晚饭，他突然说要先回去了，但你还不想回。你会？',
    dimensions: ['S', 'P'],
    options: [
      { id: 'Q14-A', text: '一个人按原本的计划继续逛。', scores: { S: 0, P: 2 } },
      { id: 'Q14-B', text: '问另一个朋友有没有空出来碰一下。', scores: { S: 3, P: 2 } },
      { id: 'Q14-C', text: '不设计划，在附近随便走走，看到什么再决定。', scores: { S: 0, P: 3 } },
      { id: 'Q14-D', text: '那算了，跟他一起回去。', scores: { S: 0, P: 0 } },
    ],
  },
  {
    id: 'Q15',
    index: 15,
    text: '到了一个不熟的地方，事情提前办完，突然多出半天。你会？',
    dimensions: ['P', 'E'],
    options: [
      { id: 'Q15-A', text: '问一个熟悉这里的人：“附近有什么值得去？”然后直接去。', scores: { P: 2, E: 3 } },
      { id: 'Q15-B', text: '按导航回自己熟悉的地方。', scores: { P: 0, E: 0 } },
      { id: 'Q15-C', text: '搜评分最高、最不容易踩雷的一家店。', scores: { P: 1, E: 2 } },
      { id: 'Q15-D', text: '看哪条街顺眼就先走进去。', scores: { P: 3, E: 3 } },
    ],
  },
  {
    id: 'Q16',
    index: 16,
    text: '下课抬头，今天的晚霞特别好看。你通常会？',
    dimensions: ['E', 'F'],
    options: [
      { id: 'Q16-A', text: '停下来认真看一会儿。', scores: { E: 2, F: 3 } },
      { id: 'Q16-B', text: '看到了，但没什么特别反应，继续走。', scores: { E: 0, F: 0 } },
      { id: 'Q16-C', text: '拍下来发给一个人，说一句为什么觉得好看。', scores: { E: 3, F: 3 } },
      { id: 'Q16-D', text: '随手拍一张，然后继续赶路。', scores: { E: 1, F: 2 } },
    ],
  },
  {
    id: 'Q17',
    index: 17,
    text: '参加完一个大家都说“超好玩”的活动，但你自己的感觉其实很一般。你更可能？',
    dimensions: ['F', 'A'],
    options: [
      { id: 'Q17-A', text: '大家都挺开心，我也就不多说了。', scores: { F: 1, A: 0 } },
      { id: 'Q17-B', text: '不发评价，但自己知道这种活动可能不适合我。', scores: { F: 2, A: 2 } },
      { id: 'Q17-C', text: '想一下自己到底为什么没感觉，下次就知道怎么选了。', scores: { F: 3, A: 3 } },
      { id: 'Q17-D', text: '直接跟朋友说：“你们喜欢就好，我感觉一般。”然后继续做自己的事。', scores: { F: 3, A: 3 } },
    ],
  },
  {
    id: 'Q18',
    index: 18,
    text: '回过神来，你已经连续刷了四个小时手机。下一件事最可能是什么？',
    dimensions: ['A', 'R'],
    options: [
      { id: 'Q18-A', text: '再刷五分钟，然后五分钟不断续杯。', scores: { A: 0, R: 0 } },
      { id: 'Q18-B', text: '把手机放下，去洗澡或者收拾一下。', scores: { A: 3, R: 1 } },
      { id: 'Q18-C', text: '切去回消息、记待办或者处理点事情，但人还在原地。', scores: { A: 2, R: 0 } },
      { id: 'Q18-D', text: '把手机留在宿舍，下楼走十五分钟。', scores: { A: 3, R: 3 } },
    ],
  },
  {
    id: 'Q19',
    index: 19,
    text: '考试周晚上八点，今天的复习暂时告一段落。你更可能？',
    dimensions: ['R', 'S'],
    options: [
      { id: 'Q19-A', text: '找熟人一起吃点东西，回来继续复习。', scores: { R: 2, S: 3 } },
      { id: 'Q19-B', text: '教室、食堂、宿舍直线往返，不再额外安排东西。', scores: { R: 0, S: 0 } },
      { id: 'Q19-C', text: '拉个人下楼走十分钟，脑子放个风。', scores: { R: 3, S: 3 } },
      { id: 'Q19-D', text: '回宿舍和室友待在一起，不过大家各忙各的。', scores: { R: 1, S: 1 } },
    ],
  },
  {
    id: 'Q20',
    index: 20,
    text: '朋友突然给你发一句：“现在下楼。”你会？',
    dimensions: ['S', 'P'],
    options: [
      { id: 'Q20-A', text: '先下楼，见面以后再问发生了什么。', scores: { S: 3, P: 3 } },
      { id: 'Q20-B', text: '先问：“干嘛？多久？”知道以后再决定。', scores: { S: 2, P: 1 } },
      { id: 'Q20-C', text: '让他上来找我，我现在不太想出去。', scores: { S: 2, P: 0 } },
      { id: 'Q20-D', text: '没提前说就不去了，我已经安排好自己的时间。', scores: { S: 0, P: 0 } },
    ],
  },
  {
    id: 'Q21',
    index: 21,
    text: '食堂新开了一个窗口，还没有任何测评。今天你会怎么选？',
    dimensions: ['P', 'E'],
    options: [
      { id: 'Q21-A', text: '还是去老窗口，连吃什么都不用重新想。', scores: { P: 0, E: 0 } },
      { id: 'Q21-B', text: '看见一道没吃过的菜，点来试一下。', scores: { P: 2, E: 2 } },
      { id: 'Q21-C', text: '先看看别人端出来长什么样，再决定。', scores: { P: 1, E: 1 } },
      { id: 'Q21-D', text: '直接去新窗口，让老板推荐一道。', scores: { P: 3, E: 3 } },
    ],
  },
  {
    id: 'Q22',
    index: 22,
    text: '回想最近一个月的校园生活，你脑子里最先出现的是？',
    dimensions: ['E', 'F'],
    options: [
      { id: 'Q22-A', text: '一次和某个人真正聊过、见过或者一起做过的事情。', scores: { E: 2, F: 3 } },
      { id: 'Q22-B', text: '想了一会儿，好像没有特别具体的片段。', scores: { E: 0, F: 0 } },
      { id: 'Q22-C', text: '躺在宿舍刷到的一个特别好笑的视频。', scores: { E: 0, F: 1 } },
      { id: 'Q22-D', text: '一件原本没计划，但莫名其妙被卷进去的事。', scores: { E: 3, F: 3 } },
    ],
  },
  {
    id: 'Q23',
    index: 23,
    text: '老师让写一段自己的观后感。打开 AI 后，你通常会？',
    dimensions: ['F', 'A'],
    options: [
      { id: 'Q23-A', text: '先写几句自己真正记住的东西，再让 AI 帮我顺一下。', scores: { F: 3, A: 3 } },
      { id: 'Q23-B', text: '让 AI 先写一版，我挑能用的地方改。', scores: { F: 1, A: 0 } },
      { id: 'Q23-C', text: '让 AI 先问我几个问题，我回答完再自己往下写。', scores: { F: 3, A: 2 } },
      { id: 'Q23-D', text: '自己写完以后，让 AI 专门挑毛病，最后改不改我决定。', scores: { F: 3, A: 3 } },
    ],
  },
  {
    id: 'Q24',
    index: 24,
    text: '一节课比预计早结束一个小时。你最可能把这一小时给谁？',
    dimensions: ['A', 'R'],
    options: [
      { id: 'Q24-A', text: '留在教学楼，把一件一直拖着的事情做完。', scores: { A: 3, R: 1 } },
      { id: 'Q24-B', text: '跟朋友走，他们去哪我去哪。', scores: { A: 1, R: 2 } },
      { id: 'Q24-C', text: '先回宿舍，回去以后再决定。', scores: { A: 0, R: 0 } },
      { id: 'Q24-D', text: '选一个自己现在想去的地方，直接过去。', scores: { A: 3, R: 3 } },
    ],
  },
]

/** 题目总数 */
export const TOTAL_QUESTIONS = QUESTIONS.length
