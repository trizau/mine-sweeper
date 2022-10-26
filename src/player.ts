import { io } from "socket.io-client";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { useMine } from "./mine";
import { randName, getQueryParam } from "./util";

export const useOnline = () => {
  const mineGame = useMine();

  type player = {
    id: string;
    name: string;
    isMaster: boolean;
    isPlayer: boolean; // 是否为当前游戏玩家
  };
  const statusLog = reactive<string[]>([]);
  const status = computed(() => statusLog[statusLog.length - 1]);
  const room = ref<string>();
  const shareLink = computed(() => {
    if (room.value || player.id) {
      return location.origin + "?room=" + (room.value || player.id);
    }
  });
  const master = computed(() => playerList.find((item) => item.isMaster));

  const player = reactive<player>({
    id: "",
    name: "",
    isMaster: false,
    isPlayer: false,
  });
  const playerList = reactive<player[]>([]);

  // "https://hk.if-she.com"
  const socket = io("https://hk.if-she.com", {
    autoConnect: false,
  });

  // 通知其他人自己来了
  function noticeOther() {
    // 通知房主自己来了
    socket.send(
      {
        action: "get-online",
        room: room.value,
      },
      (res: any) => {
        if (typeof res === "string") res = JSON.parse(res);
        socket.send({
          msg: { id: player.id, type: "hi-master", player },
          user: res[0],
        });
      }
    );
  }
  // 登录
  function login() {
    socket.emit(
      "login",
      socket.id,
      (res: { code: number } & Record<string, any>) => {
        if (res.code) {
          statusLog.push("登录服务器失败，因为:" + res.msg);
        } else {
          statusLog.push("✅");
          // 登录完成
          player.id = res.id;
          if (!localStorage.getItem("gen_name")) {
            localStorage.setItem("gen_name", randName());
          }
          const name = localStorage.getItem("gen_name") || "";
          player.name = name;

          const queryRoom = getQueryParam("room");
          if (queryRoom) {
            room.value = queryRoom;
            // 加入房间
            socket.send(
              {
                action: "join",
                user: player.id,
                room: queryRoom,
              },
              noticeOther
            );
          }
        }
      }
    );
  }
  socket.on("connect", login);

  function syncGame(data: object) {
    nextTick(() => {
      socket.send({
        msg: { type: "sync-game", player, data },
        room: room.value,
      });
    });
  }

  socket.on("message", (msg: Record<string, any>) => {
    if (msg.id === player.id) return;
    if (msg.type === "join-room") {
      statusLog.push(msg.player.name + "来了😊");
    }
    if (msg.type === "hi-master") {
      console.log("x");

      // 只有房主可以收到的
      if (!player.isMaster) {
        // statusLog.push("您已经成为新的房主");
        playerList.splice(0, playerList.length);
        playerList.push(player);
      }
      player.isMaster = true;
      if (!playerList.find((item) => item.id === msg.player.id)) {
        playerList.push(msg.player);
        socket.send({
          msg: { id: player.id, type: "update-room-users", playerList },
          room: room.value,
        });
      }
    }
    if (msg.type === "update-room-users") {
      // 收到房主的通知，更新游戏成员列表
      playerList.splice(0, playerList.length);
      playerList.push(...msg.playerList);
    }

    // 玩家同步游戏
    if (msg.type === "sync-game") {
      console.log(msg);

      //   if (msg.player.id === player.id) statusLog.push("你进行了游戏");
      if (msg.data.gameStatus) {
        mineGame.gameStatus.value = msg.data.gameStatus;
      }
      if (msg.data.gameLevel) {
        mineGame.gameLevel.value = msg.data.gameLevel * 1;
      }
      nextTick(() => {
        if (msg.data.mineGrid) {
          mineGame.mineGrid.splice(
            0,
            mineGame.mineGrid.length,
            ...msg.data.mineGrid
          );
        }
        if (msg.data.markedGrid) {
          // statusLog.push("【" + msg.player.name + "】标记了一个地雷");
          mineGame.markedGrid.splice(
            0,
            mineGame.markedGrid.length,
            ...msg.data.markedGrid
          );
        }
        if (msg.data.openedGrid) {
          statusLog.push("【" + msg.player.name + "】操作了游戏进度");
          mineGame.openedGrid.splice(
            0,
            mineGame.openedGrid.length,
            ...msg.data.openedGrid
          );
        }
      });
    }
  });
  socket.on("room-user-disconnect", (id: string) => {
    statusLog.push(
      playerList.find((item) => item.id === id)?.name + "离开了房间"
    );
    if (player.isMaster) {
      // 房主需要负责通知其他人更新在线成员
      const newArr = playerList.filter((item) => item.id !== id);
      playerList.splice(0, playerList.length);
      playerList.push(...newArr);
      socket.send({
        msg: {
          id: player.id,
          type: "update-room-users",
          playerList,
        },
        room: room.value,
      });
    } else {
      // 其他人重新通知房主自己还在线
      noticeOther();
    }
  });

  onMounted(() => {
    socket.connect();
  });
  onUnmounted(() => {
    socket.disconnect();
  });
  return { status, player, playerList, shareLink, master, syncGame, mineGame };
};
