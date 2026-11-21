import { createSignal } from "solid-js";
import { AlertDialog, Button, Checkbox, Desktop, ListView, Menubar, RadioGroup, Toolbar, Window } from "../components";
import { cardKey, Hand, PlayerSeat, sampleHand, TrickArea, type Card } from "../game";
import { gameMenu } from "../screens/GameTableScreen";

export default { title: "XP", parameters: { layout: "fullscreen", forceTheme: "xp" } };

export const DesktopStory = {
  name: "Desktop · windows, taskbar, Start",
  render: () => {
    const [hand, setHand] = createSignal(sampleHand);
    const [trick, setTrick] = createSignal<Record<string, Card>>({ west: { rank: "9", suit: "C" }, north: { rank: "K", suit: "C" } });
    const [alert, setAlert] = createSignal(false);
    return (
      <div class="h-[100dvh] min-h-[640px]">
        <Desktop icons={[{ id: "hearts", label: "Hearts", icon: "♥" }, { id: "scores", label: "Score History", icon: "📊" }, { id: "options", label: "Options", icon: "⚙" }]}>
          <Window
            id="hearts"
            title="Hearts"
            icon="♥"
            x={110}
            y={20}
            width={520}
            height={470}
            menubar={<Menubar menus={[{ label: "&Game", items: gameMenu }, { label: "&Help", items: [{ label: "&About Hearts", onSelect: () => setAlert(true) }] }]} />}
            status={["Your turn: follow clubs", "Round 3", "Hearts not broken"]}
          >
            <div class="relative flex h-full flex-col items-center justify-between p-2" style={{ background: "var(--table)" }}>
              <PlayerSeat name="Mint" cards={8} points={4} />
              <div class="flex w-full items-center justify-between">
                <PlayerSeat name="Tan" cards={9} points={0} />
                <TrickArea cards={trick()} cardWidth={48} />
                <PlayerSeat name="Bot Ace" bot cards={9} points={13} />
              </div>
              <Hand cards={hand()} cardWidth={46} playable={(c) => c.suit === "C"} onPlay={(c) => { setHand(hand().filter((h) => cardKey(h) !== cardKey(c))); setTrick({ ...trick(), south: c }); }} />
            </div>
          </Window>
          <Window id="scores" title="Score History" icon="📊" x={380} y={300} width={360} height={220} toolbar={<Toolbar label="History" items={[{ label: "Export", icon: <span aria-hidden="true">💾</span> }, { divider: true }, { label: "Clear", icon: <span aria-hidden="true">🗑</span> }]} />}>
            <ListView
              label="Score history"
              columns={[{ key: "date", label: "Date" }, { key: "winner", label: "Winner" }, { key: "score", label: "Score", numeric: true }]}
              rows={[{ date: "Nov 21", winner: "You", score: 38 }, { date: "Nov 20", winner: "Mint", score: 71 }, { date: "Nov 18", winner: "Bot Ace", score: 102 }]}
            />
          </Window>
          <Window id="options" title="Options" icon="⚙" x={40} y={260} width={280} controls={["help", "close"]}>
            <div class="flex flex-col gap-3 p-1">
              <RadioGroup legend="Play to" name="t" options={["50 points", "100 points"]} value="100 points" />
              <Checkbox label="Sound" checked />
              <div class="flex justify-end gap-2">
                <Button>OK</Button>
                <Button variant="secondary">Cancel</Button>
              </div>
            </div>
          </Window>
          <AlertDialog
            open={alert()}
            onOpenChange={setAlert}
            title="About Hearts"
            icon="info"
            message="Hearts 2.0 · built with SolidJS and XP.css"
            actions={[{ label: "OK", style: "cancel" }]}
          />
        </Desktop>
      </div>
    );
  },
};
