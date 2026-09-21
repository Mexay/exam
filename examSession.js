// 登录会话变化使旧请求失效；解封只使旧违规状态失效，不中断当前答题计时。
export const examSession = { version: 0, violationVersion: 0 };
