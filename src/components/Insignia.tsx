/* eslint-disable @next/next/no-img-element */
import TokenSigil from "./TokenSigil";

/**
 * Mission insignia: the uploaded logo when one exists, otherwise the
 * generated agency seal.
 */
export default function Insignia({
  image,
  ticker,
  size = 40,
}: {
  image?: string | null;
  ticker: string;
  size?: number;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt={`${ticker} insignia`}
        width={size}
        height={size}
        className="shrink-0 rounded-[9px] border border-line object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return <TokenSigil ticker={ticker} hue={(ticker.charCodeAt(0) || 65) * 7} size={size} />;
}
