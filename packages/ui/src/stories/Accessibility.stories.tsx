import { createSignal } from "solid-js";
import { CardPickerSheet, hand, sampleHand } from "../game";
import { GameTableScreen, LobbyScreen, PhoneFrame, SettingsScreen } from "../screens";

export default { title: "Accessibility", parameters: { layout: "fullscreen" } };

/** The 44pt equivalent of the fanned hand: every card as a row, grouped by suit. */
export const CardList = {
  name: "Card list (equivalent to the fanned hand)",
  render: () => {
    const [open, setOpen] = createSignal(true);
    const [h, setH] = createSignal(sampleHand);
    return (
      <PhoneFrame>
        {(m) => (
          <>
            <GameTableScreen hand={h()} />
            <CardPickerSheet
              open={open()}
              onOpenChange={setOpen}
              mount={m}
              cards={h()}
              playable={(c) => c.suit === "C"}
              onPick={(c) => (setH(h().filter((x) => x !== c)), setOpen(false))}
            />
          </>
        )}
      </PhoneFrame>
    );
  },
};

export const PassList = {
  name: "Card list · passing",
  render: () => {
    const [sel, setSel] = createSignal(hand("QS"));
    return (
      <PhoneFrame>
        {(m) => (
          <CardPickerSheet
            open
            mount={m}
            mode="pass"
            cards={sampleHand}
            selected={sel()}
            onPick={(c) => setSel(sel().some((s) => s.rank === c.rank && s.suit === c.suit) ? sel().filter((s) => !(s.rank === c.rank && s.suit === c.suit)) : [...sel(), c].slice(-3))}
          />
        )}
      </PhoneFrame>
    );
  },
};

export const LargeTextLobby = { name: "Large text · Lobby (135%)", parameters: { textSize: "135" }, render: () => <PhoneFrame>{() => <LobbyScreen />}</PhoneFrame> };
export const LargeTextTable = { name: "Large text · Table (135%)", parameters: { textSize: "135" }, render: () => <PhoneFrame>{() => <GameTableScreen />}</PhoneFrame> };
export const LargeTextSettings = { name: "Large text · Settings (135%)", parameters: { textSize: "135" }, render: () => <PhoneFrame>{() => <SettingsScreen />}</PhoneFrame> };
export const AxTextSettings = { name: "Accessibility text · Settings (200%)", parameters: { textSize: "200" }, render: () => <PhoneFrame>{() => <SettingsScreen />}</PhoneFrame> };
export const AxTextTable = { name: "Accessibility text · Table (200%)", parameters: { textSize: "200" }, render: () => <PhoneFrame>{() => <GameTableScreen />}</PhoneFrame> };
