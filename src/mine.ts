import { reactive, watch, ref, markRaw } from "vue";
import { rand, checkInCoord } from "./util";

export const useMine = () => {
  const board = reactive({
    cols: 9, // 棋盘高度
    rows: 9, // 棋盘宽度
    mine: 10, // 地雷个数
  });

  const gameLevel = ref<number>(1);
  watch(gameLevel, () => {
    if (gameLevel.value === 1) {
      board.cols = 9;
      board.rows = 9;
      board.mine = 10;
    } else if (gameLevel.value === 2) {
      board.cols = 10;
      board.rows = 10;
      board.mine = 20;
    } else if (gameLevel.value === 3) {
      board.cols = 11;
      board.rows = 11;
      board.mine = 30;
    }
  });

  let analTimer = 0;

  const anal = reactive({
    time: 0,
  });
  const gameStatus = ref<"over" | "win" | "gameing" | "ready">("ready");

  const mineGrid = reactive<{ x: number; y: number }[]>([]); // 地雷所在位置

  const openedGrid = reactive<{ x: number; y: number; mineCount?: number }[]>(
    []
  ); // 点开的区域
  const markedGrid = reactive<{ x: number; y: number }[]>([]); // 手动标记的地雷的位置

  watch(gameStatus, (newVal) => {
    if (newVal === "gameing") {
      console.log("初始化游戏", gameStatus.value);
      // 开始新游戏
      anal.time = 0;
      mineGrid.splice(0, mineGrid.length);
      markedGrid.splice(0, markedGrid.length);
      openedGrid.splice(0, openedGrid.length);
      clearInterval(analTimer);
      analTimer = setInterval(() => {
        anal.time++;
      }, 1000);
    } else {
      clearInterval(analTimer);
    }
  });

  // 初始化地雷坐标
  function initMine(init_x: number, init_y: number) {
    mineGrid.splice(0, mineGrid.length);
    for (let i = 0; i < board.mine; i++) {
      while (true) {
        const x = rand(1, board.cols);
        const y = rand(1, board.rows);
        if (x === init_x || y === init_y) continue;
        if (checkInCoord(x, y, mineGrid)) continue; // 不会生成在同一个位置
        mineGrid.push(markRaw({ x, y }));
        break;
      }
    }
  }

  // 获取被点开的格子的信息, 用来查看翻开的格子的周围有多少个雷
  function getGridInfo(x: number, y: number) {
    for (const key in openedGrid) {
      const item = openedGrid[key];
      if (item.x === x && item.y === y) {
        if (!item.mineCount) item.mineCount = undefined;
        return { ...item, key };
      }
    }
  }
  /**
   * 翻开格子
   * @param x
   * @param y
   * @param diff 是否展开周围格子
   */
  function openMine(x: number, y: number, diff: boolean = true) {
    if (checkInCoord(x, y, markedGrid)) return;

    if (!mineGrid.length) {
      // 确保第一次一定不是雷
      initMine(x, y);
    }
    if (checkInCoord(x, y, mineGrid)) {
      gameStatus.value = "over";
      return;
    }

    // 检查指定坐标周围雷的个数
    function checkMineCount(x: number, y: number): number {
      let count = 0;
      for (let check_y = y - 1; check_y <= y + 1; check_y++) {
        for (let check_x = x - 1; check_x <= x + 1; check_x++) {
          if (getGridInfo(check_x, check_y)) continue;
          if (
            check_x < 1 ||
            check_y < 1 ||
            check_x > board.rows ||
            check_y > board.cols
          )
            continue;

          if (check_x == x && check_y === y) continue;
          if (checkInCoord(check_x, check_y, mineGrid)) {
            count++;
          } else if (diff) {
            const result = openMine(check_x, check_y, false);
            if (result?.mineCount === 0) {
              // console.log(check_x, check_y, result);
              openMine(check_x, check_y, true);
            }
          }
        }
      }
      return count;
    }
    const mineCount = checkMineCount(x, y);
    const result = { x, y, mineCount };
    if (!getGridInfo(x, y)) openedGrid.push(result);

    // console.log(openedGrid.length, board.rows * board.cols);
    // 游戏胜利
    if (openedGrid.length >= board.rows * board.cols - board.mine) {
      gameStatus.value = "win";
    }
    return result;
  }

  return {
    gameLevel,
    board,
    anal,
    gameStatus,
    mineGrid,
    markedGrid,
    openedGrid,
    getGridInfo,
    openMine,
  };
};
