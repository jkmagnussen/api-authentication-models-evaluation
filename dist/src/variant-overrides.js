"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVariantOverrides = setVariantOverrides;
exports.getVariantOverrides = getVariantOverrides;
exports.resetVariantOverrides = resetVariantOverrides;
const DEFAULT_VARIANT_OVERRIDES = {};
let activeVariantOverrides = { ...DEFAULT_VARIANT_OVERRIDES };
function setVariantOverrides(variantOverrides) {
    activeVariantOverrides = {
        ...activeVariantOverrides,
        ...variantOverrides,
        oauth: {
            ...activeVariantOverrides.oauth,
            ...variantOverrides.oauth,
        },
        jwt: {
            ...activeVariantOverrides.jwt,
            ...variantOverrides.jwt,
        },
        sessions: {
            ...activeVariantOverrides.sessions,
            ...variantOverrides.sessions,
            cookie: {
                ...activeVariantOverrides.sessions?.cookie,
                ...variantOverrides.sessions?.cookie,
            },
        },
    };
}
function getVariantOverrides() {
    return activeVariantOverrides;
}
function resetVariantOverrides() {
    activeVariantOverrides = { ...DEFAULT_VARIANT_OVERRIDES };
}
