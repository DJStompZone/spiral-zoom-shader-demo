// Paste this source directly into a ShaderToy image pass.
export const shaderToySource = `#ifdef GL_ES
precision mediump float;
#endif

float hash12(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

float noise_3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    vec2 ii = i.xy + i.z * vec2(5.0);
    float a = hash12(ii);
    float b = hash12(ii + vec2(1.0, 0.0));
    float c = hash12(ii + vec2(0.0, 1.0));
    float d = hash12(ii + vec2(1.0, 1.0));
    float v1 = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    ii += vec2(5.0);
    a = hash12(ii);
    b = hash12(ii + vec2(1.0, 0.0));
    c = hash12(ii + vec2(0.0, 1.0));
    d = hash12(ii + vec2(1.0, 1.0));
    float v2 = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    return mix(v1, v2, u.z);
}

float fbm(vec3 x) {
    float r = 0.0;
    float w = 1.0;
    float s = 1.0;
    for (int i = 0; i < 4; i++) {
        w *= 0.25;
        s *= 3.0;
        r += w * noise_3(s * x);
    }
    return r;
}

float shader2Mask(vec2 fragCoord, vec2 res, float t) {
    vec2 p = vec2(0.0);
    float i = 0.0;
    float g = 0.0;
    float d = 2.0;
    for (float j = 0.0; j < 128.0; j++) {
        i += 1.0;
        if (d <= 0.001) break;
        p = (fragCoord - 0.5 * res) / res.y * g
          + vec2(0.3) * mat2(cos(g * 2.0), -sin(g * 2.0),
                             sin(g * 2.0),  cos(g * 2.0));
        g += d = -(length(p) - 2.0 + g / 9.0) / 2.0;
    }
    p = vec2(atan(p.x, p.y), g) * 8.28 + t * 2.0;
    p = abs(fract(p + vec2(0.0, 0.5 * ceil(p.x))) - 0.5);
    float m = 30.0 / i - 0.5 / step(0.9,
        1.0 - abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0));
    return clamp(m, 0.0, 1.0);
}

// Give each Voronoi cell a distinct color from a fixed palette.
vec3 palette(float index) {
    if (index < 1.0) return vec3(1.00, 0.31, 0.43); // coral
    if (index < 2.0) return vec3(1.00, 0.64, 0.25); // amber
    if (index < 3.0) return vec3(0.91, 0.88, 0.35); // citron
    if (index < 4.0) return vec3(0.26, 0.87, 0.68); // mint
    if (index < 5.0) return vec3(0.30, 0.68, 1.00); // blue
    return vec3(0.72, 0.43, 1.00);                  // violet
}

vec3 voronoiHex(vec2 uv, float t) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float minDist = 1.0;
    vec2 nearest = vec2(0.0);
    vec2 nearestCell = g;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 cell = g + offset;
            vec2 rand = vec2(hash12(cell), hash12(cell + 1.23));
            vec2 r = offset + rand - f;
            float dist = dot(r, r);
            if (dist < minDist) {
                minDist = dist;
                nearest = rand;
                nearestCell = cell;
            }
        }
    }
    float edge = sqrt(minDist);
    float pulse = 0.9 + 0.05 * sin(t + nearest.x * 6.2831);
    float colorIndex = floor(hash12(nearestCell + vec2(19.17, 7.31)) * 6.0);
    return palette(colorIndex) * (0.25 + 0.95 * edge) * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 centered = uv * 2.0 - 1.0;
    centered.x *= iResolution.x / iResolution.y;
    float mask = shader2Mask(fragCoord, iResolution.xy, iTime);
    vec2 hexUV = mat2(1.0, 0.0, 0.5, sqrt(3.0) * 0.5)
               * centered * 10.0;
    vec3 baseColor = voronoiHex(hexUV, iTime);
    float turbulence = fbm(vec3(centered * 3.0, iTime * 0.2));
    baseColor *= 0.8 + 0.5 * turbulence;
    fragColor = vec4(baseColor * mask, 1.0);
}`;