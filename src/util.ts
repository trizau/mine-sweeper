/**
 * 生成一个随机数
 * @param min 最小值
 * @param max 最大值
 */
export function rand(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}

/**
 * 检查指定坐标是否在集合之中
 * @param x
 * @param y
 * @param coord
 * @returns
 */
export function checkInCoord(
  x: number,
  y: number,
  coord: { x: number; y: number }[]
): boolean {
  for (const item of coord) {
    if (x == item.x && y == item.y) return true;
  }
  return false;
}

// 获取一个随机名字
export function randName(): string {
  const adj = [
    "可爱的",
    "愤怒的",
    "傻不啦叽的",
    "天真烂漫的",
    "忧郁的",
    "力大无穷的",
    "卑微的",
    "傲娇的",
    "贫穷的",
    "气质非凡的",
    "帅气的",
    "天生丽质的",
    "呆呆的",
    "迷茫的",
    "聪明的",
    "可怜巴巴的",
    "热血的",
  ];
  const name = [
    "喜羊羊",
    "美羊羊",
    "懒羊羊",
    "红太狼",
    "小灰灰",
    "卡布达",
    "金龟次郎",
    "海绵宝宝",
    "派大星",
    "章鱼哥",
    "蟹老板",
    "老孬蛋",
    "小精豆儿",
    "汤姆猫",
    "杰瑞",
    "哪鲁多!",
    "撒斯给!",
    "蜘蛛侠",
    "蝙蝠侠",
    "钢铁侠",
  ];
  return (
    adj[Math.floor(Math.random() * adj.length)] +
    name[Math.floor(Math.random() * name.length)]
  );
}

export function getQueryParam(name: string): string | undefined {
  const search = location.search.replace(/^\?/, "").split("&");
  for (const item of search) {
    const _item = item.split("=");
    if (_item[0] === name) return _item[1];
  }
}
