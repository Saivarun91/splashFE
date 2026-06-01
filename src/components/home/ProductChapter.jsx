// import React from "react";

// function ProductChapter({
//   title,
//   description,
//   imageSrc,
//   imageAlt,
//   imagePosition = "right",
// }) {
//   return (
//     <section className="py-12 lg:py-16 border-b border-gray-300">
//       <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
//         <div
//           className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
//             imagePosition === "left" ? "lg:flex-row-reverse" : ""
//           }`}
//         >
//           {/* Text Content */}
//           <div className={`space-y-6 ${imagePosition === "left" ? "lg:order-2" : ""}`}>
//             <h2 className="text-2xl lg:text-3xl font-bold">{title}</h2>
//             <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
//               {description}
//             </p>
//           </div>

//           {/* Image */}
//           <div className={`${imagePosition === "left" ? "lg:order-1" : ""}`}>
//             <div className="relative overflow-hidden rounded-2xl shadow-md hover:scale-105 transition-transform duration-300">
//               <img
//                 src={imageSrc}
//                 alt={imageAlt}
//                 className="w-full h-auto object-cover"
//                 loading="lazy"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default ProductChapter;
import React from "react";

function ProductChapter({ title, description, imageSrc, imageAlt, imagePosition = "right" }) {
  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16 border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Mobile Layout - Stacked */}
        <div className="block lg:hidden space-y-6 sm:space-y-8">
          {/* Image First on Mobile */}
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-md">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
          {/* Text Content */}
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Desktop Layout - Side by Side */}
        <div
          className={`hidden lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
            imagePosition === "left" ? "lg:flex-row-reverse" : ""
          }`}
        >
          {/* Text Content */}
          <div className={`space-y-6 ${imagePosition === "left" ? "lg:order-2" : ""}`}>
            <h2 className="text-2xl lg:text-3xl font-bold text-gold-solid">{title}</h2>
            <p className="text-lg text-muted-foreground lg:text-xl leading-relaxed">
              {description}
            </p>
          </div>

          {/* Image */}
          <div className={`${imagePosition === "left" ? "lg:order-1" : ""}`}>
            <div className="relative overflow-hidden rounded-2xl shadow-md hover:scale-105 transition-transform duration-300">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductChapter;
