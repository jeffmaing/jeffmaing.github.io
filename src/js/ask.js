// Show one answer at a time when a visitor selects a question.
// Every career fact here follows his fact base; figures he has not confirmed are left out.
import { prefersReduced } from './env.js';

const STACKED = '(max-width: 1023px)';

const ANSWERS = [
  {
    "q": "你是谁？",
    "a": [
      "我是麻明，在汽车行业工作了 19 年，做过经销商运营、培训和客户体验项目，也独立开发业务工具。"
    ]
  },
  {
    "q": "你做过哪些车企项目？",
    "a": [
      "代表项目包括奔驰新店开业辅导、一汽-大众售后经营看板、雷克萨斯经销商培训和保时捷客户需求解析系统设计。"
    ]
  },
  {
    "q": "现在主要做什么？",
    "a": [
      "我主要做经销商运营、培训和客户体验相关的 AI 项目，把业务需求转成可以使用的流程和工具。"
    ]
  },
  {
    "q": "你在安永做过什么？",
    "a": [
      "六年多里，我为 20 多家车企做售后运营、审计和数字化转型咨询，其中包括一汽-大众售后经营看板和奔驰配件部门操作手册。"
    ]
  },
  {
    "q": "你在西非做过哪些渠道工作？",
    "a": [
      "我在比亚迪负责西非市场相关渠道工作，寻找和评估潜在经销商，并参与商务沟通。"
    ]
  },
  {
    "q": "你如何与业务、IT 和供应商协作？",
    "a": [
      "我和业务团队确认场景及使用要求，再与 IT 和供应商对齐数据、系统接口与交付内容。雷克萨斯教育平台就是这样推进的。"
    ]
  },
  {
    "q": "怎么判断一个场景是否适合用 AI？",
    "a": [
      "先看卡点能否用流程调整或现有系统解决。如果要做 AI 试点，先明确输入、可接受的输出和人工复核要求，再用实际任务验证。"
    ]
  },
  {
    "q": "你在项目里通常负责什么？",
    "a": [
      "具体分工因项目而异。我做过业务诊断、运营标准、产品需求定义，也牵头过业务、培训、IT 和供应商一起交付。"
    ]
  },
  {
    "q": "怎么交流项目需求？",
    "a": [
      "可通过页面底部的邮箱或电话联系我。初次交流可以从现有流程、遇到的卡点或试点设想谈起。"
    ]
  }
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
