// "Ask me": answers he wrote himself, in his own words, shown one at a time when a question is touched.
// Every career fact here follows his fact base; figures he has not confirmed are left out.
import { prefersReduced } from './env.js';

const STACKED = '(max-width: 1023px)';

const ANSWERS = [
  {
    q: '你是谁？',
    a: [
      '我是麻明，在汽车行业干了 19 年。',
      '从比亚迪、奔驰、英菲尼迪，到安永、易车，到现在在港泓咨询做 AI 产品方向。',
      '想了解哪段经历，直接问就行。',
    ],
  },
  {
    q: '你做过什么？',
    a: [
      '核心就做一件事：让工作变得更高效。',
      '在安永六年多，服务 20 多家车企。在奔驰搭辅导体系。在英菲尼迪建立销售运营标准。在易车做 AI 混剪视频产品。现在把 AI 做进经销商培训和客户体验，自己也搭智能体。',
      '具体哪段想听，你问我。',
    ],
  },
  {
    q: '你的经历？',
    a: [
      '19 年汽车行业，换了几个地方，每次都在往离 AI 更近的地方走。',
      '07 年毕业进比亚迪，去西非做渠道。之后在一汽丰田，把新店标准导进网络。11 年到奔驰，搭辅导体系。14 年去东风英菲尼迪，定验收标准，建销售运营标准。17 年进安永，做了六年多咨询。24 年去易车，做 AI 混剪视频产品。25 年到港泓，把 AI 做进培训和客户体验。',
      '不是转行，是进化。每次换地方，都在叠加新能力。',
    ],
  },
  {
    q: '现在做什么？',
    a: [
      '在港泓咨询做咨询总监（AI 产品方向）。',
      '雷克萨斯的 300 多小时课程，我们把它变成了可以实时问答的学习，培训完成率提升 45%。',
      '工作里重复的事，我写智能体来做，一共 9 个。不是说 AI 取代了我，是我学会了指挥 AI 干活。',
    ],
  },
  {
    q: '在安永做什么？',
    a: [
      '六年多，做汽车行业的售后运营、审计和数字化转型咨询，服务 20 多家车企。',
      '一汽-大众的售后 BI 看板，200 多个核心经营指标，是那段时间做的。',
    ],
  },
  {
    q: '为什么从安永出来？',
    a: [
      '第一次用 ChatGPT，我的反应不是「挺好玩」，是「以前的工作方式要被颠覆了」。',
      '后来老同事一句话：来易车吧，我们也在搞 AI。就这么去了。',
      '出来之后，世界变大了：外网模型随便用，智能代理自己搭。',
    ],
  },
  {
    q: '西非是怎么回事？',
    a: [
      '07 年刚毕业，被比亚迪派到西非开拓市场，跑了贝宁、马里、喀麦隆三个国家。',
      '找潜在的经销商，评估合作伙伴，谈商务。那段经历让我很早就理解了什么叫「从 0 到 1」：没有现成的模板，没有成熟的体系，全靠自己摸索。',
      '后来做奔驰辅导体系、做安永咨询，那种从零搭建的能力，都是从西非练出来的。',
    ],
  },
  {
    q: '你的核心竞争力？',
    a: [
      '一句话：懂业务的没我懂 AI，懂 AI 的没我懂业务。',
      '这个行业里比我懂 AI 的人，没我懂业务；比我懂业务的人，没我懂 AI。',
      '护城河不是技术，是经验加工具。不是转行，是进化。',
    ],
  },
  {
    q: '不写代码怎么做项目？',
    a: [
      '我不会写代码，一行都不会。但我会拆问题。',
      '一个大问题 AI 干不了。我能把它拆成：先做一个看效果；确认颜色、字体、对齐；再批量处理剩下的；加导航；最后测试调整。每一步 AI 都能干。',
      '关键是会说人话，不需要会说代码。AI 出代码，我看效果，说哪里要改。不是技术活，是思维方式的转变。',
    ],
  },
  {
    q: 'AI 怎么做？',
    a: [
      '我的 AI 工作分三个阶段。',
      '先是了解：知道大模型能写文案、做分析、出 PPT。然后是使用：把它嵌进日常工作，AI 出初稿，我做判断。现在是搭工作流：用各种智能代理让 AI 替我跑数据、监控、出报告。',
      '不是工具变了，是思维方式变了。以前是「我来做」，现在是「我教 AI 做」。',
    ],
  },
  {
    q: 'AI 能替代人吗？',
    a: [
      'AI 不能替代人，但能替代不会用 AI 的人。',
      'AI 能写代码，但做不出好的排版；能翻译，但做不出判断。最重要的是，AI 不会拆问题。拆问题这个能力，AI 没有，人有。',
      'AI 不是魔法棒，是放大镜。你业务逻辑清晰，AI 放大你的优势；你逻辑混乱，AI 只会把混乱放大。',
    ],
  },
  {
    q: '你和普通 AI 有什么不同？',
    a: [
      'AI 能做很多事，但有一件事它做不了：判断。',
      '什么叫好、什么叫差、什么指标要加、什么数据是假的，这些判断力 AI 没有，我有。大模型读过所有报告，但没去过现场。它知道数据，但不知道数据背后的人和事。',
      '这才是我的价值。不是会用 AI，是知道 AI 该干什么、不该干什么。',
    ],
  },
  {
    q: '怎么联系？',
    a: ['直接找麻明。', '电话：185 1359 5306。邮箱：jeffmaming@163.com。北京。', '欢迎聊聊 AI 在汽车行业能干什么。'],
  },
];

export function initAsk(scroll) {
  const chips = [...document.querySelectorAll('.ask-chips .chip')];
  const question = document.getElementById('ask-q');
  const answer = document.getElementById('ask-a');
  const panel = document.getElementById('ask-panel');
  if (!chips.length || !question || !answer || !panel) return;

  const reduce = prefersReduced();

  chips.forEach((chip, index) => {
    const entry = ANSWERS[index];
    if (!entry) {
      chip.hidden = true;
      return;
    }
    chip.addEventListener('click', () => {
      chips.forEach((other, k) => {
        other.classList.toggle('is-on', k === index);
        other.setAttribute('aria-pressed', String(k === index));
      });
      question.textContent = entry.q;
      answer.replaceChildren(
        ...entry.a.map((line) => {
          const paragraph = document.createElement('p');
          paragraph.textContent = line;
          return paragraph;
        }),
      );
      if (!reduce) {
        answer.classList.remove('is-in');
        void answer.offsetWidth;
        answer.classList.add('is-in');
      }
      // stacked layouts keep the answer above the questions: bring it back if the tap scrolled past it
      if (window.matchMedia(STACKED).matches) {
        const bar = document.getElementById('nav')?.offsetHeight ?? 0;
        if (panel.getBoundingClientRect().top < bar) scroll?.to(panel, -(bar + 12));
      }
    });
  });
}
