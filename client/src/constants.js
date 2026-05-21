export const PIPELINE_STAGES = [
  { id: 'leads', name: '线索', color: 'bg-slate-100 dark:bg-slate-800', textColor: 'text-slate-600 dark:text-slate-300', dotColor: 'bg-slate-400' },
  { id: 'contact', name: '初步接触', color: 'bg-sky-50 dark:bg-sky-900/30', textColor: 'text-sky-600 dark:text-sky-300', dotColor: 'bg-sky-400' },
  { id: 'needs', name: '需求确认', color: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-300', dotColor: 'bg-blue-400' },
  { id: 'followup', name: '跟单跟进', color: 'bg-indigo-50 dark:bg-indigo-900/30', textColor: 'text-indigo-600 dark:text-indigo-300', dotColor: 'bg-indigo-400' },
  { id: 'proposal', name: '方案提交', color: 'bg-violet-50 dark:bg-violet-900/30', textColor: 'text-violet-600 dark:text-violet-300', dotColor: 'bg-violet-400' },
  { id: 'negotiation', name: '打单谈判', color: 'bg-amber-50 dark:bg-amber-900/30', textColor: 'text-amber-600 dark:text-amber-300', dotColor: 'bg-amber-400' },
  { id: 'contract', name: '合同签署', color: 'bg-orange-50 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-300', dotColor: 'bg-orange-400' },
  { id: 'won', name: '赢单', color: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-300', dotColor: 'bg-emerald-400' },
  { id: 'lost', name: '输单', color: 'bg-red-50 dark:bg-red-900/30', textColor: 'text-red-600 dark:text-red-300', dotColor: 'bg-red-400' },
];

export const ACTIVITY_TYPES = [
  { id: 'call', name: '电话沟通', icon: '📞' },
  { id: 'visit', name: '上门拜访', icon: '🏢' },
  { id: 'meeting', name: '线上会议', icon: '💻' },
  { id: 'presentation', name: '方案讲解', icon: '📊' },
  { id: 'demo', name: '产品演示', icon: '🖥️' },
  { id: 'dinner', name: '商务宴请', icon: '🍽️' },
  { id: 'gift', name: '礼品赠送', icon: '🎁' },
  { id: 'event', name: '市场活动', icon: '📣' },
];

export const EXPENSE_TYPES = [
  { id: 'travel', name: '差旅费', icon: '✈️' },
  { id: 'dinner', name: '商务宴请费', icon: '🍽️' },
  { id: 'gift', name: '礼品费', icon: '🎁' },
  { id: 'event', name: '市场活动费', icon: '📣' },
  { id: 'development', name: '开发成本', icon: '💻' },
  { id: 'other', name: '其他费用', icon: '📋' },
];

export const LOSS_REASONS = ['价格因素', '产品功能不足', '竞品优势', '客户内部原因', '预算取消', '决策周期过长', '其他'];
