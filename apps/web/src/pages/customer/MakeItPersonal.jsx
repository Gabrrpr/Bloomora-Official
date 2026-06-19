import mixAndMatchImg from "../../assets/MixAndMatchImg.png"
import describeImg from "../../assets/DescribeImg.png"

const G = "#2E8B34"

export default function MakeItPersonal({ onNavigate }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <style>{`@keyframes pageRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}`}</style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="text-center mb-10" style={{ animation:"pageRise 0.6s ease 0.05s both" }}>
          <div className="inline-flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" style={{ color: G }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: G }}>Make it Personal</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Create your perfect bouquet</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Choose how you'd like to build your arrangement. Our florists will craft it fresh, just for you.
          </p>
        </div>

        {/* Two options */}
        <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">

          {/* Option 1: Mix and Match */}
          <button
            onClick={() => onNavigate("mix-and-match")}
            style={{ animation:"pageRise 0.6s ease 0.16s both" }}
            className="group bg-white border border-gray-200 rounded-xl text-left hover:border-green-500 hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden"
          >
            {/* Square image — full width, 1:1 ratio */}
            <div className="w-full aspect-square overflow-hidden bg-gray-50">
              <img
                src={mixAndMatchImg}
                alt="Mix and Match: build your bouquet step by step"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Text below image */}
            <div className="p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1.5">Mix and Match</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Build your bouquet step by step. Choose size, arrangement type, focal flowers, fillers, and finishing touches.
              </p>
              <div
                className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5"
                style={{ color: G }}
              >
                Start building
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Option 2: Describe Your Arrangement */}
          <button
            onClick={() => onNavigate("describe-arrangement")}
            style={{ animation:"pageRise 0.6s ease 0.24s both" }}
            className="group bg-white border border-gray-200 rounded-xl text-left hover:border-pink-400 hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden"
          >
            {/* Square image */}
            <div className="w-full aspect-square overflow-hidden bg-gray-50">
              <img
                src={describeImg}
                alt="Describe your arrangement: let AI generate your bouquet"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Text below image */}
            <div className="p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1.5">Describe Your Arrangement</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Just tell us what you have in mind (occasion, colors, style) and our AI will generate your dream bouquet.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-pink-500 transition-all duration-200 group-hover:gap-2.5">
                Describe it
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8" style={{ animation:"pageRise 0.6s ease 0.34s both" }}>
          🌸 More than 1,000+ arrangements generated for customers like you
        </p>
      </div>
    </div>
  )
}
