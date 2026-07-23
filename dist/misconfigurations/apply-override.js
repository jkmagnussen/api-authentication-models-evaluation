"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyOverride = applyOverride;
const variant_overrides_1 = require("../src/variant-overrides");
function applyOverride(variantOverrides) {
    (0, variant_overrides_1.setVariantOverrides)(variantOverrides);
}
