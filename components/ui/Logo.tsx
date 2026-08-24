interface Props {
  className?: string;
}

// Plain <img>, not next/image — it's a small pre-optimized vector asset,
// so there's nothing for the raster image pipeline to do here.
export function Logo({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/RUCKUS.svg" alt="Ruckus" className={className} />
  );
}
