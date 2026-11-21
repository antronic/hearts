import { createSignal } from "solid-js";
import { hand } from "../game";
import {
  CreateRoomSheet, GameOverScreen, GameTableScreen, JoinRoomSheet, LobbyScreen, PassingScreen, PhoneFrame,
  RoundScoreSheet, sampleRooms, SettingsScreen, WaitingRoomScreen,
} from "../screens";

export default { title: "Screens", parameters: { layout: "fullscreen" } };

const Open = (p: { children: (open: () => boolean, set: (o: boolean) => void) => any }) => {
  const [o, s] = createSignal(true);
  return p.children(o, s);
};

export const Lobby = { name: "1 · Lobby", render: () => <PhoneFrame>{() => <LobbyScreen />}</PhoneFrame> };
export const LobbyOffline = { name: "1b · Lobby (offline)", render: () => <PhoneFrame>{() => <LobbyScreen offline />}</PhoneFrame> };
export const CreateRoom = {
  name: "2 · Create room",
  render: () => <PhoneFrame>{(m) => <><LobbyScreen /><Open>{(o, s) => <CreateRoomSheet open={o()} onOpenChange={s} mount={m} />}</Open></>}</PhoneFrame>,
};
export const JoinRoom = {
  name: "3 · Join room (password)",
  render: () => <PhoneFrame>{(m) => <><LobbyScreen /><Open>{(o, s) => <JoinRoomSheet room={sampleRooms[1]} open={o()} onOpenChange={s} mount={m} error="Wrong password. Try again." />}</Open></>}</PhoneFrame>,
};
export const WaitingRoom = { name: "4 · Waiting room", render: () => <PhoneFrame>{() => <WaitingRoomScreen />}</PhoneFrame> };
export const Passing = { name: "5 · Pass 3 cards", render: () => <PhoneFrame>{() => <PassingScreen preselected={hand("QS", "AD")} />}</PhoneFrame> };
export const TableYourTurn = { name: "6 · Table · your turn (interactive)", render: () => <PhoneFrame>{() => <GameTableScreen />}</PhoneFrame> };
export const TableWaiting = {
  name: "6b · Table · waiting for others",
  render: () => <PhoneFrame>{() => <GameTableScreen turn="east" trick={{ north: { rank: "K", suit: "C" }, west: { rank: "9", suit: "C" }, south: { rank: "7", suit: "C" } }} />}</PhoneFrame>,
};
export const TableIllegal = {
  name: "6c · Table · illegal move toast",
  render: () => <PhoneFrame>{() => <GameTableScreen toast="You must follow suit ♣" />}</PhoneFrame>,
};
export const TableHeartsBroken = {
  name: "6d · Table · hearts broken",
  render: () => <PhoneFrame>{() => <GameTableScreen heartsBroken showHeartBroken turn="west" trick={{ north: { rank: "3", suit: "D" }, east: { rank: "8", suit: "H" } }} />}</PhoneFrame>,
};
export const TableTrickWon = {
  name: "6e · Table · trick won",
  render: () => <PhoneFrame>{() => <GameTableScreen turn="south" winner="north" trick={{ north: { rank: "K", suit: "C" }, west: { rank: "9", suit: "C" }, east: { rank: "Q", suit: "S" }, south: { rank: "7", suit: "C" } }} />}</PhoneFrame>,
};
export const TableReconnecting = {
  name: "6f · Table · player reconnecting",
  render: () => <PhoneFrame>{() => <GameTableScreen offlinePlayer="north" turn="north" />}</PhoneFrame>,
};
export const RoundScores = {
  name: "7 · Round scoreboard",
  render: () => <PhoneFrame>{(m) => <><GameTableScreen turn="east" trick={{}} /><Open>{(o, s) => <RoundScoreSheet open={o()} onOpenChange={s} mount={m} />}</Open></>}</PhoneFrame>,
};
export const GameOver = { name: "8 · Game over", render: () => <PhoneFrame>{() => <GameOverScreen />}</PhoneFrame> };
export const Settings = { name: "9 · Settings", render: () => <PhoneFrame>{() => <SettingsScreen />}</PhoneFrame> };
