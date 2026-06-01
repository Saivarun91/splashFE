
import React from "react";
import { Gem, Star, User, Palette, Repeat, Box } from "lucide-react";

const iconMap = { Gem, Star, User, Palette, Repeat, Box };

const defaultFeatures = [
  { title: "Photoreal Metals & Gems", description: "True-to-life sheen and sparkle.", icon: "Gem" },
  { title: "Skin-Tone Fidelity", description: "Editorial lighting and natural texture.", icon: "Star" },
  { title: "Pose Library", description: "From subtle tilts to bold looks.", icon: "User" },
  { title: "Style Presets", description: "Studio clean, editorial luxe, outdoor daylight.", icon: "Palette" },
  { title: "Variant Consistency", description: "One look, many SKUs.", icon: "Repeat" },
  { title: "Marketplace-Ready", description: "Compliant crops, backgrounds, and sizes.", icon: "Box" },
];

const FeatureGrid = ({ features: propFeatures }) => {
  const features = propFeatures?.length ? propFeatures : defaultFeatures;
  return (
    <section className="py-12 lg:py-16 bg-secondary/30">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Everything you need
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools for creating luxury jewelry imagery.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Gem;
            return (
              <div
                key={index}
                className="p-8 rounded-xl border border-border bg-card hover:border-gold-muted hover:shadow-lg transition-all"
              >
                <div className="text-primary-foreground size-10 p-2 rounded-xl bg-gold-gradient mb-4">
                  <IconComponent />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
