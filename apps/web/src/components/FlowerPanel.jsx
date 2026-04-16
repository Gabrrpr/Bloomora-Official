import estingsLogo from "../assets/estings.svg"
import bgImg from "../assets/BG_LoginRegister.png"

export default function FlowerPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg,#f9c6d0 0%,#e8a0b4 50%,#c97fa0 100%)" }}
    >
      {/* Background photo */}
      <img
        src={bgImg}
        alt="Bloomora floral background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle dark overlay so logo pops */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Centered logo block — no dots */}
      <div className="relative z-10 text-center px-8">
        <div className="inline-flex flex-col items-center gap-3">
          <img
            src={estingsLogo}
            alt="Esting's"
            className="h-38 brightness-0 invert drop-shadow-lg"
          />
          <p className="text-white font-bold text-2xl tracking-[0.25em] uppercase drop-shadow">
            Flower International Inc.
          </p>
        </div>
      </div>
    </div>
  )
}
