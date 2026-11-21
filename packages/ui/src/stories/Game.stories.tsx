import { createSignal, For } from "solid-js";
import { type Card, cardKey, Hand, HeartBroken, hand, PlayerSeat, PlayingCard, sampleHand, ScoreTable, TrickArea } from "../game";

export default { title: "Game", parameters: { layout: "padded" } };

const Felt = (p: { children: any; class?: string }) => (
  <div class={`flex flex-col items-center gap-6 rounded-xl p-6 ${p.class ?? ""}`} style={{ background: "var(--table)" }}>{p.children}</div>
);

export const Cards = {
  name: "Playing card",
  render: () => (
    <Felt>
      <div class="flex flex-wrap justify-center gap-3">
        <For each={hand("AS", "KH", "QS", "JD", "10C", "2C")}>{(c) => <PlayingCard card={c} />}</For>
        <PlayingCard faceDown />
      </div>
      <div class="flex items-end gap-3">
        <PlayingCard card={{ rank: "Q", suit: "S" }} width={40} />
        <PlayingCard card={{ rank: "Q", suit: "S" }} width={56} />
        <PlayingCard card={{ rank: "Q", suit: "S" }} width={80} />
        <PlayingCard card={{ rank: "Q", suit: "S" }} width={110} />
      </div>
      <div class="flex gap-3 pt-4">
        <PlayingCard card={{ rank: "5", suit: "H" }} selected />
        <PlayingCard card={{ rank: "5", suit: "D" }} disabled />
      </div>
      <p class="text-[0.8125rem] text-on-table/80">Sizes · selected · not playable</p>
    </Felt>
  ),
};

export const DraggableHand = {
  name: "Hand · drag or tap to play",
  render: () => {
    const [cards, setCards] = createSignal(sampleHand);
    const [last, setLast] = createSignal<Card>();
    const [drag, setDrag] = createSignal(false);
    const [over, setOver] = createSignal(false);
    return (
      <Felt class="max-w-[430px]">
        <TrickArea cards={last() ? { south: last() } : {}} dropActive={drag()} dropHover={over()} />
        <p class="text-center text-[0.8125rem] text-on-table/85">Drag a card up onto the table, or tap twice. Clubs only (follow suit); others are dimmed.</p>
        <div class="w-full">
          <Hand
            cards={cards()}
            playable={(c) => c.suit === "C"}
            onPlay={(c) => {
              setLast(c);
              setCards(cards().filter((x) => cardKey(x) !== cardKey(c)));
            }}
            onDragChange={(d, o) => {
              setDrag(d);
              setOver(o);
            }}
          />
        </div>
        <button type="button" class="text-[0.8125rem] text-on-table underline" onClick={() => { setCards(sampleHand); setLast(undefined); }}>Reset</button>
      </Felt>
    );
  },
};

export const PassSelection = {
  name: "Hand · select 3 to pass",
  render: () => {
    const [sel, setSel] = createSignal<Card[]>([]);
    return (
      <Felt class="max-w-[430px]">
        <p class="text-on-table">{sel().length}/3 selected</p>
        <Hand
          cards={sampleHand}
          mode="pass"
          selected={sel()}
          onToggle={(c) => {
            const has = sel().some((s) => cardKey(s) === cardKey(c));
            setSel(has ? sel().filter((s) => cardKey(s) !== cardKey(c)) : sel().length < 3 ? [...sel(), c] : sel());
          }}
        />
      </Felt>
    );
  },
};

export const Trick = {
  name: "Trick area",
  render: () => (
    <Felt>
      <TrickArea cards={{ north: { rank: "K", suit: "C" }, west: { rank: "9", suit: "C" }, east: { rank: "Q", suit: "S" }, south: { rank: "A", suit: "C" } }} winner="south" />
      <p class="text-[0.8125rem] text-on-table/80">Full trick · winner highlighted</p>
      <TrickArea cards={{}} dropActive />
      <p class="text-[0.8125rem] text-on-table/80">Empty · drop zone while dragging</p>
    </Felt>
  ),
};

export const Seats = {
  name: "Player seat",
  render: () => (
    <Felt>
      <div class="flex flex-wrap justify-center gap-8">
        <PlayerSeat name="Mint" cards={8} points={4} />
        <PlayerSeat name="Tan" cards={9} points={0} active />
        <PlayerSeat name="Bot Ace" bot cards={9} points={13} />
        <PlayerSeat name="Ploy" cards={7} points={2} offline />
      </div>
      <p class="text-[0.8125rem] text-on-table/80">Idle · active turn · bot · reconnecting</p>
    </Felt>
  ),
};

export const Scores = {
  name: "Score table",
  render: () => (
    <div class="bg-app w-[380px] rounded-xl p-4">
      <ScoreTable players={["You", "Tan", "Mint", "Bot Ace"]} rounds={[[3, 10, 0, 13], [0, 26, 0, 0], [8, 0, 5, 13]]} />
    </div>
  ),
};

export const HeartsBroken = {
  name: "Heart broken moment",
  render: () => (
    <Felt class="h-64 justify-center">
      <HeartBroken />
    </Felt>
  ),
};
