import NextImage, { type ImageProps } from "next/image";

function isSvgSrc(src: ImageProps["src"]): boolean {
  return typeof src === "string" && src.toLowerCase().endsWith(".svg");
}

/**
 * Drop-in replacement for next/image's <Image>. The Next.js image optimizer
 * rejects SVGs unless `images.dangerouslyAllowSVG` is enabled, which we keep
 * off (SVGs can carry scripts). Demo catalog assets are SVG placeholders, so
 * this renders those unoptimized (a plain <img>) while still optimizing
 * raster uploads normally.
 */
export function Image(props: ImageProps) {
  return <NextImage {...props} unoptimized={isSvgSrc(props.src)} />;
}
