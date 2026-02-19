// Ornament Fitting Rules for AI Model and Real Model Generation
// This file contains detailed fitting rules for each ornament type to ensure realistic appearance

export const ORNAMENT_FITTING_RULES = {
    // Necklaces
    
        short_necklace: {
          name: "Short Necklace",
          rules: "The short necklace should rest snugly around the base of the neck, sitting just above the collarbone. It must follow the natural curvature of the neck, laying flat against the skin without gaps. The necklace should have realistic contact shadows on the skin and be fully visible in close-up framing. Ensure the chain or embellishments are clearly defined and proportional to the neck size."
        },
        long_necklace: {
          name: "Long Necklace",
          rules: "The long necklace should drape naturally over the chest, with the pendant or central motif resting slightly above the mid-chest line. It should curve along the body's contours and show natural gravity-induced drape. Contact shadows should appear where the chain touches the skin, and the necklace must remain fully visible without twisting or overlapping unnaturally."
        },
        choker: {
          name: "Choker",
          rules: "The choker must sit snugly at the base of the neck, encircling it without gaps. Its surface should gently press against the skin, showing subtle shadows. The closure or clasp should not be overly prominent unless specified. It must maintain a natural circular shape and appear realistic in close-up lighting, highlighting any textures or gemstones."
        },
        pendant: {
          name: "Pendant",
          rules: "The pendant should hang from a chain that sits naturally around the neck. The pendant must rest flat against the chest, aligned with the chain, and oriented correctly (not twisted). Shadows where the pendant touches the skin should be visible, and reflections on the metal or gemstones should look natural under studio lighting."
        },
        pendant_necklace: {
          name: "Pendant Necklace",
          rules: "Pendant necklaces should hang naturally around the neck, with the pendant centered on the chest. Shadows must indicate skin contact, and reflections on metal or gems should be realistic."
        },
        pendant_necklace_set: {
          name: "Pendant Necklace Set",
          rules: "Pendant necklace sets should have all matching components aligned naturally. Necklaces should drape along the neck and chest, pendants should face forward, and earrings or other matching pieces must be proportional. Shadows and reflections should be realistic."
        },
        delicate_necklace: {
          name: "Delicate Necklace",
          rules: "Delicate necklaces should lay softly against the skin, following neck curvature. They should show subtle shadows where chain meets skin, and any pendant must hang naturally without twisting."
        },
        layered_necklace: {
          name: "Layered Necklace",
          rules: "Layered necklaces should drape in multiple levels over the chest naturally. Each chain must remain distinct without tangling, and contact shadows should indicate where each layer touches skin. Decorative elements must face outward and remain fully visible."
        },
        necklace_set: {
          name: "Necklace Set",
          rules: "Necklace sets must include all components (necklace, earrings, etc.) positioned naturally. The necklace should curve around the neck, and earrings must hang proportionally. Shadows and light reflections must indicate realistic contact."
        },
        black_beads_necklace: {
          name: "Black Beads Necklace",
          rules: "The black beads necklace should encircle the neck naturally, with beads resting evenly. The necklace should curve with the neck, showing realistic shadow and light reflections on beads. No beads should appear floating or misaligned."
        },
        hasli: {
          name: "Hasli",
          rules: "Hasli necklaces should sit closely around the neck, following its natural curve. The metal or beads should hug the skin snugly, with realistic shadows and highlights."
        },
        mangalsutra: {
            name: "Mangalsutra",
          rules: "The mangalsutra should drape naturally around the neck, typically resting at mid-chest. It must feature evenly aligned black beads with a clearly visible central pendant. The chain should follow the neck’s curvature with realistic gravity-induced drape. Subtle contact shadows should appear where it touches the skin, and the pendant must face forward without twisting. It must remain visually distinct from a standard black beads necklace through its traditional design and central motif."
        },
        invisible_chain: {
          name: "Invisible Chain",
          rules: "Invisible chains should appear extremely thin and lightweight, resting subtly against the skin with minimal visual prominence. It will mainly focus on the locket of the chain. The chain must follow the natural curvature of the neck or body area where worn, without appearing floating or overly rigid. It should create very soft, realistic contact shadows where it touches the skin. Reflections must be delicate and understated, ensuring the chain looks barely visible yet physically present under close-up lighting."
        },
        rani_haar: {
          name: "Rani Haar",
          rules: "Rani Haar should be a very long necklace extending down to the stomach or upper waist. It must drape vertically along the torso with natural gravity flow. The central pendant or motifs should remain centered and face forward. Contact shadows should appear along the chest where it touches the body. The length and scale must feel grand and proportional without overlapping unnaturally with other layers."
        },
        bib_necklace: {
          name: "Bib Necklace",
          rules: "Bib necklaces should cover the upper chest widely, sitting just below the collarbone. The structure must spread evenly across the chest like a decorative panel. It should rest flat against the skin with visible contact shadows. All stones, beads, or metalwork must face outward and remain fully visible without folding or lifting unnaturally."
        },
        torque_necklace: {
          name: "Torq / Torque Necklace",
          rules: "Torque necklaces should appear as rigid, open-ended neckpieces resting around the collarbone area. The ends must remain slightly apart at the front or side without closing into a full circle. It should maintain a firm curved structure distinct from a hasli. Subtle shadows should appear where the metal meets the skin, and reflections should highlight its rigid form."
        },
        collar_necklace: {
          name: "Collar Necklace",
          rules: "Collar necklaces should sit higher and broader than a short necklace, covering the area around the base of the neck."
        },
        stud_earrings: {
          name: "Stud Earrings",
          rules: "Stud earrings should sit flush against the earlobe, with the post inserted naturally. Shadows around the earlobe and slight reflection on the earring surface should be visible. The size must be proportional to the ear, and close-up lighting should highlight gemstones, metal, or texture."
        },
        jhumka_earrings: {
          name: "Jhumka / Jhumki Earrings",
          rules: "Jhumka earrings should hang naturally from the earlobe, swinging slightly as if affected by gravity. The dome and decorative elements must face forward and remain visible. Shadows should appear on the skin under the earring, and the earring's curves and embellishments should catch studio lighting naturally."
        },
        drop_earrings: {
          name: "Drop Earrings",
          rules: "Drop earrings should hang vertically from the earlobe, aligning with the natural curve of the ear. The length should be proportional, with slight movement implied. Shadows and highlights must reflect realistic contact with the skin and catch light naturally."
        },
        hoop_earrings: {
          name: "Hoop / Hoop Earrings",
          rules: "Hoop earrings must form a perfect circular or oval shape hanging from the earlobe. The hoops should not appear flat or floating; subtle shadows should appear where they touch the skin. Reflection on metal surface should be realistic, emphasizing smooth curves."
        },
        chandbali: {
          name: "Chandbali",
          rules: "Chandbali earrings should hang symmetrically from the earlobes, with the crescent facing forward. Decorative motifs must be clearly visible, and contact shadows under the crescent should be present. Studio lighting should highlight intricate details without flattening curves."
        },
        ear_cuff: {
          name: "Ear Cuff",
          rules: "Ear cuffs should wrap around the outer ear cartilage without requiring a piercing. They must hug the ear’s contour naturally, showing subtle pressure and shadow at contact points. The ornament should not appear floating and must align proportionally with the ear’s shape."
        },
        huggie_earrings: {
          name: "Huggie Earrings",
          rules: "Huggie earrings should form small, tight hoops closely hugging the earlobe. They must sit snugly without visible gaps between the hoop and lobe. The circular form should remain proportional, with realistic reflections and slight shadow where the metal touches the skin."
        },
        ear_chain: {
          name: "Ear Chain/ Kaan Chain ",
          rules: "Ear chains should connect the earlobe to the hair or upper ear naturally, following the curve of the ear. The chain must drape without tension, with subtle shadows where it contacts skin or hair. Any decorative motifs should face forward and be clearly visible."
        },
        latkan_earrings: {
          name: "Latkan Earrings",
          rules: "Latkan earrings should hang long below the earlobe with tassel-style drops. The strands or chains must fall vertically with gravity, slightly separated and not clumped unnaturally. Subtle movement should be implied, and contact shadows under the earlobe must be visible."
        },
        bangle: {
          name: "Bangle",
          rules: "The bangle should encircle the wrist comfortably, showing slight movement if the hand is posed. It must maintain a circular shape, with natural contact shadows against the skin. The surface of the bangle must reflect light realistically, emphasizing curves or engravings. Avoid overlapping multiple bangles unless intentionally stacked."
        },
        bracelet: {
          name: "Bracelet",
          rules: "The bracelet should rest naturally on the wrist, conforming to the shape of the hand and arm. It should not appear rigid or floating and must show subtle skin impressions or shadows where it contacts the wrist. Chains or charms should drape realistically, and studio lighting should highlight its texture."
        },
        kada: {
          name: "Kada",
          rules: "Kadas should appear as thicker, rigid bangles encircling the wrist firmly. They must maintain a solid circular form with noticeable thickness compared to standard bangles. The metal surface should reflect light realistically, and natural contact shadows should appear where it touches the wrist."
        },
        stacked_bangles_set: {
          name: "Stacked Bangles Set",
          rules: "Stacked bangle sets should feature multiple bangles intentionally layered together on the wrist. Each bangle must remain distinct without merging visually. Slight overlapping and natural stacking alignment should appear realistic. Subtle shadows between bangles and skin must be visible."
        },
        hand_chain: {
          name: "Hand Chain",
          rules: "Hand chains should drape naturally from the wrist to the finger, following the contours of the hand. Subtle contact shadows must be visible where the chain touches skin. Any central decorative motif should rest flat and be fully visible."
        },
        ring: {
          name: "Ring",
          rules: "Rings should sit snugly on the finger without appearing floating or too tight. Shadows should reflect natural contact with skin. Any gemstones or designs should face outward and be fully visible in close-up framing."
        },
        traditional_ring: {
          name: "Traditional Ring",
          rules: "Traditional rings should sit snugly on the finger, with decorative motifs facing outward. Shadows must indicate natural contact, and any gemstones or engravings should catch studio lighting realistically."
        },
        delicate_ring: {
          name: "Delicate Ring",
          rules: "Delicate rings should sit snugly on fingers, with slight shadows showing skin contact. Small gemstones or motifs must face outward and be clearly visible."
        },
        cocktail_ring: {
        name: "Cocktail Ring",
          rules: "Cocktail rings should sit prominently on the finger, with large gemstones facing outward. Shadows should reflect realistic finger contact, and the ring must appear proportionally balanced."
        },
        knuckle_ring: {
          name: "Knuckle Ring / Midi Ring",
          rules: "Knuckle rings should sit above the middle finger joint rather than at the base. They must fit snugly without appearing loose or sliding. Shadows should indicate realistic skin contact, and decorative elements must face outward."
        },
        toe_rings: {
          name: "Toe Rings (Bichiya)",
          rules: "Toe rings should sit snugly around the second toe, commonly worn in pairs. They must follow the toe’s curvature naturally with visible contact shadows. The design should remain proportional and not appear oversized or floating."
        },
        anklets: {
          name: "Anklets",
          rules: "Anklets should encircle the ankle comfortably, draping slightly with gravity. The surface should reflect light realistically, with shadows where it touches skin. Any dangling charms should hang naturally and remain fully visible."
        },
        payal_ghungroo: {
          name: "Payal with Ghungroo / ankle bells ",
          rules: "Payal with ghungroo should encircle the ankle comfortably with small bell charms evenly spaced. The ghungroo must hang naturally with gravity and remain individually visible. Subtle shadows should appear where the anklet touches the skin, and metallic reflections should look realistic."
        },
        maang_tikka: {
          name: "Maang Tikka",
          rules: "Maang tikka should rest at the center of the forehead with the chain following the hairline naturally. The pendant should sit flat on the skin without tilting. Shadows and subtle skin reflections must show realistic contact, and the chain should curve naturally over hair."
        },
        matha_patti: {
          name: "Matha Patti",
          rules: "Matha patti should feature a central forehead ornament with side chains extending across the hairline. The central motif must sit flat on the forehead while side chains rest naturally along the head’s contour. Contact shadows should appear where chains meet skin and hair."
        },
        passa: {
          name: "Passa / Jhoomar",
          rules: "Passa should be positioned on one side of the head, typically above the ear. It must drape vertically along the side hairline, with layered chains or motifs cascading naturally. Shadows should indicate realistic contact with hair and skin."
        },
        sheeshphool: {
          name: "Sheeshphool",
                rules: "Sheeshphool should cover the top of the head with decorative chains or motifs spreading symmetrically. It must align with the natural head contour, with contact shadows visible at hair and skin touchpoints. All elements should face outward and remain clearly defined."
        },
        juda_pin: {
          name: "Juda Pin",
          rules: "Juda pins should be inserted securely into a hair bun, following the circular shape of the bun. The base should remain hidden within the hair. Decorative elements must face outward, with realistic shadows and highlights on both ornament and hair."
        },
        damini: {
          name: "Damini",
          rules: "Damini should sit on the hairline or forehead naturally, with chains or decorative elements draping smoothly over the head. Contact points with skin and hair should cast subtle shadows. The central motif should be fully visible and symmetrical."
        },
        hair_brooch: {
          name: "Hair Brooch",
          rules: "Hair brooches should be inserted into hair naturally, following the flow of strands. The clip or base should be hidden, and decorative elements should face outward. Shadows and highlights on the ornament and hair should appear realistic under studio lighting."
        },
        nose_ring: {
          name: "Nose Ring",
          rules: "Nose rings should sit snugly on the nostril, following its curvature. The decorative portion should face outward and remain fully visible. Shadows and reflections must show realistic skin contact."
        },
        nose_pin: {
          name: "Nose Pin",
          rules: "Nose pins should sit flush against the nostril with the decorative tip facing outward. Shadows and reflections should highlight skin contact, and the pin should appear proportional to the nose."
        },
        nath: {
          name: "Nath",
          rules: "Nath should appear as a large bridal nose ring attached with a chain extending to the ear or hair. The ring must follow the nostril’s curvature naturally without floating. The chain should drape gently with gravity, showing subtle shadows at contact points."
        },
        septum_ring: {
          name: "Septum Ring",
          rules: "Septum rings should sit centrally between the nostrils, following the natural curve of the septum. The ring must appear properly inserted without gaps. Decorative elements should face forward, with realistic skin contact shadows."
        },
        armlet: {
          name: "Armlet",
          rules: "Armlets should wrap naturally around the upper arm, following the curve of the bicep. Subtle impressions and shadows should indicate contact with skin. The decorative motif should face outward, fully visible from a frontal or side view."
        },
        waist_band: {
          name: "Waist Band",
          rules: "Waist bands should rest naturally around the waist, conforming to body curves. Decorative elements should face outward and remain fully visible. Shadows should indicate skin contact, and any dangling parts should drape naturally."
        },
        kamarbandh_layers: {
          name: "Kamarbandh with Layers",
          rules: "Layered kamarbandh should wrap around the waist with multiple chains cascading horizontally or slightly curved. Each layer must remain distinct without tangling. Contact shadows should appear where it touches the waist, and dangling elements must hang naturally."
        },
        charm: {
          name: "Charm",
          rules: "Charms should hang naturally from bracelets, anklets, or necklaces. They should follow gravity, swinging slightly, with shadows indicating skin contact. All details of the charm must be visible."
        }
};

/**
 * Categorized ornament types - categories and items in alphabetical order.
 * Single source of truth for all ornament type options across the app.
 */
export const ORNAMENT_CATEGORIES = {
    "Anklets": [
        { id: "anklets", name: "Anklets" },
        { id: "payal_ghungroo", name: "Payal with Ghungroo / ankle bells" },
    ],
    "Arm Jewelry": [
        { id: "armlet", name: "Armlet" },
    ],
    "Bracelets & Bangles": [
        { id: "bangle", name: "Bangle" },
        { id: "bracelet", name: "Bracelet" },
        { id: "hand_chain", name: "Hand Chain" },
        { id: "kada", name: "Kada" },
        { id: "stacked_bangles_set", name: "Stacked Bangles Set" },
    ],
    "Charms": [
        { id: "charm", name: "Charm" },
    ],
    "Earrings": [
        { id: "chandbali", name: "Chandbali" },
        { id: "drop_earrings", name: "Drop Earrings" },
        { id: "ear_chain", name: "Ear Chain/ Kaan Chain" },
        { id: "ear_cuff", name: "Ear Cuff" },
        { id: "hoop_earrings", name: "Hoop / Hoop Earrings" },
        { id: "huggie_earrings", name: "Huggie Earrings" },
        { id: "jhumka_earrings", name: "Jhumka / Jhumki Earrings" },
        { id: "latkan_earrings", name: "Latkan Earrings" },
        { id: "stud_earrings", name: "Stud Earrings" },
    ],
    "Head Jewelry": [
        { id: "damini", name: "Damini" },
        { id: "hair_brooch", name: "Hair Brooch" },
        { id: "juda_pin", name: "Juda Pin" },
        { id: "maang_tikka", name: "Maang Tikka" },
        { id: "matha_patti", name: "Matha Patti" },
        { id: "passa", name: "Passa / Jhoomar" },
        { id: "sheeshphool", name: "Sheeshphool" },
    ],
    "Necklaces": [
        { id: "bib_necklace", name: "Bib Necklace" },
        { id: "black_beads_necklace", name: "Black Beads Necklace" },
        { id: "choker", name: "Choker" },
        { id: "collar_necklace", name: "Collar Necklace" },
        { id: "delicate_necklace", name: "Delicate Necklace" },
        { id: "hasli", name: "Hasli" },
        { id: "invisible_chain", name: "Invisible Chain" },
        { id: "layered_necklace", name: "Layered Necklace" },
        { id: "long_necklace", name: "Long Necklace" },
        { id: "mangalsutra", name: "Mangalsutra" },
        { id: "necklace_set", name: "Necklace Set" },
        { id: "pendant", name: "Pendant" },
        { id: "pendant_necklace", name: "Pendant Necklace" },
        { id: "pendant_necklace_set", name: "Pendant Necklace Set" },
        { id: "rani_haar", name: "Rani Haar" },
        { id: "short_necklace", name: "Short Necklace" },
        { id: "torque_necklace", name: "Torq / Torque Necklace" },
    ],
    "Nose Jewelry": [
        { id: "nath", name: "Nath" },
        { id: "nose_pin", name: "Nose Pin" },
        { id: "nose_ring", name: "Nose Ring" },
        { id: "septum_ring", name: "Septum Ring" },
    ],
    "Rings": [
        { id: "cocktail_ring", name: "Cocktail Ring" },
        { id: "delicate_ring", name: "Delicate Ring" },
        { id: "knuckle_ring", name: "Knuckle Ring / Midi Ring" },
        { id: "ring", name: "Ring" },
        { id: "toe_rings", name: "Toe Rings (Bichiya)" },
        { id: "traditional_ring", name: "Traditional Ring" },
    ],
    "Waist Jewelry": [
        { id: "kamarbandh_layers", name: "Kamarbandh with Layers" },
        { id: "waist_band", name: "Waist Band" },
    ],
};

/**
 * Flat list of all ornament types (id, name) - derived from ORNAMENT_CATEGORIES.
 * Order: categories alphabetically, items within each category alphabetically.
 */
export const ORNAMENT_TYPES = Object.values(ORNAMENT_CATEGORIES).flat();

/**
 * Get fitting rules for a specific ornament type
 * @param {string} ornamentType - The ornament type ID
 * @returns {string} The fitting rules for the ornament type
 */
export const getOrnamentFittingRules = (ornamentType) => {
    return ORNAMENT_FITTING_RULES[ornamentType]?.rules || "";
};

/**
 * Get ornament name for a specific ornament type
 * @param {string} ornamentType - The ornament type ID
 * @returns {string} The ornament name
 */
export const getOrnamentName = (ornamentType) => {
    return ORNAMENT_FITTING_RULES[ornamentType]?.name || ornamentType;
};

/**
 * Generate enhanced prompt with ornament fitting rules
 * @param {string} basePrompt - The base prompt from user input
 * @param {string} ornamentType - The selected ornament type
 * @param {Object} ornamentMeasurements - The ornament measurements
 * @returns {string} Enhanced prompt with fitting rules
 */
export const generateEnhancedPrompt = (basePrompt, ornamentType, ornamentMeasurements = {}) => {
    const fittingRules = getOrnamentFittingRules(ornamentType);
    const ornamentName = getOrnamentName(ornamentType);

    if (!fittingRules) {
        return basePrompt;
    }

    // Build measurements string if provided
    let measurementsText = "";
    if (ornamentMeasurements && Object.keys(ornamentMeasurements).length > 0) {
        const measurementEntries = Object.entries(ornamentMeasurements)
            .filter(([key, value]) => value && value.trim() !== "")
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");

        if (measurementEntries) {
            measurementsText = ` Measurements: ${measurementEntries}.`;
        }
    }

    // Combine base prompt with fitting rules
    const enhancedPrompt = `${basePrompt}${measurementsText} 

Ornament Fitting Rules for ${ornamentName}: ${fittingRules}`;

    return enhancedPrompt.trim();
};

/**
 * Generate enhanced prompt for multiple ornaments (campaign shots)
 * @param {string} basePrompt - The base prompt from user input
 * @param {Array<string>} ornamentTypes - Array of ornament type IDs
 * @param {Array<Object>} ornamentMeasurements - Array of ornament measurements
 * @returns {string} Enhanced prompt with fitting rules for all ornaments
 */
export const generateEnhancedCampaignPrompt = (basePrompt, ornamentTypes = [], ornamentMeasurements = []) => {
    if (!ornamentTypes || ornamentTypes.length === 0) {
        return basePrompt;
    }

    let enhancedPrompt = basePrompt;
    let fittingRulesText = "";

    for (const [index, ornamentType] of ornamentTypes.entries()) {
        const fittingRules = getOrnamentFittingRules(ornamentType);
        const ornamentName = getOrnamentName(ornamentType);

        if (fittingRules) {
            // Build measurements for this ornament
            let measurementsText = "";
            if (ornamentMeasurements[index] && Object.keys(ornamentMeasurements[index]).length > 0) {
                const measurementEntries = Object.entries(ornamentMeasurements[index])
                    .filter(([key, value]) => value && value.trim() !== "")
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ");

                if (measurementEntries) {
                    measurementsText = ` Measurements: ${measurementEntries}.`;
                }
            }

            fittingRulesText += `\n\n${ornamentName} Fitting Rules: ${fittingRules}${measurementsText}`;
        }
    }

    if (fittingRulesText) {
        enhancedPrompt += fittingRulesText;
    }

    return enhancedPrompt.trim();
};

export default {
    ORNAMENT_FITTING_RULES,
    ORNAMENT_CATEGORIES,
    ORNAMENT_TYPES,
    getOrnamentFittingRules,
    getOrnamentName,
    generateEnhancedPrompt,
    generateEnhancedCampaignPrompt
};
