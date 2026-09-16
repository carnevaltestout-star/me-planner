// Reads env(safe-area-inset-bottom) as an actual pixel number for the rare
// spots that need it in JS math (PetBunny's transform-driven sprite
// position) rather than plain CSS — env() only resolves through the
// cascade, so this asks the browser to resolve it against a throwaway
// element's padding, then reads that computed value back out.
export function getSafeAreaInsetBottomPx(): number {
  if (typeof document === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.bottom = "0";
  probe.style.left = "0";
  probe.style.height = "0";
  probe.style.paddingBottom = "env(safe-area-inset-bottom)";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  document.body.removeChild(probe);
  return px;
}
