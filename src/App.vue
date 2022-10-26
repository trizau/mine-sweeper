<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch } from "vue";
import { useOnline } from "./player";
import { checkInCoord } from "./util";

// const {
//   board,
//   anal,
//   gameStatus,
//   mineGrid,
//   markedGrid,
//   openedGrid,
//   getGridInfo,
//   openMine,
// } = useMine();
const {
  mineGame: {
    gameLevel,
    board,
    anal,
    gameStatus,
    mineGrid,
    markedGrid,
    openedGrid,
    getGridInfo,
    openMine,
  },
  status,
  playerList,
  player,
  shareLink,
  syncGame,
} = useOnline();

const showQrImg = ref<boolean>(false);

watch(gameLevel, () => {
  syncGame({ gameLevel: gameLevel.value });
});

const startGameButtonText = computed(() => {
  const text = {
    ready: "😊Start Game",
    win: "😘You Win! Restart",
    over: "😒You los, Restart",
    gameing: "...",
  };
  return text[gameStatus.value];
});

watch(gameStatus, () => {
  syncGame({
    gameStatus: gameStatus.value,
    // markedGrid,
    // openedGrid,
  });
});

// 长按标记地雷，点击翻开格子
let clickTimer = -1;
function clickStart(x: number, y: number) {
  if (gameStatus.value === "win" || gameStatus.value === "over") return;
  if (gameStatus.value !== "gameing") gameStatus.value = "gameing";
  clickTimer = setTimeout(() => {
    clickTimer = -1;
    const k = markedGrid.findIndex((item) => item.x === x && item.y === y);
    if (k !== -1) {
      markedGrid.splice(k, 1);
    } else if (!checkInCoord(x, y, openedGrid)) {
      markedGrid.push(markRaw({ x, y }));
    }
    syncGame({ markedGrid });
  }, 250);
}
function clickEnd(x: number, y: number) {
  if (gameStatus.value !== "gameing") return;
  if (clickTimer !== -1) {
    clearTimeout(clickTimer);
    openMine(x, y);
    syncGame({ openedGrid, mineGrid });
  }
}
</script>

<template>
  <div id="anal">
    <div>⏱️{{ anal.time }}</div>
    &emsp;&emsp;&emsp;
    <div>💣{{ markedGrid.length }}/{{ board.mine }}</div>
  </div>
  <div style="text-align: center">
    <input
      :disabled="gameStatus === 'gameing'"
      type="range"
      min="1"
      max="3"
      step="1"
      v-model="gameLevel"
    />
  </div>
  <div id="board">
    <div class="row" v-for="(y, y_key) of board.rows" :key="y_key">
      <div
        v-for="(x, x_key) of board.cols"
        :key="x_key"
        @touchstart="clickStart(x, y)"
        @touchend="clickEnd(x, y)"
        @mousedown="clickStart(x, y)"
        @mouseup="clickEnd(x, y)"
        :x="x"
        :y="y"
        class="col"
        :class="[
          checkInCoord(x, y, openedGrid) && 'open',
          checkInCoord(x, y, markedGrid) && 'mark',
          gameStatus === 'over' && checkInCoord(x, y, mineGrid) && 'boom',
        ]"
      >
        <span v-if="checkInCoord(x, y, openedGrid)">
          {{ getGridInfo(x, y)?.mineCount }}
        </span>
      </div>
    </div>
  </div>

  <div style="text-align: center" v-if="gameStatus === 'win'">✌you win✌</div>

  <div
    v-if="gameStatus !== 'gameing'"
    @click="gameStatus = 'gameing'"
    class="buttons"
  >
    <div class="button" id="restart">{{ startGameButtonText }}</div>
  </div>
  <div id="players">
    <div
      @click="showQrImg = !showQrImg"
      style="font-weight: bold; text-shadow: 1px 1px 2px gray"
    >
      {{ status }}
    </div>
    <br />
    <div
      v-for="item of playerList"
      :key="item.id"
      :class="[item.id == player.id && 'me', item.isPlayer && 'player']"
    >
      <!-- {{ item.isMaster ? "🏠" : "" }} -->
      <template v-if="item.id === player.id">
        {{ "->" + item.name + "<-" }}
      </template>
      <template v-else>
        {{ item.name }}
      </template>
    </div>

    <transition>
      <div
        id="share-code"
        @click="showQrImg = !showQrImg"
        v-if="showQrImg && shareLink"
      >
        <div>😘invite you friend join the game!</div>
        <!-- <div>{{ shareLink }}</div> -->
        <img
          style="width: 100%; height: 100%; pointer-events: none"
          :src="
            'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
            encodeURIComponent(shareLink)
          "
        />
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
@mixin center {
  display: flex;
  align-items: center;
  justify-content: center;
}

#anal {
  margin-top: 3vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

#board {
  margin-top: 15vh;
  .row {
    display: flex;
    justify-content: center;
    width: 100%;
    $border: 1px solid #88888844;
    .col {
      cursor: pointer;
      $size: 2.5rem;
      width: $size;
      height: $size;
      @include center();
      margin: 1.5px;
      border-radius: 3px;
      color: gray;
      transition: all 0.1s;
      box-shadow: rgba(0, 0, 0, 0.25) 0 0.0625em 0.0625em,
        rgba(0, 0, 0, 0.25) 0 0.125em 0.5em,
        rgba(255, 255, 255, 0.1) 0 0 0 1px inset;
      &.open {
        box-shadow: rgba(0, 0, 0, 0.25) 3px 3px 6px 0 inset,
          rgba(255, 255, 255, 0.5) -3px -3px 6px 1px inset;
      }
      &.mark {
        box-shadow: #d603034d 0 0 0 3px;
      }
      &.boom {
        box-shadow: rgb(214 3 3 / 30%) 0 -23px 25px 0 inset,
          rgb(214 3 3 / 30%) 0 -36px 30px 0 inset,
          rgb(214 3 3 / 30%) 0 -79px 40px 0 inset, rgb(214 3 3 / 30%) 0 2px 1px;
        &.mark::after {
          content: "X";
          display: block;
          color: white;
        }
      }
    }
  }
}

.buttons {
  padding-top: 2rem;
  display: flex;
  justify-content: center;
  .button {
    width: max-content;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    color: gray;
    box-shadow: rgba(0, 0, 0, 0.18) 0px 2px 4px;
    transition: all 0.1s;
    &:active {
      box-shadow: rgba(0, 0, 0, 0.18) 0px 2px 1px;
    }
  }
}

#players {
  padding-top: 3vh;
  text-align: center;
  font-size: 1.3rem;

  .player {
    background: pink;
  }
  .me {
    text-shadow: 1px 1px 6px gray;
  }
  #share-code {
    position: fixed;
    padding: 10px;
    top: 25%;
    left: calc(50% - 125px);
    width: 250px;
    box-shadow: rgba(0, 0, 0, 0.35) 0px 5px 15px;
    border-radius: 5px;
    background: white;
    transition: all 0.3s;

    &.v-leave-active,
    &.v-enter-active {
      top: 100vh;
      scale: 0.3;
    }
  }
}
</style>
