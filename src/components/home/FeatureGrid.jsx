
// import React from "react";

// const FeatureGrid = () => {
//   const features = [
//     { title: "Photoreal Metals & Gems", description: "True-to-life sheen and sparkle.", icon: "💎" },
//     { title: "Skin-Tone Fidelity", description: "Editorial lighting and natural texture.", icon: "✨" },
//     { title: "Pose Library", description: "From subtle tilts to bold looks.", icon: "🎭" },
//     { title: "Style Presets", description: "Studio clean, editorial luxe, outdoor daylight.", icon: "🎨" },
//     { title: "Variant Consistency", description: "One look, many SKUs.", icon: "🔄" },
//     { title: "Marketplace-Ready", description: "Compliant crops, backgrounds, and sizes.", icon: "📦" },
//   ];

//   return (
//     <section className="py-12 lg:py-16 bg-black relative">
//       <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl font-bold mb-4 text-white">Everything you need</h2>
//           <p className="text-lg text-white/70 max-w-2xl mx-auto">
//             Professional-grade tools for creating luxury jewelry imagery.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
//           {features.map((feature, index) => (
//             <div
//               key={index}
//               className="p-8 rounded-2xl shadow-lg border border-white/20 bg-white/10 backdrop-blur-lg hover:bg-white/20 hover:backdrop-blur-xl hover:shadow-2xl transition-all"
//             >
//               <div className="text-4xl mb-4">{feature.icon}</div>
//               <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-md">{feature.title}</h3>
//               <p className="text-white/90">{feature.description}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default FeatureGrid;
import React from "react";
import { Gem, Star, User, Palette, Repeat, Box } from "lucide-react";

const features = [
  { title: "Photoreal Metals & Gems", description: "True-to-life sheen and sparkle.", icon: <Gem /> },
  { title: "Skin-Tone Fidelity", description: "Editorial lighting and natural texture.", icon: <Star /> },
  { title: "Pose Library", description: "From subtle tilts to bold looks.", icon: <User /> },
  { title: "Style Presets", description: "Studio clean, editorial luxe, outdoor daylight.", icon: <Palette /> },
  { title: "Variant Consistency", description: "One look, many SKUs.", icon: <Repeat /> },
  { title: "Marketplace-Ready", description: "Compliant crops, backgrounds, and sizes.", icon: <Box /> },
];

const FeatureGrid = () => {
  return (
    <section className="py-12 lg:py-16 bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-gray-900">
            Everything you need
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade tools for creating luxury jewelry imagery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl shadow-lg border border-gray-500 bg-white hover:bg-gray-50 hover:shadow-2xl transition-all"
            >
              <div className="text-white size-10 p-2 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600">{feature.icon}</div>
              <br />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
