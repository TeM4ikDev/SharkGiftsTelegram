// import { Block } from "@/components/ui/Block";
// import { Button } from "@/components/ui/Button";
// import { ShowStars } from "@/components/ui/ShowStars";
// import { RouletteRoundHistoryItem, rouletteService } from "@/services/roulette.service";
// import { connectRouletteWS, disconnectRouletteWS } from "@/services/roulette.ws";
// import { useStore } from "@/store/root.store";
// import { cn } from "@/utils/cn";
// import { onRequest } from "@/utils/handleReq";
// import { EyeIcon, History as HistoryIcon } from "lucide-react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import { toast } from "react-toastify";

// type RoundStatus = "OPEN" | "CLOSED" | "SPINNING" | "WAITING_FOR_PLAYERS";

// type Player = {
//     id: string;
//     name: string;
//     bet: number;
//     color: string;
//     photo_url: string;
//     isUser?: boolean;
// };

// type SocketPlayer = {
//     userId: string;
//     username: string;
//     bet: number;
//     photo_url: string;
// };

// type RouletteState = {
//     roundId: number;
//     status: RoundStatus;
//     timeLeft: number;
//     totalBank: number;
//     players: SocketPlayer[];
// };

// const ROUND_SECONDS = 12;
// const CLOSE_BETS_AT = 2;
// const SPIN_ANIMATION_MS = 5000;
// const COLORS = ["#ffd700", "#ff1493", "#9d4edd", "#00e5ff", "#00ff88", "#ff6b00", "#00b4d8"];
// const FALLBACK_EASING = "0.16, 1, 0.3, 1";

// export const CanvasComponent = () => {
//     const { userStore: { user, updateUserBalance } } = useStore();
//     const wheelRef = useRef<HTMLDivElement | null>(null);
//     const playersRef = useRef<Player[]>([]);
//     const totalBankRef = useRef(0);
//     const colorMapRef = useRef<Map<string, string>>(new Map());

//     const [status, setStatus] = useState<RoundStatus>("OPEN");
//     const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
//     const [players, setPlayers] = useState<Player[]>([]);
//     const [totalBank, setTotalBank] = useState(0);
//     const [rotation, setRotation] = useState(0);
//     const [currentRotation, setCurrentRotation] = useState(0);
//     const [isSpinning, setIsSpinning] = useState(false);
//     const [spinEasing, setSpinEasing] = useState(FALLBACK_EASING);
//     const [watchersCount, setWatchersCount] = useState(0);
//     const [history, setHistory] = useState<RouletteRoundHistoryItem[]>([]);
//     const [betInput, setBetInput] = useState(20);
//     const [winnerBanner, setWinnerBanner] = useState<{ name: string; gain: number; commission: number } | null>(null);
//     const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);

//     const getColor = (userId: string) => {
//         const existing = colorMapRef.current.get(userId);
//         if (existing) return existing;
//         const color = COLORS[colorMapRef.current.size % COLORS.length];
//         colorMapRef.current.set(userId, color);
//         return color;
//     };

//     const mapPlayers = (list: SocketPlayer[]) =>
//         list
//             .filter((p) => p.bet > 0)
//             .map((p) => ({
//                 id: p.userId,
//                 name: p.username,
//                 bet: p.bet,
//                 color: getColor(p.userId),
//                 photo_url: p.photo_url || "",
//                 isUser: p.userId === user?.id,
//             }));

//     const segments = useMemo(() => {
//         const total = totalBank || 1;
//         let cursor = 0;
//         return players.map((p) => {
//             const angle = (p.bet / total) * 360;
//             const start = cursor;
//             const end = cursor + angle;
//             cursor = end;
//             return { ...p, start, end, angle };
//         });
//     }, [players, totalBank]);

//     const wheelGradient = useMemo(() => {
//         if (segments.length === 0) return "conic-gradient(#2a2d39 0deg, #1c1f2a 360deg)";
//         return `conic-gradient(${segments.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(", ")})`;
//     }, [segments]);

//     const currentPlayer = useMemo(() => {
//         if (segments.length === 0) return null;
//         const normalized = ((isSpinning ? currentRotation : rotation) % 360 + 360) % 360;
//         const pointerAngle = (360 - normalized) % 360;
//         return segments.find((s) => pointerAngle >= s.start && pointerAngle < s.end) ?? segments[0];
//     }, [segments, rotation, currentRotation, isSpinning]);

//     const isBettingOpen = (status === "OPEN" || status === "WAITING_FOR_PLAYERS") && timeLeft > CLOSE_BETS_AT && !isSpinning;
//     const animation = isSpinning
//         ? `transform ${SPIN_ANIMATION_MS}ms cubic-bezier(${spinEasing || FALLBACK_EASING})`
//         : "transform 350ms ease";

//     useEffect(() => {
//         playersRef.current = players;
//         totalBankRef.current = totalBank;
//     }, [players, totalBank]);

//     useEffect(() => {
//         const socket = connectRouletteWS();

//         const applyState = (payload: RouletteState) => {
//             setStatus(payload.status);
//             setTimeLeft(payload.timeLeft);
//             setTotalBank(payload.totalBank);
//             setPlayers(mapPlayers(payload.players));
//         };

//         socket.on("roulette:state", applyState);
//         socket.on("roulette:tick", (payload: { timeLeft: number; status: RoundStatus }) => {
//             setTimeLeft(payload.timeLeft);
//             setStatus(payload.status);
//         });
//         socket.on("roulette:closed", () => setStatus("CLOSED"));
//         socket.on("roulette:watchers", (count: number) => setWatchersCount(count));
//         socket.on("roulette:bet", (payload: { userId: string; username: string; bet: number; totalBank: number; photo_url: string }) => {
//             setTotalBank(payload.totalBank);
//             setPlayers((prev) => {
//                 const next = prev.map((p) => (p.id === payload.userId ? { ...p, bet: payload.bet } : p));
//                 if (!next.some((p) => p.id === payload.userId) && payload.bet > 0) {
//                     next.push({
//                         id: payload.userId,
//                         name: payload.username,
//                         bet: payload.bet,
//                         color: getColor(payload.userId),
//                         photo_url: payload.photo_url || "",
//                         isUser: payload.userId === user?.id,
//                     });
//                 }
//                 return next.filter((p) => p.bet > 0);
//             });
//         });
//         socket.on("roulette:result", (payload: {
//             winnerUserId: string | null;
//             winnerGain: number;
//             commission: number;
//             totalBank: number;
//             players: SocketPlayer[];
//             deletedPlayers: string[];
//             segmentOffset?: number;
//             spinEasing?: string;
//         }) => {
//             setStatus("SPINNING");
//             setIsSpinning(true);
//             setSpinEasing(payload.spinEasing || FALLBACK_EASING);

//             const snapshotPlayers = playersRef.current;
//             const snapshotTotal = totalBankRef.current || 1;
//             let cursor = 0;
//             const snap = snapshotPlayers.map((p) => {
//                 const angle = (p.bet / snapshotTotal) * 360;
//                 const start = cursor;
//                 const end = cursor + angle;
//                 cursor = end;
//                 return { ...p, start, end };
//             });

//             const winnerSeg = payload.winnerUserId ? snap.find((s) => s.id === payload.winnerUserId) : null;
//             const offset = payload.segmentOffset != null ? Math.max(0, Math.min(1, payload.segmentOffset)) : 0.5;
//             const targetAngle = winnerSeg ? winnerSeg.start + offset * (winnerSeg.end - winnerSeg.start) : 0;

//             setRotation((prev) => {
//                 const prevMod = ((prev % 360) + 360) % 360;
//                 const targetMod = (360 - targetAngle) % 360;
//                 const delta = (targetMod - prevMod + 360) % 360;
//                 return prev + 5 * 360 + (delta === 0 ? 360 : delta);
//             });

//             window.setTimeout(() => {
//                 setPlayers(mapPlayers(payload.players));
//                 setTotalBank(payload.totalBank);
//                 setStatus("OPEN");
//                 setIsSpinning(false);
//                 setLastWinnerId(payload.winnerUserId);
//                 if (payload.deletedPlayers?.length) {
//                     const deletedMe = payload.deletedPlayers.find((id) => id === user?.id);
//                     if (deletedMe) {
//                         toast.info("Остаток ставки возвращен");
//                         updateUserBalance().catch(() => undefined);
//                     }
//                 }
//                 if (payload.winnerUserId) {
//                     const winner = payload.players.find((p) => p.userId === payload.winnerUserId);
//                     if (winner) {
//                         setWinnerBanner({ name: winner.username, gain: payload.winnerGain, commission: payload.commission });
//                         window.setTimeout(() => setWinnerBanner(null), 2500);
//                     }
//                 }
//                 fetchHistory();
//             }, SPIN_ANIMATION_MS);
//         });

//         rouletteService.getState().then((s) => applyState(s as RouletteState)).catch(() => undefined);
//         fetchHistory();

//         return () => {
//             socket.off("roulette:state", applyState);
//             socket.off("roulette:tick");
//             socket.off("roulette:closed");
//             socket.off("roulette:watchers");
//             socket.off("roulette:bet");
//             socket.off("roulette:result");
//             disconnectRouletteWS();
//         };
//     }, [updateUserBalance, user?.id]);

//     useEffect(() => {
//         if (!isSpinning) {
//             setCurrentRotation(((rotation % 360) + 360) % 360);
//             return;
//         }
//         const interval = window.setInterval(() => {
//             const wheel = wheelRef.current;
//             if (!wheel) return;
//             const transform = window.getComputedStyle(wheel).transform;
//             if (!transform || transform === "none") return;
//             const values = transform
//                 .replace(/^matrix(3d)?\(/, "")
//                 .replace(")", "")
//                 .split(",")
//                 .map((v) => Number(v.trim()));
//             const a = values[0];
//             const b = values[1];
//             const angle = Math.atan2(b, a) * (180 / Math.PI);
//             setCurrentRotation(((angle % 360) + 360) % 360);
//         }, 50);
//         return () => window.clearInterval(interval);
//     }, [isSpinning, rotation]);

//     const fetchHistory = async () => {
//         try {
//             setHistory(await rouletteService.getHistory());
//         } catch {
//             // ignore
//         }
//     };

//     const placeBet = async () => {
//         if (!isBettingOpen) return;
//         if (betInput < 5) {
//             toast.error("Минимальная ставка 5");
//             return;
//         }
//         const data = await onRequest(rouletteService.placeBet(betInput));
//         if (data) {
//             setBetInput(20);
//             updateUserBalance().catch(() => undefined);
//         }
//     };

//     const withdrawBet = async () => {
//         const data = await onRequest(rouletteService.withdrawBet());
//         if (data) {
//             toast.success("Ставка забрана");
//             updateUserBalance().catch(() => undefined);
//         }
//     };

//     const progress = Math.min(1, Math.max(0, timeLeft) / ROUND_SECONDS);
//     const progressDeg = progress * 360;
//     const userBet = useMemo(() => players.find((p) => p.id === user?.id)?.bet ?? 0, [players, user?.id]);

//     return (
//         <div className="mx-auto flex w-full max-w-[620px] flex-col gap-3 rounded-2xl border border-white/10 bg-[#0a0c14] p-4 shadow-[0_0_28px_rgba(0,0,0,0.55)]">
//             <div className="flex items-center justify-between">
//                 <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Roulette v2</div>
//                 <div className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/75">👁 {watchersCount}</div>
//             </div>

//             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
//                 {history.slice(0, 4).map((h) => {
//                     const winner = h.participants.find((p) => p.isWinner);
//                     return (
//                         <div key={h.id} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs">
//                             <span className="font-bold text-emerald-300">{h.winnerUsername}</span>
//                             <span className="ml-2 text-white/85">+{h.winnerGain.toFixed(2)}</span>
//                             <span className="ml-2 text-white/60">{(winner?.winChance ?? 0).toFixed(1)}%</span>
//                         </div>
//                     );
//                 })}
//             </div>

//             <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
//                 <div className="flex items-center gap-2 text-sm text-white/80">
//                     <EyeIcon className="h-4 w-4 text-white/60" />
//                     Банк: <span className="font-black text-amber-300">{totalBank.toFixed(2)}</span>
//                 </div>
//                 <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${isBettingOpen ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
//                     {status === "SPINNING" ? "spinning" : `${status.toLowerCase()} · ${Math.max(0, Math.ceil(timeLeft))}s`}
//                 </div>
//             </div>

//             <div className="flex flex-col items-center gap-2">
//                 <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-300">
//                     <span className="flex items-center gap-2">
//                         <img
//                             src={currentPlayer?.photo_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7U_ef87Q7CQ1Fx_khkPq-y9IfPmBWrMZ6ig&s"}
//                             alt={currentPlayer?.name || "..."}
//                             className="h-5 w-5 rounded-full"
//                         />
//                         Под указателем: {currentPlayer?.name || "..."}
//                     </span>
//                 </div>

//                 <div className="relative h-80 w-80">
//                     <div className="absolute inset-0 rounded-full border-[6px] border-amber-300/60 shadow-[0_0_40px_rgba(255,200,64,0.35)]" />
//                     <div
//                         ref={wheelRef}
//                         className="absolute inset-0 rounded-full ring-2 ring-white/10"
//                         style={{
//                             background: wheelGradient,
//                             transform: `rotate(${rotation}deg)`,
//                             transition: animation,
//                         }}
//                     />
//                     <div
//                         className="absolute inset-0 rounded-full pointer-events-none"
//                         style={{
//                             transform: `rotate(${rotation}deg)`,
//                             transition: animation,
//                         }}
//                     >
//                         {segments.map((seg) => {
//                             if (seg.angle < 10) return null;
//                             const mid = (seg.start + seg.end) / 2;
//                             return (
//                                 <div key={seg.id} className="absolute inset-0 flex items-center justify-center" style={{ transform: `rotate(${mid}deg)` }}>
//                                     <div
//                                         className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-bold text-white shadow"
//                                         style={{ transform: `translateY(-118px) rotate(${-(rotation + mid)}deg)` }}
//                                     >
//                                         {seg.name}
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                     <div className="absolute inset-6 rounded-full bg-black/30 shadow-inner" />
//                     <svg width="30" height="25" viewBox="0 0 30 25" fill="none" className="absolute left-1/2 -translate-x-1/2 -top-2.5 z-20">
//                         <path d="M12.3095 21.9644L2.35141 7.02712C0.918851 4.87828 2.45926 2 5.04184 2H24.9581C27.5407 2 29.0811 4.87829 27.6486 7.02712L17.6904 21.9644C16.4105 23.8842 13.5894 23.8842 12.3095 21.9644Z" fill="#0D0D12" stroke="#ffd700" strokeWidth="3" />
//                     </svg>
//                     <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="relative h-24 w-24">
//                             <div
//                                 className="absolute inset-0 rounded-full"
//                                 style={{ background: `conic-gradient(#ffd700 0deg ${progressDeg}deg, rgba(255,255,255,0.12) ${progressDeg}deg 360deg)` }}
//                             />
//                             <div className="absolute inset-[6px] flex flex-col items-center justify-center rounded-full border border-amber-400/60 bg-[#131722] text-amber-300">
//                                 <div className="text-3xl font-black leading-none">{Math.max(0, Math.ceil(timeLeft))}</div>
//                                 <div className="text-[10px] uppercase tracking-wider">sec</div>
//                             </div>
//                         </div>
//                     </div>

//                     {winnerBanner && (
//                         <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
//                             <div className="rounded-xl border border-emerald-400/35 bg-black/70 px-4 py-3 text-center">
//                                 <div className="text-xs uppercase text-white/70">winner</div>
//                                 <div className="text-lg font-black text-emerald-300">{winnerBanner.name}</div>
//                                 <div className="text-sm font-bold text-amber-300">+{winnerBanner.gain.toFixed(2)}</div>
//                                 <div className="text-[11px] text-white/60">Комиссия: {winnerBanner.commission.toFixed(2)}</div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <div className="grid grid-cols-2 gap-2">
//                 <input
//                     value={betInput}
//                     onChange={(e) => setBetInput(Number(e.target.value) || 0)}
//                     type="number"
//                     min={5}
//                     className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/60"
//                 />
//                 <button
//                     type="button"
//                     onClick={placeBet}
//                     disabled={!isBettingOpen}
//                     className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-2 text-sm font-bold text-cyan-300 disabled:opacity-50"
//                 >
//                     Ставка
//                 </button>
//             </div>

//             {userBet > 0 && (
//                 <Button
//                     text="Забрать ставку"
//                     FC={() => withdrawBet()}
//                     color="transparent"
//                     className="h-11 w-full rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-300"
//                     disabled={!isBettingOpen}
//                 />
//             )}

//             <Block
//                 className="gap-2"
//                 title="Лайв ставки"
//                 subtitle={
//                     <div className="flex items-center justify-between text-xs">
//                         <span>{players.length} игроков</span>
//                         {lastWinnerId && (
//                             <span className="text-amber-300">
//                                 Победитель: {lastWinnerId === user?.id ? "Вы" : players.find((p) => p.id === lastWinnerId)?.name}
//                             </span>
//                         )}
//                     </div>
//                 }
//             >
//                 <div className="flex flex-col gap-2">
//                     {players.map((p) => (
//                         <Block
//                             key={p.id}
//                             className={cn(
//                                 "flex !flex-row items-center justify-between",
//                                 p.isUser && "!border-amber-400/40 bg-amber-500/5"
//                             )}
//                         >
//                             <div className="flex min-w-0 items-center gap-2">
//                                 <img
//                                     src={p.photo_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7U_ef87Q7CQ1Fx_khkPq-y9IfPmBWrMZ6ig&s"}
//                                     alt={p.name}
//                                     className="h-7 w-7 rounded-full"
//                                 />
//                                 <div className="min-w-0">
//                                     <div className="truncate text-sm font-semibold text-white">{p.name}</div>
//                                     <div className="text-[10px] uppercase text-white/55">
//                                         Шанс: {totalBank > 0 ? ((p.bet / totalBank) * 100).toFixed(1) : "0"}%
//                                     </div>
//                                 </div>
//                             </div>
//                             <ShowStars value={p.bet} />
//                         </Block>
//                     ))}
//                 </div>
//             </Block>

//             <Block
//                 className="gap-2 max-h-96"
//                 title={<div className="flex items-center gap-2 font-bold"><HistoryIcon className="h-4 w-4" />История матчей</div>}
//             >
//                 <div className="flex h-full flex-col gap-2 overflow-y-auto scrollbar-hide">
//                     {history.length === 0 && (
//                         <p className="py-3 text-center text-sm text-white/40">Пока нет завершённых раундов</p>
//                     )}
//                     {history.map((r) => (
//                         <Block
//                             key={r.id}
//                             className="!h-max min-h-max gap-2"
//                             title={
//                                 <div className="flex items-center gap-2 font-bold">
//                                     <span className="text-sm font-semibold text-emerald-300">{r.winnerUsername}</span>
//                                     <ShowStars text="Выигрыш" value={r.winnerGain} size="small" />
//                                 </div>
//                             }
//                             canCollapse
//                             isCollapsedInitially
//                         >
//                             <Block title="Участники">
//                                 <div className="w-full overflow-x-auto">
//                                     <table className="w-full min-w-[360px] table-fixed border-collapse">
//                                         <thead>
//                                             <tr className="border-b border-white/10 text-left">
//                                                 <th className="py-2 pr-2 text-xs uppercase text-white/60">Игрок</th>
//                                                 <th className="py-2 pr-2 text-xs uppercase text-white/60">Ставка</th>
//                                                 <th className="py-2 text-xs uppercase text-white/60">Шанс</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {r.participants.map((p) => (
//                                                 <tr key={p.userId} className="border-b border-white/5 last:border-b-0">
//                                                     <td className="py-2 pr-2 text-sm font-semibold text-white">{p.username}</td>
//                                                     <td className="py-2 pr-2">
//                                                         <ShowStars value={p.betAmount} size="small" />
//                                                     </td>
//                                                     <td className="py-2 text-sm font-semibold text-white">
//                                                         {Number(p.winChance || 0).toFixed(1)}%
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </Block>
//                             <Block title="Информация">
//                                 <ShowStars text="Банк" value={r.totalBank} size="small" />
//                                 <ShowStars text="Комиссия" value={r.commission} size="small" />
//                                 <ShowStars text="Выигрыш" value={r.winnerGain} size="small" />
//                             </Block>
//                         </Block>
//                     ))}
//                 </div>
//             </Block>
//         </div>
//     );
// };